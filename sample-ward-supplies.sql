-- Insert sample ward supplies
INSERT INTO ward_supplies (ward_id, item_name, category, current_stock, minimum_threshold, unit) VALUES
-- General Ward supplies
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Surgical Gloves', 'Medical Supplies', 250, 50, 'boxes'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Face Masks', 'Medical Supplies', 150, 100, 'boxes'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Hand Sanitizer', 'Hygiene', 25, 10, 'bottles'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Bandages', 'Medical Supplies', 45, 20, 'rolls'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Syringes (5ml)', 'Medical Supplies', 300, 100, 'pieces'),

-- ICU supplies
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'Ventilator Tubing', 'Medical Equipment', 15, 10, 'sets'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'ECG Electrodes', 'Medical Supplies', 80, 30, 'packs'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'IV Bags (Normal Saline)', 'Medical Supplies', 45, 20, 'bags'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'Oxygen Masks', 'Medical Equipment', 25, 15, 'pieces'),

-- Emergency Ward supplies
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Trauma Kits', 'Emergency Supplies', 8, 5, 'kits'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Defibrillator Pads', 'Medical Equipment', 12, 8, 'pairs'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Emergency Medications', 'Pharmaceuticals', 20, 10, 'vials'),

-- Pediatric Ward supplies
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Pediatric Syringes', 'Medical Supplies', 150, 50, 'pieces'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Child-size Masks', 'Medical Supplies', 60, 25, 'pieces'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Pediatric IV Sets', 'Medical Supplies', 35, 15, 'sets');

-- Insert sample supply requests
INSERT INTO supply_requests (ward_id, item_name, requested_quantity, status, requested_by_id, priority, notes) VALUES
-- Recent requests
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Surgical Gloves', 10, 'pending', (SELECT id FROM users WHERE role = 'nurse' LIMIT 1), 'medium', 'Running low on current stock'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'Ventilator Tubing', 5, 'pending', (SELECT id FROM users WHERE role = 'nurse' LIMIT 1), 'high', 'Urgent - only 2 sets remaining'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Trauma Kits', 3, 'approved', (SELECT id FROM users WHERE role = 'doctor' LIMIT 1), 'high', 'For emergency preparedness'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Child-size Masks', 20, 'pending', (SELECT id FROM users WHERE role = 'nurse' LIMIT 1), 'medium', 'Regular restocking'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Hand Sanitizer', 15, 'delivered', (SELECT id FROM users WHERE role = 'nurse' LIMIT 1), 'low', 'Monthly restocking');