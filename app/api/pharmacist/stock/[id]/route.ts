import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`💊 Pharmacist - Updating stock item ${params.id}...`)

    const body = await request.json()
    const {
      current_stock,
      minimum_stock_level,
      maximum_stock_level,
      cost_per_unit,
      supplier,
      expiry_date,
      batch_number,
      notes,
      pharmacist_id,
      update_type = 'adjustment' // adjustment, restock, or correction
    } = body

    if (current_stock === undefined || current_stock === null) {
      return NextResponse.json({ 
        error: 'current_stock is required' 
      }, { status: 400 })
    }

    // Validate current_stock is a positive number
    const stockValue = Number(current_stock)
    if (Number.isNaN(stockValue) || !Number.isFinite(stockValue) || stockValue < 0) {
      return NextResponse.json({ 
        error: 'current_stock must be a valid positive number' 
      }, { status: 400 })
    }

    // Get current item data
    const { data: currentItem, error: fetchError } = await supabase
      .from('pharmacy_stock')
      .select('*')
      .eq('id', params.id)
      .eq('is_active', true)
      .single()

    if (fetchError || !currentItem) {
      return NextResponse.json({ 
        error: 'Stock item not found' 
      }, { status: 404 })
    }

    const previousStock = currentItem.current_stock || 0
    const newStock = parseInt(current_stock)
    const stockDifference = newStock - previousStock

    console.log(`📦 Stock Update:`)
    console.log(`   Item: ${currentItem.supply_name}`)
    console.log(`   Previous: ${previousStock}`)
    console.log(`   New: ${newStock}`)
    console.log(`   Difference: ${stockDifference}`)
    console.log(`   Type: ${update_type}`)

    // Update the stock item
    const updateData: any = {
      current_stock: stockValue,
      updated_at: new Date().toISOString()
    }

    // Add optional fields if provided
    if (minimum_stock_level !== undefined) updateData.minimum_stock_level = minimum_stock_level
    if (maximum_stock_level !== undefined) updateData.maximum_stock_level = maximum_stock_level
    if (cost_per_unit !== undefined) updateData.cost_per_unit = parseFloat(cost_per_unit)
    if (supplier !== undefined) updateData.supplier = supplier
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date
    if (batch_number !== undefined) updateData.batch_number = batch_number
    if (notes !== undefined) updateData.notes = notes

    // If stock is being increased, update restock date
    if (stockDifference > 0) {
      updateData.last_restocked_date = new Date().toISOString().split('T')[0]
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('pharmacy_stock')
      .update(updateData)
      .eq('id', params.id)
      .select()

    if (updateError) {
      console.error('❌ Error updating stock:', updateError)
      return NextResponse.json({ error: 'Failed to update stock item' }, { status: 500 })
    }

    // Create transaction record if stock quantity changed
    if (stockDifference !== 0 && pharmacist_id) {
      const transactionType = stockDifference > 0 
        ? (update_type === 'restock' ? 'restock' : 'stock_increase')
        : 'stock_decrease'

      await supabase
        .from('pharmacy_transactions')
        .insert({
          transaction_type: transactionType,
          pharmacy_supply_id: params.id,
          quantity: Math.abs(stockDifference),
          previous_stock: previousStock,
          new_stock: newStock,
          performed_by: pharmacist_id,
          notes: notes || `${update_type}: ${currentItem.supply_name} (${stockDifference > 0 ? '+' : ''}${stockDifference})`
        })
    }

    console.log('✅ Stock item updated successfully')

    return NextResponse.json({
      success: true,
      item: updatedItem[0],
      changes: {
        stock_difference: stockDifference,
        update_type,
        previous_stock: previousStock,
        new_stock: newStock
      },
      message: `Stock updated for '${currentItem.supply_name}'`
    })

  } catch (error) {
    console.error('💥 Error in stock update PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`💊 Pharmacist - Deactivating stock item ${params.id}...`)

    const { data: item, error } = await supabase
      .from('pharmacy_stock')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()

    if (error || !item.length) {
      return NextResponse.json({ 
        error: 'Stock item not found or failed to deactivate' 
      }, { status: 404 })
    }

    console.log(`✅ Stock item deactivated: ${item[0].supply_name}`)

    return NextResponse.json({
      success: true,
      message: `Stock item '${item[0].supply_name}' has been deactivated`
    })

  } catch (error) {
    console.error('💥 Error in stock delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}