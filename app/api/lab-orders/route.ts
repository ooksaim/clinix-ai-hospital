import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    )
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch lab orders with patient info and test count
    const { data: orders, error } = await supabase
      .from('lab_orders')
      .select(`
        *,
        patients!inner (
          id,
          first_name,
          last_name
        ),
        user_profiles!ordered_by (
          id,
          first_name,
          last_name,
          role,
          specialization
        ),
        lab_order_tests (count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching lab orders:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lab orders' },
        { status: 500 }
      )
    }

    // Format the data
    const formattedOrders = orders?.map(order => ({
      ...order,
      patient_name: order.patients ? `${order.patients.first_name} ${order.patients.last_name}` : 'Unknown Patient',
      doctor_name: order.user_profiles ? `Dr. ${order.user_profiles.first_name} ${order.user_profiles.last_name}` : 'Unknown Doctor',
      test_count: order.lab_order_tests?.[0]?.count || 0
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedOrders
    })

  } catch (error) {
    console.error('Error in lab-orders API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const data = await request.json()
    const { patient_id, ordered_by, tests, priority = 'routine', clinical_info } = data

    // Generate order number
    const orderNumber = `LAB-${Date.now()}`

    // Insert lab order
    const { data: newOrder, error: orderError } = await supabase
      .from('lab_orders')
      .insert([{
        order_number: orderNumber,
        patient_id,
        ordered_by,
        order_status: 'pending',
        priority,
        clinical_info
      }])
      .select()
      .single()

    if (orderError) {
      console.error('Error creating lab order:', orderError)
      return NextResponse.json(
        { success: false, error: 'Failed to create lab order' },
        { status: 500 }
      )
    }

    // Insert order tests
    if (tests && tests.length > 0) {
      const orderTests = tests.map((testId: string) => ({
        order_id: newOrder.id,
        test_id: testId,
        test_status: 'pending'
      }))

      const { error: testsError } = await supabase
        .from('lab_order_tests')
        .insert(orderTests)

      if (testsError) {
        console.error('Error creating lab order tests:', testsError)
        return NextResponse.json(
          { success: false, error: 'Failed to create lab order tests' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: newOrder
    })

  } catch (error) {
    console.error('Error in lab-orders POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
