-- ===================================
-- WARD SUPPLIES INVENTORY SETUP
-- ===================================

-- 1. Insert sample ward supplies for all wards
INSERT INTO ward_supplies (ward_id, item_name, category, current_stock, minimum_threshold, unit) VALUES
-- General Ward supplies
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Surgical Gloves', 'Medical Supplies', 250, 50, 'boxes'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Face Masks', 'Medical Supplies', 150, 100, 'boxes'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Hand Sanitizer', 'Hygiene', 25, 10, 'bottles'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Bandages', 'Medical Supplies', 45, 20, 'rolls'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Syringes (5ml)', 'Medical Supplies', 300, 100, 'pieces'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Disposable Gowns', 'Medical Supplies', 75, 30, 'pieces'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Thermometer Covers', 'Medical Supplies', 500, 100, 'pieces'),

-- ICU supplies
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'Ventilator Tubing', 'Medical Equipment', 15, 10, 'sets'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'ECG Electrodes', 'Medical Supplies', 80, 30, 'packs'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'IV Bags (Normal Saline)', 'Medical Supplies', 45, 20, 'bags'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'Oxygen Masks', 'Medical Equipment', 25, 15, 'pieces'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'Central Line Kits', 'Medical Equipment', 8, 5, 'kits'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'Arterial Line Kits', 'Medical Equipment', 12, 8, 'kits'),

-- Emergency Ward supplies
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Trauma Kits', 'Emergency Supplies', 8, 5, 'kits'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Defibrillator Pads', 'Medical Equipment', 12, 8, 'pairs'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Emergency Medications', 'Pharmaceuticals', 20, 10, 'vials'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Splinting Materials', 'Emergency Supplies', 15, 8, 'sets'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Suture Kits', 'Medical Supplies', 25, 10, 'kits'),

-- Pediatric Ward supplies
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Pediatric Syringes', 'Medical Supplies', 150, 50, 'pieces'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Child-size Masks', 'Medical Supplies', 60, 25, 'pieces'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Pediatric IV Sets', 'Medical Supplies', 35, 15, 'sets'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Pediatric Bandages', 'Medical Supplies', 40, 20, 'rolls'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Children Thermometers', 'Medical Equipment', 10, 5, 'pieces');

-- 2. Insert sample supply requests
INSERT INTO supply_requests (ward_id, item_name, requested_quantity, status, requested_by_id, priority, notes) VALUES
-- Pending requests (these will show up in the dashboard)
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Surgical Gloves', 10, 'pending', (SELECT id FROM users WHERE role = 'nurse' LIMIT 1), 'medium', 'Running low on current stock'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'Ventilator Tubing', 5, 'pending', (SELECT id FROM users WHERE role = 'nurse' LIMIT 1), 'high', 'Urgent - only 2 sets remaining'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'Child-size Masks', 20, 'pending', (SELECT id FROM users WHERE role = 'nurse' LIMIT 1), 'medium', 'Regular restocking'),

-- Some approved/delivered requests for history
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'Trauma Kits', 3, 'approved', (SELECT id FROM users WHERE role = 'doctor' LIMIT 1), 'high', 'For emergency preparedness'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'Hand Sanitizer', 15, 'delivered', (SELECT id FROM users WHERE role = 'nurse' LIMIT 1), 'low', 'Monthly restocking');

-- 3. Show current supply status
SELECT 
    ws.item_name,
    ws.category,
    ws.current_stock,
    ws.minimum_threshold,
    ws.unit,
    w.name as ward_name,
    CASE 
        WHEN ws.current_stock <= ws.minimum_threshold THEN 'LOW STOCK'
        WHEN ws.current_stock <= ws.minimum_threshold * 1.5 THEN 'MEDIUM STOCK'
        ELSE 'GOOD STOCK'
    END as stock_status
FROM ward_supplies ws
JOIN wards w ON ws.ward_id = w.id
ORDER BY w.name, ws.category, ws.item_name;

-- 4. Show pending supply requests
SELECT 
    sr.item_name,
    sr.requested_quantity,
    sr.status,
    sr.priority,
    sr.notes,
    w.name as ward_name,
    u.first_name || ' ' || u.last_name as requested_by
FROM supply_requests sr
JOIN wards w ON sr.ward_id = w.id
LEFT JOIN users u ON sr.requested_by_id = u.id
WHERE sr.status = 'pending'
ORDER BY 
    CASE sr.priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
    END,
    sr.requested_at;