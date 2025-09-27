import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('💊 Pharmacist - Fetching pending supply requests...')

    // Fetch ONLY pending requests directly from supply_requests table
    const { data: pendingRequests, error } = await supabase
      .from('supply_requests')
      .select(`
        id,
        ward_id,
        supply_name,
        quantity_requested,
        urgency,
        request_reason,
        created_at,
        requested_by,
        pharmacy_supply_id,
        wards!ward_id(name),
        pharmacy_stock!pharmacy_supply_id(current_stock, unit)
      `)
      .eq('request_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching pending requests:', error)
      return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 })
    }

    // Get user names for requested_by
    const userIds = [...new Set(pendingRequests?.map(req => req.requested_by).filter(Boolean))]
    let users: Array<{id: string, first_name: string, last_name: string}> = []
    
    if (userIds.length > 0) {
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', userIds)
      users = userData || []
    }

    // Transform data for frontend
    const transformedRequests = pendingRequests?.map(request => {
      const ward = Array.isArray(request.wards) ? request.wards[0] : request.wards
      const pharmacyStock = Array.isArray(request.pharmacy_stock) ? request.pharmacy_stock[0] : request.pharmacy_stock
      const user = users.find(u => u.id === request.requested_by)

      return {
        id: request.id,
        ward_name: ward?.name || 'Unknown Ward',
        supply_name: request.supply_name || 'Unknown Supply',
        quantity_requested: request.quantity_requested || 0,
        urgency: request.urgency || 'normal',
        request_reason: request.request_reason || 'No reason provided',
        created_at: request.created_at,
        requested_by_name: user 
          ? `${user.first_name} ${user.last_name}`.trim() 
          : 'Ward Staff',
        pharmacy_supply_id: request.pharmacy_supply_id,
        pharmacy_stock: pharmacyStock?.current_stock || 0,
        unit: pharmacyStock?.unit || 'units',
        availability_status: (pharmacyStock?.current_stock || 0) >= (request.quantity_requested || 0) 
          ? 'available' 
          : 'insufficient',
        can_fulfill: (pharmacyStock?.current_stock || 0) >= (request.quantity_requested || 0)
      }
    }) || []

    // Stats
    const stats = {
      total: transformedRequests.length,
      can_fulfill: transformedRequests.filter(req => req.can_fulfill).length,
      insufficient_stock: transformedRequests.filter(req => !req.can_fulfill).length,
      urgent: transformedRequests.filter(req => req.urgency === 'urgent').length
    }

    console.log(`✅ Found ${stats.total} pending requests (supply_requests table only)`)
    console.log(`   Can fulfill: ${stats.can_fulfill}`)
    console.log(`   Insufficient stock: ${stats.insufficient_stock}`)
    console.log(`   Urgent: ${stats.urgent}`)

    return NextResponse.json({
      requests: transformedRequests,
      stats
    })

  } catch (error) {
    console.error('💥 Error in pending-requests GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}