import { createClient } from '../../../../lib/supabase-server';
import SeizureChart from '../../../dashboard/SeizureChart';

export default async function AdminAnalyticsPage() {
  const supabase = createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalUsersRes, totalEventsRes, totalSosRes,
    sosByDayRes, eventsByDayRes,
    week1Res, week2Res, week3Res, week4Res,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('sos_events').select('id', { count: 'exact', head: true }),
    supabase.from('sos_events').select('created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('events').select('occurred_at').gte('occurred_at', thirtyDaysAgo),
    // Weekly new user counts (4 weeks)
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient')
      .gte('created_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())
      .lt('created_at', new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient')
      .gte('created_at', new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString())
      .lt('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient')
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const totalUsers = totalUsersRes.count ?? 0;
  const totalEvents = totalEventsRes.count ?? 0;
  const totalSos = totalSosRes.count ?? 0;

  // 30-day SOS chart
  const sosTrend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().slice(0, 10);
    const label = i % 6 === 0
      ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : '·';
    const count = (sosByDayRes.data ?? []).filter((e: any) =>
      (e.created_at ?? '').startsWith(dayStr)
    ).length;
    return { day: label, count };
  });

  // 30-day events chart
  const eventsTrend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().slice(0, 10);
    const label = i % 6 === 0
      ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : '·';
    const count = (eventsByDayRes.data ?? []).filter((e: any) =>
      (e.occurred_at ?? '').startsWith(dayStr)
    ).length;
    return { day: label, count };
  });

  // Weekly patient growth
  const weekLabels = ['4 wks ago', '3 wks ago', '2 wks ago', 'This week'];
  const weekCounts = [
    week1Res.count ?? 0,
    week2Res.count ?? 0,
    week3Res.count ?? 0,
    week4Res.count ?? 0,
  ];
  const growthData = weekLabels.map((day, i) => ({ day, count: weekCounts[i] }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0C1F20]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          Analytics
        </h1>
        <p className="text-[#3A5255] text-sm mt-1">Platform-wide usage and growth metrics.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total users', value: totalUsers, sub: 'All roles', color: 'text-[#1F7A72]', bg: 'bg-[rgba(31,122,114,0.10)]' },
          { label: 'Total events recorded', value: totalEvents, sub: 'All time, all patients', color: 'text-[#0C1F20]', bg: 'bg-[#EDE8DF]' },
          { label: 'Total SOS events', value: totalSos, sub: 'All time, platform-wide', color: 'text-[#C8102E]', bg: 'bg-[rgba(200,16,46,0.08)]' },
        ].map((s) => (
          <div key={s.label} className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
              <svg className={`w-5 h-5 ${s.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className={`text-3xl font-black mb-0.5 ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="text-[#3A5255] text-sm">{s.label}</p>
            <p className="text-[#6B8588] text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
          <h2 className="text-base font-bold text-[#0C1F20] mb-1">SOS events — last 30 days</h2>
          <p className="text-xs text-[#6B8588] mb-4">Platform-wide</p>
          <SeizureChart data={sosTrend} />
        </div>
        <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
          <h2 className="text-base font-bold text-[#0C1F20] mb-1">Health events — last 30 days</h2>
          <p className="text-xs text-[#6B8588] mb-4">Seizures, missed doses, all types</p>
          <SeizureChart data={eventsTrend} />
        </div>
      </div>

      {/* Patient growth */}
      <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
        <h2 className="text-base font-bold text-[#0C1F20] mb-1">Patient signups — last 4 weeks</h2>
        <p className="text-xs text-[#6B8588] mb-4">New patient accounts per week</p>
        <SeizureChart data={growthData} />
      </div>
    </div>
  );
}
