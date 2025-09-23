import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Sample departments data
    const departments = [
      { name: 'Internal Medicine', description: 'General medical care and consultation' },
      { name: 'Cardiology', description: 'Heart and cardiovascular system treatment' },
      { name: 'Emergency', description: 'Emergency medical services' },
      { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents' },
      { name: 'Orthopedics', description: 'Bone, joint, and muscle treatment' },
      { name: 'Neurology', description: 'Brain and nervous system disorders' },
      { name: 'Dermatology', description: 'Skin, hair, and nail treatment' },
      { name: 'Gynecology', description: 'Women\'s reproductive health' },
      { name: 'ENT', description: 'Ear, nose, and throat treatment' },
      { name: 'Ophthalmology', description: 'Eye care and vision treatment' }
    ]

    // Check if departments already exist
    const { data: existingDepts } = await supabase
      .from('departments')
      .select('id')
      .limit(1)

    if (existingDepts && existingDepts.length > 0) {
      return NextResponse.json({ 
        message: 'Departments already exist',
        count: existingDepts.length 
      })
    }

    // Insert departments
    const { data, error } = await supabase
      .from('departments')
      .insert(departments)
      .select()

    if (error) {
      console.error('Error creating departments:', error)
      return NextResponse.json(
        { error: 'Failed to create departments', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Departments created successfully',
      departments: data,
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET() // Same logic for both GET and POST
}