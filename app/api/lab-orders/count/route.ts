import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current date for today's stats
    // Use UTC date boundaries for consistent "today" calculation
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const day = now.getUTCDate()
  
  const startOfDay = new Date(Date.UTC(year, month, day)).toISOString()
  const startOfNextDay = new Date(Date.UTC(year, month, day + 1)).toISOString()

    // Count total tests from all pending orders (with valid patients only)
    const { data: pendingOrdersWithTests } = await supabase
      .from('lab_orders')
      .select(`
        id,
        lab_order_tests (count),
        patients!inner (id)
      `)
      .eq('order_status', 'pending')

    // Calculate total tests from all pending orders
    const totalTestsFromPendingOrders = pendingOrdersWithTests?.reduce((total, order) => {
      return total + (order.lab_order_tests?.[0]?.count || 0)
    }, 0) || 0

    // Count pending orders (with valid patients only)
    const pendingOrders = pendingOrdersWithTests?.length || 0

    // Count completed orders today (with valid patients only)
    const { data: completedTodayOrders } = await supabase
      .from('lab_orders')
      .select(`
        id,
        patients!inner (id)
      `)
      .eq('order_status', 'completed')
      .gte('created_at', startOfDay)
      .lt('created_at', startOfNextDay)

    const completedToday = completedTodayOrders?.length || 0

    // Count urgent orders (with valid patients only)
    const { data: urgentOrdersData } = await supabase
      .from('lab_orders')
      .select(`
        id,
        patients!inner (id)
      `)
      .in('priority', ['urgent', 'stat'])
      .in('order_status', ['pending', 'in_progress'])

    const urgentOrders = urgentOrdersData?.length || 0

    const stats = {
      totalTests: totalTestsFromPendingOrders,
      pendingOrders: pendingOrders,
      completedToday: completedToday,
      urgentOrders: urgentOrders
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error in lab-orders count API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
