import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase-server';
import { logAccess } from '../../../../lib/audit';
import PreferredHospital from './PreferredHospital';
import PatientTabNav from './PatientTabNav';
import SeizureChart from '../../SeizureChart';
import ClinicalNotes from '../../../../components/ClinicalNotes';

function EventTypeBadge({ type }: { type: string }) {
  if (type === 'seizure')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(200,16,46,0.08)] text-[#C8102E] border border-[#C8102E]/20">
        Seizure
      </span>
    );
  if (type === 'missed_dose')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(241,199,107,0.10)] text-[#F1C76B] border border-[#F1C76B]/20">
        Missed dose
      </span>
    );
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EDE8DF] text-[#3A5255] border border-[#D6CFC4]">
      {type}
    </span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const c: Record<string, string> = { mild: '#1F7A72', moderate: '#F1C76B', severe: '#C8102E' };
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: c[severity] ?? '#6B8588' }}
    />
  );
}


export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify clinician link
  const { data: link } = await supabase
    .from('clinician_links')
    .select('id, verified_at')
    .eq('clinician_id', user!.id)
    .eq('patient_id', id)
    .not('verified_at', 'is', null)
    .single();

  if (!link) notFound();

  // Audit log
  await logAccess(supabase, id, 'viewed_patient', 'profiles', id);

  // Fetch all patient data in parallel
  const [profileRes, eventsRes, medsRes, followupsRes, prefRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').eq('id', id).single(),
    supabase.from('events').select('*').eq('patient_id', id).gte('occurred_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).order('occurred_at', { ascending: false }).limit(100),
    supabase.from('medications').select('*').eq('patient_id', id).eq('active', true),
    supabase
      .from('followups')
      .select('*')
      .eq('patient_id', id)
      .eq('clinician_id', user!.id)
      .neq('status', 'completed')
      .order('due_at', { ascending: true }),
    supabase
      .from('clinician_patient_preferences')
      .select('preferred_hospital_name')
      .eq('clinician_id', user!.id)
      .eq('patient_id', id)
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
      color: events.length > 0 ? 'text-[#C8102E]' : 'text-[#0C1F20]',
      bg: events.length > 0 ? 'bg-[rgba(200,16,46,0.08)]' : 'bg-[#EDE8DF]',
    },
    { label: 'Medications', value: medications.length, color: 'text-[#1F7A72]', bg: 'bg-[rgba(31,122,114,0.10)]' },
    {
      label: 'Follow-ups',
      value: followups.length,
      color: followups.length > 0 ? 'text-[#F1C76B]' : 'text-[#0C1F20]',
      bg: followups.length > 0 ? 'bg-[rgba(241,199,107,0.10)]' : 'bg-[#EDE8DF]',
    },
    {
      label: 'Seizures',
      value: seizures,
      color: seizures > 0 ? 'text-[#C8102E]' : 'text-[#6B8588]',
      bg: 'bg-[#EDE8DF]',
    },
  ];

  const thirtyDayChartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().slice(0, 10);
    const label = i % 5 === 0 ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
    const count = events.filter((e: any) => (e.occurred_at ?? '').startsWith(dayStr)).length;
    return { day: label || '·', count };
  });
  const hasChartData = thirtyDayChartData.some((d) => d.count > 0);

  const baseHref = `/dashboard/patients/${id}`;

  return (
    <div className="p-8">
      {/* Back + header */}
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/dashboard/patients"
          className="text-[#3A5255] hover:text-[#0C1F20] text-sm transition-colors mt-1 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-[#1F7A72]/15 border border-[#1F7A72]/30 flex items-center justify-center text-[#1F7A72] font-bold text-lg flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0C1F20]">{profile.full_name}</h1>
            <p className="text-[#3A5255] text-sm">{profile.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="bg-[rgba(31,122,114,0.10)] text-[#1F7A72] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#1F7A72]/20">
              Active Patient
            </span>
          </div>
        </div>
      </div>

      {/* KPI mini row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className={`${k.bg} border border-[#D6CFC4] rounded-xl p-4`}>
            <p className={`text-2xl font-black ${k.color} mb-1`}>{k.value}</p>
            <p className="text-[#3A5255] text-xs font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tab row */}
      <PatientTabNav patientId={id} />

      {hasChartData && (
        <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold text-[#0C1F20] mb-1">Events — last 30 days</h2>
          <p className="text-xs text-[#6B8588] mb-4">{events.length} event{events.length !== 1 ? 's' : ''} recorded</p>
          <SeizureChart data={thirtyDayChartData} />
        </div>
      )}

      {/* Pre-visit brief */}
      <div className="bg-[#FFFFFF] border border-[#1F7A72]/25 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-[rgba(31,122,114,0.10)] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#1F7A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-[#0C1F20]">Pre-visit brief</h2>
          <span className="text-[#6B8588] text-xs ml-1">Auto-generated from patient data</span>
        </div>
        {events.length === 0 && medications.length === 0 ? (
          <p className="text-[#3A5255] text-sm">
            No patient data synced yet. Brief will populate as the patient uses the app.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {seizures > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#C8102E] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#0C1F20]">
                  {seizures} seizure{seizures > 1 ? 's' : ''} logged
                </span>
              </li>
            )}
            {missedDoses > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#F1C76B] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#0C1F20]">
                  {missedDoses} missed dose{missedDoses > 1 ? 's' : ''}
                </span>
              </li>
            )}
            {medications.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#1F7A72] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#0C1F20]">
                  {medications.length} active medication{medications.length > 1 ? 's' : ''} on record
                </span>
              </li>
            )}
            {followups.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#3A5255] mt-0.5 flex-shrink-0">•</span>
                <span className="text-[#0C1F20]">
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
        <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
          <h2 className="text-base font-bold text-[#0C1F20] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#C8102E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Event history
          </h2>
          {events.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[#3A5255] text-sm">No events recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {events.map((event: any) => (
                <div key={event.id} className="flex items-start gap-3 py-3 border-b border-[#D6CFC4] last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <EventTypeBadge type={event.event_type} />
                      {event.severity && (
                        <div className="flex items-center gap-1">
                          <SeverityDot severity={event.severity} />
                          <span className="text-[#3A5255] text-xs">{event.severity}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[#6B8588] text-xs">
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
                          <span key={k} className="text-[#3A5255] text-xs">
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
        <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
          <h2 className="text-base font-bold text-[#0C1F20] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#1F7A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Medications
          </h2>
          {medications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[#3A5255] text-sm">No medications on record.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medications.map((med: any) => {
                const schedule =
                  typeof med.schedule === 'string' ? JSON.parse(med.schedule) : med.schedule;
                return (
                  <div key={med.id} className="bg-[#EDE8DF] border border-[#D6CFC4] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#0C1F20] font-bold text-sm">{med.name}</p>
                      <span className="text-[#3A5255] text-xs bg-[#FFFFFF] px-2.5 py-1 rounded-lg">
                        {med.dose}
                      </span>
                    </div>
                    <p className="text-[#6B8588] text-xs">{schedule?.time ?? '—'} · daily</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Follow-ups */}
      <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#0C1F20] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#F1C76B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Follow-ups
          </h2>
          <Link href="/dashboard/follow-ups" className="text-[#1F7A72] text-sm hover:underline font-medium">
            View all
          </Link>
        </div>
        {followups.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[#3A5255] text-sm">No open follow-ups for this patient.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {followups.map((fu: any) => {
              const daysUntil = Math.ceil(
                (new Date(fu.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const dateColor =
                daysUntil < 0
                  ? 'text-[#C8102E]'
                  : daysUntil === 0
                  ? 'text-[#F1C76B]'
                  : 'text-[#6B8588]';
              return (
                <div
                  key={fu.id}
                  className="flex items-center justify-between py-3 border-b border-[#D6CFC4] last:border-0"
                >
                  <div>
                    <p className="text-[#0C1F20] font-medium text-sm">{fu.title}</p>
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
                        ? 'bg-[rgba(31,122,114,0.10)] text-[#1F7A72]'
                        : 'bg-[rgba(241,199,107,0.10)] text-[#F1C76B]'
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

      <div className="mt-6">
        <ClinicalNotes clinicianId={user!.id} patientId={id} />
      </div>

      {/* Bottom row: ECG link + Preferred Hospital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* ECG Recordings card */}
        <Link href={`${baseHref}/ecg`}>
          <div className="bg-[#FFFFFF] border border-[#D6CFC4] hover:border-[#1F7A72]/40 rounded-2xl p-5 transition-colors group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(31,122,114,0.10)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#1F7A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#0C1F20] font-semibold text-sm">ECG Recordings</p>
                  <p className="text-[#3A5255] text-xs mt-0.5">View wrist ECG strips and mark reviewed</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#6B8588] group-hover:text-[#1F7A72] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Preferred Hospital */}
        <PreferredHospital
          clinicianId={user!.id}
          patientId={id}
          initialName={preferredHospitalName}
        />
      </div>
    </div>
  );
}
