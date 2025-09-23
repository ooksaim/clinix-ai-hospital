import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function GET(request: NextRequest) {
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
          name,
          ward_type
        )
      `)
      .in('admission_status', ['active'])
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

    return NextResponse.json({
      success: true,
      data: {
        requests: requests || [],
        wards: wardsWithOccupancy
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