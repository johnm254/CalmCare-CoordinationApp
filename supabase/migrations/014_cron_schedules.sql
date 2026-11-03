-- 014_cron_schedules.sql
-- Sets up pg_cron schedules for the four Edge Functions that run on a timer.
-- Requires pg_cron and pg_net extensions (enabled by default on Supabase).
-- Hard-codes the project ref so no runtime setting is needed.

DO $$
BEGIN
  PERFORM cron.unschedule('escalation-tick');  EXCEPTION WHEN OTHERS THEN NULL;
END $$;
SELECT cron.schedule(
  'escalation-tick', '* * * * *',
  $$SELECT net.http_post(
    url     := 'https://rtlhckntjrhdhbaqzxoy.supabase.co/functions/v1/escalation-tick',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='service_role_key' LIMIT 1)),
    body    := '{}'::jsonb);$$
);

DO $$
BEGIN
  PERFORM cron.unschedule('alert-tick');  EXCEPTION WHEN OTHERS THEN NULL;
END $$;
SELECT cron.schedule(
  'alert-tick', '* * * * *',
  $$SELECT net.http_post(
    url     := 'https://rtlhckntjrhdhbaqzxoy.supabase.co/functions/v1/alert-tick',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='service_role_key' LIMIT 1)),
    body    := '{}'::jsonb);$$
);

DO $$
BEGIN
  PERFORM cron.unschedule('med-reminder');  EXCEPTION WHEN OTHERS THEN NULL;
END $$;
SELECT cron.schedule(
  'med-reminder', '* * * * *',
  $$SELECT net.http_post(
    url     := 'https://rtlhckntjrhdhbaqzxoy.supabase.co/functions/v1/med-reminder',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='service_role_key' LIMIT 1)),
    body    := '{}'::jsonb);$$
);

DO $$
BEGIN
  PERFORM cron.unschedule('followup-reminder');  EXCEPTION WHEN OTHERS THEN NULL;
END $$;
SELECT cron.schedule(
  'followup-reminder', '0 * * * *',
  $$SELECT net.http_post(
    url     := 'https://rtlhckntjrhdhbaqzxoy.supabase.co/functions/v1/followup-reminder',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='service_role_key' LIMIT 1)),
    body    := '{}'::jsonb);$$
);
