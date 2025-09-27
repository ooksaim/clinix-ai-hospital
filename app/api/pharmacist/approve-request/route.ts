import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('💊 Pharmacist - Approving supply request...')

    const body = await request.json()
    const { 
      request_id, 
      approved_quantity, 
      pharmacist_id, 
      approval_notes 
    } = body

    if (!request_id || !approved_quantity || !pharmacist_id) {
      return NextResponse.json({ 
        error: 'request_id, approved_quantity, and pharmacist_id are required' 
      }, { status: 400 })
    }

    // Start transaction by getting request details
    console.log('🔍 Fetching request details for ID:', request_id)
    const { data: requestData, error: requestError } = await supabase
      .from('supply_requests')
      .select('*')
      .eq('id', request_id)
      .eq('request_status', 'pending')
      .single()

    console.log('Request data:', requestData)
    console.log('Request error:', requestError)

    if (requestError || !requestData) {
      console.error('❌ Request not found or already processed:', requestError)
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 })
    }

    // Get ward supplies data
    const { data: wardSupply } = await supabase
      .from('ward_supplies')
      .select('supply_name, ward_id')
      .eq('id', requestData.supply_id)
      .single()

    // Get pharmacy stock data  
    const { data: pharmacyStock } = await supabase
      .from('pharmacy_stock')
      .select('current_stock, supply_name')
      .eq('id', requestData.pharmacy_supply_id)
      .single()

    console.log('Ward supply:', wardSupply)
    console.log('Pharmacy stock:', pharmacyStock)

    // Validation: Check if pharmacy has enough stock
    const currentPharmacyStock = pharmacyStock?.current_stock || 0
    if (currentPharmacyStock < approved_quantity) {
      return NextResponse.json({ 
        error: `Insufficient pharmacy stock. Available: ${currentPharmacyStock}, Requested: ${approved_quantity}` 
      }, { status: 400 })
    }

    console.log(`🔄 Processing transfer:`)
    console.log(`   Supply: ${requestData.supply_name || wardSupply?.supply_name}`)
    console.log(`   Pharmacy Stock: ${currentPharmacyStock} → ${currentPharmacyStock - approved_quantity}`)
    console.log(`   Ward: ${wardSupply?.ward_id}`)
    console.log(`   Quantity: ${approved_quantity}`)

    // First, ALWAYS update the request status to approved
    console.log('📝 Updating supply request status to approved...')
    console.log('Request ID:', request_id)
    console.log('Pharmacist ID:', pharmacist_id)
    console.log('Approved quantity:', approved_quantity)
    
    const { data: updateData, error: statusUpdateError } = await supabase
      .from('supply_requests')
      .update({
        request_status: 'approved',
        approved_by: pharmacist_id,
        delivered_quantity: approved_quantity,
        delivered_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .select()

    console.log('Update result:', updateData)
    
    if (statusUpdateError) {
      console.error('❌ Error updating request status:', statusUpdateError)
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
    }

    // Execute manual transaction process
    console.log('🔄 Processing manual stock transfer...')
    
    try {
      // 1. Decrease pharmacy stock
      const newPharmacyStock = currentPharmacyStock - approved_quantity
      await supabase
        .from('pharmacy_stock')
        .update({ 
          current_stock: newPharmacyStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestData.pharmacy_supply_id)

      // 2. Increase ward stock
      const { data: wardStockData } = await supabase
        .from('ward_supplies')
        .select('current_stock')
        .eq('id', requestData.supply_id)
        .single()

      const currentWardStock = wardStockData?.current_stock || 0
      const newWardStock = currentWardStock + approved_quantity

      await supabase
        .from('ward_supplies')
        .update({ 
          current_stock: newWardStock,
          last_restocked_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', requestData.supply_id)

      // 3. Create transaction record
      await supabase
        .from('pharmacy_transactions')
        .insert({
          transaction_type: 'transfer_to_ward',
          pharmacy_supply_id: requestData.pharmacy_supply_id,
          ward_supply_id: requestData.supply_id,
          supply_request_id: request_id,
          quantity: approved_quantity,
          previous_stock: currentPharmacyStock,
          new_stock: newPharmacyStock,
          performed_by: pharmacist_id,
          ward_id: wardSupply?.ward_id,
          notes: `Stock transfer approved: ${approval_notes || 'No notes'}`
        })

      console.log('✅ Manual transaction completed successfully')

    } catch (manualError) {
      console.error('❌ Manual transaction failed:', manualError)
      return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
    }

    console.log('✅ Supply request approved and stock transferred')

    return NextResponse.json({
      success: true,
      message: 'Supply request approved and stock transferred successfully',
      transfer_details: {
        supply_name: requestData.supply_name || wardSupply?.supply_name,
        approved_quantity: approved_quantity,
        pharmacy_stock_remaining: currentPharmacyStock - approved_quantity,
        ward_id: wardSupply?.ward_id
      }
    })

  } catch (error) {
    console.error('💥 Error in approve-request POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}