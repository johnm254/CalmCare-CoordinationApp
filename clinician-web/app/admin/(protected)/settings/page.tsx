'use client';

import { useState, useEffect } from 'react';

const TABLES = [
  'profiles',
  'clinician_links',
  'events',
  'sos_events',
  'followups',
  'dose_events',
  'audit_log',
  'care_circle',
  'feature_flags',
  'alerts',
];

const FLAG_META: Record<string, { label: string; sub: string }> = {
  live_dispatch:         { label: 'Live dispatch',         sub: 'Send real ambulance requests (disables sandbox mode)' },
  background_location:   { label: 'Background location',   sub: 'Track patient GPS in background for ambulance routing' },
  hospital_arrival_sms:  { label: 'Hospital arrival SMS',  sub: 'Send SMS to family when patient arrives at hospital' },
  health_kit_bridge:     { label: 'HealthKit / Google Fit', sub: 'Sync wearable data from Apple HealthKit and Google Fit' },
  org_admin_role:        { label: 'Org admin role',        sub: 'Enable multi-facility organisation admin features' },
};

type FeatureFlag = { key: string; enabled: boolean; rollout: object | null; updated_at: string | null };
type AuditEntry  = {
  id: string; action: string; actor_role: string | null; actor_name: string | null;
  resource_type: string | null; metadata: object | null; at: string;
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-[#F5F0FF] font-bold text-base">{title}</h2>
        {description && <p className="text-[#9B96C0] text-sm mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, badge }: { label: string; value: string; badge?: { text: string; color: string } }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#2E2B50] last:border-0">
      <span className="text-[#9B96C0] text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[#F5F0FF] text-sm font-medium font-mono">{value}</span>
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.text}</span>
        )}
      </div>
    </div>
  );
}

type TableStatus = { name: string; ok: boolean | null };

