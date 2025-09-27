import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('💊 Pharmacist - Fetching pharmacy stock...')

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || ''
    const lowStock = url.searchParams.get('low_stock') === 'true'

    let query = supabase
      .from('pharmacy_stock')
      .select('*')
      .eq('is_active', true)

    // Apply filters
    if (search) {
      query = query.ilike('supply_name', `%${search}%`)
    }

    if (category) {
      query = query.eq('supply_category', category)
    }

    if (lowStock) {
      // Use SQL to filter where current_stock <= minimum_stock_level
      query = query.filter('current_stock', 'lte', 'minimum_stock_level')
    }

    const { data: stockItems, error } = await query
      .order('supply_name', { ascending: true })

    if (error) {
      console.error('❌ Error fetching pharmacy stock:', error)
      return NextResponse.json({ error: 'Failed to fetch pharmacy stock' }, { status: 500 })
    }

    // Transform and enrich data
    const transformedStock = stockItems?.map(item => ({
      id: item.id,
      supply_name: item.supply_name,
      supply_category: item.supply_category || 'General',
      current_stock: item.current_stock || 0,
      minimum_stock_level: item.minimum_stock_level || 10,
      maximum_stock_level: item.maximum_stock_level || 1000,
      unit: item.unit || 'units',
      cost_per_unit: parseFloat(item.cost_per_unit || 0),
      supplier: item.supplier,
      last_restocked_date: item.last_restocked_date,
      expiry_date: item.expiry_date,
      batch_number: item.batch_number,
      notes: item.notes,
      // Calculated fields
      stock_status: item.current_stock <= (item.minimum_stock_level || 10) 
        ? (item.current_stock === 0 ? 'out_of_stock' : 'low_stock')
        : 'adequate',
      stock_percentage: Math.round((item.current_stock / (item.maximum_stock_level || 1000)) * 100),
      shortage_quantity: Math.max(0, (item.minimum_stock_level || 10) - item.current_stock),
      days_until_expiry: item.expiry_date 
        ? Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null,
      is_expired: item.expiry_date ? new Date(item.expiry_date) < new Date() : false,
      total_value: (item.current_stock || 0) * parseFloat(item.cost_per_unit || 0)
    })) || []

    // Calculate stats
    const stats = {
      total_items: transformedStock.length,
      low_stock_items: transformedStock.filter(item => item.stock_status === 'low_stock').length,
      out_of_stock_items: transformedStock.filter(item => item.stock_status === 'out_of_stock').length,
      expired_items: transformedStock.filter(item => item.is_expired).length,
      expiring_soon: transformedStock.filter(item => 
        item.days_until_expiry !== null && item.days_until_expiry <= 30 && item.days_until_expiry > 0
      ).length,
      total_value: transformedStock.reduce((sum, item) => sum + item.total_value, 0),
      categories: [...new Set(transformedStock.map(item => item.supply_category))].filter(Boolean)
    }

    console.log(`✅ Found ${stats.total_items} pharmacy stock items`)
    console.log(`   Low stock: ${stats.low_stock_items}`)
    console.log(`   Out of stock: ${stats.out_of_stock_items}`)
    console.log(`   Expired: ${stats.expired_items}`)
    console.log(`   Total value: $${stats.total_value.toFixed(2)}`)

    return NextResponse.json({
      stock: transformedStock,
      stats,
      filters_applied: {
        search: search || null,
        category: category || null,
        low_stock: lowStock
      }
    })

  } catch (error) {
    console.error('💥 Error in pharmacy stock GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💊 Pharmacist - Adding new stock item...')

    const body = await request.json()
    const {
      supply_name,
      supply_category,
      current_stock,
      minimum_stock_level,
      maximum_stock_level,
      unit,
      cost_per_unit,
      supplier,
      expiry_date,
      batch_number,
      notes,
      pharmacist_id
    } = body

    if (!supply_name || current_stock === undefined) {
      return NextResponse.json({ 
        error: 'supply_name and current_stock are required' 
      }, { status: 400 })
    }

    // Check if item already exists
    const { data: existingItem } = await supabase
      .from('pharmacy_stock')
      .select('id, supply_name')
      .eq('supply_name', supply_name)
      .eq('is_active', true)
      .single()

    if (existingItem) {
      return NextResponse.json({ 
        error: `Stock item '${supply_name}' already exists. Use stock update instead.` 
      }, { status: 409 })
    }

    // Create new stock item
    const { data: newItem, error } = await supabase
      .from('pharmacy_stock')
      .insert({
        supply_name,
        supply_category: supply_category || 'General',
        current_stock: parseInt(current_stock),
        minimum_stock_level: minimum_stock_level || 10,
        maximum_stock_level: maximum_stock_level || 1000,
        unit: unit || 'units',
        cost_per_unit: parseFloat(cost_per_unit || 0),
        supplier,
        last_restocked_date: new Date().toISOString().split('T')[0],
        expiry_date: expiry_date || null,
        batch_number,
        notes
      })
      .select()

    if (error) {
      console.error('❌ Error creating stock item:', error)
      return NextResponse.json({ error: 'Failed to create stock item' }, { status: 500 })
    }

    // Create transaction record
    if (pharmacist_id && current_stock > 0) {
      await supabase
        .from('pharmacy_transactions')
        .insert({
          transaction_type: 'stock_addition',
          pharmacy_supply_id: newItem[0].id,
          quantity: parseInt(current_stock),
          previous_stock: 0,
          new_stock: parseInt(current_stock),
          performed_by: pharmacist_id,
          notes: `Initial stock added: ${supply_name}`
        })
    }

    console.log(`✅ New stock item created: ${supply_name}`)

    return NextResponse.json({
      success: true,
      item: newItem[0],
      message: `Stock item '${supply_name}' created successfully`
    })

  } catch (error) {
    console.error('💥 Error in pharmacy stock POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}