import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing environment variables',
        details: [
          '❌ Missing environment configuration',
          !supabaseUrl ? '❌ NEXT_PUBLIC_SUPABASE_URL not found' : '✅ Supabase URL configured',
          !serviceKey ? '❌ SUPABASE_SERVICE_ROLE_KEY not found' : '✅ Service key configured'
        ]
      })
    }

    const supabaseService = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = {
      connection: false,
      departments: false,
      auth: false,
      error: '',
      details: [] as string[]
    }

    results.details.push('🔄 Starting connection test with service role key...')
    results.details.push('ℹ️  Using service role key for full database access')
    results.details.push(`✅ Supabase URL: ${supabaseUrl.substring(0, 30)}...`)
    results.details.push(`✅ Service Key: ${serviceKey.substring(0, 20)}...`)

    // Test 1: Basic connection
    results.details.push('🔄 Step 1: Testing basic Supabase connection...')
    
    const { data: connectionTest, error: connectionError } = await supabaseService
      .from('departments')
      .select('count')
      .limit(1)

    if (connectionError) {
      results.details.push(`❌ Connection failed: ${connectionError.message}`)
      results.details.push(`❌ Error code: ${connectionError.code}`)
      results.details.push(`❌ Error hint: ${connectionError.hint}`)
      results.connection = false
      results.error = connectionError.message
    } else {
      results.details.push('✅ Service role connection successful')
      results.connection = true
    }

    if (results.connection) {
      // Test 2: Check departments table
      results.details.push('🔄 Step 2: Testing departments table access...')
      
      const { data: deptData, error: deptError } = await supabaseService
        .from('departments')
        .select('id, name, description')
        .limit(5)

      if (deptError) {
        results.details.push(`❌ Departments query failed: ${deptError.message}`)
        results.departments = false
      } else {
        results.details.push(`✅ Departments table accessible, found ${deptData?.length || 0} records`)
        results.departments = true
        if (deptData && deptData.length > 0) {
          results.details.push(`✅ Sample departments: ${deptData.map(d => d.name).join(', ')}`)
        }
      }

      // Test 3: Check user_profiles table
      results.details.push('🔄 Step 3: Testing user_profiles table...')
      
      const { data: profileData, error: profileError } = await supabaseService
        .from('user_profiles')
        .select('count')
        .limit(1)

      if (profileError) {
        if (profileError.code === '42P01') {
          results.details.push(`❌ user_profiles table does not exist`)
        } else {
          results.details.push(`❌ user_profiles access failed: ${profileError.message}`)
        }
        results.auth = false
      } else {
        results.details.push('✅ user_profiles table accessible')
        results.auth = true
        
        // Check count of users
        const { count } = await supabaseService
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
        
        results.details.push(`ℹ️  Found ${count || 0} existing user profiles`)
        
        if (count === 0) {
          results.details.push('ℹ️  Ready for first admin user creation')
        }
      }

      // Test 4: Test other key tables
      results.details.push('🔄 Step 4: Testing other database tables...')
      
      const tables = ['wards', 'beds', 'patients', 'visits', 'tokens']
      for (const table of tables) {
        try {
          const { error: tableError } = await supabaseService
            .from(table)
            .select('count')
            .limit(1)
          
          if (tableError) {
            results.details.push(`⚠️  ${table} table: ${tableError.message}`)
          } else {
            results.details.push(`✅ ${table} table accessible`)
          }
        } catch (err: any) {
          results.details.push(`❌ ${table} table test failed: ${err.message}`)
        }
      }
    }

    // Summary
    if (results.connection && results.departments && results.auth) {
      results.details.push('🎉 All connection tests passed!')
      results.details.push('✅ Database is ready for the hospital management system')
      results.details.push('✅ You can now proceed to create the first admin user')
    } else {
      results.details.push('⚠️  Some tests failed - check the details above')
    }

    results.details.push('🏁 Connection test completed')

    return NextResponse.json({ success: true, results })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: [
        '❌ Unexpected server error',
        `❌ Error: ${error.message}`,
        `❌ Stack: ${error.stack}`
      ]
    })
  }
}