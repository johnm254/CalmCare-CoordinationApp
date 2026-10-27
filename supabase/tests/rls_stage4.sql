-- Stage 4 pgTAP tests — safety-critical schema assertions.
-- Covers: CR-CG-06, CR-CG-07, CR-SOS-01a, CR-SOS-03, CR-SEC-05, CR-SEC-10.
-- Self-contained: all fixtures rolled back.
--
-- Run with: pnpm supabase test db

BEGIN;

SELECT plan(14);

-- ============================================================================
-- Fixture UUIDs
-- ============================================================================
DO $$
DECLARE
  p_patient_a CONSTANT UUID := '30000000-0000-0000-0000-000000000001';
  p_patient_b CONSTANT UUID := '30000000-0000-0000-0000-000000000002';
  p_contact   CONSTANT UUID := '30000000-0000-0000-0000-000000000003';
  p_sos_evt   CONSTANT UUID := '30000000-0000-0000-0000-000000000010';
  p_alert     CONSTANT UUID := '30000000-0000-0000-0000-000000000020';
BEGIN
  INSERT INTO profiles (id, email, role, full_name) VALUES
    (p_patient_a, 's4_patient_a@test.local', 'patient',   'Stage4 PatientA'),
    (p_patient_b, 's4_patient_b@test.local', 'patient',   'Stage4 PatientB'),
    (p_contact,   's4_contact@test.local',   'caregiver', 'Stage4 Contact')
  ON CONFLICT (id) DO NOTHING;

  -- care_circle row: contact pending (not yet accepted)
  INSERT INTO care_circle (patient_id, member_id, is_emergency, contact_status)
  VALUES (p_patient_a, p_contact, true, 'pending')
  ON CONFLICT DO NOTHING;

  -- sos_event seed for response_type tests
  INSERT INTO sos_events (id, patient_id, triggered_by)
  VALUES (p_sos_evt, p_patient_a, 'button')
  ON CONFLICT (id) DO NOTHING;

  -- alert in fall_check state for CR-SOS-01a
  INSERT INTO alerts (id, patient_id, source, severity, pathway, state, opened_at)
  VALUES (p_alert, p_patient_a, 'fall', 'critical', 'medical', 'fall_check', NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION tests.as_user(uid UUID)
RETURNS VOID LANGUAGE sql AS $$
  SELECT set_config(
    'request.jwt.claims',
    json_build_object('sub', uid::TEXT, 'role', 'authenticated')::TEXT,
    true
  );
$$;

-- ============================================================================
-- 1. CR-CG-06: response_type CHECK constraint
-- ============================================================================

-- 'not_reached' is a valid type — must insert successfully
SELECT lives_ok(
  $$
    INSERT INTO sos_responses (sos_event_id, responder_id, response_type)
    VALUES (
      '30000000-0000-0000-0000-000000000010',
      '30000000-0000-0000-0000-000000000003',
      'not_reached'
    )
  $$,
  'CR-CG-06: not_reached is a valid response_type (does not block escalation)'
);

-- invalid type must fail
SELECT throws_ok(
  $$
    INSERT INTO sos_responses (sos_event_id, responder_id, response_type)
    VALUES (
      '30000000-0000-0000-0000-000000000010',
      '30000000-0000-0000-0000-000000000003',
      'invalid_type'
    )
  $$,
  '23514',
  'CR-CG-06: invalid response_type raises check_violation'
);

-- 'not_reached' rows must NOT appear in the "stop escalation" filter
SELECT is(
  (SELECT COUNT(*)::INT FROM sos_responses
   WHERE sos_event_id = '30000000-0000-0000-0000-000000000010'
     AND response_type IN ('reached', 'ok')),
  0,
  'CR-CG-06: not_reached row is invisible to the reached/ok escalation stop filter'
);

-- ============================================================================
-- 2. CR-CG-07: is_emergency_contact() requires contact_status = accepted
-- ============================================================================

SELECT is(
  is_emergency_contact(
    '30000000-0000-0000-0000-000000000001'::UUID,
    '30000000-0000-0000-0000-000000000003'::UUID
  ),
  false,
  'CR-CG-07: pending contact is NOT an emergency contact'
);

-- Promote to accepted
UPDATE care_circle
SET contact_status = 'accepted'
WHERE patient_id = '30000000-0000-0000-0000-000000000001'
  AND member_id  = '30000000-0000-0000-0000-000000000003';

SELECT is(
  is_emergency_contact(
    '30000000-0000-0000-0000-000000000001'::UUID,
    '30000000-0000-0000-0000-000000000003'::UUID
  ),
  true,
  'CR-CG-07: accepted contact IS an emergency contact'
);

-- contact_status invalid value must fail
SELECT throws_ok(
  $$
    UPDATE care_circle SET contact_status = 'active'
    WHERE patient_id = '30000000-0000-0000-0000-000000000001'
  $$,
  '23514',
  'CR-CG-07: invalid contact_status raises check_violation'
);

-- ============================================================================
-- 3. CR-SOS-01a: fall_check is a valid alert state
-- ============================================================================

SELECT is(
  (SELECT state FROM alerts WHERE id = '30000000-0000-0000-0000-000000000020'),
  'fall_check',
  'CR-SOS-01a: alert in fall_check state exists and is readable'
);

-- invalid state must still fail
SELECT throws_ok(
  $$
    INSERT INTO alerts (patient_id, source, severity, pathway, state, opened_at)
    VALUES (
      '30000000-0000-0000-0000-000000000001',
      'fall', 'critical', 'medical', 'invalid_state', NOW()
    )
  $$,
  '23514',
  'CR-SOS-01a: invalid alert state raises check_violation'
);

-- ============================================================================
-- 4. CR-SOS-03: sms_queue status CHECK
-- ============================================================================

SELECT throws_ok(
  $$
    INSERT INTO sms_queue (patient_id, recipient, body, status)
    VALUES (
      '30000000-0000-0000-0000-000000000001',
      '+254700000000',
      'Test',
      'bad_status'
    )
  $$,
  '23514',
  'CR-SOS-03: invalid sms_queue status raises check_violation'
);

-- ============================================================================
-- 5. CR-SEC-05: clinician_verifications lockout columns exist
-- ============================================================================

SELECT has_column(
  'public', 'clinician_verifications', 'failed_attempts',
  'CR-SEC-05: clinician_verifications has failed_attempts column'
);

SELECT has_column(
  'public', 'clinician_verifications', 'locked_until',
  'CR-SEC-05: clinician_verifications has locked_until column'
);

-- ============================================================================
-- 6. CR-SEC-10: consent_log RLS — patient sees own rows only
-- ============================================================================

SELECT tests.as_user('30000000-0000-0000-0000-000000000001');

INSERT INTO consent_log (patient_id, purpose, granted, copy_id, copy_version)
VALUES ('30000000-0000-0000-0000-000000000001', 'location', true, 'CON-02', 'v1');

SELECT is(
  (SELECT COUNT(*)::INT FROM consent_log
   WHERE patient_id = '30000000-0000-0000-0000-000000000001'),
  1,
  'CR-SEC-10: patient can read their own consent_log row'
);

-- Switch to patient_b — must see zero of patient_a rows
SELECT tests.as_user('30000000-0000-0000-0000-000000000002');

SELECT is(
  (SELECT COUNT(*)::INT FROM consent_log
   WHERE patient_id = '30000000-0000-0000-0000-000000000001'),
  0,
  'CR-SEC-10: other patient sees 0 consent_log rows (RLS isolation)'
);

-- ============================================================================
-- Cleanup
-- ============================================================================
SELECT * FROM finish();
ROLLBACK;
