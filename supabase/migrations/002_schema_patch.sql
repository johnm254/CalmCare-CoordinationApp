-- Project Epi: Schema Patch v2
-- Run this in: supabase.com/dashboard/project/rtlhckntjrhdhbaqzxoy/sql/new

-- 1. Add active column to conditions
ALTER TABLE conditions ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Fix grants category CHECK constraint
--    (existing has: medications/events/observations/records/all)
ALTER TABLE grants DROP CONSTRAINT IF EXISTS grants_category_check;
ALTER TABLE grants ADD CONSTRAINT grants_category_check
  CHECK (category IN ('emergency_alerts', 'medication_schedule', 'appointments', 'event_summaries', 'records'));

-- 3. Add UNIQUE constraint so upsert works
ALTER TABLE grants DROP CONSTRAINT IF EXISTS grants_patient_id_grantee_id_category_key;
ALTER TABLE grants ADD CONSTRAINT grants_patient_id_grantee_id_category_key
  UNIQUE (patient_id, grantee_id, category);

-- 4. Update trigger to also capture full_name from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        email     = COALESCE(EXCLUDED.email, profiles.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Clean up any stale test grants (old category names)
DELETE FROM grants WHERE category NOT IN ('emergency_alerts','medication_schedule','appointments','event_summaries','records');

-- Verify all 4 changes
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'conditions' AND column_name = 'active';
SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'grants' AND constraint_type IN ('CHECK','UNIQUE');
