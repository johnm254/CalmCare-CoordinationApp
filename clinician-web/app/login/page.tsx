'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';
import { track } from '../../lib/analytics';

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

function EpimoyoIconReversed() {
  return (
    <svg viewBox="0 0 48 48" width="56" height="56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="epimoyo">
      <path d="M39.6 15 A18 18 0 1 1 39.6 33" stroke="#F5EFE3" strokeWidth="5.5" strokeLinecap="round"/>
      <polyline points="3,24 12,24 16,13 22,35 27,24 39.6,24" stroke="#F5EFE3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="40" cy="34" r="4.5" fill="#E8603C"/>
    </svg>
  );
}

function EpimoyoIconDark() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="epimoyo">
      <path d="M39.6 15 A18 18 0 1 1 39.6 33" stroke="#12383A" strokeWidth="5.5" strokeLinecap="round"/>
      <polyline points="3,24 12,24 16,13 22,35 27,24 39.6,24" stroke="#12383A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="40" cy="34" r="4.5" fill="#E8603C"/>
    </svg>
  );
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

    // Client-side validation
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (!password) { setError('Password is required.'); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(mapAuthError(authError.message));
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

      const { data: lockData } = await supabase.rpc('is_clinician_locked', { clinician_uuid: data.user.id });
      if (lockData === true) {
        await supabase.auth.signOut();
        setError('Your account is temporarily locked due to too many failed attempts. Try again in 15 minutes.');
        return;
      }

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData) {
        if (aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
          router.push('/mfa-verify');
          router.refresh();
          return;
        }
      }

      try { await supabase.rpc('reset_failed_login', { clinician_uuid: data.user.id }); } catch {}
      track.login();
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5EFE3] flex">
      {/* Left panel — Guardian Teal */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#12383A] flex-col items-center justify-center px-12 py-16 relative overflow-hidden">
        {/* Pulse line decoration */}
        <svg viewBox="0 0 400 60" className="absolute bottom-0 left-0 w-full opacity-10" aria-hidden="true">
          <polyline
            points="0,30 60,30 90,10 110,50 130,30 180,30 210,15 230,45 250,30 310,30 340,12 360,48 380,30 400,30"
            fill="none" stroke="#F5EFE3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        {/* Concentric halo rings behind icon */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
          <div className="relative mb-6">
            <div className="absolute rounded-full border border-[#1F7A72] opacity-30" style={{ inset: -24 }} />
            <div className="absolute rounded-full border border-[#1F7A72] opacity-20" style={{ inset: -44 }} />
            <EpimoyoIconReversed />
          </div>

          <h1 className="text-[#F5EFE3] font-bold mt-4 leading-none" style={{ fontSize: '42px', fontFamily: 'Fraunces, Georgia, serif' }}>epimoyo</h1>
          <p className="text-[#CFE0D8] text-sm mt-2 tracking-wide font-medium">Clinician & Nurse Portal</p>
          <p className="text-[#CFE0D8]/70 text-xs mt-1 italic">Watching over every heartbeat.</p>

          <ul className="mt-10 space-y-3 text-left w-full">
            {[
              { label: 'HIPAA-aligned data handling' },
              { label: 'Patient-controlled consent' },
              { label: 'Real-time SOS alerts' },
            ].map((b) => (
              <li key={b.label} className="flex items-center gap-3 text-[#CFE0D8]/80 text-sm">
                <svg className="w-4 h-4 text-[#1F7A72] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#F5EFE3]">
        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <EpimoyoIconDark />
          <p className="text-[#0C1F20] font-bold text-2xl mt-2" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>epimoyo</p>
          <p className="text-[#166158] text-xs mt-1">Clinician & Nurse Portal</p>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-[#0C1F20] font-bold mb-1" style={{ fontSize: '28px', fontFamily: 'Fraunces, Georgia, serif' }}>Welcome back</h2>
          <p className="text-[#3A5255] text-sm mb-8">Sign in to your patient dashboard.</p>

          <form onSubmit={handleSignIn} className="space-y-5" noValidate>
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
                className="w-full bg-[#FFFFFF] border border-[#D6CFC4] rounded-xl px-4 py-3.5 text-[#0C1F20] placeholder:text-[#6B8588] focus:border-[#1F7A72] focus:outline-none focus:ring-2 focus:ring-[#1F7A72]/20 text-sm transition-colors disabled:opacity-50"
                aria-label="Email address"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[#3A5255] text-xs hover:text-[#1F7A72] transition-colors font-medium">
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
                className="w-full bg-[#FFFFFF] border border-[#D6CFC4] rounded-xl px-4 py-3.5 text-[#0C1F20] placeholder:text-[#6B8588] focus:border-[#1F7A72] focus:outline-none focus:ring-2 focus:ring-[#1F7A72]/20 text-sm transition-colors disabled:opacity-50"
                aria-label="Password"
              />
            </div>

            {error && (
              <div role="alert" className="bg-[rgba(200,16,46,0.08)] border border-[#C8102E]/30 rounded-xl px-4 py-3">
                <p className="text-[#C8102E] text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8603C] text-[#0C1F20] font-bold rounded-xl hover:bg-[#C8102E] hover:text-[#F5EFE3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 mt-2 text-sm tracking-wide"
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

          <div className="mt-6 pt-6 border-t border-[#D6CFC4] text-center">
            <p className="text-[#4A5F62] text-xs">
              New clinician?{' '}
              <Link href="/signup" className="text-[#3A5255] font-medium hover:text-[#1F7A72] transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
