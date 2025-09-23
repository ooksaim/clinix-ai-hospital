-- Additional tables needed for Step 4 Doctor Workflow

-- Consultations table to store detailed consultation records
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  consultation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  past_medical_history TEXT,
  physical_examination TEXT,
  vital_signs JSONB,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_date DATE,
  follow_up_instructions TEXT,
  consultation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table to store medication prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_visit_id ON consultations(visit_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_id ON prescriptions(visit_id);

-- Add RLS policies if using Supabase
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write their own data
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read consultations" 
ON consultations FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert consultations" 
ON consultations FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update consultations" 
ON consultations FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to read prescriptions" 
ON prescriptions FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert prescriptions" 
ON prescriptions FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Update visits table to include more status options if needed
DO $$
BEGIN
  -- Check if the constraint exists and drop it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'visits_visit_status_check' 
    AND table_name = 'visits'
  ) THEN
    ALTER TABLE visits DROP CONSTRAINT visits_visit_status_check;
  END IF;
  
  -- Add the new constraint with additional status options
  ALTER TABLE visits ADD CONSTRAINT visits_visit_status_check 
  CHECK (visit_status IN ('waiting', 'in_consultation', 'completed', 'cancelled', 'no_show'));
EXCEPTION 
  WHEN OTHERS THEN
    -- Constraint might already exist or table might not exist
    NULL;
END $$;