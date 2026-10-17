'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase-browser';

type SetupStep = 'loading' | 'enroll' | 'verify' | 'success' | 'error';

export default function MfaSetupPage() {
  const router = useRouter();

  const [step, setStep] = useState<SetupStep>('loading');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    async function enroll() {
      try {
        const supabase = createClient();
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'Duara',
          friendlyName: 'Authenticator app',
        });

        if (enrollError) {
          setInitError(enrollError.message);
          setStep('error');
          return;
        }

        if (!data || data.type !== 'totp') {
          setInitError('Unexpected response from server. Please try again.');
          setStep('error');
          return;
        }

        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setStep('enroll');
      } catch {
        setInitError('Failed to start MFA setup. Please try again.');
        setStep('error');
      }
    }

    enroll();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.replace(/\s/g, ''),
      });

      if (verifyError) {
        if (verifyError.message.includes('invalid') || verifyError.message.toLowerCase().includes('token')) {
          setError('Invalid code. Please check your authenticator app and try again.');
        } else {
          setError(verifyError.message);
        }
        return;
      }

      setStep('success');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    router.push('/dashboard?mfa_pending=1');
  }

  const inputClass =
    'w-full bg-[#14122A] border border-[#2E2B50] rounded-xl px-4 py-3.5 text-[#F5F0FF] placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 text-sm transition-colors disabled:opacity-50 text-center tracking-widest text-lg font-mono';

  return (
    <div className="min-h-screen bg-[#09090F] flex flex-col items-center justify-center px-6 py-16">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(139,92,246,0.05) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-10 h-10" aria-label="Duara logo">
            <circle cx="48" cy="48" r="10" fill="#8B5CF6" />
            <circle cx="48" cy="48" r="26" fill="none" stroke="#8B5CF6" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="#8B5CF6" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)" />
          </svg>
          <p className="text-[#F5F0FF] font-extrabold text-xl mt-2">Duara</p>
          <p className="text-[#8B5CF6] text-xs mt-1">Clinician Portal</p>
        </div>

        {step === 'loading' && (
          <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-10 flex flex-col items-center">
            <svg className="w-8 h-8 animate-spin text-[#8B5CF6]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-[#9B96C0] text-sm mt-4">Setting up two-factor authentication…</p>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/30 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-[#F5F0FF] font-bold text-xl mb-3">Setup failed</h2>
            <p className="text-[#9B96C0] text-sm mb-6">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#8B5CF6] text-[#09090F] font-bold rounded-xl hover:bg-[#00A896] transition-colors min-h-12 px-6 text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {(step === 'enroll' || step === 'verify') && (
          <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-8">
            <h2 className="text-[#F5F0FF] font-bold text-2xl mb-2">Set up two-factor authentication</h2>
            <p className="text-[#9B96C0] text-sm mb-7 leading-relaxed">
              Two-factor authentication adds an extra layer of security to protect patient data.
            </p>

            {/* Steps indicator */}
            <div className="flex items-center gap-3 mb-7">
              {['Scan QR code', 'Verify code'].map((label, i) => {
                const active = (step === 'enroll' && i === 0) || (step === 'verify' && i === 1);
                const done = step === 'verify' && i === 0;
                return (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && <div className={`flex-1 h-px w-8 ${done ? 'bg-[#8B5CF6]' : 'bg-[#2E2B50]'}`} />}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          done
                            ? 'bg-[#8B5CF6] text-[#09090F]'
                            : active
                            ? 'border-2 border-[#8B5CF6] text-[#8B5CF6]'
                            : 'border border-[#2E2B50] text-[#504C78]'
                        }`}
                      >
                        {done ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`text-xs font-medium ${active ? 'text-[#F5F0FF]' : done ? 'text-[#8B5CF6]' : 'text-[#504C78]'}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {step === 'enroll' && (
              <>
                <div className="bg-[#1C1A35] border border-[#2E2B50] rounded-xl p-5 mb-6 text-center">
                  <p className="text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-4">
                    Scan with your authenticator app
                  </p>
                  {qrCode && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-white p-3 rounded-xl inline-block">
                        <img src={qrCode} alt="TOTP QR code for Duara clinician portal" className="w-40 h-40" />
                      </div>
                    </div>
                  )}
                  <p className="text-[#9B96C0] text-xs mb-3">
                    Use Google Authenticator, Authy, or any TOTP-compatible app.
                  </p>
                  <div className="border-t border-[#2E2B50] pt-3 mt-3">
                    <p className="text-[#504C78] text-xs mb-2">Can't scan? Enter this key manually:</p>
                    <code className="text-[#8B5CF6] text-xs font-mono break-all select-all bg-[#14122A] px-3 py-2 rounded-lg block">
                      {secret}
                    </code>
                  </div>
                </div>

                <button
                  onClick={() => setStep('verify')}
                  className="w-full bg-[#8B5CF6] text-[#09090F] font-bold rounded-xl hover:bg-[#00A896] transition-colors min-h-12 px-6 text-sm tracking-wide mb-3"
                >
                  I have scanned the QR code
                </button>
              </>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-5" noValidate>
                <div className="bg-[rgba(139,92,246,0.05)] border border-[#8B5CF6]/20 rounded-xl px-4 py-3 text-sm text-[#9B96C0]">
                  Open your authenticator app and enter the 6-digit code shown for Duara.
                </div>

                <div>
                  <label htmlFor="totp-code" className="block text-[#9B96C0] text-xs font-semibold uppercase tracking-widest mb-2">
                    Verification code
                  </label>
                  <input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9 ]*"
                    maxLength={7}
                    placeholder="000 000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9 ]/g, ''))}
                    required
                    disabled={loading}
                    autoComplete="one-time-code"
                    className={inputClass}
                    aria-label="Six-digit verification code"
                  />
                </div>

                {error && (
                  <div role="alert" className="bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/40 rounded-xl px-4 py-3">
                    <p className="text-[#EF4444] text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8B5CF6] text-[#09090F] font-bold rounded-xl hover:bg-[#00A896] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 text-sm tracking-wide"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Verifying…
                    </span>
                  ) : 'Verify and activate'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('enroll')}
                  className="w-full text-[#504C78] text-sm hover:text-[#9B96C0] transition-colors py-2"
                >
                  Back to QR code
                </button>
              </form>
            )}

            <div className="mt-5 pt-5 border-t border-[#2E2B50] text-center">
              <button
                type="button"
                onClick={handleSkip}
                className="text-[#504C78] text-xs hover:text-[#9B96C0] transition-colors"
              >
                I will set this up later
              </button>
              <p className="text-[#504C78] text-xs mt-1">
                Note: MFA will be required within 7 days.
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(34,200,122,0.10)] border-2 border-[#22C87A]/30 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-[#22C87A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[#F5F0FF] font-bold text-xl mb-3">MFA activated</h2>
            <p className="text-[#9B96C0] text-sm">Your account is now protected with two-factor authentication. Redirecting…</p>
          </div>
        )}
      </div>
    </div>
  );
}
