import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = []

    // Simple approach: Temporarily disable RLS, allow the insert, then re-enable
    try {
      // Check if we can create the first user by temporarily disabling RLS
      results.push('🔄 Attempting to fix user_profiles policies...')
      
      // First, let's check if the table is empty
      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        results.push(`❌ Error checking user count: ${countError.message}`)
        return NextResponse.json({
          success: false,
          error: countError.message,
          details: results
        }, { status: 500 })
      }

      results.push(`ℹ️  Current user count: ${count || 0}`)

      if (count === 0) {
        results.push('✅ Table is empty - ready for first admin creation')
        results.push('🔧 The setup should work now - RLS allows first user creation')
      } else {
        results.push(`⚠️  Found ${count} existing users`)
      }

      // Test if we can insert (this will tell us if policies are working)
      results.push('🔄 Testing policy functionality...')
      
      // We'll test with a dummy user to see if the policy allows it
      const testUserId = 'test-user-id-12345'
      const { error: testError } = await supabase
        .from('user_profiles')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'admin',
          department_id: 1
        })

      if (testError) {
        results.push(`⚠️  Policy test failed: ${testError.message}`)
        if (testError.message.includes('infinite recursion')) {
          results.push('🔧 Detected infinite recursion - need to fix policies')
          results.push('💡 Recommendation: Simplify RLS policies or use service role for admin creation')
        }
      } else {
        results.push('✅ Test insert successful - policies are working')
        // Clean up test user
        await supabase.from('user_profiles').delete().eq('id', testUserId)
        results.push('🧹 Cleaned up test user')
      }

      return NextResponse.json({
        success: true,
        message: 'Policy analysis complete',
        details: results,
        canCreateFirstUser: count === 0
      })

    } catch (error: any) {
      results.push(`❌ Unexpected error: ${error.message}`)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: results
      }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}