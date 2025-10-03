import { NextRequest, NextResponse } from 'next/server'
import { startApiSpan, attachDiagHeaders } from '@/lib/observability'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Force dynamic rendering - ensure no caching issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const span = startApiSpan('patients.assigned')
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctor_id')
    const departmentId = searchParams.get('department_id')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Removed debug logs for production

    // First, get ALL visits for today (we'll filter later for different purposes)
    let allVisitsQuery = supabase
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
        checkin_time,
        requires_admission
      `)
      .eq('visit_date', date)
      .order('checkin_time', { ascending: true })

    // Get visits for the specified date

    // Filter by doctor if specified
    if (doctorId) {
      allVisitsQuery = allVisitsQuery.eq('assigned_doctor_id', doctorId)
      // Filter by doctor ID
    }

    // Filter by department if specified  
    if (departmentId) {
      allVisitsQuery = allVisitsQuery.eq('department_id', departmentId)
      // Filter by department ID
    }

    const { data: allVisits, error: visitsError } = await allVisitsQuery

    if (visitsError) {
      console.error('Error fetching visits:', visitsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch visits',
        details: visitsError.message
      }, { status: 500 })
    }

    console.log('Found ALL visits:', allVisits?.length || 0)
    console.log('Visit statuses found:', allVisits?.map(v => v.visit_status))
    console.log('Doctor filter applied:', doctorId ? 'Yes' : 'No')
    console.log('Department filter applied:', departmentId ? 'Yes' : 'No')
    
    // CRITICAL DEBUG: Log all doctor IDs in the results to debug the mismatch
    console.log('Doctor IDs in visits:', [...new Set(allVisits?.map(v => v.assigned_doctor_id))])
    console.log('Requested doctor ID:', doctorId)
    
    // CRITICAL DEBUG: Check if any visits match the requested doctor
    const doctorVisits = allVisits?.filter(v => v.assigned_doctor_id === doctorId) || []
    console.log('Visits matching requested doctor:', doctorVisits.length)
    console.log('Matching visit details:', doctorVisits.map(v => ({ 
      id: v.id, 
      status: v.visit_status, 
      doctorId: v.assigned_doctor_id 
    })))

    // Now separate completed vs non-completed visits
    // Include "admission_requested" as active status
    const activeVisits = allVisits?.filter(visit => 
      visit.visit_status !== 'completed' && 
      visit.visit_status !== 'discharged'
    ) || []
    const completedVisits = allVisits?.filter(visit => 
      visit.visit_status === 'completed' || 
      visit.visit_status === 'discharged'
    ) || []
    
    console.log('Active visits (non-completed):', activeVisits.length)
    console.log('Completed visits:', completedVisits.length)
    console.log('Active visit statuses:', activeVisits.map(v => v.visit_status))
    console.log('Completed visit statuses:', completedVisits.map(v => v.visit_status))

    if (!allVisits || allVisits.length === 0) {
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

    // Get patient details for ALL visits (including completed ones)
    const patientIds = [...new Set(allVisits.map(v => v.patient_id))]
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, patient_number, first_name, last_name, age, gender, phone, cnic')
      .in('id', patientIds)

    if (patientsError) {
      console.error('Error fetching patients:', patientsError)
    }

    // Get department details
    const departmentIds = [...new Set(allVisits.map(v => v.department_id))]
    const { data: departments, error: departmentsError } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', departmentIds)

    if (departmentsError) {
      console.error('Error fetching departments:', departmentsError)
    }

    // Get doctor details
    const doctorIds = [...new Set(allVisits.map(v => v.assigned_doctor_id).filter(Boolean))]
    const { data: doctors, error: doctorsError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role')
      .in('id', doctorIds)

    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError)
    }

    // Get token details
    const visitIds = allVisits.map(v => v.id)
    const { data: tokens, error: tokensError } = await supabase
      .from('tokens')
      .select('id, visit_id, token_number, token_status, issue_date')
      .in('visit_id', visitIds)

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
    }

    // Get admission details for visits with admission_requested status
    const admissionRequestedVisits = allVisits?.filter(v => v.visit_status === 'admission_requested') || []
    let admissions: any[] = []
    if (admissionRequestedVisits.length > 0) {
      const { data: admissionData, error: admissionsError } = await supabase
        .from('admissions')
        .select(`
          id,
          admission_number,
          visit_id,
          admission_status,
          admission_reason,
          ward_id,
          bed_id,
          requested_by,
          approved_by,
          admission_date,
          admission_time,
          created_at,
          updated_at,
          wards (
            id,
            name,
            ward_type
          )
        `)
        .in('visit_id', admissionRequestedVisits.map(v => v.id))

      if (admissionsError) {
        console.error('Error fetching admissions:', admissionsError)
      } else {
        admissions = admissionData || []
      }
    }

    // Transform data for easy consumption
    // For the main patient list, only show ACTIVE (non-completed) visits
    const assignedPatients = activeVisits.map(visit => {
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
        queuePosition: token?.token_number,
        requiresAdmission: visit.requires_admission || false
      }
    })

    // For stats, use ALL visits to get accurate counts
    const allPatientsData = allVisits.map(visit => {
      const patient = patients?.find(p => p.id === visit.patient_id)
      const department = departments?.find(d => d.id === visit.department_id)
      const doctor = doctors?.find(d => d.id === visit.assigned_doctor_id)
      const token = tokens?.find(t => t.visit_id === visit.id)
      const admission = admissions?.find(a => a.visit_id === visit.id)

      // Enhanced status display for receptionist
      let displayStatus = visit.visit_status || 'waiting'
      let admissionInfo = null

      if (visit.visit_status === 'admission_requested' && admission) {
        displayStatus = 'admission_requested'
        admissionInfo = {
          id: admission.id,
          admissionNumber: admission.admission_number,
          admissionStatus: admission.admission_status,
          admissionReason: admission.admission_reason,
          requestedBy: admission.requested_by,
          approvedBy: admission.approved_by,
          wardId: admission.ward_id,
          wardName: admission.wards?.name || 'Unknown Ward',
          wardType: admission.wards?.ward_type || 'general',
          bedId: admission.bed_id,
          admissionDate: admission.admission_date,
          admissionTime: admission.admission_time,
          createdAt: admission.created_at,
          updatedAt: admission.updated_at
        }
      }

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
        visitStatus: displayStatus,
        originalVisitStatus: visit.visit_status,
        priority: visit.priority || 'normal',
        visitType: visit.visit_type,
        checkinTime: visit.checkin_time,
        tokenNumber: token?.token_number,
        tokenStatus: token?.token_status,
        queuePosition: token?.token_number,
        requiresAdmission: visit.requires_admission || false,
        // Admission workflow info for receptionist
        admissionInfo: admissionInfo
      }
    })

    // Group by department for dashboard view (using ALL patients)
    const byDepartment = allPatientsData.reduce((acc, patient) => {
      const dept = patient.department || 'Unknown'
      if (!acc[dept]) {
        acc[dept] = []
      }
      acc[dept].push(patient)
      return acc
    }, {} as Record<string, typeof allPatientsData>)

    // Group by doctor for doctor dashboard (using ALL patients)
    const byDoctor = allPatientsData.reduce((acc, patient) => {
      const doctor = patient.assignedDoctor || 'Unassigned'
      if (!acc[doctor]) {
        acc[doctor] = []
      }
      acc[doctor].push(patient)
      return acc
    }, {} as Record<string, typeof allPatientsData>)

    console.log('Processed assigned patients:', {
      activePatients: assignedPatients.length,
      totalPatientsToday: allPatientsData.length,
      departments: Object.keys(byDepartment).length,
      doctors: Object.keys(byDoctor).length
    })

    const res = NextResponse.json({
      success: true,
      data: {
        allPatients: allPatientsData, // Return ALL patients (including completed) for full dashboard view
        activePatients: assignedPatients, // Separate field for only active patients (for doctor's waiting queue)
        byDepartment,
        byDoctor,
        stats: {
          totalPatients: allPatientsData.length,
          waitingPatients: allPatientsData.filter(p => p.visitStatus === 'waiting').length,
          inConsultationPatients: allPatientsData.filter(p => p.visitStatus === 'in_consultation').length,
          admissionRequestedPatients: allPatientsData.filter(p => p.visitStatus === 'admission_requested').length,
          completedPatients: allPatientsData.filter(p => p.visitStatus === 'completed' || p.visitStatus === 'discharged').length,
          departmentCount: Object.keys(byDepartment).length,
          doctorCount: Object.keys(byDoctor).length
        }
      }
    })
    span.end(res)
    const wrapped = attachDiagHeaders(res, span)
    return new NextResponse(res.body, wrapped)

  } catch (error) {
    console.error('Error in assigned patients API:', error)
    const res = NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
    span.end(res)
    const wrapped = attachDiagHeaders(res, span)
    return new NextResponse(res.body, wrapped)
  }
}