import { useState, useRef, useEffect } from "react"

import { supabase } from "./lib/supabase"

import { getCopy } from "./i18n/catalogue"

import { logAccess } from "./lib/audit"

import StitchDashboard from "./components/StitchDashboard"

import StitchGPS from "./components/StitchGPS"

import StitchMedications from "./components/StitchMedications"

import StitchVitals from "./components/StitchVitals"

import AlertsInbox from "./components/AlertsInbox"

import AdherenceReport from "./components/AdherenceReport"

import AlertLimitEditor from "./components/AlertLimitEditor"

import MedScheduleEditor from "./components/MedScheduleEditor"

import SavedPlaces from "./components/SavedPlaces"

import OnboardingScreen from "./components/OnboardingScreen"

import MeScreen from "./components/MeScreen"

import AdminPortal from "./components/AdminPortal"

import BleVitalsPanel from "./components/BleVitalsPanel"

import ContactsPicker from "./components/ContactsPicker"

import CaregiverMissedDose from "./components/CaregiverMissedDose"

import CaregiverDirections from "./components/CaregiverDirections"

type IconName = "home" | "pulse" | "users" | "file" | "bell" | "shield" | "pill" | "mic" | "check" | "arrow" | "plus" | "camera" | "image" | "close" | "upload" | "doc" | "trash" | "map" | "locate" | "heart" | "clock" | "power" | "phone"

function Icon({ name, size = 22 }: { name: IconName size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </>
    ),

    pulse: <path d="M2 12h4l2-7 4 14 3-9 2 2h5" />,

    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2" />
        <path d="M3 20c0-4 2-6 6-6s6 2 6 6M15 15c4 0 6 2 6 5" />
      </>
    ),

    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </>
    ),

    bell: (
      <>
        <path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z" />
        <path d="M10 21h4" />
      </>
    ),

    shield: (
      <>
        <path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),

    pill: (
      <>
        <path d="M7 17 17 7a4 4 0 0 0-6-6L1 11a4 4 0 0 0 6 6Z" />
        <path d="m7 5 6 6" />
      </>
    ),

    mic: (
      <>
        <rect x="9" y="2" width="6" height="13" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
      </>
    ),

    check: <path d="m4 12 5 5L20 6" />,

    arrow: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),

    plus: <path d="M12 5v14M5 12h14" />,

    camera: (
      <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),

    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),

    close: <path d="M18 6 6 18M6 6l12 12" />,

    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </>
    ),

    doc: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    ),

    trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
      </>
    ),

    map: (
      <>
        <path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3V6z" />
        <path d="M8 3v15M16 6v15" />
      </>
    ),

    locate: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </>
    ),

    heart: (
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),

    power: (
      <>
        <path d="M12 2v8" />
        <path d="M4.93 4.93a10 10 0 1 0 14.14 0" />
      </>
    ),

    phone: (
      <>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2.11 4.18 2 2 0 0 1 4.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  children,

  tone = "primary",

  onClick,

  className = "",
}: {
  children: React.ReactNode

  tone?: "primary" | "outline" | "danger" | "ink"

  onClick?: () => void

  className?: string
}) {
  return (
    <button className={`button ${tone} ${className}`} onClick={onClick}>
      {children}
    </button>
  )
}

