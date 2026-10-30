'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../../../lib/supabase-browser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SosEvent {
  id: string;
  patient_id: string;
  created_at: string;
  dispatched_at: string | null;
  status: string;
  dispatch_ref: string | null;
  notes: string | null;
  profiles: { full_name: string | null }[] | null;
}

interface MetricAlert {
  id: string;
  patient_id: string;
  metric: string;
  value: number;
  threshold: number;
  created_at: string;
  acknowledged_at: string | null;
  profiles: { full_name: string | null }[] | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function minutesDiff(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

function patientInitials(name: string | null | undefined) {
  if (!name) return 'PT';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(239,68,68,0.10)] text-[#EF4444] border border-[#EF4444]/20">
        Active
      </span>
    );
  if (status === 'acknowledged')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] border border-[#8B5CF6]/20">
        Acknowledged
      </span>
    );
  if (status === 'resolved')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(34,200,122,0.10)] text-[#22C87A] border border-[#22C87A]/20">
        Resolved
      </span>
    );
  if (status === 'false_alarm')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(155,150,192,0.10)] text-[#9B96C0] border border-[#9B96C0]/20">
        False alarm
      </span>
    );
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1C1A35] text-[#9B96C0] border border-[#2E2B50]">
      {status}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2E2B50]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-[#2E2B50] rounded w-36" />
              <div className="h-3 bg-[#2E2B50] rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Escalation timeline
// ---------------------------------------------------------------------------

function EscalationTimeline({ event }: { event: SosEvent }) {
  const steps = [
    { label: 'SOS triggered', offset: 0, done: true },
    {
      label: 'Reminder sent (T+2 min)',
      offset: 2,
      done: event.dispatched_at
        ? minutesDiff(event.created_at, event.dispatched_at) >= 2
        : minutesDiff(event.created_at, new Date().toISOString()) >= 2,
    },
    {
      label: 'Paramedics dispatched',
      offset: 4,
      done: !!event.dispatched_at,
    },
  ];

  return (
    <div className="mt-3 pl-1">
      <div className="flex items-center gap-0">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center gap-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${
                  step.done
                    ? 'bg-[#8B5CF6] border-[#8B5CF6]'
                    : 'bg-transparent border-[#504C78]'
                }`}
              />
              <p className="text-[#504C78] text-[10px] mt-1 whitespace-nowrap max-w-[80px] text-center leading-tight">
                {step.label}
              </p>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-12 h-px bg-[#2E2B50] mx-1 mb-3" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SOS Events tab
// ---------------------------------------------------------------------------

function SosEventsTab({
  events,
  onRefresh,
}: {
  events: SosEvent[];
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setSaving(id);
    await supabase.from('sos_events').update({ status }).eq('id', id);
    setSaving(null);
    onRefresh();
  }

  async function saveNote(id: string) {
    setSaving(id + '-note');
    await supabase
      .from('sos_events')
      .update({ notes: noteText[id] ?? '' })
      .eq('id', id);
    setSaving(null);
    setNoteOpen(null);
    onRefresh();
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-[rgba(34,200,122,0.10)] flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-[#22C87A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[#F5F0FF] font-semibold text-base">No active SOS alerts</p>
        <p className="text-[#9B96C0] text-sm mt-1">All clear — no SOS events for your patients.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((ev) => {
        const name = ((ev.profiles as any)?.[0]?.full_name ?? (ev.profiles as any)?.full_name) ?? 'Unknown patient';
        const isSaving = saving === ev.id;
        const isSavingNote = saving === ev.id + '-note';
        const isNoteOpen = noteOpen === ev.id;

        return (
          <div key={ev.id} className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5">
            {/* Row 1: avatar + meta + badge */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] font-bold text-sm flex-shrink-0">
                {patientInitials(name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[#F5F0FF] font-semibold text-sm">{name}</p>
                  <StatusBadge status={ev.status} />
                </div>
                <p className="text-[#504C78] text-xs mt-0.5">{fmtTime(ev.created_at)}</p>
                {ev.dispatch_ref && (
                  <p className="text-[#9B96C0] text-xs mt-0.5">
                    Dispatch ref:{' '}
                    <span className="font-mono text-[#F4B860]">{ev.dispatch_ref}</span>
                  </p>
                )}
                {ev.notes && !isNoteOpen && (
                  <p className="text-[#9B96C0] text-xs mt-1 italic">
                    Note: {ev.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Escalation timeline */}
            <EscalationTimeline event={ev} />

            {/* Inline note textarea */}
            {isNoteOpen && (
              <div className="mt-3">
                <textarea
                  className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-3 py-2 text-[#F5F0FF] text-sm placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 resize-none"
                  rows={3}
                  placeholder="Add a clinical note..."
                  value={noteText[ev.id] ?? ev.notes ?? ''}
                  onChange={(e) =>
                    setNoteText((prev) => ({ ...prev, [ev.id]: e.target.value }))
                  }
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => saveNote(ev.id)}
                    disabled={isSavingNote}
                    className="bg-[#8B5CF6] text-[#09090F] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
                  >
                    {isSavingNote ? 'Saving…' : 'Save note'}
                  </button>
                  <button
                    onClick={() => setNoteOpen(null)}
                    className="text-[#9B96C0] text-xs hover:text-[#F5F0FF] transition-colors px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {ev.status !== 'acknowledged' && ev.status !== 'resolved' && ev.status !== 'false_alarm' && (
                <button
                  onClick={() => updateStatus(ev.id, 'acknowledged')}
                  disabled={isSaving}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[rgba(139,92,246,0.20)] transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving…' : 'Acknowledge'}
                </button>
              )}
              {!isNoteOpen && (
                <button
                  onClick={() => setNoteOpen(ev.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1C1A35] text-[#9B96C0] border border-[#2E2B50] hover:text-[#F5F0FF] hover:border-[#504C78] transition-colors"
                >
                  Add note
                </button>
              )}
              {ev.status !== 'false_alarm' && ev.status !== 'resolved' && (
                <button
                  onClick={() => updateStatus(ev.id, 'false_alarm')}
                  disabled={isSaving}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(155,150,192,0.08)] text-[#9B96C0] border border-[#504C78]/40 hover:text-[#F5F0FF] transition-colors disabled:opacity-50"
                >
                  Close — false alarm
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Alerts tab
// ---------------------------------------------------------------------------

function MetricAlertsTab({
  alerts,
  onRefresh,
}: {
  alerts: MetricAlert[];
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState<string | null>(null);

  async function acknowledge(id: string) {
    setSaving(id);
    await supabase
      .from('alerts')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', id);
    setSaving(null);
    onRefresh();
  }

  const active = alerts.filter((a) => !a.acknowledged_at);
  const acknowledged = alerts.filter((a) => !!a.acknowledged_at);

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-[rgba(34,200,122,0.10)] flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-[#22C87A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[#F5F0FF] font-semibold text-base">No metric alerts</p>
        <p className="text-[#9B96C0] text-sm mt-1">All patient vitals are within normal thresholds.</p>
      </div>
    );
  }

  function MetricRow({ alert }: { alert: MetricAlert }) {
    const name = ((alert.profiles as any)?.[0]?.full_name ?? (alert.profiles as any)?.full_name) ?? 'Unknown';
    const isSaving = saving === alert.id;
    const metricLabel = alert.metric.replace(/_/g, ' ');

    return (
      <div className="flex items-center gap-4 py-3.5 border-b border-[#2E2B50] last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[#F5F0FF] font-semibold text-sm">{name}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[rgba(244,184,96,0.10)] text-[#F4B860] border border-[#F4B860]/20 capitalize">
              {metricLabel}
            </span>
          </div>
          <p className="text-[#9B96C0] text-xs mt-0.5">
            Value:{' '}
            <span className="text-[#EF4444] font-bold">{alert.value}</span>
            {' '}· Threshold: {alert.threshold}
            {' '}· {fmtTime(alert.created_at)}
          </p>
        </div>
        {!alert.acknowledged_at ? (
          <button
            onClick={() => acknowledge(alert.id)}
            disabled={isSaving}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[rgba(139,92,246,0.20)] transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {isSaving ? 'Saving…' : 'Acknowledge'}
          </button>
        ) : (
          <span className="text-xs text-[#22C87A] flex-shrink-0">Acknowledged</span>
        )}
      </div>
    );
  }

  return (
    <div>
      {active.length > 0 && (
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-bold text-[#F5F0FF] mb-1">
            Unacknowledged
            <span className="ml-2 text-xs text-[#EF4444] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/20">
              {active.length}
            </span>
          </h3>
          {active.map((a) => <MetricRow key={a.id} alert={a} />)}
        </div>
      )}
      {acknowledged.length > 0 && (
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-[#9B96C0] mb-1">Acknowledged</h3>
          {acknowledged.map((a) => <MetricRow key={a.id} alert={a} />)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AlertsPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<'sos' | 'metrics'>('sos');
  const [sosEvents, setSosEvents] = useState<SosEvent[]>([]);
  const [metricAlerts, setMetricAlerts] = useState<MetricAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [smsSandbox, setSmsSandbox] = useState<boolean | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get linked patient IDs
    const { data: links } = await supabase
      .from('clinician_links')
      .select('patient_id')
      .eq('clinician_id', user.id)
      .not('verified_at', 'is', null);

    const patientIds = (links ?? []).map((l: { patient_id: string }) => l.patient_id);

    if (patientIds.length === 0) {
      setLoading(false);
      return;
    }

    const [sosRes, alertsRes] = await Promise.all([
      supabase
        .from('sos_events')
        .select('id, patient_id, created_at, dispatched_at, status, dispatch_ref, notes, profiles(full_name)')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('alerts')
        .select('id, patient_id, metric, value, threshold, created_at, acknowledged_at, profiles(full_name)')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    setSosEvents((sosRes.data ?? []) as SosEvent[]);
    setMetricAlerts((alertsRes.data ?? []) as MetricAlert[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch('/api/sms-mode')
      .then((r) => r.json())
      .then((d: { sandbox: boolean }) => setSmsSandbox(d.sandbox))
      .catch(() => {});
  }, []);

  const activeSosCount = sosEvents.filter(
    (e) => e.status === 'active' || e.status === 'acknowledged'
  ).length;

  const unacknowledgedMetrics = metricAlerts.filter((a) => !a.acknowledged_at).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F0FF]">Alerts Inbox</h1>
          <p className="text-[#9B96C0] text-sm mt-1">
            SOS events and metric threshold breaches for your patients.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-[#9B96C0] hover:text-[#F5F0FF] transition-colors bg-[#14122A] border border-[#2E2B50] rounded-xl px-4 py-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* SMS sandbox banner */}
      {smsSandbox && (
        <div className="flex items-start gap-3 bg-[rgba(244,184,96,0.08)] border border-[#F4B860]/30 rounded-xl px-4 py-3 mb-6">
          <svg className="w-4 h-4 text-[#F4B860] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[#F4B860] text-sm leading-relaxed">
            <span className="font-bold">SMS sandbox mode</span> — SOS text messages are routed to the Africa&apos;s Talking simulator, not real phones.
            Set <code className="font-mono text-xs bg-[rgba(244,184,96,0.12)] px-1.5 py-0.5 rounded">AT_USERNAME</code> to your AT account username in Vercel to send live SMS.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#2E2B50] mb-6">
        <button
          onClick={() => setTab('sos')}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            tab === 'sos'
              ? 'text-[#8B5CF6] border-[#8B5CF6]'
              : 'text-[#9B96C0] border-transparent hover:text-[#F5F0FF] hover:border-[#3D3A65]'
          }`}
        >
          SOS Events
          {activeSosCount > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[#EF4444]/20">
              {activeSosCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('metrics')}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            tab === 'metrics'
              ? 'text-[#8B5CF6] border-[#8B5CF6]'
              : 'text-[#9B96C0] border-transparent hover:text-[#F5F0FF] hover:border-[#3D3A65]'
          }`}
        >
          Metric Alerts
          {unacknowledgedMetrics > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-[rgba(244,184,96,0.15)] text-[#F4B860] border border-[#F4B860]/20">
              {unacknowledgedMetrics}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : tab === 'sos' ? (
        <SosEventsTab events={sosEvents} onRefresh={fetchData} />
      ) : (
        <MetricAlertsTab alerts={metricAlerts} onRefresh={fetchData} />
      )}
    </div>
  );
}
