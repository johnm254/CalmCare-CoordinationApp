// Africa's Talking inbound SMS reply webhook.
// Configure in the AT dashboard:
//   AT_WEBHOOK_URL = https://your-domain/api/sms-reply
//
// AT POSTs application/x-www-form-urlencoded with fields:
//   from, to, text, date, id

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const from = (formData.get('from') as string | null) ?? '';
    const rawText = (formData.get('text') as string | null) ?? '';
    const text = rawText.trim();

    // Only handle "1" (on my way) or "2" (cannot respond)
    if (text !== '1' && text !== '2') {
      return NextResponse.json({ ok: true });
    }

    // Look up the caregiver by their phone number (stored in E.164 format)
    const { data: profileRows, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', from)
      .limit(1);

    if (profileError || !profileRows || profileRows.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const caregiverId: string = profileRows[0].id;

    // Find the most recent open SOS event where this caregiver is a recipient
    const { data: sosRows, error: sosError } = await supabaseAdmin
      .from('sos_events')
      .select('id, status')
      .contains('recipients', [caregiverId])
      .in('status', ['sent', 'notified'])
      .order('sent_at', { ascending: false })
      .limit(1);

    if (sosError || !sosRows || sosRows.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const sosEvent = sosRows[0];
    const response = text === '1' ? 'on_my_way' : 'cannot_respond';

    // Insert the caregiver's response
    await supabaseAdmin.from('sos_responses').insert({
      sos_event_id: sosEvent.id,
      responder_id: caregiverId,
      response,
      channel: 'sms',
      responded_at: new Date().toISOString(),
    });

    // If the caregiver is on their way, advance the SOS event status
    if (response === 'on_my_way') {
      await supabaseAdmin
        .from('sos_events')
        .update({ status: 'responding' })
        .eq('id', sosEvent.id)
        .in('status', ['sent', 'notified']);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Always return 200 so Africa's Talking does not retry
    console.error('sms-reply webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}