function StateBar({
  state,
  setState,
}: {
  state: string
  setState: (s: string) => void
}) {
  const states = [
    "Default",
    "Offline",
    "Syncing",
    "Empty",
    "Error",
    "Large text",
  ]

  return (
    <div className="statebar" aria-label="Preview states">
      {states.map((s) => (
        <button
          className={state === s ? "active" : ""}
          onClick={() => setState(s)}
          key={s}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

function StatusBanner({ state }: { state: string }) {
  if (state === "Default" || state === "Large text") return null

  const copy: Record<string, string> = {
    Offline: "Saved on this device, will sync",

    Syncing: "Syncing securely…",

    Empty: "Nothing here yet",

    Error: "We couldn't refresh. Your saved data is safe.",
  }

  return (
    <div className={`status-banner ${state.toLowerCase()}`}>
      <span>{state === "Syncing" ? "↻" : state === "Error" ? "!" : "✓"}</span>
      {copy[state]}
    </div>
  )
}

function DuaraRing() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <circle cx="32" cy="32" r="26" stroke="#3DD6B5" strokeWidth="5" />
      <circle
        cx="32"
        cy="32"
        r="14"
        stroke="#3DD6B5"
        strokeWidth="4"
        strokeOpacity={0.45}
      />
      <circle cx="32" cy="32" r="5" fill="#3DD6B5" />
    </svg>
  )
}

function PatientHome({
  onSos,

  navigate,

  activeTab,
}: {
  onSos: () => void

  navigate: (s: string) => void

  activeTab: string
}) {
  const [medTaken, setMedTaken] = useState(false)

  const handleMedTaken = async () => {
    setMedTaken(true)

    // CR-MED-02: insert into dose_events (medication_logs is now a VIEW).

    // Look up the patient's first medication to satisfy the NOT NULL FK.

    const { data: session } = await supabase.auth.getSession()

    const patientId = session?.session?.user?.id

    if (!patientId) return

    const { data: med } = await supabase

      .from("medications")

      .select("id")

      .eq("patient_id", patientId)

      .limit(1)

      .single()

    if (!med?.id) return

    const now = new Date().toISOString()

    await supabase
      .from("dose_events")
      .insert({
        medication_id: med.id,

        patient_id: patientId,

        scheduled_for: now,

        confirmed_at: now,

        status: "taken",

        confirmed_via: "app",
      })
      .then(() => undefined)
  }

  return (
    <div className="phone dark">
      <header className="patient-head">
        <div className="init-avatar">E</div>
        <div style={{ flex: 1 }}>
          <span style={{ color: "#9DB6B4", fontSize: 13 }}>Good evening</span>
          <h1
            style={{
              fontSize: 20,
              margin: "2px 0 0",
              fontWeight: 800,
              letterSpacing: "-0.4px",
              color: "#EAF4F1",
            }}
          >
            Your care, your control
          </h1>
        </div>
        <button className="icon-button" aria-label="Notifications">
          <Icon name="bell" />
        </button>
      </header>

      <main className="mobile-content">
        <section className="card protection">
          <DuaraRing />
          <div>
            <div className="eyebrow jade">Protected</div>
            <h2>Your Circle is active</h2>
            <p>
              Trusted contacts are ready to be alerted the moment you need them.
            </p>
          </div>
        </section>

        <button className="sos-button sos-button-pulse" onClick={onSos}>
          <div>
            <strong>Hold to send SOS</strong>
            <span>Alerts your Circle with live location</span>
          </div>
          <div className="sos-icon">
            <Icon name="power" size={22} />
          </div>
        </button>

        <section className="card medication">
          <div className="icon-tile">
            <Icon name="pill" />
          </div>
          <div className="grow">
            <span>Next medication · 20:00</span>
            <h2>Levetiracetam 500 mg</h2>
          </div>
          {medTaken ? (
            <span style={{ color: "#3DD6B5", fontWeight: 800, fontSize: 22 }}>
              ✅
            </span>
          ) : (
            <Button onClick={handleMedTaken}>Taken</Button>
          )}
        </section>

        <p className="safety-note">
          Your reminders follow the schedule your clinician entered. Mojo never
          changes your dose.
        </p>

        <div className="tile-grid">
          {([
            ["pulse", "Conditions", "Types and triggers"],

            ["users", "Care Circle", "You decide who sees what"],

            ["shield", "My Doctor", "Verified clinician link"],

            ["file", "Records", "Events, notes, reports"],
          ] as [IconName, string, string][])

            .map(([icon, title, sub]) => (
              <button
                className="feature-tile"
                key={title}
                onClick={() => {
                  if (title === "Care Circle") navigate("circle")
                  else if (title === "Records") navigate("records")
                }}
              >
                <Icon name={icon} />
                <strong>{title}</strong>
                <span>{sub}</span>
              </button>
            ))}
        </div>

        {/* Stitch web dashboard tiles */}
        <div
          style={{
            margin: "6px 0 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <button
            className="feature-tile"
            onClick={() => navigate("stitch-dashboard")}
          >
            <Icon name="pulse" />
            <strong>New Dashboard</strong>
            <span>Full clinical telemetry</span>
          </button>
          <button
            className="feature-tile"
            onClick={() => navigate("stitch-gps")}
          >
            <Icon name="locate" />
            <strong>GPS Live</strong>
            <span>Emergency dispatch</span>
          </button>
          <button
            className="feature-tile"
            onClick={() => navigate("stitch-meds")}
          >
            <Icon name="pill" />
            <strong>Medications</strong>
            <span>Dosing &amp; consent</span>
          </button>
          <button
            className="feature-tile"
            onClick={() => navigate("stitch-vitals")}
          >
            <Icon name="heart" />
            <strong>Vitals</strong>
            <span>ECG &amp; biometrics</span>
          </button>
        </div>

        <BleVitalsPanel compact />

        <div
          style={{
            margin: "6px 0 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <button
            className="feature-tile"
            onClick={() => navigate("onboarding")}
          >
            <Icon name="check" />
            <strong>Onboarding</strong>
            <span>Complete your setup</span>
          </button>
        </div>

        <p className="safety-note">
          Mojo helps you and your care team watch trends. It does not diagnose
          or treat any condition.
        </p>
      </main>

      <nav className="bottom-nav">
        {([
          ["home", "Today", "home"],

          ["pulse", "Vitals", "insights"],

          ["pill", "Meds", "stitch-meds"],

          ["users", "Care", "circle"],

          ["shield", "Me", "me"],
        ] as [IconName, string, string][])

          .map(([icon, label, target]) => (
            <button
              key={label}
              aria-label={label}
              aria-current={activeTab === target ? "page" : undefined}
              className={activeTab === target ? "selected" : ""}
              onClick={() => navigate(target)}
            >
              <Icon name={icon} />
              <span aria-hidden="true">{label}</span>
            </button>
          ))}
      </nav>
    </div>
  )
}

function SosScreen({
  back,
  onDispatch,
}: {
  back: (sent?: boolean) => void
  onDispatch: (sosEventId: string) => void
}) {
  const [sent, setSent] = useState(false)

  const [cancelled, setCancelled] = useState(false)

  const [count, setCount] = useState(10)

  const [sosEventId, setSosEventId] = useState<string | null>(null)

  const [escalationState, setEscalationState] = useState("sent")

  useEffect(() => {
    if (sent) return

    const t = setInterval(() => setCount((c) => Math.max(0, c - 1)), 1000)

    return () => clearInterval(t)
  }, [sent])

  // Real-time: listen for escalation state changes after SOS is in DB

  useEffect(() => {
    if (!sosEventId) return

    const ch = supabase

      .channel(`sos-state-${sosEventId}`)

      .on(
        "postgres_changes",
        {
          event: "UPDATE",

          schema: "public",

          table: "alerts",

          filter: `sos_event_id=eq.${sosEventId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          if (typeof payload.new.state === "string")
            setEscalationState(payload.new.state)
        },
      )

      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [sosEventId])

  const handleSend = async () => {
    setSent(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: eventData } = await supabase

        .from("sos_events")

        .insert({
          patient_id: user?.id,

          sent_at: new Date().toISOString(),

          channel: "push",

          location: { latitude: -1.2921, longitude: 36.8219 },

          status: "sent",
        })

        .select("id")

        .single()

      const id = eventData?.id ?? crypto.randomUUID()

      setSosEventId(id)

      setTimeout(() => onDispatch(id), 800)
    } catch {
      // Fall back to a client-generated ID so the UI flow continues

      const id = crypto.randomUUID()

      setSosEventId(id)

      setTimeout(() => onDispatch(id), 800)
    }
  }

  const radius = 78

  const circumference = 2 * Math.PI * radius

  const dashoffset = circumference * (1 - count / 10)

  const sentCopy = getCopy("SOS-01-APP")

  const cancelCopy = getCopy("SOS-FA-APP")

  if (cancelled) {
    return (
      <div className="phone dark center-screen">
        <div className="eyebrow jade">Cancelled</div>
        <h1>SOS cancelled</h1>
        <p>{cancelCopy?.en ?? "Your SOS contact has been told you're OK."}</p>
        <Button tone="outline" onClick={() => back()}>
          Return home
        </Button>
      </div>
    )
  }

  if (sent) {
    const stateLabel: Record<string, string> = {
      sent: "Notifying your contacts",

      fall_check: "Checking if you are okay",

      raised: "Contacts alerted",

      awaiting_response: "Waiting for a response",

      dispatching: "Paramedics being called",

      resolved: "Escalation stopped — someone reached you",

      closed: "Escalation ended",
    }

    return (
      <div className="phone dark center-screen">
        <div className="sent-check">
          <Icon name="check" size={42} />
        </div>
        <div className="eyebrow coral">SOS sent</div>
        <h1>Your Circle has been alerted</h1>
        <p style={{ fontSize: 13, color: "#3DD6B5", marginBottom: 4 }}>
          {stateLabel[escalationState] ?? escalationState}
        </p>
        <p>{sentCopy?.en ?? "SOS sent. We've told your SOS contact."}</p>
        <Button tone="outline" onClick={() => back(true)}>
          Return home
        </Button>
      </div>
    )
  }

  return (
    <div className="phone dark sos-screen">
      <div className="eyebrow coral">
        <span className="dot coral-bg" /> SOS
      </div>

      <div
        className="countdown-wrap"
        role="timer"
        aria-live="assertive"
        aria-label={`${count} seconds to cancel`}
      >
        <svg viewBox="0 0 200 200" width={190} height={190} aria-hidden="true">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#1e3540"
            strokeWidth={12}
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#FF6B6B"
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            transform="rotate(-90 100 100)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="countdown-label" aria-hidden="true">
          <strong>{count}</strong>
          <span>seconds</span>
        </div>
      </div>

      <h1>Sending your SOS</h1>
      <p>Your emergency contacts will be alerted with your live location.</p>

      <section className="card compact-list">
        <div>
          <span>
            <strong>Push alert</strong>
            <small>Used when you are online</small>
          </span>
          <em>Ready</em>
        </div>
        <div>
          <span>
            <strong>SMS fallback</strong>
            <small>Used when you have no internet</small>
          </span>
          <em>Ready</em>
        </div>
        <div>
          <span>
            <strong>Emergency contacts</strong>
            <small>First to respond is shown to everyone</small>
          </span>
          <b>3</b>
        </div>
      </section>

      <div className="sos-actions">
        <Button tone="danger" onClick={handleSend}>
          Send now
        </Button>
        <Button tone="outline" onClick={() => setCancelled(true)}>
          Cancel, I am okay
        </Button>
      </div>
    </div>
  )
}

// Lazy-load EmergencyMap to avoid SSR issues with Leaflet

function AmbulanceScreen({
  onCancel,
  alertId,
}: {
  onCancel: () => void
  alertId?: string
}) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    onCancel: () => void
    alertId?: string
  }> | null>(null)

  useEffect(() => {
    import("./components/EmergencyMap").then((mod) => {
      setMapComponent(() => mod.default)
    })
  }, [])

  return (
    <div
      className="phone dark"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <header
        className="subhead"
        style={{ background: "#0B2A35", flexShrink: 0 }}
      >
        <button
          className="icon-button"
          onClick={onCancel}
          aria-label="Back"
          style={{ color: "#EAF4F1" }}
        >
          ‹
        </button>
        <h1 style={{ color: "#EAF4F1" }}>Emergency Dispatch</h1>
      </header>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {MapComponent ? (
          <MapComponent onCancel={onCancel} alertId={alertId} />
        ) : (
          <div
            style={{
              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              height: "100%",

              color: "#9DB6B4",

              fontSize: 15,
            }}
          >
            Loading map…
          </div>
        )}
      </div>
    </div>
  )
}

function CircleScreen({ back }: { back: () => void }) {
  const [toggles, setToggles] = useState([true, true, true, true, false])

  const [toast, setToast] = useState(false)

  const [toastMsg, setToastMsg] = useState("Sharing preference updated")

  const [showPicker, setShowPicker] = useState(false)

  const [contactBStatus, setContactBStatus] = useState<"pending" | "accepted">(
    "pending",
  )

  const labels = [
    ["Emergency alerts", "Receive your SOS with location"],

    ["Medication schedule", "Doses and reminders"],

    ["Appointments", "Dates and clinic details"],

    ["Event summaries", "What happened, without notes"],

    ["Records", "Reports and documents"],
  ]

  const toggle = (i: number) => {
    const next = [...toggles]

    next[i] = !next[i]

    setToggles(next)

    setToastMsg("Sharing preference updated")

    setToast(true)

    setTimeout(() => setToast(false), 1800)
  }

  const handleAcceptB = () => {
    setContactBStatus("accepted")

    supabase
      .from("care_circle")

      .update({ contact_status: "accepted" })

      .eq("contact_name", "Contact B")

      .then(() => undefined)

    setToastMsg("Contact B accepted via SMS")

    setToast(true)

    setTimeout(() => setToast(false), 2200)
  }

  return (
    <div className="phone dark scroll-phone">
      <header className="subhead">
        <button className="icon-button" onClick={back}>
          ‹
        </button>
        <h1>Care Circle</h1>
      </header>
      <main className="mobile-content">
        <p className="intro">
          You decide who sees what. Changes apply the next time their phone
          syncs, and you can remove access at any time.
        </p>
        <section className="card person-card">
          <div className="person">
            <div className="letter-avatar">A</div>
            <div>
              <h2>Contact A</h2>
              <p>Caregiver · emergency contact</p>
            </div>
            <span className="chip">{toggles.filter(Boolean).length} of 5</span>
          </div>
          {labels.map(([a, b], i) => (
            <div className="permission" key={a}>
              <span>
                <strong>{a}</strong>
                <small>{b}</small>
              </span>
              <button
                role="switch"
                aria-checked={toggles[i]}
                className={`toggle ${toggles[i] ? "on" : ""}`}
                onClick={() => toggle(i)}
              >
                <i />
              </button>
            </div>
          ))}
        </section>
        <section className="card person collapsed">
          <div className="letter-avatar">B</div>
          <div style={{ flex: 1 }}>
            <h2>Contact B</h2>
            <p>Family · emergency contact</p>
            {contactBStatus === "pending" ? (
              <span
                style={{
                  fontSize: 11,
                  color: "#F5A623",
                  display: "block",
                  marginTop: 2,
                }}
              >
                Pending SMS reply — not yet receiving alerts
              </span>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  color: "#3DD6B5",
                  display: "block",
                  marginTop: 2,
                }}
              >
                Active · accepted via SMS
              </span>
            )}
          </div>
          {contactBStatus === "pending" ? (
            <button
              style={{
                fontSize: 11,
                background: "#1e3540",
                color: "#F5A623",
                border: "1px solid #F5A623",
                borderRadius: 99,
                padding: "4px 10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={handleAcceptB}
            >
              Demo: accept
            </button>
          ) : (
            <span className="chip muted-chip">1 of 5</span>
          )}
        </section>
        <Button tone="outline" className="full">
          <Icon name="clock" size={16} /> See who viewed what
        </Button>
        <Button className="full" onClick={() => setShowPicker(true)}>
          Invite someone
        </Button>
      </main>
      {showPicker && (
        <ContactsPicker
          onAdd={() => setShowPicker(false)}
          onClose={() => setShowPicker(false)}
        />
      )}
      {toast && (
        <div className="toast">
          <Icon name="check" /> {toastMsg}
        </div>
      )}
    </div>
  )
}

function Insights({ back }: { back: () => void }) {
  const [logging, setLogging] = useState(false)

  const [text, setText] = useState(
    "Felt light-headed for a few minutes after dinner.",
  )

  return (
    <div className="phone dark scroll-phone">
      <header className="subhead">
        <button className="icon-button" onClick={back}>
          ‹
        </button>
        <h1>Insights</h1>
        <span className="chip muted-chip">Sample</span>
      </header>
      <main className="mobile-content">
        <section className="card insight">
          <div className="eyebrow jade">This week</div>
          <h2>
            You logged 2 events. Both came after a late or missed evening dose.
          </h2>
          <div className="insight-actions">
            <button className="insight-btn">Set an earlier reminder</button>
            <button className="insight-btn">See the logs</button>
          </div>
          <p>
            Built from <u>2 event logs</u> and <u>7 medication check-ins</u>.
            This is a pattern, not a diagnosis.
          </p>
        </section>
        <section className="card voice">
          <div>
            <h2>Log by voice</h2>
            <span className="jade">Works offline</span>
          </div>
          {logging ? (
            <div className="saved-log">
              <label>
                Editable saved log
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              <Button onClick={() => setLogging(false)}>Save log</Button>
            </div>
          ) : (
            <>
              <button className="mic" onClick={() => setLogging(true)}>
                <Icon name="mic" size={30} />
              </button>
              <p>
                Say what happened and Mojo turns it into a log you can edit.
              </p>
            </>
          )}
        </section>
        <section className="card brief">
          <div className="icon-tile">
            <Icon name="file" />
          </div>
          <div>
            <h2>Visit brief is ready</h2>
            <p>Review it, then share with your clinician</p>
          </div>
          <Button>Review</Button>
        </section>
        <p className="ai-rule">
          Mojo never diagnoses or changes your medication. Summaries are drafts
          built from source records.
        </p>
      </main>
    </div>
  )
}

// CR-CG-02: caregiver emergency alert — name and time first, calm styling,

// action buttons: reached / not reached / call / directions / nearest hospital.

function CaregiverScreen({
  activeSosEventId,
}: {
  activeSosEventId?: string | null
}) {
  const [alertActive, setAlertActive] = useState(false)

  const [responded, setResponded] = useState<"reached" | "not_reached" | null>(
    null,
  )

  const [showDirections, setShowDirections] = useState(false)

  const [demoSosEventId, setDemoSosEventId] = useState<string | null>(
    activeSosEventId ?? null,
  )

  const [alertState, setAlertState] = useState("raised")

  const alertTime = "20:07 EAT"

  const patientLat = -1.2921

  const patientLon = 36.8219

  const providerPhone = "999"

  // Real-time: listen for alert state changes while active

  useEffect(() => {
    if (!demoSosEventId || !alertActive) return

    const ch = supabase

      .channel(`cg-sos-${demoSosEventId}`)

      .on(
        "postgres_changes",
        {
          event: "UPDATE",

          schema: "public",

          table: "alerts",

          filter: `sos_event_id=eq.${demoSosEventId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          if (typeof payload.new.state === "string")
            setAlertState(payload.new.state)
        },
      )

      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [demoSosEventId, alertActive])

  const handleStartDemo = async () => {
    // Prefer the event ID from the patient SOS if available

    if (activeSosEventId) {
      setDemoSosEventId(activeSosEventId)

      setAlertActive(true)

      return
    }

    // Otherwise pick the most recent open SOS event

    const { data } = await supabase

      .from("sos_events")

      .select("id")

      .order("sent_at", { ascending: false })

      .limit(1)

      .single()

    setDemoSosEventId(data?.id ?? null)

    setAlertActive(true)
  }

  const handleResponse = async (type: "reached" | "not_reached") => {
    setResponded(type)

    if (!demoSosEventId) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase
      .from("sos_responses")
      .insert({
        sos_event_id: demoSosEventId,

        responder_id: user?.id,

        response_type: type,
      })
      .then(() => undefined)
  }

  if (alertActive && !responded) {
    // CR-CG-02: full-screen alert — calm, name and time first, no alarm capitals

    return (
      <div
        className="phone dark scroll-phone"
        style={{ background: "#0B1F1E" }}
      >
        <div
          style={{
            padding: "20px 20px 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              background: "#E24B4A",
              color: "#fff",
              borderRadius: 99,

              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".04em",
            }}
          >
            SOS
          </span>
          <span style={{ color: "#9DB6B4", fontSize: 13 }}>{alertTime}</span>
        </div>
        <main
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#EAF4F1",
                margin: "0 0 4px",
              }}
            >
              Amina Wanjiku pressed SOS
            </h1>
            <p style={{ fontSize: 14, color: "#9DB6B4", margin: 0 }}>
              Please check she is safe. Tap to respond.
            </p>
          </div>

          <div
            style={{
              background: "#112928",
              borderRadius: 16,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="locate" />
              <span style={{ color: "#9DB6B4", fontSize: 13 }}>
                Last known location
              </span>
            </div>
            <span style={{ color: "#EAF4F1", fontSize: 14, fontWeight: 600 }}>
              Westlands, Nairobi (-1.2921, 36.8219)
            </span>
            <a
              href={`https://maps.google.com/?q=${patientLat},${patientLon}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: "#2F7F79",
                color: "#EAF4F1",
                borderRadius: 99,

                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,

                textDecoration: "none",
                display: "inline-block",
                width: "fit-content",
              }}
            >
              Directions to Amina
            </a>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              style={{
                background: "#3DD6B5",
                color: "#062A24",
                border: 0,
                borderRadius: 99,

                padding: "14px",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
              }}
              onClick={() => handleResponse("reached")}
            >
              I have reached her
            </button>
            <button
              style={{
                background: "transparent",
                color: "#EAF4F1",
                border: "1.5px solid #3DD6B5",

                borderRadius: 99,
                padding: "14px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={() => handleResponse("not_reached")}
            >
              I cannot reach her
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <a
                href="tel:+254700000000"
                style={{
                  flex: 1,
                  background: "#112928",
                  color: "#EAF4F1",
                  borderRadius: 99,

                  padding: "12px",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",

                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Icon name="phone" /> Call her
              </a>
              <a
                href={`tel:${providerPhone}`}
                style={{
                  flex: 1,
                  background: "#E24B4A",
                  color: "#fff",
                  borderRadius: 99,

                  padding: "12px",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",

                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Icon name="phone" /> Ambulance
              </a>
            </div>
          </div>

          <p
            style={{
              fontSize: 11,
              color: "#4F6866",
              textAlign: "center",
              margin: "4px 0 0",
            }}
          >
            Telling us you cannot reach her keeps the escalation running.
          </p>
        </main>
      </div>
    )
  }

  if (alertActive && responded) {
    return (
      <div
        className="phone dark"
        style={{
          background: "#0B1F1E",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
        }}
      >
        <span style={{ fontSize: 48 }}>
          {responded === "reached" ? "✓" : "→"}
        </span>
        <p
          style={{
            color: "#EAF4F1",
            fontSize: 18,
            fontWeight: 700,
            textAlign: "center",
            margin: 0,
          }}
        >
          {responded === "reached"
            ? "Good. Escalation stopped."
            : "Logged. Escalation continues until someone reaches her."}
        </p>
        <button
          style={{
            background: "#2F7F79",
            color: "#fff",
            border: 0,
            borderRadius: 99,
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 8,
          }}
          onClick={() => {
            setAlertActive(false)
            setResponded(null)
          }}
        >
          Back to overview
        </button>
      </div>
    )
  }

  return (
    <div className="phone light caregiver">
      <header className="care-head">
        <div>
          <span>Caregiver</span>
          <h1>Looking after Amina Wanjiku</h1>
        </div>
        <span className="share-chip">
          <Icon name="shield" /> Shared with you
        </span>
      </header>
      <main className="mobile-content">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 0",
          }}
        >
          <img
            src="https://i.pravatar.cc/150?img=5"
            alt="Amina Wanjiku"
            className="avatar-img"
            style={{ width: 56, height: 56 }}
          />
          <div>
            <strong style={{ display: "block", fontSize: 16 }}>
              Amina Wanjiku
            </strong>
            <span style={{ fontSize: 13, color: "#4F6866" }}>Patient</span>
          </div>
        </div>

        <section className="alert-card">
          <div className="eyebrow coral">
            <span className="dot coral-bg" /> Emergency alert
          </div>
          <h2>No active alerts</h2>
          <p>
            You will be notified instantly, with live location, if an SOS is
            sent to your Circle.
          </p>
          <button
            style={{
              marginTop: 12,
              background: "#E24B4A",
              color: "#fff",
              border: 0,

              borderRadius: 99,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={handleStartDemo}
          >
            Demo: simulate SOS
          </button>
        </section>

        <CaregiverMissedDose
          patientName="Amina Wanjiku"
          drugName="Levetiracetam 500 mg"
          scheduledFor="20:00"
          onRemind={() => undefined}
          onMarkTaken={() => undefined}
          onDismiss={() => undefined}
        />

        <section className="card">
          <h2>What you can see</h2>
          <div className="chips">
            <span>Medication schedule</span>
            <span>Appointments</span>
            <span>Event summaries</span>
            <span className="off">Records · not shared</span>
          </div>
          <p>
            You only see information the patient or guardian has authorized.
            Access can be changed at any time.
          </p>
        </section>
        <section className="card today">
          <div>
            <h2>Today</h2>
            <span>Reminders</span>
          </div>
          <article>
            <div className="icon-tile">
              <Icon name="pill" />
            </div>
            <span>
              <strong>Evening medication</strong>
              <small>20:00 · reminder to confirm</small>
            </span>
          </article>
          <article>
            <div className="icon-tile">
              <Icon name="file" />
            </div>
            <span>
              <strong>Clinic follow-up</strong>
              <small>Upcoming · help with transport</small>
            </span>
          </article>
        </section>
      </main>
      <div className="sticky-action" style={{ display: "flex", gap: 10 }}>
        <Button tone="ink" onClick={() => setShowDirections(true)}>
          <Icon name="map" /> Directions
        </Button>
        <Button tone="ink">
          <Icon name="plus" /> Record an observation
        </Button>
      </div>

      {showDirections && (
        <CaregiverDirections
          patientAddress="Westlands, Nairobi"
          patientLat={patientLat}
          patientLon={patientLon}
          hospitalName="Aga Khan University Hospital"
          hospitalAddress="3rd Parklands Ave, Nairobi"
          hospitalLat={-1.3001}
          hospitalLon={36.8072}
          onClose={() => setShowDirections(false)}
        />
      )}
    </div>
  )
}

function Clinician() {
  const [brief, setBrief] = useState(false)

  const [approved, setApproved] = useState(false)

  const [clinicianScreen, setClinicianScreen] =
    useState<"dashboard" | "alerts" | "adherence" | "limits" | "schedules">(
      "dashboard",
    )

  useEffect(() => {
    logAccess("demo-patient-id", "vital_samples", "clinician_dashboard")
  }, [])

  if (clinicianScreen === "alerts") {
    return <AlertsInbox back={() => setClinicianScreen("dashboard")} />
  }

  if (clinicianScreen === "adherence") {
    return <AdherenceReport back={() => setClinicianScreen("dashboard")} />
  }

  if (clinicianScreen === "limits") {
    return <AlertLimitEditor back={() => setClinicianScreen("dashboard")} />
  }

  if (clinicianScreen === "schedules") {
    return <MedScheduleEditor back={() => setClinicianScreen("dashboard")} />
  }

  if (brief)
    return (
      <div className="clinician-shell">
        <Sidebar />
        <main className="dashboard brief-page">
          <button className="back-link" onClick={() => setBrief(false)}>
            ‹ Back to roster
          </button>
          <div className="dash-head">
            <div>
              <span>Pre-visit brief</span>
              <h1>Patient A</h1>
            </div>
            <div className="head-actions">
              <span className="draft-badge">AI draft · review before use</span>
              <Button tone="outline">Edit</Button>
              <Button tone="ink" onClick={() => setApproved(true)}>
                {approved ? "Approved and added" : "Approve and add to record"}
              </Button>
            </div>
          </div>
          <div className="brief-grid">
            <div>
              <section className="card">
                <h2>What changed since the last visit</h2>
                <ul className="source-list">
                  <li>
                    Two events were logged, both after a late or missed evening
                    dose. <u>Sources 1, 2</u>
                  </li>
                  <li>
                    One caregiver observation was added the same morning.{" "}
                    <u>Source 3</u>
                  </li>
                  <li>
                    Medication check-ins were on time on most days.{" "}
                    <u>Source 4</u>
                  </li>
                </ul>
              </section>
              <div className="two-cards">
                <section className="card">
                  <h2>Missed doses</h2>
                  <p>
                    Listed with the real time each check-in was tapped on the
                    patient's device.
                  </p>
                </section>
                <section className="card">
                  <h2>Open follow-ups</h2>
                  <p>
                    Tasks from the last visit and whether each was completed.
                  </p>
                </section>
              </div>
              <div className="audit-note">
                Mojo summarises what was logged. It does not diagnose or
                recommend treatment. Nothing is saved until you approve it.
              </div>
            </div>
            <section className="card sources">
              <h2>Sources</h2>
              {[
                "Event logged by patient",

                "Event logged by patient",

                "Observation by caregiver",

                "Medication check-ins",
              ].map((s, i) => (
                <div key={i}>
                  <b>{i + 1}</b>
                  <span>
                    <strong>{s}</strong>
                    <small>
                      {i < 2
                        ? "Today · 07:40"
                        : i === 2
                          ? "Today · 08:05"
                          : "This period"}
                    </small>
                  </span>
                </div>
              ))}
            </section>
          </div>
        </main>
      </div>
    )

  return (
    <div className="clinician-shell">
      <Sidebar />
      <main className="dashboard">
        <div className="dash-head">
          <div>
            <span>Clinician dashboard</span>
            <h1>Today across your patients</h1>
          </div>
          <div>
            <Button tone="outline">Request access</Button>
            <Button tone="ink">New follow-up</Button>
          </div>
        </div>
        <section className="card roster">
          <h2>Patient management</h2>
          <div className="table">
            <div className="tr th">
              <span>Patient</span>
              <span>Last event</span>
              <span>Medication</span>
              <span>Status</span>
            </div>
            {[
              ["Patient A", "Today, 07:40", "On schedule", "Review"],

              ["Patient B", "3 days ago", "Missed 1 dose", "Follow up"],

              ["Patient C", "Last month", "On schedule", "Stable"],
            ].map((r, i) => (
              <button
                className="tr"
                onClick={() => i === 0 && setBrief(true)}
                key={r[0]}
              >
                {r.map((x, j) => (
                  <span key={x} className={j === 3 ? `status s${i}` : ""}>
                    {x}
                  </span>
                ))}
              </button>
            ))}
          </div>
        </section>
        <div className="dash-grid">
          <section className="card chart-card">
            <div>
              <h2>Health trends · Patient A</h2>
              <span>Last 90 days</span>
            </div>
            <svg viewBox="0 0 600 180" preserveAspectRatio="none">
              <path
                d="M0 55 60 66 120 50 180 90 240 102 300 97 360 125 420 120 480 145 540 105 600 155"
                fill="none"
                stroke="#0E7C6B"
                strokeWidth="3"
              />
              <path d="M0 40H600M0 90H600M0 140H600" stroke="#DCE6E4" />
            </svg>
            <p>Sample trend. Select a point to open its linked event.</p>
          </section>
          <section className="card events">
            <h2>Events review</h2>
            <p>
              <i className="event-dot red" />{" "}
              <strong>Event logged by patient</strong>
              <small>Today · 07:40</small>
            </p>
            <p>
              <i className="event-dot green" />{" "}
              <strong>Observation added by caregiver</strong>
              <small>Today · 08:05</small>
            </p>
            <p>
              <i className="event-dot gray" />{" "}
              <strong>Awaiting your review</strong>
              <small>Add notes or schedule a follow-up</small>
            </p>
          </section>
        </div>
        <section className="follow-banner">
          <div>
            <h2>Follow-up management</h2>
            <p>Two patients are due for a check-in this week.</p>
          </div>
          <Button>Open queue</Button>
        </section>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            marginTop: 20,
          }}
        >
          <button
            className="card"
            style={{
              textAlign: "left",
              border: "1.5px solid #DCE6E4",
              cursor: "pointer",
              background: "#fff",
            }}
            onClick={() => setClinicianScreen("alerts")}
          >
            <div className="eyebrow jade" style={{ marginBottom: 6 }}>
              &#9679; CR-CLIN-08
            </div>
            <h2 style={{ marginBottom: 4 }}>Alerts inbox</h2>
            <p style={{ fontSize: 12, color: "#4F6866" }}>
              Review, acknowledge, and close patient alerts with escalation
              timelines.
            </p>
          </button>
          <button
            className="card"
            style={{
              textAlign: "left",
              border: "1.5px solid #DCE6E4",
              cursor: "pointer",
              background: "#fff",
            }}
            onClick={() => setClinicianScreen("adherence")}
          >
            <div className="eyebrow jade" style={{ marginBottom: 6 }}>
              &#9679; CR-CLIN-07
            </div>
            <h2 style={{ marginBottom: 4 }}>Adherence report</h2>
            <p style={{ fontSize: 12, color: "#4F6866" }}>
              Medication adherence overview with charts and CSV export.
            </p>
          </button>
          <button
            className="card"
            style={{
              textAlign: "left",
              border: "1.5px solid #DCE6E4",
              cursor: "pointer",
              background: "#fff",
            }}
            onClick={() => setClinicianScreen("limits")}
          >
            <div className="eyebrow jade" style={{ marginBottom: 6 }}>
              &#9679; CR-CLIN-05
            </div>
            <h2 style={{ marginBottom: 4 }}>Alert limit editor</h2>
            <p style={{ fontSize: 12, color: "#4F6866" }}>
              Set per-patient alert thresholds and apply condition templates.
            </p>
          </button>
          <button
            className="card"
            style={{
              textAlign: "left",
              border: "1.5px solid #DCE6E4",
              cursor: "pointer",
              background: "#fff",
            }}
            onClick={() => setClinicianScreen("schedules")}
          >
            <div className="eyebrow jade" style={{ marginBottom: 6 }}>
              &#9679; CR-CLIN-06
            </div>
            <h2 style={{ marginBottom: 4 }}>Medication schedules</h2>
            <p style={{ fontSize: 12, color: "#4F6866" }}>
              Set doses, times, escalation targets, and stock thresholds per
              patient.
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>M</span>
        <strong>Mojo</strong>
      </div>
      <nav>
        {[
          "Patient management",
          "Health trends",
          "Events review",
          "Follow-up management",
        ].map((x, i) => (
          <button className={i === 0 ? "active" : ""} key={x}>
            {x}
          </button>
        ))}
      </nav>
      <div className="verified">
        <div>
          <Icon name="shield" /> Verified clinician
        </div>
        <p>
          Every record view is consent-checked and written to an audit trail.
        </p>
      </div>
    </aside>
  )
}

function ImageUpload({
  onAdd,
  max = 4,
}: {
  onAdd?: (url: string) => void
  max?: number
}) {
  const [previews, setPreviews] = useState<string[]>([])

  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    Array.from(files)

      .slice(0, max - previews.length)

      .forEach((file) => {
        const url = URL.createObjectURL(file)

        setPreviews((p) => [...p, url])

        onAdd?.(url)
      })
  }

  const remove = (i: number) =>
    setPreviews((p) => p.filter((_, idx) => idx !== i))

  return (
    <div className="img-upload-root">
      {previews.length > 0 && (
        <div className="img-preview-grid">
          {previews.map((src, i) => (
            <div className="img-thumb" key={src}>
              <img src={src} alt={`Attachment ${i + 1}`} />
              <button
                className="img-remove"
                onClick={() => remove(i)}
                aria-label="Remove"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
          {previews.length < max && (
            <button
              className="img-add-more"
              onClick={() => inputRef.current?.click()}
            >
              <Icon name="plus" size={20} />
            </button>
          )}
        </div>
      )}
      {previews.length === 0 && (
        <button
          className="img-dropzone"
          onClick={() => inputRef.current?.click()}
        >
          <div className="img-drop-icon">
            <Icon name="camera" size={28} />
          </div>
          <strong>Add photo or document</strong>
          <span>Tap to browse your device</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

type RecordItem = {
  id: number

  title: string

  date: string

  type: "photo" | "doc" | "report"

  thumb?: string
}

function RecordsScreen({ back }: { back: () => void }) {
  const [tab, setTab] = useState<"all" | "photos" | "docs">("all")

  const [showUpload, setShowUpload] = useState(false)

  const [records, setRecords] = useState<RecordItem[]>([
    {
      id: 1,
      title: "Hospital discharge summary",
      date: "Oct 10, 2026",
      type: "doc",
    },

    {
      id: 2,
      title: "MRI scan — Oct 2026",
      date: "Oct 8, 2026",
      type: "report",
    },

    {
      id: 3,
      title: "Medication label photo",
      date: "Oct 5, 2026",
      type: "photo",
    },

    {
      id: 4,
      title: "Seizure observation",
      date: "Sep 29, 2026",
      type: "photo",
    },
  ])

  const filtered =
    tab === "all"
      ? records
      : tab === "photos"
        ? records.filter((r) => r.type === "photo")
        : records.filter((r) => r.type !== "photo")

  const addRecord = (url: string) => {
    setRecords((prev) => [
      {
        id: Date.now(),
        title: "New attachment",
        date: "Oct 17, 2026",
        type: "photo",
        thumb: url,
      },

      ...prev,
    ])

    setShowUpload(false)
  }

  const remove = (id: number) =>
    setRecords((prev) => prev.filter((r) => r.id !== id))

  return (
    <div className="phone dark scroll-phone">
      <header className="subhead">
        <button className="icon-button" onClick={back}>
          ‹
        </button>
        <h1>Records</h1>
        <button
          className="icon-button"
          onClick={() => setShowUpload((v) => !v)}
          aria-label="Add"
        >
          <Icon name="plus" />
        </button>
      </header>

      {showUpload && (
        <div className="records-upload-panel">
          <p className="upload-label">Attach a photo or document</p>
          <ImageUpload onAdd={addRecord} />
        </div>
      )}

      <div className="records-tabs">
        {(["all", "photos", "docs"] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t === "all" ? "All" : t === "photos" ? "Photos" : "Documents"}
          </button>
        ))}
      </div>

      <main className="mobile-content" style={{ paddingTop: 8 }}>
        {filtered.length === 0 && (
          <div className="records-empty">
            <Icon name="image" size={38} />
            <p>No {tab} yet. Tap + to add one.</p>
          </div>
        )}
        {filtered.map((r) => (
          <div className="record-row" key={r.id}>
            <div className="record-thumb">
              {r.thumb ? (
                <img src={r.thumb} alt="" />
              ) : r.type === "photo" ? (
                <Icon name="image" size={22} />
              ) : (
                <Icon name="doc" size={22} />
              )}
            </div>
            <div className="record-meta">
              <strong>{r.title}</strong>
              <span>
                {r.date} · {r.type}
              </span>
            </div>
            <button
              className="icon-button record-del"
              onClick={() => remove(r.id)}
              aria-label="Delete"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}

        <button className="records-add-btn" onClick={() => setShowUpload(true)}>
          <Icon name="upload" size={18} /> Upload new file
        </button>
      </main>
    </div>
  )
}

export default function App() {
  const [role, setRole] =
    useState<"patient" | "caregiver" | "clinician" | "admin">("patient")

  const [screen, setScreen] = useState("home")

  const [state, setState] = useState("Default")

  const [activeSosEventId, setActiveSosEventId] = useState<string | null>(null)

  // Register push token on mount.

  // On web this is a no-op; in the Expo mobile app replace this with:

  //   const token = await Notifications.getExpoPushTokenAsync();

  //   await supabase.from("push_tokens").upsert({ user_id: userId, token: token.data, platform: "ios" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      // Web push token registration would go here (requires VAPID setup)

      // For now log so developers can see it's wired

      console.debug("[push] would register token for user", user.id)
    })
  }, [])

  const navigate = (s: string) => setScreen(s)

  return (
    <div className={`app ${state === "Large text" ? "large-text" : ""}`}>
      <div className="preview-tools">
        <div className="role-switch">
          {["patient", "caregiver", "clinician", "admin"].map((r) => (
            <button
              key={r}
              className={role === r ? "active" : ""}
              onClick={() => {
                setRole(r as typeof role)

                setScreen("home")
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <StateBar state={state} setState={setState} />
      </div>
      <StatusBanner state={state} />
      <div className="stage">
        {role === "patient" ? (
          screen === "sos" ? (
            <SosScreen
              back={() => setScreen("home")}
              onDispatch={(id) => {
                setActiveSosEventId(id)
                setScreen("ambulance")
              }}
            />
          ) : screen === "ambulance" ? (
            <AmbulanceScreen
              onCancel={() => setScreen("home")}
              alertId={activeSosEventId ?? undefined}
            />
          ) : screen === "circle" ? (
            <CircleScreen back={() => setScreen("home")} />
          ) : screen === "insights" ? (
            <Insights back={() => setScreen("home")} />
          ) : screen === "records" ? (
            <RecordsScreen back={() => setScreen("home")} />
          ) : screen === "stitch-dashboard" ? (
            <StitchDashboard back={() => setScreen("home")} />
          ) : screen === "stitch-gps" ? (
            <StitchGPS back={() => setScreen("home")} />
          ) : screen === "stitch-meds" ? (
            <StitchMedications back={() => setScreen("home")} />
          ) : screen === "stitch-vitals" ? (
            <StitchVitals back={() => setScreen("home")} />
          ) : screen === "onboarding" ? (
            <OnboardingScreen onComplete={() => setScreen("home")} />
          ) : screen === "saved-places" ? (
            <SavedPlaces back={() => setScreen("me")} />
          ) : screen === "me" ? (
            <MeScreen back={() => setScreen("home")} navigate={navigate} />
          ) : (
            <PatientHome
              onSos={() => setScreen("sos")}
              navigate={navigate}
              activeTab={screen}
            />
          )
        ) : role === "caregiver" ? (
          <CaregiverScreen activeSosEventId={activeSosEventId} />
        ) : role === "admin" ? (
          <AdminPortal back={() => setRole("clinician")} />
        ) : (
          <Clinician />
        )}
      </div>
    </div>
  )
}
