import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function GET(request: NextRequest) {
  try {
    // Get all beds and their status
    const { data: bedsData, error: bedsError } = await supabase
      .from('beds')
      .select('id, bed_number, status, current_patient_id, ward_id')
      .order('id')

    if (bedsError) {
      console.error('Error fetching beds:', bedsError)
      return NextResponse.json({ error: 'Failed to fetch beds' }, { status: 500 })
    }

    console.log('🔍 All beds data:', bedsData)

    // Get all admissions
    const { data: admissionsData, error: admissionsError } = await supabase
      .from('admissions')
      .select('id, bed_id, patient_id, admission_status')
      .eq('admission_status', 'active')

    if (admissionsError) {
      console.error('Error fetching admissions:', admissionsError)
      return NextResponse.json({ error: 'Failed to fetch admissions' }, { status: 500 })
    }

    console.log('🔍 Active admissions data:', admissionsData)

    return NextResponse.json({
      success: true,
      beds: bedsData,
      admissions: admissionsData,
      summary: {
        totalBeds: bedsData?.length || 0,
        occupiedBeds: bedsData?.filter(bed => bed.status === 'occupied').length || 0,
        activeAdmissions: admissionsData?.length || 0
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}