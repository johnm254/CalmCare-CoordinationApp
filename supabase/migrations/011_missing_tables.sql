-- 011_missing_tables.sql
-- Creates mood_logs, appointments, caregiver_observations, saved_places,
-- condition_templates, incident_log, health_facilities (+ seed), patches
-- followups, and adds a patient-cancel policy on sos_events.
-- Every statement is idempotent.

-- ─── 1. mood_logs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mood_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score       SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
  note        TEXT,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient reads own mood_logs"   ON mood_logs;
CREATE POLICY "patient reads own mood_logs"
  ON mood_logs FOR SELECT
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "patient inserts own mood_logs" ON mood_logs;
CREATE POLICY "patient inserts own mood_logs"
  ON mood_logs FOR INSERT
  WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "clinician reads linked patient mood_logs" ON mood_logs;
CREATE POLICY "clinician reads linked patient mood_logs"
  ON mood_logs FOR SELECT
  USING (
    is_verified_clinician(auth.uid())
    AND patient_id IN (
      SELECT patient_id FROM clinician_links
      WHERE  clinician_id = auth.uid()
        AND  ended_at IS NULL
    )
  );


-- ─── 2. appointments ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinician_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ,
  preferred_date  TEXT,
  preferred_time  TEXT,
  reason          TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient reads own appointments"   ON appointments;
CREATE POLICY "patient reads own appointments"
  ON appointments FOR SELECT
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "patient inserts own appointments" ON appointments;
CREATE POLICY "patient inserts own appointments"
  ON appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "clinician reads own appointments" ON appointments;
CREATE POLICY "clinician reads own appointments"
  ON appointments FOR SELECT
  USING (
    clinician_id = auth.uid()
    AND is_verified_clinician(auth.uid())
  );

DROP POLICY IF EXISTS "clinician updates own appointments" ON appointments;
CREATE POLICY "clinician updates own appointments"
  ON appointments FOR UPDATE
  USING (
    clinician_id = auth.uid()
    AND is_verified_clinician(auth.uid())
  )
  WITH CHECK (
    clinician_id = auth.uid()
    AND is_verified_clinician(auth.uid())
  );


-- ─── 3. caregiver_observations ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS caregiver_observations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id      UUID        REFERENCES events(id) ON DELETE SET NULL,
  observed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_sec  INTEGER,
  seizure_type  TEXT,
  postictal     BOOLEAN,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE caregiver_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caregiver inserts own observations"       ON caregiver_observations;
CREATE POLICY "caregiver inserts own observations"
  ON caregiver_observations FOR INSERT
  WITH CHECK (caregiver_id = auth.uid());

DROP POLICY IF EXISTS "patient reads own caregiver_observations" ON caregiver_observations;
CREATE POLICY "patient reads own caregiver_observations"
  ON caregiver_observations FOR SELECT
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "clinician reads linked patient caregiver_observations" ON caregiver_observations;
CREATE POLICY "clinician reads linked patient caregiver_observations"
  ON caregiver_observations FOR SELECT
  USING (
    is_verified_clinician(auth.uid())
    AND patient_id IN (
      SELECT patient_id FROM clinician_links
      WHERE  clinician_id = auth.uid()
        AND  ended_at IS NULL
    )
  );


