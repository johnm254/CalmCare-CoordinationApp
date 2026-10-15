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

function StatCard({
  label,
  value,
  icon,
  iconBg,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black text-[#EAF4FF] mb-0.5">{value}</p>
      <p className="text-[#7AAAC8] text-sm">{label}</p>
      {sub && <p className="text-[#3D5C80] text-xs mt-1">{sub}</p>}
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
      <div className="relative w-full max-w-md bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[#EAF4FF] font-bold text-lg">Invite Clinician</h2>
            <p className="text-[#7AAAC8] text-sm mt-0.5">They will receive a magic link to set their password.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#0F2040] flex items-center justify-center text-[#7AAAC8] hover:text-[#EAF4FF] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-1.5">Full Name</label>
            <input type="text" placeholder="Dr. Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-[#070D1A] border border-[#1A3265] rounded-xl px-4 py-3 text-[#EAF4FF] placeholder:text-[#3D5C80] focus:border-[#00BFA6] focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-1.5">Email Address</label>
            <input type="email" placeholder="doctor@hospital.org" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-[#070D1A] border border-[#1A3265] rounded-xl px-4 py-3 text-[#EAF4FF] placeholder:text-[#3D5C80] focus:border-[#00BFA6] focus:outline-none text-sm" />
          </div>
          {status && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${status.type === 'success' ? 'bg-[rgba(0,191,166,0.10)] border border-[#00BFA6]/30 text-[#00BFA6]' : 'bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/30 text-[#EF4444]'}`}>
              {status.msg}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#1A3265] text-[#7AAAC8] text-sm font-semibold hover:bg-[#0F2040] transition-colors">Cancel</button>
            <button type="submit" disabled={sending} className="flex-1 py-3 rounded-xl bg-[#00BFA6] text-[#070D1A] text-sm font-bold hover:bg-[#00A896] transition-colors disabled:opacity-50">
              {sending ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCliniciansPage() {
  const [clinicians, setClinicians] = useState<ClinicianRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [totalPatients, setTotalPatients] = useState(0);
  const [sosTotalThisWeek, setSosTotalThisWeek] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clinicians');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setClinicians(json.clinicians ?? []);
      setTotalPatients(json.totalPatients ?? 0);
      setSosTotalThisWeek(json.sosThisWeek ?? 0);
    } catch {
      setClinicians([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = clinicians.filter((c) => {
    const q = search.toLowerCase();
    return (c.full_name ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q);
  });

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  function handleDeactivate(id: string, name: string | null) {
    // Log the action — in production this would call an API
    console.log('Deactivate clinician', id, name);
    alert(`Deactivate action logged for: ${name ?? id}. Connect to /api/admin/deactivate to implement.`);
  }

  return (
    <div className="p-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0D1B35] to-[#122245] border border-[#1A3265] rounded-2xl p-6 mb-6">
        <p className="text-[#3D5C80] text-sm mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-[#EAF4FF]">Welcome back, Admin</h1>
        <p className="text-[#7AAAC8] text-sm mt-1">Here is what is happening with your platform today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Clinicians"
          value={loading ? '—' : clinicians.length}
          iconBg="bg-[rgba(0,191,166,0.12)] text-[#00BFA6]"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Patients"
          value={loading ? '—' : totalPatients}
          iconBg="bg-[rgba(244,184,96,0.12)] text-[#F4B860]"
          sub="Across all clinicians"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          label="SOS Events (7 days)"
          value={loading ? '—' : sosTotalThisWeek}
          iconBg="bg-[rgba(239,68,68,0.12)] text-[#EF4444]"
          sub="Platform-wide"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Table card */}
      <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A3265]">
          <div>
            <h2 className="text-[#EAF4FF] font-bold text-base">Registered Clinicians</h2>
            <p className="text-[#7AAAC8] text-xs mt-0.5">{loading ? 'Loading…' : `${clinicians.length} total`}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5C80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search clinicians…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#070D1A] border border-[#1A3265] rounded-full text-sm text-[#EAF4FF] placeholder:text-[#3D5C80] focus:outline-none focus:border-[#00BFA6]/50 w-52"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#00BFA6] text-[#070D1A] font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#00A896] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Invite Clinician
            </button>
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_90px_90px_90px_100px] px-6 py-3 bg-[#070D1A] border-b border-[#1A3265]">
          {['Clinician', 'Email', 'Patients', 'Verified', 'Joined', ''].map((h) => (
            <span key={h} className="text-[#3D5C80] text-xs font-semibold uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#00BFA6] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#7AAAC8] text-sm">Loading clinicians…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[#7AAAC8] text-sm font-medium">{search ? 'No clinicians match your search.' : 'No clinicians registered yet.'}</p>
          </div>
        ) : (
          filtered.map((c, i) => {
            const initials = (c.full_name ?? 'C').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            const colors = ['text-[#00BFA6] bg-[rgba(0,191,166,0.12)]', 'text-[#7AAAC8] bg-[rgba(122,170,200,0.12)]', 'text-[#F4B860] bg-[rgba(244,184,96,0.12)]'];
            const colorClass = colors[i % colors.length];
            const isSuspended = c.role === 'suspended';
            return (
              <div
                key={c.id}
                className={`grid grid-cols-[1fr_1fr_90px_90px_90px_100px] px-6 py-4 border-b border-[#1A3265] last:border-0 items-center hover:bg-[#0F2040] transition-colors ${isSuspended ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${colorClass}`}>
                    {initials}
                  </div>
                  <p className="text-[#EAF4FF] text-sm font-semibold truncate">{c.full_name ?? '—'}</p>
                </div>
                <p className="text-[#7AAAC8] text-xs truncate">{c.email ?? '—'}</p>
                <p className="text-[#EAF4FF] text-sm font-semibold">{c.patient_count ?? 0}</p>
                <div>
                  {c.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00BFA6] bg-[rgba(0,191,166,0.10)] border border-[#00BFA6]/20 rounded-full px-2.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00BFA6]" />Yes
                    </span>
                  ) : (
                    <span className="text-xs text-[#3D5C80]">No</span>
                  )}
                </div>
                <p className="text-[#3D5C80] text-xs">
                  {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/clinicians/${c.id}`}
                    className="text-[#00BFA6] border border-[#1A3265] rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#00BFA6]/10 transition-colors"
                  >
                    Patients
                  </Link>
                  {!isSuspended && (
                    <button
                      onClick={() => handleDeactivate(c.id, c.full_name)}
                      className="text-[#EF4444] border border-[#EF4444]/20 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-[#EF4444]/10 transition-colors"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && <InviteModal onClose={() => setShowModal(false)} onSuccess={fetchData} />}
    </div>
  );
}
