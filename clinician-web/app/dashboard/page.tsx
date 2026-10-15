import Link from 'next/link';
import { createClient } from '../../lib/supabase-server';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    review:   'bg-[#3A1A18] text-[#FF7A6B] border border-[#FF7A6B]/30',
    stable:   'bg-[#1A3A3A] text-[#4FC3B7] border border-[#4FC3B7]/30',
    followup: 'bg-[#3A2A10] text-[#F4B860] border border-[#F4B860]/30',
  };
  const labels: Record<string, string> = { review: 'Review', stable: 'Stable', followup: 'Follow-up' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] ?? map.stable}`}>
      {labels[status] ?? 'Stable'}
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get patients linked to this clinician
  const { data: links } = await supabase
    .from('clinician_links')
    .select('patient_id, profiles!clinician_links_patient_id_fkey(id, full_name, email)')
    .eq('clinician_id', user!.id)
    .not('verified_at', 'is', null);

  const patientIds = (links ?? []).map((l: any) => l.patient_id);

  // Events this week per patient
  const { data: recentEvents } = patientIds.length
    ? await supabase.from('events').select('patient_id').in('patient_id', patientIds).gte('occurred_at', weekAgo)
    : { data: [] };

  // Open follow-ups
  const { data: openFollowups } = await supabase
    .from('followups')
    .select('id, patient_id, title, due_at, profiles!followups_patient_id_fkey(full_name)')
    .eq('clinician_id', user!.id)
    .eq('status', 'open')
    .order('due_at', { ascending: true });

  const eventsByPatient: Record<string, number> = {};
  (recentEvents ?? []).forEach((e: any) => {
    eventsByPatient[e.patient_id] = (eventsByPatient[e.patient_id] ?? 0) + 1;
  });

  const patients = (links ?? []).map((l: any) => ({
    id: l.patient_id,
    full_name: l.profiles?.full_name ?? 'Unknown',
    initials: (l.profiles?.full_name ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
    events_this_week: eventsByPatient[l.patient_id] ?? 0,
    open_followups: (openFollowups ?? []).filter((f: any) => f.patient_id === l.patient_id).length,
  }));

  const needReview = patients.filter((p) => p.events_this_week > 0).length;
  const totalEvents = Object.values(eventsByPatient).reduce((s, n) => s + n, 0);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const stats = [
    {
      label: 'Total Patients', value: patients.length, color: 'text-[#EAF2F6]',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      iconBg: 'bg-[#1A3A3A] text-[#4FC3B7]',
    },
    {
      label: 'Need Review', value: needReview, color: needReview > 0 ? 'text-[#FF7A6B]' : 'text-[#EAF2F6]',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      iconBg: needReview > 0 ? 'bg-[#3A1A18] text-[#FF7A6B]' : 'bg-[#1A3144] text-[#A8BDCA]',
    },
    {
      label: 'Follow-ups Due', value: (openFollowups ?? []).length, color: (openFollowups ?? []).length > 0 ? 'text-[#F4B860]' : 'text-[#EAF2F6]',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
      iconBg: (openFollowups ?? []).length > 0 ? 'bg-[#3A2A10] text-[#F4B860]' : 'bg-[#1A3144] text-[#A8BDCA]',
    },
    {
      label: 'Events This Week', value: totalEvents, color: 'text-[#4FC3B7]',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      iconBg: 'bg-[#1A3A3A] text-[#4FC3B7]',
    },
  ];

  return (
    <div className="p-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#112230] to-[#1A3144] rounded-2xl p-6 mb-8 border border-[#1E3A52]">
        <p className="text-[#A8BDCA] text-sm mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-[#EAF2F6]">Welcome back, {profile?.full_name?.replace(/^Dr\.?\s*/i, '').split(' ')[0] ?? 'Doctor'}</h1>
        <p className="text-[#A8BDCA] text-sm mt-1">Here is what is happening with your patients today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#112230] border border-[#1E3A52] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                {s.icon}
              </div>
            </div>
            <p className={`text-3xl font-black ${s.color} mb-1`}>{s.value}</p>
            <p className="text-[#A8BDCA] text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Patient Roster */}
        <div className="col-span-2 bg-[#112230] border border-[#1E3A52] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#EAF2F6]">Patients</h2>
            <Link href="/dashboard/patients" className="text-[#4FC3B7] text-sm hover:underline">View all</Link>
          </div>

          {patients.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[#A8BDCA] text-sm">No patients linked yet.</p>
              <p className="text-[#4F6D84] text-xs mt-1">Patients can link you from their app, or you can add a link from the Patients page.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between py-3 border-b border-[#1E3A52] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1A3A3A] flex items-center justify-center text-[#4FC3B7] font-bold text-sm flex-shrink-0">
                      {patient.initials}
                    </div>
                    <div>
                      <p className="text-[#EAF2F6] font-semibold text-sm">{patient.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-[#EAF2F6] text-sm font-medium">{patient.events_this_week} events</p>
                      <p className="text-[#4F6D84] text-xs">this week</p>
                    </div>
                    <StatusBadge status={patient.events_this_week > 0 ? 'review' : 'stable'} />
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="text-[#4FC3B7] border border-[#1E3A52] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#1A3A3A] transition-colors min-h-[36px] flex items-center"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-ups */}
        <div className="bg-[#112230] border border-[#1E3A52] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#EAF2F6]">Follow-ups</h2>
            <Link href="/dashboard/follow-ups" className="text-[#4FC3B7] text-sm hover:underline">View all</Link>
          </div>
          {(openFollowups ?? []).length === 0 ? (
            <p className="text-[#A8BDCA] text-sm py-4">No open follow-ups.</p>
          ) : (
            <div className="space-y-4">
              {(openFollowups ?? []).slice(0, 3).map((fu: any) => (
                <div key={fu.id} className="border-b border-[#1E3A52] pb-4 last:border-0 last:pb-0">
                  <p className="text-[#A8BDCA] text-xs mb-1">{fu.profiles?.full_name}</p>
                  <p className="text-[#EAF2F6] text-sm font-medium leading-snug mb-2">{fu.title}</p>
                  <p className="text-[#4F6D84] text-xs">
                    Due {new Date(fu.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
