'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Try again in 15 minutes.';
  }
  if (lower.includes('invalid login') || lower.includes('invalid credentials') || lower.includes('email not confirmed')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (lower.includes('email') && lower.includes('not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (lower.includes('user not found')) {
    return 'No account found with that email address.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  return message;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(mapAuthError(authError.message));
        // best-effort: record failed attempt for lockout tracking
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();
          if (profileData?.id) {
            await supabase.rpc('record_failed_login', { clinician_uuid: profileData.id });
          }
        } catch {}
        return;
      }
      if (!data.user) {
        setError('Sign in failed. Please try again.');
        return;
      }

      // Check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile && profile.role !== 'clinician' && profile.role !== 'admin') {
        await supabase.auth.signOut();
        setError('This portal is for clinicians only. Please use the patient app.');
        return;
      }

      // Check verification status
      const { data: verification } = await supabase
        .from('clinician_verifications')
        .select('status, expires_at')
        .eq('clinician_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (verification) {
        const isExpired =
          verification.status === 'expired' ||
          (verification.expires_at && new Date(verification.expires_at) < new Date());
        const effectiveStatus = isExpired ? 'expired' : verification.status;

        if (effectiveStatus !== 'verified') {
          await supabase.auth.signOut();
          router.push('/verification-pending');
          return;
        }
      }

      // Check clinician lockout
      const { data: lockData } = await supabase.rpc('is_clinician_locked', { clinician_uuid: data.user.id });
      if (lockData === true) {
        await supabase.auth.signOut();
        setError('Your account is temporarily locked due to too many failed attempts. Try again in 15 minutes.');
        return;
      }

      // Check MFA assurance level
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData) {
        if (aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
          router.push('/mfa-verify');
          router.refresh();
          return;
        }
      }

      try { await supabase.rpc('reset_failed_login', { clinician_uuid: data.user.id }); } catch {}
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#030210] border-r border-[#E6ECF2] flex-col items-center justify-center px-12 py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(20,184,166,0.07) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
          {/* Logo */}
          <div className="relative mb-2">
            <div className="w-14 h-14 rounded-full border-2 border-[#14B8A6] opacity-20 absolute inset-0" />
            <div className="absolute rounded-full border-2 border-[#14B8A6] opacity-50" style={{ inset: 10 }} />
            <div className="absolute rounded-full bg-[#14B8A6]" style={{ inset: 20 }} />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-14 h-14 relative" aria-hidden="true">
              <circle cx="48" cy="48" r="10" fill="#14B8A6" />
              <circle cx="48" cy="48" r="26" fill="none" stroke="#14B8A6" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)" />
              <circle cx="48" cy="48" r="42" fill="none" stroke="#14B8A6" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)" />
            </svg>
          </div>

          <h1 className="text-[#0F1B2D] font-extrabold mt-3 leading-none" style={{ fontSize: '42px' }}>Duara</h1>
          <p className="text-[#14B8A6] text-sm mt-2 tracking-wide font-medium">Clinician & Nurse Portal</p>

          <div className="mt-8 w-full max-w-xs mx-auto">
            <img
              src="/illustrations/hero-clinician.svg"
              alt="Clinician illustration"
              className="w-full h-auto opacity-90"
            />
          </div>

          <ul className="mt-8 space-y-3 text-left w-full">
            {[
              { label: 'HIPAA-aligned data handling' },
              { label: 'Patient-controlled consent' },
              { label: 'Real-time SOS alerts' },
            ].map((b) => (
              <li key={b.label} className="flex items-center gap-3 text-[#5B6B7F] text-sm">
                <svg className="w-4 h-4 text-[#14B8A6] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#F6F9FC]">
        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-12 h-12" aria-hidden="true">
            <circle cx="48" cy="48" r="10" fill="#14B8A6" />
            <circle cx="48" cy="48" r="26" fill="none" stroke="#14B8A6" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="#14B8A6" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)" />
          </svg>
          <p className="text-[#0F1B2D] font-extrabold text-2xl mt-2">Duara</p>
          <p className="text-[#14B8A6] text-xs mt-1">Clinician & Nurse Portal</p>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-[#0F1B2D] font-bold mb-1" style={{ fontSize: '28px' }}>Welcome back</h2>
          <p className="text-[#5B6B7F] text-sm mb-8">Sign in to your patient dashboard.</p>

          <form onSubmit={handleSignIn} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-[#5B6B7F] text-xs font-semibold uppercase tracking-widest mb-2">
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
                className="w-full bg-[#FFFFFF] border border-[#E6ECF2] rounded-xl px-4 py-3.5 text-[#0F1B2D] placeholder:text-[#8C9AAB] focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 text-sm transition-colors disabled:opacity-50"
                aria-label="Email address"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-[#5B6B7F] text-xs font-semibold uppercase tracking-widest">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[#5B6B7F] text-xs hover:text-[#14B8A6] transition-colors font-medium">
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
                className="w-full bg-[#FFFFFF] border border-[#E6ECF2] rounded-xl px-4 py-3.5 text-[#0F1B2D] placeholder:text-[#8C9AAB] focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 text-sm transition-colors disabled:opacity-50"
                aria-label="Password"
              />
            </div>

            {error && (
              <div role="alert" className="bg-[rgba(244,63,94,0.10)] border border-[#F43F5E]/40 rounded-xl px-4 py-3">
                <p className="text-[#F43F5E] text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#14B8A6] text-[#F6F9FC] font-bold rounded-xl hover:bg-[#00A896] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 mt-2 text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E6ECF2] text-center">
            <p className="text-[#8C9AAB] text-xs">
              New clinician?{' '}
              <Link href="/signup" className="text-[#5B6B7F] font-medium hover:text-[#14B8A6] transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
