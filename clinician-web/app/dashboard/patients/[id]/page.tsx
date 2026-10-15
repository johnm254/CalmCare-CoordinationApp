import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase-server';

function EventTypeBadge({ type }: { type: string }) {
  if (type === 'seizure')
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#3A1A18] text-[#FF7A6B] border border-[#FF7A6B]/30">Seizure</span>;
  if (type === 'missed_dose')
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#3A2A10] text-[#F4B860] border border-[#F4B860]/30">Missed dose</span>;
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1A3144] text-[#A8BDCA] border border-[#1E3A52]">{type}</span>;
}

function SeverityDot({ severity }: { severity: string }) {
  const c: Record<string, string> = { mild: '#4FC3B7', moderate: '#F4B860', severe: '#FF7A6B' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, backgroundColor: c[severity] ?? '#4F6D84' }} />;
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

  // Fetch all patient data in parallel
  const [profileRes, eventsRes, medsRes, followupsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').eq('id', params.id).single(),
    supabase.from('events').select('*').eq('patient_id', params.id).order('occurred_at', { ascending: false }).limit(20),
    supabase.from('medications').select('*').eq('patient_id', params.id).eq('active', true),
    supabase.from('followups').select('*').eq('patient_id', params.id).eq('clinician_id', user!.id).neq('status', 'completed').order('due_at', { ascending: true }),
  ]);

  const profile = profileRes.data;
  const events = eventsRes.data ?? [];
  const medications = medsRes.data ?? [];
  const followups = followupsRes.data ?? [];

  if (!profile) notFound();

  const initials = (profile.full_name ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const seizures = events.filter((e) => e.event_type === 'seizure').length;
  const missedDoses = events.filter((e) => e.event_type === 'missed_dose').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/patients" className="text-[#A8BDCA] hover:text-[#EAF2F6] text-sm transition-colors">← Back</Link>
        <div className="w-12 h-12 rounded-full bg-[#1A3A3A] flex items-center justify-center text-[#4FC3B7] font-bold text-lg">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#EAF2F6]">{profile.full_name}</h1>
          <p className="text-[#A8BDCA] text-sm">{profile.email}</p>
        </div>
      </div>

      {/* Pre-visit brief */}
      <div className="bg-[#112230] border border-[#4FC3B7]/30 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#EAF2F6]">Pre-visit brief</h2>
            <p className="text-[#4F6D84] text-xs mt-1">Auto-generated from patient data</p>
          </div>
        </div>
        {events.length === 0 && medications.length === 0 ? (
          <p className="text-[#A8BDCA] text-sm">No patient data synced yet. Brief will populate as the patient uses the app.</p>
        ) : (
          <ul className="space-y-2 text-sm text-[#EAF2F6]">
            {seizures > 0 && <li className="flex items-start gap-2"><span className="text-[#FF7A6B] mt-0.5">•</span><span>{seizures} seizure{seizures > 1 ? 's' : ''} logged</span></li>}
            {missedDoses > 0 && <li className="flex items-start gap-2"><span className="text-[#F4B860] mt-0.5">•</span><span>{missedDoses} missed dose{missedDoses > 1 ? 's' : ''}</span></li>}
            {medications.length > 0 && <li className="flex items-start gap-2"><span className="text-[#4FC3B7] mt-0.5">•</span><span>{medications.length} active medication{medications.length > 1 ? 's' : ''} on record</span></li>}
            {followups.length > 0 && <li className="flex items-start gap-2"><span className="text-[#A8BDCA] mt-0.5">•</span><span>{followups.length} open follow-up{followups.length > 1 ? 's' : ''}</span></li>}
          </ul>
        )}
      </div>

      {/* Events + Medications */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[#112230] border border-[#1E3A52] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[#EAF2F6] mb-4">Event history</h2>
          {events.length === 0 ? (
            <p className="text-[#A8BDCA] text-sm">No events recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event: any) => (
                <div key={event.id} className="flex items-start gap-3 py-3 border-b border-[#1E3A52] last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <EventTypeBadge type={event.event_type} />
                      {event.severity && <><SeverityDot severity={event.severity} /><span className="text-[#A8BDCA] text-xs">{event.severity}</span></>}
                    </div>
                    <p className="text-[#4F6D84] text-xs">
                      {new Date(event.occurred_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {event.details && Object.keys(event.details).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-x-3">
                        {Object.entries(event.details).map(([k, v]) => (
                          <span key={k} className="text-[#A8BDCA] text-xs">{k.replace(/_/g, ' ')}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#112230] border border-[#1E3A52] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[#EAF2F6] mb-4">Medications</h2>
          {medications.length === 0 ? (
            <p className="text-[#A8BDCA] text-sm">No medications on record.</p>
          ) : (
            <div className="space-y-4">
              {medications.map((med: any) => {
                const schedule = typeof med.schedule === 'string' ? JSON.parse(med.schedule) : med.schedule;
                return (
                  <div key={med.id} className="bg-[#1A3144] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#EAF2F6] font-bold">{med.name}</p>
                      <span className="text-[#A8BDCA] text-xs">{med.dose}</span>
                    </div>
                    <p className="text-[#4F6D84] text-xs">{schedule?.time ?? '—'} · daily</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Follow-ups */}
      <div className="bg-[#112230] border border-[#1E3A52] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#EAF2F6]">Follow-ups</h2>
          <Link href="/dashboard/follow-ups" className="text-[#4FC3B7] text-sm hover:underline">View all</Link>
        </div>
        {followups.length === 0 ? (
          <p className="text-[#A8BDCA] text-sm">No open follow-ups for this patient.</p>
        ) : (
          <div className="space-y-3">
            {followups.map((fu: any) => (
              <div key={fu.id} className="flex items-center justify-between py-3 border-b border-[#1E3A52] last:border-0">
                <div>
                  <p className="text-[#EAF2F6] font-medium text-sm">{fu.title}</p>
                  <p className="text-[#4F6D84] text-xs mt-1">
                    Due {new Date(fu.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
