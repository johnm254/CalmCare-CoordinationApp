-- Project Epi / Duara — Phase 1 Foundation Migration
-- Adds all tables from spec section 5 that are missing from migrations 001/002.
-- Rules:
--   • Additive only — never drops or renames existing columns.
--   • Every new table gets RLS enabled before any app code can read it.
--   • medication_logs TABLE → dose_events (new) + medication_logs VIEW.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";   -- geography columns for location data

-- ============================================================================
-- 1. EXTEND EXISTING TABLES (additive columns only)
-- ============================================================================

-- profiles: add missing columns from spec
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS language      TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS country       TEXT NOT NULL DEFAULT 'KE',
  ADD COLUMN IF NOT EXISTS region        TEXT;

-- profiles: expand role to include admin and org_admin
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('patient', 'caregiver', 'clinician', 'admin', 'org_admin'));

-- clinician_links: add invited_by and ended_at
ALTER TABLE clinician_links
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS ended_at   TIMESTAMPTZ;

-- care_circle: add display_name (alias used in SOS SMS) and sms_only flag
ALTER TABLE care_circle
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS sms_only     BOOLEAN NOT NULL DEFAULT false;

-- grants: expand categories to full spec set
ALTER TABLE grants DROP CONSTRAINT IF EXISTS grants_category_check;
ALTER TABLE grants ADD CONSTRAINT grants_category_check
  CHECK (category IN (
    'vitals', 'ecg', 'medications', 'adherence', 'appointments',
    'events', 'symptoms', 'mood', 'records',
    'location_on_sos', 'addon_readings',
    -- legacy values kept for backward compat with existing rows
    'emergency_alerts', 'medication_schedule', 'event_summaries'
  ));

-- medications: add missing spec columns
ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS strength          TEXT,
  ADD COLUMN IF NOT EXISTS form              TEXT,
  ADD COLUMN IF NOT EXISTS instructions      TEXT,
  ADD COLUMN IF NOT EXISTS prescribed_by     UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS start_date        DATE,
  ADD COLUMN IF NOT EXISTS end_date          DATE,
  ADD COLUMN IF NOT EXISTS stock_count       INTEGER,
  ADD COLUMN IF NOT EXISTS refill_threshold  INTEGER;

-- sos_events: add alert_id FK, geography location, accuracy, cancelled_at
ALTER TABLE sos_events
  ADD COLUMN IF NOT EXISTS alert_id          UUID,   -- FK added after alerts table created
  ADD COLUMN IF NOT EXISTS location_geo      GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS location_accuracy_m NUMERIC,
  ADD COLUMN IF NOT EXISTS cancelled_at      TIMESTAMPTZ;

-- audit_log: add actor_role, entity columns, ip, user_agent
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS actor_role  TEXT,
  ADD COLUMN IF NOT EXISTS entity      TEXT,
  ADD COLUMN IF NOT EXISTS entity_id   UUID,
  ADD COLUMN IF NOT EXISTS ip          TEXT,
  ADD COLUMN IF NOT EXISTS user_agent  TEXT;

-- ============================================================================
-- 2. IDENTITY AND ACCESS — new tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS organisations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('clinic', 'hospital', 'ngo')),
  country     TEXT NOT NULL DEFAULT 'KE',
  region      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id)       ON DELETE CASCADE,
  org_role    TEXT NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, profile_id)
);

CREATE TABLE IF NOT EXISTS clinician_verifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  licence_number   TEXT NOT NULL,
  cadre            TEXT NOT NULL CHECK (cadre IN ('doctor', 'clinical_officer', 'nurse', 'other')),
  registering_body TEXT NOT NULL CHECK (registering_body IN ('KMPDC', 'COC', 'NCK', 'other')),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'verified', 'rejected', 'expired', 'revoked')),
  verified_by      UUID REFERENCES profiles(id),
  verified_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  evidence_path    TEXT,
  method           TEXT NOT NULL DEFAULT 'manual'
                   CHECK (method IN ('register_api', 'manual')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS break_glass_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES profiles(id),
  patient_id  UUID NOT NULL REFERENCES profiles(id),
  reason      TEXT NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. DEVICES AND READINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS devices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial              TEXT NOT NULL UNIQUE,
  model               TEXT NOT NULL CHECK (model IN ('epi_strap_a', 'epi_strap_b')),
  hw_rev              TEXT,
  firmware_version    TEXT,
  status              TEXT NOT NULL DEFAULT 'in_stock'
                      CHECK (status IN ('in_stock', 'assigned', 'active', 'lost', 'retired')),
  assigned_patient_id UUID REFERENCES profiles(id),
  battery_pct         INTEGER,
  last_seen_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approved_addon_models (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       TEXT NOT NULL CHECK (kind IN ('bp_cuff', 'glucometer', 'cgm', 'scale')),
  brand      TEXT NOT NULL,
  model      TEXT NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, brand, model)
);

