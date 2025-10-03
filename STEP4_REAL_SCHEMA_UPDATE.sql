-- COMPREHENSIVE DATABASE SCHEMA UPDATE FOR WARD ADMIN DASHBOARD
-- This script adds missing columns and updates existing ones to match the API requirements
-- Execute this in your Supabase SQL Editor

-- =========================================
-- 1. UPDATE WARDS TABLE - Add occupied_beds column
-- =========================================

-- Add occupied_beds column to wards table
ALTER TABLE wards ADD COLUMN IF NOT EXISTS occupied_beds integer DEFAULT 0;

-- Update occupied_beds based on current bed occupancy
UPDATE wards SET occupied_beds = (
  SELECT COUNT(*) 
  FROM beds 
  WHERE beds.ward_id = wards.id 
  AND beds.status = 'occupied'
);

-- =========================================
-- 2. UPDATE WARD_SUPPLIES TABLE - Add missing columns
-- =========================================

-- Add item_name column (API expects this name instead of supply_name)
ALTER TABLE ward_supplies ADD COLUMN IF NOT EXISTS item_name character varying;

-- Copy data from supply_name to item_name
UPDATE ward_supplies SET item_name = supply_name WHERE item_name IS NULL;

-- Add missing columns that API expects
ALTER TABLE ward_supplies ADD COLUMN IF NOT EXISTS category character varying;
ALTER TABLE ward_supplies ADD COLUMN IF NOT EXISTS minimum_threshold integer DEFAULT 10;
ALTER TABLE ward_supplies ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();

-- Update category from supply_category
UPDATE ward_supplies SET category = supply_category WHERE category IS NULL;

-- Update minimum_threshold from minimum_stock_level
UPDATE ward_supplies SET minimum_threshold = minimum_stock_level WHERE minimum_threshold IS NULL;

-- =========================================
-- 3. UPDATE SUPPLY_REQUESTS TABLE - Add missing columns
-- =========================================

-- Add requested_by_id column (API expects this name instead of requested_by)
ALTER TABLE supply_requests ADD COLUMN IF NOT EXISTS requested_by_id uuid;

-- Copy data from requested_by to requested_by_id
UPDATE supply_requests SET requested_by_id = requested_by WHERE requested_by_id IS NULL;

-- Add missing columns that API expects
ALTER TABLE supply_requests ADD COLUMN IF NOT EXISTS item_name character varying;
ALTER TABLE supply_requests ADD COLUMN IF NOT EXISTS requested_quantity integer;
ALTER TABLE supply_requests ADD COLUMN IF NOT EXISTS status character varying DEFAULT 'pending';
ALTER TABLE supply_requests ADD COLUMN IF NOT EXISTS requested_at timestamp with time zone DEFAULT now();
ALTER TABLE supply_requests ADD COLUMN IF NOT EXISTS priority character varying DEFAULT 'normal';

-- Update requested_quantity from quantity_requested
UPDATE supply_requests SET requested_quantity = quantity_requested WHERE requested_quantity IS NULL;

-- Update status from request_status
UPDATE supply_requests SET status = request_status WHERE status IS NULL;

-- Update requested_at from created_at
UPDATE supply_requests SET requested_at = created_at WHERE requested_at IS NULL;

-- Update priority from urgency
UPDATE supply_requests SET priority = urgency WHERE priority IS NULL;

-- =========================================
-- 4. CREATE FOREIGN KEY RELATIONSHIPS
-- =========================================

-- Add foreign key constraint for supply_requests.requested_by_id
ALTER TABLE supply_requests 
ADD CONSTRAINT fk_supply_requests_requested_by_id 
FOREIGN KEY (requested_by_id) REFERENCES users(id);

-- =========================================
-- 5. CREATE TRIGGERS FOR AUTOMATIC BED COUNT UPDATES
-- =========================================

