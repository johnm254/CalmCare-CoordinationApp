-- Project Epi / Duara — Phase 1 Gate: Feature Flags Seed
-- Seeds the five feature flags that must start disabled (OFF by default per spec).
-- Use the admin portal → feature_flags table to flip them when each capability ships.

INSERT INTO feature_flags (key, enabled, rollout) VALUES
  ('live_dispatch',         false, '{}'),
  ('background_location',   false, '{}'),
  ('hospital_arrival_sms',  false, '{}'),
  ('health_kit_bridge',     false, '{}'),
  ('org_admin_role',        false, '{}')
ON CONFLICT (key) DO NOTHING;