CREATE TABLE IF NOT EXISTS addon_devices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('bp_cuff', 'glucometer', 'cgm', 'scale')),
  brand        TEXT,
  model        TEXT,
  ble_id       TEXT,
  approved     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- vital_samples: partitioned by month for performance
CREATE TABLE IF NOT EXISTS vital_samples (
  id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  patient_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id    UUID        REFERENCES devices(id),
  metric       TEXT        NOT NULL CHECK (metric IN (
                 'heart_rate', 'spo2', 'skin_temp', 'resp_rate',
                 'hrv', 'steps', 'activity_level', 'sleep_stage')),
  value        NUMERIC     NOT NULL,
  unit         TEXT        NOT NULL,
  quality      INTEGER     NOT NULL DEFAULT 100 CHECK (quality BETWEEN 0 AND 100),
  measured_at  TIMESTAMPTZ NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, measured_at)
) PARTITION BY RANGE (measured_at);

-- Create initial partitions (current month + next)
CREATE TABLE IF NOT EXISTS vital_samples_2026_10
  PARTITION OF vital_samples
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS vital_samples_2026_11
  PARTITION OF vital_samples
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS vital_samples_2026_12
  PARTITION OF vital_samples
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE TABLE IF NOT EXISTS vital_rollups (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id    UUID        REFERENCES devices(id),
  metric       TEXT        NOT NULL,
  period       TEXT        NOT NULL CHECK (period IN ('5min', 'hourly', 'daily')),
  period_start TIMESTAMPTZ NOT NULL,
  min_value    NUMERIC,
  max_value    NUMERIC,
  avg_value    NUMERIC,
  sample_count INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, device_id, metric, period, period_start)
);

CREATE TABLE IF NOT EXISTS ecg_recordings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id            UUID REFERENCES devices(id),
  started_at           TIMESTAMPTZ NOT NULL,
  duration_s           INTEGER NOT NULL DEFAULT 30,
  sample_rate_hz       INTEGER NOT NULL DEFAULT 512,
  lead                 TEXT NOT NULL DEFAULT 'I',
  storage_path         TEXT,
  avg_hr               NUMERIC,
  device_classification TEXT CHECK (device_classification IN (
                          'sinus', 'af_suspected', 'inconclusive', 'poor_signal')),
  reviewed_by          UUID REFERENCES profiles(id),
  review_note          TEXT,
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addon_readings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addon_device_id UUID REFERENCES addon_devices(id),
  kind            TEXT NOT NULL CHECK (kind IN ('bp_cuff', 'glucometer', 'cgm', 'scale')),
  systolic        NUMERIC,
  diastolic       NUMERIC,
  pulse           NUMERIC,
  glucose_mmol    NUMERIC,
  meal_context    TEXT CHECK (meal_context IN ('fasting', 'before_meal', 'after_meal', 'random')),
  weight_kg       NUMERIC,
  measured_at     TIMESTAMPTZ NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS motion_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id   UUID REFERENCES devices(id),
  type        TEXT NOT NULL CHECK (type IN (
                'fall', 'convulsive_episode', 'tremor_episode', 'inactivity', 'wandering')),
  confidence  NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  measured_at TIMESTAMPTZ NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. MEDICATIONS — new tables + dose_events migration
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication_schedules (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id      UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  times              TIME[] NOT NULL,
  days_of_week       INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  dose_amount        TEXT,
  snooze_interval_min INTEGER NOT NULL DEFAULT 15,
  max_repeats        INTEGER NOT NULL DEFAULT 3,
  missed_after_min   INTEGER NOT NULL DEFAULT 60,
  escalate_to        TEXT NOT NULL DEFAULT 'caregiver'
                     CHECK (escalate_to IN ('caregiver', 'clinician', 'both')),
  version            INTEGER NOT NULL DEFAULT 1,
  active             BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- dose_events: canonical "taken" log with uniqueness (CR-MED-04)
CREATE TABLE IF NOT EXISTS dose_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id  UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  schedule_id    UUID REFERENCES medication_schedules(id),
  patient_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_for  TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'taken', 'snoozed', 'missed', 'skipped')),
  confirmed_at   TIMESTAMPTZ,
  confirmed_via  TEXT CHECK (confirmed_via IN ('strap', 'app', 'caregiver')),
  confirmed_by   UUID REFERENCES profiles(id),
  synced_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- CR-MED-04: a dose can only be logged once per schedule slot
  UNIQUE (schedule_id, scheduled_for)
);

