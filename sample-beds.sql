-- Insert sample beds for different wards
INSERT INTO beds (ward_id, bed_number, bed_type, status, room_number, has_oxygen, has_suction, has_monitor, daily_rate, notes) VALUES
-- General Ward beds
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G001', 'standard', 'available', '101', false, false, false, 150.00, 'Standard room bed'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G002', 'standard', 'available', '102', false, false, false, 150.00, 'Standard room bed'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G003', 'standard', 'occupied', '103', false, false, false, 150.00, 'Standard room bed'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G004', 'standard', 'available', '104', false, false, false, 150.00, 'Standard room bed'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G005', 'standard', 'available', '105', false, false, false, 150.00, 'Standard room bed'),

-- ICU beds
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'ICU001', 'icu', 'available', '201', true, true, true, 500.00, 'Full monitoring ICU bed'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'ICU002', 'icu', 'occupied', '202', true, true, true, 500.00, 'Full monitoring ICU bed'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'ICU003', 'icu', 'available', '203', true, true, true, 500.00, 'Full monitoring ICU bed'),

-- Emergency Ward beds
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'E001', 'emergency', 'available', '301', true, true, true, 250.00, 'Emergency bay bed'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'E002', 'emergency', 'available', '302', true, true, true, 250.00, 'Emergency bay bed'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'E003', 'emergency', 'maintenance', '303', true, true, true, 250.00, 'Under maintenance'),

-- Pediatric Ward beds
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'P001', 'pediatric', 'available', '401', false, false, true, 200.00, 'Child-friendly room'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'P002', 'pediatric', 'available', '402', false, false, true, 200.00, 'Child-friendly room'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'P003', 'pediatric', 'occupied', '403', false, false, true, 200.00, 'Child-friendly room');

-- Update ward bed counts based on actual beds
UPDATE wards SET 
  total_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = wards.id),
  available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = wards.id AND status = 'available'),
  occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = wards.id AND status = 'occupied')
WHERE id IN (SELECT DISTINCT ward_id FROM beds);