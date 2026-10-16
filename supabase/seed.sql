-- Project Epi / Duara — Development Seed
-- Creates one test account per role using Supabase Auth SQL helpers.
-- Run AFTER all migrations in the Supabase SQL editor.
-- DO NOT run in production.

-- ============================================================================
-- TEST ACCOUNTS (passwords are set via Supabase Auth; UUIDs are stable)
-- ============================================================================
-- patient@test.local       / TestPass123!  (role: patient)
-- caregiver@test.local     / TestPass123!  (role: caregiver)
-- clinician@test.local     / TestPass123!  (role: clinician)
-- admin@test.local         / TestPass123!  (role: admin)
-- org_admin@test.local     / TestPass123!  (role: org_admin)
--
-- Create these accounts using the Supabase Auth dashboard or via:
--   supabase auth admin create-user --email patient@test.local ...
-- Then run this script to backfill the profile rows.

-- After creating users in Auth, update their roles and names:
UPDATE profiles SET role = 'caregiver', full_name = 'Test Caregiver'
  WHERE email = 'caregiver@test.local';

UPDATE profiles SET role = 'clinician', full_name = 'Dr Test Clinician'
  WHERE email = 'clinician@test.local';

UPDATE profiles SET role = 'admin', full_name = 'Platform Admin'
  WHERE email = 'admin@test.local';

UPDATE profiles SET role = 'org_admin', full_name = 'Clinic Manager'
  WHERE email = 'org_admin@test.local';

-- Add a clinician verification for the test clinician
INSERT INTO clinician_verifications (clinician_id, licence_number, cadre, registering_body, status, verified_at)
SELECT id, 'KMPDC-TEST-001', 'doctor', 'KMPDC', 'verified', NOW()
FROM profiles WHERE email = 'clinician@test.local'
ON CONFLICT DO NOTHING;

-- Link clinician to patient
INSERT INTO clinician_links (patient_id, clinician_id, verified_at)
SELECT p.id, c.id, NOW()
FROM profiles p, profiles c
WHERE p.email = 'patient@test.local'
  AND c.email = 'clinician@test.local'
ON CONFLICT DO NOTHING;

-- Add caregiver to patient's care circle with emergency flag
INSERT INTO care_circle (patient_id, member_id, display_name, relationship, is_emergency, phone)
SELECT p.id, cg.id, 'Test Caregiver', 'family', true, '+254700000002'
FROM profiles p, profiles cg
WHERE p.email  = 'patient@test.local'
  AND cg.email = 'caregiver@test.local'
ON CONFLICT DO NOTHING;

-- Grant caregiver access to medications and vitals categories
INSERT INTO grants (patient_id, grantee_id, category)
SELECT p.id, cg.id, cat
FROM profiles p, profiles cg,
     (VALUES ('vitals'), ('medications'), ('events'), ('adherence')) AS cats(cat)
WHERE p.email  = 'patient@test.local'
  AND cg.email = 'caregiver@test.local'
ON CONFLICT (patient_id, grantee_id, category) DO NOTHING;

-- Grant clinician access to all categories
INSERT INTO grants (patient_id, grantee_id, category)
SELECT p.id, c.id, cat
FROM profiles p, profiles c,
     (VALUES
       ('vitals'), ('ecg'), ('medications'), ('adherence'),
       ('appointments'), ('events'), ('symptoms'), ('records'),
       ('addon_readings')
     ) AS cats(cat)
WHERE p.email = 'patient@test.local'
  AND c.email = 'clinician@test.local'
ON CONFLICT (patient_id, grantee_id, category) DO NOTHING;

-- Sample condition for the test patient (epilepsy)
INSERT INTO conditions (patient_id, condition_template_id, notes)
SELECT p.id, t.id, 'Test condition for development'
FROM profiles p, condition_templates t
WHERE p.email = 'patient@test.local' AND t.code = 'epilepsy'
ON CONFLICT DO NOTHING;

-- Sample medication
INSERT INTO medications (patient_id, name, strength, form, prescribed_by, active, version)
SELECT p.id, 'Sodium Valproate', '200mg', 'tablet', c.id, true, 1
FROM profiles p, profiles c
WHERE p.email = 'patient@test.local'
  AND c.email = 'clinician@test.local'
ON CONFLICT DO NOTHING;