-- Migrate existing medication_logs rows into dose_events
INSERT INTO dose_events (id, medication_id, patient_id, scheduled_for, status, confirmed_at, confirmed_via, synced_at, created_at)
SELECT
  id,
  medication_id,
  patient_id,
  taken_at     AS scheduled_for,
  'taken'      AS status,
  taken_at     AS confirmed_at,
  'app'        AS confirmed_via,
  synced_at,
  created_at
FROM medication_logs
ON CONFLICT (id) DO NOTHING;

-- Rename original table, then create view alias so old code still works
ALTER TABLE medication_logs RENAME TO medication_logs_old;

CREATE OR REPLACE VIEW medication_logs AS
SELECT
  id,
  medication_id,
  patient_id,
  confirmed_at  AS taken_at,
  synced_at,
  created_at
FROM dose_events
WHERE status = 'taken';

CREATE TABLE IF NOT EXISTS refill_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id   UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  triggered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. CONDITIONS AND CARE
-- ============================================================================

CREATE TABLE IF NOT EXISTS condition_templates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  grp                   TEXT NOT NULL CHECK (grp IN ('A', 'B', 'C')),
  metrics               TEXT[] NOT NULL DEFAULT '{}',
  required_addons       TEXT[] NOT NULL DEFAULT '{}',
  default_rule_templates JSONB NOT NULL DEFAULT '{}',
  reminder_types        TEXT[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add condition_template_id to conditions
ALTER TABLE conditions
  ADD COLUMN IF NOT EXISTS condition_template_id UUID REFERENCES condition_templates(id),
  ADD COLUMN IF NOT EXISTS diagnosed_by UUID REFERENCES profiles(id);

CREATE TABLE IF NOT EXISTS symptom_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symptom     TEXT NOT NULL,
  severity    INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  notes       TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  logged_by   UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mood_checkins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mood          INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy        INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
  sleep_quality INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 5),
  note          TEXT,
  occurred_at   TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clinician_id UUID REFERENCES profiles(id),
  starts_at    TIMESTAMPTZ NOT NULL,
  location     TEXT,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled', 'completed', 'cancelled', 'missed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('lab', 'discharge', 'prescription', 'imaging', 'other')),
  title        TEXT NOT NULL,
  storage_path TEXT,
  uploaded_by  UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinician_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES profiles(id),
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. ALERTS AND EMERGENCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_rules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  set_by     UUID NOT NULL REFERENCES profiles(id),
  metric     TEXT NOT NULL,
  operator   TEXT NOT NULL CHECK (operator IN ('gt', 'lt', 'gte', 'lte')),
  threshold  NUMERIC NOT NULL,
  duration_s INTEGER NOT NULL DEFAULT 0,
  severity   TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  pathway    TEXT NOT NULL DEFAULT 'medical' CHECK (pathway IN ('medical', 'mental_health')),
  active     BOOLEAN NOT NULL DEFAULT true,
  version    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_id     UUID REFERENCES alert_rules(id),
  source      TEXT NOT NULL CHECK (source IN (
                'vitals', 'fall', 'seizure', 'missed_dose',
                'sos_button', 'addon', 'mood')),
  severity    TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  pathway     TEXT NOT NULL DEFAULT 'medical' CHECK (pathway IN ('medical', 'mental_health')),
  state       TEXT NOT NULL DEFAULT 'raised'
              CHECK (state IN (
                'raised', 'notifying', 'awaiting_response',
                'responded', 'dispatching', 'dispatched',
                'resolved', 'cancelled', 'false_alarm')),
  opened_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at   TIMESTAMPTZ,
  closed_reason TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from sos_events to alerts now that alerts table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sos_events_alert_id_fkey'
  ) THEN
    ALTER TABLE sos_events ADD CONSTRAINT sos_events_alert_id_fkey
      FOREIGN KEY (alert_id) REFERENCES alerts(id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS alert_escalations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id       UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  step           INTEGER NOT NULL,
  action         TEXT NOT NULL CHECK (action IN (
                   'notify_patient', 'notify_contacts', 'reminder',
                   'call_paramedics', 'notify_clinician', 'crisis_line')),
  target         TEXT,
  sent_at        TIMESTAMPTZ,
  channel        TEXT CHECK (channel IN ('push', 'sms', 'voice', 'call_centre_api')),
  delivery_status TEXT,
  responded_at   TIMESTAMPTZ,
  responder_id   UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_providers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country      TEXT NOT NULL DEFAULT 'KE',
  region       TEXT,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('phone', 'api', 'call_centre')),
  phone        TEXT,
  api_config_ref TEXT,
  priority     INTEGER NOT NULL DEFAULT 1,
  mode         TEXT NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox', 'live')),
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paramedic_dispatches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id     UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  provider_id  UUID NOT NULL REFERENCES emergency_providers(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference    TEXT,
  status       TEXT NOT NULL DEFAULT 'requested'
               CHECK (status IN (
                 'requested', 'accepted', 'en_route',
                 'arrived', 'failed', 'cancelled')),
  payload      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crisis_resources (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country    TEXT NOT NULL DEFAULT 'KE',
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  hours      TEXT,
  language   TEXT NOT NULL DEFAULT 'en',
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. GPS, LOCATION AND HOSPITALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_locations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_id     UUID REFERENCES alerts(id),
  location     GEOGRAPHY(POINT, 4326) NOT NULL,
  accuracy_m   NUMERIC,
  source       TEXT NOT NULL DEFAULT 'gps'
               CHECK (source IN ('gps', 'network', 'last_known')),
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_places (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label       TEXT NOT NULL CHECK (label IN ('home', 'work', 'other')),
  address     TEXT,
  landmarks   TEXT,
  location    GEOGRAPHY(POINT, 4326),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_shares (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id    UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  recipients  JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_facilities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmhfl_code       TEXT UNIQUE,
  name             TEXT NOT NULL,
  level            INTEGER CHECK (level BETWEEN 2 AND 6),
  ownership        TEXT,
  county           TEXT,
  sub_county       TEXT,
  location         GEOGRAPHY(POINT, 4326),
  phone            TEXT,
  emergency_phone  TEXT,
  hours            JSONB,
  emergency_24h    BOOLEAN NOT NULL DEFAULT false,
  ambulance        BOOLEAN NOT NULL DEFAULT false,
  capabilities     TEXT[] NOT NULL DEFAULT '{}',
  verified_at      TIMESTAMPTZ,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preferred_facilities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,
  set_by      UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id)
);

CREATE TABLE IF NOT EXISTS facility_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  facility_id     UUID NOT NULL REFERENCES health_facilities(id),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_status TEXT
);

-- ============================================================================
-- 8. PLATFORM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS dpa_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('export', 'delete', 'correct')),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  handled_by   UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key     TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS firmware_releases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version     TEXT NOT NULL,
  model       TEXT NOT NULL CHECK (model IN ('epi_strap_a', 'epi_strap_b')),
  file_path   TEXT NOT NULL,
  notes       TEXT,
  rollout_pct INTEGER NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'staged', 'live', 'rolled_back')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (version, model)
);

