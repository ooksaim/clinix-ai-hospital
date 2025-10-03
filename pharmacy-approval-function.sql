-- Stored procedure for seamless supply approval workflow
-- This ensures atomic transactions for stock transfers

CREATE OR REPLACE FUNCTION process_supply_approval(
  p_request_id UUID,
  p_approved_quantity INTEGER,
  p_pharmacist_id UUID,
  p_approval_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_supply_request RECORD;
  v_pharmacy_stock RECORD;
  v_ward_supply RECORD;
  v_new_pharmacy_stock INTEGER;
  v_new_ward_stock INTEGER;
  v_result JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- Get supply request details
    SELECT sr.*, ws.supply_name, ws.ward_id, ws.current_stock as ward_current_stock
    INTO v_supply_request
    FROM supply_requests sr
    JOIN ward_supplies ws ON sr.supply_id = ws.id
    WHERE sr.id = p_request_id AND sr.request_status = 'pending';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Supply request not found or already processed';
    END IF;
    
    -- Get pharmacy stock details
    SELECT *
    INTO v_pharmacy_stock
    FROM pharmacy_stock
    WHERE id = v_supply_request.pharmacy_supply_id AND is_active = true;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pharmacy stock not found';
    END IF;
    
    -- Check if pharmacy has enough stock
    IF v_pharmacy_stock.current_stock < p_approved_quantity THEN
      RAISE EXCEPTION 'Insufficient pharmacy stock. Available: %, Requested: %', 
        v_pharmacy_stock.current_stock, p_approved_quantity;
    END IF;
    
    -- Calculate new stock levels
    v_new_pharmacy_stock := v_pharmacy_stock.current_stock - p_approved_quantity;
    v_new_ward_stock := v_supply_request.ward_current_stock + p_approved_quantity;
    
    -- Update supply request status
    UPDATE supply_requests
    SET 
      request_status = 'approved',
      approved_by = p_pharmacist_id,
      delivered_quantity = p_approved_quantity,
      delivered_date = CURRENT_DATE,
      notes = COALESCE(notes || ' | ', '') || COALESCE(p_approval_notes, 'Approved by pharmacist'),
      updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Update pharmacy stock
    UPDATE pharmacy_stock
    SET 
      current_stock = v_new_pharmacy_stock,
      updated_at = NOW()
    WHERE id = v_pharmacy_stock.id;
    
    -- Update ward stock
    UPDATE ward_supplies
    SET 
      current_stock = v_new_ward_stock,
      last_restocked_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = v_supply_request.supply_id;
    
    -- Create transaction record
    INSERT INTO pharmacy_transactions (
      transaction_type,
      pharmacy_supply_id,
      ward_supply_id,
      supply_request_id,
      quantity,
      previous_stock,
      new_stock,
      performed_by,
      ward_id,
      notes
    ) VALUES (
      'transfer_to_ward',
      v_pharmacy_stock.id,
      v_supply_request.supply_id,
      p_request_id,
      p_approved_quantity,
      v_pharmacy_stock.current_stock,
      v_new_pharmacy_stock,
      p_pharmacist_id,
      v_supply_request.ward_id,
      format('Stock transfer: %s units of %s to ward %s. %s', 
        p_approved_quantity, 
        v_supply_request.supply_name,
        v_supply_request.ward_id,
        COALESCE(p_approval_notes, '')
      )
    );
    
    -- Prepare success result
    v_result := json_build_object(
      'success', true,
      'message', 'Supply request approved and stock transferred successfully',
      'transfer_details', json_build_object(
        'supply_name', v_supply_request.supply_name,
        'approved_quantity', p_approved_quantity,
        'pharmacy_stock_before', v_pharmacy_stock.current_stock,
        'pharmacy_stock_after', v_new_pharmacy_stock,
        'ward_stock_before', v_supply_request.ward_current_stock,
        'ward_stock_after', v_new_ward_stock,
        'ward_id', v_supply_request.ward_id
      )
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN others THEN
    -- Rollback will happen automatically
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_supply_approval(UUID, INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_supply_approval(UUID, INTEGER, UUID, TEXT) TO service_role;