'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../../lib/supabase-browser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Status = 'open' | 'in_progress' | 'completed';

interface Followup {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  due_at: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function DueDateLabel({ dateStr }: { dateStr: string }) {
  const d = daysUntil(dateStr);
  if (d < 0) return <span className="text-xs font-semibold text-[#C8102E]">Overdue by {Math.abs(d)}d</span>;
  if (d === 0) return <span className="text-xs font-semibold text-[#F1C76B]">Due today</span>;
  if (d <= 3)  return <span className="text-xs font-semibold text-[#F1C76B]">Due in {d}d</span>;
  return <span className="text-xs font-semibold text-[#3A5255]">Due in {d}d</span>;
}

function StatusPill({ status }: { status: Status }) {
  const map = {
    open:        { bg: 'bg-[rgba(241,199,107,0.10)]', text: 'text-[#F1C76B]',  label: 'Open' },
    in_progress: { bg: 'bg-[rgba(31,122,114,0.10)]', text: 'text-[#1F7A72]',  label: 'In Progress' },
    completed:   { bg: 'bg-[rgba(31,122,114,0.10)]', text: 'text-[#1F7A72]',  label: 'Completed' },
  };
  const s = map[status] ?? map.open;
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
}

// ---------------------------------------------------------------------------
// Add follow-up form (inline)
// ---------------------------------------------------------------------------

function AddFollowupForm({
  patientId,
  onCreated,
  onCancel,
}: {
  patientId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    setSubmitting(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error: insertError } = await supabase.from('followups').insert({
        clinician_id: user.id,
        patient_id: patientId,
        title: title.trim(),
        description: description.trim() || null,
        due_at: new Date(dueDate).toISOString(),
        status: 'open',
      });
      if (insertError) throw insertError;
      onCreated();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create follow-up');
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full bg-[#F5EFE3] border border-[#D6CFC4] rounded-xl px-4 py-2.5 text-[#0C1F20] placeholder:text-[#6B8588] focus:border-[#1F7A72] focus:outline-none focus:ring-2 focus:ring-[#1F7A72]/20 text-sm transition-colors';

  return (
    <form onSubmit={handleSubmit} className="bg-[#FFFFFF] border border-[#1F7A72]/25 rounded-2xl p-6 mb-5">
      <h3 className="text-[#0C1F20] font-bold text-sm mb-5">New follow-up</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-1.5">Title</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Review seizure diary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-1.5">Notes (optional)</label>
          <textarea
            className={inputClass + ' resize-none'}
            placeholder="Any additional context…"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-1.5">Due date</label>
          <input
            type="date"
            className={inputClass}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="text-[#C8102E] text-xs">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !dueDate}
            className="bg-[#1F7A72] text-[#F5EFE3] font-bold rounded-xl px-6 py-2.5 text-sm hover:bg-[#12383A] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Add follow-up'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-[#D6CFC4] text-[#3A5255] font-medium rounded-xl px-5 py-2.5 text-sm hover:bg-[#EDE8DF] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PatientFollowupsPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('followups')
      .select('id, title, description, status, due_at, created_at')
      .eq('patient_id', id)
      .order('due_at', { ascending: true });
    setFollowups((data ?? []) as Followup[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: Status) {
    setActionLoading(id);
    await supabase.from('followups').update({ status }).eq('id', id);
    setActionLoading(null);
    load();
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const open      = followups.filter((f) => f.status === 'open');
  const inProgress = followups.filter((f) => f.status === 'in_progress');
  const completed = followups.filter((f) => f.status === 'completed');

  return (
    <div className="p-8">
      {/* Back */}
      <div className="mb-5">
        <Link
          href={`/dashboard/patients/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#3A5255] hover:text-[#0C1F20] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to patient
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0C1F20]">Follow-ups</h1>
          <p className="text-[#3A5255] text-sm mt-1">Tasks and check-ins assigned to this patient.</p>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#1F7A72] text-[#F5EFE3] font-bold rounded-xl px-4 py-2.5 text-sm hover:bg-[#12383A] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add follow-up
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <AddFollowupForm
          patientId={id}
          onCreated={() => { setShowAdd(false); load(); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[#1F7A72] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[#3A5255] text-sm">Loading follow-ups…</p>
        </div>
      ) : followups.length === 0 ? (
        <div className="py-16 text-center">
          <svg className="w-10 h-10 text-[#D6CFC4] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-[#3A5255] text-sm font-medium">No follow-ups yet.</p>
          <p className="text-[#6B8588] text-xs mt-1">Add one to track tasks for this patient.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...open, ...inProgress, ...completed].map((fu) => (
            <div
              key={fu.id}
              className={`bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl px-6 py-4 flex items-start gap-4 hover:bg-[#EDE8DF] transition-colors ${fu.status === 'completed' ? 'opacity-60' : ''}`}
            >
              {/* Status indicator dot */}
              <div className="mt-1 flex-shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  fu.status === 'completed' ? 'bg-[#1F7A72]' :
                  fu.status === 'in_progress' ? 'bg-[#1F7A72]' :
                  daysUntil(fu.due_at) < 0 ? 'bg-[#C8102E]' : 'bg-[#F1C76B]'
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className={`text-sm font-semibold ${fu.status === 'completed' ? 'text-[#6B8588] line-through' : 'text-[#0C1F20]'}`}>
                    {fu.title}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusPill status={fu.status} />
                    <DueDateLabel dateStr={fu.due_at} />
                  </div>
                </div>
                {fu.description && (
                  <p className="text-[#3A5255] text-xs mt-1 line-clamp-2">{fu.description}</p>
                )}
                <p className="text-[#6B8588] text-xs mt-1">Created {fmtDate(fu.created_at)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {fu.status === 'open' && (
                  <button
                    onClick={() => updateStatus(fu.id, 'in_progress')}
                    disabled={actionLoading === fu.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(31,122,114,0.12)] text-[#1F7A72] border border-[#1F7A72]/20 hover:bg-[rgba(31,122,114,0.22)] transition-colors disabled:opacity-50"
                  >
                    {actionLoading === fu.id ? '…' : 'Start'}
                  </button>
                )}
                {fu.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatus(fu.id, 'completed')}
                    disabled={actionLoading === fu.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(0,217,126,0.12)] text-[#1F7A72] border border-[#1F7A72]/20 hover:bg-[rgba(0,217,126,0.22)] transition-colors disabled:opacity-50"
                  >
                    {actionLoading === fu.id ? '…' : 'Complete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
