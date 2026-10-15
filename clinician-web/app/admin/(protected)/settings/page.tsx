'use client';

import { useState, useEffect } from 'react';

const TABLES = [
  'profiles',
  'clinician_links',
  'events',
  'sos_events',
  'followups',
  'medication_logs',
  'audit_log',
  'care_circle',
];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-[#EAF4FF] font-bold text-base">{title}</h2>
        {description && <p className="text-[#7AAAC8] text-sm mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-[#EAF4FF] text-sm font-medium">{label}</p>
        {sub && <p className="text-[#7AAAC8] text-xs mt-0.5">{sub}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#00BFA6]' : 'bg-[#1A3265]'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function InfoRow({ label, value, badge }: { label: string; value: string; badge?: { text: string; color: string } }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1A3265] last:border-0">
      <span className="text-[#7AAAC8] text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[#EAF4FF] text-sm font-medium font-mono">{value}</span>
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.text}</span>
        )}
      </div>
    </div>
  );
}

type TableStatus = { name: string; ok: boolean | null };

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>(TABLES.map((n) => ({ name: n, ok: null })));
  const [checkingSchema, setCheckingSchema] = useState(false);

  // Settings toggles
  const [sosNotify, setSosNotify] = useState(true);
  const [eventAlerts, setEventAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)';
  const env = process.env.NODE_ENV ?? 'development';
  const projectId = supabaseUrl.split('.')[0]?.replace('https://', '') ?? '—';

  async function checkSchema() {
    setCheckingSchema(true);
    const results = await Promise.all(
      TABLES.map(async (table) => {
        try {
          const res = await fetch(`/api/admin/check-table?table=${encodeURIComponent(table)}`);
          return { name: table, ok: res.ok };
        } catch {
          return { name: table, ok: false };
        }
      })
    );
    setTableStatuses(results);
    setCheckingSchema(false);
  }

  async function sendTestEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!testEmail) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, email: testEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestResult({ type: 'success', msg: `Test email dispatched to ${testEmail}` });
      } else {
        setTestResult({ type: 'error', msg: json.error ?? `Request failed (${res.status})` });
      }
    } catch (err: any) {
      setTestResult({ type: 'error', msg: err.message ?? 'Network error' });
    } finally {
      setSendingTest(false);
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const resendConfigured = !!(process.env.RESEND_API_KEY || typeof window === 'undefined');

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EAF4FF]">Platform settings</h1>
          <p className="text-[#7AAAC8] text-sm mt-1">System configuration and diagnostics for Duara.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#00BFA6] text-[#070D1A] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00A896] transition-colors"
        >
          {saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </>
          ) : 'Save changes'}
        </button>
      </div>

      <div className="space-y-5">
        {/* System info */}
        <Section title="System information" description="Supabase project and environment details.">
          <InfoRow label="Project ID" value={projectId} badge={{ text: 'Supabase', color: 'bg-[rgba(0,191,166,0.10)] text-[#00BFA6]' }} />
          <InfoRow label="Environment" value={env} badge={{ text: env === 'production' ? 'Live' : 'Dev', color: env === 'production' ? 'bg-[rgba(0,191,166,0.10)] text-[#00BFA6]' : 'bg-[rgba(244,184,96,0.12)] text-[#F4B860]' }} />
          <InfoRow label="Supabase URL" value={supabaseUrl.length > 40 ? supabaseUrl.slice(0, 40) + '…' : supabaseUrl} />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[#7AAAC8] text-sm">API status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00BFA6] bg-[rgba(0,191,166,0.10)] border border-[#00BFA6]/25 rounded-full px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00BFA6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00BFA6]" />
              </span>
              Operational
            </span>
          </div>
        </Section>

        {/* Schema status */}
        <Section title="Schema status" description="Check that all required database tables are accessible.">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#7AAAC8] text-xs">
              {tableStatuses.every((t) => t.ok === null)
                ? 'Click "Check tables" to verify.'
                : `${tableStatuses.filter((t) => t.ok).length} / ${TABLES.length} tables reachable`}
            </p>
            <button
              onClick={checkSchema}
              disabled={checkingSchema}
              className="text-xs font-semibold text-[#00BFA6] border border-[#00BFA6]/30 px-3 py-1.5 rounded-lg hover:bg-[#00BFA6]/10 transition-colors disabled:opacity-50"
            >
              {checkingSchema ? 'Checking…' : 'Check tables'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tableStatuses.map((t) => (
              <div
                key={t.name}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${
                  t.ok === null
                    ? 'border-[#1A3265] bg-[#0F2040]'
                    : t.ok
                    ? 'border-[#00BFA6]/20 bg-[rgba(0,191,166,0.06)]'
                    : 'border-[#EF4444]/20 bg-[rgba(239,68,68,0.06)]'
                }`}
              >
                <span className="text-[#7AAAC8] text-xs font-mono">{t.name}</span>
                {t.ok === null ? (
                  <span className="text-[#3D5C80] text-xs">—</span>
                ) : t.ok ? (
                  <span className="text-[#00BFA6] text-xs font-semibold">OK</span>
                ) : (
                  <span className="text-[#EF4444] text-xs font-semibold">Missing</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* SMTP / Resend status */}
        <Section title="Email (Resend)" description="Status of the transactional email integration.">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[#EAF4FF] text-sm font-medium">Resend API key</p>
              <p className="text-[#7AAAC8] text-xs mt-0.5">Set via RESEND_API_KEY environment variable.</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
              resendConfigured
                ? 'bg-[rgba(0,191,166,0.10)] text-[#00BFA6] border-[#00BFA6]/25'
                : 'bg-[rgba(244,184,96,0.10)] text-[#F4B860] border-[#F4B860]/25'
            }`}>
              {resendConfigured ? 'Configured' : 'Not set'}
            </span>
          </div>
        </Section>

        {/* Test email */}
        <Section title="Test email" description="Send a test email via the SOS API route to verify Resend is working.">
          <form onSubmit={sendTestEmail} className="space-y-3">
            <div>
              <label className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">Recipient email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                required
                className="w-full bg-[#070D1A] border border-[#1A3265] rounded-xl px-4 py-3 text-[#EAF4FF] placeholder:text-[#3D5C80] focus:border-[#00BFA6] focus:outline-none text-sm"
              />
            </div>
            {testResult && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                testResult.type === 'success'
                  ? 'bg-[rgba(0,191,166,0.10)] border-[#00BFA6]/30 text-[#00BFA6]'
                  : 'bg-[rgba(239,68,68,0.10)] border-[#EF4444]/30 text-[#EF4444]'
              }`}>
                {testResult.msg}
              </div>
            )}
            <button
              type="submit"
              disabled={sendingTest || !testEmail}
              className="bg-[#0F2040] border border-[#1A3265] text-[#EAF4FF] text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1A3265] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {sendingTest ? 'Sending…' : 'Send test email'}
            </button>
          </form>
        </Section>

        {/* Notification toggles */}
        <Section title="Notifications" description="Platform-wide automated email notification settings.">
          <Toggle label="SOS alerts" sub="Notify clinicians when a patient triggers SOS." checked={sosNotify} onChange={setSosNotify} />
          <Toggle label="New event alerts" sub="Notify clinicians when a patient logs a high-severity event." checked={eventAlerts} onChange={setEventAlerts} />
          <Toggle label="Weekly digest" sub="Send clinicians a Sunday summary of their patients' week." checked={weeklyDigest} onChange={setWeeklyDigest} />
          <Toggle label="Require two-factor authentication" sub="Clinicians must set up 2FA before accessing patient data." checked={twoFactor} onChange={setTwoFactor} />
        </Section>

        {/* Danger zone */}
        <div className="bg-[rgba(239,68,68,0.04)] border border-[#EF4444]/20 rounded-2xl p-5">
          <h2 className="text-[#EF4444] font-bold text-sm mb-1">Danger zone</h2>
          <p className="text-[#7AAAC8] text-xs mb-4">These actions are irreversible. Proceed with caution.</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-xl border border-[#EF4444]/40 text-[#EF4444] text-sm font-semibold hover:bg-[#EF4444]/10 transition-colors">
              Purge audit log
            </button>
            <button className="px-4 py-2 rounded-xl border border-[#EF4444]/40 text-[#EF4444] text-sm font-semibold hover:bg-[#EF4444]/10 transition-colors">
              Revoke all sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
