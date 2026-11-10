import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIp } from '../../../../lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  // Rate limit: 20 invites per admin IP per hour
  const ip = getIp(req.headers);
  const rl = rateLimit(`invite:${ip}`, { limit: 20, windowSec: 3600 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'org_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const email: string = (body.email ?? '').trim().toLowerCase();
  const full_name: string = (body.full_name ?? '').trim().slice(0, 200);

  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role: 'clinician', full_name: full_name ?? '' },
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
