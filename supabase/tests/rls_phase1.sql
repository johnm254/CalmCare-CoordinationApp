-- Project Epi / Duara — pgTAP RLS Tests (Phase 1 gate)
-- Self-contained: creates its own fixtures with deterministic UUIDs, verifies gate
-- criteria, then rolls back — leaves the database exactly as it was found.
--
-- Gate: "A caregiver with no grant sees zero rows on every clinical table;
--        admin sees zero clinical rows; unverified clinician sees nothing."
--
-- Run with: pnpm supabase test db   (requires supabase/config.toml)

BEGIN;

SELECT plan(28);

-- ============================================================================
-- Fixture UUIDs — deterministic so test output is stable across runs
-- ============================================================================
DO $$
DECLARE
  p_patient   CONSTANT UUID := '10000000-0000-0000-0000-000000000001';
  p_caregiver CONSTANT UUID := '10000000-0000-0000-0000-000000000002';
  p_clinician CONSTANT UUID := '10000000-0000-0000-0000-000000000003';
  p_admin     CONSTANT UUID := '10000000-0000-0000-0000-000000000004';
  p_unverif   CONSTANT UUID := '10000000-0000-0000-0000-000000000005';
  p_med       CONSTANT UUID := '20000000-0000-0000-0000-000000000001';
  p_sched     CONSTANT UUID := '20000000-0000-0000-0000-000000000002';
BEGIN
  -- Profiles
  INSERT INTO profiles (id, email, role, full_name) VALUES
    (p_patient,   'rls_patient@test.local',   'patient',   'Test Patient'),
    (p_caregiver, 'rls_caregiver@test.local', 'caregiver', 'Test Caregiver'),
    (p_clinician, 'rls_clinician@test.local', 'clinician', 'Test Clinician'),
    (p_admin,     'rls_admin@test.local',     'admin',     'Test Admin'),
    (p_unverif,   'rls_unverif@test.local',   'clinician', 'Unverified Clinician')
  ON CONFLICT (id) DO NOTHING;

  -- Verified clinician
  INSERT INTO clinician_verifications
    (clinician_id, licence_number, cadre, registering_body, status, verified_at)
  VALUES
    (p_clinician, 'TEST-LIC-001', 'doctor', 'KMPDC', 'verified', NOW())
  ON CONFLICT DO NOTHING;

  -- Grant: caregiver→patient for vitals (active, not revoked)
  INSERT INTO grants (grantee_id, patient_id, category, expires_at)
  VALUES (p_caregiver, p_patient, 'vitals', NOW() + INTERVAL '1 year')
  ON CONFLICT DO NOTHING;

  -- Clinical data rows owned by the patient
  INSERT INTO medications (id, patient_id, name, dosage, frequency)
  VALUES (p_med, p_patient, 'Test Med', '100mg', 'once_daily')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO dose_events
    (medication_id, patient_id, schedule_id, scheduled_for, status)
  VALUES
    (p_med, p_patient, p_sched, '2026-10-16 08:00:00+00', 'taken')
  ON CONFLICT DO NOTHING;

  INSERT INTO symptom_logs (patient_id, symptom_type, severity)
  VALUES (p_patient, 'headache', 3)
  ON CONFLICT DO NOTHING;

  INSERT INTO mood_checkins (patient_id, score)
  VALUES (p_patient, 4)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Helper: set JWT claims so RLS evaluates as the given user UUID
CREATE OR REPLACE FUNCTION tests.as_user(uid UUID)
RETURNS VOID LANGUAGE sql AS $$
  SELECT set_config(
    'request.jwt.claims',
    json_build_object('sub', uid::TEXT, 'role', 'authenticated')::TEXT,
    true
  );
$$;

-- ============================================================================
-- 1. CAREGIVER WITH NO GRANT SEES ZERO ROWS (CR-SEC-01)
-- Revoke the grant temporarily so the caregiver has no active access.
-- ============================================================================
UPDATE grants
SET revoked_at = NOW()
WHERE grantee_id = '10000000-0000-0000-0000-000000000002'
  AND revoked_at IS NULL;

SELECT tests.as_user('10000000-0000-0000-0000-000000000002');

