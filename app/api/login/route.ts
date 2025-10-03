import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Create service role client to bypass RLS for user lookup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseService = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Also create regular client for authentication
    const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return NextResponse.json({
        success: false,
        error: authError.message
      }, { status: 401 })
    }

    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed - no user data'
      }, { status: 401 })
    }

    // Step 2: Get user profile using service role (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseService
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      // Clean up the auth session if profile lookup fails
      console.error('Profile lookup failed:', profileError)
      await supabaseAuth.auth.signOut()
      return NextResponse.json({
        success: false,
        error: 'Profile lookup failed'
      }, { status: 500 })
    }

    if (!profile) {
      await supabaseAuth.auth.signOut()
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 })
    }

    // Step 3: Get department info if user has department
    let department = null
    if (profile.department_id) {
      const { data: deptData } = await supabaseService
        .from('departments')
        .select('name')
        .eq('id', profile.department_id)
        .single()
      
      department = deptData?.name || null
    }

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        department_id: profile.department_id,
        department_name: department,
        doctor_type: profile.doctor_type || null
      },
      session: authData.session
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({
      success: false,
      error: `Login failed: ${error.message}`
    }, { status: 500 })
  }
}