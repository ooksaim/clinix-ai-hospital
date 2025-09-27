import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch lab tests
    const { data: tests, error } = await supabase
      .from('lab_tests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching lab tests:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lab tests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tests || []
    })

  } catch (error) {
    console.error('Error in lab-tests API:', error)
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

    // Insert new lab test
    const { data: newTest, error } = await supabase
      .from('lab_tests')
      .insert([{
        test_code: data.test_code,
        test_name: data.test_name,
        test_category: data.test_category,
        specimen_type: data.specimen_type,
        specimen_volume: data.specimen_volume,
        container_type: data.container_type,
        test_method: data.test_method,
        reference_range_male: data.reference_range_male,
        reference_range_female: data.reference_range_female,
        reference_range_pediatric: data.reference_range_pediatric,
        critical_values: data.critical_values,
        turnaround_time: data.turnaround_time ? parseInt(data.turnaround_time) : null,
        cost: data.cost ? parseFloat(data.cost) : null,
        department: data.department,
        is_active: data.is_active !== false
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating lab test:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create lab test' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newTest
    })

  } catch (error) {
    console.error('Error in lab-tests POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
