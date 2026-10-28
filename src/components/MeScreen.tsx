import { useState, useEffect } from "react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Toggle({
  on,

  onChange,

  id,
}: {
  on: boolean

  onChange: (v: boolean) => void

  id?: string
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={on}
      className={`toggle ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <i />
    </button>
  )
}

function SectionCard({
  title,

  children,
}: {
  title?: string

  children: React.ReactNode
}) {
  return (
    <section className="card" style={{ marginBottom: 0 }}>
      {title && (
        <h2
          style={{
            fontSize: 16,
            fontWeight: 800,
            margin: "0 0 16px",
            color: "#EAF4F1",
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

function PermissionRow({
  label,

  description,

  on,

  onChange,

  labelColor,
}: {
  label: string

  description?: string

  on: boolean

  onChange: (v: boolean) => void

  labelColor?: string
}) {
  return (
    <div className="permission">
      <span>
        <strong style={labelColor ? { color: labelColor } : undefined}>
          {label}
        </strong>
        {description && <small>{description}</small>}
      </span>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function ProfileSection() {
  return (
    <SectionCard>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 56,

            height: 56,

            borderRadius: "50%",

            background: "#183239",

            color: "#3DD6B5",

            display: "grid",

            placeItems: "center",

            fontWeight: 800,

            fontSize: 22,

            flexShrink: 0,
          }}
        >
          A
        </div>
        <div style={{ flex: 1 }}>
          <strong
            style={{
              display: "block",
              fontSize: 16,
              color: "#EAF4F1",
              fontWeight: 800,
            }}
          >
            Amina Wanjiku
          </strong>
          <span
            style={{
              fontSize: 13,
              color: "#9DB6B4",
              display: "block",
              marginTop: 2,
            }}
          >
            +254 700 000 000
          </span>
          <span
            style={{
              fontSize: 13,
              color: "#9DB6B4",
              display: "block",
              marginTop: 1,
            }}
          >
            English
          </span>
        </div>
      </div>
      <button
        className="button outline"
        style={{ width: "100%", marginTop: 16, height: 44 }}
      >
        Edit profile
      </button>
    </SectionCard>
  )
}

function DevicesSection() {
  const [strapConnected] = useState(true)

  const [batteryPct] = useState(72)

  const [fwState, setFwState] = useState<"idle" | "checking" | "uptodate">(
    "idle",
  )

  const [healthSync, setHealthSync] = useState(false)

  const batteryColor =
    batteryPct < 20 ? "#FF6B6B" : batteryPct < 40 ? "#F5A623" : "#3DD6B5"

  const handleFwCheck = () => {
    if (fwState !== "idle") return

    setFwState("checking")

    setTimeout(() => setFwState("uptodate"), 2000)
  }

  return (
    <SectionCard title="My devices">
      {/* Battery low warning — CR-STRAP-07 */}
      {batteryPct < 20 && (
        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: 8,

            padding: "10px 14px",

            borderRadius: 12,

            background: "rgba(255,107,107,0.12)",

            border: "1px solid rgba(255,107,107,0.3)",

            marginBottom: 14,

            color: "#FF6B6B",

            fontSize: 13,

            fontWeight: 700,
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Battery low — charge your strap
        </div>
      )}

      {/* Amber warning 20-40% */}
      {batteryPct >= 20 && batteryPct < 40 && (
        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: 8,

            padding: "10px 14px",

            borderRadius: 12,

            background: "rgba(245,166,35,0.1)",

            border: "1px solid rgba(245,166,35,0.25)",

            marginBottom: 14,

            color: "#F5A623",

            fontSize: 13,

            fontWeight: 700,
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Battery getting low — consider charging soon
        </div>
      )}

      {/* Strap row */}
      <div
        style={{
          display: "flex",

          alignItems: "flex-start",

          gap: 13,

          paddingBottom: 16,

          borderBottom: "1px solid rgba(255,255,255,0.08)",

          marginBottom: 16,
        }}
      >
        {/* Strap icon */}
        <div
          style={{
            width: 44,

            height: 44,

            borderRadius: 14,

            background: "#183239",

            color: "#3DD6B5",

            display: "grid",

            placeItems: "center",

            flexShrink: 0,
          }}
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12h4l2-7 4 14 3-9 2 2h5" />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span
              style={{
                width: 8,

                height: 8,

                borderRadius: "50%",

                background: strapConnected ? "#3DD6B5" : "#4F6866",

                flexShrink: 0,
              }}
            />
            <strong style={{ fontSize: 14, color: "#EAF4F1" }}>
              Mojo Strap A
            </strong>
          </div>
          <span
            style={{
              fontSize: 12,
              color: "#9DB6B4",
              display: "block",
              marginTop: 2,
            }}
          >
            Firmware v1.2.3
          </span>

          {/* Battery bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <div
              style={{
                height: 6,

                width: 60,

                borderRadius: 3,

                background: "rgba(255,255,255,0.1)",

                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",

                  width: `${batteryPct}%`,

                  background: batteryColor,

                  borderRadius: 3,

                  transition: "width 0.3s",
                }}
              />
            </div>
            <span
              style={{ fontSize: 12, color: batteryColor, fontWeight: 700 }}
            >
              {batteryPct}%
            </span>
          </div>
        </div>
      </div>

      {/* OTA firmware check — CR-STRAP-08 */}
      <button
        className="button outline"
        onClick={handleFwCheck}
        style={{
          width: "100%",

          height: 44,

          marginBottom: 10,

          opacity: fwState === "checking" ? 0.7 : 1,
        }}
      >
        {fwState === "idle" && "Check for firmware update"}
        {fwState === "checking" && "Checking…"}
        {fwState === "uptodate" && (
          <>
            <svg
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3DD6B5"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
              style={{ marginRight: 6 }}
            >
              <path d="m4 12 5 5L20 6" />
            </svg>
            Up to date
          </>
        )}
      </button>

      <button
        className="button outline"
        style={{ width: "100%", height: 44, marginBottom: 20 }}
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          style={{ marginRight: 6 }}
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Pair a new device
      </button>

      {/* Add-on devices — CR-ADD-07 */}
      <h3
        style={{
          fontSize: 12,

          fontWeight: 800,

          textTransform: "uppercase",

          letterSpacing: "0.07em",

          color: "#3DD6B5",

          margin: "0 0 12px",
        }}
      >
        Add-on devices
      </h3>

      {[
        { name: "BP Cuff", status: "Not paired" },

        { name: "Glucose Meter", status: "Not paired" },

        { name: "Weight Scale", status: "Not paired" },
      ].map((device) => (
        <div
          key={device.name}
          style={{
            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",

            padding: "11px 0",

            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <strong style={{ fontSize: 14, color: "#EAF4F1" }}>
              {device.name}
            </strong>
            <span
              style={{
                fontSize: 12,
                color: "#9DB6B4",
                display: "block",
                marginTop: 2,
              }}
            >
              {device.status}
            </span>
          </div>
          <button
            className="button outline"
            style={{ height: 36, padding: "6px 16px", fontSize: 13 }}
          >
            Pair
          </button>
        </div>
      ))}

      {/* HealthKit / Health Connect toggle */}
      <div
        style={{
          marginTop: 16,

          padding: "14px",

          borderRadius: 14,

          background: "#0B1A1F",

          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",

            alignItems: "flex-start",

            justifyContent: "space-between",

            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 14, color: "#EAF4F1" }}>
              Apple Health / Google Health
            </strong>
            <p
              style={{
                margin: "4px 0 6px",

                fontSize: 12,

                color: "#9DB6B4",

                lineHeight: 1.5,
              }}
            >
              Sync BP, glucose, and weight from your health apps. Requires
              device testing.
            </p>
            <span
              style={{
                display: "inline-block",

                fontSize: 11,

                color: "#4F6866",

                background: "#12272D",

                padding: "3px 10px",

                borderRadius: 99,

                fontWeight: 700,
              }}
            >
              Requires device
            </span>
          </div>
          <Toggle on={healthSync} onChange={setHealthSync} />
        </div>
      </div>
    </SectionCard>
  )
}

function LocationSection({ navigate }: { navigate?: (s: string) => void }) {
  const [shareAlerts, setShareAlerts] = useState(true)

  const [bgLocation, setBgLocation] = useState(false)

  return (
    <SectionCard title="Location settings">
      <div
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",

          paddingBottom: 14,

          borderBottom: "1px solid rgba(255,255,255,0.08)",

          marginBottom: 4,
        }}
      >
        <div>
          <strong style={{ fontSize: 14, color: "#EAF4F1" }}>
            Home address
          </strong>
          <span
            style={{
              fontSize: 13,
              color: "#9DB6B4",
              display: "block",
              marginTop: 2,
            }}
          >
            12 Westlands Road, Nairobi
          </span>
        </div>
        <button
          className="button outline"
          style={{ height: 36, padding: "6px 14px", fontSize: 13 }}
          onClick={() => navigate?.("saved-places")}
        >
          Manage places
        </button>
      </div>

      <PermissionRow
        label="Share location during alerts only"
        description="Location is only shared when an SOS is active. We do not track you continuously."
        on={shareAlerts}
        onChange={setShareAlerts}
      />
      <PermissionRow
        label="Background location"
        description="Required if you want your location updated automatically during an alert. Off by default."
        on={bgLocation}
        onChange={setBgLocation}
      />
    </SectionCard>
  )
}

function PrivacySection() {
  const [showHistory, setShowHistory] = useState(false)

  const [toast, setToast] = useState(false)

  const [toastMsg, setToastMsg] = useState("")

  const [confirmDelete, setConfirmDelete] = useState(false)

  // CR-MED-05: mood data off by default
  const [moodShared, setMoodShared] = useState(false)

  // CR-SEC-03: live access history from audit_log
  const [accessHistory, setAccessHistory] = useState([
    { actor: "Dr. Mwangi", action: "viewed Vitals", date: "Oct 26" },
    { actor: "Contact A", action: "viewed Events", date: "Oct 24" },
    { actor: "Caregiver B", action: "viewed Schedule", date: "Oct 22" },
  ])

  useEffect(() => {
    import("../lib/supabase").then(({ supabase }) => {
      supabase
        .from("audit_log")
        .select("actor_role, category, accessed_at")
        .eq("patient_id", "demo-patient-id")
        .order("accessed_at", { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setAccessHistory(
              (data as { actor_role: string; category: string; accessed_at: string }[]).map((r) => ({
                actor: r.actor_role,
                action: `viewed ${r.category}`,
                date: new Date(r.accessed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
              })),
            )
          }
        })
    })
  }, [])

  const handleExport = () => {
    setToastMsg("Export request received. You will receive a copy within 30 days per the Kenya Data Protection Act.")
    setToast(true)
    setTimeout(() => setToast(false), 4000)
  }

  const toggleMood = async (on: boolean) => {
    setMoodShared(on)
    const { supabase } = await import("../lib/supabase")
    if (on) {
      await supabase
        .from("grants")
        .insert({ category: "mood", granted_at: new Date().toISOString() })
        .then(() => undefined)
    } else {
      await supabase
        .from("grants")
        .update({ revoked_at: new Date().toISOString() })
        .eq("category", "mood")
        .is("revoked_at", null)
        .then(() => undefined)
    }
  }

  return (
    <>
      <SectionCard title="Who can see what">
        {/* CR-MED-05: mood off by default */}
        <div className="permission" style={{ marginBottom: 14 }}>
          <span>
            <strong>Mood data</strong>
            <small>Off by default. Clinicians cannot see mood check-ins unless you grant access here.</small>
          </span>
          <button
            role="switch"
            aria-checked={moodShared}
            className={`toggle ${moodShared ? "on" : ""}`}
            onClick={() => toggleMood(!moodShared)}
          >
            <i />
          </button>
        </div>

        <button
          className="button outline"
          style={{ width: "100%", height: 44, marginBottom: 10 }}
          onClick={() => setShowHistory((v) => !v)}
        >
          {showHistory ? "Hide access history" : "Who viewed my data"}
        </button>

        {showHistory && (
          <div
            style={{
              marginBottom: 14,

              borderRadius: 14,

              overflow: "hidden",

              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {accessHistory.map((row, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px",

                  borderBottom:
                    i < accessHistory.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",

                  background: "#0B1A1F",
                }}
              >
                <strong style={{ fontSize: 13, color: "#EAF4F1" }}>
                  {row.actor} {row.action}
                </strong>
                <span
                  style={{
                    fontSize: 12,
                    color: "#9DB6B4",
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {row.date}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          className="button outline"
          style={{ width: "100%", height: 44, marginBottom: 10 }}
          onClick={handleExport}
        >
          Export my data
        </button>

        <button
          className="button danger"
          style={{ width: "100%", height: 44 }}
          onClick={() => setConfirmDelete(true)}
        >
          Delete my account
        </button>
      </SectionCard>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          style={{
            position: "absolute",

            inset: 0,

            background: "rgba(0,0,0,0.75)",

            display: "flex",

            alignItems: "flex-end",

            padding: 20,

            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#12272D",

              border: "1px solid rgba(255,255,255,0.08)",

              borderRadius: 24,

              padding: "24px 20px",

              width: "100%",
            }}
          >
            <h2
              style={{
                fontSize: 18,

                fontWeight: 800,

                color: "#EAF4F1",

                margin: "0 0 10px",
              }}
            >
              Delete account
            </h2>
            <p
              style={{
                color: "#9DB6B4",

                fontSize: 14,

                lineHeight: 1.6,

                margin: "0 0 22px",
              }}
            >
              This will delete all your data and cannot be undone. Are you sure?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="button outline"
                style={{ flex: 1, height: 48 }}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                className="button danger"
                style={{ flex: 1, height: 48 }}
                onClick={() => setConfirmDelete(false)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export toast */}
      {toast && (
        <div className="toast">
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0B1A1F"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m4 12 5 5L20 6" />
          </svg>
          {toastMsg || "Export prepared — check your email"}
        </div>
      )}
    </>
  )
}

function NotificationsSection() {
  const [medReminders, setMedReminders] = useState(true)

  const [careUpdates, setCareUpdates] = useState(true)

  const [lockScreen, setLockScreen] = useState(false)

  return (
    <SectionCard title="Notifications">
      <PermissionRow
        label="Medication reminders"
        on={medReminders}
        onChange={setMedReminders}
      />
      <PermissionRow
        label="Care circle updates"
        on={careUpdates}
        onChange={setCareUpdates}
      />
      {/* CR-SEC-11: lock-screen notification privacy */}
      <PermissionRow
        label="Show condition name in lock screen"
        description="Keeping this off protects your privacy if someone else sees your phone"
        on={lockScreen}
        onChange={setLockScreen}
        labelColor={lockScreen ? "#FF6B6B" : undefined}
      />
    </SectionCard>
  )
}

function AppInfoSection() {
  return (
    <SectionCard>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 40,

            height: 40,

            borderRadius: 12,

            background: "#3DD6B5",

            color: "#062A24",

            display: "grid",

            placeItems: "center",

            fontWeight: 800,

            fontSize: 16,

            flexShrink: 0,
          }}
        >
          M
        </div>
        <div>
          <strong style={{ fontSize: 14, color: "#EAF4F1" }}>
            Mojo v1.0.0
          </strong>
          <span
            style={{
              fontSize: 12,
              color: "#9DB6B4",
              display: "block",
              marginTop: 1,
            }}
          >
            Stage 7 prototype
          </span>
        </div>
      </div>

      <button
        className="button outline"
        style={{ width: "100%", height: 44, marginBottom: 10 }}
      >
        Send feedback
      </button>

      <div
        style={{
          display: "flex",

          gap: 16,

          justifyContent: "center",

          paddingTop: 10,
        }}
      >
        <button
          style={{
            background: "none",

            border: "none",

            color: "#3DD6B5",

            fontSize: 13,

            fontWeight: 700,

            cursor: "pointer",

            fontFamily: "inherit",

            textDecoration: "underline",
          }}
        >
          Terms of use
        </button>
        <button
          style={{
            background: "none",

            border: "none",

            color: "#3DD6B5",

            fontSize: 13,

            fontWeight: 700,

            cursor: "pointer",

            fontFamily: "inherit",

            textDecoration: "underline",
          }}
        >
          Privacy policy
        </button>
      </div>
    </SectionCard>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function MeScreen({
  back,
  navigate,
}: {
  back: () => void
  navigate?: (s: string) => void
}) {
  return (
    <div className="phone dark scroll-phone" style={{ position: "relative" }}>
      <header className="subhead">
        <button className="icon-button" onClick={back} aria-label="Go back">
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1>Me</h1>
      </header>

      <main className="mobile-content">
        <ProfileSection />
        <DevicesSection />
        <LocationSection navigate={navigate} />
        <PrivacySection />
        <NotificationsSection />
        <AppInfoSection />
      </main>
    </div>
  )
}
