import { useState } from "react";
import { supabase } from "../lib/supabase";

type AlertState = "open" | "acknowledged" | "closed";
type Severity = "critical" | "warning";
type FilterKey = "All" | "Critical" | "Open" | "Today";

interface Alert {
  id: number;
  patient: string;
  type: string;
  severity: Severity;
  time: string;
  state: AlertState;
}

interface CloseForm {
  alertId: number;
  reason: string;
  note: string;
}

interface NoteForm {
  alertId: number;
  text: string;
}

const ESCALATION_LOG: Record<number, { delta: string; text: string; status?: string }[]> = {
  1: [
    { delta: "T+0:00", text: "Notified 2 contacts (push)" },
    { delta: "T+02:00", text: "Reminder sent — no reply yet" },
    { delta: "T+04:00", text: "Dispatching...", status: "sandbox_skipped" },
  ],
  2: [
    { delta: "T+0:00", text: "Notified 3 contacts (push)" },
    { delta: "T+05:00", text: "Acknowledged by nurse on duty" },
  ],
  3: [
    { delta: "T+0:00", text: "Notified 2 contacts (push)" },
    { delta: "T+02:00", text: "Reminder sent — no reply yet" },
    { delta: "T+04:00", text: "Dispatching...", status: "sandbox_skipped" },
  ],
  4: [
    { delta: "T+0:00", text: "Notified 2 contacts (push)" },
    { delta: "T+01:30", text: "Caregiver responded: reached patient" },
    { delta: "T+02:00", text: "Alert closed" },
  ],
};

const CLOSE_REASONS = [
  { value: "false_alarm", label: "False alarm" },
  { value: "resolved", label: "Resolved" },
  { value: "escalated_to_clinician", label: "Escalated to clinician" },
  { value: "other", label: "Other" },
];

const INITIAL_ALERTS: Alert[] = [
  { id: 1, patient: "Patient A", type: "Fall detected", severity: "critical", time: "Today 07:40", state: "open" },
  { id: 2, patient: "Patient B", type: "Missed dose (×3)", severity: "warning", time: "Today 06:00", state: "acknowledged" },
  { id: 3, patient: "Patient C", type: "High heart rate", severity: "critical", time: "Yesterday 22:10", state: "open" },
  { id: 4, patient: "Patient A", type: "SOS — fall check", severity: "critical", time: "Oct 26 14:30", state: "closed" },
];

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

