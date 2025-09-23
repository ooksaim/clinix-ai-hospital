import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  console.log('🚀 HISTORY API CALLED - Entry point')
  console.log('🚀 Request URL:', request.url)
  
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    
    console.log('🔍 Medical History API called with patient_id:', patientId)
    console.log('🔍 All search params:', Object.fromEntries(searchParams.entries()))
    
    if (!patientId) {
      console.log('❌ No patient_id provided')
      return NextResponse.json({ 
        success: false, 
        error: 'Patient ID is required' 
      }, { status: 400 })
    }

    console.log('🏥 Fetching comprehensive medical history for patient:', patientId)
    
    // Get patient basic info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        id,
        patient_number,
        first_name,
        last_name,
        father_name,
        date_of_birth,
        age,
        gender,
        cnic,
        phone,
        emergency_contact,
        address,
        city,
        blood_group,
        marital_status,
        occupation,
        insurance_provider,
        insurance_number,
        allergies,
        medical_history,
        email,
        created_at
      `)
      .eq('id', patientId)
      .single()
    
    if (patientError || !patient) {
      console.error('❌ Patient not found:', patientError)
      return NextResponse.json({ 
        success: false, 
        error: 'Patient not found' 
      }, { status: 404 })
    }

    console.log('✅ Patient found:', {
      id: patient.id,
      name: `${patient.first_name} ${patient.last_name}`,
      phone: patient.phone,
      patient_number: patient.patient_number
    })

    // Get all visits for this patient with comprehensive details
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select(`
        id,
        visit_number,
        visit_date,
        visit_type,
        chief_complaint,
        symptoms,
        examination_notes,
        diagnosis,
        treatment_plan,
        follow_up_instructions,
        visit_status,
        priority,
        appointment_time,
        checkin_time,
        consultation_start_time,
        consultation_end_time,
        assigned_doctor_id,
        department_id,
        consultation_fee,
        created_at
      `)
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })
      .order('checkin_time', { ascending: false })

    if (visitsError) {
      console.error('Error fetching visits:', visitsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch patient visits' 
      }, { status: 500 })
    }

    // Get doctor and department information
    const doctorIds = [...new Set(visits?.map(v => v.assigned_doctor_id).filter(Boolean) || [])]
    const departmentIds = [...new Set(visits?.map(v => v.department_id).filter(Boolean) || [])]
    
    const [doctorsResult, departmentsResult] = await Promise.all([
      supabase.from('user_profiles').select('id, first_name, last_name').in('id', doctorIds),
      supabase.from('departments').select('id, name, code').in('id', departmentIds)
    ])

    const doctors = doctorsResult.data || []
    const departments = departmentsResult.data || []

    // Get vital signs for all visits
    const visitIds = visits?.map(v => v.id) || []
    const { data: vitals } = await supabase
      .from('patient_vitals')
      .select(`
        id,
        visit_id,
        systolic_bp,
        diastolic_bp,
        heart_rate,
        temperature,
        respiratory_rate,
        oxygen_saturation,
        weight,
        height,
        bmi,
        blood_glucose,
        pain_scale,
        notes,
        recorded_at,
        recorded_by
      `)
      .in('visit_id', visitIds)
      .order('recorded_at', { ascending: false })

    // Get medication orders for all visits
    const { data: medications } = await supabase
      .from('medication_orders')
      .select(`
        id,
        visit_id,
        order_number,
        dosage,
        frequency,
        route,
        duration_days,
        instructions,
        indication,
        order_status,
        start_date,
        end_date,
        created_at,
        medication_id
      `)
      .in('visit_id', visitIds)
      .order('created_at', { ascending: false })

    // Get medication details
    const medicationIds = [...new Set(medications?.map(m => m.medication_id).filter(Boolean) || [])]
    const { data: medicationDetails } = await supabase
      .from('medications')
      .select('id, name, generic_name, dosage_form, strength')
      .in('id', medicationIds)

    // Get lab orders if any
    const { data: labOrders } = await supabase
      .from('lab_orders')
      .select(`
        id,
        visit_id,
        order_number,
        order_status,
        priority,
        clinical_info,
        created_at
      `)
      .in('visit_id', visitIds)
    // Transform and organize the data
    const medicalHistory = visits?.map(visit => {
      const doctor = doctors?.find(d => d.id === visit.assigned_doctor_id)
      const department = departments?.find(d => d.id === visit.department_id)
      const visitVitals = vitals?.filter(v => v.visit_id === visit.id) || []
      const visitMedications = medications?.filter(m => m.visit_id === visit.id) || []
      const visitLabOrders = labOrders?.filter(l => l.visit_id === visit.id) || []

      return {
        ...visit,
        doctor: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor',
        department: department?.name || 'Unknown Department',
        vitals: visitVitals,
        medications: visitMedications.map(med => {
          const medDetails = medicationDetails?.find(md => md.id === med.medication_id)
          return {
            ...med,
            medication_name: medDetails?.name || 'Unknown Medication',
            medication_details: medDetails
          }
        }),
        labOrders: visitLabOrders
      }
    }) || []

    // Calculate summary statistics
    const totalVisits = medicalHistory.length
    const recentVisits = medicalHistory.slice(0, 5)
    
    // Find common diagnoses
    const diagnosisFrequency = medicalHistory
      .filter(h => h.diagnosis)
      .reduce((acc: Record<string, number>, visit) => {
        const diagnosis = visit.diagnosis.toLowerCase().trim()
        acc[diagnosis] = (acc[diagnosis] || 0) + 1
        return acc
      }, {})

    const commonDiagnoses = Object.entries(diagnosisFrequency)
      .filter(([_, count]) => count > 1)
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count)

    // Find currently active medications
    const currentMedications = medications?.filter(m => 
      m.order_status === 'active' && 
      (!m.end_date || new Date(m.end_date) >= new Date())
    ).map(med => {
      const medDetails = medicationDetails?.find(md => md.id === med.medication_id)
      return {
        ...med,
        medication_name: medDetails?.name || 'Unknown Medication',
        medication_details: medDetails
      }
    }) || []

    // Get latest vital signs
    const latestVitals = vitals?.[0] || null

    // Create summary
    const summary = {
      totalVisits,
      lastVisitDate: medicalHistory[0]?.visit_date || null,
      chronicConditions: commonDiagnoses.map(d => d.diagnosis),
      activeMedicationsCount: currentMedications.length,
      lastDoctor: medicalHistory[0]?.doctor || null,
      lastDepartment: medicalHistory[0]?.department || null
    }

    console.log('✅ Medical history compiled successfully:', {
      totalVisits,
      vitalsRecords: vitals?.length || 0,
      medicationOrders: medications?.length || 0,
      activeMedications: currentMedications.length
    })

    return NextResponse.json({
      success: true,
      data: {
        patient,
        visits: medicalHistory, // Add this for backwards compatibility
        medicalHistory,
        recentVisits,
        totalVisits,
        commonDiagnoses,
        currentMedications,
        latestVitals,
        summary
      }
    })

  } catch (error) {
    console.error('💥 Error fetching medical history:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}