import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { visitId, doctorId, consultationData } = await request.json()

    if (!visitId || !doctorId || !consultationData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Update visit record with consultation data (using existing visits table)
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .update({
        chief_complaint: consultationData.chiefComplaint,
        symptoms: consultationData.historyOfPresentIllness,
        examination_notes: consultationData.physicalExamination,
        diagnosis: consultationData.diagnosis,
        treatment_plan: consultationData.treatmentPlan,
        follow_up_instructions: consultationData.followUpInstructions,
        consultation_start_time: consultationData.consultationStartTime || new Date().toISOString(),
        consultation_end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', visitId)
      .select()
      .single()

    if (visitError) {
      console.error('Error updating visit:', visitError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save consultation data',
        details: visitError.message 
      }, { status: 500 })
    }

    // Save vital signs if provided (using existing patient_vitals table)
    if (consultationData.vitalSigns && Object.keys(consultationData.vitalSigns).length > 0) {
      const vitalSigns = consultationData.vitalSigns
      const vitalData: any = {
        patient_id: visit.patient_id,
        visit_id: visitId,
        recorded_by: doctorId,
        recorded_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      // Parse blood pressure
      if (vitalSigns.bloodPressure) {
        const bpParts = vitalSigns.bloodPressure.split('/')
        if (bpParts.length === 2) {
          vitalData.systolic_bp = parseInt(bpParts[0]) || null
          vitalData.diastolic_bp = parseInt(bpParts[1]) || null
        }
      }

      // Add other vital signs
      if (vitalSigns.temperature) vitalData.temperature = parseFloat(vitalSigns.temperature) || null
      if (vitalSigns.heartRate) vitalData.heart_rate = parseInt(vitalSigns.heartRate) || null
      if (vitalSigns.respiratoryRate) vitalData.respiratory_rate = parseInt(vitalSigns.respiratoryRate) || null
      if (vitalSigns.oxygenSaturation) vitalData.oxygen_saturation = parseInt(vitalSigns.oxygenSaturation) || null
      if (vitalSigns.weight) vitalData.weight = parseFloat(vitalSigns.weight) || null
      if (vitalSigns.height) vitalData.height = parseFloat(vitalSigns.height) || null

      // Calculate BMI if height and weight are available
      if (vitalData.weight && vitalData.height) {
        const heightInMeters = vitalData.height / 100
        vitalData.bmi = parseFloat((vitalData.weight / (heightInMeters * heightInMeters)).toFixed(1))
      }

      const { error: vitalError } = await supabase
        .from('patient_vitals')
        .insert(vitalData)

      if (vitalError) {
        console.error('Error saving vital signs:', vitalError)
        // Don't fail the whole request, just log the error
      }
    }

    // Save prescriptions if any (using existing medication_orders table)
    if (consultationData.prescriptions && consultationData.prescriptions.length > 0) {
      const prescriptions = []
      
      for (const rx of consultationData.prescriptions) {
        if (!rx.medication || !rx.dosage || !rx.frequency) continue

        // For now, we'll store medication name directly
        // In a real system, you'd lookup medication_id from medications table
        const prescriptionData = {
          order_number: `MED-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          patient_id: visit.patient_id,
          visit_id: visitId,
          medication_id: null, // Would need to lookup from medications table
          prescribed_by: doctorId,
          dosage: rx.dosage,
          frequency: rx.frequency,
          route: 'oral', // Default route
          duration_days: rx.duration ? parseInt(rx.duration.replace(/\D/g, '')) || null : null,
          instructions: rx.instructions || '',
          indication: consultationData.diagnosis || '',
          order_status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Create a temporary medication record if it doesn't exist
        const { data: existingMed } = await supabase
          .from('medications')
          .select('id')
          .eq('name', rx.medication)
          .single()

        if (existingMed) {
          prescriptionData.medication_id = existingMed.id
        } else {
          // Create new medication record
          const { data: newMed, error: medError } = await supabase
            .from('medications')
            .insert({
              name: rx.medication,
              generic_name: rx.medication,
              dosage_form: 'tablet',
              is_active: true,
              requires_prescription: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single()

          if (!medError && newMed) {
            prescriptionData.medication_id = newMed.id
          }
        }

        prescriptions.push(prescriptionData)
      }

      if (prescriptions.length > 0) {
        const { error: prescriptionError } = await supabase
          .from('medication_orders')
          .insert(prescriptions)

        if (prescriptionError) {
          console.error('Error saving prescriptions:', prescriptionError)
          // Don't fail the whole request, just log the error
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: visit,
      message: 'Consultation saved successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const visitId = searchParams.get('visit_id')
    const doctorId = searchParams.get('doctor_id')

    if (!visitId && !doctorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either visit_id or doctor_id is required' 
      }, { status: 400 })
    }

    // Get consultation data from visits table
    let visitQuery = supabase
      .from('visits')
      .select(`
        *,
        patient:patients(*),
        department:departments(*),
        doctor:user_profiles(*)
      `)

    if (visitId) {
      visitQuery = visitQuery.eq('id', visitId)
    } else if (doctorId) {
      visitQuery = visitQuery.eq('assigned_doctor_id', doctorId)
    }

    const { data: visits, error: visitError } = await visitQuery
      .order('created_at', { ascending: false })

    if (visitError) {
      console.error('Error fetching consultations:', visitError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch consultations',
        details: visitError.message 
      }, { status: 500 })
    }

    // Get related data for each visit
    const consultations = []
    for (const visit of visits || []) {
      // Get vital signs
      const { data: vitals } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('visit_id', visit.id)
        .order('recorded_at', { ascending: false })
        .limit(1)

      // Get prescriptions
      const { data: prescriptions } = await supabase
        .from('medication_orders')
        .select(`
          *,
          medication:medications(*)
        `)
        .eq('visit_id', visit.id)
        .order('created_at', { ascending: false })

      consultations.push({
        ...visit,
        vital_signs: vitals?.[0] || null,
        prescriptions: prescriptions || []
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: consultations 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}