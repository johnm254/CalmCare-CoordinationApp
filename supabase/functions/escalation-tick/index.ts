// escalation-tick — runs every minute via pg_cron.
// Implements the SOS escalation state machine:
//   raised       → (T+0) notifying     : push to emergency contacts
//   notifying    → (T+2) awaiting_resp : reminder push (no response yet)
//   awaiting_resp→ (T+4) dispatching   : call_paramedics (medical) | crisis_line (mental_health)
//
// A row in sos_responses (or alert.state = 'responded/resolved/cancelled') stops escalation.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const T2_MS = 2 * 60 * 1000;
const T4_MS = 4 * 60 * 1000;

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type AlertRow = {
  id: string;
  patient_id: string;
  pathway: 'medical' | 'mental_health';
  state: string;
  opened_at: string;
  sos_events: Array<{ id: string; location: string | null; recipients: string | null }>;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const now = Date.now();

    // Fetch all active alerts that may need escalation
    const { data: alerts, error: alertsErr } = await supabase
      .from('alerts')
      .select('id, patient_id, pathway, state, opened_at, sos_events(id, location, recipients)')
      .in('state', ['raised', 'notifying', 'awaiting_response'])
      .order('opened_at', { ascending: true });

    if (alertsErr) throw alertsErr;
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    let processed = 0;

    for (const alert of alerts as AlertRow[]) {
      const ageMs = now - new Date(alert.opened_at).getTime();

      // Check if anyone responded
      const { data: responses } = await supabase
        .from('sos_responses')
        .select('id')
        .eq('sos_event_id', alert.sos_events?.[0]?.id ?? '')
        .limit(1);
      const hasResponse = (responses?.length ?? 0) > 0;

      if (hasResponse) {
        // Someone responded — advance to responded, stop escalation
        await supabase.from('alerts').update({ state: 'responded', updated_at: new Date().toISOString() }).eq('id', alert.id);
        continue;
      }

      if (alert.state === 'raised') {
        // Step 1 — notify emergency contacts immediately
        await escalate(supabase, alert, 1, 'notify_contacts', 'push');
        await supabase.from('alerts').update({ state: 'notifying', updated_at: new Date().toISOString() }).eq('id', alert.id);
        processed++;
        continue;
      }

      if (alert.state === 'notifying' && ageMs >= T2_MS) {
        // Step 2 — reminder push after 2 minutes
        await escalate(supabase, alert, 2, 'reminder', 'push');
        await supabase.from('alerts').update({ state: 'awaiting_response', updated_at: new Date().toISOString() }).eq('id', alert.id);
        processed++;
        continue;
      }

      if (alert.state === 'awaiting_response' && ageMs >= T4_MS) {
        // Step 3 — dispatch / crisis line after 4 minutes
        if (alert.pathway === 'mental_health') {
          await escalate(supabase, alert, 3, 'crisis_line', 'push');
          await supabase.from('alerts').update({ state: 'dispatching', updated_at: new Date().toISOString() }).eq('id', alert.id);
        } else {
          await escalate(supabase, alert, 3, 'call_paramedics', 'call_centre_api');
          await dispatchParamedics(supabase, alert);
          await supabase.from('alerts').update({ state: 'dispatching', updated_at: new Date().toISOString() }).eq('id', alert.id);
        }
        processed++;
      }
    }

    return new Response(JSON.stringify({ processed }), { status: 200 });
  } catch (err) {
    console.error('[escalation-tick]', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

async function escalate(
  supabase: ReturnType<typeof createClient>,
  alert: AlertRow,
  step: number,
  action: string,
  channel: string,
): Promise<void> {
  const now = new Date().toISOString();

  await supabase.from('alert_escalations').insert({
    alert_id: alert.id,
    step,
    action,
    channel,
    sent_at: now,
    delivery_status: 'sent',
  });

  // Push notification to emergency contacts
  const sosEvent = alert.sos_events?.[0];
  const recipientIds: string[] = sosEvent?.recipients
    ? (() => { try { return JSON.parse(sosEvent.recipients); } catch { return []; } })()
    : [];

  if (recipientIds.length === 0) return;

  const { data: patient } = await supabase
    .from('profiles').select('full_name').eq('id', alert.patient_id).single();
  const patientName = (patient as any)?.full_name ?? 'Your contact';

  let location: { lat: number; lon: number } | null = null;
  if (sosEvent?.location) {
    try { location = JSON.parse(sosEvent.location); } catch { /* ignore */ }
  }

  const { data: tokenRows } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', recipientIds);

  if (!tokenRows || tokenRows.length === 0) return;

  const isCrisis = action === 'crisis_line';
  const isReminder = action === 'reminder';
  const isDispatch = action === 'call_paramedics';

  const title = isCrisis
    ? `Mental health alert — ${patientName}`
    : isDispatch
    ? `🚑 Ambulance requested for ${patientName}`
    : isReminder
    ? `🚨 Still waiting — ${patientName} needs help!`
    : `🚨 EMERGENCY — ${patientName} triggered SOS`;

  const body = isCrisis
    ? 'A mental health alert has been raised. Please check in with them directly.'
    : isDispatch
    ? 'No one responded. Emergency services have been contacted.'
    : isReminder
    ? 'No one has responded yet. Please check immediately.'
    : 'Tap to see their location and respond.';

  const messages = (tokenRows as { token: string }[]).map((t) => ({
    to: t.token,
    sound: 'default',
    title,
    body,
    data: {
      type: 'sos_alert',
      sos_id: sosEvent?.id ?? '',
      alert_id: alert.id,
      patient_id: alert.patient_id,
      patient_name: patientName,
      location_lat: location?.lat?.toString() ?? '',
      location_lon: location?.lon?.toString() ?? '',
    },
    priority: 'high',
    channelId: 'sos',
    categoryIdentifier: 'SOS_ALERT',
  }));

  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(messages),
  });
}

async function dispatchParamedics(
  supabase: ReturnType<typeof createClient>,
  alert: AlertRow,
): Promise<void> {
  // Find the highest-priority active provider for the patient's country (default KE)
  const { data: provider } = await supabase
    .from('emergency_providers')
    .select('id, mode, type, phone')
    .eq('active', true)
    .order('priority', { ascending: true })
    .limit(1)
    .single();

  if (!provider) return;

  await supabase.from('paramedic_dispatches').insert({
    alert_id: alert.id,
    provider_id: provider.id,
    status: provider.mode === 'sandbox' ? 'sandbox_skipped' : 'requested',
  });
}
