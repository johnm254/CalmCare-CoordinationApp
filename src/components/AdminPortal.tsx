import { useState } from "react"

import { supabase } from "../lib/supabase"

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "system-health" | "clinician-verification" | "emergency-routing" | "hospital-directory" | "device-inventory" | "users-orgs" | "audit-log"

interface FeatureFlag {
  flag_name: string

  enabled: boolean

  description: string

  last_changed_by: string

  locked?: boolean
}

interface ClinicianPending {
  id: number

  name: string

  licence: string

  cadre: string

  submitted: string

  rejectMode: boolean

  rejectReason: string

  approved: boolean

  rejected: boolean
}

interface EmergencyProvider {
  id: number

  name: string

  type: string

  phone: string

  region: string

  mode: "SANDBOX" | "LIVE"

  priority: number

  testMsg: string
}

interface Hospital {
  id: number

  name: string

  level: string

  er24h: boolean

  ambulance: boolean

  location: string

  active: boolean
}

interface DeviceModel {
  id: number

  model: string

  manufacturer: string

  type: string

  approved: boolean
}

interface FirmwareRelease {
  id: number

  version: string

  model: string

  rollout: number

  released: string
}

interface OrgRow {
  id: number

  name: string

  clinicians: number

  patients: number

  status: "Active" | "Suspended"
}

interface UserRow {
  id: number

  email: string

  role: string

  status: "Active" | "Suspended"

  lastLogin: string
}

interface AuditRow {
  id: number

  timestamp: string

  actor: string

  action: string

  resource: string

  result: "success" | "failure"
}

// ─── Initial mock data ────────────────────────────────────────────────────────

const INITIAL_FLAGS: FeatureFlag[] = [
  {
    flag_name: "live_dispatch",

    enabled: false,

    description:
      "Send real emergency calls via Twilio. Requires two-admin approval to enable.",

    last_changed_by: "system",

    locked: true,
  },

  {
    flag_name: "background_location",

    enabled: false,

    description:
      "Track patient GPS in the background during an active SOS event.",

    last_changed_by: "admin@mojo.health",
  },

  {
    flag_name: "hospital_arrival_sms",

    enabled: false,

    description:
      "Send SMS to caregiver when patient is admitted to a linked hospital.",

    last_changed_by: "admin@mojo.health",
  },

  {
    flag_name: "release2_ecg_rhythm",

    enabled: false,

    description:
      "Enable ECG rhythm analysis tab in the Vitals screen (Phase 2 feature).",

    last_changed_by: "admin@mojo.health",
  },
]

const INITIAL_PENDING: ClinicianPending[] = [
  {
    id: 1,

    name: "Dr. J. Mwangi",

    licence: "KMP-12345",

    cadre: "Clinical Officer",

    submitted: "Oct 26, 2026",

    rejectMode: false,

    rejectReason: "",

    approved: false,

    rejected: false,
  },

  {
    id: 2,

    name: "Nurse A. Kamau",

    licence: "NCK-67890",

    cadre: "Nurse",

    submitted: "Oct 25, 2026",

    rejectMode: false,

    rejectReason: "",

    approved: false,

    rejected: false,
  },
]

const INITIAL_PROVIDERS: EmergencyProvider[] = [
  {
    id: 1,

    name: "Kenya Emergency Services",

    type: "ambulance",

    phone: "999",

    region: "Kenya",

    mode: "SANDBOX",

    priority: 1,

    testMsg: "",
  },

  {
    id: 2,

    name: "International SOS",

    type: "emergency_line",

    phone: "0800 720 720",

    region: "Kenya",

    mode: "SANDBOX",

    priority: 2,

    testMsg: "",
  },
]

const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 1,
    name: "Nairobi Hospital",
    level: "Level 5",
    er24h: true,
    ambulance: true,
    location: "-1.2921, 36.8219",
    active: true,
  },

  {
    id: 2,
    name: "Kenyatta National Hospital",
    level: "Level 6",
    er24h: true,
    ambulance: true,
    location: "-1.3010, 36.8067",
    active: true,
  },

  {
    id: 3,
    name: "Aga Khan University Hospital",
    level: "Level 5",
    er24h: true,
    ambulance: true,
    location: "-1.2634, 36.8022",
    active: true,
  },

  {
    id: 4,
    name: "M.P. Shah Hospital",
    level: "Level 4",
    er24h: true,
    ambulance: false,
    location: "-1.2764, 36.8165",
    active: true,
  },
]

const INITIAL_MODELS: DeviceModel[] = [
  {
    id: 1,
    model: "UB-201",
    manufacturer: "Rossmax",
    type: "BP Cuff",
    approved: true,
  },

  {
    id: 2,
    model: "GlucoCheck Pro",
    manufacturer: "Medline",
    type: "Glucose",
    approved: true,
  },

  {
    id: 3,
    model: "SmartScale S1",
    manufacturer: "Xiaomi",
    type: "Scale",
    approved: true,
  },
]

const INITIAL_FIRMWARE: FirmwareRelease[] = [
  {
    id: 1,
    version: "v1.2.3",
    model: "mojo_strap_a",
    rollout: 100,
    released: "Oct 1, 2026",
  },
]

const INITIAL_ORGS: OrgRow[] = [
  {
    id: 1,
    name: "Nairobi City Clinic",
    clinicians: 3,
    patients: 12,
    status: "Active",
  },
]

const INITIAL_USERS: UserRow[] = [
  {
    id: 1,
    email: "admin@mojo.health",
    role: "admin",
    status: "Active",
    lastLogin: "Oct 27, 2026 09:14",
  },

  {
    id: 2,
    email: "dr.mwangi@ncc.ke",
    role: "clinician",
    status: "Active",
    lastLogin: "Oct 26, 2026 16:02",
  },

  {
    id: 3,
    email: "patient.a@email.com",
    role: "patient",
    status: "Active",
    lastLogin: "Oct 27, 2026 08:55",
  },
]

const INITIAL_AUDIT: AuditRow[] = [
  {
    id: 1,
    timestamp: "2026-10-27 09:14:02",
    actor: "admin@mojo.health",
    action: "LOGIN",
    resource: "auth",
    result: "success",
  },

  {
    id: 2,
    timestamp: "2026-10-27 09:15:44",
    actor: "admin@mojo.health",
    action: "FLAG_READ",
    resource: "feature_flags",
    result: "success",
  },

  {
    id: 3,
    timestamp: "2026-10-26 16:03:11",
    actor: "dr.mwangi@ncc.ke",
    action: "BRIEF_VIEWED",
    resource: "patient/patient-a",
    result: "success",
  },

  {
    id: 4,
    timestamp: "2026-10-26 11:22:38",
    actor: "admin@mojo.health",
    action: "CLINICIAN_APPROVED",
    resource: "clinician/nck-11111",
    result: "success",
  },

  {
    id: 5,
    timestamp: "2026-10-25 08:07:55",
    actor: "system",
    action: "ESCALATION_TICK",
    resource: "escalation-worker",
    result: "success",
  },
]

