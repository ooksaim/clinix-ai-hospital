impexport async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, first_name, last_name } = body

    // Validate required fields
    if (!email?.trim()) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (!first_name?.trim()) {
      return Response.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!last_name?.trim()) {
      return Response.json(
        { error: 'Last name is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Normalize inputs
    const normalizedEmail = email.trim().toLowerCase()
    const trimmedFirstName = first_name.trim()
    const trimmedLastName = last_name.trim() { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, first_name, last_name } = await request.json()

    // Create service role client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseService = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First check if any users already exist
    const { count, error: countError } = await supabaseService
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({
        success: false,
        error: `Database error: ${countError.message}`
      }, { status: 500 })
    }

    if (count && count > 0) {
      return NextResponse.json({
        success: false,
        error: 'Admin user already exists. This endpoint is only for first-time setup.'
      }, { status: 400 })
    }

    // Create the auth user using service role
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since this is admin setup
      user_metadata: {
        first_name,
        last_name,
        role: 'admin'
      }
    })

    if (authError) {
      return NextResponse.json({
        success: false,
        error: `Failed to create auth user: ${authError.message}`
      }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'User creation failed - no user data returned'
      }, { status: 500 })
    }

    // Create the user profile using service role (bypasses RLS)
    const { error: profileError } = await supabaseService
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        first_name,
        last_name,
        role: 'admin',
        department_id: null, // Admin doesn't need department
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      // If profile creation fails, clean up the auth user
      await supabaseService.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        success: false,
        error: `Failed to create user profile: ${profileError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name,
        last_name,
        role: 'admin'
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Setup failed: ${error.message}`
    }, { status: 500 })
  }
}