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

    // Validate numeric fields before processing
    if (data.turnaround_time !== undefined && data.turnaround_time !== null && data.turnaround_time !== '') {
      const parsedTime = parseInt(data.turnaround_time, 10)
      if (Number.isNaN(parsedTime)) {
        return NextResponse.json(
          { success: false, error: 'Invalid turnaround_time: must be a valid number' },
          { status: 400 }
        )
      }
    }

    if (data.cost !== undefined && data.cost !== null && data.cost !== '') {
      const parsedCost = parseFloat(data.cost)
      if (!Number.isFinite(parsedCost)) {
        return NextResponse.json(
          { success: false, error: 'Invalid cost: must be a valid number' },
          { status: 400 }
        )
      }
    }

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
        turnaround_time: data.turnaround_time ? (() => {
          const parsed = parseInt(data.turnaround_time, 10)
          return Number.isNaN(parsed) ? null : parsed
        })() : null,
        cost: data.cost ? (() => {
          const parsed = parseFloat(data.cost)
          return Number.isFinite(parsed) ? parsed : null
        })() : null,
        department: data.department,
        is_active: data.is_active !== false
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating lab test:', error)
      
      // Handle specific error cases
      if (error.code === '23505' && error.message.includes('test_code')) {
        return NextResponse.json(
          { success: false, error: 'A lab test with this test code already exists. Please use a different test code.' },
          { status: 400 }
        )
      }
      
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
