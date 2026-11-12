import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-admin';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin' && profile?.role !== 'org_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: provider, error } = await supabaseAdmin
      .from('emergency_providers')
      .select('id, name, mode, type, phone, api_config_ref')
      .eq('active', true)
      .order('priority', { ascending: true })
      .limit(1)
      .single();
    if (error || !provider) {
      return NextResponse.json(
        { success: false, message: 'No active emergency provider configured.' },
        { status: 404 }
      );
    }

    const now = new Date();
    const testRef = `TEST-${now.getTime().toString(36).toUpperCase()}`;
    const { error: insertError } = await supabaseAdmin
      .from('paramedic_dispatches')
      .insert({
        alert_id: null,
        provider_id: provider.id,
        status: provider.mode === 'sandbox' ? 'sandbox_skipped' : 'test_sent',
        payload: {
          test: true,
          dispatch_ref: testRef,
          initiated_at: now.toISOString(),
          provider_name: provider.name,
          provider_mode: provider.mode,
          source: 'routing_test',
        },
      });
    if (insertError) {
      console.error('[emergency-routing/test]', insertError);
      return NextResponse.json({ success: false, message: 'DB write failed.' }, { status: 500 });
    }

    if (provider.mode === 'sandbox') {
      return NextResponse.json({
        success: true,
        sandbox: true,
        ref: testRef,
        provider: provider.name,
        message: `Sandbox test queued. Reference ${testRef}. No real call placed.`,
      });
    }

    const configuredEndpoint = provider.api_config_ref
      ? process.env[provider.api_config_ref]
      : undefined;
    if (!configuredEndpoint) {
      return NextResponse.json({
        success: true,
        sandbox: false,
        ref: testRef,
        provider: provider.name,
        call: null,
        message: `Live test recorded; no provider endpoint is configured. Reference ${testRef}.`,
      });
    }

    const endpoint = new URL(configuredEndpoint);
    const allowedHosts = (process.env.EMERGENCY_PROVIDER_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
    if (endpoint.protocol !== 'https:' || !allowedHosts.includes(endpoint.hostname.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Provider endpoint is not on the configured HTTPS allowlist.' },
        { status: 503 }
      );
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.EMERGENCY_PROVIDER_API_KEY
          ? { Authorization: `Bearer ${process.env.EMERGENCY_PROVIDER_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        test: true,
        ref: testRef,
        message: 'Automated epimoyo routing test. No emergency has occurred.',
      }),
      signal: AbortSignal.timeout(10000),
    });

    return NextResponse.json({
      success: response.ok,
      sandbox: false,
      ref: testRef,
      provider: provider.name,
      call: { ok: response.ok, status: response.status },
      message: response.ok
        ? `Live test call sent. Reference ${testRef}.`
        : `Live test call failed (${response.status}).`,
    });
  } catch (error) {
    console.error('[emergency-routing/test]', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
