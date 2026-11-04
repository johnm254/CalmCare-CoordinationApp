import Link from 'next/link';
import { createClient } from '../../../lib/supabase-server';

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
    <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p className="text-3xl font-black text-[#0F1B2D] mb-0.5">{value}</p>
      <p className="text-[#5B6B7F] text-sm">{label}</p>
      {sub && <p className="text-[#8C9AAB] text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    cliniciansRes,
    patientsRes,
    sosRes,
    alertsRes,
    dispatchFlagRes,
    recentSosRes,
    pendingVerRes,
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
  ]);

  const allClinicians = cliniciansRes.data ?? [];
  const verifiedClinicians = allClinicians.filter((c) => c.role === 'verified' || c.role === 'clinician');
  const pendingClinicians = allClinicians.filter((c) => c.role === 'pending');
  const rejectedClinicians = allClinicians.filter((c) => c.role === 'rejected');

  const totalPatients = patientsRes.count ?? 0;
  const sosThisWeek = sosRes.count ?? 0;
  const activeAlerts = alertsRes.count ?? 0;
  const pendingVerCount = pendingVerRes.count ?? 0;

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
    pending: 'text-[#F4B860] bg-[rgba(244,184,96,0.10)] border-[#F4B860]/20',
    active: 'text-[#F43F5E] bg-[rgba(244,63,94,0.10)] border-[#F43F5E]/20',
    dispatched: 'text-[#14B8A6] bg-[rgba(20,184,166,0.10)] border-[#14B8A6]/20',
    resolved: 'text-[#22C87A] bg-[rgba(0,217,126,0.10)] border-[#22C87A]/20',
    cancelled: 'text-[#8C9AAB] bg-[rgba(80,72,117,0.10)] border-[#8C9AAB]/20',
  };

  return (
    <div className="p-6">
      {/* Dispatch banner */}
      {isLive ? (
        <div className="flex items-center gap-3 bg-[rgba(0,217,126,0.08)] border border-[#22C87A]/30 rounded-2xl px-5 py-4 mb-6">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C87A] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C87A]" />
          </span>
          <p className="text-[#22C87A] text-sm font-semibold">
            Dispatch is <span className="font-black">LIVE</span> — real ambulances will be called on SOS activation.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-[rgba(244,63,94,0.08)] border border-[#F43F5E]/30 rounded-2xl px-5 py-4 mb-6">
          <svg className="w-5 h-5 text-[#F4B860] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-[#F4B860] text-sm font-black">
              ⚠ Dispatch is in SANDBOX mode — no real ambulances will be called
            </p>
            <p className="text-[#5B6B7F] text-xs mt-0.5">
              Enable live dispatch from{' '}
              <Link href="/admin/emergency-routing" className="text-[#14B8A6] underline underline-offset-2">
                Emergency Routing
              </Link>{' '}
              when a signed provider agreement is in place.
            </p>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#FFFFFF] to-[#EEF3F9] border border-[#E6ECF2] rounded-2xl p-6 mb-6">
        <p className="text-[#8C9AAB] text-sm mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-[#0F1B2D]">System Health Overview</h1>
        <p className="text-[#5B6B7F] text-sm mt-1">Platform-wide status at a glance.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Clinicians"
          value={allClinicians.length}
          sub={`${verifiedClinicians.length} verified · ${pendingClinicians.length} pending · ${rejectedClinicians.length} rejected`}
          iconBg="bg-[rgba(20,184,166,0.12)] text-[#14B8A6]"
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
          iconBg="bg-[rgba(244,184,96,0.12)] text-[#F4B860]"
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
          iconBg="bg-[rgba(244,63,94,0.12)] text-[#F43F5E]"
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
          iconBg="bg-[rgba(0,217,126,0.12)] text-[#22C87A]"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
      </div>

      {/* Pending verifications banner */}
      {pendingVerCount > 0 && (
        <div className="flex items-center justify-between bg-[rgba(244,184,96,0.08)] border border-[#F4B860]/30 rounded-2xl px-5 py-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#F4B860] text-[#F6F9FC] font-black text-sm flex items-center justify-center flex-shrink-0">
              {pendingVerCount > 9 ? '9+' : pendingVerCount}
            </span>
            <p className="text-[#0F1B2D] text-sm font-semibold">
              {pendingVerCount} clinician {pendingVerCount === 1 ? 'verification' : 'verifications'} awaiting review
            </p>
          </div>
          <Link
            href="/admin/clinicians"
            className="bg-[#F4B860] text-[#F6F9FC] font-bold px-4 py-2 rounded-xl text-sm hover:bg-amber-400 transition-colors flex-shrink-0"
          >
            Review now
          </Link>
        </div>
      )}

      {/* Recent SOS events */}
      <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl overflow-hidden overflow-x-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6ECF2]">
          <h2 className="text-[#0F1B2D] font-bold text-base">Recent SOS Events</h2>
          <span className="text-[#8C9AAB] text-xs">Last 10</span>
        </div>

        <div className="grid grid-cols-[1fr_110px_130px_130px] min-w-[500px] px-6 py-3 bg-[#F6F9FC] border-b border-[#E6ECF2]">
          {['Patient', 'Status', 'Created', 'Dispatched'].map((h) => (
            <span key={h} className="text-[#8C9AAB] text-xs font-semibold uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {recentSos.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#5B6B7F] text-sm">No SOS events recorded yet.</p>
          </div>
        ) : (
          recentSos.map((ev) => {
            const styleKey = ev.status ?? 'pending';
            const badgeStyle = STATUS_STYLES[styleKey] ?? STATUS_STYLES['pending'];
            return (
              <div
                key={ev.id}
                className="grid grid-cols-[1fr_110px_130px_130px] min-w-[500px] px-6 py-4 border-b border-[#E6ECF2] last:border-0 items-center hover:bg-[#F1F5FA] transition-colors"
              >
                <p className="text-[#0F1B2D] text-sm font-mono">{maskPatientId(ev.patient_id)}</p>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-0.5 w-fit ${badgeStyle}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {ev.status ?? 'pending'}
                </span>
                <p className="text-[#5B6B7F] text-xs">{fmtDate(ev.created_at)}</p>
                <p className="text-[#5B6B7F] text-xs">{fmtDate(ev.dispatched_at)}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
