import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    console.log('🔍 Patient search request for:', query)
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Search query must be at least 2 characters' 
      }, { status: 400 })
    }
    
    const searchTerm = query.trim()
    
    // Build search conditions with phone number normalization
    const orConditions = []
    
    // Name searches
    orConditions.push(`first_name.ilike.%${searchTerm}%`)
    orConditions.push(`last_name.ilike.%${searchTerm}%`)
    orConditions.push(`patient_number.ilike.%${searchTerm}%`)
    
    // Phone number search with variants
    if (/^\d+$/.test(searchTerm.replace(/\D/g, ''))) {
      const normalizedPhone = searchTerm.replace(/\D/g, '')
      const phoneVariants = [normalizedPhone]
      
      if (normalizedPhone.startsWith('92')) {
        phoneVariants.push('0' + normalizedPhone.slice(2))
      } else if (normalizedPhone.startsWith('0')) {
        phoneVariants.push('92' + normalizedPhone.slice(1))
      }
      
      phoneVariants.forEach(variant => {
        orConditions.push(`phone.eq.${variant}`)
      })
    }
    
    // CNIC search
    const normalizedCnic = searchTerm.replace(/[-\s]/g, '').toUpperCase()
    orConditions.push(`cnic.eq.${normalizedCnic}`)
    
    console.log('🔍 Searching with conditions:', orConditions.join(' OR '))
    
    // First, get patients with basic info (fast query)
    const { data: patients, error } = await supabase
      .from('patients')
      .select(`
        id,
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        age,
        gender,
        phone,
        cnic
      `)
      .or(orConditions.join(','))
      .eq('is_active', true)
      .limit(10)
    
    if (error) {
      console.error('❌ Search error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Search failed'
      }, { status: 500 })
    }

    console.log('✅ Found patients:', patients?.length || 0)

    // If we have patients, get their visit counts efficiently
    let patientsWithVisits = patients || []
    
    if (patients && patients.length > 0) {
      const patientIds = patients.map(p => p.id)
      
      // Get visit counts for all found patients in one query
      const { data: visitCounts } = await supabase
        .from('visits')
        .select('patient_id')
        .in('patient_id', patientIds)
      
      // Count visits per patient
      const visitCountMap = visitCounts?.reduce((acc: any, visit: any) => {
        acc[visit.patient_id] = (acc[visit.patient_id] || 0) + 1
        return acc
      }, {}) || {}
      
      // Add visit counts to patients
      patientsWithVisits = patients.map(patient => ({
        ...patient,
        visits: visitCountMap[patient.id] || 0
      }))
    }
    
    return NextResponse.json({
      success: true,
      patients: patientsWithVisits,
      total: patientsWithVisits.length
    })
    
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}