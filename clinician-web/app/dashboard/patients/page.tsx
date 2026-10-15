'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#EAF2F6]">Patients</h1>
        <span className="text-[#A8BDCA] text-sm">{filtered.length} patients</span>
      </div>

      <input
        type="text"
        placeholder="Search patients…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-[#1A3144] border border-[#4F6D84] rounded-xl px-4 py-2.5 text-[#EAF2F6] placeholder:text-[#4F6D84] focus:border-[#4FC3B7] focus:outline-none focus:ring-1 focus:ring-[#4FC3B7]/30 text-sm mb-6"
      />

      {loading ? (
        <div className="py-20 text-center text-[#A8BDCA]">Loading patients…</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[#A8BDCA]">{search ? 'No patients match that search.' : 'No patients linked yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((patient) => (
            <div key={patient.id} className="bg-[#112230] border border-[#1E3A52] rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1A3A3A] flex items-center justify-center text-[#4FC3B7] font-bold flex-shrink-0">
                  {patient.initials}
                </div>
                <p className="text-[#EAF2F6] font-bold mt-2">{patient.full_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#1A3144] rounded-xl p-3">
                  <p className={`font-bold text-lg ${patient.events_this_week > 0 ? 'text-[#FF7A6B]' : 'text-[#EAF2F6]'}`}>{patient.events_this_week}</p>
                  <p className="text-[#4F6D84] text-xs">events this week</p>
                </div>
                <div className="bg-[#1A3144] rounded-xl p-3">
                  <p className={`font-bold text-lg ${patient.open_followups > 0 ? 'text-[#F4B860]' : 'text-[#EAF2F6]'}`}>{patient.open_followups}</p>
                  <p className="text-[#4F6D84] text-xs">open follow-ups</p>
                </div>
              </div>

              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="block w-full text-center border border-[#4FC3B7] text-[#4FC3B7] rounded-xl py-2 text-sm font-semibold hover:bg-[#1A3A3A] transition-colors min-h-[40px] flex items-center justify-center"
              >
                View patient
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
