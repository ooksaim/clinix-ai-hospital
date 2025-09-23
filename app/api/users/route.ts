import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, first_name, last_name, role, department_id } = await request.json()

    // Create service role client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseService = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create the auth user using service role
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for admin-created users
      user_metadata: {
        first_name,
        last_name,
        role
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
        role,
        department_id: department_id || null,
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
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name,
        last_name,
        role,
        department_id
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `User creation failed: ${error.message}`
    }, { status: 500 })
  }
}

// GET route to fetch all users
export async function GET(request: NextRequest) {
  try {
    // Create service role client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseService = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get all users with department info
    const { data: users, error: usersError } = await supabaseService
      .from('user_profiles')
      .select(`
        *,
        departments:department_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch users: ${usersError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: users || []
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Failed to fetch users: ${error.message}`
    }, { status: 500 })
  }
}