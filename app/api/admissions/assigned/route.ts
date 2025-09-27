import { NextRequest, NextResponse } from 'next/server'
import { startApiSpan, attachDiagHeaders } from '@/lib/observability'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const span = startApiSpan('admissions.assigned')
  try {
  const { searchParams } = new URL(request.url)
  // Accept either a single doctor_id or comma-separated doctor_ids
  const doctorIdRaw = searchParams.get('doctor_id') || searchParams.get('doctor_ids')
  const debugMode = searchParams.get('debug') === '1'
  const requestedDoctorIds: string[] = doctorIdRaw ? doctorIdRaw.split(',').map(s => s.trim()).filter(Boolean) : []

    // Diagnostic: log whether the service role key is present in this process
    console.log('admissions.assigned: SUPABASE_SERVICE_ROLE_KEY present?', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Fetch admissions that have an assigned_doctor (and are active/approved)
    let query = supabase
      .from('admissions')
      .select(`
        id,
        admission_number,
        admission_status,
        admission_reason,
        ward_id,
        bed_id,
        patient_id,
        assigned_doctor,
        created_at,
        patient:patient_id ( id, patient_number, first_name, last_name, age, gender )
      `)
      .in('admission_status', ['approved', 'active'])
      .order('created_at', { ascending: false })

    if (requestedDoctorIds.length > 0) {
      // If the client requested specific doctor ids, limit to those
      query = query.in('assigned_doctor', requestedDoctorIds)
    } else {
      // Only return rows where an assigned_doctor exists
      query = query.not('assigned_doctor', 'is', null)
    }

    const { data: admissions, error } = await query

    if (error) {
      console.error('Error fetching assigned admissions:', error)
      const res = NextResponse.json({ success: false, error: 'Failed to fetch assigned admissions' }, { status: 500 })
      span.end(res)
      const wrapped = attachDiagHeaders(res, span)
      return new NextResponse(res.body, wrapped)
    }

    // Debug logging: number of admissions fetched
    console.log('admissions.assigned: fetched admissions count =', (admissions || []).length)
    if (debugMode) {
      console.log('admissions.assigned: sample rows (first 5):', (admissions || []).slice(0, 5))
    }
    // Group by assigned_doctor
    const byDoctor: Record<string, any[]> = {}
    for (const a of (admissions || [])) {
      const id = a.assigned_doctor || 'unassigned'
      if (!byDoctor[id]) byDoctor[id] = []
      byDoctor[id].push({
        admissionId: a.id,
        admissionNumber: a.admission_number,
        admissionStatus: a.admission_status,
        admissionReason: a.admission_reason, // Add this field
        wardId: a.ward_id,
        bedId: a.bed_id,
        patientId: a.patient_id,
        patient: a.patient || null,
        createdAt: a.created_at
      })
    }

    // Ensure requested doctor ids exist in the response map (with empty arrays if none found)
    if (requestedDoctorIds.length > 0) {
      for (const rid of requestedDoctorIds) {
        if (!byDoctor[rid]) byDoctor[rid] = []
      }
    }

    console.log('admissions.assigned: doctor keys =', Object.keys(byDoctor))

  // If debug mode requested include a small sample of raw rows to help diagnose visibility
  const payload: any = { success: true, data: { admissions: admissions || [], byDoctor }, meta: { admissionsCount: (admissions || []).length } }
  if (debugMode) payload.debug = { sample: (admissions || []).slice(0, 5) }

  const res = NextResponse.json(payload)
    span.end(res)
    const wrapped = attachDiagHeaders(res, span)
    return new NextResponse(res.body, wrapped)

  } catch (err) {
    console.error('Internal error in admissions.assigned:', err)
    const res = NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    span.end(res)
    const wrapped = attachDiagHeaders(res, span)
    return new NextResponse(res.body, wrapped)
  }
}
