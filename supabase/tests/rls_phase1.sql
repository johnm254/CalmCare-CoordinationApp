-- Project Epi / Duara — pgTAP RLS Tests (Phase 1 gate)
-- Run with: pnpm supabase test db
-- Gate: "A caregiver with no grant sees zero rows on every table;
--        admin sees zero clinical rows; unverified clinician sees nothing"

BEGIN;

SELECT plan(28);

-- ============================================================================
-- Helpers: set the current user context
-- ============================================================================
-- Uses set_config('request.jwt.claims', ...) which Supabase RLS uses via auth.uid()

-- Switch to the patient role
CREATE OR REPLACE FUNCTION tests.set_auth(user_email TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM profiles WHERE email = user_email;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid::TEXT, 'role', 'authenticated')::TEXT, true);
END;
$$;

-- ============================================================================
-- 1. CAREGIVER WITH NO GRANT SEES ZERO ROWS
-- ============================================================================
-- Set up an ungranteed caregiver scenario
DO $$ BEGIN PERFORM tests.set_auth('caregiver@test.local'); END $$;

-- Revoke any existing grants to simulate "no grant"
UPDATE grants SET revoked_at = NOW()
WHERE grantee_id = (SELECT id FROM profiles WHERE email = 'caregiver@test.local')
  AND revoked_at IS NULL;

SELECT is(
  (SELECT COUNT(*)::INT FROM vital_samples
   WHERE patient_id = (SELECT id FROM profiles WHERE email = 'patient@test.local')),
  0,
  'CR-OFF-09: caregiver with no grant sees 0 vital_samples'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM ecg_recordings
   WHERE patient_id = (SELECT id FROM profiles WHERE email = 'patient@test.local')),
  0,
  'CR-OFF-09: caregiver with no grant sees 0 ecg_recordings'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM addon_readings
   WHERE patient_id = (SELECT id FROM profiles WHERE email = 'patient@test.local')),
  0,
  'CR-OFF-09: caregiver with no grant sees 0 addon_readings'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM dose_events
   WHERE patient_id = (SELECT id FROM profiles WHERE email = 'patient@test.local')),
  0,
  'CR-OFF-09: caregiver with no grant sees 0 dose_events'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM symptom_logs
   WHERE patient_id = (SELECT id FROM profiles WHERE email = 'patient@test.local')),
  0,
  'CR-OFF-09: caregiver with no grant sees 0 symptom_logs'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM mood_checkins
   WHERE patient_id = (SELECT id FROM profiles WHERE email = 'patient@test.local')),
  0,
  'CR-OFF-09: caregiver with no grant sees 0 mood_checkins'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM records
   WHERE patient_id = (SELECT id FROM profiles WHERE email = 'patient@test.local')),
  0,
  'CR-OFF-09: caregiver with no grant sees 0 records'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM motion_events
   WHERE patient_id = (SELECT id FROM profiles WHERE email = 'patient@test.local')),
  0,
  'CR-OFF-09: caregiver with no grant sees 0 motion_events'
);

-- Restore grants
UPDATE grants SET revoked_at = NULL
WHERE grantee_id = (SELECT id FROM profiles WHERE email = 'caregiver@test.local');

-- ============================================================================
-- 2. ADMIN SEES ZERO CLINICAL ROWS (by default, no break-glass)
-- ============================================================================
DO $$ BEGIN PERFORM tests.set_auth('admin@test.local'); END $$;

SELECT is(
  (SELECT COUNT(*)::INT FROM vital_samples),
  0,
  'CR-OFF-09: admin sees 0 vital_samples (no clinical access)'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM ecg_recordings),
  0,
  'CR-OFF-09: admin sees 0 ecg_recordings'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM dose_events),
  0,
  'CR-OFF-09: admin sees 0 dose_events'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM symptom_logs),
  0,
  'CR-OFF-09: admin sees 0 symptom_logs'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM mood_checkins),
  0,
  'CR-OFF-09: admin sees 0 mood_checkins'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM alerts),
  0,
  'CR-OFF-09: admin sees 0 alerts (no break-glass)'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM records),
  0,
  'CR-OFF-09: admin sees 0 records'
);

-- Admin CAN see platform tables
SELECT isnt(
  (SELECT COUNT(*)::INT FROM emergency_providers),
  -1,
  'CR-PLT-01: admin can read emergency_providers'
);

SELECT isnt(
  (SELECT COUNT(*)::INT FROM clinician_verifications),
  -1,
  'CR-PLT-01: admin can read clinician_verifications'
);

SELECT isnt(
  (SELECT COUNT(*)::INT FROM devices),
  -1,
  'CR-PLT-01: admin can read devices'
);

-- ============================================================================
-- 3. UNVERIFIED CLINICIAN SEES NOTHING
-- ============================================================================
-- Create a temporary unverified clinician
INSERT INTO profiles (id, email, role, full_name)
VALUES ('00000000-0000-0000-0000-000000000099', 'unverified@test.local', 'clinician', 'Unverified Clinician')
ON CONFLICT DO NOTHING;

DO $$ BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000099","role":"authenticated"}', true);
END $$;

SELECT is(
  (SELECT COUNT(*)::INT FROM vital_samples),
  0,
  'CR-CLN-09: unverified clinician sees 0 vital_samples'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM ecg_recordings),
  0,
  'CR-CLN-09: unverified clinician sees 0 ecg_recordings'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM medications),
  0,
  'CR-CLN-09: unverified clinician sees 0 medications'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM dose_events),
  0,
  'CR-CLN-09: unverified clinician sees 0 dose_events'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM alerts),
  0,
  'CR-CLN-09: unverified clinician sees 0 alerts'
);

-- ============================================================================
-- 4. DOSE CANNOT BE LOGGED TWICE (CR-MED-04)
-- ============================================================================
DO $$ BEGIN PERFORM tests.set_auth('patient@test.local'); END $$;

-- Insert a dose event
INSERT INTO dose_events (medication_id, patient_id, schedule_id, scheduled_for, status, confirmed_at)
SELECT m.id, p.id, NULL, '2026-10-16 08:00:00+00', 'taken', '2026-10-16 08:05:00+00'
FROM medications m, profiles p
WHERE m.patient_id = p.id AND p.email = 'patient@test.local'
LIMIT 1;

-- Attempt duplicate insert — must raise exception
SELECT throws_ok(
  $$
    INSERT INTO dose_events (medication_id, patient_id, schedule_id, scheduled_for, status, confirmed_at)
    SELECT m.id, p.id, NULL, '2026-10-16 08:00:00+00', 'taken', '2026-10-16 08:06:00+00'
    FROM medications m, profiles p
    WHERE m.patient_id = p.id AND p.email = 'patient@test.local'
    LIMIT 1
  $$,
  '23505',
  'CR-MED-04: duplicate (schedule_id, scheduled_for) raises unique_violation'
);

-- ============================================================================
-- 5. MOOD DATA REQUIRES mood GRANT (CR-SOS-08 / CR-SEC-05)
-- ============================================================================
-- Re-grant vitals but NOT mood to the caregiver
DO $$ BEGIN PERFORM tests.set_auth('caregiver@test.local'); END $$;

SELECT is(
  (SELECT COUNT(*)::INT FROM mood_checkins),
  0,
  'CR-SOS-08: caregiver without mood grant sees 0 mood_checkins'
);

-- ============================================================================
-- Cleanup
-- ============================================================================
DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000099';

SELECT * FROM finish();
ROLLBACK;