-- ============================================================================
-- 9. INDEXES ON NEW TABLES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clinician_verifications_clinician_id ON clinician_verifications(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinician_verifications_status       ON clinician_verifications(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_patient_id          ON devices(assigned_patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_samples_patient_metric         ON vital_samples(patient_id, metric, measured_at);
CREATE INDEX IF NOT EXISTS idx_vital_rollups_patient                ON vital_rollups(patient_id, metric, period, period_start);
CREATE INDEX IF NOT EXISTS idx_ecg_recordings_patient_id            ON ecg_recordings(patient_id, started_at);
CREATE INDEX IF NOT EXISTS idx_addon_readings_patient_id            ON addon_readings(patient_id, kind, measured_at);
CREATE INDEX IF NOT EXISTS idx_motion_events_patient_id             ON motion_events(patient_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_medication_id   ON medication_schedules(medication_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_patient_id               ON dose_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_medication_id            ON dose_events(medication_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_patient_id              ON symptom_logs(patient_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_patient_id             ON mood_checkins(patient_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_alert_rules_patient_id               ON alert_rules(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_state                 ON alerts(patient_id, state, opened_at);
CREATE INDEX IF NOT EXISTS idx_alert_escalations_alert_id           ON alert_escalations(alert_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_alert_id                  ON sos_events(alert_id);
CREATE INDEX IF NOT EXISTS idx_patient_locations_patient_alert      ON patient_locations(patient_id, alert_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_health_facilities_location           ON health_facilities USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_health_facilities_county             ON health_facilities(county, emergency_24h);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient              ON notifications(recipient_id, read_at);

-- ============================================================================
-- 10. HELPER FUNCTIONS (used in RLS policies)
-- ============================================================================

-- Returns true if the given user has a verified, non-expired clinician licence
CREATE OR REPLACE FUNCTION is_verified_clinician(uid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM clinician_verifications
    WHERE clinician_id = uid
      AND status = 'verified'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Returns true if grantee has an active grant for the given patient+category
CREATE OR REPLACE FUNCTION has_grant(patient UUID, grantee UUID, cat TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM grants
    WHERE patient_id = patient
      AND grantee_id = grantee
      AND category   = cat
      AND revoked_at IS NULL
  );
$$;

-- Returns true if uid is a Care Circle member flagged is_emergency for patient
CREATE OR REPLACE FUNCTION is_emergency_contact(patient UUID, uid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM care_circle
    WHERE patient_id   = patient
      AND member_id    = uid
      AND is_emergency = true
  );
$$;

-- Write an audit row (called by app, not directly by triggers on SELECT)
CREATE OR REPLACE FUNCTION log_access(
  p_patient UUID, p_action TEXT, p_entity TEXT, p_entity_id UUID
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_log (actor_id, actor_role, patient_id, action, entity, entity_id)
  SELECT
    auth.uid(),
    (SELECT role FROM profiles WHERE id = auth.uid()),
    p_patient, p_action, p_entity, p_entity_id;
END;
$$;

-- Returns true if uid has an approved, non-expired break-glass on patient
CREATE OR REPLACE FUNCTION has_break_glass(patient UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM break_glass_requests
    WHERE patient_id   = patient
      AND admin_id     = auth.uid()
      AND approved_by IS NOT NULL
      AND (expires_at IS NULL OR expires_at > NOW())
      AND revoked_at IS NULL
  );
$$;

-- ============================================================================
-- 11. ENABLE RLS ON ALL NEW TABLES
-- ============================================================================

ALTER TABLE organisations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members             ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinician_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_glass_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_addon_models   ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_devices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_samples           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_rollups           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecg_recordings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_readings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE refill_alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins           ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE records                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinician_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_escalations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_providers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE paramedic_dispatches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_resources        ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_places            ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_shares         ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_facilities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_facilities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpa_requests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmware_releases       ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. RLS POLICIES ON NEW TABLES
-- ============================================================================

-- organisations: any authenticated user can read; admin/org_admin manage
CREATE POLICY "orgs_read_authenticated" ON organisations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "orgs_admin_manage" ON organisations
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'org_admin')
  );

-- org_members: member reads own; admin manages
CREATE POLICY "org_members_self_read" ON org_members
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "org_members_admin_manage" ON org_members
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'org_admin')
  );

-- clinician_verifications: clinician sees own; admin manages
CREATE POLICY "clinician_verif_self_read" ON clinician_verifications
  FOR SELECT USING (clinician_id = auth.uid());

CREATE POLICY "clinician_verif_admin_manage" ON clinician_verifications
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- break_glass_requests: admin only
CREATE POLICY "break_glass_admin" ON break_glass_requests
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- devices: patient sees own assigned device; admin manages
CREATE POLICY "devices_patient_read" ON devices
  FOR SELECT USING (assigned_patient_id = auth.uid());

CREATE POLICY "devices_admin_manage" ON devices
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- approved_addon_models: everyone reads; admin manages
CREATE POLICY "addon_models_read" ON approved_addon_models
  FOR SELECT USING (true);

CREATE POLICY "addon_models_admin_manage" ON approved_addon_models
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- addon_devices: patient manages own; clinician reads with link+grant
CREATE POLICY "addon_devices_patient" ON addon_devices
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "addon_devices_clinician_read" ON addon_devices
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = addon_devices.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(addon_devices.patient_id, auth.uid(), 'addon_readings')
  );

-- vital_samples: patient reads own; clinician reads with grant; no one writes directly (Edge Function only)
CREATE POLICY "vitals_patient_read" ON vital_samples
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "vitals_clinician_read" ON vital_samples
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = vital_samples.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(vital_samples.patient_id, auth.uid(), 'vitals')
  );

CREATE POLICY "vitals_caregiver_read" ON vital_samples
  FOR SELECT USING (has_grant(vital_samples.patient_id, auth.uid(), 'vitals'));

-- vital_rollups: same as vital_samples
CREATE POLICY "vital_rollups_patient_read" ON vital_rollups
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "vital_rollups_clinician_read" ON vital_rollups
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = vital_rollups.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(vital_rollups.patient_id, auth.uid(), 'vitals')
  );

-- ecg_recordings: patient reads own; clinician reads+reviews with grant
CREATE POLICY "ecg_patient_read" ON ecg_recordings
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "ecg_clinician_read" ON ecg_recordings
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = ecg_recordings.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(ecg_recordings.patient_id, auth.uid(), 'ecg')
  );

CREATE POLICY "ecg_clinician_review" ON ecg_recordings
  FOR UPDATE USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = ecg_recordings.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL)
  )
  WITH CHECK (
    reviewed_by = auth.uid()
  );

-- addon_readings: patient; clinician with grant
CREATE POLICY "addon_readings_patient" ON addon_readings
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "addon_readings_clinician_read" ON addon_readings
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = addon_readings.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(addon_readings.patient_id, auth.uid(), 'addon_readings')
  );

-- motion_events: patient + clinician
CREATE POLICY "motion_events_patient" ON motion_events
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "motion_events_clinician_read" ON motion_events
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = motion_events.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(motion_events.patient_id, auth.uid(), 'vitals')
  );

-- medication_schedules: patient reads; clinician writes for linked patients
CREATE POLICY "med_schedules_patient_read" ON medication_schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM medications WHERE id = medication_schedules.medication_id AND patient_id = auth.uid())
  );