// ─── Small shared components ───────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string onDone: () => void }) {
  return (
    <div
      style={{
        position: "fixed",

        bottom: 30,

        left: "50%",

        transform: "translateX(-50%)",

        background: "#EAF4F1",

        color: "#0B1A1F",

        padding: "13px 20px",

        borderRadius: 99,

        fontWeight: 700,

        fontSize: 13,

        zIndex: 100,

        display: "flex",

        alignItems: "center",

        gap: 8,

        boxShadow: "0 4px 24px rgba(0,0,0,.18)",

        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "#0E7C6B" }}>✓</span>
      {msg}
      <button
        onClick={onDone}
        style={{
          border: 0,

          background: "none",

          fontSize: 16,

          lineHeight: 1,

          padding: "0 0 0 6px",

          cursor: "pointer",

          color: "#4F6866",
        }}
      >
        ×
      </button>
    </div>
  )
}

function SectionHead({ title, sub }: { title: string sub?: string }) {
  return (
    <div className="dash-head" style={{ marginBottom: 20 }}>
      <div>
        {sub && <span style={{ fontSize: 12, color: "#4F6866" }}>{sub}</span>}
        <h1 style={{ fontSize: 24, margin: "2px 0 0" }}>{title}</h1>
      </div>
    </div>
  )
}

