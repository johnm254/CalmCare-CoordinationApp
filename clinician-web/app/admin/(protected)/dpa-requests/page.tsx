'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../lib/supabase-browser';

type DpaRequest = {
  id: string;
  patient_id: string;
  request_type: 'export' | 'delete' | 'correct';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  notes: string | null;
  patient_name: string | null;
};

type Tab = 'all' | 'pending' | 'processing' | 'completed';

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-[#F4B860] bg-[rgba(244,184,96,0.10)] border-[#F4B860]/20',
  processing: 'text-[#8B5CF6] bg-[rgba(139,92,246,0.10)] border-[#8B5CF6]/20',
  completed: 'text-[#22C87A] bg-[rgba(34,200,122,0.10)] border-[#22C87A]/20',
  rejected: 'text-[#EF4444] bg-[rgba(239,68,68,0.10)] border-[#EF4444]/20',
};

const TYPE_LABELS: Record<string, string> = {
  export: 'Export data',
  delete: 'Delete data',
  correct: 'Correct data',
};

const TYPE_STYLES: Record<string, string> = {
  export: 'text-[#9B96C0] bg-[rgba(155,150,192,0.10)] border-[#9B96C0]/20',
  delete: 'text-[#EF4444] bg-[rgba(239,68,68,0.10)] border-[#EF4444]/20',
  correct: 'text-[#F4B860] bg-[rgba(244,184,96,0.10)] border-[#F4B860]/20',
};

function RejectModal({
  requestId,
  onClose,
  onDone,
}: {
  requestId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const supabase = createClient();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    setLoading(true);
    await supabase
      .from('dpa_requests')
      .update({ status: 'rejected', notes })
      .eq('id', requestId);
    setLoading(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6 shadow-2xl">
        <h2 className="text-[#F5F0FF] font-bold text-lg mb-1">Reject DPA request</h2>
        <p className="text-[#9B96C0] text-sm mb-5">
          Provide a reason — this will be stored in the notes field.
        </p>
        <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-1.5">
          Reason (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Request is outside the scope of KDPA 2019…"
          rows={3}
          className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-3 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#EF4444]/50 focus:outline-none text-sm resize-none mb-5"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#2E2B50] text-[#9B96C0] text-sm font-semibold hover:bg-[#1C1A35] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white text-sm font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DpaRequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<DpaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('dpa_requests')
      .select('id, patient_id, request_type, status, created_at, notes, profiles(full_name)')
      .order('created_at', { ascending: false });

    const mapped: DpaRequest[] = (data ?? []).map((r: any) => ({
      id: r.id,
      patient_id: r.patient_id,
      request_type: r.request_type,
      status: r.status,
      created_at: r.created_at,
      notes: r.notes,
      patient_name: r.profiles?.full_name ?? null,
    }));

    setRequests(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function updateStatus(id: string, status: 'processing' | 'completed') {
    setActionLoading(id);
    await supabase.from('dpa_requests').update({ status }).eq('id', id);
    setActionLoading(null);
    fetchRequests();
  }

  function maskPatientId(id: string) {
    const short = id.replace(/-/g, '').slice(-4).toUpperCase();
    return `Patient #${short}`;
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const filtered = requests.filter((r) => tab === 'all' || r.status === tab);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    processing: requests.filter((r) => r.status === 'processing').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F0FF]">Data Protection Requests</h1>
        <p className="text-[#9B96C0] text-sm mt-1 max-w-2xl">
          Requests from patients to export, correct or delete their data under the{' '}
          <span className="text-[#F5F0FF]">Kenya Data Protection Act 2019</span>. Respond within
          21 days of receipt.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-[#09090F] border border-[#2E2B50] rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-[#14122A] text-[#F5F0FF]' : 'text-[#504C78] hover:text-[#9B96C0]'
            }`}
          >
            {t.label}
            {counts[t.key] > 0 && tab !== t.key && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#2E2B50] text-[#9B96C0] text-xs font-black">
                {counts[t.key] > 9 ? '9+' : counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_130px_120px_100px_120px_160px] px-6 py-3 bg-[#09090F] border-b border-[#2E2B50]">
          {['Patient', 'Type', 'Status', 'Submitted', 'Notes', ''].map((h) => (
            <span key={h} className="text-[#504C78] text-xs font-semibold uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#9B96C0] text-sm">Loading requests…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="w-10 h-10 text-[#2E2B50] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[#9B96C0] text-sm font-medium">No pending data protection requests.</p>
            <p className="text-[#504C78] text-xs mt-1">All caught up.</p>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_130px_120px_100px_120px_160px] px-6 py-4 border-b border-[#2E2B50] last:border-0 items-center hover:bg-[#1C1A35] transition-colors"
            >
              {/* Patient */}
              <div>
                <p className="text-[#F5F0FF] text-sm font-semibold">
                  {r.patient_name ?? maskPatientId(r.patient_id)}
                </p>
                {r.patient_name && (
                  <p className="text-[#504C78] text-xs font-mono">{maskPatientId(r.patient_id)}</p>
                )}
              </div>

              {/* Type */}
              <span
                className={`inline-flex items-center text-xs font-semibold border rounded-full px-2.5 py-0.5 w-fit ${TYPE_STYLES[r.request_type] ?? ''}`}
              >
                {TYPE_LABELS[r.request_type] ?? r.request_type}
              </span>

              {/* Status */}
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-0.5 w-fit ${STATUS_STYLES[r.status] ?? ''}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </span>

              {/* Date */}
              <p className="text-[#9B96C0] text-xs">{fmtDate(r.created_at)}</p>

              {/* Notes */}
              <p className="text-[#504C78] text-xs truncate">{r.notes ?? '—'}</p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {r.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(r.id, 'processing')}
                    disabled={actionLoading === r.id}
                    className="bg-[#8B5CF6] text-[#09090F] rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-[#00A896] transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {actionLoading === r.id ? '…' : 'Start processing'}
                  </button>
                )}
                {r.status === 'processing' && (
                  <button
                    onClick={() => updateStatus(r.id, 'completed')}
                    disabled={actionLoading === r.id}
                    className="bg-[#22C87A] text-[#09090F] rounded-lg px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                  >
                    {actionLoading === r.id ? '…' : 'Mark complete'}
                  </button>
                )}
                {(r.status === 'pending' || r.status === 'processing') && (
                  <button
                    onClick={() => setRejectId(r.id)}
                    className="text-[#EF4444] border border-[#EF4444]/20 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#EF4444]/10 transition-colors"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {rejectId && (
        <RejectModal
          requestId={rejectId}
          onClose={() => setRejectId(null)}
          onDone={() => { setRejectId(null); fetchRequests(); }}
        />
      )}
    </div>
  );
}
