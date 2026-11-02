-- 014_cron_schedules.sql
-- Sets up pg_cron schedules for the four Edge Functions that must run on a timer.
-- Requires the pg_cron and pg_net extensions (enabled by default on Supabase).
-- Replace <PROJECT_REF> with your Supabase project reference (e.g. abcdefghijkl).
-- The service-role key is stored in vault.secrets and read at schedule time.

-- ─── Helper: build the Edge Function URL ─────────────────────────────────────

-- Uncomment and set your project ref once:
-- DO $$ BEGIN PERFORM set_config('app.supabase_ref', '<PROJECT_REF>', false); END $$;

-- ─── escalation-tick — every minute ──────────────────────────────────────────
-- Drives the SOS alert state machine: raised → notifying → awaiting_response → dispatching

SELECT cron.schedule(
  'escalation-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://' || current_setting('app.supabase_ref', true) || '.supabase.co/functions/v1/escalation-tick',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule;

-- ─── alert-tick — every minute ───────────────────────────────────────────────
-- Evaluates alert_rules against recent vital_samples and mood_checkins

SELECT cron.schedule(
  'alert-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://' || current_setting('app.supabase_ref', true) || '.supabase.co/functions/v1/alert-tick',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule;

-- ─── med-reminder — every minute ─────────────────────────────────────────────
-- Fires push notifications at scheduled medication times

SELECT cron.schedule(
  'med-reminder',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://' || current_setting('app.supabase_ref', true) || '.supabase.co/functions/v1/med-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule;

-- ─── followup-reminder — every hour at :00 ───────────────────────────────────
-- Sends push to clinicians when a follow-up is due within 24 hours

SELECT cron.schedule(
  'followup-reminder',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://' || current_setting('app.supabase_ref', true) || '.supabase.co/functions/v1/followup-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule;
