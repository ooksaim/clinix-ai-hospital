import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Validate required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL environment variable is required' },
        { status: 500 }
      )
    }
    
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY environment variable is required' },
        { status: 500 }
      )
    }
    
    const supabaseService = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get all departments
    const { data: departments, error: deptError } = await supabaseService
      .from('departments')
      .select('*')
      .order('name')

    if (deptError) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch departments: ${deptError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      departments: departments || []
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Failed to fetch departments: ${error.message}`
    }, { status: 500 })
  }
}