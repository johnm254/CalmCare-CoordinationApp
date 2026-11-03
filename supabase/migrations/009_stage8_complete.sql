-- Migration 009: Stage 8 — complete remaining schema gaps

-- ── 1. Failed-attempts lockout for clinicians ─────────────────────────────────
ALTER TABLE clinician_verifications
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until    TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION is_clinician_locked(clinician_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(locked_until > NOW(), false)
  FROM clinician_verifications
  WHERE clinician_id = clinician_uuid;
$$;

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

CREATE OR REPLACE FUNCTION reset_failed_login(clinician_uuid UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE clinician_verifications
  SET failed_attempts = 0,
      locked_until    = NULL
  WHERE clinician_id = clinician_uuid;
$$;

-- ── 2. Notification templates table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_templates (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key     TEXT      NOT NULL UNIQUE,
  surface          TEXT      NOT NULL CHECK(surface IN ('push', 'sms', 'in_app')),
  title_en         TEXT      NOT NULL,
  title_sw         TEXT,
  body_en          TEXT      NOT NULL,
  body_sw          TEXT,
  privacy_vetted   BOOLEAN   NOT NULL DEFAULT false,
  copy_version     INTEGER   NOT NULL DEFAULT 1,
  last_updated_by  UUID      REFERENCES auth.users(id),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_templates_authed_read" ON notification_templates;
CREATE POLICY "notif_templates_authed_read" ON notification_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND privacy_vetted = true);

DROP POLICY IF EXISTS "notif_templates_admin_all" ON notification_templates;
CREATE POLICY "notif_templates_admin_all" ON notification_templates
  FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

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

DROP POLICY IF EXISTS "missed_dose_patient_access" ON missed_dose_alerts;
CREATE POLICY "missed_dose_patient_access" ON missed_dose_alerts
  FOR ALL
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "missed_dose_caregiver_read" ON missed_dose_alerts;
CREATE POLICY "missed_dose_caregiver_read" ON missed_dose_alerts
  FOR SELECT
  USING (has_grant(patient_id, auth.uid(), 'medications'));

DROP POLICY IF EXISTS "missed_dose_caregiver_update" ON missed_dose_alerts;
CREATE POLICY "missed_dose_caregiver_update" ON missed_dose_alerts
  FOR UPDATE
  USING (has_grant(patient_id, auth.uid(), 'medications'))
  WITH CHECK (state IN ('reminded', 'marked_taken'));

-- ── 4. SMS inbound queue ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_inbound (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  from_phone       TEXT      NOT NULL,
  body             TEXT      NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parsed_response  TEXT      CHECK(parsed_response IN ('reached', 'not_reached', 'unknown')),
  matched_alert_id UUID      REFERENCES alerts(id),
  processed        BOOLEAN   NOT NULL DEFAULT false
);

ALTER TABLE sms_inbound ENABLE ROW LEVEL SECURITY;

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
INSERT INTO feature_flags (key, enabled, rollout)
VALUES ('analytics_approved', false, '{"note": "Legal approval required. See docs/GAPS.md CR-SEC-13."}')
ON CONFLICT (key) DO NOTHING;

-- ── 6. Retention policy registry ─────────────────────────────────────────────
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

DROP POLICY IF EXISTS "retention_settings_read" ON retention_settings;
CREATE POLICY "retention_settings_read" ON retention_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "retention_settings_admin_write" ON retention_settings;
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
