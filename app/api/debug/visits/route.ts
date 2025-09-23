import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get ALL visits for today with basic info
    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        id,
        visit_number,
        patient_id,
        assigned_doctor_id,
        visit_status,
        visit_date,
        checkin_time
      `)
      .eq('visit_date', today)
      .order('checkin_time', { ascending: true })

    if (error) {
      console.error('Debug API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by status
    const byStatus = {
      waiting: visits?.filter(v => v.visit_status === 'waiting') || [],
      in_consultation: visits?.filter(v => v.visit_status === 'in_consultation') || [],
      completed: visits?.filter(v => v.visit_status === 'completed') || []
    }

    // Group by doctor
    const byDoctor = visits?.reduce((acc, visit) => {
      const doctorId = visit.assigned_doctor_id || 'unassigned'
      if (!acc[doctorId]) acc[doctorId] = []
      acc[doctorId].push(visit)
      return acc
    }, {} as Record<string, any[]>) || {}

    return NextResponse.json({
      success: true,
      debug: {
        date: today,
        totalVisits: visits?.length || 0,
        byStatus,
        byDoctor,
        allVisits: visits
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Debug API failed' 
    }, { status: 500 })
  }
}