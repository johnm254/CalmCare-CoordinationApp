'use client';

import { useState, useEffect, useCallback } from 'react';

type Clinician = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
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
    <div className="bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black text-[#E8F0F6] mb-0.5">{value}</p>
      <p className="text-[#7B93A8] text-sm">{label}</p>
      {sub && <p className="text-[#4A6578] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function InviteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
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
      <div className="relative w-full max-w-md bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[#E8F0F6] font-bold text-lg">Invite Clinician</h2>
            <p className="text-[#7B93A8] text-sm mt-0.5">They will receive a magic link to set their password.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1A2F4A] flex items-center justify-center text-[#7B93A8] hover:text-[#E8F0F6] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#7B93A8] text-xs font-semibold uppercase tracking-wide mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="Dr. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#0B1629] border border-[#1A2F4A] rounded-xl px-4 py-3 text-[#E8F0F6] placeholder:text-[#4A6578] focus:border-[#4FC3B7]/60 focus:outline-none focus:ring-1 focus:ring-[#4FC3B7]/20 text-sm"
            />
          </div>
          <div>
            <label className="block text-[#7B93A8] text-xs font-semibold uppercase tracking-wide mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="doctor@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0B1629] border border-[#1A2F4A] rounded-xl px-4 py-3 text-[#E8F0F6] placeholder:text-[#4A6578] focus:border-[#4FC3B7]/60 focus:outline-none focus:ring-1 focus:ring-[#4FC3B7]/20 text-sm"
            />
          </div>

          {status && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${status.type === 'success' ? 'bg-[#10B981]/10 border border-[#10B981]/30 text-[#34D399]' : 'bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#FF7A6B]'}`}>
              {status.type === 'success' ? '✓ ' : '✗ '}{status.msg}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#1A2F4A] text-[#7B93A8] text-sm font-semibold hover:bg-[#1A2F4A] hover:text-[#E8F0F6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 py-3 rounded-xl bg-[#4FC3B7] text-[#0B1620] text-sm font-bold hover:bg-[#3DADA2] transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCliniciansPage() {
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const fetchClinicians = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/clinicians');
    const json = await res.json();
    setClinicians(json.clinicians ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClinicians(); }, [fetchClinicians]);

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const newThisMonth = clinicians.filter((c) => c.created_at > monthAgo).length;

  const filtered = clinicians.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.full_name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  });

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="p-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0F1E32] to-[#112240] border border-[#1A2F4A] rounded-2xl p-6 mb-6">
        <p className="text-[#7B93A8] text-sm mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-[#E8F0F6]">Welcome back, Admin</h1>
        <p className="text-[#7B93A8] text-sm mt-1">Here is what is happening with your platform today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Clinicians"
          value={loading ? '—' : clinicians.length}
          iconBg="bg-gradient-to-br from-[#4FC3B7] to-[#2A8F86] text-white"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Accounts"
          value={loading ? '—' : clinicians.length}
          iconBg="bg-gradient-to-br from-[#10B981] to-[#059669] text-white"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          sub="Email confirmed"
        />
        <StatCard
          label="New This Month"
          value={loading ? '—' : newThisMonth}
          iconBg="bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
          sub="Last 30 days"
        />
        <StatCard
          label="Pending Invites"
          value="—"
          iconBg="bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          sub="Awaiting signup"
        />
      </div>

      {/* Table card */}
      <div className="bg-[#0F1E32] border border-[#1A2F4A] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2F4A]">
          <div>
            <h2 className="text-[#E8F0F6] font-bold text-base">Registered Clinicians</h2>
            <p className="text-[#7B93A8] text-xs mt-0.5">
              {loading ? 'Loading…' : `${clinicians.length} total`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A6578]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search clinicians..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#0B1629] border border-[#1A2F4A] rounded-full text-sm text-[#E8F0F6] placeholder:text-[#4A6578] focus:outline-none focus:border-[#4FC3B7]/50 w-52"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#4FC3B7] text-[#0B1620] font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#3DADA2] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Invite Clinician
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr_120px_100px] px-6 py-3 bg-[#0B1629] border-b border-[#1A2F4A]">
          <span className="text-[#4A6578] text-xs font-semibold uppercase tracking-wider">Clinician</span>
          <span className="text-[#4A6578] text-xs font-semibold uppercase tracking-wider">Email</span>
          <span className="text-[#4A6578] text-xs font-semibold uppercase tracking-wider">Joined</span>
          <span className="text-[#4A6578] text-xs font-semibold uppercase tracking-wider">Status</span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#4FC3B7] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#7B93A8] text-sm">Loading clinicians…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#1A2F4A] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#4A6578]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-[#7B93A8] text-sm font-medium">
              {search ? 'No clinicians match your search.' : 'No clinicians registered yet.'}
            </p>
            {!search && (
              <p className="text-[#4A6578] text-xs mt-1">Use "Invite Clinician" to add the first one.</p>
            )}
          </div>
        ) : (
          filtered.map((c, i) => {
            const initials = (c.full_name ?? 'C').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            const gradients = [
              'from-[#4FC3B7] to-[#2A8F86]',
              'from-[#3B82F6] to-[#1D4ED8]',
              'from-[#8B5CF6] to-[#6D28D9]',
              'from-[#F59E0B] to-[#D97706]',
              'from-[#EF4444] to-[#DC2626]',
            ];
            const grad = gradients[i % gradients.length];
            return (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_1fr_120px_100px] px-6 py-4 border-b border-[#1A2F4A] last:border-0 items-center hover:bg-[#0B1629]/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {initials}
                  </div>
                  <p className="text-[#E8F0F6] text-sm font-semibold">{c.full_name ?? '—'}</p>
                </div>
                <p className="text-[#7B93A8] text-sm">{c.email ?? '—'}</p>
                <p className="text-[#4A6578] text-xs">
                  {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#34D399] bg-[#10B981]/10 border border-[#10B981]/20 rounded-full px-3 py-1 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  Active
                </span>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <InviteModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchClinicians}
        />
      )}
    </div>
  );
}
