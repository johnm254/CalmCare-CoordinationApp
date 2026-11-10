'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';

// Urgency score — higher = shown first
// 4: critical open alert   3: warning open alert
// 2: events this week      1: open follow-up       0: stable
function urgencyScore(p: PatientRow): number {
  if (p.critical_alerts > 0) return 4;
  if (p.warning_alerts > 0) return 3;
  if (p.events_this_week > 0) return 2;
  if (p.open_followups > 0) return 1;
  return 0;
}

type PatientRow = {
  id: string;
  full_name: string;
  email: string;
  initials: string;
  events_this_week: number;
  open_followups: number;
  critical_alerts: number;
  warning_alerts: number;
};

function UrgencyPill({ patient }: { patient: PatientRow }) {
  const score = urgencyScore(patient);
  if (score === 4)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(244,63,94,0.15)] text-[#C8102E] border border-[#C8102E]/20">Critical</span>;
  if (score === 3)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(241,199,107,0.15)] text-[#F1C76B] border border-[#F1C76B]/20">Warning</span>;
  if (score === 2)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(200,16,46,0.08)] text-[#C8102E]">Review</span>;
  if (score === 1)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(241,199,107,0.10)] text-[#F1C76B]">Follow-up</span>;
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(31,122,114,0.10)] text-[#1F7A72]">Stable</span>;
}

function LinkInstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-7 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[#0C1F20] font-bold text-lg">Link a patient</h2>
            <p className="text-[#3A5255] text-sm mt-1">Patients initiate the link from the epimoyo app.</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#EDE8DF] flex items-center justify-center text-[#3A5255] hover:text-[#0C1F20] transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          {[
            { step: '1', text: 'Ask your patient to open the epimoyo app and go to Care Circle.' },
            { step: '2', text: 'They tap "Add clinician" and enter your registered email address.' },
            { step: '3', text: 'You will receive a notification. Accept the link in your dashboard under Patients.' },
            { step: '4', text: 'Once both parties confirm, the patient will appear in your patient list.' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-[#1F7A72]/15 border border-[#1F7A72]/30 flex items-center justify-center text-[#1F7A72] font-bold text-xs flex-shrink-0 mt-0.5">
                {item.step}
              </div>
              <p className="text-[#3A5255] text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-[#EDE8DF] border border-[#D6CFC4] rounded-xl px-4 py-3">
          <p className="text-[#6B8588] text-xs">
            Patient consent is required before any data is shared. Links are revocable by the patient at any time.
          </p>
        </div>
        <button onClick={onClose}
          className="mt-5 w-full bg-[#1F7A72] text-[#F5EFE3] font-bold py-2.5 rounded-xl text-sm hover:bg-[#12383A] transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);

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

      const [eventsRes, followupsRes, alertsRes] = await Promise.all([
        patientIds.length
          ? supabase.from('events').select('patient_id, severity').in('patient_id', patientIds).gte('occurred_at', weekAgo)
          : Promise.resolve({ data: [] }),

        patientIds.length
          ? supabase.from('followups').select('patient_id').in('patient_id', patientIds).eq('status', 'open').eq('clinician_id', user.id)
          : Promise.resolve({ data: [] }),

        // Open alerts — not resolved/cancelled/false_alarm
        patientIds.length
          ? supabase.from('alerts').select('patient_id, severity')
              .in('patient_id', patientIds)
              .not('state', 'in', '("resolved","cancelled","false_alarm")')
          : Promise.resolve({ data: [] }),
      ]);

      // Aggregate
      const eventsByPatient: Record<string, number> = {};
      (eventsRes.data ?? []).forEach((e: any) => {
        eventsByPatient[e.patient_id] = (eventsByPatient[e.patient_id] ?? 0) + 1;
      });

      const followupsByPatient: Record<string, number> = {};
      (followupsRes.data ?? []).forEach((f: any) => {
        followupsByPatient[f.patient_id] = (followupsByPatient[f.patient_id] ?? 0) + 1;
      });

      const criticalAlertsByPatient: Record<string, number> = {};
      const warningAlertsByPatient: Record<string, number> = {};
      (alertsRes.data ?? []).forEach((a: any) => {
        if (a.severity === 'critical') {
          criticalAlertsByPatient[a.patient_id] = (criticalAlertsByPatient[a.patient_id] ?? 0) + 1;
        } else if (a.severity === 'warning') {
          warningAlertsByPatient[a.patient_id] = (warningAlertsByPatient[a.patient_id] ?? 0) + 1;
        }
      });

      const result: PatientRow[] = (links ?? []).map((l: any) => ({
        id: l.patient_id,
        full_name: l.profiles?.full_name ?? 'Unknown',
        email: l.profiles?.email ?? '',
        initials: (l.profiles?.full_name ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        events_this_week: eventsByPatient[l.patient_id] ?? 0,
        open_followups: followupsByPatient[l.patient_id] ?? 0,
        critical_alerts: criticalAlertsByPatient[l.patient_id] ?? 0,
        warning_alerts: warningAlertsByPatient[l.patient_id] ?? 0,
      }));

      // Sort by urgency score descending
      result.sort((a, b) => urgencyScore(b) - urgencyScore(a));

      setPatients(result);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const criticalCount = patients.filter((p) => urgencyScore(p) >= 3).length;

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0C1F20]">Patients</h1>
          {!loading && (
            <span className="bg-[rgba(31,122,114,0.10)] text-[#1F7A72] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#1F7A72]/20">
              {filtered.length}
            </span>
          )}
          {!loading && criticalCount > 0 && (
            <span className="bg-[rgba(244,63,94,0.12)] text-[#C8102E] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#C8102E]/20">
              {criticalCount} need attention
            </span>
          )}
        </div>
        <button
          onClick={() => setShowLinkModal(true)}
          className="border border-[#1F7A72] text-[#1F7A72] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#1F7A72]/10 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add patient link
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8588]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search patients by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#FFFFFF] border border-[#D6CFC4] rounded-xl pl-11 pr-4 py-3 text-[#0C1F20] placeholder:text-[#6B8588] focus:border-[#1F7A72] focus:outline-none focus:ring-2 focus:ring-[#1F7A72]/20 text-sm transition-colors"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#3A5255] text-sm">Loading patients…</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-[#EDE8DF] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#6B8588]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-[#3A5255] font-medium">{search ? 'No patients match that search.' : 'No patients linked yet.'}</p>
          <p className="text-[#6B8588] text-xs mt-1">Patients can link you from the epimoyo app.</p>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_100px_130px_80px] px-6 py-3.5 border-b border-[#D6CFC4] text-[#6B8588] text-xs font-semibold uppercase tracking-widest">
            <span>Name</span>
            <span>Email</span>
            <span>Events / Week</span>
            <span>Status</span>
            <span />
          </div>

          {filtered.map((patient, i) => (
            <div
              key={patient.id}
              className={`grid grid-cols-[1fr_160px_100px_130px_80px] px-6 py-4 items-center border-b border-[#D6CFC4] last:border-0 hover:bg-[#EDE8DF] transition-colors ${i % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-[#FFFFFF]'}`}
            >
              {/* Avatar + name + alert dot */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-[#1F7A72]/15 border border-[#1F7A72]/30 flex items-center justify-center text-[#1F7A72] font-bold text-sm flex-shrink-0">
                    {patient.initials}
                  </div>
                  {urgencyScore(patient) >= 3 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#C8102E] border-2 border-[#FFFFFF]" />
                  )}
                </div>
                <p className="text-[#0C1F20] font-semibold text-sm">{patient.full_name}</p>
              </div>

              {/* Email */}
              <p className="text-[#3A5255] text-xs truncate">{patient.email || '—'}</p>

              {/* Events */}
              <div>
                <span className={`text-sm font-bold ${patient.events_this_week > 0 ? 'text-[#C8102E]' : 'text-[#6B8588]'}`}>
                  {patient.events_this_week}
                </span>
              </div>

              {/* Urgency pill */}
              <UrgencyPill patient={patient} />

              {/* View */}
              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="text-[#1F7A72] border border-[#D6CFC4] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#1F7A72]/10 transition-colors min-h-[36px] flex items-center justify-center"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      )}

      {showLinkModal && <LinkInstructionsModal onClose={() => setShowLinkModal(false)} />}
    </div>
  );
}
