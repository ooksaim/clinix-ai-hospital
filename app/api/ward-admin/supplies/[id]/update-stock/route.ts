import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { change } = body
    
    // Validate change value
    if (change === undefined || change === null) {
      return NextResponse.json(
        { error: 'change value is required' },
        { status: 400 }
      )
    }
    
    const numericChange = Number(change)
    
    if (Number.isNaN(numericChange) || !Number.isInteger(numericChange) || !Number.isSafeInteger(numericChange)) {
      return NextResponse.json(
        { error: 'change must be a valid integer' },
        { status: 400 }
      )
    }
    
    if (numericChange < -1000000 || numericChange > 1000000) {
      return NextResponse.json(
        { error: 'change value out of safe range (-1,000,000 to 1,000,000)' },
        { status: 400 }
      )
    }
    const supplyId = params.id

    console.log(`🏥 Ward Admin - Updating stock for supply ${supplyId}, change: ${change}`)

    // First, get the current stock
    const { data: currentSupply, error: fetchError } = await supabase
      .from('ward_supplies')
      .select('current_stock, supply_name')
      .eq('id', supplyId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching current supply:', fetchError)
      return NextResponse.json({ error: 'Supply not found' }, { status: 404 })
    }

    const newStock = Math.max(0, currentSupply.current_stock + change)

    // Update the stock
    const { data: updatedSupply, error: updateError } = await supabase
      .from('ward_supplies')
      .update({ 
        current_stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', supplyId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating supply stock:', updateError)
      return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 })
    }

  console.log(`✅ Updated stock for ${currentSupply.supply_name}: ${currentSupply.current_stock} → ${newStock}`)

    return NextResponse.json({
      success: true,
      supply: updatedSupply,
      previousStock: currentSupply.current_stock,
      newStock: newStock,
      change: change
    })

  } catch (error) {
    console.error('❌ Unexpected error in update stock API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}