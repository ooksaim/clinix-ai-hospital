import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('💊 Pharmacist - Fetching low stock alerts...')

    // Use the smart view for low stock
    const { data: lowStockItems, error } = await supabase
      .from('pharmacy_low_stock')
      .select('*')
      .order('shortage_quantity', { ascending: false }) // Most urgent first

    if (error) {
      console.error('❌ Error fetching low stock:', error)
      return NextResponse.json({ error: 'Failed to fetch low stock alerts' }, { status: 500 })
    }

    // Transform and enrich data
    const transformedItems = lowStockItems?.map(item => ({
      id: item.id,
      supply_name: item.supply_name,
      supply_category: item.supply_category || 'General',
      current_stock: item.current_stock || 0,
      minimum_stock_level: item.minimum_stock_level || 10,
      shortage_quantity: item.shortage_quantity || 0,
      unit: item.unit || 'units',
      alert_level: item.alert_level || 'low',
      // Calculated priority
      priority: item.current_stock === 0 
        ? 'critical' 
        : item.shortage_quantity >= 20 
          ? 'high' 
          : 'medium',
      // Status indicators
      is_out_of_stock: item.current_stock === 0,
      stock_percentage: Math.round((item.current_stock / (item.minimum_stock_level || 10)) * 100),
      recommended_reorder: Math.max(item.shortage_quantity, Math.ceil((item.minimum_stock_level || 10) * 1.5))
    })) || []

    // Calculate stats
    const stats = {
      total_low_stock: transformedItems.length,
      out_of_stock: transformedItems.filter(item => item.is_out_of_stock).length,
      critical_alerts: transformedItems.filter(item => item.priority === 'critical').length,
      high_priority: transformedItems.filter(item => item.priority === 'high').length,
      total_shortage: transformedItems.reduce((sum, item) => sum + item.shortage_quantity, 0),
      categories_affected: [...new Set(transformedItems.map(item => item.supply_category))].filter(Boolean)
    }

    console.log(`🚨 Low Stock Alert Summary:`)
    console.log(`   Total items: ${stats.total_low_stock}`)
    console.log(`   Out of stock: ${stats.out_of_stock}`)
    console.log(`   Critical: ${stats.critical_alerts}`)
    console.log(`   High priority: ${stats.high_priority}`)
    console.log(`   Categories affected: ${stats.categories_affected.length}`)

    return NextResponse.json({
      low_stock_items: transformedItems,
      stats,
      alert_summary: {
        total_alerts: stats.total_low_stock,
        requires_immediate_action: stats.out_of_stock + stats.critical_alerts,
        estimated_reorder_cost: 0 // Could be calculated if cost_per_unit is available
      }
    })

  } catch (error) {
    console.error('💥 Error in low-stock GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}