function AdminToggle({
  on,

  disabled,

  title,

  onChange,
}: {
  on: boolean

  disabled?: boolean

  title?: string

  onChange: () => void
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      title={title}
      disabled={disabled}
      className={`toggle ${on ? "on" : ""}`}
      onClick={onChange}
      style={{
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <i />
    </button>
  )
}

// ─── Section components ───────────────────────────────────────────────────────

function SystemHealth({
  flags,

  setFlags,

  onNavigateRouting,
}: {
  flags: FeatureFlag[]

  setFlags: (f: FeatureFlag[]) => void

  onNavigateRouting: () => void
}) {
  const toggleFlag = (name: string) => {
    const next = flags.map((f) =>
      f.flag_name === name ? { ...f, enabled: !f.enabled } : f,
    )

    setFlags(next)

    const flag = next.find((f) => f.flag_name === name)

    if (flag) {
      supabase

        .from("feature_flags")

        .update({ enabled: flag.enabled })

        .eq("flag_name", name)

        .then(() => undefined)
    }
  }

  const events = [
    { time: "2026-10-27 09:13:58", event: "escalation-tick ran", status: "OK" },

    {
      time: "2026-10-27 09:12:10",
      event: "Push delivery OK — 1 recipient",
      status: "OK",
    },

    {
      time: "2026-10-27 03:00:05",
      event: "DB backup completed (3.2 MB)",
      status: "OK",
    },
  ]

  return (
    <div>
      <SectionHead title="System health" sub="CR-ADM-02" />

      {/* Alert summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Active alerts", value: "2", accent: "#FF6B6B" },

          {
            label: "Dispatches today",
            value: "0",
            accent: "#3DD6B5",
            note: "sandbox",
          },

          { label: "Failed deliveries", value: "0", accent: "#3DD6B5" },
        ].map((c) => (
          <div
            key={c.label}
            className="card"
            style={{ textAlign: "center", padding: "20px 16px" }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: c.accent,
                lineHeight: 1,
              }}
            >
              {c.value}
            </div>
            <div style={{ fontSize: 13, color: "#4F6866", marginTop: 6 }}>
              {c.label}
            </div>
            {c.note && (
              <div
                style={{
                  display: "inline-block",

                  marginTop: 6,

                  background: "#DDF3EE",

                  color: "#0A5D50",

                  borderRadius: 99,

                  padding: "2px 8px",

                  fontSize: 10,

                  fontWeight: 700,

                  letterSpacing: ".04em",

                  textTransform: "uppercase",
                }}
              >
                {c.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sandbox banner */}
      <div
        className="card"
        style={{
          background: "#D0F4EE",

          border: "1.5px solid #3DD6B5",

          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",

          gap: 16,

          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              textTransform: "uppercase",

              fontSize: 11,

              fontWeight: 800,

              letterSpacing: ".06em",

              color: "#0A5D50",

              marginBottom: 4,
            }}
          >
            🔒 Sandbox mode active
          </div>
          <p
            style={{
              margin: 0,
              color: "#0A5D50",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Emergency dispatch is in <strong>SANDBOX mode</strong>. No real
            calls will be made. Switching to live requires two-admin approval.
          </p>
        </div>
        <button
          className="button outline"
          style={{
            color: "#0A5D50",
            borderColor: "#0A5D50",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onClick={onNavigateRouting}
        >
          Manage routing
        </button>
      </div>

      {/* Recent system events */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 14 }}>Recent system events</h2>
        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "1.8fr 0.5fr 1fr" }}
          >
            <span>Event</span>
            <span>Status</span>
            <span>Timestamp</span>
          </div>
          {events.map((e, i) => (
            <div
              className="tr"
              key={i}
              style={{ gridTemplateColumns: "1.8fr 0.5fr 1fr" }}
            >
              <span style={{ fontWeight: 600 }}>{e.event}</span>
              <span>
                <span
                  style={{
                    background: "#DDF3EE",

                    color: "#0A5D50",

                    borderRadius: 99,

                    padding: "3px 9px",

                    fontSize: 11,

                    fontWeight: 700,
                  }}
                >
                  {e.status}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 11,
                  color: "#4F6866",
                }}
              >
                {e.time}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature flags quick view */}
      <section className="card">
        <h2 style={{ marginBottom: 4 }}>Feature flags</h2>
        <p style={{ marginBottom: 14 }}>
          Quick view. Full detail and audit trail in{" "}
          <em
            style={{ fontStyle: "normal", color: "#0E7C6B", fontWeight: 700 }}
          >
            Audit log &amp; flags
          </em>
          .
        </p>
        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "1fr 2fr 80px" }}
          >
            <span>Flag</span>
            <span>Description</span>
            <span>Enabled</span>
          </div>
          {flags.map((f) => (
            <div
              className="tr"
              key={f.flag_name}
              style={{
                gridTemplateColumns: "1fr 2fr 80px",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {f.flag_name}
              </span>
              <span style={{ fontSize: 12, color: "#4F6866" }}>
                {f.description}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AdminToggle
                  on={f.enabled}
                  disabled={f.locked}
                  title={f.locked ? "Two-admin approval required" : undefined}
                  onChange={() => !f.locked && toggleFlag(f.flag_name)}
                />
                {f.locked && (
                  <span style={{ fontSize: 10, color: "#9DB6B4" }}>🔒</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ClinicianVerification() {
  const [pending, setPending] = useState<ClinicianPending[]>(INITIAL_PENDING)

  const [toast, setToast] = useState("")

  const [verifiedOpen, setVerifiedOpen] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)

    setTimeout(() => setToast(""), 3000)
  }

  const approve = (id: number) => {
    setPending((p) =>
      p.map((c) => (c.id === id ? { ...c, approved: true } : c)),
    )

    showToast("Clinician approved — notification sent")
  }

  const startReject = (id: number) => {
    setPending((p) =>
      p.map((c) => (c.id === id ? { ...c, rejectMode: true } : c)),
    )
  }

  const confirmReject = (id: number) => {
    setPending((p) =>
      p.map((c) =>
        c.id === id ? { ...c, rejected: true, rejectMode: false } : c,
      ),
    )

    showToast("Rejection sent with reason")
  }

  const requestInfo = (id: number) => {
    showToast(`Info request sent to clinician #${id}`)
  }

  return (
    <div>
      <SectionHead title="Clinician verification" sub="CR-ADM-03" />

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 14 }}>Pending queue</h2>
        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "1.2fr 0.9fr 1fr 0.9fr 1.4fr" }}
          >
            <span>Name</span>
            <span>Licence</span>
            <span>Cadre</span>
            <span>Submitted</span>
            <span>Actions</span>
          </div>
          {pending.map((c) => (
            <div key={c.id}>
              <div
                className="tr"
                style={{
                  gridTemplateColumns: "1.2fr 0.9fr 1fr 0.9fr 1.4fr",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontWeight: 700 }}>{c.name}</span>
                <span
                  style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}
                >
                  {c.licence}
                </span>
                <span>{c.cadre}</span>
                <span style={{ fontSize: 12, color: "#4F6866" }}>
                  {c.submitted}
                </span>
                <span>
                  {c.approved ? (
                    <span
                      style={{
                        background: "#DDF3EE",

                        color: "#0A5D50",

                        borderRadius: 99,

                        padding: "5px 12px",

                        fontSize: 12,

                        fontWeight: 700,
                      }}
                    >
                      ✓ Approved
                    </span>
                  ) : c.rejected ? (
                    <span
                      style={{
                        background: "#FDE3E3",

                        color: "#9B1C1C",

                        borderRadius: 99,

                        padding: "5px 12px",

                        fontSize: 12,

                        fontWeight: 700,
                      }}
                    >
                      Rejected
                    </span>
                  ) : (
                    <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        className="button primary"
                        style={{
                          minHeight: 32,
                          padding: "6px 12px",
                          fontSize: 12,
                        }}
                        onClick={() => approve(c.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="button outline"
                        style={{
                          minHeight: 32,
                          padding: "6px 12px",
                          fontSize: 12,
                        }}
                        onClick={() => requestInfo(c.id)}
                      >
                        Request info
                      </button>
                      <button
                        className="button danger"
                        style={{
                          minHeight: 32,
                          padding: "6px 12px",
                          fontSize: 12,
                        }}
                        onClick={() => startReject(c.id)}
                      >
                        Reject
                      </button>
                    </span>
                  )}
                </span>
              </div>
              {c.rejectMode && (
                <div
                  style={{
                    padding: "12px 0 14px 0",

                    borderTop: "1px solid #edf0ef",

                    display: "flex",

                    gap: 10,

                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Reason for rejection"
                    value={c.rejectReason}
                    onChange={(e) =>
                      setPending((p) =>
                        p.map((x) =>
                          x.id === c.id
                            ? { ...x, rejectReason: e.target.value }
                            : x,
                        ),
                      )
                    }
                    style={{
                      flex: 1,

                      border: "1px solid #DCE6E4",

                      borderRadius: 8,

                      padding: "9px 12px",

                      fontSize: 13,
                    }}
                  />
                  <button
                    className="button danger"
                    style={{ minHeight: 36, padding: "6px 14px", fontSize: 12 }}
                    onClick={() => confirmReject(c.id)}
                  >
                    Confirm rejection
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <button
          style={{
            border: 0,

            background: "none",

            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",

            width: "100%",

            cursor: "pointer",

            padding: 0,

            fontWeight: 700,

            fontSize: 15,
          }}
          onClick={() => setVerifiedOpen((v) => !v)}
        >
          <span>Recently verified (2)</span>
          <span style={{ fontSize: 18, color: "#4F6866" }}>
            {verifiedOpen ? "▲" : "▼"}
          </span>
        </button>
        {verifiedOpen && (
          <div className="table" style={{ marginTop: 14 }}>
            <div
              className="tr th"
              style={{ gridTemplateColumns: "1.2fr 0.9fr 1fr 0.9fr" }}
            >
              <span>Name</span>
              <span>Licence</span>
              <span>Cadre</span>
              <span>Verified</span>
            </div>
            {[
              {
                name: "Dr. P. Ochieng",
                licence: "KMP-11111",
                cadre: "General Practitioner",
                verified: "Oct 20, 2026",
              },

              {
                name: "Nurse B. Akinyi",
                licence: "NCK-22222",
                cadre: "Registered Nurse",
                verified: "Oct 18, 2026",
              },
            ].map((r) => (
              <div
                className="tr"
                key={r.licence}
                style={{ gridTemplateColumns: "1.2fr 0.9fr 1fr 0.9fr" }}
              >
                <span style={{ fontWeight: 700 }}>{r.name}</span>
                <span
                  style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}
                >
                  {r.licence}
                </span>
                <span>{r.cadre}</span>
                <span style={{ fontSize: 12, color: "#4F6866" }}>
                  {r.verified}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  )
}

function EmergencyRouting() {
  const [providers, setProviders] =
    useState<EmergencyProvider[]>(INITIAL_PROVIDERS)

  const [showAdd, setShowAdd] = useState(false)

  const [admin1, setAdmin1] = useState(false)

  const [admin2, setAdmin2] = useState(false)

  const [switchState, setSwitchState] = useState<"idle" | "sent">("idle")

  const [toast, setToast] = useState("")

  const [newProv, setNewProv] = useState({
    name: "",

    type: "ambulance",

    phone: "",

    region: "",

    mode: "SANDBOX",
  })

  const showToast = (msg: string) => {
    setToast(msg)

    setTimeout(() => setToast(""), 3000)
  }

  const testCall = (id: number) => {
    setProviders((p) =>
      p.map((r) =>
        r.id === id
          ? { ...r, testMsg: "Sandbox call initiated — check Twilio logs" }
          : r,
      ),
    )

    setTimeout(() => {
      setProviders((p) =>
        p.map((r) => (r.id === id ? { ...r, testMsg: "" } : r)),
      )
    }, 4000)
  }

  const addProvider = () => {
    if (!newProv.name || !newProv.phone) return

    setProviders((p) => [
      ...p,

      {
        id: Date.now(),

        name: newProv.name,

        type: newProv.type,

        phone: newProv.phone,

        region: newProv.region,

        mode: newProv.mode as "SANDBOX" | "LIVE",

        priority: p.length + 1,

        testMsg: "",
      },
    ])

    setNewProv({
      name: "",
      type: "ambulance",
      phone: "",
      region: "",
      mode: "SANDBOX",
    })

    setShowAdd(false)

    showToast("Provider added")
  }

  return (
    <div>
      <SectionHead title="Emergency routing" sub="CR-ADM-06" />

      {/* Provider table */}
      <section className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Providers</h2>
          <button
            className="button ink"
            style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
            onClick={() => setShowAdd((v) => !v)}
          >
            + Add provider
          </button>
        </div>

        <div className="table">
          <div
            className="tr th"
            style={{
              gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.5fr 1fr",
            }}
          >
            <span>Name</span>
            <span>Type</span>
            <span>Phone</span>
            <span>Region</span>
            <span>Mode</span>
            <span>Pri.</span>
            <span>Actions</span>
          </div>
          {providers.map((r) => (
            <div key={r.id}>
              <div
                className="tr"
                style={{
                  gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.5fr 1fr",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 700 }}>{r.name}</span>
                <span style={{ fontSize: 12, color: "#4F6866" }}>{r.type}</span>
                <span
                  style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}
                >
                  {r.phone}
                </span>
                <span style={{ fontSize: 12 }}>{r.region}</span>
                <span>
                  <span
                    style={{
                      background: r.mode === "LIVE" ? "#FDE3E3" : "#FFF0CC",

                      color: r.mode === "LIVE" ? "#9B1C1C" : "#7A5200",

                      borderRadius: 99,

                      padding: "3px 9px",

                      fontSize: 11,

                      fontWeight: 700,
                    }}
                  >
                    {r.mode}
                  </span>
                </span>
                <span style={{ fontWeight: 700 }}>{r.priority}</span>
                <span style={{ display: "flex", gap: 6 }}>
                  <button
                    className="button outline"
                    style={{ minHeight: 30, padding: "4px 10px", fontSize: 12 }}
                  >
                    Edit
                  </button>
                  <button
                    className="button ink"
                    style={{ minHeight: 30, padding: "4px 10px", fontSize: 12 }}
                    onClick={() => testCall(r.id)}
                  >
                    Test call
                  </button>
                </span>
              </div>
              {r.testMsg && (
                <div
                  style={{
                    padding: "8px 0 10px 0",

                    fontSize: 12,

                    color: "#0E7C6B",

                    fontWeight: 600,

                    borderTop: "1px solid #edf0ef",
                  }}
                >
                  ✓ {r.testMsg}
                </div>
              )}
            </div>
          ))}
        </div>

        {showAdd && (
          <div
            style={{
              marginTop: 18,

              borderTop: "1px solid #DCE6E4",

              paddingTop: 18,

              display: "grid",

              gridTemplateColumns: "1fr 1fr 1fr",

              gap: 12,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={newProv.name}
                onChange={(e) =>
                  setNewProv((p) => ({ ...p, name: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Type
              </label>
              <select
                value={newProv.type}
                onChange={(e) =>
                  setNewProv((p) => ({ ...p, type: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              >
                <option value="ambulance">ambulance</option>
                <option value="emergency_line">emergency_line</option>
                <option value="hospital">hospital</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Phone
              </label>
              <input
                type="text"
                value={newProv.phone}
                onChange={(e) =>
                  setNewProv((p) => ({ ...p, phone: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Region
              </label>
              <input
                type="text"
                value={newProv.region}
                onChange={(e) =>
                  setNewProv((p) => ({ ...p, region: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Mode
              </label>
              <select
                value={newProv.mode}
                onChange={(e) =>
                  setNewProv((p) => ({ ...p, mode: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              >
                <option value="SANDBOX">SANDBOX</option>
                <option value="LIVE">LIVE</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <button
                className="button primary"
                style={{ minHeight: 36, padding: "6px 16px", fontSize: 13 }}
                onClick={addProvider}
              >
                Save
              </button>
              <button
                className="button outline"
                style={{ minHeight: 36, padding: "6px 12px", fontSize: 13 }}
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Live switch panel */}
      <section
        className="card"
        style={{ border: "1.5px solid #FF6B6B", background: "#FFF5F5" }}
      >
        <div
          style={{
            display: "inline-block",

            background: "#FDE3E3",

            color: "#9B1C1C",

            borderRadius: 99,

            padding: "3px 10px",

            fontSize: 11,

            fontWeight: 800,

            letterSpacing: ".04em",

            textTransform: "uppercase",

            marginBottom: 10,
          }}
        >
          Danger zone
        </div>
        <h2 style={{ margin: "0 0 6px" }}>Switch to live dispatch</h2>
        <p style={{ color: "#9B1C1C", marginBottom: 16 }}>
          Enabling live dispatch will route real emergency calls through Twilio.
          This action requires confirmation from two separate admins and sends a
          verification code to both registered admin email addresses. It cannot
          be reversed without the same two-admin process.
        </p>

        {switchState === "idle" ? (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={admin1}
                  onChange={(e) => setAdmin1(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                Admin 1 confirmed — I understand this will enable real emergency
                calls
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={admin2}
                  onChange={(e) => setAdmin2(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                Admin 2 confirmed — second admin has verified and approves this
                change
              </label>
            </div>
            <button
              className="button danger"
              disabled={!admin1 || !admin2}
              style={{
                opacity: admin1 && admin2 ? 1 : 0.45,
                cursor: admin1 && admin2 ? "pointer" : "not-allowed",
              }}
              onClick={() => setSwitchState("sent")}
            >
              Switch to live
            </button>
          </>
        ) : (
          <div
            style={{
              background: "#DDF3EE",

              border: "1px solid #3DD6B5",

              borderRadius: 12,

              padding: "14px 18px",

              color: "#0A5D50",

              fontWeight: 600,

              fontSize: 14,
            }}
          >
            ✓ Confirmation code sent to both admins. Enter the codes in the
            confirmation dialog (sent by email) to complete the switch.
          </div>
        )}
      </section>

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  )
}

function HospitalDirectory() {
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS)

  const [importState, setImportState] = useState<"idle" | "loading" | "error">(
    "idle",
  )

  const [showAdd, setShowAdd] = useState(false)

  const [newHosp, setNewHosp] = useState({
    name: "",

    lat: "",

    lon: "",

    er24h: false,

    ambulance: false,
  })

  const [toast, setToast] = useState("")

  const showToast = (msg: string) => {
    setToast(msg)

    setTimeout(() => setToast(""), 3000)
  }

  const importKMHFL = () => {
    setImportState("loading")

    setTimeout(() => setImportState("error"), 1800)
  }

  const deactivate = (id: number) => {
    setHospitals((h) =>
      h.map((x) => (x.id === id ? { ...x, active: !x.active } : x)),
    )

    showToast("Facility status updated")
  }

  const addFacility = () => {
    if (!newHosp.name || !newHosp.lat || !newHosp.lon) return

    setHospitals((h) => [
      ...h,

      {
        id: Date.now(),

        name: newHosp.name,

        level: "Level 4",

        er24h: newHosp.er24h,

        ambulance: newHosp.ambulance,

        location: `${newHosp.lat}, ${newHosp.lon}`,

        active: true,
      },
    ])

    setNewHosp({ name: "", lat: "", lon: "", er24h: false, ambulance: false })

    setShowAdd(false)

    showToast("Facility added")
  }

  return (
    <div>
      <SectionHead title="Hospital directory" sub="CR-ADM-07" />

      {/* Import status */}
      <div
        className="card"
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",

          gap: 16,

          marginBottom: 20,

          background: "#FFFBEA",

          border: "1.5px solid #F59E0B",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,

              fontWeight: 800,

              textTransform: "uppercase",

              letterSpacing: ".04em",

              color: "#92400E",

              marginBottom: 4,
            }}
          >
            ⚠ KMHFL import
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#78350F" }}>
            0 facilities imported from KMHFL. Using {hospitals.length} fallback
            facilities.
          </p>
          {importState === "error" && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: "#9B1C1C",
                fontWeight: 600,
              }}
            >
              KMHFL API connection not configured. Add API key in environment
              variables.
            </p>
          )}
        </div>
        <button
          className="button outline"
          style={{
            borderColor: "#92400E",
            color: "#92400E",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onClick={importKMHFL}
          disabled={importState === "loading"}
        >
          {importState === "loading" ? "Connecting…" : "Import from KMHFL API"}
        </button>
      </div>

      {/* Facilities table */}
      <section className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Facilities</h2>
          <button
            className="button ink"
            style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
            onClick={() => setShowAdd((v) => !v)}
          >
            + Add manually
          </button>
        </div>

        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "1.5fr 0.7fr 0.7fr 0.7fr 1fr 0.8fr" }}
          >
            <span>Name</span>
            <span>Level</span>
            <span>24h ER</span>
            <span>Ambulance</span>
            <span>Location</span>
            <span>Actions</span>
          </div>
          {hospitals.map((h) => (
            <div
              className="tr"
              key={h.id}
              style={{
                gridTemplateColumns: "1.5fr 0.7fr 0.7fr 0.7fr 1fr 0.8fr",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: h.active ? "inherit" : "#9DB6B4",
                }}
              >
                {h.name}
                {!h.active && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      color: "#9B1C1C",
                      fontWeight: 700,
                    }}
                  >
                    inactive
                  </span>
                )}
              </span>
              <span style={{ fontSize: 12, color: "#4F6866" }}>{h.level}</span>
              <span style={{ fontSize: 16 }}>{h.er24h ? "✓" : "–"}</span>
              <span style={{ fontSize: 16 }}>{h.ambulance ? "✓" : "–"}</span>
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 11,
                  color: "#4F6866",
                }}
              >
                {h.location}
              </span>
              <span style={{ display: "flex", gap: 6 }}>
                <button
                  className="button outline"
                  style={{ minHeight: 30, padding: "4px 10px", fontSize: 12 }}
                >
                  Edit
                </button>
                <button
                  className={`button ${h.active ? "danger" : "outline"}`}
                  style={{ minHeight: 30, padding: "4px 10px", fontSize: 12 }}
                  onClick={() => deactivate(h.id)}
                >
                  {h.active ? "Deactivate" : "Activate"}
                </button>
              </span>
            </div>
          ))}
        </div>

        {showAdd && (
          <div
            style={{
              marginTop: 18,

              borderTop: "1px solid #DCE6E4",

              paddingTop: 18,

              display: "grid",

              gridTemplateColumns: "1fr 1fr 1fr",

              gap: 12,
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Facility name
              </label>
              <input
                type="text"
                value={newHosp.name}
                onChange={(e) =>
                  setNewHosp((h) => ({ ...h, name: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Latitude
              </label>
              <input
                type="text"
                value={newHosp.lat}
                onChange={(e) =>
                  setNewHosp((h) => ({ ...h, lat: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Longitude
              </label>
              <input
                type="text"
                value={newHosp.lon}
                onChange={(e) =>
                  setNewHosp((h) => ({ ...h, lon: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={newHosp.er24h}
                  onChange={(e) =>
                    setNewHosp((h) => ({ ...h, er24h: e.target.checked }))
                  }
                />
                24-hour emergency room
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={newHosp.ambulance}
                  onChange={(e) =>
                    setNewHosp((h) => ({ ...h, ambulance: e.target.checked }))
                  }
                />
                Ambulance on-site
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <button
                className="button primary"
                style={{ minHeight: 36, padding: "6px 16px", fontSize: 13 }}
                onClick={addFacility}
              >
                Save facility
              </button>
              <button
                className="button outline"
                style={{ minHeight: 36, padding: "6px 12px", fontSize: 13 }}
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  )
}

function DeviceInventory() {
  const [models, setModels] = useState<DeviceModel[]>(INITIAL_MODELS)

  const [firmware, setFirmware] = useState<FirmwareRelease[]>(INITIAL_FIRMWARE)

  const [showAddModel, setShowAddModel] = useState(false)

  const [showUploadFW, setShowUploadFW] = useState(false)

  const [toast, setToast] = useState("")

  const [newModel, setNewModel] = useState({
    model: "",
    manufacturer: "",
    type: "",
  })

  const [newFW, setNewFW] = useState({ version: "", model: "", rollout: 10 })

  const showToast = (msg: string) => {
    setToast(msg)

    setTimeout(() => setToast(""), 3000)
  }

  const revokeModel = (id: number) => {
    setModels((m) => m.filter((x) => x.id !== id))

    showToast("Approval revoked")
  }

  const addModel = () => {
    if (!newModel.model) return

    setModels((m) => [...m, { id: Date.now(), ...newModel, approved: true }])

    setNewModel({ model: "", manufacturer: "", type: "" })

    setShowAddModel(false)

    showToast("Model approved")
  }

  const uploadFirmware = () => {
    if (!newFW.version || !newFW.model) return

    setFirmware((f) => [
      ...f,

      {
        id: Date.now(),

        version: newFW.version,

        model: newFW.model,

        rollout: newFW.rollout,

        released: "Oct 27, 2026",
      },
    ])

    setNewFW({ version: "", model: "", rollout: 10 })

    setShowUploadFW(false)

    showToast("Firmware release queued")
  }

  return (
    <div>
      <SectionHead title="Device inventory" sub="CR-ADM-05" />

      {/* Approved models */}
      <section className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Approved add-on models</h2>
          <button
            className="button ink"
            style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
            onClick={() => setShowAddModel((v) => !v)}
          >
            + Add model
          </button>
        </div>
        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "1fr 1fr 1fr 0.5fr 0.6fr" }}
          >
            <span>Model</span>
            <span>Manufacturer</span>
            <span>Type</span>
            <span>Approved</span>
            <span>Actions</span>
          </div>
          {models.map((m) => (
            <div
              className="tr"
              key={m.id}
              style={{
                gridTemplateColumns: "1fr 1fr 1fr 0.5fr 0.6fr",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 700 }}>{m.model}</span>
              <span style={{ fontSize: 13 }}>{m.manufacturer}</span>
              <span style={{ fontSize: 13, color: "#4F6866" }}>{m.type}</span>
              <span style={{ fontSize: 16, color: "#0E7C6B" }}>✓</span>
              <span>
                <button
                  className="button danger"
                  style={{ minHeight: 30, padding: "4px 12px", fontSize: 12 }}
                  onClick={() => revokeModel(m.id)}
                >
                  Revoke
                </button>
              </span>
            </div>
          ))}
        </div>
        {showAddModel && (
          <div
            style={{
              marginTop: 18,

              borderTop: "1px solid #DCE6E4",

              paddingTop: 18,

              display: "grid",

              gridTemplateColumns: "1fr 1fr 1fr auto",

              gap: 12,

              alignItems: "flex-end",
            }}
          >
            {(["model", "manufacturer", "type"] as const).map((field) => (
              <div key={field}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#4F6866",
                    display: "block",
                    marginBottom: 4,
                    textTransform: "capitalize",
                  }}
                >
                  {field}
                </label>
                <input
                  type="text"
                  value={newModel[field]}
                  onChange={(e) =>
                    setNewModel((m) => ({ ...m, [field]: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    border: "1px solid #DCE6E4",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 13,
                  }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="button primary"
                style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
                onClick={addModel}
              >
                Approve
              </button>
              <button
                className="button outline"
                style={{ minHeight: 36, padding: "6px 10px", fontSize: 13 }}
                onClick={() => setShowAddModel(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Firmware releases — CR-STRAP-08 OTA admin side */}
      <section className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Firmware releases</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>
              CR-STRAP-08 · OTA admin side
            </p>
          </div>
          <button
            className="button ink"
            style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
            onClick={() => setShowUploadFW((v) => !v)}
          >
            Upload firmware
          </button>
        </div>
        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "0.8fr 1fr 0.8fr 1fr 0.6fr" }}
          >
            <span>Version</span>
            <span>Model</span>
            <span>Rollout %</span>
            <span>Released</span>
            <span>Actions</span>
          </div>
          {firmware.map((f) => (
            <div
              className="tr"
              key={f.id}
              style={{
                gridTemplateColumns: "0.8fr 1fr 0.8fr 1fr 0.6fr",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {f.version}
              </span>
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 12,
                  color: "#4F6866",
                }}
              >
                {f.model}
              </span>
              <span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: "#DCE6E4",
                      borderRadius: 3,
                      overflow: "hidden",
                      minWidth: 60,
                    }}
                  >
                    <div
                      style={{
                        width: `${f.rollout}%`,
                        height: "100%",
                        background: "#3DD6B5",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: f.rollout === 100 ? "#0E7C6B" : "#4F6866",
                    }}
                  >
                    {f.rollout}%
                  </span>
                </div>
              </span>
              <span style={{ fontSize: 12, color: "#4F6866" }}>
                {f.released}
              </span>
              <span>
                <button
                  className="button outline"
                  style={{ minHeight: 30, padding: "4px 10px", fontSize: 12 }}
                >
                  View notes
                </button>
              </span>
            </div>
          ))}
        </div>

        {showUploadFW && (
          <div
            style={{
              marginTop: 18,

              borderTop: "1px solid #DCE6E4",

              paddingTop: 18,

              display: "grid",

              gridTemplateColumns: "1fr 1fr 1fr",

              gap: 16,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Version (e.g. v1.3.0)
              </label>
              <input
                type="text"
                value={newFW.version}
                onChange={(e) =>
                  setNewFW((f) => ({ ...f, version: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Target model
              </label>
              <input
                type="text"
                value={newFW.model}
                onChange={(e) =>
                  setNewFW((f) => ({ ...f, model: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Initial rollout: {newFW.rollout}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={newFW.rollout}
                onChange={(e) =>
                  setNewFW((f) => ({ ...f, rollout: Number(e.target.value) }))
                }
                style={{ width: "100%", marginTop: 10 }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Firmware file
              </label>
              <input
                type="file"
                accept=".bin,.hex,.ota"
                style={{
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12,
                  width: "100%",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                gridColumn: "2 / -1",
              }}
            >
              <button
                className="button primary"
                style={{ minHeight: 36, padding: "6px 16px", fontSize: 13 }}
                onClick={uploadFirmware}
              >
                Queue release
              </button>
              <button
                className="button outline"
                style={{ minHeight: 36, padding: "6px 12px", fontSize: 13 }}
                onClick={() => setShowUploadFW(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  )
}

function UsersOrgs() {
  const [orgs, setOrgs] = useState<OrgRow[]>(INITIAL_ORGS)

  const [users, setUsers] = useState<UserRow[]>(INITIAL_USERS)

  const [showAddOrg, setShowAddOrg] = useState(false)

  const [newOrgName, setNewOrgName] = useState("")

  const [toast, setToast] = useState("")

  const showToast = (msg: string) => {
    setToast(msg)

    setTimeout(() => setToast(""), 3000)
  }

  const suspendUser = (id: number) => {
    setUsers((u) =>
      u.map((x) =>
        x.id === id
          ? { ...x, status: x.status === "Active" ? "Suspended" : "Active" }
          : x,
      ),
    )

    showToast("User status updated")
  }

  const resetMFA = (id: number) => {
    showToast(`MFA reset link sent to user #${id}`)
  }

  const addOrg = () => {
    if (!newOrgName) return

    setOrgs((o) => [
      ...o,
      {
        id: Date.now(),
        name: newOrgName,
        clinicians: 0,
        patients: 0,
        status: "Active",
      },
    ])

    setNewOrgName("")

    setShowAddOrg(false)

    showToast("Organisation created")
  }

  return (
    <div>
      <SectionHead title="Users & organisations" sub="CR-ADM-04" />

      {/* Organisations */}
      <section className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Organisations</h2>
          <button
            className="button ink"
            style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
            onClick={() => setShowAddOrg((v) => !v)}
          >
            + Add organisation
          </button>
        </div>
        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "1.5fr 0.7fr 0.7fr 0.7fr 0.6fr" }}
          >
            <span>Name</span>
            <span>Clinicians</span>
            <span>Patients</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {orgs.map((o) => (
            <div
              className="tr"
              key={o.id}
              style={{
                gridTemplateColumns: "1.5fr 0.7fr 0.7fr 0.7fr 0.6fr",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 700 }}>{o.name}</span>
              <span>{o.clinicians}</span>
              <span>{o.patients}</span>
              <span>
                <span
                  style={{
                    background: o.status === "Active" ? "#DDF3EE" : "#FDE3E3",

                    color: o.status === "Active" ? "#0A5D50" : "#9B1C1C",

                    borderRadius: 99,

                    padding: "3px 9px",

                    fontSize: 11,

                    fontWeight: 700,
                  }}
                >
                  {o.status}
                </span>
              </span>
              <span>
                <button
                  className="button outline"
                  style={{ minHeight: 30, padding: "4px 12px", fontSize: 12 }}
                >
                  Manage
                </button>
              </span>
            </div>
          ))}
        </div>
        {showAddOrg && (
          <div
            style={{
              marginTop: 18,

              borderTop: "1px solid #DCE6E4",

              paddingTop: 18,

              display: "flex",

              gap: 10,

              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F6866",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Organisation name
              </label>
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #DCE6E4",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              />
            </div>
            <button
              className="button primary"
              style={{ minHeight: 36, padding: "6px 16px", fontSize: 13 }}
              onClick={addOrg}
            >
              Create
            </button>
            <button
              className="button outline"
              style={{ minHeight: 36, padding: "6px 12px", fontSize: 13 }}
              onClick={() => setShowAddOrg(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* Users */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 14 }}>Users</h2>
        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "1.5fr 0.7fr 0.7fr 1.1fr 1fr" }}
          >
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Last login</span>
            <span>Actions</span>
          </div>
          {users.map((u) => (
            <div
              className="tr"
              key={u.id}
              style={{
                gridTemplateColumns: "1.5fr 0.7fr 0.7fr 1.1fr 1fr",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                {u.email}
              </span>
              <span>
                <span
                  style={{
                    background:
                      u.role === "admin"
                        ? "#E8E0F8"
                        : u.role === "clinician"
                          ? "#DDF3EE"
                          : "#F3F6F5",

                    color:
                      u.role === "admin"
                        ? "#4C1D95"
                        : u.role === "clinician"
                          ? "#0A5D50"
                          : "#4F6866",

                    borderRadius: 99,

                    padding: "3px 9px",

                    fontSize: 11,

                    fontWeight: 700,
                  }}
                >
                  {u.role}
                </span>
              </span>
              <span>
                <span
                  style={{
                    background: u.status === "Active" ? "#DDF3EE" : "#FDE3E3",

                    color: u.status === "Active" ? "#0A5D50" : "#9B1C1C",

                    borderRadius: 99,

                    padding: "3px 9px",

                    fontSize: 11,

                    fontWeight: 700,
                  }}
                >
                  {u.status}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 11,
                  color: "#4F6866",
                }}
              >
                {u.lastLogin}
              </span>
              <span style={{ display: "flex", gap: 6 }}>
                <button
                  className={`button ${
                    u.status === "Active" ? "danger" : "outline"
                  }`}
                  style={{ minHeight: 30, padding: "4px 10px", fontSize: 11 }}
                  onClick={() => suspendUser(u.id)}
                >
                  {u.status === "Active" ? "Suspend" : "Reinstate"}
                </button>
                <button
                  className="button outline"
                  style={{ minHeight: 30, padding: "4px 10px", fontSize: 11 }}
                  onClick={() => resetMFA(u.id)}
                >
                  Reset MFA
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Clinic manager note */}
      <div
        className="card"
        style={{
          background: "#F8F4FF",
          border: "1px solid #C4B5FD",
          padding: "16px 20px",
        }}
      >
        <div
          style={{
            fontSize: 11,

            fontWeight: 800,

            textTransform: "uppercase",

            letterSpacing: ".04em",

            color: "#4C1D95",

            marginBottom: 6,
          }}
        >
          org_admin role — behind feature flag
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#4C1D95" }}>
          The <strong>org_admin</strong> role (clinic manager) is behind the{" "}
          <code
            style={{
              background: "#EDE9FE",

              borderRadius: 4,

              padding: "1px 5px",

              fontFamily: "DM Mono, monospace",

              fontSize: 12,
            }}
          >
            org_admin_role
          </code>{" "}
          feature flag. Enable it in{" "}
          <em style={{ fontStyle: "normal", fontWeight: 700 }}>
            System health
          </em>{" "}
          when the first clinic onboards.
        </p>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  )
}

function AuditLog({
  flags,

  setFlags,
}: {
  flags: FeatureFlag[]

  setFlags: (f: FeatureFlag[]) => void
}) {
  const [audit] = useState<AuditRow[]>(INITIAL_AUDIT)

  const [toast, setToast] = useState("")

  const showToast = (msg: string) => {
    setToast(msg)

    setTimeout(() => setToast(""), 3000)
  }

  const toggleFlag = (name: string) => {
    const next = flags.map((f) =>
      f.flag_name === name ? { ...f, enabled: !f.enabled } : f,
    )

    setFlags(next)

    const flag = next.find((f) => f.flag_name === name)

    if (flag) {
      supabase

        .from("feature_flags")

        .update({ enabled: flag.enabled })

        .eq("flag_name", name)

        .then(() => undefined)
    }

    showToast("Flag updated")
  }

  const exportCSV = () => {
    const header = "timestamp,actor,action,resource,result\n"

    const rows = audit

      .map(
        (r) =>
          `${r.timestamp},${r.actor},${r.action},${r.resource},${r.result}`,
      )

      .join("\n")

    const blob = new Blob([header + rows], { type: "text/csv" })

    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")

    a.href = url

    a.download = "mojo-audit-log.csv"

    a.click()

    URL.revokeObjectURL(url)

    showToast("CSV exported")
  }

  const resultBadge = (result: "success" | "failure") => (
    <span
      style={{
        background: result === "success" ? "#DDF3EE" : "#FDE3E3",

        color: result === "success" ? "#0A5D50" : "#9B1C1C",

        borderRadius: 99,

        padding: "3px 9px",

        fontSize: 11,

        fontWeight: 700,
      }}
    >
      {result}
    </span>
  )

  return (
    <div>
      <SectionHead title="Audit log & flags" sub="CR-ADM-12" />

      {/* Audit log */}
      <section className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Audit log</h2>
          <button
            className="button outline"
            style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
            onClick={exportCSV}
          >
            Export CSV
          </button>
        </div>
        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "1.1fr 1.2fr 1fr 1fr 0.6fr" }}
          >
            <span>Timestamp</span>
            <span>Actor</span>
            <span>Action</span>
            <span>Resource</span>
            <span>Result</span>
          </div>
          {audit.map((r) => (
            <div
              className="tr"
              key={r.id}
              style={{
                gridTemplateColumns: "1.1fr 1.2fr 1fr 1fr 0.6fr",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 11,
                  color: "#4F6866",
                }}
              >
                {r.timestamp}
              </span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                {r.actor}
              </span>
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {r.action}
              </span>
              <span style={{ fontSize: 12, color: "#4F6866" }}>
                {r.resource}
              </span>
              <span>{resultBadge(r.result)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Notification templates note */}
      <section
        className="card"
        style={{
          background: "#FFFBEA",
          border: "1px solid #F59E0B",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,

            fontWeight: 800,

            textTransform: "uppercase",

            letterSpacing: ".04em",

            color: "#92400E",

            marginBottom: 6,
          }}
        >
          Notification templates — Phase 9
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#78350F" }}>
          The notification template table is not yet built. Templates are
          currently hardcoded in{" "}
          <code
            style={{
              background: "#FEF3C7",

              borderRadius: 4,

              padding: "1px 5px",

              fontFamily: "DM Mono, monospace",

              fontSize: 12,
            }}
          >
            escalation-tick
          </code>
          . This is scheduled for Phase 9.
        </p>
      </section>

      {/* Feature flags full table */}
      <section className="card">
        <h2 style={{ marginBottom: 4 }}>Feature flags — full detail</h2>
        <p style={{ marginBottom: 14 }}>
          All changes are written to the audit log above.
        </p>
        <div className="table">
          <div
            className="tr th"
            style={{ gridTemplateColumns: "1fr 1.8fr 1fr 0.7fr" }}
          >
            <span>Flag name</span>
            <span>Description</span>
            <span>Last changed by</span>
            <span>Enabled</span>
          </div>
          {flags.map((f) => (
            <div
              className="tr"
              key={f.flag_name}
              style={{
                gridTemplateColumns: "1fr 1.8fr 1fr 0.7fr",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {f.flag_name}
                {f.locked && (
                  <span style={{ marginLeft: 5, fontSize: 11 }}>🔒</span>
                )}
              </span>
              <span style={{ fontSize: 12, color: "#4F6866" }}>
                {f.description}
              </span>
              <span
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 11,
                  color: "#4F6866",
                }}
              >
                {f.last_changed_by}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AdminToggle
                  on={f.enabled}
                  disabled={f.locked}
                  title={f.locked ? "Two-admin approval required" : undefined}
                  onChange={() => !f.locked && toggleFlag(f.flag_name)}
                />
                <span
                  style={{
                    fontSize: 11,

                    fontWeight: 700,

                    color: f.enabled ? "#0E7C6B" : "#9DB6B4",
                  }}
                >
                  {f.enabled ? "ON" : "OFF"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  )
}

// ─── Main AdminPortal component ───────────────────────────────────────────────

export default function AdminPortal({ back }: { back: () => void }) {
  const [activeSection, setActiveSection] = useState<Section>("system-health")

  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS)

  const navItems: { id: Section label: string icon: string }[] = [
    { id: "system-health", label: "System health", icon: "⬡" },

    {
      id: "clinician-verification",
      label: "Clinician verification",
      icon: "✦",
    },

    { id: "emergency-routing", label: "Emergency routing", icon: "◈" },

    { id: "hospital-directory", label: "Hospital directory", icon: "+" },

    { id: "device-inventory", label: "Device inventory", icon: "◻" },

    { id: "users-orgs", label: "Users & organisations", icon: "◎" },

    { id: "audit-log", label: "Audit log & flags", icon: "≡" },
  ]

  return (
    <div
      className="clinician-shell"
      style={{ minHeight: 820, width: "min(1400px, 100%)" }}
    >
      {/* Sidebar */}
      <aside className="sidebar" style={{ width: 240 }}>
        {/* Back + brand */}
        <div style={{ marginBottom: 6 }}>
          <button
            onClick={back}
            style={{
              border: 0,

              background: "none",

              color: "#9DB6B4",

              fontSize: 12,

              padding: "0 0 12px 0",

              cursor: "pointer",

              display: "flex",

              alignItems: "center",

              gap: 4,
            }}
          >
            ‹ Back
          </button>
          <div className="brand">
            <span style={{ fontSize: 14 }}>🔒</span>
            <strong style={{ fontSize: 17 }}>Mojo Admin</strong>
          </div>
        </div>

        <nav style={{ marginTop: 22, display: "grid", gap: 4 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? "active" : ""}
              onClick={() => setActiveSection(item.id)}
              style={{
                border: 0,

                background:
                  activeSection === item.id ? "#16333b" : "transparent",

                color: activeSection === item.id ? "#3DD6B5" : "#9DB6B4",

                textAlign: "left",

                padding: "11px 13px",

                borderRadius: 10,

                fontSize: 13,

                fontWeight: activeSection === item.id ? 700 : 500,

                display: "flex",

                alignItems: "center",

                gap: 10,

                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* MFA indicator */}
        <div
          style={{
            marginTop: "auto",

            border: "1px solid rgba(255,255,255,.08)",

            borderRadius: 16,

            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: 7,

              color: "#3DD6B5",

              textTransform: "uppercase",

              fontSize: 10,

              fontWeight: 800,

              letterSpacing: ".06em",

              marginBottom: 6,
            }}
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>
            Admin session
          </div>
          <p
            style={{
              fontSize: 11,
              color: "#9DB6B4",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            MFA verified · Session expires in 4h
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="dashboard"
        style={{ padding: "34px 38px", flex: 1, minWidth: 0 }}
      >
        {activeSection === "system-health" && (
          <SystemHealth
            flags={flags}
            setFlags={setFlags}
            onNavigateRouting={() => setActiveSection("emergency-routing")}
          />
        )}
        {activeSection === "clinician-verification" && (
          <ClinicianVerification />
        )}
        {activeSection === "emergency-routing" && <EmergencyRouting />}
        {activeSection === "hospital-directory" && <HospitalDirectory />}
        {activeSection === "device-inventory" && <DeviceInventory />}
        {activeSection === "users-orgs" && <UsersOrgs />}
        {activeSection === "audit-log" && (
          <AuditLog flags={flags} setFlags={setFlags} />
        )}
      </main>
    </div>
  )
}
