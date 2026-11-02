'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase-browser';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied. Admin accounts only.');
      setLoading(false);
      return;
    }

    router.push('/admin/clinicians');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#04030D] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-16 h-16" aria-label="Duara">
              <circle cx="48" cy="48" r="10" fill="#7B35FA"/>
              <circle cx="48" cy="48" r="26" fill="none" stroke="#7B35FA" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)"/>
              <circle cx="48" cy="48" r="42" fill="none" stroke="#7B35FA" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#EDE8FF]">Duara</h1>
          <p className="text-[#9490BF] text-sm mt-1">Admin Portal</p>
        </div>

        <div className="bg-[#0C0A1E] border border-[#1E1B38] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[#EDE8FF] mb-1">Welcome back</h2>
          <p className="text-[#9490BF] text-sm mb-6">Admin access only</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[#9490BF] text-xs font-semibold uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@duara.app"
                disabled={loading}
                className="w-full bg-[#030210] border border-[#1E1B38] rounded-xl px-4 py-3 text-[#EDE8FF] placeholder:text-[#504875] focus:border-[#7B35FA] focus:outline-none focus:ring-2 focus:ring-[#7B35FA]/20 text-sm disabled:opacity-50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#9490BF] text-xs font-semibold uppercase tracking-wide mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-[#030210] border border-[#1E1B38] rounded-xl px-4 py-3 text-[#EDE8FF] placeholder:text-[#504875] focus:border-[#7B35FA] focus:outline-none focus:ring-2 focus:ring-[#7B35FA]/20 text-sm disabled:opacity-50 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-[#1A070D] border border-[#F43F5E]/40 rounded-xl px-4 py-3">
                <p className="text-[#F43F5E] text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7B35FA] text-white font-bold py-3 rounded-xl hover:bg-[#9B69FF] transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in to Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