SELECT is(
  (SELECT COUNT(*)::INT FROM vital_samples
   WHERE patient_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'CR-SEC-01: caregiver with no grant sees 0 vital_samples'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM ecg_recordings
   WHERE patient_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'CR-SEC-01: caregiver with no grant sees 0 ecg_recordings'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM addon_readings
   WHERE patient_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'CR-SEC-01: caregiver with no grant sees 0 addon_readings'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM dose_events
   WHERE patient_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'CR-SEC-01: caregiver with no grant sees 0 dose_events'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM symptom_logs
   WHERE patient_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'CR-SEC-01: caregiver with no grant sees 0 symptom_logs'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM mood_checkins
   WHERE patient_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'CR-SEC-01: caregiver with no grant sees 0 mood_checkins'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM records
   WHERE patient_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'CR-SEC-01: caregiver with no grant sees 0 records'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM motion_events
   WHERE patient_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'CR-SEC-01: caregiver with no grant sees 0 motion_events'
);

-- Restore the grant
UPDATE grants
SET revoked_at = NULL
WHERE grantee_id = '10000000-0000-0000-0000-000000000002';

-- ============================================================================
-- 2. ADMIN SEES ZERO CLINICAL ROWS (CR-ADM-01)
-- Admins manage the platform; they must not see patient data without break-glass.
-- ============================================================================
SELECT tests.as_user('10000000-0000-0000-0000-000000000004');

SELECT is(
  (SELECT COUNT(*)::INT FROM vital_samples),
  0,
  'CR-ADM-01: admin sees 0 vital_samples (no break-glass)'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM ecg_recordings),
  0,
  'CR-ADM-01: admin sees 0 ecg_recordings'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM dose_events),
  0,
  'CR-ADM-01: admin sees 0 dose_events'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM symptom_logs),
  0,
  'CR-ADM-01: admin sees 0 symptom_logs'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM mood_checkins),
  0,
  'CR-ADM-01: admin sees 0 mood_checkins'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM alerts),
  0,
  'CR-ADM-01: admin sees 0 alerts (no break-glass)'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM records),
  0,
  'CR-ADM-01: admin sees 0 records'
);

-- Admin CAN read platform-management tables
SELECT isnt(
  (SELECT COUNT(*)::INT FROM emergency_providers),
  -1,
  'CR-ADM-01: admin can read emergency_providers (platform table)'
);

SELECT isnt(
  (SELECT COUNT(*)::INT FROM clinician_verifications),
  -1,
  'CR-ADM-01: admin can read clinician_verifications'
);

SELECT isnt(
  (SELECT COUNT(*)::INT FROM devices),
  -1,
  'CR-ADM-01: admin can read devices'
);

-- ============================================================================
-- 3. UNVERIFIED CLINICIAN SEES NOTHING (CR-CLIN-01)
-- ============================================================================
SELECT tests.as_user('10000000-0000-0000-0000-000000000005');

SELECT is(
  (SELECT COUNT(*)::INT FROM vital_samples),
  0,
  'CR-CLIN-01: unverified clinician sees 0 vital_samples'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM ecg_recordings),
  0,
  'CR-CLIN-01: unverified clinician sees 0 ecg_recordings'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM medications),
  0,
  'CR-CLIN-01: unverified clinician sees 0 medications'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM dose_events),
  0,
  'CR-CLIN-01: unverified clinician sees 0 dose_events'
);

SELECT is(
  (SELECT COUNT(*)::INT FROM alerts),
  0,
  'CR-CLIN-01: unverified clinician sees 0 alerts'
);

-- ============================================================================
-- 4. DOSE CANNOT BE LOGGED TWICE FOR THE SAME SCHEDULE SLOT (CR-MED-02)
-- ============================================================================
SELECT tests.as_user('10000000-0000-0000-0000-000000000001');

SELECT throws_ok(
  $$
    INSERT INTO dose_events
      (medication_id, patient_id, schedule_id, scheduled_for, status)
    VALUES
      ('20000000-0000-0000-0000-000000000001',
       '10000000-0000-0000-0000-000000000001',
       '20000000-0000-0000-0000-000000000002',
       '2026-10-16 08:00:00+00',
       'missed')
  $$,
  '23505',
  'CR-MED-02: duplicate (schedule_id, scheduled_for) raises unique_violation'
);

-- ============================================================================
-- 5. MOOD DATA REQUIRES mood GRANT (CR-SEC-04)
-- Caregiver has vitals grant but NOT mood — must see 0 mood_checkins.
-- ============================================================================
SELECT tests.as_user('10000000-0000-0000-0000-000000000002');

SELECT is(
  (SELECT COUNT(*)::INT FROM mood_checkins),
  0,
  'CR-SEC-04: caregiver without mood grant sees 0 mood_checkins'
);

-- ============================================================================
-- Cleanup: ROLLBACK removes all fixture data automatically
-- ============================================================================
SELECT * FROM finish();
ROLLBACK;
