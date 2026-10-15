import { createClient as createAdminClient } from '@supabase/supabase-js';

const TYPE_DOT: Record<string, string> = {
  events:      'bg-[#4FC3B7]',
  medications: 'bg-[#F59E0B]',
  brief:       'bg-[#7B93A8]',
  followups:   'bg-purple-400',
  records:     'bg-blue-400',
};

const TYPE_RING: Record<string, string> = {
  events:      'bg-[#4FC3B7]/15',
  medications: 'bg-[#F59E0B]/15',
  brief:       'bg-[#7B93A8]/15',
  followups:   'bg-purple-400/15',
  records:     'bg-blue-400/15',
};

const TYPE_COLOR: Record<string, string> = {
  events:      'text-[#4FC3B7]',
  medications: 'text-[#F59E0B]',
  brief:       'text-[#7B93A8]',
  followups:   'text-purple-400',
  records:     'text-blue-400',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function AdminActivityPage() {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: log } = await admin
    .from('audit_log')
    .select('*, actor:actor_id(id, full_name, email), patient:patient_id(full_name)')
    .order('at', { ascending: false })
    .limit(100);

  const entries = log ?? [];

  const byClinicianMap: Map<string, { name: string; email: string; count: number }> = new Map();
  for (const e of entries) {
    const actor = e.actor as any;
    if (!actor) continue;
    const prev = byClinicianMap.get(actor.id) ?? { name: actor.full_name ?? 'Unknown', email: actor.email ?? '', count: 0 };
    byClinicianMap.set(actor.id, { ...prev, count: prev.count + 1 });
  }
  const topClinicians = [...byClinicianMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayCount = entries.filter((e) => e.at?.startsWith(todayIso)).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#E8F0F6]">Platform activity</h1>
        <p className="text-[#7B93A8] text-sm mt-1">
          Full audit trail of every data access across all clinicians. Patients can see their own slice.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl p-5">
          <p className="text-3xl font-black text-[#E8F0F6] mb-0.5">{entries.length}</p>
          <p className="text-[#7B93A8] text-sm">Total entries shown</p>
          <p className="text-[#4A6578] text-xs mt-1">Last 100 records</p>
        </div>
        <div className="bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl p-5">
          <p className="text-3xl font-black text-[#4FC3B7] mb-0.5">{todayCount}</p>
          <p className="text-[#7B93A8] text-sm">Events today</p>
          <p className="text-[#4A6578] text-xs mt-1">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
        </div>
        <div className="bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl p-5">
          <p className="text-3xl font-black text-[#E8F0F6] mb-0.5">{byClinicianMap.size}</p>
          <p className="text-[#7B93A8] text-sm">Clinicians active</p>
          <p className="text-[#4A6578] text-xs mt-1">In this window</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main log */}
        <div className="col-span-2 bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl p-6">
          <h2 className="text-[#E8F0F6] font-bold text-base mb-5">Access log</h2>

          {entries.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#1A2F4A] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#4A6578]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-[#7B93A8] text-sm">No audit entries yet.</p>
              <p className="text-[#4A6578] text-xs mt-1">Entries appear as clinicians view patient data.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {entries.map((entry: any, i: number) => {
                const actor = entry.actor as any;
                const patient = entry.patient as any;
                const initials = (actor?.full_name ?? 'C').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                const gradients = [
                  'from-[#4FC3B7] to-[#2A8F86]',
                  'from-[#3B82F6] to-[#1D4ED8]',
                  'from-[#8B5CF6] to-[#6D28D9]',
                  'from-[#F59E0B] to-[#D97706]',
                  'from-[#EF4444] to-[#DC2626]',
                ];
                const grad = gradients[(actor?.id?.charCodeAt(0) ?? 0) % gradients.length];
                return (
                  <div key={entry.id} className="flex gap-4 pb-5 relative">
                    {i < entries.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-[#1A2F4A]" />
                    )}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-8 h-8 rounded-full ${TYPE_RING[entry.resource_type] ?? 'bg-[#7B93A8]/15'} flex items-center justify-center`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${TYPE_DOT[entry.resource_type] ?? 'bg-[#7B93A8]'}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[#E8F0F6] text-sm font-medium">{entry.action}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0`}>
                              {initials}
                            </div>
                            <p className="text-[#7B93A8] text-xs truncate">
                              {actor?.full_name ?? 'Clinician'}
                              {patient?.full_name && (
                                <>
                                  {' · '}
                                  <span className={`font-semibold ${TYPE_COLOR[entry.resource_type] ?? 'text-[#7B93A8]'}`}>
                                    {patient.full_name}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-[#4A6578] text-xs flex-shrink-0">{timeAgo(entry.at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top clinicians sidebar */}
        <div className="space-y-4">
          <div className="bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl p-5">
            <h2 className="text-[#E8F0F6] font-bold text-sm mb-4">Most active clinicians</h2>
            {topClinicians.length === 0 ? (
              <p className="text-[#7B93A8] text-xs">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {topClinicians.map(([id, c], i) => {
                  const gradients = [
                    'from-[#4FC3B7] to-[#2A8F86]',
                    'from-[#3B82F6] to-[#1D4ED8]',
                    'from-[#8B5CF6] to-[#6D28D9]',
                  ];
                  const initials = c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradients[i]} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#E8F0F6] text-xs font-semibold truncate">{c.name}</p>
                        <p className="text-[#4A6578] text-xs">{c.count} accesses</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl p-5">
            <h2 className="text-[#E8F0F6] font-bold text-sm mb-3">By resource type</h2>
            {Object.keys(TYPE_DOT).map((type) => {
              const count = entries.filter((e: any) => e.resource_type === type).length;
              if (count === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${TYPE_DOT[type]}`} />
                    <span className="text-[#7B93A8] text-xs capitalize">{type}</span>
                  </div>
                  <span className="text-[#E8F0F6] text-xs font-semibold">{count}</span>
                </div>
              );
            })}
            {entries.length === 0 && <p className="text-[#4A6578] text-xs">No data.</p>}
          </div>

          <p className="text-[#4A6578] text-xs text-center px-2">
            This log is append-only and tamper-evident. Patients can see their own slice.
          </p>
        </div>
      </div>
    </div>
  );
}
