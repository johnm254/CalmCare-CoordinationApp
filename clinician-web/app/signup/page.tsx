'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';
import { checkPasswordStrength } from '../../lib/password';
import { track } from '../../lib/analytics';

const CADRES = ['Doctor', 'Clinical Officer', 'Nurse'] as const;
const REGISTERING_BODIES = [
  { value: 'KMPDC', label: 'Kenya Medical Practitioners & Dentists Council (KMPDC)' },
  { value: 'COC', label: 'Clinical Officers Council (COC)' },
  { value: 'NCK', label: 'Nursing Council of Kenya (NCK)' },
] as const;

function StrengthBar({ password }: { password: string }) {
  const { errors } = checkPasswordStrength(password);
  const passing = 5 - errors.length;
  // 0 = empty, 1-2 = weak (red), 3 = fair (amber), 4-5 = strong (green)
  const color =
    password.length === 0
      ? '#D6CFC4'
      : passing <= 2
      ? '#C8102E'
      : passing === 3
      ? '#F1C76B'
      : '#1F7A72';

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: password.length > 0 && i <= passing ? color : '#D6CFC4' }}
          />
        ))}
      </div>
      {password.length > 0 && errors.length > 0 && (
        <ul className="space-y-0.5">
          {errors.map((err) => (
            <li key={err} className="text-xs text-[#C8102E] flex items-center gap-1.5">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.75 8.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM5.25 4.5a.75.75 0 011.5 0v2a.75.75 0 01-1.5 0v-2z" />
              </svg>
              {err}
            </li>
          ))}
        </ul>
      )}
      {password.length > 0 && errors.length === 0 && (
        <p className="text-xs text-[#1F7A72] flex items-center gap-1.5">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm3.03 4.47L5.28 8.22a.75.75 0 01-1.06 0L2.97 6.97a.75.75 0 111.06-1.06l.72.72 3.22-3.22a.75.75 0 011.06 1.06z" />
          </svg>
          Password meets all requirements
        </p>
      )}
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cadre, setCadre] = useState('');
  const [registeringBody, setRegisteringBody] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (fullName.trim().split(' ').length < 2) { setError('Please enter your first and last name.'); return; }
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (!cadre) { setError('Please select your professional cadre.'); return; }
    if (!registeringBody) { setError('Please select your registering body.'); return; }
    if (!licenceNumber.trim()) { setError('Licence / registration number is required.'); return; }

    const strengthResult = checkPasswordStrength(password);
    if (!strengthResult.valid) {
      setError('Password does not meet all requirements: ' + strengthResult.errors.join(', ') + '.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'clinician' },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.user) {
        setError('Sign-up failed. Please try again.');
        return;
      }

      const verRes = await fetch('/api/register-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          licenceNumber,
          cadre,
          registeringBody,
        }),
      });

      if (!verRes.ok) {
        const verJson = await verRes.json().catch(() => ({}));
        setError('Account created but verification record failed: ' + (verJson.error ?? 'Unknown error'));
        return;
      }

      track.signupComplete();
      router.push('/verification-pending');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-[#FFFFFF] border border-[#D6CFC4] rounded-xl px-4 py-3.5 text-[#0C1F20] placeholder:text-[#6B8588] focus:border-[#1F7A72] focus:outline-none focus:ring-2 focus:ring-[#1F7A72]/20 text-sm transition-colors disabled:opacity-50';

  return (
    <div className="min-h-screen bg-[#F5EFE3] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#12383A] to-[#12383A] flex-col items-center justify-center px-12 py-16 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
          <div className="relative mb-2">
            <div className="w-14 h-14 rounded-full border-2 border-white opacity-20 absolute inset-0" />
            <div className="absolute rounded-full border-2 border-white opacity-50" style={{ inset: 10 }} />
            <div className="absolute rounded-full bg-white opacity-30" style={{ inset: 20 }} />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-14 h-14 relative" aria-label="epimoyo">
          <rect x="4" y="4" width="88" height="88" rx="18" fill="rgba(255,255,255,0.15)"/>
          <rect x="16" y="16" width="12" height="64" fill="#1F7A72"/>
          <rect x="68" y="16" width="12" height="64" fill="#1F7A72"/>
          <polygon points="16,16 28,16 55,52 44,52" fill="#1F7A72"/>
          <polygon points="68,16 80,16 55,52 44,52" fill="#1F7A72"/>
        </svg>
          </div>
          <h1 className="text-white font-extrabold mt-3 leading-none" style={{ fontSize: '42px' }}>epimoyo</h1>
          <p className="text-white/80 text-sm mt-2 tracking-wide font-medium">Clinician & Nurse Portal</p>

          <div className="mt-10 w-full space-y-6">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 text-left">
              <p className="text-white font-semibold text-sm mb-2">Registration process</p>
              <ol className="space-y-2.5">
                {[
                  'Submit your details and licence number',
                  'Our team verifies your credentials (1–2 business days)',
                  'Receive email confirmation to activate your account',
                  'Set up two-factor authentication',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/70 text-xs">
                    <span className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <ul className="space-y-3 text-left w-full">
              {[
                'Licence verified against regulatory bodies',
                'Patient-controlled consent & data access',
                'HIPAA-aligned data handling',
              ].map((b) => (
                <li key={b} className="flex items-center gap-3 text-white/70 text-sm">
                  <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#F5EFE3] overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-12 h-12" aria-label="epimoyo">
          <rect x="4" y="4" width="88" height="88" rx="18" fill="#12383A"/>
          <rect x="16" y="16" width="12" height="64" fill="#1F7A72"/>
          <rect x="68" y="16" width="12" height="64" fill="#1F7A72"/>
          <polygon points="16,16 28,16 55,52 44,52" fill="#1F7A72"/>
          <polygon points="68,16 80,16 55,52 44,52" fill="#1F7A72"/>
        </svg>
          <p className="text-[#0C1F20] font-extrabold text-2xl mt-2">epimoyo</p>
          <p className="text-[#1F7A72] text-xs mt-1">Clinician & Nurse Portal</p>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-[#0C1F20] font-bold mb-1" style={{ fontSize: '28px' }}>Create your account</h2>
          <p className="text-[#3A5255] text-sm mb-8">Register as a clinician or nurse to access patient dashboards.</p>

          <form onSubmit={handleSignUp} className="space-y-5" noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="full-name" className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-2">
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                placeholder="Dr. Jane Mwangi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                autoComplete="name"
                className={inputClass}
                aria-label="Full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-2">
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
                className={inputClass}
                aria-label="Email address"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className={inputClass + ' pr-11'}
                  aria-label="Password"
                  aria-describedby="password-strength"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8588] hover:text-[#3A5255] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div id="password-strength" aria-live="polite">
                <StrengthBar password={password} />
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm-password" className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-2">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className={inputClass + ' pr-11'}
                  aria-label="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8588] hover:text-[#3A5255] transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="mt-1.5 text-xs text-[#C8102E]">Passwords do not match</p>
              )}
              {confirmPassword.length > 0 && confirmPassword === password && password.length > 0 && (
                <p className="mt-1.5 text-xs text-[#1F7A72]">Passwords match</p>
              )}
            </div>

            {/* Cadre */}
            <div>
              <label htmlFor="cadre" className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-2">
                Cadre
              </label>
              <select
                id="cadre"
                value={cadre}
                onChange={(e) => setCadre(e.target.value)}
                required
                disabled={loading}
                className={inputClass + ' cursor-pointer'}
                aria-label="Cadre"
              >
                <option value="" disabled>Select your cadre</option>
                {CADRES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Registering body */}
            <div>
              <label htmlFor="registering-body" className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-2">
                Registering body
              </label>
              <select
                id="registering-body"
                value={registeringBody}
                onChange={(e) => setRegisteringBody(e.target.value)}
                required
                disabled={loading}
                className={inputClass + ' cursor-pointer'}
                aria-label="Registering body"
              >
                <option value="" disabled>Select registering body</option>
                {REGISTERING_BODIES.map((rb) => (
                  <option key={rb.value} value={rb.value}>{rb.label}</option>
                ))}
              </select>
            </div>

            {/* Licence number */}
            <div>
              <label htmlFor="licence-number" className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-2">
                Licence number
              </label>
              <input
                id="licence-number"
                type="text"
                placeholder="e.g. KMPDC/2024/12345"
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value)}
                required
                disabled={loading}
                className={inputClass}
                aria-label="Licence number"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="bg-[rgba(200,16,46,0.08)] border border-[#C8102E]/30 rounded-xl px-4 py-3"
              >
                <p className="text-[#C8102E] text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1F7A72] text-[#F5EFE3] font-bold rounded-xl hover:bg-[#12383A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 mt-2 text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[#6B8588] text-xs mt-8">
            Already registered?{' '}
            <Link href="/login" className="text-[#3A5255] font-medium hover:text-[#1F7A72] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
