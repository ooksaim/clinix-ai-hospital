import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🏥 ADMISSION REQUEST API CALLED')
  
  try {
    const body = await request.json()
    const {
      patientId,
      visitId,
      requestedBy,
      admissionReason,
      urgency,
      wardType,
      expectedDuration,
      additionalNotes,
      consultationData
    } = body

    console.log('🏥 Admission request data:', {
      patientId,
      visitId,
      requestedBy,
      urgency,
      wardType
    })

    console.log('🔍 ConsultationData received:', consultationData)

    if (!patientId || !visitId || !requestedBy || !admissionReason) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: patientId, visitId, requestedBy, admissionReason'
      }, { status: 400 })
    }

    // Get patient information
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('first_name, last_name, patient_number')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      console.error('❌ Patient not found:', patientError)
      return NextResponse.json({
        success: false,
        error: 'Patient not found'
      }, { status: 404 })
    }

    // Get requesting doctor information
    const { data: doctor, error: doctorError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, department_id')
      .eq('id', requestedBy)
      .single()

    if (doctorError || !doctor) {
      console.error('❌ Doctor not found:', doctorError)
      return NextResponse.json({
        success: false,
        error: 'Requesting doctor not found'
      }, { status: 404 })
    }

    // Find appropriate ward based on ward type and availability
    const { data: availableWards, error: wardsError } = await supabase
      .from('wards')
      .select(`
        id,
        name,
        code,
        ward_type,
        available_beds,
        total_beds,
        head_nurse_id
      `)
      .eq('ward_type', wardType || 'general')
      .eq('is_active', true)
      .gt('available_beds', 0)
      .order('available_beds', { ascending: false })

    if (wardsError) {
      console.error('❌ Error fetching wards:', wardsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch available wards'
      }, { status: 500 })
    }

    const selectedWard = availableWards?.[0]
    if (!selectedWard) {
      console.log('⚠️ No available wards for type:', wardType)
      return NextResponse.json({
        success: false,
        error: 'No available beds in the requested ward type. Please try again later or contact administration.'
      }, { status: 400 })
    }

    // Generate admission number
    const admissionNumber = `ADM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Create admission record with pending status
    const admissionData = {
      admission_number: admissionNumber,
      patient_id: patientId,
      visit_id: visitId,
      ward_id: selectedWard.id, // Ward is pre-assigned but pending approval
      attending_doctor_id: requestedBy,
      admission_type: urgency === 'emergency' ? 'emergency' : 'elective',
      admission_reason: admissionReason,
      diagnosis: consultationData?.diagnosis || '',
      treatment_plan: consultationData?.treatmentPlan || '',
      admission_status: 'pending', // Start as pending approval
      requested_by: requestedBy,
      approved_by: null, // Will be set when approved
      expected_discharge_date: expectedDuration ? null : null // TODO: Calculate based on expectedDuration
    }

    console.log('🏥 Creating admission record:', admissionData)

    const { data: admission, error: admissionError } = await supabase
      .from('admissions')
      .insert(admissionData)
      .select()
      .single()

    if (admissionError) {
      console.error('❌ Failed to create admission:', admissionError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create admission record: ' + admissionError.message
      }, { status: 500 })
    }

    console.log('✅ Admission record created:', admission.id)

    // 🔄 UPDATE VISITS TABLE - This is the missing piece!
    console.log('🔄 Updating visits table with consultation data...')
    
    const visitUpdateData = {
      chief_complaint: consultationData?.chiefComplaint || '',
      symptoms: consultationData?.symptoms || '', // Now using correct field name
      examination_notes: consultationData?.physicalExamination || '',
      diagnosis: consultationData?.diagnosis || '',
      treatment_plan: consultationData?.treatmentPlan || '',
      follow_up_instructions: consultationData?.followUpInstructions || '',
      visit_status: 'admission_requested',
      requires_admission: true,
      consultation_end_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('🔄 Visit update data:', visitUpdateData)

    const { data: updatedVisit, error: visitError } = await supabase
      .from('visits')
      .update(visitUpdateData)
      .eq('id', visitId)
      .select()
      .single()

    if (visitError) {
      console.error('⚠️ Failed to update visits table:', visitError)
      // Don't fail the whole request, but log the error
    } else {
      console.log('✅ Visits table updated successfully:', updatedVisit.id)
    }

    // Create notification for ward admin
    if (selectedWard.head_nurse_id) {
      const notificationData = {
        recipient_id: selectedWard.head_nurse_id,
        sender_id: requestedBy,
        title: `New Admission Request - ${patient.first_name} ${patient.last_name}`,
        message: `Dr. ${doctor.first_name} ${doctor.last_name} has requested admission for patient ${patient.first_name} ${patient.last_name} (${patient.patient_number}) to ${selectedWard.name}.\n\nReason: ${admissionReason}\nUrgency: ${urgency.toUpperCase()}\nAdmission #: ${admissionNumber}`,
        notification_type: 'admission_request',
        priority: urgency === 'emergency' ? 'urgent' : urgency === 'urgent' ? 'high' : 'normal',
        patient_id: patientId,
        related_entity_type: 'admission',
        related_entity_id: admission.id,
        action_url: `/ward-admin/admissions/${admission.id}`
      }

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationData)

      if (notificationError) {
        console.error('⚠️ Failed to create notification:', notificationError)
        // Don't fail the whole request for notification failure
      } else {
        console.log('✅ Ward admin notification created')
      }
    }

    // Note: Visit status already updated above in the comprehensive update
    console.log('✅ Visit status and consultation data synchronized')

    console.log('🏥 Admission request completed successfully')

    return NextResponse.json({
      success: true,
      data: {
        admission,
        admissionNumber,
        wardAssigned: {
          id: selectedWard.id,
          name: selectedWard.name,
          type: selectedWard.ward_type
        },
        message: `Admission request submitted and bed assigned in ${selectedWard.name}`
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('💥 Error in admission request:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 })
  }
}