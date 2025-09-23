import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🧪 Creating test data for doctor queue...')

    // First check if we have any test data already
    const { data: existingVisits } = await supabase
      .from('visits')
      .select('id')
      .eq('visit_date', new Date().toISOString().split('T')[0])
      .limit(1)

    if (existingVisits && existingVisits.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test data already exists',
        data: existingVisits
      })
    }

    // Create test patient first
    const { data: testPatient, error: patientError } = await supabase
      .from('patients')
      .insert({
        patient_number: 'TEST001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1980-01-01',
        gender: 'male',
        phone: '1234567890',
        address: '123 Test Street',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '0987654321'
      })
      .select()
      .single()

    if (patientError) {
      console.error('Error creating test patient:', patientError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create test patient: ' + patientError.message 
      }, { status: 500 })
    }

    console.log('✅ Created test patient:', testPatient.id)

    // Create test visits
    const testVisits = [
      {
        visit_number: 'V001',
        patient_id: testPatient.id,
        department_id: 'DEPT001',
        assigned_doctor_id: 'DOC001',
        visit_type: 'opd',
        chief_complaint: 'Fever and headache',
        symptoms: 'High fever, severe headache, body aches',
        visit_status: 'waiting',
        priority: 'normal',
        visit_date: new Date().toISOString().split('T')[0],
        checkin_time: new Date().toISOString()
      },
      {
        visit_number: 'V002', 
        patient_id: testPatient.id,
        department_id: 'DEPT001',
        assigned_doctor_id: 'DOC001',
        visit_type: 'opd',
        chief_complaint: 'Chest pain',
        symptoms: 'Mild chest pain, shortness of breath',
        visit_status: 'waiting',
        priority: 'high',
        visit_date: new Date().toISOString().split('T')[0],
        checkin_time: new Date().toISOString()
      }
    ]

    const { data: createdVisits, error: visitsError } = await supabase
      .from('visits')
      .insert(testVisits)
      .select()

    if (visitsError) {
      console.error('Error creating test visits:', visitsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create test visits: ' + visitsError.message 
      }, { status: 500 })
    }

    console.log('✅ Created test visits:', createdVisits.length)

    // Create tokens for the visits
    const testTokens = createdVisits.map((visit, index) => ({
      token_number: String(index + 1).padStart(3, '0'),
      visit_id: visit.id,
      department_id: 'DEPT001',
      token_status: 'waiting',
      issued_at: new Date().toISOString()
    }))

    const { data: createdTokens, error: tokensError } = await supabase
      .from('tokens')
      .insert(testTokens)
      .select()

    if (tokensError) {
      console.error('Error creating test tokens:', tokensError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create test tokens: ' + tokensError.message 
      }, { status: 500 })
    }

    console.log('✅ Created test tokens:', createdTokens.length)

    return NextResponse.json({ 
      success: true, 
      message: 'Test data created successfully',
      data: {
        patient: testPatient,
        visits: createdVisits,
        tokens: createdTokens
      }
    })

  } catch (error) {
    console.error('💥 Error creating test data:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}