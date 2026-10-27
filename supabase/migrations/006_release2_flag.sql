-- Migration 006: Seed the release2_ecg_rhythm feature flag.
-- This flag must exist and be OFF before any ECG rhythm classification
-- is shown to patients (CR-ADD-01, MOJO_REQUIREMENTS §8.1).

INSERT INTO feature_flags (key, enabled, rollout) VALUES
  ('release2_ecg_rhythm', false, '{}')
ON CONFLICT (key) DO NOTHING;