export default function AdminSettingsPage() {
  // Schema check
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>(TABLES.map((n) => ({ name: n, ok: null })));
  const [checkingSchema, setCheckingSchema] = useState(false);

  // Test email
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Feature flags
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [flagError, setFlagError] = useState<string | null>(null);

  // Audit log
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  // Danger zone
  const [dangerLoading, setDangerLoading] = useState<string | null>(null);
  const [dangerResult, setDangerResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)';
  const env = process.env.NODE_ENV ?? 'development';
  const projectId = supabaseUrl.split('.')[0]?.replace('https://', '') ?? '—';
  const resendConfigured = !!(process.env.RESEND_API_KEY || typeof window === 'undefined');

  useEffect(() => {
    fetch('/api/admin/feature-flags')
      .then((r) => r.json())
      .then((j) => setFlags(j.flags ?? []))
      .catch(() => setFlagError('Could not load feature flags.'))
      .finally(() => setLoadingFlags(false));

    fetch('/api/admin/audit-log')
      .then((r) => r.json())
      .then((j) => setAuditEntries(j.entries ?? []))
      .catch(() => {})
      .finally(() => setLoadingAudit(false));
  }, []);

  async function toggleFlag(key: string, enabled: boolean) {
    setTogglingKey(key);
    setFlagError(null);
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setFlagError(j.error ?? 'Toggle failed');
      } else {
        setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled } : f));
      }
    } catch {
      setFlagError('Network error');
    } finally {
      setTogglingKey(null);
    }
  }

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
      setTestResult(
        res.ok
          ? { type: 'success', msg: `Test email dispatched to ${testEmail}` }
          : { type: 'error', msg: json.error ?? `Request failed (${res.status})` }
      );
    } catch (err: any) {
      setTestResult({ type: 'error', msg: err.message ?? 'Network error' });
    } finally {
      setSendingTest(false);
    }
  }

  async function runDangerAction(action: string, confirmMsg: string) {
    if (!window.confirm(confirmMsg)) return;
    setDangerLoading(action);
    setDangerResult(null);
    try {
      const res = await fetch('/api/admin/danger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        const msg = action === 'purge_audit_log'
          ? 'Audit log purged (entries older than 30 days deleted).'
          : `All sessions revoked (${json.revoked ?? 0} users signed out).`;
        setDangerResult({ type: 'success', msg });
        if (action === 'purge_audit_log') setAuditEntries([]);
      } else {
        setDangerResult({ type: 'error', msg: json.error ?? 'Action failed' });
      }
    } catch {
      setDangerResult({ type: 'error', msg: 'Network error' });
    } finally {
      setDangerLoading(null);
    }
  }

  function formatAuditAction(action: string): string {
    switch (action) {
      case 'view_patient':      return 'Viewed patient profile';
      case 'view_events':       return 'Viewed health events';
      case 'view_alerts':       return 'Viewed alerts';
      case 'view_medications':  return 'Viewed medications';
      case 'toggle_feature_flag': return 'Toggled feature flag';
      case 'break_glass':       return 'Emergency access';
      default: return action.replace(/_/g, ' ');
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F0FF]">Platform settings</h1>
        <p className="text-[#9B96C0] text-sm mt-1">System configuration and diagnostics for Duara.</p>
      </div>

      <div className="space-y-5">
        {/* System info */}
        <Section title="System information" description="Supabase project and environment details.">
          <InfoRow label="Project ID" value={projectId} badge={{ text: 'Supabase', color: 'bg-[rgba(139,92,246,0.10)] text-[#8B5CF6]' }} />
          <InfoRow
            label="Environment" value={env}
            badge={{ text: env === 'production' ? 'Live' : 'Dev', color: env === 'production' ? 'bg-[rgba(139,92,246,0.10)] text-[#8B5CF6]' : 'bg-[rgba(244,184,96,0.12)] text-[#F4B860]' }}
          />
          <InfoRow label="Supabase URL" value={supabaseUrl.length > 40 ? supabaseUrl.slice(0, 40) + '…' : supabaseUrl} />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[#9B96C0] text-sm">API status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B5CF6] bg-[rgba(139,92,246,0.10)] border border-[#8B5CF6]/25 rounded-full px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B5CF6]" />
              </span>
              Operational
            </span>
          </div>
        </Section>

        {/* Feature flags */}
        <Section title="Feature flags" description="Toggle platform capabilities. Changes take effect immediately and are audit-logged.">
          {flagError && (
            <div className="bg-[rgba(239,68,68,0.08)] border border-[#EF4444]/25 rounded-xl px-4 py-2.5 text-[#EF4444] text-sm mb-2">
              {flagError}
            </div>
          )}
          {loadingFlags ? (
            <p className="text-[#9B96C0] text-sm">Loading…</p>
          ) : flags.length === 0 ? (
            <p className="text-[#504C78] text-sm">No feature flags found. Run migration 005 to seed them.</p>
          ) : (
            flags.map((flag) => {
              const meta = FLAG_META[flag.key] ?? { label: flag.key, sub: '' };
              const busy = togglingKey === flag.key;
              return (
                <div key={flag.key} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-[#F5F0FF] text-sm font-medium">{meta.label}</p>
                    {meta.sub && <p className="text-[#9B96C0] text-xs mt-0.5">{meta.sub}</p>}
                  </div>
                  <button
                    role="switch"
                    aria-checked={flag.enabled}
                    disabled={busy}
                    onClick={() => toggleFlag(flag.key, !flag.enabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${flag.enabled ? 'bg-[#8B5CF6]' : 'bg-[#2E2B50]'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${flag.enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              );
            })
          )}
        </Section>

        {/* Schema status */}
        <Section title="Schema status" description="Check that all required database tables are accessible.">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#9B96C0] text-xs">
              {tableStatuses.every((t) => t.ok === null)
                ? 'Click "Check tables" to verify.'
                : `${tableStatuses.filter((t) => t.ok).length} / ${TABLES.length} tables reachable`}
            </p>
            <button
              onClick={checkSchema}
              disabled={checkingSchema}
              className="text-xs font-semibold text-[#8B5CF6] border border-[#8B5CF6]/30 px-3 py-1.5 rounded-lg hover:bg-[#8B5CF6]/10 transition-colors disabled:opacity-50"
            >
              {checkingSchema ? 'Checking…' : 'Check tables'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tableStatuses.map((t) => (
              <div
                key={t.name}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${
                  t.ok === null ? 'border-[#2E2B50] bg-[#1C1A35]'
                  : t.ok ? 'border-[#8B5CF6]/20 bg-[rgba(139,92,246,0.06)]'
                  : 'border-[#EF4444]/20 bg-[rgba(239,68,68,0.06)]'
                }`}
              >
                <span className="text-[#9B96C0] text-xs font-mono">{t.name}</span>
                {t.ok === null ? (
                  <span className="text-[#504C78] text-xs">—</span>
                ) : t.ok ? (
                  <span className="text-[#8B5CF6] text-xs font-semibold">OK</span>
                ) : (
                  <span className="text-[#EF4444] text-xs font-semibold">Missing</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Email */}
        <Section title="Email (Resend)" description="Status of the transactional email integration.">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[#F5F0FF] text-sm font-medium">Resend API key</p>
              <p className="text-[#9B96C0] text-xs mt-0.5">Set via RESEND_API_KEY environment variable.</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
              resendConfigured
                ? 'bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] border-[#8B5CF6]/25'
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
              <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">Recipient email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                required
                className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-4 py-3 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none text-sm"
              />
            </div>
            {testResult && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                testResult.type === 'success'
                  ? 'bg-[rgba(139,92,246,0.10)] border-[#8B5CF6]/30 text-[#8B5CF6]'
                  : 'bg-[rgba(239,68,68,0.10)] border-[#EF4444]/30 text-[#EF4444]'
              }`}>
                {testResult.msg}
              </div>
            )}
            <button
              type="submit"
              disabled={sendingTest || !testEmail}
              className="bg-[#1C1A35] border border-[#2E2B50] text-[#F5F0FF] text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2E2B50] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {sendingTest ? 'Sending…' : 'Send test email'}
            </button>
          </form>
        </Section>

        {/* Audit log viewer */}
        <Section title="Audit log" description="Last 50 platform events across all patients.">
          {loadingAudit ? (
            <p className="text-[#9B96C0] text-sm">Loading…</p>
          ) : auditEntries.length === 0 ? (
            <p className="text-[#504C78] text-sm">No audit entries yet.</p>
          ) : (
            <div className="divide-y divide-[#2E2B50]">
              {auditEntries.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <p className="text-[#F5F0FF] text-sm font-medium">{formatAuditAction(entry.action)}</p>
                    <p className="text-[#9B96C0] text-xs mt-0.5">
                      {entry.actor_name ?? 'System'}
                      {entry.actor_role ? ` · ${entry.actor_role}` : ''}
                      {entry.resource_type ? ` · ${entry.resource_type}` : ''}
                    </p>
                  </div>
                  <span className="text-[#504C78] text-xs whitespace-nowrap flex-shrink-0">
                    {new Date(entry.at).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Danger zone */}
        <div className="bg-[rgba(239,68,68,0.04)] border border-[#EF4444]/20 rounded-2xl p-5">
          <h2 className="text-[#EF4444] font-bold text-sm mb-1">Danger zone</h2>
          <p className="text-[#9B96C0] text-xs mb-4">These actions are irreversible. Proceed with caution.</p>
          {dangerResult && (
            <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm border ${
              dangerResult.type === 'success'
                ? 'bg-[rgba(16,185,129,0.08)] border-[#10B981]/30 text-[#10B981]'
                : 'bg-[rgba(239,68,68,0.08)] border-[#EF4444]/30 text-[#EF4444]'
            }`}>
              {dangerResult.msg}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => runDangerAction('purge_audit_log', 'This will permanently delete all audit log entries older than 30 days. Continue?')}
              disabled={dangerLoading !== null}
              className="px-4 py-2 rounded-xl border border-[#EF4444]/40 text-[#EF4444] text-sm font-semibold hover:bg-[#EF4444]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dangerLoading === 'purge_audit_log' ? 'Purging…' : 'Purge audit log'}
            </button>
            <button
              onClick={() => runDangerAction('revoke_all_sessions', 'This will immediately sign out ALL users across the platform. They will need to log in again. Continue?')}
              disabled={dangerLoading !== null}
              className="px-4 py-2 rounded-xl border border-[#EF4444]/40 text-[#EF4444] text-sm font-semibold hover:bg-[#EF4444]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dangerLoading === 'revoke_all_sessions' ? 'Revoking…' : 'Revoke all sessions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
