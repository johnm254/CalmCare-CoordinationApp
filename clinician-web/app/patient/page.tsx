import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'epimoyo — Patient portal',
  description: 'Download the epimoyo app, reset your password, or manage your patient account.',
};

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 48 48" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M39.6 15 A18 18 0 1 1 39.6 33" stroke="#0C1F20" strokeWidth="5.5" strokeLinecap="round"/>
        <polyline points="3,24 12,24 16,13 22,35 27,24 39.6,24" stroke="#0C1F20" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="40" cy="34" r="4.5" fill="#E8603C"/>
      </svg>
      <span style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-xl font-semibold text-[#0C1F20]">
        epimoyo
      </span>
    </span>
  );
}

export default function PatientPortalPage() {
  return (
    <div className="min-h-screen bg-[#F5EFE3] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#D6CFC4] bg-[#F5EFE3]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="epimoyo home">
            <Logo />
          </Link>
          <Link href="/" className="text-sm text-[#6B8588] hover:text-[#0C1F20] transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#12383A] py-16 px-6 text-center">
          <h1
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-3xl md:text-4xl font-bold text-[#F5EFE3] mb-4"
          >
            Patient portal
          </h1>
          <p className="text-[#CFE0D8] max-w-md mx-auto">
            Download the epimoyo app, manage your account, or get support.
          </p>
        </section>

        <div className="max-w-5xl mx-auto px-6 py-16">
          {/* Download section */}
          <section className="mb-16">
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-2xl font-bold text-[#0C1F20] mb-2"
            >
              Get the app
            </h2>
            <p className="text-[#6B8588] mb-8">
              The epimoyo mobile app is where everything happens — free to download.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <a
                href="/epimoyo-latest.apk"
                download="epimoyo-latest.apk"
                aria-label="Download the epimoyo Android APK"
                className="flex items-center gap-4 bg-[#0C1F20] text-[#F5EFE3] rounded-2xl px-6 py-4 hover:bg-[#12383A] transition-colors"
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                  <path d="M3.18 23.76c.3.17.65.2.98.07l11.65-6.72-2.6-2.6L3.18 23.76zM.49 1.1A1.49 1.49 0 0 0 0 2.25v19.5c0 .47.18.9.49 1.15l.06.05 10.94-10.94v-.26L.55 1.05.49 1.1zM20.4 10.4l-2.78-1.6-2.93 2.93 2.93 2.93 2.8-1.62a1.5 1.5 0 0 0 0-2.64zM4.16.17L15.81 6.9l-2.6 2.6L4.16.17z"/>
                </svg>
                <div>
                  <div className="text-xs text-[#CFE0D8]">Get it on</div>
                  <div className="font-semibold text-base">Google Play</div>
                </div>
              </a>
              <a
                href="mailto:support@epimoyo.health?subject=iOS%20Access%20Request"
                className="flex items-center gap-4 bg-[#0C1F20] text-[#F5EFE3] rounded-2xl px-6 py-4 hover:bg-[#12383A] transition-colors"
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <div className="text-xs text-[#CFE0D8]">Download on the</div>
                  <div className="font-semibold text-base">App Store</div>
                </div>
              </a>
            </div>
          </section>

          {/* Quick actions */}
          <section className="mb-16">
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-2xl font-bold text-[#0C1F20] mb-2"
            >
              Account
            </h2>
            <p className="text-[#6B8588] mb-8">
              Manage your epimoyo account.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              <Link
                href="/forgot-password"
                className="bg-white border border-[#E8E0D4] rounded-2xl p-6 hover:shadow-md transition-shadow group"
              >
                <div className="text-3xl mb-3">🔑</div>
                <h3 className="font-semibold text-[#0C1F20] mb-1 group-hover:text-[#1F7A72] transition-colors">
                  Reset password
                </h3>
                <p className="text-sm text-[#6B8588]">
                  Forgot your password? Set a new one via email.
                </p>
              </Link>
              <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="font-semibold text-[#0C1F20] mb-1">Need help?</h3>
                <p className="text-sm text-[#6B8588] mb-4">
                  Contact our support team — we typically reply within 24 hours.
                </p>
                <a
                  href="mailto:support@epimoyo.health"
                  className="text-sm font-semibold text-[#1F7A72] hover:text-[#12383A] transition-colors"
                >
                  support@epimoyo.health →
                </a>
              </div>
              <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="font-semibold text-[#0C1F20] mb-1">Your clinician</h3>
                <p className="text-sm text-[#6B8588]">
                  To link with a clinician, ask them to send you an invite from their portal.
                </p>
              </div>
            </div>
          </section>

          {/* What the app does */}
          <section>
            <h2
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-2xl font-bold text-[#0C1F20] mb-2"
            >
              What you can do with epimoyo
            </h2>
            <p className="text-[#6B8588] mb-8">Everything is on the mobile app — here is a quick overview.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '🫀', label: 'Log seizures' },
                { icon: '💊', label: 'Track medications' },
                { icon: '🆘', label: 'SOS alerts' },
                { icon: '🤝', label: 'Care circle' },
                { icon: '📈', label: 'Mood tracking' },
                { icon: '🌡️', label: 'Health logs' },
                { icon: '🏥', label: 'Emergency hospital' },
                { icon: '📲', label: 'Wearable strap' },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-[#E8E0D4] rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm font-medium text-[#3A5255]">{item.label}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D6CFC4] py-6 px-6 text-center text-sm text-[#6B8588]">
        <span>© {new Date().getFullYear()} epimoyo. </span>
        <Link href="/" className="hover:text-[#0C1F20] transition-colors">Home</Link>
        <span className="mx-2">·</span>
        <Link href="/login" className="hover:text-[#0C1F20] transition-colors">Clinician portal</Link>
        <span className="mx-2">·</span>
        <a href="mailto:support@epimoyo.health" className="hover:text-[#0C1F20] transition-colors">Support</a>
      </footer>
    </div>
  );
}