CREATE POLICY "med_schedules_clinician_write" ON medication_schedules
  FOR ALL USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM medications m
      JOIN clinician_links cl ON cl.patient_id = m.patient_id
      WHERE m.id = medication_schedules.medication_id
        AND cl.clinician_id = auth.uid()
        AND cl.ended_at IS NULL
    )
  );

-- dose_events: patient reads+writes own; caregiver writes if granted medications
CREATE POLICY "dose_events_patient" ON dose_events
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "dose_events_caregiver_confirm" ON dose_events
  FOR UPDATE USING (has_grant(dose_events.patient_id, auth.uid(), 'medications'))
  WITH CHECK (confirmed_by = auth.uid() AND confirmed_via = 'caregiver');

CREATE POLICY "dose_events_clinician_read" ON dose_events
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = dose_events.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(dose_events.patient_id, auth.uid(), 'adherence')
  );

-- refill_alerts: patient reads own
CREATE POLICY "refill_alerts_patient_read" ON refill_alerts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM medications WHERE id = refill_alerts.medication_id AND patient_id = auth.uid())
  );

-- condition_templates: public read
CREATE POLICY "condition_templates_read" ON condition_templates
  FOR SELECT USING (true);

CREATE POLICY "condition_templates_admin_manage" ON condition_templates
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- symptom_logs: patient + caregiver read; clinician with grant
CREATE POLICY "symptom_logs_patient" ON symptom_logs
  FOR ALL USING (patient_id = auth.uid() OR logged_by = auth.uid());

