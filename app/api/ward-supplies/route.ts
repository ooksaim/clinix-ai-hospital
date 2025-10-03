import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get('ward_id');

        // Filter by ward_id if provided in query params, otherwise return supplies from all wards
    // In a real implementation, you'd get the ward_id from the doctor's assignment
    let query = supabase
      .from('ward_supplies')
      .select('*')
      .gt('current_stock', 0) // Only show supplies that are in stock
      .order('supply_name');

    // If ward_id is provided and not 'current_ward', filter by it
    if (wardId && wardId !== 'current_ward') {
      query = query.eq('ward_id', wardId);
    }

    const { data: supplies, error } = await query;

    if (error) {
      console.error('Error fetching ward supplies:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch ward supplies' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: supplies || []
    });

  } catch (error) {
    console.error('Error in ward supplies API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}