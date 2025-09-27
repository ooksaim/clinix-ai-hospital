import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('💊 Pharmacist - Fetching transaction history...')

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const transaction_type = url.searchParams.get('type') || ''
    const date_from = url.searchParams.get('date_from') || ''
    const date_to = url.searchParams.get('date_to') || ''

    let query = supabase
      .from('pharmacy_transactions')
      .select(`
        *,
        pharmacy_stock!inner(supply_name, supply_category, unit),
        ward_supplies(supply_name, ward_id),
        user_profiles!pharmacy_transactions_performed_by_fkey(first_name, last_name)
      `)

    // Apply filters
    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type)
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    const { data: transactions, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transaction history' }, { status: 500 })
    }

    // Transform data for frontend
    const transformedTransactions = transactions?.map(transaction => {
      const pharmacyStock = Array.isArray(transaction.pharmacy_stock)
        ? transaction.pharmacy_stock[0]
        : transaction.pharmacy_stock

      const wardSupply = Array.isArray(transaction.ward_supplies)
        ? transaction.ward_supplies[0]
        : transaction.ward_supplies

      const performer = Array.isArray(transaction.user_profiles)
        ? transaction.user_profiles[0]
        : transaction.user_profiles

      return {
        id: transaction.id,
        transaction_type: transaction.transaction_type,
        supply_name: pharmacyStock?.supply_name || wardSupply?.supply_name || 'Unknown',
        supply_category: pharmacyStock?.supply_category || 'General',
        quantity: transaction.quantity,
        previous_stock: transaction.previous_stock,
        new_stock: transaction.new_stock,
        stock_change: transaction.new_stock - transaction.previous_stock,
        unit: pharmacyStock?.unit || 'units',
        performed_by: performer 
          ? `${performer.first_name} ${performer.last_name}`.trim()
          : 'System',
        ward_id: transaction.ward_id,
        supply_request_id: transaction.supply_request_id,
        notes: transaction.notes,
        created_at: transaction.created_at,
        // Enriched data
        transaction_description: getTransactionDescription(
          transaction.transaction_type,
          pharmacyStock?.supply_name || 'Unknown Item',
          transaction.quantity
        ),
        impact_level: Math.abs(transaction.new_stock - transaction.previous_stock) > 50 ? 'high' : 'normal'
      }
    }) || []

    // Get total count for pagination
    const { count } = await supabase
      .from('pharmacy_transactions')
      .select('*', { count: 'exact', head: true })

    // Calculate summary stats
    const stats = {
      total_transactions: count || 0,
      current_page_count: transformedTransactions.length,
      transfers_to_wards: transformedTransactions.filter(t => t.transaction_type === 'transfer_to_ward').length,
      stock_adjustments: transformedTransactions.filter(t => t.transaction_type.includes('stock')).length,
      restocks: transformedTransactions.filter(t => t.transaction_type === 'restock').length,
      transaction_types: [...new Set(transformedTransactions.map(t => t.transaction_type))],
      date_range: {
        earliest: transformedTransactions[transformedTransactions.length - 1]?.created_at,
        latest: transformedTransactions[0]?.created_at
      }
    }

    console.log(`📊 Transaction History:`)
    console.log(`   Total transactions: ${stats.total_transactions}`)
    console.log(`   Current page: ${transformedTransactions.length}`)
    console.log(`   Ward transfers: ${stats.transfers_to_wards}`)
    console.log(`   Stock adjustments: ${stats.stock_adjustments}`)

    return NextResponse.json({
      transactions: transformedTransactions,
      stats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (offset + limit) < (count || 0)
      }
    })

  } catch (error) {
    console.error('💥 Error in transactions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getTransactionDescription(type: string, supplyName: string, quantity: number): string {
  const descriptions = {
    'transfer_to_ward': `Transferred ${quantity} units of ${supplyName} to ward`,
    'restock': `Restocked ${quantity} units of ${supplyName}`,
    'stock_increase': `Increased stock of ${supplyName} by ${quantity} units`,
    'stock_decrease': `Decreased stock of ${supplyName} by ${quantity} units`,
    'stock_adjustment': `Adjusted stock of ${supplyName} by ${quantity} units`,
    'stock_addition': `Added new stock item: ${supplyName} (${quantity} units)`,
    'expired_removal': `Removed ${quantity} expired units of ${supplyName}`,
    'damaged_removal': `Removed ${quantity} damaged units of ${supplyName}`
  }

  return descriptions[type] || `${type}: ${supplyName} (${quantity} units)`
}