CREATE POLICY "symptom_logs_caregiver_read" ON symptom_logs
  FOR SELECT USING (has_grant(symptom_logs.patient_id, auth.uid(), 'symptoms'));

CREATE POLICY "symptom_logs_clinician_read" ON symptom_logs
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = symptom_logs.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(symptom_logs.patient_id, auth.uid(), 'symptoms')
  );

-- mood_checkins: patient; clinician with mood grant (sensitive category)
CREATE POLICY "mood_patient" ON mood_checkins
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "mood_clinician_read" ON mood_checkins
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = mood_checkins.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(mood_checkins.patient_id, auth.uid(), 'mood')
  );

-- appointments: patient + clinician
CREATE POLICY "appointments_patient" ON appointments
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "appointments_clinician" ON appointments
  FOR ALL USING (
    clinician_id = auth.uid() AND is_verified_clinician(auth.uid())
  );

CREATE POLICY "appointments_caregiver_read" ON appointments
  FOR SELECT USING (has_grant(appointments.patient_id, auth.uid(), 'appointments'));

-- records: patient; clinician with grant
CREATE POLICY "records_patient" ON records
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "records_clinician_read" ON records
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = records.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL) AND
    has_grant(records.patient_id, auth.uid(), 'records')
  );

-- clinician_notes: clinician writes own; patient reads
CREATE POLICY "clinician_notes_patient_read" ON clinician_notes
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "clinician_notes_clinician" ON clinician_notes
  FOR ALL USING (clinician_id = auth.uid() AND is_verified_clinician(auth.uid()));

-- alert_rules: clinician writes; patient reads; caregiver no access
CREATE POLICY "alert_rules_patient_read" ON alert_rules
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "alert_rules_clinician_manage" ON alert_rules
  FOR ALL USING (
    set_by = auth.uid() AND is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = alert_rules.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL)
  );

-- alerts: patient; emergency contacts read; clinician reads
CREATE POLICY "alerts_patient" ON alerts
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "alerts_emergency_contact_read" ON alerts
  FOR SELECT USING (is_emergency_contact(alerts.patient_id, auth.uid()));

CREATE POLICY "alerts_clinician_read" ON alerts
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = alerts.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL)
  );

-- alert_escalations: patient reads own; emergency contacts read
CREATE POLICY "alert_escalations_patient_read" ON alert_escalations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM alerts WHERE id = alert_escalations.alert_id AND patient_id = auth.uid())
  );

-- emergency_providers: admin manages; service role uses
CREATE POLICY "emergency_providers_admin" ON emergency_providers
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- paramedic_dispatches: patient reads own; admin manages
CREATE POLICY "paramedic_dispatches_patient_read" ON paramedic_dispatches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM alerts WHERE id = paramedic_dispatches.alert_id AND patient_id = auth.uid())
  );

CREATE POLICY "paramedic_dispatches_admin" ON paramedic_dispatches
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- crisis_resources: public read
CREATE POLICY "crisis_resources_read" ON crisis_resources
  FOR SELECT USING (active = true);

