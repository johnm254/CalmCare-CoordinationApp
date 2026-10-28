import { useState } from "react"
import { supabase } from "../lib/supabase"

const CONDITIONS = [
  "Epilepsy",
  "Heart disease",
  "Arrhythmia / AF",
  "COPD",
  "Asthma",
  "Sleep apnoea",
  "Parkinson's disease",
  "Fall risk (elderly)",
  "Post-surgery recovery",
  "Fever / acute illness",
  "Lung infection recovery",
]

export default function OnboardingScreen({
  back,
  onComplete,
}: {
  back?: () => void
  onComplete?: () => void
}) {
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState<"en" | "sw">("en")
  const [guardianMode, setGuardianMode] = useState(false)
  const [guardianName, setGuardianName] = useState("")
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [clinicianEmail, setClinicianEmail] = useState("")
  const [careCircle, setCareCircle] = useState<{ name: string; phone: string }[]>([])
  const [careInput, setCareInput] = useState({ name: "", phone: "" })
  const [careError, setCareError] = useState("")

  const totalSteps = 8
  const finish = onComplete ?? back

  const sw: Record<string, string> = {
    "Choose your language": "Chagua lugha yako",
    "Continue": "Endelea",
    "Back": "Rudi",
  }
  const t = (en: string) => language === "sw" ? (sw[en] ?? en) : en

  const next = () => setStep((s) => Math.min(totalSteps, s + 1))
  const prev = () => setStep((s) => Math.max(1, s - 1))

  const toggleCondition = (c: string) =>
    setSelectedConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    )

  const addCareCircleMember = async () => {
    if (!careInput.phone.trim()) {
      setCareError("Phone number is required.")
      return
    }
    setCareError("")
    const member = { name: careInput.name.trim() || "Contact", phone: careInput.phone.trim() }
    setCareCircle((prev) => [...prev, member])
    await supabase
      .from("care_circle")
      .insert({
        contact_name: member.name,
        phone: member.phone,
        contact_status: "pending",
        invited_at: new Date().toISOString(),
      })
      .then(() => undefined)
    setCareInput({ name: "", phone: "" })
  }

  const progressBar = (
    <div style={{ padding: "16px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#9DB6B4", fontSize: 12 }}>
          {step} of {totalSteps}
        </span>
      </div>
      <div style={{ background: "#1e3540", borderRadius: 99, height: 4 }}>
        <div
          style={{
            background: "#3DD6B5",
            borderRadius: 99,
            height: 4,
            width: `${(step / totalSteps) * 100}%`,
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  )

  const backButton = step > 1 && (
    <button
      onClick={prev}
      style={{
        background: "transparent", border: 0, color: "#9DB6B4",
        fontSize: 14, cursor: "pointer", padding: "16px 20px 0",
        textAlign: "left",
      }}
    >
      &#8249; {t("Back")}
    </button>
  )

  // ── Step 1: Language ──────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="phone dark" style={{ display: "flex", flexDirection: "column" }}>
        {progressBar}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 24 }}>
          <h1 style={{ color: "#EAF4F1", fontSize: 24, fontWeight: 800, margin: 0, textAlign: "center" }}>
            {t("Choose your language")}
          </h1>
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            {(["en", "sw"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  flex: 1, padding: "16px 0", fontSize: 16, fontWeight: 700,
                  borderRadius: 12, cursor: "pointer",
                  background: language === lang ? "#3DD6B5" : "#1e3540",
                  color: language === lang ? "#062A24" : "#EAF4F1",
                  border: language === lang ? "none" : "1.5px solid #2a4a54",
                }}
              >
                {lang === "en" ? "English" : "Kiswahili"}
              </button>
            ))}
          </div>
          <button
            className="button ink"
            style={{ width: "100%", height: 52, fontSize: 16, fontWeight: 800 }}
            onClick={next}
          >
            {t("Continue")}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Consent ───────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="phone dark" style={{ display: "flex", flexDirection: "column" }}>
        {progressBar}
        {backButton}
        <div style={{ flex: 1, padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          <h1 style={{ color: "#EAF4F1", fontSize: 22, fontWeight: 800, margin: 0 }}>
            What Mojo does
          </h1>
          <p style={{ color: "#9DB6B4", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Mojo helps you share health information with people you trust. It does
            not diagnose or treat any condition.
          </p>
          <p style={{ color: "#9DB6B4", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            You decide who sees your data. You can change or remove access at any
            time. Your data is stored securely and never sold or shared with
            advertisers.
          </p>
          <div
            style={{
              background: "#112928", borderRadius: 12,
              padding: "14px 16px", fontSize: 13, color: "#9DB6B4",
            }}
          >
            By continuing you agree to the Mojo Terms of Service and Privacy
            Policy. You can withdraw your consent at any time from the Me tab.
          </div>
          <button
            className="button ink"
            style={{ width: "100%", height: 52, fontSize: 16, fontWeight: 800, marginTop: "auto" }}
            onClick={async () => {
              await supabase
                .from("consent_log")
                .insert({
                  consent_type: "platform_terms",
                  granted: true,
                  copy_version: 1,
                  consented_at: new Date().toISOString(),
                })
                .then(() => undefined)
              next()
            }}
          >
            I understand and agree
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Guardian ──────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="phone dark" style={{ display: "flex", flexDirection: "column" }}>
        {progressBar}
        {backButton}
        <div style={{ flex: 1, padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          <h1 style={{ color: "#EAF4F1", fontSize: 22, fontWeight: 800, margin: 0 }}>
            Who is this account for?
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "For myself", value: false },
              { label: "For someone in my care", value: true },
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setGuardianMode(value)}
                style={{
                  padding: "16px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                  textAlign: "left", cursor: "pointer",
                  background: guardianMode === value ? "#3DD6B5" : "#1e3540",
                  color: guardianMode === value ? "#062A24" : "#EAF4F1",
                  border: guardianMode === value ? "none" : "1.5px solid #2a4a54",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {guardianMode && (
            <div>
              <label style={{ color: "#9DB6B4", fontSize: 13, display: "block", marginBottom: 6 }}>
                Their name
              </label>
              <input
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Full name"
                style={{
                  width: "100%", background: "#1e3540", color: "#EAF4F1",
                  border: "1px solid #2a4a54", borderRadius: 10, padding: "12px",
                  fontSize: 14, boxSizing: "border-box",
                }}
              />
            </div>
          )}
          <button
            className="button ink"
            style={{ width: "100%", height: 52, fontSize: 16, fontWeight: 800, marginTop: "auto" }}
            onClick={next}
          >
            {t("Continue")}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 4: Conditions ────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="phone dark scroll-phone" style={{ display: "flex", flexDirection: "column" }}>
        {progressBar}
        {backButton}
        <div style={{ padding: "24px 24px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h1 style={{ color: "#EAF4F1", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              What are you monitoring?
            </h1>
            <p style={{ color: "#9DB6B4", fontSize: 13, margin: 0 }}>
              Select all that apply. You can change this later.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CONDITIONS.map((c) => {
              const selected = selectedConditions.includes(c)
              return (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  style={{
                    padding: "14px 16px", borderRadius: 12, fontSize: 14,
                    fontWeight: 600, textAlign: "left", cursor: "pointer",
                    background: selected ? "#112928" : "#1e3540",
                    color: selected ? "#3DD6B5" : "#EAF4F1",
                    border: selected ? "1.5px solid #3DD6B5" : "1.5px solid #2a4a54",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  {c}
                  {selected && (
                    <span style={{ color: "#3DD6B5", fontWeight: 800, fontSize: 16 }}>&#10003;</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ position: "sticky", bottom: 0, padding: "12px 24px 24px", background: "#0B1A1F" }}>
          <button
            className="button ink"
            style={{ width: "100%", height: 52, fontSize: 16, fontWeight: 800 }}
            onClick={next}
          >
            {selectedConditions.length > 0
              ? `Continue with ${selectedConditions.length} selected`
              : "Skip for now"}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 5: Invite clinician ──────────────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="phone dark" style={{ display: "flex", flexDirection: "column" }}>
        {progressBar}
        {backButton}
        <div style={{ flex: 1, padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h1 style={{ color: "#EAF4F1", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              Your clinician
            </h1>
            <p style={{ color: "#9DB6B4", fontSize: 13, margin: 0 }}>
              Invite your doctor or nurse. They will need to accept and be
              verified before they can see your data.
            </p>
          </div>
          <div>
            <label style={{ color: "#9DB6B4", fontSize: 13, display: "block", marginBottom: 6 }}>
              Email or licence number
            </label>
            <input
              value={clinicianEmail}
              onChange={(e) => setClinicianEmail(e.target.value)}
              placeholder="name@clinic.co.ke or KMP-12345"
              style={{
                width: "100%", background: "#1e3540", color: "#EAF4F1",
                border: "1px solid #2a4a54", borderRadius: 10, padding: "12px",
                fontSize: 14, boxSizing: "border-box",
              }}
            />
          </div>
          {clinicianEmail.trim() && (
            <button
              className="button ink"
              style={{ width: "100%", height: 48, fontSize: 15, fontWeight: 800 }}
              onClick={async () => {
                await supabase
                  .from("clinician_invitations")
                  .insert({ invitee_email: clinicianEmail.trim(), sent_at: new Date().toISOString() })
                  .then(() => undefined)
                next()
              }}
            >
              Send invitation
            </button>
          )}
          <button
            style={{ background: "transparent", border: 0, color: "#9DB6B4", fontSize: 14, cursor: "pointer", textDecoration: "underline" }}
            onClick={next}
          >
            Skip for now
          </button>
        </div>
      </div>
    )
  }

  // ── Step 6: Care Circle ───────────────────────────────────────────────────────
  if (step === 6) {
    return (
      <div className="phone dark scroll-phone" style={{ display: "flex", flexDirection: "column" }}>
        {progressBar}
        {backButton}
        <div style={{ padding: "24px 24px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h1 style={{ color: "#EAF4F1", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              Who should be alerted in an emergency?
            </h1>
            <p style={{ color: "#9DB6B4", fontSize: 13, margin: 0 }}>
              They will receive an SMS to confirm. Until they reply, they will
              not receive alerts.
            </p>
          </div>
          {careCircle.map((m, i) => (
            <div
              key={i}
              style={{
                background: "#112928", borderRadius: 10, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <div style={{ background: "#1e3540", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#3DD6B5", fontWeight: 800 }}>
                {m.name[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <strong style={{ color: "#EAF4F1", fontSize: 14 }}>{m.name}</strong>
                <span style={{ color: "#9DB6B4", fontSize: 12, display: "block" }}>
                  {m.phone} &middot; Pending SMS confirmation
                </span>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={careInput.name}
              onChange={(e) => setCareInput((p) => ({ ...p, name: e.target.value }))}
              placeholder="Name (optional)"
              style={{
                width: "100%", background: "#1e3540", color: "#EAF4F1",
                border: "1px solid #2a4a54", borderRadius: 10, padding: "12px",
                fontSize: 14, boxSizing: "border-box",
              }}
            />
            <input
              value={careInput.phone}
              onChange={(e) => setCareInput((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+254 7XX XXX XXX"
              type="tel"
              style={{
                width: "100%", background: "#1e3540", color: "#EAF4F1",
                border: "1px solid #2a4a54", borderRadius: 10, padding: "12px",
                fontSize: 14, boxSizing: "border-box",
              }}
            />
            {careError && <p style={{ color: "#FF6B6B", fontSize: 12, margin: 0 }}>{careError}</p>}
            <button
              className="button outline"
              style={{ height: 44, fontSize: 14, fontWeight: 700 }}
              onClick={addCareCircleMember}
            >
              + Add person
            </button>
          </div>
        </div>
        <div style={{ position: "sticky", bottom: 0, padding: "12px 24px 24px", background: "#0B1A1F" }}>
          <button
            className="button ink"
            style={{ width: "100%", height: 52, fontSize: 16, fontWeight: 800 }}
            onClick={next}
          >
            {careCircle.length > 0
              ? `Continue with ${careCircle.length} person${careCircle.length > 1 ? "s" : ""}`
              : "Skip for now"}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 7: Strap pairing ─────────────────────────────────────────────────────
  if (step === 7) {
    return (
      <div className="phone dark" style={{ display: "flex", flexDirection: "column" }}>
        {progressBar}
        {backButton}
        <div style={{ flex: 1, padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
          <div style={{ alignSelf: "flex-start" }}>
            <h1 style={{ color: "#EAF4F1", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              Pair your Mojo Strap
            </h1>
            <p style={{ color: "#9DB6B4", fontSize: 13, margin: 0 }}>
              The strap monitors your vitals and can send SOS automatically.
            </p>
          </div>
          <div
            style={{
              width: 140, height: 140, borderRadius: 24,
              background: "#112928", border: "2px dashed #2a4a54",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 8,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3DD6B5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="7" width="16" height="12" rx="2" />
              <path d="M7 7V5a5 5 0 0 1 10 0v2" />
              <circle cx="12" cy="13" r="1.5" />
            </svg>
            <span style={{ color: "#9DB6B4", fontSize: 12 }}>Mojo Strap</span>
          </div>
          <button
            className="button ink"
            style={{ width: "100%", height: 52, fontSize: 16, fontWeight: 800 }}
            onClick={next}
          >
            Scan for strap
          </button>
          <button
            style={{ background: "transparent", border: 0, color: "#9DB6B4", fontSize: 14, cursor: "pointer", textDecoration: "underline" }}
            onClick={next}
          >
            No strap yet — skip for now
          </button>
        </div>
      </div>
    )
  }

  // ── Step 8: Done ──────────────────────────────────────────────────────────────
  return (
    <div className="phone dark" style={{ display: "flex", flexDirection: "column" }}>
      {progressBar}
      <div style={{ flex: 1, padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#112928", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3DD6B5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>
          </div>
          <h1 style={{ color: "#EAF4F1", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
            You are set up
          </h1>
          <p style={{ color: "#9DB6B4", fontSize: 14, margin: 0 }}>
            Your account is ready. Here is what you set up:
          </p>
        </div>
        <section style={{ background: "#112928", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Language", value: language === "en" ? "English" : "Kiswahili" },
            { label: "Consent", value: "Given" },
            { label: "Conditions", value: selectedConditions.length > 0 ? `${selectedConditions.length} selected` : "None selected — update in Settings" },
            { label: "Care Circle", value: careCircle.length > 0 ? `${careCircle.length} person${careCircle.length > 1 ? "s" : ""} invited` : "None added yet" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9DB6B4", fontSize: 13 }}>{label}</span>
              <span style={{ color: "#EAF4F1", fontSize: 13, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </section>
        <p style={{ color: "#9DB6B4", fontSize: 12, textAlign: "center", margin: 0 }}>
          Mojo helps you share health trends. It does not diagnose or treat any condition.
        </p>
        <button
          className="button ink"
          style={{ width: "100%", height: 52, fontSize: 16, fontWeight: 800, marginTop: "auto" }}
          onClick={finish}
        >
          Go to Mojo
        </button>
      </div>
    </div>
  )
}
