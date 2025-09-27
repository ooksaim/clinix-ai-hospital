import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Ward Admin - Fetching supply requests...')

    // Fetch supply requests with their supply information using proper join
    const { data: requests, error: requestsError } = await supabase
      .from('supply_requests')
      .select(`
        id,
        quantity_requested,
        request_status,
        created_at,
        requested_by,
        ward_id,
        supply_id,
        urgency,
        request_reason,
        notes,
        ward_supplies!inner (
          supply_name,
          supply_category
        )
      `)
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('❌ Error fetching supply requests:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch supply requests' }, { status: 500 })
    }

    // Transform the data to match frontend expectations
    const transformedRequests = requests?.map(request => {
      // Get supply name from joined ward_supplies data (object, not array)
      // Robust: handle both array and object join results
      const supplyName = Array.isArray(request.ward_supplies)
        ? request.ward_supplies[0]?.supply_name || 'Unknown Item'
        : request.ward_supplies?.supply_name || 'Unknown Item';
      return {
        id: request.id,
        item_name: supplyName,
        requested_quantity: request.quantity_requested,
        status: request.request_status || 'pending',
        requested_at: request.created_at,
        requested_by_id: request.requested_by,
        ward_id: request.ward_id,
        supply_id: request.supply_id,
        priority: request.urgency || 'medium',
        notes: request.notes,
        request_reason: request.request_reason,
        requested_by: 'Ward Staff'
      }
    }) || []

    // Count pending requests for stats
    const pendingCount = transformedRequests.filter(req => req.status === 'pending').length

    console.log(`✅ Found ${transformedRequests.length} supply requests, ${pendingCount} pending`)

    return NextResponse.json({
      requests: transformedRequests,
      total: transformedRequests.length,
      pending: pendingCount
    })

  } catch (error) {
    console.error('💥 Error in supply-requests GET route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏥 Ward Admin - Creating new supply request...')

    const body = await request.json()
    const { supply_id, quantity_requested, urgency, request_reason, notes, ward_id, requested_by } = body

    // Use ward_id and requested_by from frontend
    if (!ward_id || !requested_by) {
      return NextResponse.json({ error: 'ward_id and requested_by are required' }, { status: 400 })
    }

    // First, get the supply information from ward_supplies to get supply_name
    const { data: wardSupply, error: wardSupplyError } = await supabase
      .from('ward_supplies')
      .select('supply_name, supply_category')
      .eq('id', supply_id)
      .single()

    if (wardSupplyError || !wardSupply) {
      console.error('❌ Error fetching ward supply:', wardSupplyError)
      return NextResponse.json({ error: 'Invalid supply_id' }, { status: 400 })
    }

    // Find matching pharmacy stock by supply name
    const { data: pharmacyStock, error: pharmacyError } = await supabase
      .from('pharmacy_stock')
      .select('id, current_stock, supply_name')
      .eq('supply_name', wardSupply.supply_name)
      .eq('is_active', true)
      .single()

    console.log(`🔗 Linking request to pharmacy stock: ${wardSupply.supply_name}`)
    if (pharmacyError) {
      console.warn('⚠️ No matching pharmacy stock found for:', wardSupply.supply_name)
    }

    // Insert the new supply request with pharmacy linkage
    const { data, error } = await supabase
      .from('supply_requests')
      .insert({
        supply_id,
        quantity_requested: parseInt(quantity_requested),
        urgency: urgency || 'medium',
        request_reason,
        notes,
        requested_by,
        ward_id,
        request_status: 'pending',
        supply_name: wardSupply.supply_name,
        pharmacy_supply_id: pharmacyStock?.id || null
      })
      .select()

    if (error) {
      console.error('❌ Error creating supply request:', error)
      return NextResponse.json({ error: 'Failed to create supply request' }, { status: 500 })
    }

    console.log(`✅ Supply request created with pharmacy linkage`)
    console.log(`   Supply: ${wardSupply.supply_name}`)
    console.log(`   Pharmacy Stock: ${pharmacyStock ? 'Linked' : 'No match'}`)
    console.log(`   Pharmacy Stock Level: ${pharmacyStock?.current_stock || 'N/A'}`)

    return NextResponse.json({
      success: true,
      request: data[0],
      pharmacy_stock: pharmacyStock ? {
        id: pharmacyStock.id,
        current_stock: pharmacyStock.current_stock,
        available: pharmacyStock.current_stock >= parseInt(quantity_requested)
      } : null
    })

  } catch (error) {
    console.error('💥 Error in supply-requests POST route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}