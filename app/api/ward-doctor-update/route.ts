import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      admission_id,
      doctor_id,
      receiving_notes,
      general_examination,
      expert_opinion_requested,
      diagnosis,
      treatment_plan,
      selectedSupplies
    } = body;

    if (!admission_id || !doctor_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: admission_id and doctor_id' },
        { status: 400 }
      );
    }

    // Verify the doctor is assigned to this admission
    const { data: admission, error: admissionError } = await supabase
      .from('admissions')
      .select('*')
      .eq('id', admission_id)
      .eq('assigned_doctor', doctor_id)
      .single();

    if (admissionError || !admission) {
      return NextResponse.json(
        { success: false, error: 'Admission not found or doctor not assigned to this patient' },
        { status: 404 }
      );
    }

    // Update the admission record with ward doctor notes
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (receiving_notes) updateData.receiving_notes = receiving_notes;
    if (general_examination) updateData.general_examination = general_examination;
    if (expert_opinion_requested !== undefined) updateData.expert_opinion_requested = expert_opinion_requested;
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (treatment_plan) updateData.treatment_plan = treatment_plan;

    const { data: updatedAdmission, error: updateError } = await supabase
      .from('admissions')
      .update(updateData)
      .eq('id', admission_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating admission:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update admission record' },
        { status: 500 }
      );
    }

    // Create a ward doctor treatment history entry for this update
    const { error: treatmentHistoryError } = await supabase
      .from('ward_doctor_treatment_history')
      .insert({
        admission_id: admission_id,
        doctor_id: doctor_id,
        diagnosis: diagnosis,
        treatment_plan: treatment_plan,
        created_at: new Date().toISOString()
      });

    if (treatmentHistoryError) {
      console.error('Error creating treatment history record:', treatmentHistoryError);
      // Don't fail the request if treatment history creation fails
    }

    // Process supplies if any were selected
    if (selectedSupplies && selectedSupplies.length > 0) {
      for (const supply of selectedSupplies) {
        try {
          // First, check current stock
          const { data: currentSupply, error: fetchError } = await supabase
            .from('ward_supplies')
            .select('current_stock')
            .eq('id', supply.supply_id)
            .single();

          if (fetchError || !currentSupply) {
            console.error(`Error fetching supply ${supply.supply_id}:`, fetchError);
            continue;
          }

          // Check if there's enough stock
          if (currentSupply.current_stock < supply.quantity) {
            console.warn(`Insufficient stock for supply ${supply.supply_id}. Available: ${currentSupply.current_stock}, Requested: ${supply.quantity}`);
            continue;
          }

          // Update the stock
          const newStock = currentSupply.current_stock - supply.quantity;
          const { error: updateError } = await supabase
            .from('ward_supplies')
            .update({ 
              current_stock: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', supply.supply_id);

          if (updateError) {
            console.error(`Error updating supply stock for ${supply.supply_id}:`, updateError);
          }

          // Optional: Create a usage record (you can create a supply_usage table for tracking)
          // This helps with inventory management and audit trail
          const { error: usageError } = await supabase
            .from('supply_requests')
            .insert({
              ward_id: admission.ward_id || null, // Use ward_id if available
              supply_id: supply.supply_id,
              requested_by: doctor_id,
              quantity_requested: supply.quantity,
              delivered_quantity: supply.quantity,
              request_status: 'completed',
              request_reason: `Used for patient treatment - Admission: ${admission_id}`,
              delivered_date: new Date().toDateString(),
              notes: `Used by ward doctor for patient care`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (usageError) {
            console.error(`Error creating supply usage record:`, usageError);
            // Don't fail the main request if usage tracking fails
          }

        } catch (supplyError) {
          console.error(`Error processing supply ${supply.supply_id}:`, supplyError);
          // Continue with other supplies even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ward doctor update saved successfully',
      data: updatedAdmission
    });

  } catch (error) {
    console.error('Error in ward doctor update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
