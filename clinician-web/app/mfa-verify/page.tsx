'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase-browser';

interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

type VerifyStep = 'loading' | 'verify' | 'success' | 'error';

export default function MfaVerifyPage() {
  const router = useRouter();

  const [step, setStep] = useState<VerifyStep>('loading');
  const [factors, setFactors] = useState<Factor[]>([]);
  const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null);
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();

        const { data: factorData, error: factorErr } = await supabase.auth.mfa.listFactors();
        if (factorErr) {
          setInitError(factorErr.message);
          setStep('error');
          return;
        }

        const totpFactors = (factorData?.totp ?? []).filter((f) => f.status === 'verified');
        if (totpFactors.length === 0) {
          // No enrolled factors — redirect to setup
          router.replace('/mfa-setup');
          return;
        }

        setFactors(totpFactors);
        const factor = totpFactors[0];
        setSelectedFactor(factor);

        // Create challenge
        const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
          factorId: factor.id,
        });

        if (challengeErr) {
          setInitError(challengeErr.message);
          setStep('error');
          return;
        }

        setChallengeId(challengeData.id);
        setStep('verify');
      } catch {
        setInitError('Failed to load MFA factors. Please try again.');
        setStep('error');
      }
    }

    init();
  }, [router]);

  async function handleSwitch(factor: Factor) {
    setSelectedFactor(factor);
    setCode('');
    setError('');
    setStep('loading');
    try {
      const supabase = createClient();
      const { data, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challengeErr) {
        setInitError(challengeErr.message);
        setStep('error');
        return;
      }
      setChallengeId(data.id);
      setStep('verify');
    } catch {
      setInitError('Failed to create challenge. Please try again.');
      setStep('error');
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFactor) return;
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: selectedFactor.id,
        challengeId,
        code: code.replace(/\s/g, ''),
      });

      if (verifyError) {
        if (verifyError.message.includes('expired')) {
          // Challenge expired — create a new one
          const { data, error: rechallErr } = await supabase.auth.mfa.challenge({ factorId: selectedFactor.id });
          if (!rechallErr && data) setChallengeId(data.id);
          setError('Code expired. A new challenge has been created. Please try again.');
        } else {
          setError('Invalid code. Please try again.');
        }
        return;
      }

      setStep('success');
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-[#0D1B35] border border-[#1A3265] rounded-xl px-4 py-3.5 text-[#EAF4FF] placeholder:text-[#3D5C80] focus:border-[#00BFA6] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 text-sm transition-colors disabled:opacity-50 text-center tracking-widest text-lg font-mono';

  return (
    <div className="min-h-screen bg-[#070D1A] flex flex-col items-center justify-center px-6 py-16">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(0,191,166,0.05) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-10 h-10" aria-label="Duara logo">
            <circle cx="48" cy="48" r="10" fill="#00BFA6" />
            <circle cx="48" cy="48" r="26" fill="none" stroke="#00BFA6" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="#00BFA6" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)" />
          </svg>
          <p className="text-[#EAF4FF] font-extrabold text-xl mt-2">Duara</p>
          <p className="text-[#00BFA6] text-xs mt-1">Clinician Portal</p>
        </div>

        {step === 'loading' && (
          <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-10 flex flex-col items-center">
            <svg className="w-8 h-8 animate-spin text-[#00BFA6]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-[#7AAAC8] text-sm mt-4">Loading two-factor challenge…</p>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(239,68,68,0.10)] border border-[#EF4444]/30 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-[#EAF4FF] font-bold text-xl mb-3">Authentication error</h2>
            <p className="text-[#7AAAC8] text-sm mb-6">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#00BFA6] text-[#070D1A] font-bold rounded-xl hover:bg-[#00A896] transition-colors min-h-12 px-6 text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[rgba(0,191,166,0.10)] border border-[#00BFA6]/25 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#00BFA6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[#EAF4FF] font-bold text-xl">Two-factor verification</h2>
                <p className="text-[#7AAAC8] text-xs mt-0.5">
                  {selectedFactor?.friendly_name ?? 'Authenticator app'}
                </p>
              </div>
            </div>

            <p className="text-[#7AAAC8] text-sm mb-6 leading-relaxed">
              Open your authenticator app and enter the 6-digit code shown for Duara to continue.
            </p>

            <form onSubmit={handleVerify} className="space-y-5" noValidate>
              <div>
                <label htmlFor="mfa-code" className="block text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-2">
                  Verification code
                </label>
                <input
                  id="mfa-code"
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
                  autoFocus
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
                className="w-full bg-[#00BFA6] text-[#070D1A] font-bold rounded-xl hover:bg-[#00A896] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-h-12 text-sm tracking-wide"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Verifying…
                  </span>
                ) : 'Verify'}
              </button>
            </form>

            {/* Multiple factors */}
            {factors.length > 1 && (
              <div className="mt-5 pt-5 border-t border-[#1A3265]">
                <p className="text-[#3D5C80] text-xs mb-3">Use a different authenticator:</p>
                <div className="space-y-2">
                  {factors
                    .filter((f) => f.id !== selectedFactor?.id)
                    .map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSwitch(f)}
                        className="w-full text-left text-[#7AAAC8] text-sm px-3 py-2.5 rounded-xl border border-[#1A3265] hover:bg-[#0F2040] hover:text-[#EAF4FF] transition-colors"
                      >
                        {f.friendly_name ?? 'Authenticator app'}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-[#1A3265] text-center">
              <p className="text-[#3D5C80] text-xs">
                Having trouble? Contact{' '}
                <a href="mailto:support@duara.health" className="text-[#7AAAC8] hover:text-[#00BFA6] transition-colors">
                  support@duara.health
                </a>
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(34,200,122,0.10)] border-2 border-[#22C87A]/30 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-[#22C87A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[#EAF4FF] font-bold text-xl mb-3">Verified</h2>
            <p className="text-[#7AAAC8] text-sm">Identity confirmed. Redirecting to dashboard…</p>
          </div>
        )}
      </div>
    </div>
  );
}
