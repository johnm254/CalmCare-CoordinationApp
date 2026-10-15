'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase-browser';

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
      if (authError) { setError(authError.message); return; }
      if (!data.user) { setError('Sign in failed. Please try again.'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (profile && profile.role !== 'clinician') {
        await supabase.auth.signOut();
        setError('This portal is for clinicians only. Please use the patient app.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070D1A] flex">
      {/* Left panel — brand/illustration, hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#040A16] border-r border-[#1A3265] flex-col items-center justify-center px-12 py-16 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,191,166,0.07) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {/* Logo */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-20 h-20" aria-hidden="true">
            <circle cx="48" cy="48" r="10" fill="#00BFA6"/>
            <circle cx="48" cy="48" r="26" fill="none" stroke="#00BFA6" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)"/>
            <circle cx="48" cy="48" r="42" fill="none" stroke="#00BFA6" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)"/>
          </svg>

          <h1 className="text-[#EAF4FF] font-extrabold mt-5 leading-none" style={{ fontSize: '42px' }}>Duara</h1>
          <p className="text-[#00BFA6] text-sm mt-2 tracking-wide font-medium">Clinician Portal</p>

          {/* Patient illustration */}
          <svg viewBox="0 0 360 260" className="w-full max-w-xs mt-8 opacity-90" aria-hidden="true">
            <circle cx="60" cy="220" r="80" fill="#00BFA6" fillOpacity=".08"/>
            <circle cx="310" cy="40" r="60" fill="#3B82F6" fillOpacity=".07"/>
            <circle cx="180" cy="140" r="90" fill="none" stroke="#00BFA6" strokeWidth="3" strokeLinecap="round" strokeDasharray="450 100" transform="rotate(80 180 140)" strokeOpacity=".5"/>
            <circle cx="180" cy="140" r="52" fill="#0D1B35"/>
            <circle cx="180" cy="125" r="16" fill="#00BFA6" fillOpacity=".7"/>
            <path d="M152,165 C152,145 208,145 208,165 Z" fill="#00BFA6" fillOpacity=".5"/>
            <circle cx="115" cy="95" r="22" fill="#0F2040"/>
            <circle cx="115" cy="88" r="7" fill="#7AAAC8" fillOpacity=".6"/>
            <circle cx="245" cy="95" r="22" fill="#0F2040"/>
            <circle cx="245" cy="88" r="7" fill="#F4B860" fillOpacity=".6"/>
            <circle cx="180" cy="63" r="22" fill="#0F2040"/>
            <circle cx="180" cy="56" r="7" fill="#22C87A" fillOpacity=".6"/>
            <circle cx="130" cy="200" r="22" fill="#0F2040"/>
            <circle cx="130" cy="193" r="7" fill="#3B82F6" fillOpacity=".6"/>
            <circle cx="230" cy="200" r="22" fill="#0F2040"/>
            <circle cx="230" cy="193" r="7" fill="#00BFA6" fillOpacity=".5"/>
            <rect x="260" y="185" width="48" height="68" rx="8" fill="#0D1B35" stroke="#1A3265" strokeWidth="1"/>
            <rect x="266" y="193" width="36" height="46" rx="4" fill="#122245"/>
            <circle cx="284" cy="214" r="10" fill="#22C87A" fillOpacity=".8"/>
            <path d="M278,214 l4,4 l7,-8" fill="none" stroke="#070D1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* Trust bullets */}
          <ul className="mt-8 space-y-3 text-left w-full">
            {[
              { icon: '🔒', text: 'HIPAA-aligned data handling' },
              { icon: '🛡', text: 'Patient-controlled consent' },
              { icon: '⚡', text: 'Real-time alerts' },
            ].map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-[#7AAAC8] text-sm">
                <span className="text-base">{b.icon}</span>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#070D1A]">
        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-12 h-12" aria-hidden="true">
            <circle cx="48" cy="48" r="10" fill="#00BFA6"/>
            <circle cx="48" cy="48" r="26" fill="none" stroke="#00BFA6" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)"/>
            <circle cx="48" cy="48" r="42" fill="none" stroke="#00BFA6" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)"/>
          </svg>
          <p className="text-[#EAF4FF] font-extrabold text-2xl mt-2">Duara</p>
          <p className="text-[#00BFA6] text-xs mt-1">Clinician Portal</p>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-[#EAF4FF] font-bold mb-1" style={{ fontSize: '28px' }}>Welcome back, Doctor</h2>
          <p className="text-[#7AAAC8] text-sm mb-8">Sign in to your patient dashboard.</p>

          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email */}
            <div className="relative">
              <label className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-[#0D1B35] border border-[#1A3265] rounded-xl px-4 py-3.5 text-[#EAF4FF] placeholder:text-[#3D5C80] focus:border-[#00BFA6] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 text-sm transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-[#0D1B35] border border-[#1A3265] rounded-xl px-4 py-3.5 text-[#EAF4FF] placeholder:text-[#3D5C80] focus:border-[#00BFA6] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 text-sm transition-colors disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/40 rounded-xl px-4 py-3">
                <p className="text-[#EF4444] text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00BFA6] text-[#070D1A] font-bold rounded-xl hover:bg-[#00A896] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 mt-2 text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[#3D5C80] text-xs mt-8">
            Not registered?{' '}
            <span className="text-[#7AAAC8] font-medium">Contact your administrator.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
