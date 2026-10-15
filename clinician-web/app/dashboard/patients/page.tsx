'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';

function StatusPill({ eventsThisWeek, openFollowups }: { eventsThisWeek: number; openFollowups: number }) {
  if (eventsThisWeek > 0)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(239,68,68,0.10)] text-[#EF4444]">Review</span>;
  if (openFollowups > 0)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(244,184,96,0.10)] text-[#F4B860]">Follow-up</span>;
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(0,191,166,0.10)] text-[#00BFA6]">Stable</span>;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: links } = await supabase
        .from('clinician_links')
        .select('patient_id, profiles!clinician_links_patient_id_fkey(id, full_name, email)')
        .eq('clinician_id', user.id)
        .not('verified_at', 'is', null);

      const patientIds = (links ?? []).map((l: any) => l.patient_id);

      const { data: events } = patientIds.length
        ? await supabase.from('events').select('patient_id, severity').in('patient_id', patientIds).gte('occurred_at', weekAgo)
        : { data: [] };

      const { data: missedDoses } = patientIds.length
        ? await supabase.from('medication_logs').select('patient_id').in('patient_id', patientIds).gte('taken_at', weekAgo)
        : { data: [] };

      const { data: followups } = patientIds.length
        ? await supabase.from('followups').select('patient_id').in('patient_id', patientIds).eq('status', 'open').eq('clinician_id', user.id)
        : { data: [] };

      const eventsByPatient: Record<string, number> = {};
      (events ?? []).forEach((e: any) => {
        eventsByPatient[e.patient_id] = (eventsByPatient[e.patient_id] ?? 0) + 1;
      });

      const followupsByPatient: Record<string, number> = {};
      (followups ?? []).forEach((f: any) => {
        followupsByPatient[f.patient_id] = (followupsByPatient[f.patient_id] ?? 0) + 1;
      });

      const result = (links ?? []).map((l: any) => ({
        id: l.patient_id,
        full_name: l.profiles?.full_name ?? 'Unknown',
        initials: (l.profiles?.full_name ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        events_this_week: eventsByPatient[l.patient_id] ?? 0,
        open_followups: followupsByPatient[l.patient_id] ?? 0,
      }));

      setPatients(result);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#EAF4FF]">Patients</h1>
          {!loading && (
            <span className="bg-[rgba(0,191,166,0.10)] text-[#00BFA6] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#00BFA6]/20">
              {filtered.length}
            </span>
          )}
        </div>
        <button className="border border-[#00BFA6] text-[#00BFA6] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#00BFA6]/10 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add patient
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5C80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search patients by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0D1B35] border border-[#1A3265] rounded-xl pl-11 pr-4 py-3 text-[#EAF4FF] placeholder:text-[#3D5C80] focus:border-[#00BFA6] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 text-sm transition-colors"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#7AAAC8] text-sm">Loading patients…</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#0D1B35] border border-[#1A3265] rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-[#0F2040] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#3D5C80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-[#7AAAC8] font-medium">{search ? 'No patients match that search.' : 'No patients linked yet.'}</p>
          <p className="text-[#3D5C80] text-xs mt-1">Patients can link you from the Duara mobile app.</p>
        </div>
      ) : (
        <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_120px_100px_80px] px-6 py-3.5 border-b border-[#1A3265] text-[#3D5C80] text-xs font-semibold uppercase tracking-widest">
            <span>Name</span>
            <span>Events / Week</span>
            <span>Follow-ups</span>
            <span>Status</span>
            <span />
          </div>

          {/* Table rows */}
          {filtered.map((patient, i) => (
            <div
              key={patient.id}
              className={`grid grid-cols-[1fr_120px_120px_100px_80px] px-6 py-4 items-center border-b border-[#1A3265] last:border-0 hover:bg-[#0F2040] transition-colors ${i % 2 === 1 ? 'bg-[#0A1628]' : ''}`}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#00BFA6]/15 border border-[#00BFA6]/30 flex items-center justify-center text-[#00BFA6] font-bold text-sm flex-shrink-0">
                  {patient.initials}
                </div>
                <p className="text-[#EAF4FF] font-semibold text-sm">{patient.full_name}</p>
              </div>

              {/* Events */}
              <div>
                <span className={`text-sm font-bold ${patient.events_this_week > 0 ? 'text-[#EF4444]' : 'text-[#3D5C80]'}`}>
                  {patient.events_this_week}
                </span>
              </div>

              {/* Follow-ups */}
              <div>
                <span className={`text-sm font-bold ${patient.open_followups > 0 ? 'text-[#F4B860]' : 'text-[#3D5C80]'}`}>
                  {patient.open_followups}
                </span>
              </div>

              {/* Status */}
              <StatusPill eventsThisWeek={patient.events_this_week} openFollowups={patient.open_followups} />

              {/* View */}
              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="text-[#00BFA6] border border-[#1A3265] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#00BFA6]/10 transition-colors min-h-[36px] flex items-center justify-center"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
