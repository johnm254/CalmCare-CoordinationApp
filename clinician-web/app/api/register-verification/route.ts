import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { rateLimit, getIp } from '../../../lib/rate-limit';

const MAX_FIELD_LEN = 200;

export async function POST(req: NextRequest) {
  // Rate limit: 5 verification submissions per IP per 10 minutes
  const ip = getIp(req.headers);
  const rl = rateLimit(`verify:${ip}`, { limit: 5, windowSec: 600 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    // Authenticate the caller — userId comes from the session, not the body
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const licenceNumber: string = String(body.licenceNumber ?? '').trim().slice(0, MAX_FIELD_LEN);
    const cadre: string = String(body.cadre ?? '').trim().slice(0, MAX_FIELD_LEN);
    const registeringBody: string = String(body.registeringBody ?? '').trim().slice(0, MAX_FIELD_LEN);

    if (!licenceNumber || !cadre || !registeringBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('clinician_verifications').insert({
      clinician_id: user.id,
      licence_number: licenceNumber,
      cadre,
      registering_body: registeringBody,
      status: 'pending',
      method: 'manual',
    });

    if (error) {
      return NextResponse.json({ error: 'Could not submit verification request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