-- Create function to update ward bed counts
CREATE OR REPLACE FUNCTION update_ward_bed_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the ward's occupied_beds count
  UPDATE wards 
  SET occupied_beds = (
    SELECT COUNT(*) 
    FROM beds 
    WHERE beds.ward_id = COALESCE(NEW.ward_id, OLD.ward_id)
    AND beds.status = 'occupied'
  ),
  available_beds = (
    SELECT COUNT(*) 
    FROM beds 
    WHERE beds.ward_id = COALESCE(NEW.ward_id, OLD.ward_id)
    AND beds.status = 'available'
  )
  WHERE id = COALESCE(NEW.ward_id, OLD.ward_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic bed count updates
DROP TRIGGER IF EXISTS trigger_update_ward_bed_counts_insert ON beds;
DROP TRIGGER IF EXISTS trigger_update_ward_bed_counts_update ON beds;
DROP TRIGGER IF EXISTS trigger_update_ward_bed_counts_delete ON beds;

CREATE TRIGGER trigger_update_ward_bed_counts_insert
  AFTER INSERT ON beds
  FOR EACH ROW EXECUTE FUNCTION update_ward_bed_counts();

CREATE TRIGGER trigger_update_ward_bed_counts_update
  AFTER UPDATE ON beds
  FOR EACH ROW EXECUTE FUNCTION update_ward_bed_counts();

CREATE TRIGGER trigger_update_ward_bed_counts_delete
  AFTER DELETE ON beds
  FOR EACH ROW EXECUTE FUNCTION update_ward_bed_counts();

-- =========================================
-- 6. INSERT SAMPLE DATA FOR TESTING
-- =========================================

-- Insert sample wards if they don't exist
INSERT INTO wards (id, name, code, ward_type, total_beds, available_beds, occupied_beds, floor_number, wing, is_active) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'ICU Ward', 'ICU01', 'ICU', 10, 8, 2, 1, 'East Wing', true),
  ('22222222-2222-2222-2222-222222222222', 'General Ward A', 'GEN01', 'General', 20, 15, 5, 2, 'North Wing', true),
  ('33333333-3333-3333-3333-333333333333', 'Emergency Ward', 'ER01', 'Emergency', 15, 12, 3, 1, 'South Wing', true),
  ('44444444-4444-4444-4444-444444444444', 'Pediatric Ward', 'PED01', 'Pediatrics', 12, 10, 2, 3, 'West Wing', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample beds if they don't exist
INSERT INTO beds (id, bed_number, ward_id, bed_type, status, room_number, has_oxygen, has_suction, has_monitor) 
VALUES 
  -- ICU Ward beds
  ('b1111111-1111-1111-1111-111111111111', 'ICU-001', '11111111-1111-1111-1111-111111111111', 'ICU', 'available', '101', true, true, true),
  ('b1111111-1111-1111-1111-111111111112', 'ICU-002', '11111111-1111-1111-1111-111111111111', 'ICU', 'occupied', '102', true, true, true),
  ('b1111111-1111-1111-1111-111111111113', 'ICU-003', '11111111-1111-1111-1111-111111111111', 'ICU', 'available', '103', true, true, true),
  
  -- General Ward A beds
  ('b2222222-2222-2222-2222-222222222221', 'GEN-001', '22222222-2222-2222-2222-222222222222', 'General', 'available', '201', false, false, false),
  ('b2222222-2222-2222-2222-222222222222', 'GEN-002', '22222222-2222-2222-2222-222222222222', 'General', 'occupied', '202', false, false, false),
  ('b2222222-2222-2222-2222-222222222223', 'GEN-003', '22222222-2222-2222-2222-222222222222', 'General', 'available', '203', false, false, false),
  
  -- Emergency Ward beds
  ('b3333333-3333-3333-3333-333333333331', 'ER-001', '33333333-3333-3333-3333-333333333333', 'Emergency', 'available', '301', true, true, true),
  ('b3333333-3333-3333-3333-333333333332', 'ER-002', '33333333-3333-3333-3333-333333333333', 'Emergency', 'occupied', '302', true, true, true),
  
  -- Pediatric Ward beds
  ('b4444444-4444-4444-4444-444444444441', 'PED-001', '44444444-4444-4444-4444-444444444444', 'Pediatric', 'available', '401', false, false, true),
  ('b4444444-4444-4444-4444-444444444442', 'PED-002', '44444444-4444-4444-4444-444444444444', 'Pediatric', 'occupied', '402', false, false, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample ward supplies if they don't exist
INSERT INTO ward_supplies (id, ward_id, item_name, supply_name, category, supply_category, current_stock, minimum_threshold, minimum_stock_level, unit) 
VALUES 
  -- ICU Ward supplies
  ('s1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Oxygen Masks', 'Oxygen Masks', 'Medical Equipment', 'Medical Equipment', 25, 10, 10, 'pieces'),
  ('s1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'IV Tubes', 'IV Tubes', 'Medical Supplies', 'Medical Supplies', 50, 20, 20, 'pieces'),
  ('s1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Ventilator Circuits', 'Ventilator Circuits', 'Medical Equipment', 'Medical Equipment', 8, 5, 5, 'sets'),
  
  -- General Ward A supplies
  ('s2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Bed Sheets', 'Bed Sheets', 'Linens', 'Linens', 100, 30, 30, 'pieces'),
  ('s2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Pillows', 'Pillows', 'Linens', 'Linens', 45, 20, 20, 'pieces'),
  ('s2222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'Disposable Syringes', 'Disposable Syringes', 'Medical Supplies', 'Medical Supplies', 200, 50, 50, 'pieces'),
  
  -- Emergency Ward supplies
  ('s3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Emergency Kits', 'Emergency Kits', 'Emergency Equipment', 'Emergency Equipment', 15, 8, 8, 'kits'),
  ('s3333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'Defibrillator Pads', 'Defibrillator Pads', 'Medical Equipment', 'Medical Equipment', 30, 15, 15, 'sets'),
  
  -- Pediatric Ward supplies
  ('s4444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444444', 'Pediatric Masks', 'Pediatric Masks', 'Medical Equipment', 'Medical Equipment', 40, 15, 15, 'pieces'),
  ('s4444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444444', 'Child-Safe Syringes', 'Child-Safe Syringes', 'Medical Supplies', 'Medical Supplies', 60, 25, 25, 'pieces')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users if they don't exist (for supply requests)
INSERT INTO users (id, first_name, last_name, email, role, is_active) 
VALUES 
  ('u1111111-1111-1111-1111-111111111111', 'Dr. Sarah', 'Johnson', 'sarah.johnson@hospital.com', 'doctor', true),
  ('u2222222-2222-2222-2222-222222222222', 'Nurse Mary', 'Williams', 'mary.williams@hospital.com', 'nurse', true),
  ('u3333333-3333-3333-3333-333333333333', 'Dr. Michael', 'Brown', 'michael.brown@hospital.com', 'doctor', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample supply requests if they don't exist
INSERT INTO supply_requests (id, ward_id, supply_id, requested_by, requested_by_id, item_name, quantity_requested, requested_quantity, urgency, priority, request_reason, request_status, status, requested_at, notes) 
VALUES 
  ('r1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'Oxygen Masks', 20, 20, 'high', 'high', 'Running low on oxygen masks in ICU', 'pending', 'pending', now(), 'Urgent restocking needed'),
  ('r2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-222222222223', 'u2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'Disposable Syringes', 100, 100, 'normal', 'normal', 'Weekly restock', 'approved', 'approved', now() - interval '1 day', 'Regular supply order'),
  ('r3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-333333333331', 'u3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'Emergency Kits', 5, 5, 'high', 'high', 'Emergency kit shortage', 'pending', 'pending', now() - interval '2 hours', 'Critical for emergency operations')
ON CONFLICT (id) DO NOTHING;

-- Insert sample admission requests if they don't exist
INSERT INTO admissions (id, admission_number, patient_id, ward_id, bed_id, attending_doctor_id, admission_reason, diagnosis, admission_status, requested_by, approved_by) 
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'ADM-2024-001', 'p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, 'u1111111-1111-1111-1111-111111111111', 'Respiratory distress', 'Acute pneumonia', 'pending', 'u1111111-1111-1111-1111-111111111111', NULL),
  ('a2222222-2222-2222-2222-222222222222', 'ADM-2024-002', 'p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, 'u2222222-2222-2222-2222-222222222222', 'General checkup', 'Post-operative care', 'pending', 'u2222222-2222-2222-2222-222222222222', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample patients if they don't exist
INSERT INTO patients (id, patient_number, first_name, last_name, date_of_birth, gender, phone, email, emergency_contact_name, emergency_contact_phone) 
VALUES 
  ('p1111111-1111-1111-1111-111111111111', 'PAT-2024-001', 'John', 'Doe', '1980-05-15', 'Male', '555-0101', 'john.doe@email.com', 'Jane Doe', '555-0102'),
  ('p2222222-2222-2222-2222-222222222222', 'PAT-2024-002', 'Alice', 'Smith', '1975-08-20', 'Female', '555-0201', 'alice.smith@email.com', 'Bob Smith', '555-0202')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 7. UPDATE WARD BED COUNTS
-- =========================================

-- Recalculate all ward bed counts
UPDATE wards SET 
  total_beds = (SELECT COUNT(*) FROM beds WHERE beds.ward_id = wards.id),
  available_beds = (SELECT COUNT(*) FROM beds WHERE beds.ward_id = wards.id AND beds.status = 'available'),
  occupied_beds = (SELECT COUNT(*) FROM beds WHERE beds.ward_id = wards.id AND beds.status = 'occupied');

-- =========================================
-- 8. VERIFY DATA INTEGRITY
-- =========================================

-- Check that all required columns exist
SELECT 
  'ward_supplies' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'ward_supplies' 
  AND column_name IN ('item_name', 'category', 'minimum_threshold')
ORDER BY column_name;

SELECT 
  'wards' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'wards' 
  AND column_name = 'occupied_beds';

SELECT 
  'supply_requests' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'supply_requests' 
  AND column_name IN ('requested_by_id', 'item_name', 'requested_quantity', 'status', 'requested_at', 'priority')
ORDER BY column_name;

-- Show summary of data
SELECT 'WARD SUMMARY' as info, name, total_beds, available_beds, occupied_beds 
FROM wards 
ORDER BY name;

SELECT 'SUPPLY SUMMARY' as info, COUNT(*) as total_supplies 
FROM ward_supplies;

SELECT 'REQUEST SUMMARY' as info, COUNT(*) as total_requests 
FROM supply_requests;

COMMIT;