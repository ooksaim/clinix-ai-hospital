import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; testId: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { id: orderId, testId } = params
    const data = await request.json()

    // Update the test status
    const { data: updatedTest, error } = await supabase
      .from('lab_order_tests')
      .update({
        test_status: data.test_status,
        completed_at: data.test_status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', testId)
      .eq('order_id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating test status:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update test status' },
        { status: 500 }
      )
    }

    // Check if all tests are completed to update order status
    const { data: allTests } = await supabase
      .from('lab_order_tests')
      .select('test_status')
      .eq('order_id', orderId)

    if (allTests) {
      const allCompleted = allTests.every(test => test.test_status === 'completed')
      const hasInProgress = allTests.some(test => test.test_status === 'in_progress')
      
      let newOrderStatus = 'pending'
      if (allCompleted) {
        newOrderStatus = 'completed'
      } else if (hasInProgress) {
        newOrderStatus = 'in_progress'
      }

      // Update order status if needed
      await supabase
        .from('lab_orders')
        .update({ 
          order_status: newOrderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
    }

    return NextResponse.json({
      success: true,
      data: updatedTest
    })

  } catch (error) {
    console.error('Error in test status update API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}