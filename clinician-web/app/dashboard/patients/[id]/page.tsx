import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase-server';
import { logAccess } from '../../../../lib/audit';

function EventTypeBadge({ type }: { type: string }) {
  if (type === 'seizure')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(239,68,68,0.10)] text-[#EF4444] border border-[#EF4444]/20">
        Seizure
      </span>
    );
  if (type === 'missed_dose')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(244,184,96,0.10)] text-[#F4B860] border border-[#F4B860]/20">
        Missed dose
      </span>
    );
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0F2040] text-[#7AAAC8] border border-[#1A3265]">
      {type}
    </span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const c: Record<string, string> = { mild: '#00BFA6', moderate: '#F4B860', severe: '#EF4444' };
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: c[severity] ?? '#3D5C80' }}
    />
  );
}

const TABS = [
  { label: 'Overview', href: '' },
  { label: 'Schedules', href: 'schedules' },
  { label: 'Alert Rules', href: 'alert-rules' },
  { label: 'Adherence', href: 'adherence' },
  { label: 'Follow-ups', href: 'follow-ups' },
] as const;

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify clinician link
  const { data: link } = await supabase
    .from('clinician_links')
    .select('id, verified_at')
    .eq('clinician_id', user!.id)
    .eq('patient_id', params.id)
    .not('verified_at', 'is', null)
    .single();

  if (!link) notFound();

  // Audit log
  await logAccess(supabase, params.id, 'viewed_patient', 'profiles', params.id);

  // Fetch all patient data in parallel
  const [profileRes, eventsRes, medsRes, followupsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').eq('id', params.id).single(),
    supabase.from('events').select('*').eq('patient_id', params.id).order('occurred_at', { ascending: false }).limit(20),
    supabase.from('medications').select('*').eq('patient_id', params.id).eq('active', true),
    supabase
      .from('followups')
      .select('*')
      .eq('patient_id', params.id)
      .eq('clinician_id', user!.id)
      .neq('status', 'completed')
      .order('due_at', { ascending: true }),
  ]);

  const profile = profileRes.data;
  const events = eventsRes.data ?? [];
  const medications = medsRes.data ?? [];
  const followups = followupsRes.data ?? [];

  if (!profile) notFound();

  const initials = (profile.full_name ?? 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const seizures = events.filter((e: any) => e.event_type === 'seizure').length;
  const missedDoses = events.filter((e: any) => e.event_type === 'missed_dose').length;

  const kpis = [
    {
      label: 'Events',
      value: events.length,
      color: events.length > 0 ? 'text-[#EF4444]' : 'text-[#EAF4FF]',
      bg: events.length > 0 ? 'bg-[rgba(239,68,68,0.10)]' : 'bg-[#0F2040]',
    },
    { label: 'Medications', value: medications.length, color: 'text-[#00BFA6]', bg: 'bg-[rgba(0,191,166,0.10)]' },
    {
      label: 'Follow-ups',
      value: followups.length,
      color: followups.length > 0 ? 'text-[#F4B860]' : 'text-[#EAF4FF]',
      bg: followups.length > 0 ? 'bg-[rgba(244,184,96,0.10)]' : 'bg-[#0F2040]',
    },
    {
      label: 'Seizures',
      value: seizures,
      color: seizures > 0 ? 'text-[#EF4444]' : 'text-[#3D5C80]',
      bg: 'bg-[#0F2040]',
    },
  ];

  const baseHref = `/dashboard/patients/${params.id}`;

  return (
    <div className="p-8">
      {/* Back + header */}
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/dashboard/patients"
          className="text-[#7AAAC8] hover:text-[#EAF4FF] text-sm transition-colors mt-1 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-[#00BFA6]/15 border border-[#00BFA6]/30 flex items-center justify-center text-[#00BFA6] font-bold text-lg flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#EAF4FF]">{profile.full_name}</h1>
            <p className="text-[#7AAAC8] text-sm">{profile.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="bg-[rgba(0,191,166,0.10)] text-[#00BFA6] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#00BFA6]/20">
              Active Patient
            </span>
            <button className="border border-[#1A3265] text-[#7AAAC8] text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0F2040] transition-colors">
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* KPI mini row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className={`${k.bg} border border-[#1A3265] rounded-xl p-4`}>
            <p className={`text-2xl font-black ${k.color} mb-1`}>{k.value}</p>
            <p className="text-[#7AAAC8] text-xs font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tab row */}
      <nav aria-label="Patient sections" className="flex items-center gap-1 border-b border-[#1A3265] mb-8 overflow-x-auto">
        {TABS.map((tab) => {
          const href = tab.href ? `${baseHref}/${tab.href}` : baseHref;
          return (
            <Link
              key={tab.label}
              href={href}
              className="px-4 py-3 text-sm font-medium text-[#7AAAC8] hover:text-[#EAF4FF] transition-colors border-b-2 border-transparent hover:border-[#243D6E] whitespace-nowrap"
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Pre-visit brief */}
      <div className="bg-[#0D1B35] border border-[#00BFA6]/25 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-[rgba(0,191,166,0.10)] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#00BFA6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-[#EAF4FF]">Pre-visit brief</h2>
          <span className="text-[#3D5C80] text-xs ml-1">Auto-generated from patient data</span>
        </div>
        {events.length === 0 && medications.length === 0 ? (
          <p className="text-[#7AAAC8] text-sm">
            No patient data synced yet. Brief will populate as the patient uses the app.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {seizures > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#EF4444] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#EAF4FF]">
                  {seizures} seizure{seizures > 1 ? 's' : ''} logged
                </span>
              </li>
            )}
            {missedDoses > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#F4B860] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#EAF4FF]">
                  {missedDoses} missed dose{missedDoses > 1 ? 's' : ''}
                </span>
              </li>
            )}
            {medications.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#00BFA6] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#EAF4FF]">
                  {medications.length} active medication{medications.length > 1 ? 's' : ''} on record
                </span>
              </li>
            )}
            {followups.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#7AAAC8] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#EAF4FF]">
                  {followups.length} open follow-up{followups.length > 1 ? 's' : ''}
                </span>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Events + Medications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Events */}
        <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-6">
          <h2 className="text-base font-bold text-[#EAF4FF] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Event history
          </h2>
          {events.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[#7AAAC8] text-sm">No events recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {events.map((event: any) => (
                <div key={event.id} className="flex items-start gap-3 py-3 border-b border-[#1A3265] last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <EventTypeBadge type={event.event_type} />
                      {event.severity && (
                        <div className="flex items-center gap-1">
                          <SeverityDot severity={event.severity} />
                          <span className="text-[#7AAAC8] text-xs">{event.severity}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[#3D5C80] text-xs">
                      {new Date(event.occurred_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {event.details && Object.keys(event.details).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-x-3">
                        {Object.entries(event.details).map(([k, v]) => (
                          <span key={k} className="text-[#7AAAC8] text-xs">
                            {k.replace(/_/g, ' ')}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-6">
          <h2 className="text-base font-bold text-[#EAF4FF] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#00BFA6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Medications
          </h2>
          {medications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[#7AAAC8] text-sm">No medications on record.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medications.map((med: any) => {
                const schedule =
                  typeof med.schedule === 'string' ? JSON.parse(med.schedule) : med.schedule;
                return (
                  <div key={med.id} className="bg-[#0F2040] border border-[#1A3265] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#EAF4FF] font-bold text-sm">{med.name}</p>
                      <span className="text-[#7AAAC8] text-xs bg-[#0D1B35] px-2.5 py-1 rounded-lg">
                        {med.dose}
                      </span>
                    </div>
                    <p className="text-[#3D5C80] text-xs">{schedule?.time ?? '—'} · daily</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Follow-ups */}
      <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#EAF4FF] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#F4B860]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Follow-ups
          </h2>
          <Link href="/dashboard/follow-ups" className="text-[#00BFA6] text-sm hover:underline font-medium">
            View all
          </Link>
        </div>
        {followups.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[#7AAAC8] text-sm">No open follow-ups for this patient.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {followups.map((fu: any) => {
              const daysUntil = Math.ceil(
                (new Date(fu.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const dateColor =
                daysUntil < 0
                  ? 'text-[#EF4444]'
                  : daysUntil === 0
                  ? 'text-[#F4B860]'
                  : 'text-[#3D5C80]';
              return (
                <div
                  key={fu.id}
                  className="flex items-center justify-between py-3 border-b border-[#1A3265] last:border-0"
                >
                  <div>
                    <p className="text-[#EAF4FF] font-medium text-sm">{fu.title}</p>
                    <p className={`text-xs mt-0.5 ${dateColor}`}>
                      Due{' '}
                      {new Date(fu.due_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {daysUntil < 0 && ' · Overdue'}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      fu.status === 'in_progress'
                        ? 'bg-[rgba(0,191,166,0.10)] text-[#00BFA6]'
                        : 'bg-[rgba(244,184,96,0.10)] text-[#F4B860]'
                    }`}
                  >
                    {fu.status === 'in_progress' ? 'In progress' : 'Open'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
