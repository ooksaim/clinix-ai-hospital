-- Migration: Add assigned_doctor column to admissions
-- Date: 2025-09-25
-- Adds a new column `assigned_doctor` (uuid) to store the doctor assigned at approval time.
-- Backfills existing values from `attending_doctor_id` (if present) and creates a FK constraint.

BEGIN;

-- 1) Add the new column (nullable)
ALTER TABLE public.admissions
  ADD COLUMN IF NOT EXISTS assigned_doctor uuid;

-- 2) Backfill from existing attending_doctor_id if present
-- 2) Do NOT backfill from `attending_doctor_id`.
-- `attending_doctor_id` is the doctor who requested the admission.
-- `assigned_doctor` is the doctor the ward admin assigns after approval.
-- They are distinct by design, so leave `assigned_doctor` NULL for existing
-- admissions and let ward admin assign explicitly.

-- 3) Add foreign key constraint to user_profiles(id)
-- Use a DO block to add the constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'fk_admissions_assigned_doctor'
      AND t.relname = 'admissions'
  ) THEN
    ALTER TABLE public.admissions
      ADD CONSTRAINT fk_admissions_assigned_doctor
      FOREIGN KEY (assigned_doctor) REFERENCES public.user_profiles(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- 4) Create an index for faster lookups by assigned doctor
CREATE INDEX IF NOT EXISTS idx_admissions_assigned_doctor ON public.admissions (assigned_doctor);

COMMIT;

-- Rollback (for manual use):
-- BEGIN;
-- ALTER TABLE public.admissions DROP CONSTRAINT IF EXISTS fk_admissions_assigned_doctor;
-- DROP INDEX IF EXISTS idx_admissions_assigned_doctor;
-- ALTER TABLE public.admissions DROP COLUMN IF EXISTS assigned_doctor;
-- COMMIT;
