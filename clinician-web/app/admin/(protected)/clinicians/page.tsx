'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type ClinicianRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  role: string;
  patient_count: number;
  verified: boolean;
};

type VerificationRow = {
  id: string;
  clinician_id: string;
  licence_number: string;
  cadre: string;
  registering_body: string;
  status: 'pending' | 'verified' | 'rejected';
  method: string;
  evidence_path: string | null;
  notes: string | null;
  created_at: string;
  verified_at: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

function StatCard({ label, value, icon, iconBg, sub, badge }: {
  label: string; value: number | string; icon: React.ReactNode;
  iconBg: string; sub?: string; badge?: number;
}) {
  return (
    <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5 relative">
      {badge != null && badge > 0 && (
        <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#F4B860] text-[#09090F] text-xs font-black flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p className="text-3xl font-black text-[#F5F0FF] mb-0.5">{value}</p>
      <p className="text-[#9B96C0] text-sm">{label}</p>
      {sub && <p className="text-[#504C78] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: name }),
    });
    const json = await res.json();
    if (res.ok) {
      setStatus({ type: 'success', msg: `Invite sent to ${email}` });
      onSuccess();
      setTimeout(onClose, 1800);
    } else {
      setStatus({ type: 'error', msg: json.error ?? 'Failed to send invite' });
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[#F5F0FF] font-bold text-lg">Invite Clinician</h2>
            <p className="text-[#9B96C0] text-sm mt-0.5">They will receive a magic link to set their password.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1C1A35] flex items-center justify-center text-[#9B96C0] hover:text-[#F5F0FF] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-1.5">Full Name</label>
            <input type="text" placeholder="Dr. Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-3 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-1.5">Email Address</label>
            <input type="email" placeholder="doctor@hospital.org" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-3 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none text-sm" />
          </div>
          {status && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${status.type === 'success' ? 'bg-[rgba(139,92,246,0.10)] border border-[#8B5CF6]/30 text-[#8B5CF6]' : 'bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/30 text-[#EF4444]'}`}>
              {status.msg}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#2E2B50] text-[#9B96C0] text-sm font-semibold hover:bg-[#1C1A35] transition-colors">Cancel</button>
            <button type="submit" disabled={sending} className="flex-1 py-3 rounded-xl bg-[#8B5CF6] text-[#09090F] text-sm font-bold hover:bg-[#00A896] transition-colors disabled:opacity-50">
              {sending ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RejectModal({ verification, onClose, onDone }: {
  verification: VerificationRow; onClose: () => void; onDone: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    setLoading(true);
    await fetch('/api/admin/verifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: verification.id, action: 'reject', notes }),
    });
    setLoading(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6 shadow-2xl">
        <h2 className="text-[#F5F0FF] font-bold text-lg mb-1">Reject verification</h2>
        <p className="text-[#9B96C0] text-sm mb-5">
          Rejecting <strong className="text-[#F5F0FF]">{verification.profiles?.full_name ?? 'this clinician'}</strong> — they will be told their application was not approved.
        </p>
        <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-1.5">Reason (optional)</label>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Licence number not found in KMPDC register"
          rows={3}
          className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-3 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#EF4444]/50 focus:outline-none text-sm resize-none mb-5"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#2E2B50] text-[#9B96C0] text-sm font-semibold hover:bg-[#1C1A35] transition-colors">Cancel</button>
          <button onClick={handleReject} disabled={loading} className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white text-sm font-bold hover:bg-red-500 transition-colors disabled:opacity-50">
            {loading ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

const CADRE_LABELS: Record<string, string> = {
  doctor: 'Doctor', clinical_officer: 'Clinical Officer', nurse: 'Nurse', other: 'Other',
};

const BODY_LABELS: Record<string, string> = {
  KMPDC: 'KMPDC', COC: 'COC', NCK: 'NCK', other: 'Other',
};

export default function AdminCliniciansPage() {
  const [tab, setTab] = useState<'clinicians' | 'verifications'>('clinicians');
  const [clinicians, setClinicians] = useState<ClinicianRow[]>([]);
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<VerificationRow | null>(null);
  const [search, setSearch] = useState('');
  const [totalPatients, setTotalPatients] = useState(0);
  const [sosTotalThisWeek, setSosTotalThisWeek] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clinRes, verRes] = await Promise.all([
        fetch('/api/admin/clinicians'),
        fetch('/api/admin/verifications'),
      ]);
      const clinJson = clinRes.ok ? await clinRes.json() : {};
      const verJson = verRes.ok ? await verRes.json() : {};
      setClinicians(clinJson.clinicians ?? []);
      setTotalPatients(clinJson.totalPatients ?? 0);
      setSosTotalThisWeek(clinJson.sosThisWeek ?? 0);
      setPendingCount(clinJson.pendingVerifications ?? 0);
      setVerifications(verJson.verifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleApprove(v: VerificationRow) {
    setActionLoading(v.id);
    await fetch('/api/admin/verifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: v.id, action: 'approve' }),
    });
    setActionLoading(null);
    fetchData();
  }

  const filteredClinicians = clinicians.filter((c) => {
    const q = search.toLowerCase();
    return (c.full_name ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q);
  });

  const filteredVerifications = verifications.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.profiles?.full_name ?? '').toLowerCase().includes(q) ||
      (v.profiles?.email ?? '').toLowerCase().includes(q) ||
      v.licence_number.toLowerCase().includes(q)
    );
  });

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="p-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#14122A] to-[#22203D] border border-[#2E2B50] rounded-2xl p-6 mb-6">
        <p className="text-[#504C78] text-sm mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-[#F5F0FF]">Welcome back, Admin</h1>
        <p className="text-[#9B96C0] text-sm mt-1">Here is what is happening with your platform today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Clinicians" value={loading ? '—' : clinicians.length}
          iconBg="bg-[rgba(139,92,246,0.12)] text-[#8B5CF6]"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard label="Total Patients" value={loading ? '—' : totalPatients}
          iconBg="bg-[rgba(244,184,96,0.12)] text-[#F4B860]" sub="Across all clinicians"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard label="SOS Events (7 days)" value={loading ? '—' : sosTotalThisWeek}
          iconBg="bg-[rgba(239,68,68,0.12)] text-[#EF4444]" sub="Platform-wide"
          badge={pendingCount}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 bg-[#09090F] border border-[#2E2B50] rounded-xl p-1 w-fit">
        {(['clinicians', 'verifications'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-[#14122A] text-[#F5F0FF]' : 'text-[#504C78] hover:text-[#9B96C0]'}`}
          >
            {t === 'clinicians' ? 'Clinicians' : 'Verifications'}
            {t === 'verifications' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F4B860] text-[#09090F] text-xs font-black">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + action row */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#504C78]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder={tab === 'clinicians' ? 'Search clinicians…' : 'Search by name, email or licence…'}
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#09090F] border border-[#2E2B50] rounded-full text-sm text-[#F5F0FF] placeholder:text-[#504C78] focus:outline-none focus:border-[#8B5CF6]/50 w-full"
          />
        </div>
        {tab === 'clinicians' && (
          <button onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-[#8B5CF6] text-[#09090F] font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#00A896] transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Invite Clinician
          </button>
        )}
      </div>

      {/* ── CLINICIANS TAB ── */}
      {tab === 'clinicians' && (
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_90px_90px_90px_100px] px-6 py-3 bg-[#09090F] border-b border-[#2E2B50]">
            {['Clinician', 'Email', 'Patients', 'Verified', 'Joined', ''].map((h) => (
              <span key={h} className="text-[#504C78] text-xs font-semibold uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[#9B96C0] text-sm">Loading clinicians…</p>
            </div>
          ) : filteredClinicians.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[#9B96C0] text-sm font-medium">{search ? 'No clinicians match your search.' : 'No clinicians registered yet.'}</p>
            </div>
          ) : filteredClinicians.map((c, i) => {
            const initials = (c.full_name ?? 'C').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            const colorClasses = ['text-[#8B5CF6] bg-[rgba(139,92,246,0.12)]', 'text-[#9B96C0] bg-[rgba(122,170,200,0.12)]', 'text-[#F4B860] bg-[rgba(244,184,96,0.12)]'];
            const colorClass = colorClasses[i % colorClasses.length];
            return (
              <div key={c.id}
                className={`grid grid-cols-[1fr_1fr_90px_90px_90px_100px] px-6 py-4 border-b border-[#2E2B50] last:border-0 items-center hover:bg-[#1C1A35] transition-colors ${c.role === 'suspended' ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${colorClass}`}>{initials}</div>
                  <p className="text-[#F5F0FF] text-sm font-semibold truncate">{c.full_name ?? '—'}</p>
                </div>
                <p className="text-[#9B96C0] text-xs truncate">{c.email ?? '—'}</p>
                <p className="text-[#F5F0FF] text-sm font-semibold">{c.patient_count}</p>
                <div>
                  {c.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5CF6] bg-[rgba(139,92,246,0.10)] border border-[#8B5CF6]/20 rounded-full px-2.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />Yes
                    </span>
                  ) : (
                    <span className="text-xs text-[#504C78]">No</span>
                  )}
                </div>
                <p className="text-[#504C78] text-xs">
                  {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/clinicians/${c.id}`}
                    className="text-[#8B5CF6] border border-[#2E2B50] rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#8B5CF6]/10 transition-colors"
                  >
                    Patients
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VERIFICATIONS TAB ── */}
      {tab === 'verifications' && (
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_100px_100px_140px] px-6 py-3 bg-[#09090F] border-b border-[#2E2B50]">
            {['Clinician', 'Licence', 'Cadre', 'Status', ''].map((h) => (
              <span key={h} className="text-[#504C78] text-xs font-semibold uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[#9B96C0] text-sm">Loading verifications…</p>
            </div>
          ) : filteredVerifications.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[#8B5CF6] text-2xl mb-3">✓</p>
              <p className="text-[#9B96C0] text-sm font-medium">{search ? 'No results match your search.' : 'No pending verifications.'}</p>
              <p className="text-[#504C78] text-xs mt-1">All clinician applications have been reviewed.</p>
            </div>
          ) : filteredVerifications.map((v) => {
            const initials = (v.profiles?.full_name ?? 'C').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const isPending = v.status === 'pending';
            const isVerified = v.status === 'verified';
            return (
              <div key={v.id}
                className="grid grid-cols-[1fr_120px_100px_100px_140px] px-6 py-4 border-b border-[#2E2B50] last:border-0 items-center hover:bg-[#1C1A35] transition-colors"
              >
                {/* Clinician */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[rgba(139,92,246,0.12)] text-[#8B5CF6] flex items-center justify-center font-bold text-xs flex-shrink-0">{initials}</div>
                  <div className="min-w-0">
                    <p className="text-[#F5F0FF] text-sm font-semibold truncate">{v.profiles?.full_name ?? '—'}</p>
                    <p className="text-[#504C78] text-xs truncate">{v.profiles?.email ?? '—'}</p>
                    <p className="text-[#504C78] text-xs mt-0.5">
                      {BODY_LABELS[v.registering_body] ?? v.registering_body} ·{' '}
                      {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Licence */}
                <p className="text-[#F5F0FF] text-xs font-mono">{v.licence_number}</p>

                {/* Cadre */}
                <p className="text-[#9B96C0] text-xs">{CADRE_LABELS[v.cadre] ?? v.cadre}</p>

                {/* Status */}
                <div>
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#F4B860] bg-[rgba(244,184,96,0.10)] border border-[#F4B860]/20 rounded-full px-2.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F4B860]" />Pending
                    </span>
                  )}
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5CF6] bg-[rgba(139,92,246,0.10)] border border-[#8B5CF6]/20 rounded-full px-2.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />Verified
                    </span>
                  )}
                  {v.status === 'rejected' && (
                    <span className="text-xs text-[#EF4444]">Rejected</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleApprove(v)}
                        disabled={actionLoading === v.id}
                        className="bg-[#8B5CF6] text-[#09090F] rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-[#00A896] transition-colors disabled:opacity-50"
                      >
                        {actionLoading === v.id ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setRejectTarget(v)}
                        className="text-[#EF4444] border border-[#EF4444]/20 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#EF4444]/10 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {v.evidence_path && (
                    <a href={v.evidence_path} target="_blank" rel="noopener noreferrer"
                      className="text-[#9B96C0] border border-[#2E2B50] rounded-lg px-2.5 py-1.5 text-xs hover:bg-[#1C1A35] transition-colors"
                    >
                      Evidence
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onSuccess={fetchData} />
      )}
      {rejectTarget && (
        <RejectModal
          verification={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => { setRejectTarget(null); fetchData(); }}
        />
      )}
    </div>
  );
}