-- ─── 4. saved_places ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_places (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID              NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT              NOT NULL,
  lat         DOUBLE PRECISION  NOT NULL,
  lng         DOUBLE PRECISION  NOT NULL,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient reads own saved_places"   ON saved_places;
CREATE POLICY "patient reads own saved_places"
  ON saved_places FOR SELECT
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "patient inserts own saved_places" ON saved_places;
CREATE POLICY "patient inserts own saved_places"
  ON saved_places FOR INSERT
  WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "patient deletes own saved_places" ON saved_places;
CREATE POLICY "patient deletes own saved_places"
  ON saved_places FOR DELETE
  USING (patient_id = auth.uid());


-- ─── 5. condition_templates ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS condition_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  seizure_types   TEXT[],
  severity_scale  TEXT,
  notes           TEXT,
  created_by      UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE condition_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage condition_templates"         ON condition_templates;
CREATE POLICY "admins manage condition_templates"
  ON condition_templates FOR ALL
  USING     (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK(auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "authenticated read condition_templates"    ON condition_templates;
CREATE POLICY "authenticated read condition_templates"
  ON condition_templates FOR SELECT
  USING (auth.role() = 'authenticated');


-- ─── 6. incident_log ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incident_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason        TEXT        NOT NULL,
  accessed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_by   UUID        REFERENCES auth.users(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE incident_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage incident_log"        ON incident_log;
CREATE POLICY "admins manage incident_log"
  ON incident_log FOR ALL
  USING     (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK(auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "clinician reads own incident_log"  ON incident_log;
CREATE POLICY "clinician reads own incident_log"
  ON incident_log FOR SELECT
  USING (clinician_id = auth.uid());

-- No DELETE policy (append-only); enforce with triggers:

CREATE OR REPLACE FUNCTION fn_incident_log_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'incident_log rows are immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_incident_log_no_update ON incident_log;
CREATE TRIGGER trg_incident_log_no_update
  BEFORE UPDATE ON incident_log
  FOR EACH ROW EXECUTE FUNCTION fn_incident_log_immutable();

DROP TRIGGER IF EXISTS trg_incident_log_no_delete ON incident_log;
CREATE TRIGGER trg_incident_log_no_delete
  BEFORE DELETE ON incident_log
  FOR EACH ROW EXECUTE FUNCTION fn_incident_log_immutable();


-- ─── 7. sos_events: patient cancel policy ─────────────────────────────────────

DROP POLICY IF EXISTS "patient can cancel own sos_event" ON sos_events;
CREATE POLICY "patient can cancel own sos_event"
  ON sos_events FOR UPDATE
  USING    (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid() AND status = 'cancelled');


-- ─── 8. health_facilities ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS health_facilities (
  id         UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT             NOT NULL,
  phone      TEXT,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  county     TEXT,
  type       TEXT             DEFAULT 'hospital',
  er_24h     BOOLEAN          NOT NULL DEFAULT TRUE,
  active     BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

ALTER TABLE health_facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage health_facilities"      ON health_facilities;
CREATE POLICY "admins manage health_facilities"
  ON health_facilities FOR ALL
  USING     (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK(auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "authenticated read health_facilities" ON health_facilities;
CREATE POLICY "authenticated read health_facilities"
  ON health_facilities FOR SELECT
  USING (auth.role() = 'authenticated' AND active = TRUE);

-- Spatial index (idempotent — also referenced in migration 010)
CREATE INDEX IF NOT EXISTS idx_health_facilities_latlon
  ON health_facilities (latitude, longitude)
  WHERE active = TRUE;

-- Seed 15 Nairobi-area hospitals
INSERT INTO health_facilities (id, name, phone, latitude, longitude, county, type, er_24h, active)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Kenyatta National Hospital',         '+254202726300', -1.3002,  36.8084, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000002', 'Nairobi Hospital',                   '+254203845000', -1.2961,  36.8174, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000003', 'Aga Khan Hospital Nairobi',          '+254203741000', -1.2638,  36.8059, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000004', 'MP Shah Hospital',                   NULL,            -1.2664,  36.7989, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000005', 'Gertrudes Children Hospital',        NULL,            -1.2714,  36.7892, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000006', 'Karen Hospital',                     NULL,            -1.3197,  36.7145, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000007', 'Mater Hospital',                     NULL,            -1.3044,  36.8438, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000008', 'Nairobi West Hospital',              NULL,            -1.3219,  36.8092, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000009', 'Coptic Hospital',                    NULL,            -1.2938,  36.8253, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000010', 'Kibera South Health Centre',         NULL,            -1.3133,  36.7836, 'Nairobi', 'health_centre', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000011', 'Kenyatta University Teaching Hospital', NULL,         -1.1817,  36.9256, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000012', 'Mathare Hospital',                   NULL,            -1.2558,  36.8622, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000013', 'Pumwani Maternity Hospital',         NULL,            -1.2728,  36.8471, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000014', 'Mbagathi Hospital',                  NULL,            -1.3145,  36.7808, 'Nairobi', 'hospital', TRUE, TRUE),
  ('a0000001-0000-0000-0000-000000000015', 'Chiromo Hospital Group',             NULL,            -1.2722,  36.8056, 'Nairobi', 'hospital', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;


-- ─── 9. followups: add reminder_sent_at column ────────────────────────────────

ALTER TABLE followups ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;


-- ─── 10. Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mood_logs_patient_logged
  ON mood_logs (patient_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_scheduled
  ON appointments (patient_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_appointments_clinician_status
  ON appointments (clinician_id, status);

CREATE INDEX IF NOT EXISTS idx_caregiver_observations_patient_observed
  ON caregiver_observations (patient_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_places_patient
  ON saved_places (patient_id);

CREATE INDEX IF NOT EXISTS idx_incident_log_clinician
  ON incident_log (clinician_id);

CREATE INDEX IF NOT EXISTS idx_incident_log_patient
  ON incident_log (patient_id);
