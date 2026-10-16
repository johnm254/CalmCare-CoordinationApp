-- Migration 004: SOS response tracking + push token registry.
-- Enables caregiver "I'm on my way" confirmation and Expo push delivery.

-- ── Push token registry ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_manages_own_push_tokens" ON push_tokens
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── SOS responses ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_event_id  UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
  responder_id  UUID NOT NULL REFERENCES profiles(id),
  responded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sos_event_id, responder_id)
);

ALTER TABLE sos_responses ENABLE ROW LEVEL SECURITY;

-- Responder inserts their own
CREATE POLICY "responder_inserts_own" ON sos_responses
  FOR INSERT WITH CHECK (auth.uid() = responder_id);

-- Patient sees all responses to their own SOS events
CREATE POLICY "patient_reads_responses" ON sos_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sos_events se
      WHERE se.id = sos_event_id AND se.patient_id = auth.uid()
    )
  );

-- Emergency contacts see responses (they are recipients)
CREATE POLICY "emergency_contact_reads_responses" ON sos_responses
  FOR SELECT USING (
    responder_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM sos_events se
      JOIN grants g
        ON  g.patient_id   = se.patient_id
        AND g.grantee_id   = auth.uid()
        AND g.category     = 'emergency_alerts'
        AND g.revoked_at   IS NULL
      WHERE se.id = sos_event_id
    )
  );

-- Enable Realtime so the caregiver screen updates live
ALTER PUBLICATION supabase_realtime ADD TABLE sos_responses;

-- ── Escalation cron (pg_cron) ─────────────────────────────────────────────────
-- Calls the escalation-tick Edge Function every minute.
-- Requires pg_cron extension (enabled by default on Supabase Pro; skip on Free).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'sos-escalation-tick',
      '* * * * *',
      $$
        SELECT net.http_post(
          url  := current_setting('app.supabase_url') || '/functions/v1/escalation-tick',
          headers := '{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
          body := '{}'::jsonb
        );
      $$
    );
  END IF;
END;
$$;
