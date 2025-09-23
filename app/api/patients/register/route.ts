import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate unique patient number
const generatePatientNumber = async () => {
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  
  // Get count of patients registered today
  const { count } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
  
  const dailySequence = ((count || 0) + 1).toString().padStart(3, '0')
  const patientNumber = `P${year}${month}${dailySequence}`
  console.log('Generated patient number:', patientNumber, 'for count:', count)
  return patientNumber
}

// Generate unique visit number  
const generateVisitNumber = async () => {
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  
  // Get count of visits today
  const { count } = await supabase
    .from('visits')  // Fixed: use correct table name from schema
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
  
  const dailySequence = ((count || 0) + 1).toString().padStart(3, '0')
  return `V${year}${month}${day}${dailySequence}`
}

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string) => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Get next token number for department with real-time collision avoidance
const getNextTokenNumber = async (departmentId: string) => {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('Getting next token number for department:', departmentId, 'date:', today)
  
  // Query using the actual field names that exist in the database
  const { data, error } = await supabase
    .from('tokens')
    .select('token_number')
    .eq('department_id', departmentId)
    .eq('issue_date', today)
    .order('token_number', { ascending: false })
    .limit(1)
  
  if (error) {
    console.error('Error getting token number:', error)
    return 1
  }
  
  console.log('Found existing tokens for today in department', departmentId, ':', data)
  const nextToken = data.length > 0 ? data[0].token_number + 1 : 1
  console.log('Next token number will be:', nextToken)
  
  return nextToken
}

