import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctor_id')
    const departmentId = searchParams.get('department_id')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    console.log('Fetching assigned patients for:', { doctorId, departmentId, date })

    // First, get all visits for today
    let visitsQuery = supabase
      .from('visits')
      .select(`
        id,
        visit_number,
        patient_id,
        department_id,
        assigned_doctor_id,
        visit_type,
        chief_complaint,
        symptoms,
        visit_status,
        priority,
        visit_date,
        checkin_time
      `)
      .eq('visit_date', date)
      .order('checkin_time', { ascending: true })

    // Filter by doctor if specified
    if (doctorId) {
      visitsQuery = visitsQuery.eq('assigned_doctor_id', doctorId)
    }

    // Filter by department if specified  
    if (departmentId) {
      visitsQuery = visitsQuery.eq('department_id', departmentId)
    }

    const { data: visits, error: visitsError } = await visitsQuery

    if (visitsError) {
      console.error('Error fetching visits:', visitsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch visits',
        details: visitsError.message
      }, { status: 500 })
    }

    console.log('Found visits:', visits?.length || 0)

    if (!visits || visits.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          allPatients: [],
          byDepartment: {},
          byDoctor: {},
          stats: {
            totalPatients: 0,
            waitingPatients: 0,
            inConsultationPatients: 0,
            completedPatients: 0,
            departmentCount: 0,
            doctorCount: 0
          }
        }
      })
    }

    // Get patient details
    const patientIds = [...new Set(visits.map(v => v.patient_id))]
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, patient_number, first_name, last_name, age, gender, phone, cnic')
      .in('id', patientIds)

    if (patientsError) {
      console.error('Error fetching patients:', patientsError)
    }

    // Get department details
    const departmentIds = [...new Set(visits.map(v => v.department_id))]
    const { data: departments, error: departmentsError } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', departmentIds)

    if (departmentsError) {
      console.error('Error fetching departments:', departmentsError)
    }

    // Get doctor details
    const doctorIds = [...new Set(visits.map(v => v.assigned_doctor_id).filter(Boolean))]
    const { data: doctors, error: doctorsError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role')
      .in('id', doctorIds)

    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError)
    }

    // Get token details
    const visitIds = visits.map(v => v.id)
    const { data: tokens, error: tokensError } = await supabase
      .from('tokens')
      .select('id, visit_id, token_number, token_status, issue_date')
      .in('visit_id', visitIds)

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
    }

    // Transform data for easy consumption
    const assignedPatients = visits.map(visit => {
      const patient = patients?.find(p => p.id === visit.patient_id)
      const department = departments?.find(d => d.id === visit.department_id)
      const doctor = doctors?.find(d => d.id === visit.assigned_doctor_id)
      const token = tokens?.find(t => t.visit_id === visit.id)

      return {
        visitId: visit.id,
        visitNumber: visit.visit_number,
        patientId: visit.patient_id,
        patientNumber: patient?.patient_number || 'Unknown',
        patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient',
        age: patient?.age || 0,
        gender: patient?.gender || 'Unknown',
        phone: patient?.phone,
        cnic: patient?.cnic,
        department: department?.name || 'Unknown Department',
        departmentId: visit.department_id,
        assignedDoctor: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unassigned',
        assignedDoctorId: visit.assigned_doctor_id,
        chiefComplaint: visit.chief_complaint,
        symptoms: visit.symptoms,
        visitStatus: visit.visit_status || 'waiting',
        priority: visit.priority || 'normal',
        visitType: visit.visit_type,
        checkinTime: visit.checkin_time,
        tokenNumber: token?.token_number,
        tokenStatus: token?.token_status,
        queuePosition: token?.token_number
      }
    })

    // Group by department for dashboard view
    const byDepartment = assignedPatients.reduce((acc, patient) => {
      const dept = patient.department || 'Unknown'
      if (!acc[dept]) {
        acc[dept] = []
      }
      acc[dept].push(patient)
      return acc
    }, {} as Record<string, typeof assignedPatients>)

    // Group by doctor for doctor dashboard
    const byDoctor = assignedPatients.reduce((acc, patient) => {
      const doctor = patient.assignedDoctor || 'Unassigned'
      if (!acc[doctor]) {
        acc[doctor] = []
      }
      acc[doctor].push(patient)
      return acc
    }, {} as Record<string, typeof assignedPatients>)

    console.log('Processed assigned patients:', {
      total: assignedPatients.length,
      departments: Object.keys(byDepartment).length,
      doctors: Object.keys(byDoctor).length
    })

    return NextResponse.json({
      success: true,
      data: {
        allPatients: assignedPatients,
        byDepartment,
        byDoctor,
        stats: {
          totalPatients: assignedPatients.length,
          waitingPatients: assignedPatients.filter(p => p.visitStatus === 'waiting').length,
          inConsultationPatients: assignedPatients.filter(p => p.visitStatus === 'in_consultation').length,
          completedPatients: assignedPatients.filter(p => p.visitStatus === 'completed').length,
          departmentCount: Object.keys(byDepartment).length,
          doctorCount: Object.keys(byDoctor).length
        }
      }
    })

  } catch (error) {
    console.error('Error in assigned patients API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}