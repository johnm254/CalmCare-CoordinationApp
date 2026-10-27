import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { logAccess } from "../lib/audit";

type SelectedPatient = "Patient A" | "Patient B" | "Patient C";
type Pathway = "medical" | "mental_health";
type Severity = "critical" | "warning";
type TemplateKey = "epilepsy" | "hypertension" | "diabetes" | "heart_disease";

interface AlertRule {
  id: number;
  metric: string;
  unit: string;
  lowWarn: number | null;
  lowCrit: number | null;
  highWarn: number | null;
  highCrit: number | null;
  pathway: Pathway;
  severity: Severity;
  firesPerWeek: string;
}

interface EditState {
  ruleId: number;
  metric: string;
  unit: string;
  lowWarn: string;
  lowCrit: string;
  highWarn: string;
  highCrit: string;
  pathway: Pathway;
  severity: Severity;
  previewResult: string | null;
}

interface TemplatePreview {
  key: TemplateKey;
  label: string;
  rules: {
    metric: string;
    unit: string;
    lowWarn: number | null;
    lowCrit: number | null;
    highWarn: number | null;
    highCrit: number | null;
    pathway: Pathway;
    severity: Severity;
  }[];
}

const DEMO_PATIENT_UUID = "00000000-0000-0000-0000-000000000001";

const RULES_BY_PATIENT: Record<SelectedPatient, AlertRule[]> = {
  "Patient A": [
    { id: 1, metric: "Heart rate", unit: "bpm", lowWarn: 45, lowCrit: 40, highWarn: 100, highCrit: 120, pathway: "medical", severity: "critical", firesPerWeek: "2/week" },
    { id: 2, metric: "SpO2", unit: "%", lowWarn: 93, lowCrit: 90, highWarn: null, highCrit: null, pathway: "medical", severity: "critical", firesPerWeek: "0/week" },
    { id: 3, metric: "Glucose", unit: "mmol·L⁻¹", lowWarn: 3.9, lowCrit: 3.5, highWarn: 10, highCrit: 13.9, pathway: "medical", severity: "warning", firesPerWeek: "1/week" },
    { id: 4, metric: "Mood score", unit: "/10", lowWarn: null, lowCrit: null, highWarn: null, highCrit: null, pathway: "mental_health", severity: "warning", firesPerWeek: "0/week" },
  ],
  "Patient B": [
    { id: 5, metric: "Glucose", unit: "mmol·L⁻¹", lowWarn: 4.0, lowCrit: 3.5, highWarn: 10, highCrit: 13.9, pathway: "medical", severity: "critical", firesPerWeek: "3/week" },
    { id: 6, metric: "HbA1c", unit: "%", lowWarn: null, lowCrit: null, highWarn: 7, highCrit: 8.5, pathway: "medical", severity: "warning", firesPerWeek: "0/week" },
    { id: 7, metric: "Ketones", unit: "mmol·L⁻¹", lowWarn: null, lowCrit: null, highWarn: 0.6, highCrit: 1.5, pathway: "medical", severity: "critical", firesPerWeek: "0/week" },
  ],
  "Patient C": [
    { id: 8, metric: "Heart rate", unit: "bpm", lowWarn: 50, lowCrit: 45, highWarn: 110, highCrit: 130, pathway: "medical", severity: "critical", firesPerWeek: "1/week" },
    { id: 9, metric: "Blood pressure (sys)", unit: "mmHg", lowWarn: 100, lowCrit: 90, highWarn: 140, highCrit: 160, pathway: "medical", severity: "critical", firesPerWeek: "2/week" },
    { id: 10, metric: "Cholesterol (LDL)", unit: "mmol·L⁻¹", lowWarn: null, lowCrit: null, highWarn: 3, highCrit: 4, pathway: "medical", severity: "warning", firesPerWeek: "0/week" },
  ],
};

