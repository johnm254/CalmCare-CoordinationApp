import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase-server';
import SignOutButtonClient from './SignOutButtonClient';

function PendingIcon() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 96 96" fill="none" className="absolute inset-0 w-full h-full">
        <circle cx="48" cy="48" r="44" stroke="#00BFA6" strokeOpacity=".12" strokeWidth="4" />
        <circle cx="48" cy="48" r="32" stroke="#00BFA6" strokeOpacity=".25" strokeWidth="4" />
        <circle cx="48" cy="48" r="20" stroke="#00BFA6" strokeOpacity=".5" strokeWidth="4" />
        <circle cx="48" cy="48" r="8" fill="#00BFA6" />
      </svg>
    </div>
  );
}

function RejectedIcon() {
  return (
    <div className="w-24 h-24 rounded-full bg-[rgba(239,68,68,0.10)] border-2 border-[#EF4444]/30 flex items-center justify-center" aria-hidden="true">
      <svg className="w-10 h-10 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

function ExpiredIcon() {
  return (
    <div className="w-24 h-24 rounded-full bg-[rgba(244,184,96,0.10)] border-2 border-[#F4B860]/30 flex items-center justify-center" aria-hidden="true">
      <svg className="w-10 h-10 text-[#F4B860]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="min-h-screen bg-[#070D1A] flex flex-col items-center justify-center px-6 py-16">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(0,191,166,0.05) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-10 h-10" aria-label="Duara logo">
            <circle cx="48" cy="48" r="10" fill="#00BFA6" />
            <circle cx="48" cy="48" r="26" fill="none" stroke="#00BFA6" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="#00BFA6" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)" />
          </svg>
          <p className="text-[#EAF4FF] font-extrabold text-xl mt-2">Duara</p>
        </div>

        <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-10 flex flex-col items-center text-center">
          {effectiveStatus === 'pending' && (
            <>
              <PendingIcon />
              <h1 className="text-[#EAF4FF] font-bold text-2xl mt-6 mb-3">Verification in progress</h1>
              <p className="text-[#7AAAC8] text-sm leading-relaxed mb-2">
                Your licence is being verified by our team. This usually takes 1–2 business days.
              </p>
              <p className="text-[#7AAAC8] text-sm leading-relaxed">
                You will receive an email once your account is approved.
              </p>
              <div className="mt-6 bg-[rgba(0,191,166,0.07)] border border-[#00BFA6]/20 rounded-xl px-5 py-4 w-full text-left">
                <p className="text-[#00BFA6] text-xs font-semibold uppercase tracking-widest mb-2">What happens next</p>
                <ul className="space-y-1.5">
                  {[
                    'Our team reviews your licence with the registering body',
                    'You receive an approval email',
                    'Sign in and complete MFA setup to access the portal',
                  ].map((item, i) => (
                    <li key={i} className="text-[#7AAAC8] text-xs flex items-start gap-2">
                      <span className="text-[#00BFA6] mt-0.5">•</span>
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
              <h1 className="text-[#EAF4FF] font-bold text-2xl mt-6 mb-3">Verification unsuccessful</h1>
              {notes ? (
                <div className="mb-4 bg-[rgba(239,68,68,0.07)] border border-[#EF4444]/20 rounded-xl px-5 py-4 w-full text-left">
                  <p className="text-[#7AAAC8] text-xs font-semibold uppercase tracking-widest mb-1">Reason provided</p>
                  <p className="text-[#EAF4FF] text-sm">{notes}</p>
                </div>
              ) : null}
              <p className="text-[#7AAAC8] text-sm leading-relaxed">
                Please contact{' '}
                <a href="mailto:support@duara.health" className="text-[#00BFA6] hover:underline">
                  support@duara.health
                </a>{' '}
                or re-apply with corrected details.
              </p>
            </>
          )}

          {effectiveStatus === 'expired' && (
            <>
              <ExpiredIcon />
              <h1 className="text-[#EAF4FF] font-bold text-2xl mt-6 mb-3">Licence expired</h1>
              <p className="text-[#7AAAC8] text-sm leading-relaxed">
                Your licence on record has expired. Please renew your licence with your registering body, then contact{' '}
                <a href="mailto:support@duara.health" className="text-[#00BFA6] hover:underline">
                  support@duara.health
                </a>{' '}
                to update your record.
              </p>
            </>
          )}

          <div className="mt-8 w-full">
            <SignOutButtonClient />
          </div>
        </div>

        <p className="text-center text-[#3D5C80] text-xs mt-6">
          Wrong account?{' '}
          <a href="/login" className="text-[#7AAAC8] hover:text-[#00BFA6] transition-colors font-medium">
            Sign in with a different email
          </a>
        </p>
      </div>
    </div>
  );
}
