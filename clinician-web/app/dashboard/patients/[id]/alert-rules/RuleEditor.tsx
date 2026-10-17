'use client';
import { useState } from 'react';
import { createClient } from '../../../../../lib/supabase-browser';

type Operator = '>' | '<' | '>=' | '<=';
type Severity = 'info' | 'warning' | 'critical';
type Pathway = 'Medical' | 'Mental Health';

interface AlertRule {
  id: string;
  patient_id: string;
  metric: string;
  operator: Operator;
  threshold: number;
  duration: number;
  severity: Severity;
  pathway: Pathway;
  active: boolean;
}

const METRICS: { value: string; label: string; unit: string }[] = [
  { value: 'heart_rate', label: 'Heart rate', unit: 'bpm' },
  { value: 'spo2', label: 'SpO2', unit: '%' },
  { value: 'skin_temp', label: 'Skin temperature', unit: '°C' },
  { value: 'resp_rate', label: 'Respiratory rate', unit: 'brpm' },
  { value: 'glucose_mmol', label: 'Blood glucose', unit: 'mmol/L' },
  { value: 'systolic', label: 'Systolic BP', unit: 'mmHg' },
  { value: 'diastolic', label: 'Diastolic BP', unit: 'mmHg' },
  { value: 'weight_kg', label: 'Weight', unit: 'kg' },
  { value: 'mood', label: 'Mood score', unit: '/5' },
  { value: 'sleep_quality', label: 'Sleep quality', unit: '/5' },
];

const OPERATORS: { value: Operator; label: string }[] = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
];

const DURATIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Immediately' },
  { value: 30, label: '30 s' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 300, label: '5 min' },
];

const SEVERITIES: { value: Severity; color: string; bg: string; border: string }[] = [
  { value: 'info', color: 'text-[#9B96C0]', bg: 'bg-[rgba(122,170,200,0.10)]', border: 'border-[#9B96C0]/30' },
  { value: 'warning', color: 'text-[#F4B860]', bg: 'bg-[rgba(244,184,96,0.10)]', border: 'border-[#F4B860]/30' },
  { value: 'critical', color: 'text-[#EF4444]', bg: 'bg-[rgba(239,68,68,0.10)]', border: 'border-[#EF4444]/30' },
];

const PATHWAYS: Pathway[] = ['Medical', 'Mental Health'];

interface Props {
  patientId: string;
  initialRules: AlertRule[];
}

const defaultDraft = {
  metric: 'heart_rate',
  operator: '>' as Operator,
  threshold: 100,
  duration: 60,
  severity: 'warning' as Severity,
  pathway: 'Medical' as Pathway,
};

function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITIES.find((x) => x.value === severity)!;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color} border ${s.border} capitalize`}>
      {severity}
    </span>
  );
}

function PathwayBadge({ pathway }: { pathway: Pathway }) {
  const isMedical = pathway === 'Medical';
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isMedical ? 'bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] border border-[#8B5CF6]/20' : 'bg-[rgba(122,170,200,0.10)] text-[#9B96C0] border border-[#9B96C0]/20'}`}>
      {pathway}
    </span>
  );
}

function buildPreview(draft: typeof defaultDraft): string {
  const metric = METRICS.find((m) => m.value === draft.metric);
  if (!metric) return '';
  const durationLabel =
    draft.duration === 0
      ? 'immediately'
      : `for ${DURATIONS.find((d) => d.value === draft.duration)?.label ?? draft.duration + 's'}`;
  return `Alert when ${metric.label} ${draft.operator} ${draft.threshold}${metric.unit} ${durationLabel}`;
}

