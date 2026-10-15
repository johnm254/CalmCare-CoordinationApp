'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function DueDateLabel({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days < 0) return <span className="text-xs font-semibold text-[#EF4444]">Overdue by {Math.abs(days)}d</span>;
  if (days === 0) return <span className="text-xs font-semibold text-[#F4B860]">Due today</span>;
  if (days <= 3) return <span className="text-xs font-semibold text-[#F4B860]">Due in {days}d</span>;
  return <span className="text-xs font-semibold text-[#7AAAC8]">Due in {days}d</span>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    open:        { bg: 'bg-[rgba(244,184,96,0.10)]',  text: 'text-[#F4B860]',  label: 'Open' },
    in_progress: { bg: 'bg-[rgba(0,191,166,0.10)]',   text: 'text-[#00BFA6]',  label: 'In Progress' },
    completed:   { bg: 'bg-[rgba(34,200,122,0.10)]',  text: 'text-[#22C87A]',  label: 'Completed' },
  };
  const s = map[status] ?? map.open;
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
}

interface Patient {
  id: string;
  full_name: string;
}

interface CreateModalProps {
  patients: Patient[];
  onClose: () => void;
  onCreated: () => void;
}

function CreateFollowUpModal({ patients, onClose, onCreated }: CreateModalProps) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !title || !dueDate) return;
    setSubmitting(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error: insertError } = await supabase.from('followups').insert({
        clinician_id: user.id,
        patient_id: patientId,
        title,
        description: description || null,
        due_at: new Date(dueDate).toISOString(),
        status: 'open',
      });
      if (insertError) throw insertError;
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create follow-up.');
      setSubmitting(false);
    }
  }

  const inputClass = "w-full bg-[#070D1A] border border-[#1A3265] rounded-xl px-4 py-3 text-[#EAF4FF] placeholder:text-[#3D5C80] focus:border-[#00BFA6] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 text-sm transition-colors";
  const labelClass = "block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[#EAF4FF] font-bold text-lg">Create follow-up</h2>
            <p className="text-[#7AAAC8] text-sm mt-0.5">Schedule a task for a linked patient.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0F2040] flex items-center justify-center text-[#7AAAC8] hover:text-[#EAF4FF] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className={inputClass + ' appearance-none'}
            >
              {patients.length === 0
                ? <option value="">No linked patients</option>
                : patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))
              }
            </select>
          </div>

          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              placeholder="e.g. Review seizure diary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description <span className="normal-case font-normal text-[#3D5C80]">(optional)</span></label>
            <textarea
              placeholder="Add notes or instructions…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>

          <div>
            <label className={labelClass}>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/30 rounded-xl px-4 py-3">
              <p className="text-[#EF4444] text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#1A3265] text-[#7AAAC8] text-sm font-semibold hover:bg-[#0F2040] hover:text-[#EAF4FF] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !patientId}
              className="flex-1 py-3 rounded-xl bg-[#00BFA6] text-[#070D1A] text-sm font-bold hover:bg-[#00A896] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FILTERS = ['All', 'Open', 'In Progress', 'Completed', 'Overdue'] as const;
type Filter = typeof FILTERS[number];

export default function FollowUpsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('Open');
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load all follow-ups (all statuses for filter tabs)
    const { data } = await supabase
      .from('followups')
      .select('*, profiles!followups_patient_id_fkey(id, full_name)')
      .eq('clinician_id', user.id)
      .order('due_at', { ascending: true });

    setItems(data ?? []);

    // Load linked patients for the create modal
    const { data: links } = await supabase
      .from('clinician_links')
      .select('patient_id, profiles!clinician_links_patient_id_fkey(id, full_name)')
      .eq('clinician_id', user.id)
      .not('verified_at', 'is', null);

    setPatients(
      (links ?? []).map((l: any) => ({
        id: l.patient_id,
        full_name: l.profiles?.full_name ?? 'Unknown',
      }))
    );

    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markComplete(id: string) {
    const supabase = createClient();
    await supabase
      .from('followups')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id);
    setItems((prev) => prev.map((f) => f.id === id ? { ...f, status: 'completed', completed_at: new Date().toISOString() } : f));
  }

  const filtered = items.filter((fu) => {
    if (filter === 'All') return true;
    if (filter === 'Open') return fu.status === 'open';
    if (filter === 'In Progress') return fu.status === 'in_progress';
    if (filter === 'Completed') return fu.status === 'completed';
    if (filter === 'Overdue') return fu.status !== 'completed' && daysUntil(fu.due_at) < 0;
    return true;
  });

  const openCount = items.filter((f) => f.status === 'open').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#EAF4FF]">Follow-ups</h1>
          {openCount > 0 && (
            <span className="bg-[rgba(244,184,96,0.10)] text-[#F4B860] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#F4B860]/20">
              {openCount} open
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#00BFA6] text-[#070D1A] text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#00A896] transition-colors flex items-center gap-2 min-h-[40px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create follow-up
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all border ${
              filter === f
                ? 'bg-[#00BFA6] text-[#070D1A] border-[#00BFA6]'
                : 'bg-transparent text-[#7AAAC8] border-[#1A3265] hover:border-[#00BFA6]/50 hover:text-[#EAF4FF]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#7AAAC8] text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#0D1B35] border border-[#1A3265] rounded-2xl">
          <div className="text-3xl mb-3">📅</div>
          <p className="text-[#EAF4FF] font-semibold">All caught up</p>
          <p className="text-[#7AAAC8] text-sm mt-1">No follow-ups match this filter right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fu) => {
            const days = daysUntil(fu.due_at);
            const isOverdue = fu.status !== 'completed' && days < 0;
            return (
              <div
                key={fu.id}
                className={`bg-[#0D1B35] border rounded-xl p-4 transition-colors hover:bg-[#0F2040] ${
                  isOverdue ? 'border-[#EF4444]/25' : 'border-[#1A3265]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs mb-1 ${isOverdue ? 'text-[#EF4444]' : 'text-[#7AAAC8]'}`}>
                      <Link href={`/dashboard/patients/${fu.patient_id}`} className="hover:text-[#00BFA6] transition-colors">
                        {fu.profiles?.full_name ?? '—'}
                      </Link>
                    </p>
                    <p className={`font-semibold text-sm leading-snug mb-2 ${isOverdue ? 'text-[#EF4444]' : 'text-[#EAF4FF]'}`}>{fu.title}</p>
                    {fu.description && (
                      <p className="text-[#3D5C80] text-xs mb-2 line-clamp-2">{fu.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[#3D5C80] text-xs">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(fu.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {fu.status !== 'completed' && <DueDateLabel dateStr={fu.due_at} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusPill status={fu.status} />
                    {fu.status !== 'completed' && (
                      <button
                        onClick={() => markComplete(fu.id)}
                        className="text-[#00BFA6] border border-[#1A3265] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#00BFA6]/10 transition-colors min-h-[36px] flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Mark complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateFollowUpModal
          patients={patients}
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