export default function AlertsInbox({ back }: { back: () => void }) {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [closeForm, setCloseForm] = useState<CloseForm | null>(null);
  const [noteForm, setNoteForm] = useState<NoteForm | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const acknowledge = (alertId: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, state: "acknowledged" } : a))
    );
    supabase
      .from("alerts")
      .update({ state: "acknowledged" })
      .eq("id", alertId)
      .then(() => undefined);
    showToast("Alert acknowledged");
  };

  const openCloseForm = (alertId: number) => {
    setCloseForm({ alertId, reason: "false_alarm", note: "" });
    setNoteForm(null);
  };

  const confirmClose = () => {
    if (!closeForm) return;
    const { alertId, reason, note } = closeForm;
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, state: "closed" } : a))
    );
    supabase
      .from("alerts")
      .update({ state: "closed", close_reason: reason, close_note: note })
      .eq("id", alertId)
      .then(() => undefined);
    setCloseForm(null);
    showToast("Alert closed");
  };

  const openNoteForm = (alertId: number) => {
    setNoteForm({ alertId, text: "" });
    setCloseForm(null);
  };

  const saveNote = () => {
    if (!noteForm) return;
    supabase
      .from("alert_notes")
      .insert({ alert_id: noteForm.alertId, note: noteForm.text })
      .then(() => undefined);
    setNoteForm(null);
    showToast("Note saved");
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === "Critical") return a.severity === "critical";
    if (activeFilter === "Open") return a.state === "open";
    if (activeFilter === "Today") return a.time.startsWith("Today");
    return true;
  });

  const selectedAlert = selectedId != null ? alerts.find((a) => a.id === selectedId) : null;
  const escalationLog = selectedId != null ? ESCALATION_LOG[selectedId] ?? [] : [];

  const severityChip = (s: Severity) =>
    s === "critical" ? (
      <span className="status s0" style={{ fontWeight: 700, fontSize: 11 }}>Critical</span>
    ) : (
      <span className="status s1" style={{ fontWeight: 700, fontSize: 11 }}>Warning</span>
    );

  const stateLabel = (s: AlertState) => {
    if (s === "open") return <span className="status s0">Open</span>;
    if (s === "acknowledged") return <span className="status s1">Acknowledged</span>;
    return <span className="status s2">Closed</span>;
  };

  const FILTERS: FilterKey[] = ["All", "Critical", "Open", "Today"];

  return (
    <div className="clinician-shell">
      <ClinicianSidebar activeItem="Alerts inbox" />
      <main className="dashboard" style={{ overflowY: "auto" }}>
        <button className="back-link" onClick={back}>
          &#8249; Back to dashboard
        </button>
        <div className="dash-head">
          <div>
            <span className="eyebrow jade">Clinician tools</span>
            <h1>Alerts inbox</h1>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                border: "none",
                borderRadius: 99,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: activeFilter === f ? "#0B1A1F" : "#DCE6E4",
                color: activeFilter === f ? "#EAF4F1" : "#4F6866",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <section className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1.6fr 0.9fr 1fr 0.9fr 1.8fr",
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
                <span>Patient</span>
                <span>Alert type</span>
                <span>Severity</span>
                <span>Time</span>
                <span>State</span>
                <span>Actions</span>
              </div>

              {filteredAlerts.length === 0 && (
                <div style={{ padding: "28px 20px", color: "#4F6866", fontSize: 13, textAlign: "center" }}>
                  No alerts match this filter.
                </div>
              )}

              {filteredAlerts.map((alert) => (
                <div key={alert.id}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1.6fr 0.9fr 1fr 0.9fr 1.8fr",
                      padding: "14px 20px",
                      borderBottom: "1px solid #edf0ef",
                      fontSize: 13,
                      alignItems: "center",
                      cursor: "pointer",
                      background: selectedId === alert.id ? "#F0FAF7" : "transparent",
                    }}
                    onClick={() => setSelectedId(selectedId === alert.id ? null : alert.id)}
                  >
                    <span style={{ fontWeight: 600 }}>{alert.patient}</span>
                    <span>{alert.type}</span>
                    <span>{severityChip(alert.severity)}</span>
                    <span style={{ color: "#4F6866" }}>{alert.time}</span>
                    <span>{stateLabel(alert.state)}</span>
                    <span
                      style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {alert.state === "open" && (
                        <button
                          className="button ink"
                          style={{ minHeight: 32, padding: "4px 12px", fontSize: 11, borderRadius: 8 }}
                          onClick={() => acknowledge(alert.id)}
                        >
                          Acknowledge
                        </button>
                      )}
                      {(alert.state === "open" || alert.state === "acknowledged") && (
                        <button
                          className="button outline"
                          style={{ minHeight: 32, padding: "4px 12px", fontSize: 11, borderRadius: 8 }}
                          onClick={() => openNoteForm(alert.id)}
                        >
                          Add note
                        </button>
                      )}
                      {(alert.state === "open" || alert.state === "acknowledged") && (
                        <button
                          className="button danger"
                          style={{ minHeight: 32, padding: "4px 12px", fontSize: 11, borderRadius: 8 }}
                          onClick={() => openCloseForm(alert.id)}
                        >
                          Close with reason
                        </button>
                      )}
                      {alert.state === "closed" && (
                        <button
                          className="button outline"
                          style={{ minHeight: 32, padding: "4px 12px", fontSize: 11, borderRadius: 8 }}
                          onClick={() => setSelectedId(selectedId === alert.id ? null : alert.id)}
                        >
                          View log
                        </button>
                      )}
                    </span>
                  </div>

                  {/* Add note inline form */}
                  {noteForm?.alertId === alert.id && (
                    <div
                      style={{
                        padding: "14px 20px 18px",
                        background: "#F9FDFB",
                        borderBottom: "1px solid #DCE6E4",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#0B1A1F" }}>
                        Add note
                      </label>
                      <textarea
                        value={noteForm.text}
                        onChange={(e) => setNoteForm({ ...noteForm, text: e.target.value })}
                        rows={2}
                        placeholder="Enter your note..."
                        style={{
                          border: "1px solid #DCE6E4",
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontSize: 13,
                          fontFamily: "inherit",
                          resize: "vertical",
                          width: "100%",
                        }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="button ink"
                          style={{ minHeight: 34, padding: "4px 16px", fontSize: 12 }}
                          onClick={saveNote}
                        >
                          Save note
                        </button>
                        <button
                          className="button outline"
                          style={{ minHeight: 34, padding: "4px 14px", fontSize: 12 }}
                          onClick={() => setNoteForm(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Close with reason inline form */}
                  {closeForm?.alertId === alert.id && (
                    <div
                      style={{
                        padding: "14px 20px 18px",
                        background: "#FFF8F8",
                        borderBottom: "1px solid #DCE6E4",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#0B1A1F" }}>
                        Close alert — select reason
                      </label>
                      <select
                        value={closeForm.reason}
                        onChange={(e) => setCloseForm({ ...closeForm, reason: e.target.value })}
                        style={{
                          border: "1px solid #DCE6E4",
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontSize: 13,
                          fontFamily: "inherit",
                          background: "#fff",
                        }}
                      >
                        {CLOSE_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={closeForm.note}
                        onChange={(e) => setCloseForm({ ...closeForm, note: e.target.value })}
                        rows={2}
                        placeholder="Optional: additional context..."
                        style={{
                          border: "1px solid #DCE6E4",
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontSize: 13,
                          fontFamily: "inherit",
                          resize: "vertical",
                          width: "100%",
                        }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="button danger"
                          style={{ minHeight: 34, padding: "4px 16px", fontSize: 12 }}
                          onClick={confirmClose}
                        >
                          Confirm close
                        </button>
                        <button
                          className="button outline"
                          style={{ minHeight: 34, padding: "4px 14px", fontSize: 12 }}
                          onClick={() => setCloseForm(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>

          {/* Escalation log panel */}
          {selectedAlert && (
            <div
              style={{
                width: 280,
                flexShrink: 0,
                background: "#fff",
                border: "1px solid #DCE6E4",
                borderRadius: 18,
                padding: "20px 18px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#4F6866", marginBottom: 4 }}>
                Escalation log
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#0B1A1F" }}>
                {selectedAlert.patient} — {selectedAlert.type}
              </div>
              {escalationLog.length === 0 && (
                <p style={{ fontSize: 12, color: "#86A3A1" }}>No escalation history.</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {escalationLog.map((entry, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 10,
                        color: "#86A3A1",
                        whiteSpace: "nowrap",
                        paddingTop: 2,
                        minWidth: 56,
                      }}
                    >
                      {entry.delta}
                    </span>
                    <div>
                      <span style={{ fontSize: 12, color: "#0B1A1F" }}>{entry.text}</span>
                      {entry.status && (
                        <span
                          style={{
                            display: "inline-block",
                            marginLeft: 6,
                            fontFamily: "DM Mono, monospace",
                            fontSize: 10,
                            background: "#FFF0CC",
                            color: "#7A5200",
                            borderRadius: 5,
                            padding: "1px 6px",
                          }}
                        >
                          {entry.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
