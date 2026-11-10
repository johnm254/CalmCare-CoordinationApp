import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase-server';
import SignOutButtonClient from './SignOutButtonClient';

function PendingIcon() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center" aria-hidden="true">
      <div className="absolute inset-0 rounded-full border border-[#1F7A72]/20" />
      <div className="absolute rounded-full border border-[#1F7A72]/10" style={{ inset: -8 }} />
      <svg viewBox="0 0 48 48" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="epimoyo">
        <path d="M36.7 11.3 A18 18 0 1 1 36.7 36.7" stroke="#12383A" strokeWidth="5.5" strokeLinecap="round"/>
        <polyline points="8,24 15,24 19,15 23,33 27,24 36,24" stroke="#12383A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="39.5" cy="37.5" r="4.5" fill="#E8603C"/>
      </svg>
    </div>
  );
}

function RejectedIcon() {
  return (
    <div className="w-24 h-24 rounded-full bg-[rgba(200,16,46,0.08)] border-2 border-[#C8102E]/30 flex items-center justify-center" aria-hidden="true">
      <svg className="w-10 h-10 text-[#C8102E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

function ExpiredIcon() {
  return (
    <div className="w-24 h-24 rounded-full bg-[rgba(241,199,107,0.10)] border-2 border-[#F1C76B]/30 flex items-center justify-center" aria-hidden="true">
      <svg className="w-10 h-10 text-[#F1C76B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

export default async function VerificationPendingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: verification } = await supabase
    .from('clinician_verifications')
    .select('status, notes, expires_at')
    .eq('clinician_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = verification?.status ?? 'pending';
  const notes = verification?.notes as string | null | undefined;

  const isExpired =
    status === 'expired' ||
    (verification?.expires_at && new Date(verification.expires_at) < new Date());

  const effectiveStatus = isExpired ? 'expired' : status;

  return (
    <div className="min-h-screen bg-[#F5EFE3] flex flex-col items-center justify-center px-6 py-16">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(31,122,114,0.05) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="epimoyo">
            <path d="M36.7 11.3 A18 18 0 1 1 36.7 36.7" stroke="#12383A" strokeWidth="5.5" strokeLinecap="round"/>
            <polyline points="8,24 15,24 19,15 23,33 27,24 36,24" stroke="#12383A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="39.5" cy="37.5" r="4.5" fill="#E8603C"/>
          </svg>
          <p className="text-[#0C1F20] font-bold text-xl mt-2" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>epimoyo</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D6CFC4] rounded-2xl p-10 flex flex-col items-center text-center">
          {effectiveStatus === 'pending' && (
            <>
              <PendingIcon />
              <h1 className="text-[#0C1F20] font-bold text-2xl mt-6 mb-3">Verification in progress</h1>
              <p className="text-[#3A5255] text-sm leading-relaxed mb-2">
                Your licence is being verified by our team. This usually takes 1–2 business days.
              </p>
              <p className="text-[#3A5255] text-sm leading-relaxed">
                You will receive an email once your account is approved.
              </p>
              <div className="mt-6 bg-[rgba(31,122,114,0.07)] border border-[#1F7A72]/20 rounded-xl px-5 py-4 w-full text-left">
                <p className="text-[#1F7A72] text-xs font-semibold uppercase tracking-widest mb-2">What happens next</p>
                <ul className="space-y-1.5">
                  {[
                    'Our team reviews your licence with the registering body',
                    'You receive an approval email',
                    'Sign in and complete MFA setup to access the portal',
                  ].map((item, i) => (
                    <li key={i} className="text-[#3A5255] text-xs flex items-start gap-2">
                      <span className="text-[#1F7A72] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {effectiveStatus === 'rejected' && (
            <>
              <RejectedIcon />
              <h1 className="text-[#0C1F20] font-bold text-2xl mt-6 mb-3">Verification unsuccessful</h1>
              {notes ? (
                <div className="mb-4 bg-[rgba(200,16,46,0.07)] border border-[#C8102E]/20 rounded-xl px-5 py-4 w-full text-left">
                  <p className="text-[#3A5255] text-xs font-semibold uppercase tracking-widest mb-1">Reason provided</p>
                  <p className="text-[#0C1F20] text-sm">{notes}</p>
                </div>
              ) : null}
              <p className="text-[#3A5255] text-sm leading-relaxed">
                Please contact{' '}
                <a href="mailto:support@epimoyo.health" className="text-[#1F7A72] hover:underline">
                  support@epimoyo.health
                </a>{' '}
                or re-apply with corrected details.
              </p>
            </>
          )}

          {effectiveStatus === 'expired' && (
            <>
              <ExpiredIcon />
              <h1 className="text-[#0C1F20] font-bold text-2xl mt-6 mb-3">Licence expired</h1>
              <p className="text-[#3A5255] text-sm leading-relaxed">
                Your licence on record has expired. Please renew your licence with your registering body, then contact{' '}
                <a href="mailto:support@epimoyo.health" className="text-[#1F7A72] hover:underline">
                  support@epimoyo.health
                </a>{' '}
                to update your record.
              </p>
            </>
          )}

          <div className="mt-8 w-full">
            <SignOutButtonClient />
          </div>
        </div>

        <p className="text-center text-[#6B8588] text-xs mt-6">
          Wrong account?{' '}
          <a href="/login" className="text-[#3A5255] hover:text-[#1F7A72] transition-colors font-medium">
            Sign in with a different email
          </a>
        </p>
      </div>
    </div>
  );
}
