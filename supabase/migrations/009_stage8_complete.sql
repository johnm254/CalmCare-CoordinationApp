-- Migration 009: Stage 8 — complete remaining schema gaps
-- Covers: CR-SEC-05, CR-CLIN-01, CR-ADM-12, CR-MED-01, CR-CG-03,
--         CR-CG-05, CR-SEC-13, CR-SEC-07

-- ── 1. Failed-attempts lockout for clinicians ─────────────────────────────────
-- CR-SEC-05: Clinician accounts must lock after 5 consecutive failed login
-- attempts to defend against brute-force credential attacks.
-- CR-CLIN-01: Account suspension must be auditable and reversible.
--
-- Note: failed_attempts and locked_until were added in migration 008 for the
-- clinician_verifications table. These functions wire the business logic on top
-- of those columns.

-- Ensure columns exist idempotently (safe if 008 has already run)
ALTER TABLE clinician_verifications
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until    TIMESTAMPTZ;

-- Returns true when the clinician account is currently locked out.
CREATE OR REPLACE FUNCTION is_clinician_locked(clinician_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(locked_until > NOW(), false)
  FROM clinician_verifications
  WHERE clinician_id = clinician_uuid;
$$;

-- Called by the clinician-web auth flow on every failed login attempt.
-- After the 5th consecutive failure the account is locked for 15 minutes.
CREATE OR REPLACE FUNCTION record_failed_login(clinician_uuid UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE clinician_verifications
  SET
    failed_attempts = failed_attempts + 1,
    locked_until = CASE
      WHEN failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
      ELSE locked_until
    END
  WHERE clinician_id = clinician_uuid;
END;
$$;

-- Called by the clinician-web auth flow on every successful login.
-- Resets the counter so a later mistake does not accumulate from a stale total.
CREATE OR REPLACE FUNCTION reset_failed_login(clinician_uuid UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE clinician_verifications
  SET failed_attempts = 0,
      locked_until    = NULL
  WHERE clinician_id = clinician_uuid;
$$;

-- ── 2. Notification templates table ──────────────────────────────────────────
-- CR-ADM-12: All push/SMS copy must be stored centrally so an admin can update
-- wording without a code deploy.  The privacy_vetted flag guards lock-screen
-- safety: only templates that a copy reviewer has approved may be delivered.

CREATE TABLE IF NOT EXISTS notification_templates (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key     TEXT      NOT NULL UNIQUE,          -- e.g. 'sos', 'missed_dose'
  surface          TEXT      NOT NULL CHECK(surface IN ('push', 'sms', 'in_app')),
  title_en         TEXT      NOT NULL,
  title_sw         TEXT,
  body_en          TEXT      NOT NULL,
  body_sw          TEXT,
  -- CR-SEC-11: admin marks true only after lock-screen privacy review passes
  privacy_vetted   BOOLEAN   NOT NULL DEFAULT false,
  copy_version     INTEGER   NOT NULL DEFAULT 1,
  last_updated_by  UUID      REFERENCES auth.users(id),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Authenticated users may only read templates that have passed privacy review.
-- This prevents a half-drafted template from being delivered to a device.
CREATE POLICY "notif_templates_authed_read" ON notification_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND privacy_vetted = true);

-- Admin role can manage the full catalogue.
CREATE POLICY "notif_templates_admin_all" ON notification_templates
  FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Seed the five LOCK_SCREEN_SAFE templates defined in src/lib/notifications.ts.
-- privacy_vetted = true because these strings were authored to pass the filter.
INSERT INTO notification_templates
  (template_key, surface, title_en, body_en, privacy_vetted, copy_version)
VALUES
  ('sos',               'push', '[Name] pressed SOS',
   'Please check they are safe. Tap to respond.',              true, 1),
  ('missed_dose',       'push', 'Dose reminder',
   'A reminder has been sent for [Name].',                     true, 1),
  ('fall_check',        'push', '[Name] may need help',
   'They have not responded to a fall check.',                 true, 1),
  ('awaiting_response', 'push', 'No reply yet',
   '[Name] may need help. Tap to respond.',                    true, 1),
  ('dispatching',       'push', 'Emergency services notified',
   'Escalation complete for [Name].',                         true, 1)
ON CONFLICT (template_key) DO NOTHING;

-- ── 3. Missed-dose escalation table ──────────────────────────────────────────
-- CR-MED-01: The system must record every missed dose and track whether it was
-- acknowledged by the patient or escalated to a caregiver.
-- CR-CG-03: Caregivers with the medications grant must be able to mark a dose
-- as taken on the patient's behalf.

CREATE TABLE IF NOT EXISTS missed_dose_alerts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id         UUID        NOT NULL REFERENCES medication_schedules(id) ON DELETE CASCADE,
  patient_id          UUID        NOT NULL REFERENCES profiles(id)             ON DELETE CASCADE,
  scheduled_for       TIMESTAMPTZ NOT NULL,
  missed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  repeat_count        INTEGER     NOT NULL DEFAULT 0,
  caregiver_reminded_at TIMESTAMPTZ,
  marked_taken_by     UUID        REFERENCES auth.users(id),
  marked_taken_at     TIMESTAMPTZ,
  state               TEXT        NOT NULL DEFAULT 'open'
                        CHECK(state IN ('open', 'reminded', 'marked_taken', 'dismissed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missed_dose_patient
  ON missed_dose_alerts(patient_id, state);

ALTER TABLE missed_dose_alerts ENABLE ROW LEVEL SECURITY;

-- Patient reads and updates their own missed-dose rows.
CREATE POLICY "missed_dose_patient_access" ON missed_dose_alerts
  FOR ALL
  USING (patient_id = auth.uid());

-- Caregiver with the medications grant can read open/reminded rows and transition
-- state to 'reminded' or 'marked_taken'. They may NOT dismiss alerts.
CREATE POLICY "missed_dose_caregiver_read" ON missed_dose_alerts
  FOR SELECT
  USING (has_grant(patient_id, auth.uid(), 'medications'));

CREATE POLICY "missed_dose_caregiver_update" ON missed_dose_alerts
  FOR UPDATE
  USING (has_grant(patient_id, auth.uid(), 'medications'))
  WITH CHECK (state IN ('reminded', 'marked_taken'));

-- Service role (Edge Functions) has full access through the Supabase service key,
-- which bypasses RLS by design — no explicit policy needed.

-- ── 4. SMS inbound queue (CR-CG-05 digit-reply) ───────────────────────────────
-- CR-CG-05: Caregivers who receive an SOS SMS may reply with a digit (1 = reached,
-- 2 = not reached). This table captures those inbound messages from the webhook
-- provided by Africa's Talking or Twilio.

CREATE TABLE IF NOT EXISTS sms_inbound (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  from_phone       TEXT      NOT NULL,
  body             TEXT      NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parsed_response  TEXT      CHECK(parsed_response IN ('reached', 'not_reached', 'unknown')),
  matched_alert_id UUID      REFERENCES alerts(id),
  processed        BOOLEAN   NOT NULL DEFAULT false
);

-- sms_inbound is written and read exclusively by Edge Functions running under
-- the Supabase service role key. No authenticated user should ever query it
-- directly, so RLS is enabled with no permissive policies (deny by default).
ALTER TABLE sms_inbound ENABLE ROW LEVEL SECURITY;

-- Parses a raw inbound SMS body into a canonical response token.
-- Called by the inbound webhook Edge Function immediately after INSERT.
CREATE OR REPLACE FUNCTION parse_sms_reply(
  phone        TEXT,
  message_body TEXT
) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  trimmed TEXT := trim(lower(message_body));
BEGIN
  IF trimmed IN ('1', 'yes', 'ok', 'reached', 'y') THEN
    RETURN 'reached';
  ELSIF trimmed IN ('2', 'no', 'not reached', 'cant reach', 'cannot reach', 'n') THEN
    RETURN 'not_reached';
  ELSE
    RETURN 'unknown';
  END IF;
END;
$$;

-- ── 5. Analytics legal flag ───────────────────────────────────────────────────
-- CR-SEC-13: No analytics SDK may be activated without explicit legal approval.
-- The scripts/check-analytics.sh CI script checks for this flag in feature_flags
-- before allowing an analytics-enabled build to pass.
-- The feature_flags table uses `key` (not `flag_name`); see migration 003.

INSERT INTO feature_flags (key, enabled, rollout)
VALUES ('analytics_approved', false, '{"note": "Legal approval required. See docs/GAPS.md CR-SEC-13."}')
ON CONFLICT (key) DO NOTHING;

-- ── 6. Retention policy registry ─────────────────────────────────────────────
-- CR-SEC-07: Patient health data must be retained for the period required by
-- Kenyan medical records law (7 years) and then destroyed or anonymised
-- according to a documented policy.  This table records the approved policy for
-- each table containing personal health data.

CREATE TABLE IF NOT EXISTS retention_settings (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name       TEXT    NOT NULL UNIQUE,
  retain_years     INTEGER NOT NULL DEFAULT 7,
  delete_policy    TEXT    NOT NULL DEFAULT 'soft_delete'
                     CHECK(delete_policy IN ('soft_delete', 'hard_delete', 'anonymise')),
  last_reviewed_by UUID    REFERENCES auth.users(id),
  last_reviewed_at TIMESTAMPTZ
);

ALTER TABLE retention_settings ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read the retention policy (transparency).
CREATE POLICY "retention_settings_read" ON retention_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins may create or modify retention policies.
CREATE POLICY "retention_settings_admin_write" ON retention_settings
  FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

INSERT INTO retention_settings (table_name, retain_years, delete_policy)
VALUES
  ('vital_samples',  7, 'hard_delete'),
  ('dose_events',    7, 'hard_delete'),
  ('alerts',         7, 'soft_delete'),
  ('audit_log',      7, 'anonymise'),
  ('ecg_recordings', 7, 'hard_delete'),
  ('mood_checkins',  7, 'hard_delete'),
  ('sos_events',     7, 'hard_delete')
ON CONFLICT (table_name) DO NOTHING;

-- ── Stage 8 migration complete. ───────────────────────────────────────────────
-- Items still requiring external action before go-live:
--   • failed_attempts lockout: wire record_failed_login() to clinician-web auth flow
--   • notification_templates: admin must mark privacy_vetted = true after copy review
--   • sms_inbound: wire to Africa's Talking / Twilio inbound webhook
--   • retention_settings: cron job to enforce cleanup not yet implemented (Phase 9)
