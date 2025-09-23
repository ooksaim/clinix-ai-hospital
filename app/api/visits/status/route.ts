import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function PUT(request: Request) {
  try {
    const { visitId, status } = await request.json()

    if (!visitId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing visitId or status' 
      }, { status: 400 })
    }

    // Update visit status using raw SQL to avoid TypeScript issues
    const { error: visitError } = await supabase
      .from('visits')
      .update({ 
        visit_status: status,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', visitId)

    if (visitError) {
      console.error('Error updating visit status:', visitError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update visit status'
      }, { status: 500 })
    }

    // Update token status
    const tokenStatus = status === 'in_consultation' ? 'in_consultation' : 
                       status === 'completed' ? 'completed' : 'waiting'

    const { error: tokenError } = await supabase
      .from('tokens')
      .update({ 
        token_status: tokenStatus,
        updated_at: new Date().toISOString()
      } as any)
      .eq('visit_id', visitId)

    if (tokenError) {
      console.error('Error updating token status:', tokenError)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Visit status updated to ${status}`
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const visitId = searchParams.get('visit_id')
    const doctorId = searchParams.get('doctor_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('visits')
      .select('*')

    if (visitId) {
      query = query.eq('id', visitId)
    } else if (doctorId) {
      query = query.eq('assigned_doctor_id', doctorId)
    } else {
      // Default to today's visits
      const today = new Date().toISOString().split('T')[0]
      query = query.eq('visit_date', today)
    }

    if (status) {
      query = query.eq('visit_status', status)
    }

    const { data: visits, error } = await query
      .order('checkin_time', { ascending: true })

    if (error) {
      console.error('Error fetching visits:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch visits'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: visits || []
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 })
  }
}