const CONDITION_TEMPLATES: TemplatePreview[] = [
  {
    key: "epilepsy",
    label: "Epilepsy — fall check + tonic-clonic motion",
    rules: [
      { metric: "Fall detected", unit: "boolean", lowWarn: null, lowCrit: null, highWarn: null, highCrit: null, pathway: "medical", severity: "critical" },
      { metric: "Motion anomaly (tonic-clonic)", unit: "score", lowWarn: null, lowCrit: null, highWarn: 0.7, highCrit: 0.9, pathway: "medical", severity: "critical" },
    ],
  },
  {
    key: "hypertension",
    label: "Hypertension — BP + HR limits",
    rules: [
      { metric: "Blood pressure (sys)", unit: "mmHg", lowWarn: 100, lowCrit: 90, highWarn: 140, highCrit: 160, pathway: "medical", severity: "critical" },
      { metric: "Heart rate", unit: "bpm", lowWarn: 50, lowCrit: 45, highWarn: 100, highCrit: 120, pathway: "medical", severity: "warning" },
    ],
  },
  {
    key: "diabetes",
    label: "Diabetes — glucose + ketones",
    rules: [
      { metric: "Glucose", unit: "mmol·L⁻¹", lowWarn: 4.0, lowCrit: 3.5, highWarn: 10, highCrit: 13.9, pathway: "medical", severity: "critical" },
      { metric: "Ketones", unit: "mmol·L⁻¹", lowWarn: null, lowCrit: null, highWarn: 0.6, highCrit: 1.5, pathway: "medical", severity: "critical" },
    ],
  },
  {
    key: "heart_disease",
    label: "Heart disease — extended cardiac",
    rules: [
      { metric: "Heart rate", unit: "bpm", lowWarn: 50, lowCrit: 45, highWarn: 110, highCrit: 130, pathway: "medical", severity: "critical" },
      { metric: "Blood pressure (sys)", unit: "mmHg", lowWarn: 100, lowCrit: 90, highWarn: 140, highCrit: 160, pathway: "medical", severity: "critical" },
      { metric: "Cholesterol (LDL)", unit: "mmol·L⁻¹", lowWarn: null, lowCrit: null, highWarn: 3, highCrit: 4, pathway: "medical", severity: "warning" },
    ],
  },
];

function fmt(v: number | null): string {
  return v === null ? "—" : String(v);
}

function ClinicianSidebar({ activeItem }: { activeItem: string }) {
  const items = [
    "Patient management",
    "Health trends",
    "Events review",
    "Follow-up management",
    "Alerts inbox",
    "Adherence report",
    "Alert limit editor",
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>M</span>
        <strong>Mojo</strong>
      </div>
      <nav>
        {items.map((item) => (
          <button key={item} className={item === activeItem ? "active" : ""}>
            {item}
          </button>
        ))}
      </nav>
      <div className="verified">
        <div>
          <svg aria-hidden="true" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 6 }}>
            <path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z" />
            <path d="m8.5 12 2.2 2.2 4.8-5" />
          </svg>
          Verified clinician
        </div>
        <p>Every record view is consent-checked and written to an audit trail.</p>
      </div>
    </aside>
  );
}

