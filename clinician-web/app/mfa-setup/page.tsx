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
          issuer: 'epimoyo',
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
    'w-full bg-[#FFFFFF] border border-[#D6CFC4] rounded-xl px-4 py-3.5 text-[#0C1F20] placeholder:text-[#6B8588] focus:border-[#1F7A72] focus:outline-none focus:ring-2 focus:ring-[#1F7A72]/20 text-sm transition-colors disabled:opacity-50 text-center tracking-widest text-lg font-mono';

  return (
    <div className="min-h-screen bg-[#F5EFE3] flex flex-col items-center justify-center px-6 py-16">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(31,122,114,0.05) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="epimoyo">
            <path d="M36.7 11.3 A18 18 0 1 1 36.7 36.7" stroke="#12383A" strokeWidth="5.5" strokeLinecap="round"/>
            <polyline points="8,24 15,24 19,15 23,33 27,24 36,24" stroke="#12383A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="39.5" cy="37.5" r="4.5" fill="#E8603C"/>
          </svg>
          <p className="text-[#0C1F20] font-bold text-xl mt-2" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>epimoyo</p>
          <p className="text-[#1F7A72] text-xs mt-1">Clinician & Nurse Portal</p>
        </div>

        {step === 'loading' && (
          <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-10 flex flex-col items-center">
            <svg className="w-8 h-8 animate-spin text-[#1F7A72]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-[#3A5255] text-sm mt-4">Setting up two-factor authentication…</p>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(200,16,46,0.08)] border border-[#C8102E]/30 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#C8102E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-[#0C1F20] font-bold text-xl mb-3">Setup failed</h2>
            <p className="text-[#3A5255] text-sm mb-6">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#1F7A72] text-[#F5EFE3] font-bold rounded-xl hover:bg-[#12383A] transition-colors min-h-12 px-6 text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {(step === 'enroll' || step === 'verify') && (
          <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-8">
            <h2 className="text-[#0C1F20] font-bold text-2xl mb-2">Set up two-factor authentication</h2>
            <p className="text-[#3A5255] text-sm mb-7 leading-relaxed">
              Two-factor authentication adds an extra layer of security to protect patient data.
            </p>

            {/* Steps indicator */}
            <div className="flex items-center gap-3 mb-7">
              {['Scan QR code', 'Verify code'].map((label, i) => {
                const active = (step === 'enroll' && i === 0) || (step === 'verify' && i === 1);
                const done = step === 'verify' && i === 0;
                return (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && <div className={`flex-1 h-px w-8 ${done ? 'bg-[#1F7A72]' : 'bg-[#D6CFC4]'}`} />}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          done
                            ? 'bg-[#1F7A72] text-[#F5EFE3]'
                            : active
                            ? 'border-2 border-[#1F7A72] text-[#1F7A72]'
                            : 'border border-[#D6CFC4] text-[#6B8588]'
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
                      <span className={`text-xs font-medium ${active ? 'text-[#0C1F20]' : done ? 'text-[#1F7A72]' : 'text-[#6B8588]'}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {step === 'enroll' && (
              <>
                <div className="bg-[#EDE8DF] border border-[#D6CFC4] rounded-xl p-5 mb-6 text-center">
                  <p className="text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-4">
                    Scan with your authenticator app
                  </p>
                  {qrCode && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-white p-3 rounded-xl inline-block">
                        <img src={qrCode} alt="TOTP QR code for epimoyo clinician portal" className="w-40 h-40" />
                      </div>
                    </div>
                  )}
                  <p className="text-[#3A5255] text-xs mb-3">
                    Use Google Authenticator, Authy, or any TOTP-compatible app.
                  </p>
                  <div className="border-t border-[#D6CFC4] pt-3 mt-3">
                    <p className="text-[#6B8588] text-xs mb-2">Can't scan? Enter this key manually:</p>
                    <code className="text-[#1F7A72] text-xs font-mono break-all select-all bg-[#FFFFFF] px-3 py-2 rounded-lg block">
                      {secret}
                    </code>
                  </div>
                </div>

                <button
                  onClick={() => setStep('verify')}
                  className="w-full bg-[#1F7A72] text-[#F5EFE3] font-bold rounded-xl hover:bg-[#12383A] transition-colors min-h-12 px-6 text-sm tracking-wide mb-3"
                >
                  I have scanned the QR code
                </button>
              </>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-5" noValidate>
                <div className="bg-[rgba(31,122,114,0.05)] border border-[#1F7A72]/20 rounded-xl px-4 py-3 text-sm text-[#3A5255]">
                  Open your authenticator app and enter the 6-digit code shown for epimoyo.
                </div>

                <div>
                  <label htmlFor="totp-code" className="block text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-2">
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
                  <div role="alert" className="bg-[rgba(200,16,46,0.08)] border border-[#C8102E]/30 rounded-xl px-4 py-3">
                    <p className="text-[#C8102E] text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1F7A72] text-[#F5EFE3] font-bold rounded-xl hover:bg-[#12383A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 text-sm tracking-wide"
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
                  className="w-full text-[#6B8588] text-sm hover:text-[#3A5255] transition-colors py-2"
                >
                  Back to QR code
                </button>
              </form>
            )}

            <div className="mt-5 pt-5 border-t border-[#D6CFC4] text-center">
              <button
                type="button"
                onClick={handleSkip}
                className="text-[#6B8588] text-xs hover:text-[#3A5255] transition-colors"
              >
                I will set this up later
              </button>
              <p className="text-[#6B8588] text-xs mt-1">
                Note: MFA will be required within 7 days.
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(31,122,114,0.10)] border-2 border-[#1F7A72]/30 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-[#1F7A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[#0C1F20] font-bold text-xl mb-3">MFA activated</h2>
            <p className="text-[#3A5255] text-sm">Your account is now protected with two-factor authentication. Redirecting…</p>
          </div>
        )}
      </div>
    </div>
  );
}
