-- 012_ecg_bucket_and_consent_purposes.sql
-- (1) ECG recordings storage bucket with RLS (SB-06)
-- (2) Extend consent_log.purpose CHECK to include all UI consent items (CR-SEC-10)

-- ─── SB-06: ECG recordings storage bucket ────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ecg_recordings',
  'ecg_recordings',
  FALSE,
  10485760,  -- 10 MB per file
  ARRAY['application/octet-stream', 'text/csv', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Device (service role) can upload recordings
DROP POLICY IF EXISTS "ecg_recordings device write" ON storage.objects;
CREATE POLICY "ecg_recordings device write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ecg_recordings');

-- Clinician can read recordings for their linked patients
DROP POLICY IF EXISTS "ecg_recordings clinician read" ON storage.objects;
CREATE POLICY "ecg_recordings clinician read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ecg_recordings'
    AND EXISTS (
      SELECT 1 FROM clinician_links cl
      JOIN profiles p ON p.id = cl.patient_id
      WHERE cl.clinician_id = auth.uid()
        AND cl.ended_at IS NULL
        AND (storage.objects.name LIKE p.id::text || '/%')
    )
  );

-- Patient can read their own recordings
DROP POLICY IF EXISTS "ecg_recordings patient read" ON storage.objects;
CREATE POLICY "ecg_recordings patient read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ecg_recordings'
    AND (storage.objects.name LIKE auth.uid()::text || '/%')
  );


-- ─── CR-SEC-10: Extend consent_log.purpose to cover all UI consent items ──────

ALTER TABLE consent_log DROP CONSTRAINT IF EXISTS consent_log_purpose_check;

ALTER TABLE consent_log ADD CONSTRAINT consent_log_purpose_check
  CHECK (purpose IN (
    -- original purposes
    'welcome', 'location', 'medical_details',
    'sos_contact', 'clinician_link', 'stop_sharing', 'offline',
    -- extended for mobile consent screen
    'mood_data', 'emergency_dispatch', 'research_opt_in', 'dpa_rights'
  ));
