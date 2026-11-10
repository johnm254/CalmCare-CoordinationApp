import Link from 'next/link';
import { createClient } from '../../lib/supabase-server';
import SeizureChart from './SeizureChart';

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    review:  { bg: 'bg-[rgba(200,16,46,0.08)]',  text: 'text-[#C8102E]',  label: 'Review' },
    stable:  { bg: 'bg-[rgba(31,122,114,0.10)]',   text: 'text-[#1F7A72]',  label: 'Stable' },
    followup:{ bg: 'bg-[rgba(241,199,107,0.10)]',  text: 'text-[#F1C76B]',  label: 'Follow-up' },
    none:    { bg: 'bg-[#EDE8DF]',                text: 'text-[#6B8588]',  label: 'No events' },
  };
  const s = map[status] ?? map.stable;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
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

  // Events this week per patient (with date for chart)
  const { data: recentEvents } = patientIds.length
    ? await supabase.from('events').select('patient_id, occurred_at').in('patient_id', patientIds).gte('occurred_at', weekAgo)
    : { data: [] };

  // Open follow-ups
  const { data: openFollowups } = await supabase
    .from('followups')
    .select('id, patient_id, title, due_at, profiles!followups_patient_id_fkey(full_name)')
    .eq('clinician_id', user!.id)
    .eq('status', 'open')
    .order('due_at', { ascending: true });

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [lastWeekEventsRes, activeSosRes] = await Promise.all([
    patientIds.length
      ? supabase.from('events').select('patient_id').in('patient_id', patientIds).gte('occurred_at', twoWeeksAgo).lt('occurred_at', weekAgo)
      : Promise.resolve({ data: [] }),
    patientIds.length
      ? supabase.from('sos_events').select('id, patient_id, created_at, profiles!sos_events_patient_id_fkey(full_name)').in('patient_id', patientIds).eq('status', 'active').limit(5)
      : Promise.resolve({ data: [] }),
  ]);
  const lastWeekTotal = (lastWeekEventsRes.data ?? []).length;
  const activeSos = (activeSosRes.data ?? []) as unknown as Array<{ id: string; patient_id: string; created_at: string; profiles: { full_name: string | null } | null }>;

  const eventsByPatient: Record<string, number> = {};
  (recentEvents ?? []).forEach((e: any) => {
    eventsByPatient[e.patient_id] = (eventsByPatient[e.patient_id] ?? 0) + 1;
  });

  // Build chart data: events per day for the last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const count = (recentEvents ?? []).filter((e: any) =>
      (e.occurred_at ?? '').startsWith(dayStr)
    ).length;
    return { day: label, count };
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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.full_name?.replace(/^Dr\.?\s*/i, '').split(' ')[0] ?? 'Doctor';

  const stats = [
    {
      label: 'Total Patients',
      value: patients.length,
      valueColor: 'text-[#0C1F20]',
      iconBg: 'bg-[rgba(31,122,114,0.10)]',
      iconColor: 'text-[#1F7A72]',
      trend: '—',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Need Review',
      value: needReview,
      valueColor: needReview > 0 ? 'text-[#C8102E]' : 'text-[#0C1F20]',
      iconBg: needReview > 0 ? 'bg-[rgba(200,16,46,0.08)]' : 'bg-[#EDE8DF]',
      iconColor: needReview > 0 ? 'text-[#C8102E]' : 'text-[#6B8588]',
      trend: needReview > 0 ? '▲' : '—',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'Follow-ups Due',
      value: (openFollowups ?? []).length,
      valueColor: (openFollowups ?? []).length > 0 ? 'text-[#F1C76B]' : 'text-[#0C1F20]',
      iconBg: (openFollowups ?? []).length > 0 ? 'bg-[rgba(241,199,107,0.10)]' : 'bg-[#EDE8DF]',
      iconColor: (openFollowups ?? []).length > 0 ? 'text-[#F1C76B]' : 'text-[#6B8588]',
      trend: (openFollowups ?? []).length > 0 ? '▲' : '—',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: 'Events This Week',
      value: totalEvents,
      valueColor: 'text-[#1F7A72]',
      iconBg: 'bg-[rgba(31,122,114,0.10)]',
      iconColor: 'text-[#1F7A72]',
      trend: totalEvents > lastWeekTotal
        ? `▲ ${totalEvents - lastWeekTotal} vs last wk`
        : totalEvents < lastWeekTotal
        ? `▼ ${lastWeekTotal - totalEvents} vs last wk`
        : '— same as last wk',
      trendColor: totalEvents > lastWeekTotal ? 'text-[#C8102E]' : totalEvents < lastWeekTotal ? 'text-[#1F7A72]' : 'text-[#6B8588]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-8">
      {activeSos.length > 0 && (
        <div className="bg-[rgba(200,16,46,0.08)] border border-[#C8102E]/30 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(200,16,46,0.15)] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#C8102E] animate-pulse" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[#C8102E] font-bold text-sm">
              {activeSos.length} active SOS alert{activeSos.length > 1 ? 's' : ''}
            </p>
            <p className="text-[#3A5255] text-xs mt-0.5">
              {activeSos.map((s: any) => (s.profiles as any)?.full_name ?? 'Unknown').join(', ')}
            </p>
          </div>
          <Link
            href="/dashboard/alerts"
            className="bg-[#C8102E] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#a00d24] transition-colors flex-shrink-0"
          >
            Go to Alerts →
          </Link>
        </div>
      )}

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#FFFFFF] to-[#E8E0D4] border border-[#D6CFC4] rounded-2xl p-6 mb-8">
        <p className="text-[#6B8588] text-xs font-medium uppercase tracking-widest mb-1">{today}</p>
        <h1 className="text-[#0C1F20] font-bold" style={{ fontSize: '26px' }}>
          {greeting}, Dr. {firstName}
        </h1>
        <p className="text-[#3A5255] text-sm mt-1">Here is what is happening with your patients today.</p>
        {/* Pulse line */}
        <svg viewBox="0 0 400 32" className="w-full mt-4 opacity-30" aria-hidden="true">
          <polyline
            points="0,16 60,16 80,4 100,28 120,16 160,16 180,8 200,24 220,16 280,16 300,6 320,26 340,16 400,16"
            fill="none" stroke="#1F7A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg} ${s.iconColor}`}>
                {s.icon}
              </div>
              <span className={`text-xs ${(s as any).trendColor ?? 'text-[#6B8588]'}`}>{s.trend}</span>
            </div>
            <p className={`text-3xl font-black ${s.valueColor} mb-1`}>{s.value}</p>
            <p className="text-[#3A5255] text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Seizure frequency chart — full width below KPI row */}
      <div className="col-span-3 bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-[#0C1F20] mb-4">Events this week</h2>
        <SeizureChart data={chartData} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Patient roster */}
        <div className="col-span-3 xl:col-span-2 bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#0C1F20]">Patients</h2>
            <Link href="/dashboard/patients" className="text-[#1F7A72] text-sm hover:underline font-medium">
              View all →
            </Link>
          </div>

          {patients.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EDE8DF] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#6B8588]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-[#3A5255] text-sm">No patients linked yet.</p>
              <p className="text-[#6B8588] text-xs mt-1">Patients can link you from their app, or you can add a link from the Patients page.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {patients.map((patient) => {
                const status = patient.events_this_week > 0 ? 'review' : patient.open_followups > 0 ? 'followup' : 'stable';
                return (
                  <div key={patient.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#EDE8DF] transition-colors border-b border-[#D6CFC4] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1F7A72]/15 border border-[#1F7A72]/30 flex items-center justify-center text-[#1F7A72] font-bold text-sm flex-shrink-0">
                        {patient.initials}
                      </div>
                      <div>
                        <p className="text-[#0C1F20] font-semibold text-sm">{patient.full_name}</p>
                        <p className="text-[#6B8588] text-xs">{patient.events_this_week} events this week</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={status} />
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="text-[#1F7A72] border border-[#D6CFC4] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#1F7A72]/10 transition-colors min-h-[36px] flex items-center"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Follow-ups */}
        <div className="col-span-3 xl:col-span-1 bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#0C1F20]">Follow-ups</h2>
            <Link href="/dashboard/follow-ups" className="text-[#1F7A72] text-sm hover:underline font-medium">
              View all →
            </Link>
          </div>

          {(openFollowups ?? []).length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-[#3A5255] text-sm">No open follow-ups.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(openFollowups ?? []).slice(0, 4).map((fu: any) => {
                const daysUntil = Math.ceil((new Date(fu.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const dateColor = daysUntil < 0 ? 'text-[#C8102E]' : daysUntil === 0 ? 'text-[#F1C76B]' : 'text-[#6B8588]';
                return (
                  <div key={fu.id} className="border-b border-[#D6CFC4] pb-4 last:border-0 last:pb-0">
                    <p className="text-[#3A5255] text-xs mb-1">{(fu.profiles as any)?.full_name}</p>
                    <p className="text-[#0C1F20] text-sm font-semibold leading-snug mb-1.5">{fu.title}</p>
                    <p className={`text-xs font-medium ${dateColor}`}>
                      {daysUntil < 0
                        ? `Overdue by ${Math.abs(daysUntil)}d`
                        : daysUntil === 0
                        ? 'Due today'
                        : `Due ${new Date(fu.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
