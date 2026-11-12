import Link from 'next/link';
import { createClient } from '../../../lib/supabase-server';
import SeizureChart from '../../dashboard/SeizureChart';

function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p className="text-3xl font-black text-[#0C1F20] mb-0.5">{value}</p>
      <p className="text-[#3A5255] text-sm">{label}</p>
      {sub && <p className="text-[#6B8588] text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    cliniciansRes,
    patientsRes,
    sosRes,
    alertsRes,
    dispatchFlagRes,
    recentSosRes,
    pendingVerRes,
    adminProfileRes,
    newPatientsRes,
    newCliniciansRes,
    sosByDayRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, role').neq('role', 'patient').neq('role', 'admin'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase
      .from('sos_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo),
    supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .is('acknowledged_at', null),
    supabase.from('feature_flags').select('enabled').eq('key', 'live_dispatch').single(),
    supabase
      .from('sos_events')
      .select('id, patient_id, status, created_at, dispatched_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('clinician_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient').gte('created_at', weekAgo),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'patient').neq('role', 'admin').gte('created_at', weekAgo),
    supabase.from('sos_events').select('created_at').gte('created_at', weekAgo),
  ]);

  const allClinicians = cliniciansRes.data ?? [];
  const verifiedClinicians = allClinicians.filter((c) => c.role === 'verified' || c.role === 'clinician');
  const pendingClinicians = allClinicians.filter((c) => c.role === 'pending');
  const rejectedClinicians = allClinicians.filter((c) => c.role === 'rejected');

  const totalPatients = patientsRes.count ?? 0;
  const sosThisWeek = sosRes.count ?? 0;
  const activeAlerts = alertsRes.count ?? 0;
  const pendingVerCount = pendingVerRes.count ?? 0;

  const adminName = (adminProfileRes.data as any)?.full_name ?? 'Admin';
  const adminFirstName = adminName.replace(/^Dr\.?\s*/i, '').split(' ')[0];
  const newPatientsThisWeek = newPatientsRes.count ?? 0;
  const newCliniciansThisWeek = newCliniciansRes.count ?? 0;

  const sosByDayData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const count = (sosByDayRes.data ?? []).filter((e: any) => (e.created_at ?? '').startsWith(dayStr)).length;
    return { day: label, count };
  });

  const dispatchFlag = dispatchFlagRes.data;
  const isLive = dispatchFlag?.enabled === true;

  const recentSos = recentSosRes.data ?? [];

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  function maskPatientId(id: string) {
    const short = id.replace(/-/g, '').slice(-4).toUpperCase();
    return `Patient #${short}`;
  }

  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const STATUS_STYLES: Record<string, string> = {
    pending: 'text-[#F1C76B] bg-[rgba(241,199,107,0.10)] border-[#F1C76B]/20',
    active: 'text-[#C8102E] bg-[rgba(200,16,46,0.08)] border-[#C8102E]/20',
    dispatched: 'text-[#1F7A72] bg-[rgba(31,122,114,0.10)] border-[#1F7A72]/20',
    resolved: 'text-[#1F7A72] bg-[rgba(31,122,114,0.10)] border-[#1F7A72]/20',
    cancelled: 'text-[#6B8588] bg-[rgba(80,72,117,0.10)] border-[#6B8588]/20',
  };

  return (
    <div className="p-6">
      {/* Dispatch banner */}
      {isLive ? (
        <div className="flex items-center gap-3 bg-[rgba(0,217,126,0.08)] border border-[#1F7A72]/30 rounded-2xl px-5 py-4 mb-6">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1F7A72] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1F7A72]" />
          </span>
          <p className="text-[#1F7A72] text-sm font-semibold">
            Dispatch is <span className="font-black">LIVE</span> — real ambulances will be called on SOS activation.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-[rgba(244,63,94,0.08)] border border-[#C8102E]/30 rounded-2xl px-5 py-4 mb-6">
          <svg className="w-5 h-5 text-[#F1C76B] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-[#F1C76B] text-sm font-black">
              &#9888; Dispatch is in SANDBOX mode — no real ambulances will be called
            </p>
            <p className="text-[#3A5255] text-xs mt-0.5">
              Enable live dispatch from{' '}
              <Link href="/admin/emergency-routing" className="text-[#1F7A72] underline underline-offset-2">
                Emergency Routing
              </Link>{' '}
              when a signed provider agreement is in place.
            </p>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#FFFFFF] to-[#E8E0D4] border border-[#D6CFC4] rounded-2xl p-6 mb-6">
        <p className="text-[#6B8588] text-sm mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-[#0C1F20]">Welcome back, {adminFirstName}</h1>
        <p className="text-[#3A5255] text-sm mt-1">Platform-wide status at a glance.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Total Clinicians"
          value={allClinicians.length}
          sub={`${verifiedClinicians.length} verified · ${pendingClinicians.length} pending · ${rejectedClinicians.length} rejected`}
          iconBg="bg-[rgba(31,122,114,0.12)] text-[#1F7A72]"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Patients"
          value={totalPatients}
          sub="Across all clinicians"
          iconBg="bg-[rgba(244,184,96,0.12)] text-[#F1C76B]"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          label="SOS Events (7 days)"
          value={sosThisWeek}
          sub="Platform-wide"
          iconBg="bg-[rgba(244,63,94,0.12)] text-[#C8102E]"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Active Alerts"
          value={activeAlerts}
          sub="Unacknowledged"
          iconBg="bg-[rgba(0,217,126,0.12)] text-[#1F7A72]"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
        <StatCard
          label="New Patients (7 days)"
          value={newPatientsThisWeek}
          sub={newPatientsThisWeek === 1 ? '1 new signup' : `${newPatientsThisWeek} new signups`}
          iconBg="bg-[rgba(31,122,114,0.12)] text-[#1F7A72]"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
        />
        <StatCard
          label="New Clinicians (7 days)"
          value={newCliniciansThisWeek}
          sub="Newly registered"
          iconBg="bg-[rgba(232,96,60,0.12)] text-[#E8603C]"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
      </div>

      {/* Pending verifications banner */}
      {pendingVerCount > 0 && (
        <div className="flex items-center justify-between bg-[rgba(244,184,96,0.08)] border border-[#F1C76B]/30 rounded-2xl px-5 py-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#F1C76B] text-[#F5EFE3] font-black text-sm flex items-center justify-center flex-shrink-0">
              {pendingVerCount > 9 ? '9+' : pendingVerCount}
            </span>
            <p className="text-[#0C1F20] text-sm font-semibold">
              {pendingVerCount} clinician {pendingVerCount === 1 ? 'verification' : 'verifications'} awaiting review
            </p>
          </div>
          <Link
            href="/admin/clinicians"
            className="bg-[#F1C76B] text-[#F5EFE3] font-bold px-4 py-2 rounded-xl text-sm hover:bg-amber-400 transition-colors flex-shrink-0"
          >
            Review now
          </Link>
        </div>
      )}

      {/* SOS trend chart */}
      <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0C1F20]">SOS Events — last 7 days</h2>
            <p className="text-xs text-[#6B8588] mt-0.5">{sosThisWeek} total platform-wide</p>
          </div>
        </div>
        <SeizureChart data={sosByDayData} />
      </div>

      {/* Recent SOS events */}
      <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl overflow-hidden overflow-x-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6CFC4]">
          <h2 className="text-[#0C1F20] font-bold text-base">Recent SOS Events</h2>
          <span className="text-[#6B8588] text-xs">Last 10</span>
        </div>

        <div className="grid grid-cols-[1fr_110px_130px_130px] min-w-[500px] px-6 py-3 bg-[#F5EFE3] border-b border-[#D6CFC4]">
          {['Patient', 'Status', 'Created', 'Dispatched'].map((h) => (
            <span key={h} className="text-[#6B8588] text-xs font-semibold uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {recentSos.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#3A5255] text-sm">No SOS events recorded yet.</p>
          </div>
        ) : (
          recentSos.map((ev) => {
            const styleKey = ev.status ?? 'pending';
            const badgeStyle = STATUS_STYLES[styleKey] ?? STATUS_STYLES['pending'];
            return (
              <div
                key={ev.id}
                className="grid grid-cols-[1fr_110px_130px_130px] min-w-[500px] px-6 py-4 border-b border-[#D6CFC4] last:border-0 items-center hover:bg-[#EDE8DF] transition-colors"
              >
                <p className="text-[#0C1F20] text-sm font-mono">{maskPatientId(ev.patient_id)}</p>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-0.5 w-fit ${badgeStyle}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {ev.status ?? 'pending'}
                </span>
                <p className="text-[#3A5255] text-xs">{fmtDate(ev.created_at)}</p>
                <p className="text-[#3A5255] text-xs">{fmtDate(ev.dispatched_at)}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
