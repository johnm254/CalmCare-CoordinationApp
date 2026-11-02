import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Load the active emergency provider
    const { data: provider, error: provErr } = await supabase
      .from('emergency_providers')
      .select('id, name, mode, type, phone, endpoint_url, api_key_env')
      .eq('active', true)
      .order('priority', { ascending: true })
      .limit(1)
      .single();

    if (provErr || !provider) {
      return NextResponse.json(
        { success: false, message: 'No active emergency provider configured.' },
        { status: 404 }
      );
    }

    const isSandbox = provider.mode === 'sandbox';
    const now = new Date();
    const testRef = `TEST-${now.getTime().toString(36).toUpperCase()}`;

    // Record the test dispatch attempt regardless of mode
    const { error: insertErr } = await supabase
      .from('paramedic_dispatches')
      .insert({
        alert_id: null,
        provider_id: provider.id,
        status: isSandbox ? 'sandbox_skipped' : 'test_sent',
        payload: {
          test: true,
          dispatch_ref: testRef,
          initiated_at: now.toISOString(),
          provider_name: provider.name,
          provider_mode: provider.mode,
          location_lat: -1.2921,
          location_lon: 36.8219,
          patient_name: 'Test Patient',
          alert_raised_at: now.toISOString(),
          alert_time_str: now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Africa/Nairobi',
          }),
          callback_phone: '+254 700 000 000',
          source: 'routing_test',
        },
      });

    if (insertErr) {
      console.error('[emergency-routing/test]', insertErr);
      return NextResponse.json(
        { success: false, message: `DB write failed: ${insertErr.message}` },
        { status: 500 }
      );
    }

    if (isSandbox) {
      return NextResponse.json({
        success: true,
        sandbox: true,
        ref: testRef,
        provider: provider.name,
        message: `Sandbox test queued. Reference ${testRef}. No real call placed — switch provider to live mode to test real dispatch.`,
      });
    }

    // Live mode: attempt a real call to the provider endpoint
    let callResult: { ok: boolean; status: number; body: string } | null = null;
    if (provider.endpoint_url) {
      try {
        const apiKey = provider.api_key_env
          ? Deno?.env?.get(provider.api_key_env) ?? process.env[provider.api_key_env]
          : undefined;

        const resp = await fetch(provider.endpoint_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            test: true,
            ref: testRef,
            message:
              'This is an automated routing test from Mojo. No emergency has occurred. Please disregard.',
          }),
          signal: AbortSignal.timeout(10000),
        });
        callResult = {
          ok: resp.ok,
          status: resp.status,
          body: await resp.text().catch(() => ''),
        };
      } catch (fetchErr) {
        callResult = { ok: false, status: 0, body: String(fetchErr) };
      }
    }

    return NextResponse.json({
      success: callResult?.ok ?? true,
      sandbox: false,
      ref: testRef,
      provider: provider.name,
      call: callResult,
      message: callResult
        ? callResult.ok
          ? `Live test call sent. Reference ${testRef}. Provider responded ${callResult.status}.`
          : `Live test call failed (${callResult.status}). Check provider credentials.`
        : `Live test recorded (no endpoint URL on provider). Reference ${testRef}.`,
    });
  } catch (err) {
    console.error('[emergency-routing/test]', err);
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
