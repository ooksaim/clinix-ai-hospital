import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      patient_id,
      doctor_id,
      test_ids,
      clinical_info,
      priority = 'routine',
      notes,
      admission_id,
      visit_id
    } = body;

    // Validation
    if (!patient_id || !doctor_id || !test_ids || test_ids.length === 0) {
      console.error('Validation failed:', { patient_id, doctor_id, test_ids });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: patient_id, doctor_id, and test_ids' },
        { status: 400 }
      );
    }

    // Validate priority value
    const validPriorities = ['routine', 'urgent', 'stat'];
    const finalPriority = validPriorities.includes(priority) ? priority : 'routine';

    // Generate order number to match existing format: O20250926-0001
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format
    
    // Get the next sequential number for today
    const { data: lastOrder } = await supabase
      .from('lab_orders')
      .select('order_number')
      .like('order_number', `O${dateStr}-%`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    let nextNum = 1;
    if (lastOrder && lastOrder.length > 0) {
      const lastOrderNum = lastOrder[0].order_number;
      const lastNum = parseInt(lastOrderNum.split('-')[1]) || 0;
      nextNum = lastNum + 1;
    }
    
    const orderNumber = `O${dateStr}-${nextNum.toString().padStart(4, '0')}`;

    // Get test details to calculate total cost
    const { data: labTests, error: testsError } = await supabase
      .from('lab_tests')
      .select('id, test_name, cost')
      .in('id', test_ids);

    if (testsError) {
      console.error('Error fetching lab tests:', testsError);
      return NextResponse.json(
        { success: false, error: `Failed to fetch lab test details: ${testsError.message}` },
        { status: 500 }
      );
    }

    // Calculate total cost
    const totalCost = labTests?.reduce((sum, test) => sum + (parseFloat(test.cost) || 0), 0) || 0;

    // Prepare lab order data
    const labOrderData = {
      order_number: orderNumber,
      patient_id,
      visit_id: visit_id || null,
      admission_id: admission_id || null, // This should now contain the admission ID
      ordered_by: doctor_id, // Correct column name
      order_status: 'pending',
      priority: finalPriority, // Use validated priority
      clinical_info: clinical_info || null,
      fasting_required: false,
      total_cost: totalCost
      // Don't set created_at and updated_at as they have defaults
    };

    // Create lab order
    const { data: labOrder, error: orderError } = await supabase
      .from('lab_orders')
      .insert(labOrderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating lab order:', orderError);
      console.error('Lab order data that failed:', labOrderData);
      return NextResponse.json(
        { success: false, error: `Failed to create lab order: ${orderError.message}` },
        { status: 500 }
      );
    }

    // Create lab order test entries
    const orderTestEntries = test_ids.map((testId: string) => ({
      lab_order_id: labOrder.id,
      lab_test_id: testId,
      test_status: 'pending'
      // Don't set created_at as it has a default
    }));

    const { error: orderTestsError } = await supabase
      .from('lab_order_tests')
      .insert(orderTestEntries);

    if (orderTestsError) {
      console.error('Error creating lab order tests:', orderTestsError);
      // Try to cleanup the lab order if test entries failed
      await supabase.from('lab_orders').delete().eq('id', labOrder.id);
      
      return NextResponse.json(
        { success: false, error: `Failed to create lab order test entries: ${orderTestsError.message}` },
        { status: 500 }
      );
    }

    // Create notification for lab admin
    try {
      await supabase.from('notifications').insert({
        recipient_id: null, // Will be handled by lab admin role filter
        sender_id: doctor_id,
        title: 'New Lab Order Created',
        message: `Lab order ${orderNumber} created for patient. Tests: ${labTests?.map(t => t.test_name).join(', ')}`,
        notification_type: 'alert',
        priority: priority === 'stat' ? 'high' : priority === 'urgent' ? 'medium' : 'normal',
        patient_id: patient_id,
        related_entity_type: 'lab_order',
        related_entity_id: labOrder.id
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    // Return success response with order details
    return NextResponse.json({
      success: true,
      message: 'Lab order created successfully',
      data: {
        orderId: labOrder.id,
        orderNumber: orderNumber,
        testsOrdered: labTests?.length || 0,
        totalCost: totalCost,
        priority: priority,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error in lab order creation:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
