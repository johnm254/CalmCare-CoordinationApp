"use client"

// Check role

// Check verification status

// Check MFA assurance level
/* Left panel */ /* Logo */ /* Right panel */ /* Mobile logo */

import { useState } from "react"

import { useRouter } from "next/navigation"

import Link from "next/link"

import { createClient } from "../../lib/supabase-browser"

function mapAuthError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Try again in 15 minutes."
  }

  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("email not confirmed")
  ) {
    return "Incorrect email or password. Please try again."
  }

  if (lower.includes("email") && lower.includes("not confirmed")) {
    return "Please confirm your email address before signing in."
  }

  if (lower.includes("user not found")) {
    return "No account found with that email address."
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error. Please check your connection and try again."
  }

  return message
}

export default function LoginPage() {
  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [error, setError] = useState("")

  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()

    setError("")

    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        { email, password },
      )

      if (authError) {
        setError(mapAuthError(authError.message))

        return
      }

      if (!data.user) {
        setError("Sign in failed. Please try again.")

        return
      }

      const { data: profile } = await supabase

        .from("profiles")

        .select("role")

        .eq("id", data.user.id)

        .single()

      if (
        profile &&
        profile.role !==
          "clinician" &&
        profile.role !==
          "admin"
      ) {
        await supabase.auth.signOut()

        setError(
          "This portal is for clinicians only. Please use the patient app.",
        )

        return
      }

      const { data: verification } = await supabase

        .from("clinician_verifications")

        .select("status, expires_at")

        .eq("clinician_id", data.user.id)

        .order("created_at", { ascending: false })

        .limit(1)

        .maybeSingle()

      if (verification) {
        const isExpired =
          verification.status ===
            "expired" ||
          (verification.expires_at &&
            new Date(verification.expires_at) <
              new Date())

        const effectiveStatus = isExpired ? "expired" : verification.status

        if (
          effectiveStatus !==
          "verified"
        ) {
          await supabase.auth.signOut()

          router.push("/verification-pending")

          return
        }
      }

      const { data: aalData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      if (aalData) {
        if (aalData.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
          router.push("/mfa-verify")

          router.refresh()

          return
        }
      }

      router.push("/dashboard")

      router.refresh()
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090F] flex">
      {}
      <div className="hidden lg:flex lg:w-[45%] bg-[#07060E] border-r border-[#2E2B50] flex-col items-center justify-center px-12 py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(139,92,246,0.07) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
          {}
          <div className="relative mb-2">
            <div className="w-14 h-14 rounded-full border-2 border-[#8B5CF6] opacity-20 absolute inset-0" />
            <div
              className="absolute rounded-full border-2 border-[#8B5CF6] opacity-50"
              style={{ inset: 10 }}
            />
            <div
              className="absolute rounded-full bg-[#8B5CF6]"
              style={{ inset: 20 }}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 96 96"
              className="w-14 h-14 relative"
              aria-hidden="true"
            >
              <circle cx="48" cy="48" r="10" fill="#8B5CF6" />
              <circle
                cx="48"
                cy="48"
                r="26"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="130 34"
                transform="rotate(-60 48 48)"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="#8B5CF6"
                strokeOpacity=".4"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="200 64"
                transform="rotate(100 48 48)"
              />
            </svg>
          </div>

          <h1
            className="text-[#F5F0FF] font-extrabold mt-3 leading-none"
            style={{ fontSize: "42px" }}
          >
            Duara
          </h1>
          <p className="text-[#8B5CF6] text-sm mt-2 tracking-wide font-medium">
            Clinician Portal
          </p>

          <div className="mt-8 w-full max-w-xs mx-auto">
            <img
              src="/illustrations/hero-clinician.svg"
              alt="Clinician illustration"
              className="w-full h-auto opacity-90"
            />
          </div>

          <ul className="mt-8 space-y-3 text-left w-full">
            {[
              { label: "HIPAA-aligned data handling" },

              { label: "Patient-controlled consent" },

              { label: "Real-time SOS alerts" },
            ].map((b) => (
              <li
                key={b.label}
                className="flex items-center gap-3 text-[#9B96C0] text-sm"
              >
                <svg
                  className="w-4 h-4 text-[#8B5CF6] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#09090F]">
        {}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 96 96"
            className="w-12 h-12"
            aria-hidden="true"
          >
            <circle cx="48" cy="48" r="10" fill="#8B5CF6" />
            <circle
              cx="48"
              cy="48"
              r="26"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="130 34"
              transform="rotate(-60 48 48)"
            />
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="#8B5CF6"
              strokeOpacity=".4"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="200 64"
              transform="rotate(100 48 48)"
            />
          </svg>
          <p className="text-[#F5F0FF] font-extrabold text-2xl mt-2">Duara</p>
          <p className="text-[#8B5CF6] text-xs mt-1">Clinician Portal</p>
        </div>

        <div className="w-full max-w-md">
          <h2
            className="text-[#F5F0FF] font-bold mb-1"
            style={{ fontSize: "28px" }}
          >
            Welcome back
          </h2>
          <p className="text-[#9B96C0] text-sm mb-8">
            Sign in to your patient dashboard.
          </p>

          <form onSubmit={handleSignIn} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="w-full bg-[#14122A] border border-[#2E2B50] rounded-xl px-4 py-3.5 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 text-sm transition-colors disabled:opacity-50"
                aria-label="Email address"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[#9B96C0] text-xs hover:text-[#8B5CF6] transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="w-full bg-[#14122A] border border-[#2E2B50] rounded-xl px-4 py-3.5 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 text-sm transition-colors disabled:opacity-50"
                aria-label="Password"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/40 rounded-xl px-4 py-3"
              >
                <p className="text-[#EF4444] text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8B5CF6] text-[#09090F] font-bold rounded-xl hover:bg-[#00A896] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 mt-2 text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeOpacity=".3"
                    />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2E2B50] text-center">
            <p className="text-[#504C78] text-xs">
              New clinician?{" "}
              <Link
                href="/signup"
                className="text-[#9B96C0] font-medium hover:text-[#8B5CF6] transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
