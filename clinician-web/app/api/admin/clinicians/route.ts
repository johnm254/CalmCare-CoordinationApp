import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch clinicians and admins
  const { data: clinicianProfiles } = await admin
    .from('profiles')
    .select('id, full_name, email, created_at, role')
    .in('role', ['clinician', 'admin', 'suspended'])
    .order('created_at', { ascending: false });

  // Get patient counts per clinician
  const { data: links } = await admin
    .from('clinician_links')
    .select('clinician_id, patient_id')
    .not('verified_at', 'is', null);

  const patientCountMap: Record<string, number> = {};
  (links ?? []).forEach((l: any) => {
    patientCountMap[l.clinician_id] = (patientCountMap[l.clinician_id] ?? 0) + 1;
  });

  // Total unique patients
  const uniquePatients = new Set((links ?? []).map((l: any) => l.patient_id)).size;

  // SOS events this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: sosThisWeek } = await admin
    .from('sos_events')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgo);

  const clinicians = (clinicianProfiles ?? []).map((c: any) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    created_at: c.created_at,
    role: c.role,
    patient_count: patientCountMap[c.id] ?? 0,
    verified: !!(c.email),
  }));

  return NextResponse.json({
    clinicians,
    totalPatients: uniquePatients,
    sosThisWeek: sosThisWeek ?? 0,
  });
}
