-- 014_cron_schedules.sql
-- Sets up pg_cron schedules for the four Edge Functions that run on a timer.
-- Requires pg_cron and pg_net extensions to be enabled in the Supabase dashboard.
-- This migration is a no-op if pg_cron is not yet enabled.

DO $outer$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron not enabled — skipping cron schedule setup. Enable it in the Supabase dashboard under Extensions.';
    RETURN;
  END IF;

  BEGIN PERFORM cron.unschedule('escalation-tick'); EXCEPTION WHEN OTHERS THEN NULL; END;
  PERFORM cron.schedule(
    'escalation-tick', '* * * * *',
    $q$SELECT net.http_post(
        url     := 'https://rtlhckntjrhdhbaqzxoy.supabase.co/functions/v1/escalation-tick',
        headers := jsonb_build_object('Content-Type','application/json',
          'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='service_role_key' LIMIT 1)),
        body    := '{}'::jsonb);$q$
  );

  BEGIN PERFORM cron.unschedule('alert-tick'); EXCEPTION WHEN OTHERS THEN NULL; END;
  PERFORM cron.schedule(
    'alert-tick', '* * * * *',
    $q$SELECT net.http_post(
        url     := 'https://rtlhckntjrhdhbaqzxoy.supabase.co/functions/v1/alert-tick',
        headers := jsonb_build_object('Content-Type','application/json',
          'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='service_role_key' LIMIT 1)),
        body    := '{}'::jsonb);$q$
  );

  BEGIN PERFORM cron.unschedule('med-reminder'); EXCEPTION WHEN OTHERS THEN NULL; END;
  PERFORM cron.schedule(
    'med-reminder', '* * * * *',
    $q$SELECT net.http_post(
        url     := 'https://rtlhckntjrhdhbaqzxoy.supabase.co/functions/v1/med-reminder',
        headers := jsonb_build_object('Content-Type','application/json',
          'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='service_role_key' LIMIT 1)),
        body    := '{}'::jsonb);$q$
  );

  BEGIN PERFORM cron.unschedule('followup-reminder'); EXCEPTION WHEN OTHERS THEN NULL; END;
  PERFORM cron.schedule(
    'followup-reminder', '0 * * * *',
    $q$SELECT net.http_post(
        url     := 'https://rtlhckntjrhdhbaqzxoy.supabase.co/functions/v1/followup-reminder',
        headers := jsonb_build_object('Content-Type','application/json',
          'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='service_role_key' LIMIT 1)),
        body    := '{}'::jsonb);$q$
  );

  RAISE NOTICE 'pg_cron schedules registered successfully.';
END $outer$;
