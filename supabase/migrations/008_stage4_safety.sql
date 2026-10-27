-- Migration 008: Stage 4 safety-critical schema fixes
-- Covers: CR-CG-06, CR-CG-07, CR-SOS-01a, CR-SOS-03, CR-SOS-05,
--         CR-SEC-02, CR-SEC-05, CR-SEC-10

-- ── 1. sos_responses: distinguish reached/not_reached/ok ─────────────────────
-- CR-CG-06: "I can't reach them" must NOT stop escalation.
-- Adding NOT NULL but seeding existing demo rows as 'reached' for safety.
ALTER TABLE sos_responses
  ADD COLUMN IF NOT EXISTS response_type TEXT;

UPDATE sos_responses SET response_type = 'reached' WHERE response_type IS NULL;

ALTER TABLE sos_responses
  ALTER COLUMN response_type SET NOT NULL,
  ADD CONSTRAINT sos_responses_response_type_check
    CHECK (response_type IN ('reached', 'not_reached', 'ok'));

-- ── 2. care_circle: contact must accept before going active (CR-CG-07) ────────
ALTER TABLE care_circle
  ADD COLUMN IF NOT EXISTS contact_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (contact_status IN ('pending', 'accepted', 'declined')),
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Existing dev/seed rows are treated as accepted so the demo still works
UPDATE care_circle SET contact_status = 'accepted', invited_at = created_at
  WHERE contact_status = 'pending';

-- ── 3. alerts.state: add fall_check as the first state (CR-SOS-01a) ──────────
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_state_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_state_check
  CHECK (state IN (
    'fall_check',
    'raised', 'notifying', 'awaiting_response',
    'responded', 'dispatching', 'dispatched',
    'resolved', 'cancelled', 'false_alarm'
  ));

-- ── 4. clinician_verifications: account lockout fields (CR-SEC-05) ────────────
ALTER TABLE clinician_verifications
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until    TIMESTAMPTZ;

-- ── 5. sms_queue: offline SMS queue so escalation clock is not lost (CR-SOS-03)
CREATE TABLE IF NOT EXISTS sms_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES profiles(id),
  alert_id      UUID REFERENCES alerts(id),
  recipient     TEXT NOT NULL,       -- E.164 phone number
  body          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sms_queue ENABLE ROW LEVEL SECURITY;

-- Patient can see queued SMS for their own alerts
CREATE POLICY "sms_queue_patient_read" ON sms_queue
  FOR SELECT USING (patient_id = auth.uid());

-- Service role writes (Edge Function)
-- (service role bypasses RLS by design)

-- ── 6. consent_log: one row per consent per purpose (CR-SEC-10) ───────────────
CREATE TABLE IF NOT EXISTS consent_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purpose     TEXT NOT NULL CHECK (purpose IN (
                'welcome', 'location', 'medical_details',
                'sos_contact', 'clinician_link', 'stop_sharing', 'offline'
              )),
  granted     BOOLEAN NOT NULL,
  copy_id     TEXT NOT NULL,          -- playbook copy ID e.g. CON-02
  copy_version TEXT NOT NULL DEFAULT 'v1',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_log_patient_access" ON consent_log
  FOR ALL USING (patient_id = auth.uid());

-- ── 7. Update is_emergency_contact() — only accepted contacts get alerts ──────
CREATE OR REPLACE FUNCTION is_emergency_contact(patient UUID, uid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM care_circle
    WHERE patient_id     = patient
      AND member_id      = uid
      AND is_emergency   = true
      AND contact_status = 'accepted'
  );
$$;

-- ── 8. Fall/seizure trigger: create fall_check alert automatically ────────────
-- CR-SOS-01a: fall detected → alert in fall_check state → 30 s window → raised
CREATE OR REPLACE FUNCTION trigger_fall_alert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_source TEXT;
BEGIN
  IF    NEW.type = 'fall'               THEN v_source := 'fall';
  ELSIF NEW.type = 'convulsive_episode' THEN v_source := 'seizure';
  ELSE  RETURN NEW; -- tremor / inactivity: no automatic critical alert
  END IF;

  INSERT INTO alerts (patient_id, source, severity, pathway, state, opened_at)
  VALUES (
    NEW.patient_id,
    v_source,
    'critical',
    'medical',
    'fall_check',
    NEW.measured_at
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_motion_event_fall ON motion_events;
CREATE TRIGGER on_motion_event_fall
  AFTER INSERT ON motion_events
  FOR EACH ROW
  WHEN (NEW.type IN ('fall', 'convulsive_episode'))
  EXECUTE FUNCTION trigger_fall_alert();

-- ── 9. Revoke cache-clear signal (CR-SEC-02) ─────────────────────────────────
-- When a grant is revoked, insert a 'cache_clear' notification so the
-- grantee's device knows to drop local cached data for that category.
CREATE OR REPLACE FUNCTION notify_cache_clear_on_revoke()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
    INSERT INTO notifications (recipient_id, kind, payload)
    VALUES (
      NEW.grantee_id,
      'cache_clear',
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'category',   NEW.category,
        'revoked_at', NEW.revoked_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_grant_revoke ON grants;
CREATE TRIGGER on_grant_revoke
  AFTER UPDATE OF revoked_at ON grants
  FOR EACH ROW EXECUTE FUNCTION notify_cache_clear_on_revoke();

-- ── 10. Indexes for new tables ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sms_queue_patient   ON sms_queue(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_consent_log_patient ON consent_log(patient_id, purpose);
CREATE INDEX IF NOT EXISTS idx_care_circle_status  ON care_circle(patient_id, contact_status);
CREATE INDEX IF NOT EXISTS idx_sos_resp_type       ON sos_responses(sos_event_id, response_type);
