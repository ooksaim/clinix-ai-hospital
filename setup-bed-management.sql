-- ===================================
-- AUTOMATIC BED COUNT MANAGEMENT SETUP
-- ===================================

-- 1. First, let's insert sample beds for all wards
INSERT INTO beds (ward_id, bed_number, bed_type, status, room_number, has_oxygen, has_suction, has_monitor, daily_rate, notes) VALUES
-- General Ward beds (5 beds)
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G001', 'standard', 'available', '101', false, false, false, 150.00, 'Standard room bed'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G002', 'standard', 'available', '102', false, false, false, 150.00, 'Standard room bed'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G003', 'standard', 'occupied', '103', false, false, false, 150.00, 'Standard room bed'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G004', 'standard', 'available', '104', false, false, false, 150.00, 'Standard room bed'),
((SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1), 'G005', 'standard', 'available', '105', false, false, false, 150.00, 'Standard room bed'),

-- ICU beds (3 beds)
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'ICU001', 'icu', 'available', '201', true, true, true, 500.00, 'Full monitoring ICU bed'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'ICU002', 'icu', 'occupied', '202', true, true, true, 500.00, 'Full monitoring ICU bed'),
((SELECT id FROM wards WHERE name = 'ICU' LIMIT 1), 'ICU003', 'icu', 'available', '203', true, true, true, 500.00, 'Full monitoring ICU bed'),

-- Emergency Ward beds (3 beds)
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'E001', 'emergency', 'available', '301', true, true, true, 250.00, 'Emergency bay bed'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'E002', 'emergency', 'available', '302', true, true, true, 250.00, 'Emergency bay bed'),
((SELECT id FROM wards WHERE name = 'Emergency Ward' LIMIT 1), 'E003', 'emergency', 'maintenance', '303', true, true, true, 250.00, 'Under maintenance'),

-- Pediatric Ward beds (3 beds)
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'P001', 'pediatric', 'available', '401', false, false, true, 200.00, 'Child-friendly room'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'P002', 'pediatric', 'available', '402', false, false, true, 200.00, 'Child-friendly room'),
((SELECT id FROM wards WHERE name = 'Pediatric Ward' LIMIT 1), 'P003', 'pediatric', 'occupied', '403', false, false, true, 200.00, 'Child-friendly room');

-- 2. Create a function to automatically update ward bed counts
CREATE OR REPLACE FUNCTION update_ward_bed_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update bed counts for the affected ward(s)
    IF TG_OP = 'DELETE' THEN
        -- Handle DELETE case
        UPDATE wards SET
            total_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = OLD.ward_id),
            available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = OLD.ward_id AND status = 'available'),
            occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = OLD.ward_id AND status = 'occupied')
        WHERE id = OLD.ward_id;
        RETURN OLD;
    ELSE
        -- Handle INSERT and UPDATE cases
        UPDATE wards SET
            total_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = NEW.ward_id),
            available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = NEW.ward_id AND status = 'available'),
            occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = NEW.ward_id AND status = 'occupied')
        WHERE id = NEW.ward_id;
        
        -- If ward_id changed during UPDATE, also update the old ward
        IF TG_OP = 'UPDATE' AND OLD.ward_id != NEW.ward_id THEN
            UPDATE wards SET
                total_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = OLD.ward_id),
                available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = OLD.ward_id AND status = 'available'),
                occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = OLD.ward_id AND status = 'occupied')
            WHERE id = OLD.ward_id;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Create triggers to automatically update bed counts
DROP TRIGGER IF EXISTS trigger_update_ward_bed_counts ON beds;
CREATE TRIGGER trigger_update_ward_bed_counts
    AFTER INSERT OR UPDATE OR DELETE ON beds
    FOR EACH ROW EXECUTE FUNCTION update_ward_bed_counts();

-- 4. Initialize current bed counts based on existing beds
UPDATE wards SET
    total_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = wards.id),
    available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = wards.id AND status = 'available'),
    occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = wards.id AND status = 'occupied')
WHERE id IN (SELECT DISTINCT ward_id FROM beds WHERE ward_id IS NOT NULL);

-- 5. Show the updated ward bed counts
SELECT 
    name,
    ward_type,
    total_beds,
    available_beds,
    occupied_beds,
    ROUND((occupied_beds::FLOAT / NULLIF(total_beds, 0)) * 100, 1) as occupancy_rate
FROM wards 
WHERE total_beds > 0
ORDER BY name;