export default function RuleEditor({ patientId, initialRules }: Props) {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ ...defaultDraft });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const inputClass =
    'bg-[#14122A] border border-[#2E2B50] rounded-xl px-3 py-2.5 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 text-sm transition-colors disabled:opacity-50';

  async function handleAddRule() {
    setSaving(true);
    setSaveError('');
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('alert_rules')
        .insert({
          patient_id: patientId,
          metric: draft.metric,
          operator: draft.operator,
          threshold: draft.threshold,
          duration: draft.duration,
          severity: draft.severity,
          pathway: draft.pathway,
          active: true,
        })
        .select()
        .single();

      if (error) {
        setSaveError(error.message);
        return;
      }

      setRules((prev) => [data, ...prev]);
      setDraft({ ...defaultDraft });
      setShowAdd(false);
    } catch {
      setSaveError('Failed to save rule. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: AlertRule) {
    setTogglingId(rule.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('alert_rules')
        .update({ active: !rule.active })
        .eq('id', rule.id)
        .select()
        .single();

      if (!error && data) {
        setRules((prev) => prev.map((r) => (r.id === rule.id ? data : r)));
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      {/* Rules table */}
      <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl overflow-hidden mb-5">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2B50]">
          <h2 className="text-[#F5F0FF] font-bold text-sm">Active rules</h2>
          <button
            onClick={() => { setShowAdd(true); setSaveError(''); }}
            className="bg-[#8B5CF6] text-[#09090F] font-bold rounded-xl hover:bg-[#00A896] transition-colors min-h-9 px-4 text-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add rule
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[#9B96C0] text-sm">No alert rules configured yet.</p>
            <p className="text-[#504C78] text-xs mt-1">Click "Add rule" to create the first threshold.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2E2B50]">
                  {['Metric', 'Condition', 'Duration', 'Severity', 'Pathway', 'Active'].map((h) => (
                    <th key={h} className="text-left text-[#504C78] text-xs font-semibold uppercase tracking-wider px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => {
                  const metricInfo = METRICS.find((m) => m.value === rule.metric);
                  const durLabel = DURATIONS.find((d) => d.value === rule.duration)?.label ?? `${rule.duration}s`;
                  return (
                    <tr key={rule.id} className="border-b border-[#2E2B50] last:border-0 hover:bg-[#1C1A35] transition-colors">
                      <td className="px-5 py-3.5 text-[#F5F0FF] font-medium">
                        {metricInfo?.label ?? rule.metric}
                      </td>
                      <td className="px-5 py-3.5 text-[#F5F0FF] font-mono whitespace-nowrap">
                        {rule.operator} {rule.threshold}{metricInfo?.unit ?? ''}
                      </td>
                      <td className="px-5 py-3.5 text-[#9B96C0]">{durLabel}</td>
                      <td className="px-5 py-3.5">
                        <SeverityBadge severity={rule.severity} />
                      </td>
                      <td className="px-5 py-3.5">
                        <PathwayBadge pathway={rule.pathway} />
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggle(rule)}
                          disabled={togglingId === rule.id}
                          aria-label={rule.active ? 'Deactivate rule' : 'Activate rule'}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${
                            rule.active ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'bg-[#2E2B50] border-[#2E2B50]'
                          } ${togglingId === rule.id ? 'opacity-50' : ''}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                              rule.active ? 'translate-x-3.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add rule form */}
      {showAdd && (
        <div className="bg-[#14122A] border border-[#8B5CF6]/25 rounded-2xl p-6">
          <h3 className="text-[#F5F0FF] font-bold text-sm mb-5">New alert rule</h3>

          <div className="space-y-5">
            {/* Metric */}
            <div>
              <label htmlFor="rule-metric" className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                Metric
              </label>
              <select
                id="rule-metric"
                value={draft.metric}
                onChange={(e) => setDraft({ ...draft, metric: e.target.value })}
                className={inputClass + ' w-full cursor-pointer'}
                aria-label="Alert metric"
              >
                {METRICS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label} ({m.unit})</option>
                ))}
              </select>
            </div>

            {/* Operator + threshold */}
            <div className="flex gap-4">
              <div className="w-28">
                <label htmlFor="rule-operator" className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                  Operator
                </label>
                <select
                  id="rule-operator"
                  value={draft.operator}
                  onChange={(e) => setDraft({ ...draft, operator: e.target.value as Operator })}
                  className={inputClass + ' w-full cursor-pointer font-mono'}
                  aria-label="Comparison operator"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="rule-threshold" className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                  Threshold ({METRICS.find((m) => m.value === draft.metric)?.unit})
                </label>
                <input
                  id="rule-threshold"
                  type="number"
                  value={draft.threshold}
                  onChange={(e) => setDraft({ ...draft, threshold: Number(e.target.value) })}
                  className={inputClass + ' w-full'}
                  aria-label="Threshold value"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="rule-duration" className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                Duration before alert
              </label>
              <select
                id="rule-duration"
                value={draft.duration}
                onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })}
                className={inputClass + ' w-full cursor-pointer'}
                aria-label="Duration before triggering alert"
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                Severity
              </label>
              <div className="flex gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, severity: s.value })}
                    aria-pressed={draft.severity === s.value}
                    className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors capitalize ${
                      draft.severity === s.value
                        ? `${s.bg} ${s.color} ${s.border}`
                        : 'bg-[#1C1A35] border-[#2E2B50] text-[#504C78] hover:border-[#3D3A65]'
                    }`}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Pathway */}
            <div>
              <label className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                Pathway
              </label>
              <div className="flex gap-2">
                {PATHWAYS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDraft({ ...draft, pathway: p })}
                    aria-pressed={draft.pathway === p}
                    className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                      draft.pathway === p
                        ? 'bg-[rgba(139,92,246,0.15)] border-[#8B5CF6]/40 text-[#8B5CF6]'
                        : 'bg-[#1C1A35] border-[#2E2B50] text-[#504C78] hover:border-[#3D3A65]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-[rgba(139,92,246,0.05)] border border-[#8B5CF6]/15 rounded-xl px-4 py-3">
              <p className="text-[#504C78] text-xs mb-0.5 font-semibold uppercase tracking-widest">Preview</p>
              <p className="text-[#9B96C0] text-sm">{buildPreview(draft)}</p>
            </div>

            {saveError && (
              <div role="alert" className="bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/40 rounded-xl px-4 py-3">
                <p className="text-[#EF4444] text-sm">{saveError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddRule}
                disabled={saving}
                className="bg-[#8B5CF6] text-[#09090F] font-bold rounded-xl hover:bg-[#00A896] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-10 px-6 text-sm"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Saving…
                  </span>
                ) : 'Add rule'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setSaveError(''); }}
                disabled={saving}
                className="border border-[#2E2B50] text-[#9B96C0] font-medium rounded-xl hover:bg-[#1C1A35] hover:text-[#F5F0FF] transition-colors min-h-10 px-5 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
