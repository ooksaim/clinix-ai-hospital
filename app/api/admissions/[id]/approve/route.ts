import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const { approved_by, bed_id, assigned_doctor_id } = await request.json()
    const admissionId = params.id

    if (!approved_by) {
      return NextResponse.json(
        { success: false, error: 'Approved by user ID is required' },
        { status: 400 }
      )
    }

    // Start a transaction to update admission status and assign bed
    const { data: admission, error: fetchError } = await supabase
      .from('admissions')
      .select(`
        id,
        patient_id,
        admission_number,
        ward_id,
        requested_by,
        ward:ward_id (
          ward_type,
          name
        ),
        patient:patient_id (
          first_name,
          last_name,
          patient_number
        )
      `)
      .eq('id', admissionId)
      .single()

    if (fetchError || !admission) {
      return NextResponse.json(
        { success: false, error: 'Admission not found' },
        { status: 404 }
      )
    }

    // Get current ward information
    const currentWard = Array.isArray(admission.ward) ? admission.ward[0] : admission.ward
    
    let selectedBed;
    
    if (bed_id) {
      // Use the specific bed that was selected
      const { data: specificBed, error: specificBedError } = await supabase
        .from('beds')
        .select('id, bed_number, status')
        .eq('id', bed_id)
        .eq('ward_id', admission.ward_id)
        .single()

      if (specificBedError || !specificBed) {
        return NextResponse.json(
          { success: false, error: 'Selected bed not found in the assigned ward' },
          { status: 400 }
        )
      }

      if (specificBed.status !== 'available') {
        return NextResponse.json(
          { success: false, error: 'Selected bed is not available' },
          { status: 400 }
        )
      }

      selectedBed = specificBed
    } else {
      // Find an available bed in the assigned ward (original logic)
      const { data: availableBed, error: bedError } = await supabase
        .from('beds')
        .select('id, bed_number')
        .eq('ward_id', admission.ward_id)
        .eq('status', 'available')
        .limit(1)
        .single()

      if (bedError || !availableBed) {
        return NextResponse.json(
          { success: false, error: `No available beds in ${currentWard.name} ward` },
          { status: 400 }
        )
      }

      selectedBed = availableBed
    }

    // Update admission status - ward is already assigned, just add bed
    const admissionUpdatePayload: any = {
      admission_status: 'approved',
      bed_id: selectedBed.id,
      approved_by: approved_by,
      updated_at: new Date().toISOString()
    }

    if (assigned_doctor_id) {
      admissionUpdatePayload.assigned_doctor = assigned_doctor_id
    }

    const { error: updateAdmissionError } = await supabase
      .from('admissions')
      .update(admissionUpdatePayload)
      .eq('id', admissionId)

    if (updateAdmissionError) {
      console.error('Error updating admission:', updateAdmissionError)
      return NextResponse.json(
        { success: false, error: 'Failed to approve admission' },
        { status: 500 }
      )
    }

    // Update bed status
    const { error: updateBedError } = await supabase
      .from('beds')
      .update({
        status: 'occupied',
        current_patient_id: admission.patient_id
      })
      .eq('id', selectedBed.id)

    if (updateBedError) {
      console.error('Error updating bed status:', updateBedError)
      // Note: In a real system, you'd want to roll back the admission update
    }

    // Update ward bed counts - get current ward info first
    const { data: wardInfo, error: wardFetchError } = await supabase
      .from('wards')
      .select('available_beds')
      .eq('id', admission.ward_id)
      .single()

    if (!wardFetchError && wardInfo) {
      const newAvailableBeds = wardInfo.available_beds - 1
      const { error: updateWardError } = await supabase
        .from('wards')
        .update({
          available_beds: newAvailableBeds
        })
        .eq('id', admission.ward_id)

      if (updateWardError) {
        console.error('Error updating ward counts:', updateWardError)
      }
    }

    // Create notification(s) for successful admission
    const patientInfo = Array.isArray(admission.patient) ? admission.patient[0] : admission.patient

    // notify requesting doctor (if any)
    try {
      await supabase.from('notifications').insert({
        recipient_type: 'doctor',
        recipient_id: admission.requested_by || null,
        title: 'Admission Approved',
        message: `Admission for ${patientInfo.first_name} ${patientInfo.last_name} (${patientInfo.patient_number}) has been approved. Ward: ${currentWard.name}, Bed: ${selectedBed.bed_number}`,
        type: 'admission_approved',
        related_id: admissionId
      })
    } catch (err) {
      console.error('Error creating notification for requesting doctor:', err)
    }

    // notify assigned doctor (if provided)
    if (assigned_doctor_id) {
      try {
        await supabase.from('notifications').insert({
          recipient_type: 'doctor',
          recipient_id: assigned_doctor_id,
          title: 'New Patient Assigned',
          message: `You have been assigned to patient ${patientInfo.first_name} ${patientInfo.last_name} (Admission: ${admissionId}). Ward: ${currentWard.name}, Bed: ${selectedBed.bed_number}`,
          type: 'assigned_to_patient',
          related_id: admissionId
        })
      } catch (err) {
        console.error('Error creating notification for assigned doctor:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admission approved successfully',
      data: {
        admission_id: admissionId,
        ward_name: currentWard.name,
        bed_number: selectedBed.bed_number
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}