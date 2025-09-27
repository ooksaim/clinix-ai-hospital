import { NextRequest, NextResponse } from 'next/server'
import { startApiSpan, attachDiagHeaders } from '@/lib/observability'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function GET(request: NextRequest) {
  const span = startApiSpan('admissions.requests')
  try {
    // Fetch admission requests with patient and doctor information
    const { data: requests, error: requestsError } = await supabase
      .from('admissions')
      .select(`
        id,
        admission_number,
        admission_reason,
        admission_type,
        admission_status,
        created_at,
        patient:patient_id (
          first_name,
          last_name,
          patient_number
        ),
        requesting_doctor:requested_by (
          first_name,
          last_name
        ),
        ward:ward_id (
          id,
          name,
          ward_type
        )
      `)
      // Historically some admission records were created with 'active' status due to a prior
      // bug. The UI expects to show pending approval requests here. To ensure those older
      // records remain visible until they're fixed/migrated, include both 'pending' and
      // 'active' statuses for now. Consider cleaning up DB rows or reverting this once
      // creation logic consistently writes 'pending'.
      .in('admission_status', ['pending', 'active'])
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching admission requests:', requestsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch admission requests' },
        { status: 500 }
      )
    }

    // Fetch ward information with bed counts
    const { data: wards, error: wardsError } = await supabase
      .from('wards')
      .select(`
        id,
        name,
        ward_type,
        total_beds,
        available_beds
      `)
      .eq('is_active', true)
      .order('name')

    if (wardsError) {
      console.error('Error fetching wards:', wardsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch ward information' },
        { status: 500 }
      )
    }

    // Calculate occupied beds for each ward
    const wardsWithOccupancy = wards?.map(ward => ({
      ...ward,
      occupied_beds: ward.total_beds - ward.available_beds
    })) || []

    const res = NextResponse.json({
      success: true,
      data: {
        requests: requests || [],
        wards: wardsWithOccupancy
      }
    })
    span.end(res)
    const wrapped = attachDiagHeaders(res, span)
    return new NextResponse(res.body, wrapped)

  } catch (error) {
    console.error('Server error:', error)
    const res = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
    span.end(res)
    const wrapped = attachDiagHeaders(res, span)
    return new NextResponse(res.body, wrapped)
  }
}

// POST method for ward admin actions (approve/reject admission requests)
export async function POST(request: NextRequest) {
  const span = startApiSpan('admissions.requests.action')
  try {
  const body = await request.json()
  const { admissionId, action, bedId, wardAdminId, notes, assigned_doctor_id } = body

    if (!admissionId || !action || !wardAdminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      )
    }

    // Get admission details
    const { data: admission, error: admissionError } = await supabase
      .from('admissions')
      .select('*, wards:ward_id(ward_admin_id)')
      .eq('id', admissionId)
      .single()

    if (admissionError || !admission) {
      return NextResponse.json(
        { error: 'Admission not found' },
        { status: 404 }
      )
    }

    // Verify ward admin has permission for this ward
    if (admission.wards?.ward_admin_id !== wardAdminId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only manage admissions for your ward' },
        { status: 403 }
      )
    }

    let updateData: any = {
      approved_by: wardAdminId,
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.admission_status = 'approved'
      
      // If bed is assigned, update bed status and admission
      if (bedId) {
        // Check if bed is available
        const { data: bed, error: bedError } = await supabase
          .from('beds')
          .select('*')
          .eq('id', bedId)
          .eq('status', 'available')
          .single()

        if (bedError || !bed) {
          return NextResponse.json(
            { error: 'Bed not available or not found' },
            { status: 400 }
          )
        }

        updateData.bed_id = bedId
        
        // Update bed status to occupied
        const { error: bedUpdateError } = await supabase
          .from('beds')
          .update({ 
            status: 'occupied',
            current_patient_id: admission.patient_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', bedId)

        if (bedUpdateError) {
          return NextResponse.json(
            { error: 'Failed to update bed status' },
            { status: 500 }
          )
        }

        // Update ward available beds count
        const { error: wardUpdateError } = await supabase
          .rpc('decrement_available_beds', { ward_id: admission.ward_id })

        if (wardUpdateError) {
          console.error('Error updating ward bed count:', wardUpdateError)
        }
      }
      // If ward admin selected an assigned doctor during approval, set it
      if (assigned_doctor_id) {
        updateData.assigned_doctor = assigned_doctor_id
      }
    } else if (action === 'reject') {
      updateData.admission_status = 'rejected'
    }

    // Add notes if provided
    if (notes) {
      updateData.discharge_summary = notes // Using this field for admin notes
    }

    // Update admission
    const { data: updatedAdmission, error: updateError } = await supabase
      .from('admissions')
      .update(updateData)
      .eq('id', admissionId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update admission' },
        { status: 500 }
      )
    }

    // Create notification for requesting doctor
    if (admission.requested_by) {
      let notificationMessage = ''
      
      if (action === 'approve') {
        notificationMessage = `Ward admission approved for patient ${admission.patient_id}`
        if (bedId) {
          // Get bed details for notification
          const { data: bedInfo } = await supabase
            .from('beds')
            .select('bed_number')
            .eq('id', bedId)
            .single()
          
          if (bedInfo) {
            notificationMessage += ` - Bed assigned: ${bedInfo.bed_number}`
          }
        }
      } else {
        notificationMessage = `Ward admission rejected for patient ${admission.patient_id}`
        if (notes) {
          notificationMessage += ` - Reason: ${notes}`
        }
      }

      await supabase.from('notifications').insert({
        recipient_id: admission.requested_by,
        sender_id: wardAdminId,
        title: `Admission Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: notificationMessage,
        notification_type: 'alert',
        priority: 'normal',
        patient_id: admission.patient_id,
        related_entity_type: 'admission',
        related_entity_id: admissionId
      })
    }

    // Notify assigned doctor (if provided)
    if (assigned_doctor_id) {
      try {
        await supabase.from('notifications').insert({
          recipient_id: assigned_doctor_id,
          sender_id: wardAdminId,
          title: 'New Patient Assigned',
          message: `You have been assigned to patient ${admission.patient_id} (Admission: ${admissionId}). Ward: ${admission.ward_id}`,
          notification_type: 'alert',
          priority: 'normal',
          patient_id: admission.patient_id,
          related_entity_type: 'admission',
          related_entity_id: admissionId
        })
      } catch (err) {
        console.error('Failed to notify assigned doctor:', err)
      }
    }

    const res = NextResponse.json({
      success: true,
      message: `Admission ${action}d successfully`,
      data: updatedAdmission
    })
    span.end(res)
    const wrapped = attachDiagHeaders(res, span)
    return new NextResponse(res.body, wrapped)

  } catch (error) {
    console.error('Error in ward admin action:', error)
    const res = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    span.end(res)
    const wrapped = attachDiagHeaders(res, span)
    return new NextResponse(res.body, wrapped)
  }
}