import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase-server';
import { logAccess } from '../../../../lib/audit';
import PreferredHospital from './PreferredHospital';
import PatientTabNav from './PatientTabNav';

function EventTypeBadge({ type }: { type: string }) {
  if (type === 'seizure')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(244,63,94,0.10)] text-[#F43F5E] border border-[#F43F5E]/20">
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
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F1F5FA] text-[#5B6B7F] border border-[#E6ECF2]">
      {type}
    </span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const c: Record<string, string> = { mild: '#14B8A6', moderate: '#F4B860', severe: '#F43F5E' };
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: c[severity] ?? '#8C9AAB' }}
    />
  );
}


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
  const [profileRes, eventsRes, medsRes, followupsRes, prefRes] = await Promise.all([
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
    supabase
      .from('clinician_patient_preferences')
      .select('preferred_hospital_name')
      .eq('clinician_id', user!.id)
      .eq('patient_id', params.id)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const events = eventsRes.data ?? [];
  const medications = medsRes.data ?? [];
  const followups = followupsRes.data ?? [];
  const preferredHospitalName: string | null = prefRes.data?.preferred_hospital_name ?? null;

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
      color: events.length > 0 ? 'text-[#F43F5E]' : 'text-[#0F1B2D]',
      bg: events.length > 0 ? 'bg-[rgba(244,63,94,0.10)]' : 'bg-[#F1F5FA]',
    },
    { label: 'Medications', value: medications.length, color: 'text-[#14B8A6]', bg: 'bg-[rgba(20,184,166,0.10)]' },
    {
      label: 'Follow-ups',
      value: followups.length,
      color: followups.length > 0 ? 'text-[#F4B860]' : 'text-[#0F1B2D]',
      bg: followups.length > 0 ? 'bg-[rgba(244,184,96,0.10)]' : 'bg-[#F1F5FA]',
    },
    {
      label: 'Seizures',
      value: seizures,
      color: seizures > 0 ? 'text-[#F43F5E]' : 'text-[#8C9AAB]',
      bg: 'bg-[#F1F5FA]',
    },
  ];

  const baseHref = `/dashboard/patients/${params.id}`;

  return (
    <div className="p-8">
      {/* Back + header */}
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/dashboard/patients"
          className="text-[#5B6B7F] hover:text-[#0F1B2D] text-sm transition-colors mt-1 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-[#14B8A6]/15 border border-[#14B8A6]/30 flex items-center justify-center text-[#14B8A6] font-bold text-lg flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F1B2D]">{profile.full_name}</h1>
            <p className="text-[#5B6B7F] text-sm">{profile.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="bg-[rgba(20,184,166,0.10)] text-[#14B8A6] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#14B8A6]/20">
              Active Patient
            </span>
          </div>
        </div>
      </div>

      {/* KPI mini row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className={`${k.bg} border border-[#E6ECF2] rounded-xl p-4`}>
            <p className={`text-2xl font-black ${k.color} mb-1`}>{k.value}</p>
            <p className="text-[#5B6B7F] text-xs font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tab row */}
      <PatientTabNav patientId={params.id} />

      {/* Pre-visit brief */}
      <div className="bg-[#FFFFFF] border border-[#14B8A6]/25 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-[rgba(20,184,166,0.10)] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-[#0F1B2D]">Pre-visit brief</h2>
          <span className="text-[#8C9AAB] text-xs ml-1">Auto-generated from patient data</span>
        </div>
        {events.length === 0 && medications.length === 0 ? (
          <p className="text-[#5B6B7F] text-sm">
            No patient data synced yet. Brief will populate as the patient uses the app.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {seizures > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#F43F5E] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#0F1B2D]">
                  {seizures} seizure{seizures > 1 ? 's' : ''} logged
                </span>
              </li>
            )}
            {missedDoses > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#F4B860] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#0F1B2D]">
                  {missedDoses} missed dose{missedDoses > 1 ? 's' : ''}
                </span>
              </li>
            )}
            {medications.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#14B8A6] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#0F1B2D]">
                  {medications.length} active medication{medications.length > 1 ? 's' : ''} on record
                </span>
              </li>
            )}
            {followups.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#5B6B7F] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#0F1B2D]">
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
        <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl p-6">
          <h2 className="text-base font-bold text-[#0F1B2D] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Event history
          </h2>
          {events.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[#5B6B7F] text-sm">No events recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {events.map((event: any) => (
                <div key={event.id} className="flex items-start gap-3 py-3 border-b border-[#E6ECF2] last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <EventTypeBadge type={event.event_type} />
                      {event.severity && (
                        <div className="flex items-center gap-1">
                          <SeverityDot severity={event.severity} />
                          <span className="text-[#5B6B7F] text-xs">{event.severity}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[#8C9AAB] text-xs">
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
                          <span key={k} className="text-[#5B6B7F] text-xs">
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
        <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl p-6">
          <h2 className="text-base font-bold text-[#0F1B2D] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Medications
          </h2>
          {medications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[#5B6B7F] text-sm">No medications on record.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medications.map((med: any) => {
                const schedule =
                  typeof med.schedule === 'string' ? JSON.parse(med.schedule) : med.schedule;
                return (
                  <div key={med.id} className="bg-[#F1F5FA] border border-[#E6ECF2] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#0F1B2D] font-bold text-sm">{med.name}</p>
                      <span className="text-[#5B6B7F] text-xs bg-[#FFFFFF] px-2.5 py-1 rounded-lg">
                        {med.dose}
                      </span>
                    </div>
                    <p className="text-[#8C9AAB] text-xs">{schedule?.time ?? '—'} · daily</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Follow-ups */}
      <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#0F1B2D] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#F4B860]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Follow-ups
          </h2>
          <Link href="/dashboard/follow-ups" className="text-[#14B8A6] text-sm hover:underline font-medium">
            View all
          </Link>
        </div>
        {followups.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[#5B6B7F] text-sm">No open follow-ups for this patient.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {followups.map((fu: any) => {
              const daysUntil = Math.ceil(
                (new Date(fu.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const dateColor =
                daysUntil < 0
                  ? 'text-[#F43F5E]'
                  : daysUntil === 0
                  ? 'text-[#F4B860]'
                  : 'text-[#8C9AAB]';
              return (
                <div
                  key={fu.id}
                  className="flex items-center justify-between py-3 border-b border-[#E6ECF2] last:border-0"
                >
                  <div>
                    <p className="text-[#0F1B2D] font-medium text-sm">{fu.title}</p>
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
                        ? 'bg-[rgba(20,184,166,0.10)] text-[#14B8A6]'
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

      {/* Bottom row: ECG link + Preferred Hospital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* ECG Recordings card */}
        <Link href={`${baseHref}/ecg`}>
          <div className="bg-[#FFFFFF] border border-[#E6ECF2] hover:border-[#14B8A6]/40 rounded-2xl p-5 transition-colors group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(0,217,126,0.10)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#22C87A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#0F1B2D] font-semibold text-sm">ECG Recordings</p>
                  <p className="text-[#5B6B7F] text-xs mt-0.5">View wrist ECG strips and mark reviewed</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#8C9AAB] group-hover:text-[#14B8A6] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Preferred Hospital */}
        <PreferredHospital
          clinicianId={user!.id}
          patientId={params.id}
          initialName={preferredHospitalName}
        />
      </div>
    </div>
  );
}
