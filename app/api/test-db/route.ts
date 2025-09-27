import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    console.log('🧪 Testing database connection...')
    
    // Test 1: Simple ward query
    const { data: wards, error: wardsError } = await supabase
      .from('wards')
      .select('id, name, ward_type')
      .limit(5)

    if (wardsError) {
      console.error('❌ Wards query error:', wardsError)
      return NextResponse.json({ 
        error: 'Wards query failed', 
        details: wardsError 
      }, { status: 500 })
    }

    // Test 2: Simple beds query
    const { data: beds, error: bedsError } = await supabase
      .from('beds')
      .select('id, bed_number, ward_id, status')
      .limit(5)

    if (bedsError) {
      console.error('❌ Beds query error:', bedsError)
      return NextResponse.json({ 
        error: 'Beds query failed', 
        details: bedsError 
      }, { status: 500 })
    }

    // Test 3: Simple supplies query
    const { data: supplies, error: suppliesError } = await supabase
      .from('ward_supplies')
      .select('id, supply_name, current_stock')
      .limit(5)

    if (suppliesError) {
      console.error('❌ Supplies query error:', suppliesError)
      return NextResponse.json({ 
        error: 'Supplies query failed', 
        details: suppliesError 
      }, { status: 500 })
    }

    console.log(`✅ Database test successful - Wards: ${wards?.length}, Beds: ${beds?.length}, Supplies: ${supplies?.length}`)

    return NextResponse.json({
      success: true,
      results: {
        wards: wards?.length || 0,
        beds: beds?.length || 0,
        supplies: supplies?.length || 0
      },
      sampleData: {
        wards: wards?.slice(0, 2),
        beds: beds?.slice(0, 2),
        supplies: supplies?.slice(0, 2)
      }
    })

  } catch (error) {
    console.error('❌ Test database error:', error)
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}