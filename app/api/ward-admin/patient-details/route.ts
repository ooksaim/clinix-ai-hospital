import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bedId = searchParams.get('bed_id')
    const admissionId = searchParams.get('admission_id')

    if (!bedId && !admissionId) {
      return NextResponse.json(
        { success: false, error: 'Either bed_id or admission_id is required' },
        { status: 400 }
      )
    }

    // Handle admission_id parameter - fetch patient details by admission ID
    if (admissionId) {
      console.log(`🔍 Fetching patient details for admission ID: ${admissionId}`)

      // Get admission details
      const { data: admissionData, error: admissionError } = await supabase
        .from('admissions')
        .select(`
          id, admission_number, admission_reason, admission_type, admission_date, 
          expected_discharge_date, admission_status, diagnosis, treatment_plan, 
          created_at, patient_id, requested_by, assigned_doctor, bed_id
        `)
        .eq('id', admissionId)
        .single()

      if (admissionError || !admissionData) {
        console.error('Error fetching admission data:', admissionError)
        return NextResponse.json(
          { success: false, error: 'Admission not found' },
          { status: 404 }
        )
      }

      // Get patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', admissionData.patient_id)
        .single()

      if (patientError || !patientData) {
        console.error('Error fetching patient data:', patientError)
        return NextResponse.json(
          { success: false, error: 'Patient not found' },
          { status: 404 }
        )
      }

      // Get bed details if bed_id exists
      let bedData = null
      let wardData = null
      
      if (admissionData.bed_id) {
        const { data: bed, error: bedError } = await supabase
          .from('beds')
          .select('id, bed_number, bed_type, status, ward_id')
          .eq('id', admissionData.bed_id)
          .single()

        if (!bedError && bed) {
          bedData = bed
          
          // Get ward details
          const { data: ward, error: wardError } = await supabase
            .from('wards')
            .select('id, name, ward_type')
            .eq('id', bed.ward_id)
            .single()

          if (!wardError && ward) {
            wardData = ward
          }
        }
      }

      // Format response data
      const responseData = {
        id: bedData?.id || 'N/A',
        bed_number: bedData?.bed_number || 'Unassigned',
        bed_type: bedData?.bed_type || 'N/A',
        bed_status: bedData?.status || 'unassigned',
        admission: {
          ...admissionData,
          patient: patientData
        },
        ward: wardData || { name: 'Unassigned', ward_type: 'N/A' }
      }

      return NextResponse.json({
        success: true,
        data: responseData
      })
    }

    console.log(`🔍 Fetching patient details for bed ID: ${bedId}`)

    // Step 1: Get bed basic info
    const { data: bedData, error: bedError } = await supabase
      .from('beds')
      .select('id, bed_number, bed_type, status, current_patient_id, ward_id')
      .eq('id', bedId)
      .single()

    console.log('🔍 Bed data retrieved:', { bedData, bedError })

    if (bedError) {
      console.error('Error fetching bed data:', bedError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bed data' },
        { status: 500 }
      )
    }

    if (!bedData || bedData.status !== 'occupied') {
      return NextResponse.json(
        { success: false, error: 'Bed not found or not occupied' },
        { status: 404 }
      )
    }

    // Step 2: Get ward info
    const { data: wardData, error: wardError } = await supabase
      .from('wards')
      .select('id, name, ward_type')
      .eq('id', bedData.ward_id)
      .single()

    // Step 3: Get active admission for this bed
    console.log(`🔍 Looking for admission with bed_id: ${bedId}`)
    
    const { data: admissionData, error: admissionError } = await supabase
      .from('admissions')
      .select('id, admission_number, admission_reason, admission_type, admission_date, expected_discharge_date, admission_status, diagnosis, treatment_plan, created_at, patient_id, requested_by, assigned_doctor')
      .eq('bed_id', bedId)
      .eq('admission_status', 'approved')
      .maybeSingle()

    console.log('🔍 Admission query result:', { admissionData, admissionError })

    if (admissionError) {
      console.error('Error fetching admission data:', admissionError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch admission data' },
        { status: 500 }
      )
    }

    if (!admissionData) {
      // Return a response indicating no admission record exists
      const basicData = {
        id: bedData.id,
        bed_number: bedData.bed_number,
        bed_type: bedData.bed_type,
        bed_status: bedData.status,
        ward: wardData,
        admission: null // No admission record
      }

      return NextResponse.json({
        success: true,
        data: basicData,
        message: 'Bed is occupied but no admission record found'
      })
    }

    // Step 4: Get patient details
    console.log(`🔍 Looking for patient with ID: ${admissionData.patient_id}`)
    
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*') // Fetch all fields from the patients table
      .eq('id', admissionData.patient_id)
      .single()

    console.log('🔍 Patient query result:', { patientData, patientError })

    if (patientError) {
      console.error('Error fetching patient data:', patientError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch patient data' },
        { status: 500 }
      )
    }

    // Step 5: Get requesting doctor details (optional)
    let requestingDoctor = null
    if (admissionData.requested_by) {
      const { data: reqDoc } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, specialization')
        .eq('id', admissionData.requested_by)
        .single()
      requestingDoctor = reqDoc
    }

    // Step 6: Get assigned doctor details (optional)
    let assignedDoctor = null
    if (admissionData.assigned_doctor) {
      const { data: assDoc } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, specialization')
        .eq('id', admissionData.assigned_doctor)
        .single()
      assignedDoctor = assDoc
    }

    // Step 7: Combine all data
    const combinedData = {
      id: bedData.id,
      bed_number: bedData.bed_number,
      bed_type: bedData.bed_type,
      bed_status: bedData.status,
      ward: wardData,
      admission: {
        ...admissionData,
        patient: patientData,
        requesting_doctor: requestingDoctor,
        assigned_doctor: assignedDoctor
      }
    }

    console.log('✅ Successfully fetched patient details')

    return NextResponse.json({
      success: true,
      data: combinedData
    })

  } catch (error) {
    console.error('Error in patient details API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}