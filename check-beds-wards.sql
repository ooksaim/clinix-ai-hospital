-- Check current beds and wards in your database
-- Run this in Supabase SQL Editor to see what data you have

-- 1. Check wards
SELECT 'WARDS' as table_name, id, name, ward_type, total_beds, available_beds 
FROM wards 
WHERE is_active = true 
ORDER BY name;

-- 2. Check beds 
SELECT 'BEDS' as table_name, id, bed_number, ward_id, bed_type, status, room_number
FROM beds 
ORDER BY ward_id, bed_number;

-- 3. Check available beds per ward
SELECT 
  w.name as ward_name,
  w.id as ward_id,
  COUNT(b.id) as total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds
FROM wards w
LEFT JOIN beds b ON w.id = b.ward_id
WHERE w.is_active = true
GROUP BY w.id, w.name
ORDER BY w.name;

-- 4. Show specifically available beds (these should appear in dropdown)
SELECT 
  b.id,
  b.bed_number,
  b.room_number,
  b.status,
  w.name as ward_name,
  w.id as ward_id
FROM beds b
JOIN wards w ON b.ward_id = w.id
WHERE b.status = 'available'
ORDER BY w.name, b.bed_number;