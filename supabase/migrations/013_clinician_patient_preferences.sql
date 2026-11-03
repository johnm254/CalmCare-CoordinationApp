-- 013_clinician_patient_preferences.sql
-- Adds the clinician_patient_preferences table referenced by PreferredHospital.tsx.
-- Also relaxes the alert_rules.operator constraint to accept both symbol form
-- ('>', '<', '>=', '<=') used by the RuleEditor UI and the legacy word form
-- ('gt', 'lt', 'gte', 'lte') defined in the initial schema.

-- ─── clinician_patient_preferences ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clinician_patient_preferences (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id            UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_hospital_name TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinician_id, patient_id)
);

ALTER TABLE clinician_patient_preferences ENABLE ROW LEVEL SECURITY;

-- Clinicians can read and write their own preferences
DROP POLICY IF EXISTS "cpp_clinician_self" ON clinician_patient_preferences;
CREATE POLICY "cpp_clinician_self"
  ON clinician_patient_preferences
  FOR ALL
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

-- ─── Fix alert_rules.operator constraint ─────────────────────────────────────
-- The initial schema constrained operator to word form only; the RuleEditor
-- uses symbol form. Drop the constraint and replace with one that allows both.

ALTER TABLE alert_rules DROP CONSTRAINT IF EXISTS alert_rules_operator_check;

ALTER TABLE alert_rules
  ADD CONSTRAINT alert_rules_operator_check
  CHECK (operator IN ('gt','lt','gte','lte','>','<','>=','<='));

-- ─── dpa_exports ─────────────────────────────────────────────────────────────
-- Stores the JSON payload produced by the dpa-export-delete Edge Function.
-- Created here if the table does not already exist (the Edge Function upserts
-- into it but cannot create tables itself).

CREATE TABLE IF NOT EXISTS dpa_exports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID        NOT NULL REFERENCES dpa_requests(id) ON DELETE CASCADE,
  patient_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payload     JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id)
);

ALTER TABLE dpa_exports ENABLE ROW LEVEL SECURITY;

-- Only admins (service role) can read; no user-facing policy needed — the Edge
-- Function uses the service role key and admins download via the admin API.
