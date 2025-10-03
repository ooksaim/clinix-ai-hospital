-- Fix missing admission records for occupied beds
-- This will create admission records for beds that are marked as occupied but have no active admissions

INSERT INTO admissions (
  admission_number,
  patient_id,
  ward_id,
  bed_id,
  attending_doctor_id,
  admission_type,
  admission_reason,
  admission_status,
  admission_date,
  requested_by
)
SELECT 
  'ADM-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY b.bed_number)::text, 6, '0') as admission_number,
  b.current_patient_id as patient_id,
  b.ward_id,
  b.id as bed_id,
  -- Use first available doctor as attending doctor (you can change this)
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1) as attending_doctor_id,
  -- Also set assigned_doctor to the same doctor for recovery purposes so beds have an assigned physician
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1) as assigned_doctor,
  'emergency' as admission_type,
  'Emergency admission - missing record recovery' as admission_reason,
  'active' as admission_status,
  CURRENT_DATE as admission_date,
  -- Use first available admin as requested_by (you can change this)
  (SELECT id FROM user_profiles WHERE role IN ('admin', 'ward-admin') LIMIT 1) as requested_by
FROM beds b
WHERE b.status = 'occupied' 
  AND b.current_patient_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM admissions a 
    WHERE a.bed_id = b.id 
    AND a.admission_status = 'active'
  );

-- Verify the results
SELECT 
  COUNT(*) as total_active_admissions,
  COUNT(DISTINCT bed_id) as beds_with_admissions
FROM admissions 
WHERE admission_status = 'active';