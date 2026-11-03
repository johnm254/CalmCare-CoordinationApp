'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex flex-col items-center justify-center px-6 py-16">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(20,184,166,0.05) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-10 h-10" aria-label="Mojo logo">
          <rect x="4" y="4" width="88" height="88" rx="18" fill="#0D9488"/>
          <rect x="16" y="16" width="12" height="64" fill="#14B8A6"/>
          <rect x="68" y="16" width="12" height="64" fill="#14B8A6"/>
          <polygon points="16,16 28,16 55,52 44,52" fill="#14B8A6"/>
          <polygon points="68,16 80,16 55,52 44,52" fill="#14B8A6"/>
        </svg>
          <p className="text-[#0F1B2D] font-extrabold text-xl mt-2">Mojo</p>
          <p className="text-[#14B8A6] text-xs mt-1">Clinician & Nurse Portal</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl p-8">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[rgba(20,184,166,0.10)] border-2 border-[#14B8A6]/30 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-[#0F1B2D] font-bold text-xl mb-3">Check your email</h2>
              <p className="text-[#5B6B7F] text-sm leading-relaxed mb-2">
                We sent a password reset link to
              </p>
              <p className="text-[#0F1B2D] font-semibold text-sm mb-4">{email}</p>
              <p className="text-[#5B6B7F] text-xs leading-relaxed">
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-[#0F1B2D] font-bold text-2xl mb-2">Reset your password</h2>
              <p className="text-[#5B6B7F] text-sm mb-7 leading-relaxed">
                Enter your registered email address and we will send you a secure reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

                {error && (
                  <div role="alert" className="bg-[rgba(244,63,94,0.10)] border border-[#F43F5E]/40 rounded-xl px-4 py-3">
                    <p className="text-[#F43F5E] text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#14B8A6] text-[#F6F9FC] font-bold rounded-xl hover:bg-[#00A896] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 text-sm tracking-wide"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Sending…
                    </span>
                  ) : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[#8C9AAB] text-xs mt-6">
          <Link href="/login" className="text-[#5B6B7F] font-medium hover:text-[#14B8A6] transition-colors flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
