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
  if (profile?.role !== 'admin' && profile?.role !== 'org_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: clinicianProfiles },
    { data: links },
    { data: verifications },
    { count: sosThisWeek },
    { count: pendingVerifications },
  ] = await Promise.all([
    admin.from('profiles')
      .select('id, full_name, email, created_at, role')
      .in('role', ['clinician', 'admin', 'org_admin', 'suspended'])
      .order('created_at', { ascending: false }),

    admin.from('clinician_links')
      .select('clinician_id, patient_id')
      .not('verified_at', 'is', null),

    admin.from('clinician_verifications')
      .select('clinician_id, status')
      .eq('status', 'verified'),

    admin.from('sos_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

    admin.from('clinician_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const patientCountMap: Record<string, number> = {};
  (links ?? []).forEach((l: any) => {
    patientCountMap[l.clinician_id] = (patientCountMap[l.clinician_id] ?? 0) + 1;
  });

  const verifiedClinicianIds = new Set((verifications ?? []).map((v: any) => v.clinician_id));
  const uniquePatients = new Set((links ?? []).map((l: any) => l.patient_id)).size;

  const clinicians = (clinicianProfiles ?? []).map((c: any) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    created_at: c.created_at,
    role: c.role,
    patient_count: patientCountMap[c.id] ?? 0,
    verified: verifiedClinicianIds.has(c.id),
  }));

  return NextResponse.json({
    clinicians,
    totalPatients: uniquePatients,
    sosThisWeek: sosThisWeek ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
  });
}
