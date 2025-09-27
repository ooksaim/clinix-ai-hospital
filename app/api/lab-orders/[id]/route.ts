import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const orderId = params.id

    // Fetch lab order with detailed information
    const { data: order, error } = await supabase
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
        lab_order_tests (
          *,
          lab_tests (
            *
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Error fetching lab order:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lab order' },
        { status: 500 }
      )
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Lab order not found' },
        { status: 404 }
      )
    }

    // Format the data
    const formattedOrder = {
      ...order,
      patient_name: order.patients ? `${order.patients.first_name} ${order.patients.last_name}` : 'Unknown Patient',
      doctor_name: order.user_profiles ? `Dr. ${order.user_profiles.first_name} ${order.user_profiles.last_name}` : 'Unknown Doctor'
    }

    return NextResponse.json({
      success: true,
      data: formattedOrder
    })

  } catch (error) {
    console.error('Error in lab-order details API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}