// Simple doctor assignment algorithm (round-robin by workload)
const assignDoctor = async (departmentId: string) => {
  try {
    // Get all active doctors in the department
    const { data: doctors, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('department_id', departmentId)
      .eq('role', 'doctor')
      .eq('is_active', true)
    
    if (error || !doctors || doctors.length === 0) {
      console.log('No doctors found for department:', departmentId)
      return null
    }
    
    // Get today's visit counts for each doctor
    const today = new Date().toISOString().split('T')[0]
    const doctorWorkloads = await Promise.all(
      doctors.map(async (doctor) => {
        const { count } = await supabase
          .from('visits')  // Revert: use visits table
          .select('*', { count: 'exact', head: true })
          .eq('assigned_doctor_id', doctor.id)  // Revert: use assigned_doctor_id
          .eq('visit_date', today)
        
        return { doctorId: doctor.id, workload: count || 0 }
      })
    )
    
    // Assign to doctor with least workload
    const assignedDoctor = doctorWorkloads.reduce((min, current) => 
      current.workload < min.workload ? current : min
    )
    
    return assignedDoctor.doctorId
  } catch (error) {
    console.error('Error assigning doctor:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Registration request body:', body)
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'department_id', 'chief_complaint']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ 
          success: false, 
          error: `${field} is required` 
        }, { status: 400 })
      }
    }
    
    // Check if patient already exists by phone/CNIC
    let patientId: string
    let patient: any
    
    // For testing: if force_new_patient is true, skip existing patient check
    const forceNewPatient = body.force_new_patient === true
    
    if ((body.phone || body.cnic) && !forceNewPatient) {
      console.log('🔍 Checking for existing patient with phone:', body.phone, 'CNIC:', body.cnic)
      
      // Normalize phone number for comparison
      const normalizedPhone = body.phone?.replace(/\D/g, '') // Remove non-digits
      const phoneVariants = []
      if (normalizedPhone) {
        phoneVariants.push(normalizedPhone)
        if (normalizedPhone.startsWith('92')) {
          phoneVariants.push('0' + normalizedPhone.slice(2)) // Convert +92 to 0
        } else if (normalizedPhone.startsWith('0')) {
          phoneVariants.push('92' + normalizedPhone.slice(1)) // Convert 0 to +92
        }
      }
      
      // Normalize CNIC
      const normalizedCnic = body.cnic?.replace(/[-\s]/g, '').toUpperCase()
      
      console.log('🔍 Searching with phone variants:', phoneVariants, 'CNIC:', normalizedCnic)
      
      let existingPatientQuery = supabase.from('patients').select('*')
      
      // Build OR conditions for phone variants and CNIC
      const orConditions = []
      phoneVariants.forEach(phone => {
        orConditions.push(`phone.eq.${phone}`)
      })
      if (normalizedCnic) {
        orConditions.push(`cnic.eq.${normalizedCnic}`)
      }
      
      if (orConditions.length > 0) {
        existingPatientQuery = existingPatientQuery.or(orConditions.join(','))
      }
      
      const { data: existingPatient, error: searchError } = await existingPatientQuery.limit(1)
      
      if (searchError) {
        console.error('❌ Error searching for existing patient:', searchError)
      }
      
      console.log('🔍 Found existing patients:', existingPatient)
      
      if (existingPatient && existingPatient.length > 0) {
        // Patient exists - this is a repeat visit
        patient = existingPatient[0]
        patientId = patient.id
        console.log('✅ Existing patient found for repeat visit:', patient.id, patient.first_name, patient.last_name)
        console.log('📋 Patient details:', {
          id: patient.id,
          phone: patient.phone,
          cnic: patient.cnic,
          name: `${patient.first_name} ${patient.last_name}`
        })
        
        // Optionally update patient info if provided
        if (body.address || body.email || body.emergency_contact) {
          const updateData: any = {}
          if (body.address) updateData.address = body.address
          if (body.email) updateData.email = body.email
          if (body.emergency_contact) updateData.emergency_contact = body.emergency_contact
          if (body.city) updateData.city = body.city
          
          if (Object.keys(updateData).length > 0) {
            const { data: updatedPatient } = await supabase
              .from('patients')
              .update(updateData)
              .eq('id', patient.id)
              .select()
              .single()
            
            if (updatedPatient) {
              patient = updatedPatient
            }
          }
        }
      } else {
        // New patient - create patient record
        console.log('No existing patient found, creating new patient')
        const patientNumber = await generatePatientNumber()
        const age = calculateAge(body.date_of_birth)
        
        const patientData = {
          patient_number: patientNumber,
          first_name: body.first_name,
          last_name: body.last_name,
          father_name: body.father_name || null,
          date_of_birth: body.date_of_birth,
          age: age,
          gender: body.gender,
          cnic: body.cnic || null,
          phone: body.phone || null,
          email: body.email || null,
          address: body.address || null,
          city: body.city || null,
          emergency_contact: body.emergency_contact || null,
          blood_group: body.blood_group || null,
          allergies: body.allergies || null,
          medical_history: body.medical_history || null,
          marital_status: body.marital_status || null,
          occupation: body.occupation || null,
          is_active: true
        }
        
        console.log('Creating new patient with data:', patientData)
        
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert(patientData)
          .select()
          .single()
        
        if (patientError) {
          console.error('Error creating patient:', patientError)
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to create patient record',
            details: patientError.message
          }, { status: 500 })
        }
        
        patient = newPatient
        patientId = patient.id
        console.log('New patient created successfully:', patient.id)
      }
    } else {
      // No phone/CNIC provided OR force_new_patient is true - create new patient
      console.log('Creating new patient - no phone/CNIC match or forced new patient')
      const patientNumber = await generatePatientNumber()
      const age = calculateAge(body.date_of_birth)
      
      const patientData = {
        patient_number: patientNumber,
        first_name: body.first_name,
        last_name: body.last_name,
        father_name: body.father_name || null,
        date_of_birth: body.date_of_birth,
        age: age,
        gender: body.gender,
        cnic: body.cnic || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        city: body.city || null,
        emergency_contact: body.emergency_contact || null,
        blood_group: body.blood_group || null,
        allergies: body.allergies || null,
        medical_history: body.medical_history || null,
        marital_status: body.marital_status || null,
        occupation: body.occupation || null,
        is_active: true
      }
      
      console.log('Creating new patient (no phone/CNIC match):', patientData)
      
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single()
      
      if (patientError) {
        console.error('Error creating patient:', patientError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create patient record',
          details: patientError.message
        }, { status: 500 })
      }
      
      patient = newPatient
      patientId = patient.id
      console.log('New patient created successfully:', patient.id)
    }
    
    // Generate visit number and assign doctor
    const visitNumber = await generateVisitNumber()
    const assignedDoctorId = await assignDoctor(body.department_id)
    
    // Create visit record (always create new visit regardless of existing patient)
    const visitData = {
      visit_number: visitNumber,  // Add visit_number from schema
      patient_id: patientId,
      department_id: body.department_id,
      assigned_doctor_id: assignedDoctorId,
      visit_type: body.visit_type || 'opd',
      chief_complaint: body.chief_complaint,
      symptoms: body.symptoms || null,
      visit_status: 'waiting',
      priority: body.priority || 'normal',  // Add priority from schema
      visit_date: new Date().toISOString().split('T')[0],
      checkin_time: new Date().toISOString()
    }
    
    console.log('Creating visit with data:', visitData)
    
    const { data: visit, error: visitError } = await supabase
      .from('visits')  // Revert: use visits table (the actual table in use)
      .insert(visitData)
      .select()
      .single()
    
    if (visitError) {
      console.error('Error creating visit:', visitError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create visit record',
        details: visitError.message
      }, { status: 500 })
    }
    
    console.log('Visit created successfully:', visit.id)
    
    // Generate token number and create token
    const tokenNumber = await getNextTokenNumber(body.department_id)
    const today = new Date().toISOString().split('T')[0]
    
    const tokenData = {
      token_number: tokenNumber,
      visit_id: visit.id,
      department_id: body.department_id,
      assigned_doctor_id: assignedDoctorId,
      patient_id: patientId,
      token_status: 'waiting',
      issue_time: new Date().toISOString(),
      issue_date: today
    }
    
    console.log('Creating token with data:', tokenData)
    
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .insert(tokenData)
      .select()
      .single()
    
    if (tokenError) {
      console.error('Error creating token:', tokenError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create token',
        details: tokenError.message
      }, { status: 500 })
    }
    
    console.log('Token created successfully:', token.id)
    
    // Get department name for response
    const { data: department } = await supabase
      .from('departments')
      .select('name')
      .eq('id', body.department_id)
      .single()
    
    return NextResponse.json({
      success: true,
      message: 'Patient registered successfully',
      patient: {
        id: patient.id,
        patient_number: patient.patient_number,
        name: `${patient.first_name} ${patient.last_name}`,
        age: patient.age
      },
      visit: {
        id: visit.id,
        visit_number: visit.visit_number,  // Add visit_number from schema
        visit_date: visit.visit_date,
        department: department?.name || 'Unknown'
      },
      token_number: token.token_number,
      assigned_doctor_id: assignedDoctorId,
      estimated_wait_time: tokenNumber * 15 // Rough estimate: 15 minutes per patient
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}