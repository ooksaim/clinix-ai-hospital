-- Test admission data for occupied beds

-- First, let's get the IDs we need
-- Get a patient ID, a bed ID, and a doctor ID

-- Insert a test admission for bed 'G003' (General Ward)
INSERT INTO admissions (
  admission_number,
  patient_id,
  ward_id,
  bed_id,
  attending_doctor_id,
  assigned_doctor,
  admission_type,
  admission_reason,
  admission_status,
  admission_date
) VALUES (
  'ADM-001-2025',
  (SELECT id FROM patients WHERE first_name = 'John' LIMIT 1),
  (SELECT id FROM wards WHERE name = 'General Ward' LIMIT 1),
  (SELECT id FROM beds WHERE bed_number = 'G003' LIMIT 1),
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1),
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1),
  'emergency',
  'Chest pain and shortness of breath',
  'active',
  CURRENT_DATE
);

-- Update the bed with the patient ID
UPDATE beds 
SET current_patient_id = (SELECT id FROM patients WHERE first_name = 'John' LIMIT 1)
WHERE bed_number = 'G003';

-- Insert another test admission for ICU002
INSERT INTO admissions (
  admission_number,
  patient_id,
  ward_id,
  bed_id,
  attending_doctor_id,
  assigned_doctor,
  admission_type,
  admission_reason,
  admission_status,
  admission_date
) VALUES (
  'ADM-002-2025',
  (SELECT id FROM patients WHERE first_name = 'Jane' LIMIT 1),
  (SELECT id FROM wards WHERE name = 'ICU' LIMIT 1),
  (SELECT id FROM beds WHERE bed_number = 'ICU002' LIMIT 1),
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1),
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1),
  'critical',
  'Post-operative monitoring after major surgery',
  'active',
  CURRENT_DATE
);

-- Update the ICU bed with the patient ID
UPDATE beds 
SET current_patient_id = (SELECT id FROM patients WHERE first_name = 'Jane' LIMIT 1)
WHERE bed_number = 'ICU002';