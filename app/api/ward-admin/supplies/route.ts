import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Ward Admin - Fetching supplies information...')

    // Fetch all ward supplies - using existing schema column names (simplified query)
    const { data: supplies, error: suppliesError } = await supabase
      .from('ward_supplies')
      .select(`
        id,
        supply_name,
        supply_category,
        current_stock,
        minimum_stock_level,
        unit,
        updated_at,
        ward_id
      `)
      .order('supply_name')

    if (suppliesError) {
      console.error('❌ Error fetching supplies:', suppliesError)
      return NextResponse.json({ error: 'Failed to fetch supplies' }, { status: 500 })
    }

    // Transform data to match frontend expectations
    const transformedSupplies = supplies?.map(supply => ({
      id: supply.id,
      item_name: supply.supply_name,          // Map supply_name to item_name
      category: supply.supply_category,        // Map supply_category to category  
      current_stock: supply.current_stock,
      minimum_threshold: supply.minimum_stock_level, // Map minimum_stock_level to minimum_threshold
      unit: supply.unit,
      last_updated: supply.updated_at,         // Map updated_at to last_updated
      ward_id: supply.ward_id
    })) || []

    console.log(`✅ Found ${transformedSupplies.length} supply items`)

    return NextResponse.json({
      success: true,
      supplies: transformedSupplies
    })

  } catch (error) {
    console.error('❌ Unexpected error in supplies API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}