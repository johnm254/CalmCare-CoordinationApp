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
    <div className="min-h-screen bg-[#0B1620] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-16 h-16" aria-label="Duara">
              <circle cx="48" cy="48" r="10" fill="#4FC3B7"/>
              <circle cx="48" cy="48" r="26" fill="none" stroke="#4FC3B7" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)"/>
              <circle cx="48" cy="48" r="42" fill="none" stroke="#4FC3B7" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#EAF2F6]">Duara</h1>
          <p className="text-[#A8BDCA] text-sm mt-1">Clinician Portal</p>
        </div>

        <div className="bg-[#112230] border border-[#1E3A52] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[#EAF2F6] mb-1">Welcome back</h2>
          <p className="text-[#A8BDCA] text-sm mb-6">Sign in to your patient dashboard</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[#A8BDCA] text-xs font-semibold uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-[#1A3144] border border-[#4F6D84] rounded-xl px-4 py-3 text-[#EAF2F6] placeholder:text-[#4F6D84] focus:border-[#4FC3B7] focus:outline-none focus:ring-1 focus:ring-[#4FC3B7]/30 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[#A8BDCA] text-xs font-semibold uppercase tracking-wide mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-[#1A3144] border border-[#4F6D84] rounded-xl px-4 py-3 text-[#EAF2F6] placeholder:text-[#4F6D84] focus:border-[#4FC3B7] focus:outline-none focus:ring-1 focus:ring-[#4FC3B7]/30 text-sm disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="bg-[#3A1A18] border border-[#FF7A6B]/40 rounded-xl px-4 py-3">
                <p className="text-[#FF7A6B] text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4FC3B7] text-[#0B1620] font-bold py-3 rounded-xl hover:bg-[#3DADA2] transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#4F6D84] text-xs mt-6">
          Not registered?{' '}
          <span className="text-[#4FC3B7] font-medium">Contact your administrator to get access.</span>
        </p>
      </div>
    </div>
  );
}