CREATE POLICY "crisis_resources_admin" ON crisis_resources
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- patient_locations: patient writes own; emergency contacts + clinician read during active alert only
CREATE POLICY "patient_locations_patient" ON patient_locations
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "patient_locations_patient_read" ON patient_locations
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "patient_locations_emergency_contact_read" ON patient_locations
  FOR SELECT USING (
    is_emergency_contact(patient_locations.patient_id, auth.uid()) AND
    has_grant(patient_locations.patient_id, auth.uid(), 'location_on_sos') AND
    EXISTS (SELECT 1 FROM alerts WHERE id = patient_locations.alert_id AND state NOT IN ('resolved','cancelled','false_alarm'))
  );

-- saved_places: patient manages own
CREATE POLICY "saved_places_patient" ON saved_places
  FOR ALL USING (patient_id = auth.uid());

-- location_shares: patient manages; emergency contacts read via token (handled server-side)
CREATE POLICY "location_shares_patient" ON location_shares
  FOR ALL USING (patient_id = auth.uid());

-- health_facilities: public read; admin manages
CREATE POLICY "health_facilities_read" ON health_facilities
  FOR SELECT USING (active = true);

CREATE POLICY "health_facilities_admin" ON health_facilities
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- preferred_facilities: patient manages
CREATE POLICY "preferred_facilities_patient" ON preferred_facilities
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "preferred_facilities_clinician_read" ON preferred_facilities
  FOR SELECT USING (
    is_verified_clinician(auth.uid()) AND
    EXISTS (SELECT 1 FROM clinician_links WHERE patient_id = preferred_facilities.patient_id AND clinician_id = auth.uid() AND ended_at IS NULL)
  );

-- notifications: recipient reads own
CREATE POLICY "notifications_recipient_read" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "notifications_recipient_update" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- dpa_requests: patient creates; admin manages
CREATE POLICY "dpa_requests_patient" ON dpa_requests
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "dpa_requests_admin" ON dpa_requests
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- feature_flags: public read; admin manages
CREATE POLICY "feature_flags_read" ON feature_flags
  FOR SELECT USING (true);

CREATE POLICY "feature_flags_admin" ON feature_flags
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- firmware_releases: patient + clinician reads (for OTA); admin manages
CREATE POLICY "firmware_read" ON firmware_releases
  FOR SELECT USING (status IN ('staged', 'live'));

CREATE POLICY "firmware_admin" ON firmware_releases
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 13. SEED DATA (development only)
-- ============================================================================

-- Condition templates (Group A — strap only)
INSERT INTO condition_templates (code, name, grp, metrics, required_addons, reminder_types) VALUES
  ('heart_disease',    'Heart Disease / Heart Failure',  'A', ARRAY['heart_rate','spo2','resp_rate','hrv'], '{}', ARRAY['medication']),
  ('arrhythmia_af',    'Arrhythmia / Atrial Fibrillation','A', ARRAY['heart_rate','hrv','ecg'],           '{}', ARRAY['medication','ecg_recording']),
  ('copd',             'COPD',                           'A', ARRAY['spo2','resp_rate'],                  '{}', ARRAY['medication','inhaler']),
  ('asthma',           'Asthma',                         'A', ARRAY['spo2','resp_rate'],                  '{}', ARRAY['medication','inhaler']),
  ('sleep_apnoea',     'Sleep Apnoea',                   'A', ARRAY['spo2','heart_rate','sleep_stage'],   '{}', ARRAY['cpap_check']),
  ('epilepsy',         'Epilepsy',                       'A', ARRAY['heart_rate','activity_level'],       '{}', ARRAY['medication']),
  ('parkinsons',       'Parkinson''s Disease',           'A', ARRAY['activity_level','heart_rate'],       '{}', ARRAY['medication']),
  ('elderly_fall',     'Elderly / Fall Risk / Dementia', 'A', ARRAY['activity_level','steps'],            '{}', ARRAY['medication','daily_check']),
  ('post_surgery',     'Post-Surgery / Hospital-at-Home','A', ARRAY['heart_rate','spo2','skin_temp'],     '{}', ARRAY['medication','wound_check']),
  ('fever_illness',    'Fever Illness (Malaria/Typhoid)', 'A', ARRAY['skin_temp','heart_rate'],           '{}', ARRAY['medication']),
  -- Group B — strap + add-on
  ('hypertension',     'Hypertension',                   'B', ARRAY['heart_rate'],                        ARRAY['bp_cuff'],  ARRAY['medication','bp_reading']),
  ('diabetes',         'Diabetes',                       'B', ARRAY['heart_rate'],                        ARRAY['glucometer'], ARRAY['medication','glucose_reading']),
  ('kidney_disease',   'Kidney Disease',                 'B', ARRAY['heart_rate','spo2'],                 ARRAY['bp_cuff','scale'], ARRAY['medication','weight_reading']),
  ('pregnancy',        'Pregnancy / Pre-eclampsia Risk', 'B', ARRAY['heart_rate'],                        ARRAY['bp_cuff'], ARRAY['bp_reading']),
  ('stroke_recovery',  'Stroke Recovery',                'B', ARRAY['heart_rate','activity_level'],       ARRAY['bp_cuff'], ARRAY['medication','bp_reading']),
  -- Group C — trends + support
  ('bipolar',          'Bipolar Disorder',               'C', ARRAY['sleep_stage','activity_level'],      '{}', ARRAY['mood_checkin','medication']),
  ('depression_anxiety','Depression / Anxiety',          'C', ARRAY['sleep_stage','activity_level'],      '{}', ARRAY['mood_checkin','medication']),
  ('sickle_cell',      'Sickle Cell Disease',            'C', ARRAY['heart_rate','spo2'],                 '{}', ARRAY['medication','hydration_log']),
  ('hiv_tb',           'HIV / TB',                       'C', ARRAY['skin_temp','activity_level'],        '{}', ARRAY['medication'])
