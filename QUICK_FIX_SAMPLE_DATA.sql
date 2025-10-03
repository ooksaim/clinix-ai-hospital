-- Quick Fix: Add Sample Beds and Supplies to Test Ward Admin Dashboard
-- Run this in your Supabase SQL Editor to get immediate results

-- =====================================
-- 1. ADD SAMPLE WARDS (if they don't exist)
-- =====================================

INSERT INTO wards (id, name, code, ward_type, total_beds, available_beds, is_active) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'ICU Ward', 'ICU01', 'ICU', 8, 6, true),
  ('22222222-2222-2222-2222-222222222222', 'General Ward A', 'GEN01', 'General', 15, 12, true),
  ('33333333-3333-3333-3333-333333333333', 'Emergency Ward', 'ER01', 'Emergency', 10, 8, true),
  ('44444444-4444-4444-4444-444444444444', 'Pediatric Ward', 'PED01', 'Pediatrics', 8, 6, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  ward_type = EXCLUDED.ward_type,
  total_beds = EXCLUDED.total_beds,
  available_beds = EXCLUDED.available_beds;

-- =====================================
-- 2. ADD SAMPLE BEDS (with 'available' status for assignment)
-- =====================================

INSERT INTO beds (id, bed_number, ward_id, bed_type, status, room_number, has_oxygen, has_suction, has_monitor) 
VALUES 
  -- ICU Ward beds
  ('b1111111-1111-1111-1111-111111111111', 'ICU-001', '11111111-1111-1111-1111-111111111111', 'ICU', 'available', '101', true, true, true),
  ('b1111111-1111-1111-1111-111111111112', 'ICU-002', '11111111-1111-1111-1111-111111111111', 'ICU', 'available', '102', true, true, true),
  ('b1111111-1111-1111-1111-111111111113', 'ICU-003', '11111111-1111-1111-1111-111111111111', 'ICU', 'occupied', '103', true, true, true),
  ('b1111111-1111-1111-1111-111111111114', 'ICU-004', '11111111-1111-1111-1111-111111111111', 'ICU', 'available', '104', true, true, true),
  
  -- General Ward A beds
  ('b2222222-2222-2222-2222-222222222221', 'GEN-001', '22222222-2222-2222-2222-222222222222', 'General', 'available', '201', false, false, false),
  ('b2222222-2222-2222-2222-222222222222', 'GEN-002', '22222222-2222-2222-2222-222222222222', 'General', 'available', '202', false, false, false),
  ('b2222222-2222-2222-2222-222222222223', 'GEN-003', '22222222-2222-2222-2222-222222222222', 'General', 'occupied', '203', false, false, false),
  ('b2222222-2222-2222-2222-222222222224', 'GEN-004', '22222222-2222-2222-2222-222222222222', 'General', 'available', '204', false, false, false),
  
  -- Emergency Ward beds
  ('b3333333-3333-3333-3333-333333333331', 'ER-001', '33333333-3333-3333-3333-333333333333', 'Emergency', 'available', '301', true, true, true),
  ('b3333333-3333-3333-3333-333333333332', 'ER-002', '33333333-3333-3333-3333-333333333333', 'Emergency', 'available', '302', true, true, true),
  ('b3333333-3333-3333-3333-333333333333', 'ER-003', '33333333-3333-3333-3333-333333333333', 'Emergency', 'occupied', '303', true, true, true),
  
  -- Pediatric Ward beds
  ('b4444444-4444-4444-4444-444444444441', 'PED-001', '44444444-4444-4444-4444-444444444444', 'Pediatric', 'available', '401', false, false, true),
  ('b4444444-4444-4444-4444-444444444442', 'PED-002', '44444444-4444-4444-4444-444444444444', 'Pediatric', 'available', '402', false, false, true),
  ('b4444444-4444-4444-4444-444444444443', 'PED-003', '44444444-4444-4444-4444-444444444444', 'Pediatric', 'occupied', '403', false, false, true)
ON CONFLICT (id) DO UPDATE SET
  bed_number = EXCLUDED.bed_number,
  status = EXCLUDED.status,
  room_number = EXCLUDED.room_number;

-- =====================================
-- 3. ADD SAMPLE WARD SUPPLIES (using existing schema columns)
-- =====================================

INSERT INTO ward_supplies (id, ward_id, supply_name, supply_category, current_stock, minimum_stock_level, unit) 
VALUES 
  -- ICU Ward supplies
  ('s1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Oxygen Masks', 'Medical Equipment', 25, 10, 'pieces'),
  ('s1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'IV Tubes', 'Medical Supplies', 50, 20, 'pieces'),
  ('s1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Ventilator Circuits', 'Medical Equipment', 8, 5, 'sets'),
  ('s1111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'Cardiac Monitors', 'Medical Equipment', 15, 8, 'units'),
  
  -- General Ward A supplies
  ('s2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Bed Sheets', 'Linens', 100, 30, 'pieces'),
  ('s2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Pillows', 'Linens', 45, 20, 'pieces'),
  ('s2222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'Disposable Syringes', 'Medical Supplies', 200, 50, 'pieces'),
  ('s2222222-2222-2222-2222-222222222224', '22222222-2222-2222-2222-222222222222', 'Bandages', 'Medical Supplies', 75, 25, 'rolls'),
  
  -- Emergency Ward supplies
  ('s3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Emergency Kits', 'Emergency Equipment', 15, 8, 'kits'),
  ('s3333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'Defibrillator Pads', 'Medical Equipment', 30, 15, 'sets'),
  ('s3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Trauma Supplies', 'Emergency Equipment', 20, 10, 'kits'),
  
  -- Pediatric Ward supplies
  ('s4444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444444', 'Pediatric Masks', 'Medical Equipment', 40, 15, 'pieces'),
  ('s4444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444444', 'Child-Safe Syringes', 'Medical Supplies', 60, 25, 'pieces'),
  ('s4444444-4444-4444-4444-444444444443', '44444444-4444-4444-4444-444444444444', 'Pediatric Thermometers', 'Medical Equipment', 20, 8, 'units')
ON CONFLICT (id) DO UPDATE SET
  supply_name = EXCLUDED.supply_name,
  current_stock = EXCLUDED.current_stock,
  minimum_stock_level = EXCLUDED.minimum_stock_level;

-- =====================================
-- 4. ADD SAMPLE USERS (for supply requests)
-- =====================================

INSERT INTO users (id, first_name, last_name, email, role, is_active) 
VALUES 
  ('u1111111-1111-1111-1111-111111111111', 'Dr. Sarah', 'Johnson', 'sarah.johnson@hospital.com', 'doctor', true),
  ('u2222222-2222-2222-2222-222222222222', 'Nurse Mary', 'Williams', 'mary.williams@hospital.com', 'nurse', true),
  ('u3333333-3333-3333-3333-333333333333', 'Dr. Michael', 'Brown', 'michael.brown@hospital.com', 'doctor', true),
  ('u4444444-4444-4444-4444-444444444444', 'Nurse Lisa', 'Davis', 'lisa.davis@hospital.com', 'nurse', true)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_active = EXCLUDED.is_active;

-- =====================================
-- 5. ADD SAMPLE SUPPLY REQUESTS (using existing schema columns)
-- =====================================

INSERT INTO supply_requests (id, ward_id, supply_id, requested_by, quantity_requested, urgency, request_reason, request_status, notes) 
VALUES 
  ('r1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 20, 'high', 'Running low on oxygen masks in ICU', 'pending', 'Urgent restocking needed'),
  ('r2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-222222222223', 'u2222222-2222-2222-2222-222222222222', 100, 'normal', 'Weekly restock of syringes', 'approved', 'Regular supply order'),
  ('r3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-333333333331', 'u3333333-3333-3333-3333-333333333333', 5, 'high', 'Emergency kit shortage', 'pending', 'Critical for emergency operations'),
  ('r4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 's4444444-4444-4444-4444-444444444442', 'u4444444-4444-4444-4444-444444444444', 30, 'normal', 'Pediatric supplies restocking', 'pending', 'Monthly supply request')
ON CONFLICT (id) DO UPDATE SET
  quantity_requested = EXCLUDED.quantity_requested,
  urgency = EXCLUDED.urgency,
  request_status = EXCLUDED.request_status;

-- =====================================
-- 6. UPDATE WARD BED COUNTS
-- =====================================

UPDATE wards SET 
  total_beds = (SELECT COUNT(*) FROM beds WHERE beds.ward_id = wards.id),
  available_beds = (SELECT COUNT(*) FROM beds WHERE beds.ward_id = wards.id AND beds.status = 'available');

-- =====================================
-- 7. VERIFICATION QUERIES
-- =====================================

-- Check results
SELECT 'WARDS' as type, COUNT(*) as count FROM wards WHERE is_active = true;
SELECT 'BEDS' as type, COUNT(*) as count FROM beds;
SELECT 'AVAILABLE BEDS' as type, COUNT(*) as count FROM beds WHERE status = 'available';
SELECT 'SUPPLIES' as type, COUNT(*) as count FROM ward_supplies;
SELECT 'SUPPLY REQUESTS' as type, COUNT(*) as count FROM supply_requests;

-- Show available beds per ward
SELECT 
  w.name as ward_name,
  COUNT(b.id) as total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds
FROM wards w
LEFT JOIN beds b ON w.id = b.ward_id
GROUP BY w.id, w.name
ORDER BY w.name;

COMMIT;