export default function AlertLimitEditor({ back }: { back: () => void }) {
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient>("Patient A");
  const [rules, setRules] = useState<Record<SelectedPatient, AlertRule[]>>(RULES_BY_PATIENT);
  const [editState, setEditState] = useState<EditState | null>(null);

  useEffect(() => {
    logAccess("demo-patient-id", "alert_rules", "clinician_limit_editor");
  }, []);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | "">("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const currentRules = rules[selectedPatient];
  const activeTemplate = selectedTemplate
    ? CONDITION_TEMPLATES.find((t) => t.key === selectedTemplate)
    : null;

  const openEdit = (rule: AlertRule) => {
    setEditState({
      ruleId: rule.id,
      metric: rule.metric,
      unit: rule.unit,
      lowWarn: fmt(rule.lowWarn),
      lowCrit: fmt(rule.lowCrit),
      highWarn: fmt(rule.highWarn),
      highCrit: fmt(rule.highCrit),
      pathway: rule.pathway,
      severity: rule.severity,
      previewResult: null,
    });
  };

  const cancelEdit = () => setEditState(null);

  const saveEdit = () => {
    if (!editState) return;
    const parseVal = (s: string): number | null => {
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    };
    const updated: AlertRule = {
      id: editState.ruleId,
      metric: editState.metric,
      unit: editState.unit,
      lowWarn: parseVal(editState.lowWarn),
      lowCrit: parseVal(editState.lowCrit),
      highWarn: parseVal(editState.highWarn),
      highCrit: parseVal(editState.highCrit),
      pathway: editState.pathway,
      severity: editState.severity,
      firesPerWeek: editState.previewResult ?? currentRules.find((r) => r.id === editState.ruleId)?.firesPerWeek ?? "0/week",
    };
    setRules((prev) => ({
      ...prev,
      [selectedPatient]: prev[selectedPatient].map((r) =>
        r.id === editState.ruleId ? updated : r
      ),
    }));
    supabase
      .from("alert_rules")
      .upsert({
        patient_id: DEMO_PATIENT_UUID,
        metric: updated.metric,
        low_warn: updated.lowWarn,
        low_crit: updated.lowCrit,
        high_warn: updated.highWarn,
        high_crit: updated.highCrit,
        pathway: updated.pathway,
        severity: updated.severity,
      })
      .then(() => undefined);
    setEditState(null);
    showToast("Rule saved");
  };

  const deleteRule = (ruleId: number) => {
    setRules((prev) => ({
      ...prev,
      [selectedPatient]: prev[selectedPatient].filter((r) => r.id !== ruleId),
    }));
    if (editState?.ruleId === ruleId) setEditState(null);
    showToast("Rule deleted");
  };

  const applyTemplate = () => {
    if (!activeTemplate) return;
    const newRules = activeTemplate.rules.map((r, i) => ({
      id: Date.now() + i,
      firesPerWeek: "0/week",
      ...r,
    }));
    setRules((prev) => ({
      ...prev,
      [selectedPatient]: [...prev[selectedPatient], ...newRules],
    }));
    setSelectedTemplate("");
    setTemplateOpen(false);
    showToast(`Template "${activeTemplate.label}" applied`);
  };

  const PATIENT_LABELS: Record<SelectedPatient, string> = {
    "Patient A": "Patient A (epilepsy, hypertension)",
    "Patient B": "Patient B (diabetes)",
    "Patient C": "Patient C (heart disease)",
  };

  return (
    <div className="clinician-shell">
      <ClinicianSidebar activeItem="Alert limit editor" />
      <main className="dashboard" style={{ overflowY: "auto" }}>
        <button className="back-link" onClick={back}>
          &#8249; Back to dashboard
        </button>
        <div className="dash-head">
          <div>
            <span className="eyebrow jade">Clinician tools</span>
            <h1>Alert limit editor</h1>
          </div>
          <button
            className="button ink"
            style={{ fontSize: 12 }}
            onClick={() => setTemplateOpen((v) => !v)}
          >
            + Add rule from template
          </button>
        </div>

        {/* Patient selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#4F6866" }}>Patient</label>
          <select
            value={selectedPatient}
            onChange={(e) => {
              setSelectedPatient(e.target.value as SelectedPatient);
              setEditState(null);
              setSelectedTemplate("");
              setTemplateOpen(false);
            }}
            style={{
              border: "1px solid #DCE6E4",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 13,
              fontFamily: "inherit",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {(Object.keys(PATIENT_LABELS) as SelectedPatient[]).map((p) => (
              <option key={p} value={p}>
                {PATIENT_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        {/* Template picker panel */}
        {templateOpen && (
          <section
            className="card"
            style={{ marginBottom: 20, background: "#F9FDFB", border: "1px solid #B7DED6" }}
          >
            <h2 style={{ marginBottom: 12 }}>Add rule from condition template</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {CONDITION_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelectedTemplate(t.key)}
                  style={{
                    border: "1.5px solid",
                    borderColor: selectedTemplate === t.key ? "#0E7C6B" : "#DCE6E4",
                    borderRadius: 10,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: selectedTemplate === t.key ? "#DDF3EE" : "#fff",
                    color: selectedTemplate === t.key ? "#0A5D50" : "#0B1A1F",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTemplate && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#4F6866", marginBottom: 8 }}>
                  Default thresholds for this template
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr",
                    background: "#F3F6F5",
                    padding: "8px 14px",
                    borderRadius: "10px 10px 0 0",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#4F6866",
                    border: "1px solid #DCE6E4",
                    borderBottom: "none",
                  }}
                >
                  <span>Metric</span>
                  <span>Low warn</span>
                  <span>Low crit</span>
                  <span>High warn</span>
                  <span>High crit</span>
                  <span>Pathway</span>
                  <span>Severity</span>
                </div>
                {activeTemplate.rules.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr",
                      padding: "10px 14px",
                      fontSize: 12,
                      border: "1px solid #DCE6E4",
                      borderTop: "none",
                      borderRadius: i === activeTemplate.rules.length - 1 ? "0 0 10px 10px" : 0,
                      background: "#fff",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{r.metric}</span>
                    <span>{fmt(r.lowWarn)}</span>
                    <span>{fmt(r.lowCrit)}</span>
                    <span>{fmt(r.highWarn)}</span>
                    <span>{fmt(r.highCrit)}</span>
                    <span style={{ color: "#4F6866" }}>{r.pathway}</span>
                    <span>
                      <span
                        className={r.severity === "critical" ? "status s0" : "status s1"}
                        style={{ fontSize: 10 }}
                      >
                        {r.severity}
                      </span>
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button
                    className="button"
                    style={{ fontSize: 12 }}
                    onClick={applyTemplate}
                  >
                    Apply defaults
                  </button>
                  <button
                    className="button outline"
                    style={{ fontSize: 12 }}
                    onClick={() => { setTemplateOpen(false); setSelectedTemplate(""); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Alert rules table */}
        <section className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.7fr 0.7fr 0.7fr 0.8fr 0.8fr 0.7fr 0.7fr 0.8fr",
              padding: "12px 20px",
              background: "#F3F6F5",
              borderBottom: "1px solid #DCE6E4",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#4F6866",
            }}
          >
            <span>Metric</span>
            <span>Low warn</span>
            <span>Low crit</span>
            <span>High warn</span>
            <span>High crit</span>
            <span>Pathway</span>
            <span>Severity</span>
            <span>Preview</span>
            <span>Actions</span>
          </div>

          {currentRules.length === 0 && (
            <div style={{ padding: "24px 20px", color: "#4F6866", fontSize: 13, textAlign: "center" }}>
              No rules configured for this patient. Use "Add rule from template" to get started.
            </div>
          )}

          {currentRules.map((rule) => (
            <div key={rule.id}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 0.7fr 0.7fr 0.7fr 0.8fr 0.8fr 0.7fr 0.7fr 0.8fr",
                  padding: "13px 20px",
                  borderBottom: "1px solid #edf0ef",
                  fontSize: 12,
                  alignItems: "center",
                  background: editState?.ruleId === rule.id ? "#F0FAF7" : "transparent",
                }}
              >
                <span style={{ fontWeight: 700 }}>
                  {rule.metric}
                  <span style={{ display: "block", fontSize: 10, color: "#86A3A1", fontWeight: 400, marginTop: 1 }}>
                    {rule.unit}
                  </span>
                </span>
                <span style={{ color: "#7A5200" }}>{fmt(rule.lowWarn)}</span>
                <span style={{ color: "#9B1C1C" }}>{fmt(rule.lowCrit)}</span>
                <span style={{ color: "#7A5200" }}>{fmt(rule.highWarn)}</span>
                <span style={{ color: "#9B1C1C" }}>{fmt(rule.highCrit)}</span>
                <span style={{ color: "#4F6866" }}>{rule.pathway}</span>
                <span>
                  <span
                    className={rule.severity === "critical" ? "status s0" : "status s1"}
                    style={{ fontSize: 10 }}
                  >
                    {rule.severity}
                  </span>
                </span>
                <span style={{ color: "#4F6866" }}>{rule.firesPerWeek}</span>
                <span style={{ display: "flex", gap: 6 }}>
                  <button
                    className="button outline"
                    style={{ minHeight: 30, padding: "3px 10px", fontSize: 11, borderRadius: 8 }}
                    onClick={() => openEdit(rule)}
                  >
                    Edit
                  </button>
                  <button
                    className="button danger"
                    style={{ minHeight: 30, padding: "3px 10px", fontSize: 11, borderRadius: 8 }}
                    onClick={() => deleteRule(rule.id)}
                  >
                    Delete
                  </button>
                </span>
              </div>

              {/* Inline edit form */}
              {editState?.ruleId === rule.id && (
                <div
                  style={{
                    padding: "16px 20px 20px",
                    background: "#F9FDFB",
                    borderBottom: "1px solid #DCE6E4",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0B1A1F" }}>
                    Editing: {rule.metric} ({rule.unit})
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                    {(
                      [
                        ["Low warn", "lowWarn"],
                        ["Low critical", "lowCrit"],
                        ["High warn", "highWarn"],
                        ["High critical", "highCrit"],
                      ] as [string, keyof EditState][]
                    ).map(([label, key]) => (
                      <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#4F6866" }}>{label}</span>
                        <input
                          type="text"
                          value={editState[key] as string}
                          onChange={(e) =>
                            setEditState({ ...editState, [key]: e.target.value })
                          }
                          placeholder="—"
                          style={{
                            border: "1px solid #DCE6E4",
                            borderRadius: 8,
                            padding: "7px 10px",
                            fontSize: 13,
                            fontFamily: "inherit",
                            width: "100%",
                          }}
                        />
                        <span style={{ fontSize: 10, color: "#86A3A1" }}>{rule.unit}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 400 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#4F6866" }}>Pathway</span>
                      <select
                        value={editState.pathway}
                        onChange={(e) =>
                          setEditState({ ...editState, pathway: e.target.value as Pathway })
                        }
                        style={{
                          border: "1px solid #DCE6E4",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontSize: 13,
                          fontFamily: "inherit",
                          background: "#fff",
                        }}
                      >
                        <option value="medical">medical</option>
                        <option value="mental_health">mental_health</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#4F6866" }}>Severity</span>
                      <select
                        value={editState.severity}
                        onChange={(e) =>
                          setEditState({ ...editState, severity: e.target.value as Severity })
                        }
                        style={{
                          border: "1px solid #DCE6E4",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontSize: 13,
                          fontFamily: "inherit",
                          background: "#fff",
                        }}
                      >
                        <option value="critical">critical</option>
                        <option value="warning">warning</option>
                      </select>
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      className="button outline"
                      style={{ fontSize: 12 }}
                      onClick={() =>
                        setEditState({
                          ...editState,
                          previewResult: "~2 times per week based on last 30 days",
                        })
                      }
                    >
                      Preview fire count
                    </button>
                    {editState.previewResult && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#0A5D50",
                          background: "#DDF3EE",
                          borderRadius: 8,
                          padding: "5px 12px",
                          fontWeight: 600,
                        }}
                      >
                        {editState.previewResult}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="button ink"
                      style={{ fontSize: 12 }}
                      onClick={saveEdit}
                    >
                      Save changes
                    </button>
                    <button
                      className="button outline"
                      style={{ fontSize: 12 }}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Compliance note */}
        <p
          style={{
            fontSize: 11,
            color: "#86A3A1",
            lineHeight: 1.6,
            margin: "0 0 8px",
            padding: "0 4px",
          }}
        >
          Changes apply on the patient&apos;s next sync. A Mojo clinician cannot change a
          patient&apos;s medication — only thresholds and routing. The patient is notified when a new
          rule is set.
        </p>
      </main>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#EAF4F1",
            color: "#0B1A1F",
            padding: "12px 20px",
            borderRadius: 99,
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: "nowrap",
            zIndex: 50,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