ON CONFLICT (code) DO NOTHING;

-- Kenya default emergency provider (sandbox)
INSERT INTO emergency_providers (country, region, name, type, phone, priority, mode) VALUES
  ('KE', NULL, 'Kenya National Emergency (999)', 'phone', '999',  1, 'sandbox'),
  ('KE', NULL, 'Kenya National Emergency (112)', 'phone', '112',  2, 'sandbox')
ON CONFLICT DO NOTHING;

-- Default crisis resource
INSERT INTO crisis_resources (country, name, phone, hours, language) VALUES
  ('KE', 'Befrienders Kenya', '+254722178177', '24/7', 'en')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. UPDATED_AT TRIGGERS FOR NEW TABLES
-- DROP IF EXISTS first so this migration is safe to re-run and avoids
-- conflicts with any triggers already created in migrations 001/002.
-- ============================================================================

DROP TRIGGER IF EXISTS update_organisations_updated_at            ON organisations;
DROP TRIGGER IF EXISTS update_clinician_verifications_updated_at  ON clinician_verifications;
DROP TRIGGER IF EXISTS update_devices_updated_at                  ON devices;
DROP TRIGGER IF EXISTS update_addon_devices_updated_at            ON addon_devices;
DROP TRIGGER IF EXISTS update_ecg_recordings_updated_at           ON ecg_recordings;
DROP TRIGGER IF EXISTS update_medication_schedules_updated_at     ON medication_schedules;
DROP TRIGGER IF EXISTS update_medications_updated_at              ON medications;
DROP TRIGGER IF EXISTS update_appointments_updated_at             ON appointments;
DROP TRIGGER IF EXISTS update_records_updated_at                  ON records;
DROP TRIGGER IF EXISTS update_clinician_notes_updated_at          ON clinician_notes;
DROP TRIGGER IF EXISTS update_alert_rules_updated_at              ON alert_rules;
DROP TRIGGER IF EXISTS update_alerts_updated_at                   ON alerts;
DROP TRIGGER IF EXISTS update_paramedic_dispatches_updated_at     ON paramedic_dispatches;
DROP TRIGGER IF EXISTS update_health_facilities_updated_at        ON health_facilities;
DROP TRIGGER IF EXISTS update_dpa_requests_updated_at             ON dpa_requests;
DROP TRIGGER IF EXISTS update_feature_flags_updated_at            ON feature_flags;
DROP TRIGGER IF EXISTS update_firmware_releases_updated_at        ON firmware_releases;
DROP TRIGGER IF EXISTS update_saved_places_updated_at             ON saved_places;
DROP TRIGGER IF EXISTS update_condition_templates_updated_at      ON condition_templates;

CREATE TRIGGER update_organisations_updated_at
  BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinician_verifications_updated_at
  BEFORE UPDATE ON clinician_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addon_devices_updated_at
  BEFORE UPDATE ON addon_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ecg_recordings_updated_at
  BEFORE UPDATE ON ecg_recordings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_schedules_updated_at
  BEFORE UPDATE ON medication_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_records_updated_at
  BEFORE UPDATE ON records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinician_notes_updated_at
  BEFORE UPDATE ON clinician_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON alert_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_paramedic_dispatches_updated_at
  BEFORE UPDATE ON paramedic_dispatches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_facilities_updated_at
  BEFORE UPDATE ON health_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dpa_requests_updated_at
  BEFORE UPDATE ON dpa_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_firmware_releases_updated_at
  BEFORE UPDATE ON firmware_releases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_places_updated_at
  BEFORE UPDATE ON saved_places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_condition_templates_updated_at
  BEFORE UPDATE ON condition_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
