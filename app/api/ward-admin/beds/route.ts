import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Ward Admin - Fetching beds information...')

    // Fetch all wards with their beds for the comprehensive dashboard
    const { data: wards, error: wardsError } = await supabase
      .from('wards')
      .select(`
        id,
        name,
        ward_type,
        total_beds,
        available_beds
      `)
      .order('name')

    if (wardsError) {
      console.error('❌ Error fetching wards:', wardsError)
      return NextResponse.json({ error: 'Failed to fetch wards' }, { status: 500 })
    }

    // For each ward, fetch its beds
    const wardsWithBeds = await Promise.all(
      (wards || []).map(async (ward) => {
        const { data: beds, error: bedsError } = await supabase
          .from('beds')
          .select(`
            id,
            bed_number,
            bed_type,
            status,
            current_patient_id
          `)
          .eq('ward_id', ward.id)
          .order('bed_number')

        if (bedsError) {
          console.error(`❌ Error fetching beds for ward ${ward.id}:`, bedsError)
          return {
            ...ward,
            beds: []
          }
        }

        // Gather all patient_ids for occupied beds
        const occupiedBedsRaw = (beds || []).filter(bed => bed.status === 'occupied' && bed.current_patient_id)
        const patientIds = occupiedBedsRaw.map(bed => bed.current_patient_id)

        // Fetch patient names for these IDs
        let patientMap: Record<string, string> = {}
        if (patientIds.length > 0) {
          const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('id, first_name, last_name')
            .in('id', patientIds)
          if (!patientsError && patients) {
            patients.forEach(p => {
              patientMap[p.id] = `${p.first_name} ${p.last_name}`
            })
          }
        }

        // Transform beds data
        const transformedBeds = (beds || []).map(bed => ({
          id: bed.id,
          bed_number: bed.bed_number,
          bed_type: bed.bed_type,
          bed_status: bed.status, // Using correct column name 'status'
          patient_id: bed.current_patient_id,
          patient_name: bed.status === 'occupied' && bed.current_patient_id ? (patientMap[bed.current_patient_id] || null) : null
        }))

        // Calculate occupied_beds from actual bed statuses
        const occupiedBeds = transformedBeds.filter(bed => bed.bed_status === 'occupied').length

        return {
          ...ward,
          occupied_beds: occupiedBeds,  // Add calculated occupied_beds
          beds: transformedBeds
        }
      })
    )

    console.log(`✅ Found ${wardsWithBeds.length} wards with bed information`)

    return NextResponse.json({
      success: true,
      wards: wardsWithBeds
    })

  } catch (error) {
    console.error('❌ Unexpected error in beds API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}