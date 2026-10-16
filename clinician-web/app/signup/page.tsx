'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';
import { checkPasswordStrength } from '../../lib/password';

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
      ? '#1A3265'
      : passing <= 2
      ? '#EF4444'
      : passing === 3
      ? '#F4B860'
      : '#22C87A';

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: password.length > 0 && i <= passing ? color : '#1A3265' }}
          />
        ))}
      </div>
      {password.length > 0 && errors.length > 0 && (
        <ul className="space-y-0.5">
          {errors.map((err) => (
            <li key={err} className="text-xs text-[#EF4444] flex items-center gap-1.5">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.75 8.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM5.25 4.5a.75.75 0 011.5 0v2a.75.75 0 01-1.5 0v-2z" />
              </svg>
              {err}
            </li>
          ))}
        </ul>
      )}
      {password.length > 0 && errors.length === 0 && (
        <p className="text-xs text-[#22C87A] flex items-center gap-1.5">
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

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

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

      const { error: verErr } = await supabase.from('clinician_verifications').insert({
        clinician_id: data.user.id,
        licence_number: licenceNumber,
        cadre,
        registering_body: registeringBody,
        status: 'pending',
        method: 'manual',
      });

      if (verErr) {
        setError('Account created but verification record failed: ' + verErr.message);
        return;
      }

      router.push('/verification-pending');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-[#0D1B35] border border-[#1A3265] rounded-xl px-4 py-3.5 text-[#EAF4FF] placeholder:text-[#3D5C80] focus:border-[#00BFA6] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 text-sm transition-colors disabled:opacity-50';

  return (
    <div className="min-h-screen bg-[#070D1A] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#040A16] border-r border-[#1A3265] flex-col items-center justify-center px-12 py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,191,166,0.07) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
          <div className="relative mb-2">
            <div className="w-14 h-14 rounded-full border-2 border-[#00BFA6] opacity-20 absolute inset-0" />
            <div className="absolute rounded-full border-2 border-[#00BFA6] opacity-50" style={{ inset: 10 }} />
            <div className="absolute rounded-full bg-[#00BFA6]" style={{ inset: 20 }} />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-14 h-14 relative" aria-hidden="true">
              <circle cx="48" cy="48" r="10" fill="#00BFA6" />
              <circle cx="48" cy="48" r="26" fill="none" stroke="#00BFA6" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)" />
              <circle cx="48" cy="48" r="42" fill="none" stroke="#00BFA6" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)" />
            </svg>
          </div>
          <h1 className="text-[#EAF4FF] font-extrabold mt-3 leading-none" style={{ fontSize: '42px' }}>Duara</h1>
          <p className="text-[#00BFA6] text-sm mt-2 tracking-wide font-medium">Clinician Portal</p>

          <div className="mt-10 w-full space-y-6">
            <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-5 text-left">
              <p className="text-[#EAF4FF] font-semibold text-sm mb-2">Registration process</p>
              <ol className="space-y-2.5">
                {[
                  'Submit your details and licence number',
                  'Our team verifies your credentials (1–2 business days)',
                  'Receive email confirmation to activate your account',
                  'Set up two-factor authentication',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#7AAAC8] text-xs">
                    <span className="w-5 h-5 rounded-full bg-[rgba(0,191,166,0.10)] border border-[#00BFA6]/30 flex items-center justify-center text-[#00BFA6] font-bold flex-shrink-0 text-xs">
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
                <li key={b} className="flex items-center gap-3 text-[#7AAAC8] text-sm">
                  <svg className="w-4 h-4 text-[#00BFA6] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#070D1A] overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-12 h-12" aria-hidden="true">
            <circle cx="48" cy="48" r="10" fill="#00BFA6" />
            <circle cx="48" cy="48" r="26" fill="none" stroke="#00BFA6" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="#00BFA6" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)" />
          </svg>
          <p className="text-[#EAF4FF] font-extrabold text-2xl mt-2">Duara</p>
          <p className="text-[#00BFA6] text-xs mt-1">Clinician Portal</p>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-[#EAF4FF] font-bold mb-1" style={{ fontSize: '28px' }}>Create your account</h2>
          <p className="text-[#7AAAC8] text-sm mb-8">Register as a clinician to access patient dashboards.</p>

          <form onSubmit={handleSignUp} className="space-y-5" noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="full-name" className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
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
              <label htmlFor="email" className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
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
              <label htmlFor="password" className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Min. 12 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                className={inputClass}
                aria-label="Password"
                aria-describedby="password-strength"
              />
              <div id="password-strength" aria-live="polite">
                <StrengthBar password={password} />
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm-password" className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                className={inputClass}
                aria-label="Confirm password"
              />
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="mt-1.5 text-xs text-[#EF4444]">Passwords do not match</p>
              )}
              {confirmPassword.length > 0 && confirmPassword === password && password.length > 0 && (
                <p className="mt-1.5 text-xs text-[#22C87A]">Passwords match</p>
              )}
            </div>

            {/* Cadre */}
            <div>
              <label htmlFor="cadre" className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
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
              <label htmlFor="registering-body" className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
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
              <label htmlFor="licence-number" className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
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
                className="bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/40 rounded-xl px-4 py-3"
              >
                <p className="text-[#EF4444] text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00BFA6] text-[#070D1A] font-bold rounded-xl hover:bg-[#00A896] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 mt-2 text-sm tracking-wide"
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

          <p className="text-center text-[#3D5C80] text-xs mt-8">
            Already registered?{' '}
            <Link href="/login" className="text-[#7AAAC8] font-medium hover:text-[#00BFA6] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
