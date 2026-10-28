import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import type { Role } from "../lib/auth"
import { PORTAL_PATH } from "../lib/auth"

const DEMO_ROLES: { role: Role; label: string; desc: string; color: string }[] = [
  { role: "patient", label: "Patient", desc: "Today screen, SOS, medications", color: "#3DD6B5" },
  { role: "caregiver", label: "Caregiver", desc: "Alerts, observations, directions", color: "#F5A623" },
  { role: "clinician", label: "Clinician", desc: "Roster, briefs, adherence", color: "#6C9EF8" },
  { role: "admin", label: "Admin", desc: "System, verifications, DPA", color: "#B07DFF" },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
  const [signupRole, setSignupRole] = useState<Role>("patient")

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (mode === "sign-in") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      const role: Role = (data.user?.user_metadata?.role as Role) ?? "patient"
      navigate(PORTAL_PATH[role], { replace: true })
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: signupRole } },
      })
      if (error) { setError(error.message); setLoading(false); return }
      setMode("sign-in")
      setError("")
      setLoading(false)
    }
  }

  const demoAccess = (role: Role) => {
    navigate(PORTAL_PATH[role])
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B1A1F",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Manrope', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
        <div style={{
          width: 44, height: 44, background: "#3DD6B5", borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 20, color: "#062A24",
        }}>M</div>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#EAF4F1", letterSpacing: "-0.5px" }}>Mojo</span>
        <span style={{ fontSize: 13, color: "#4F6866", marginLeft: 4, alignSelf: "flex-end", paddingBottom: 3 }}>
          Care coordination
        </span>
      </div>

      {/* Auth card */}
      <div style={{
        width: "100%", maxWidth: 420,
        background: "#12272D",
        borderRadius: 24,
        padding: "32px 28px",
        border: "1px solid rgba(255,255,255,0.07)",
        marginBottom: 32,
      }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#EAF4F1" }}>
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#4F6866" }}>
          {mode === "sign-in"
            ? "Use your Mojo account credentials."
            : "Set up a new Mojo account."}
        </p>

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#9DB6B4", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: "100%", background: "#0B1A1F", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "13px 14px", color: "#EAF4F1", fontSize: 15,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#9DB6B4", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%", background: "#0B1A1F", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "13px 14px", color: "#EAF4F1", fontSize: 15,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {mode === "sign-up" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9DB6B4", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>
                I am a
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["patient", "caregiver", "clinician", "admin"] as Role[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSignupRole(r)}
                    style={{
                      background: signupRole === r ? "#16443f" : "#0B1A1F",
                      border: signupRole === r ? "1.5px solid #3DD6B5" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, padding: "10px", color: signupRole === r ? "#3DD6B5" : "#9DB6B4",
                      fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: "#3b1414", border: "1px solid #9B1C1C", borderRadius: 10, padding: "10px 14px", color: "#FF6B6B", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#3DD6B5", color: "#062A24", border: 0, borderRadius: 12,
              padding: "14px", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, marginTop: 4,
            }}
          >
            {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => { setMode(m => m === "sign-in" ? "sign-up" : "sign-in"); setError("") }}
            style={{ background: "none", border: 0, color: "#3DD6B5", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
          >
            {mode === "sign-in" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>

      {/* Demo quick access */}
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: 11, color: "#4F6866", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Demo access</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {DEMO_ROLES.map(({ role, label, desc, color }) => (
            <button
              key={role}
              onClick={() => demoAccess(role)}
              style={{
                background: "#12272D", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: "16px 14px", textAlign: "left",
                cursor: "pointer", transition: "border-color .15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: 12, color: "#9DB6B4", lineHeight: 1.4 }}>{desc}</div>
            </button>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "#2A4A54" }}>
          Demo portals use seeded data — no auth required
        </p>
      </div>
    </div>
  )
}
