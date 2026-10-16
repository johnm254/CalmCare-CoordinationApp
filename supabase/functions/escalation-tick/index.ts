// escalation-tick — runs every minute via pg_cron or manual call.
// After 4 minutes with no response, re-alerts all unreached emergency contacts.
// Called by: supabase cron job or direct POST to /functions/v1/escalation-tick

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ESCALATION_AFTER_MS = 4 * 60 * 1000; // 4 minutes

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const cutoff = new Date(Date.now() - ESCALATION_AFTER_MS).toISOString();

    // SOS events sent > 4 min ago, still in 'sent' state (not escalated/cancelled)
    const { data: candidates, error } = await supabase
      .from('sos_events')
      .select('id, patient_id, location, recipients, sent_at')
      .eq('status', 'sent')
      .lt('sent_at', cutoff);

    if (error) throw error;
    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ escalated: 0 }), { status: 200 });
    }

    // Filter to those with zero responses
    const { data: responded } = await supabase
      .from('sos_responses')
      .select('sos_event_id')
      .in('sos_event_id', candidates.map((c: any) => c.id));

    const respondedIds = new Set((responded ?? []).map((r: any) => r.sos_event_id));
    const toEscalate = candidates.filter((c: any) => !respondedIds.has(c.id));

    if (toEscalate.length === 0) {
      return new Response(JSON.stringify({ escalated: 0 }), { status: 200 });
    }

    let escalated = 0;

    for (const sos of toEscalate) {
      const recipients: string[] = typeof sos.recipients === 'string'
        ? JSON.parse(sos.recipients) : (sos.recipients ?? []);

      if (recipients.length === 0) continue;

      // Patient name
      const { data: patient } = await supabase
        .from('profiles').select('full_name').eq('id', sos.patient_id).single();
      const patientName = (patient as any)?.full_name ?? 'Your contact';

      let location: { lat: number; lon: number } | null = null;
      if (sos.location) {
        try { location = JSON.parse(sos.location); } catch { /* ignore */ }
      }

      // Get push tokens for all recipients
      const { data: tokenRows } = await supabase
        .from('push_tokens')
        .select('token')
        .in('user_id', recipients);

      if (tokenRows && tokenRows.length > 0) {
        const messages = (tokenRows as { token: string }[]).map((t) => ({
          to: t.token,
          sound: 'default',
          title: `🚨 URGENT — ${patientName} still needs help!`,
          body: 'No one has responded yet. Please check immediately.',
          data: {
            type: 'sos_alert',
            sos_id: sos.id,
            patient_id: sos.patient_id,
            patient_name: patientName,
            location_lat: location?.lat?.toString() ?? '',
            location_lon: location?.lon?.toString() ?? '',
          },
          priority: 'high',
          channelId: 'sos',
          categoryIdentifier: 'SOS_ALERT',
        }));

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(messages),
        });
      }

      // Mark as escalated so we don't re-fire
      await supabase
        .from('sos_events')
        .update({ status: 'escalated' })
        .eq('id', sos.id);

      escalated++;
    }

    return new Response(JSON.stringify({ escalated }), { status: 200 });
  } catch (err) {
    console.error('[escalation-tick]', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
