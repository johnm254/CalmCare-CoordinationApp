import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — epimoyo',
  description: 'How epimoyo collects, uses, and protects your personal health information.',
};

const EFFECTIVE_DATE = '1 January 2025';
const CONTACT_EMAIL = 'privacy@epimoyo.health';
const COMPANY = 'epimoyo Health Ltd';

export default function PrivacyPage() {
  return (
    <>
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[#0C1F20]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-[#F5EFE3]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            epimoyo
          </Link>
          <Link href="/" className="text-sm text-[#CFE0D8] hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="bg-[#F5EFE3] min-h-screen">
        {/* Hero */}
        <div className="bg-[#12383A] py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#CFE0D8] text-sm font-medium mb-3">Legal</p>
            <h1
              className="text-4xl md:text-5xl font-bold text-[#F5EFE3] mb-4"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Privacy Policy
            </h1>
            <p className="text-[#CFE0D8] text-base">Effective date: {EFFECTIVE_DATE}</p>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-6 py-14 prose prose-stone max-w-none">
          <div className="bg-[#12383A]/8 border border-[#12383A]/20 rounded-2xl p-6 mb-10">
            <p className="text-sm text-[#1a3335] leading-relaxed m-0">
              epimoyo processes sensitive health data on behalf of people living with epilepsy and
              their clinical teams. We take that responsibility seriously. This policy explains what
              we collect, why we collect it, how we protect it, and your rights under the{' '}
              <strong>Kenya Data Protection Act 2019 (DPA)</strong> and applicable health-data
              regulations.
            </p>
          </div>

          <Section title="1. Who we are">
            <p>
              <strong>{COMPANY}</strong> ("epimoyo", "we", "us") is the data controller for
              personal data processed through the epimoyo mobile application ("Mojo") and the
              epimoyo clinician web portal. Our registered address and data protection contact are
              available at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1F7A72]">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="2. Data we collect">
            <h3 className="font-semibold text-[#0C1F20] mt-4 mb-2">2.1 Information you provide</h3>
            <ul>
              <li>Name, email address, and phone number at registration</li>
              <li>Medical history relevant to epilepsy care (diagnosis type, medication regimen)</li>
              <li>Seizure logs: date, time, duration, type, severity, and free-text notes</li>
              <li>Medication doses marked taken or missed</li>
              <li>Emergency contact details you choose to add</li>
              <li>Profile photo (optional)</li>
            </ul>

            <h3 className="font-semibold text-[#0C1F20] mt-4 mb-2">2.2 Data collected automatically</h3>
            <ul>
              <li>Heart-rate and ECG data transmitted from an epimoyo-compatible wearable, where connected</li>
              <li>SOS alert metadata: timestamp, GPS location (if permission granted), and notification delivery status</li>
              <li>App diagnostics: crash reports, error logs (no health data included)</li>
              <li>Standard server logs: IP address, device type, OS version, app version</li>
            </ul>

            <h3 className="font-semibold text-[#0C1F20] mt-4 mb-2">2.3 Data we do not collect</h3>
            <ul>
              <li>Payment card or bank details (payments are processed by third-party providers)</li>
              <li>Social media credentials</li>
              <li>Location data outside of an active SOS alert (and only with explicit permission)</li>
            </ul>
          </Section>

          <Section title="3. Legal basis and purpose">
            <p>
              We process your data under the following lawful bases (Kenya DPA 2019, s. 30):
            </p>
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="bg-[#12383A]/10">
                  <th className="text-left p-3 border border-[#12383A]/20 font-semibold">Purpose</th>
                  <th className="text-left p-3 border border-[#12383A]/20 font-semibold">Lawful basis</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Providing the care-coordination service', 'Performance of contract'],
                  ['Seizure tracking and medication reminders', 'Explicit consent + vital interests'],
                  ['SOS alerts to emergency contacts and clinicians', 'Vital interests'],
                  ['Clinical dashboard for authorised care teams', 'Explicit consent + legitimate interests'],
                  ['Service improvement and bug fixing', 'Legitimate interests'],
                  ['Legal compliance and audit', 'Legal obligation'],
                ].map(([purpose, basis]) => (
                  <tr key={purpose} className="even:bg-stone-50">
                    <td className="p-3 border border-[#12383A]/20">{purpose}</td>
                    <td className="p-3 border border-[#12383A]/20 text-[#1F7A72] font-medium">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. How we share your data">
            <p>We do not sell your personal data. We share it only as described below:</p>
            <ul>
              <li>
                <strong>Your care team:</strong> Clinicians and healthcare workers you or a guardian
                has explicitly linked to your account can view your seizure history, medication
                adherence, and ECG data inside the clinician portal.
              </li>
              <li>
                <strong>Emergency contacts:</strong> When you trigger an SOS alert, your name,
                approximate location (if granted), and a summary of recent vital signs are sent to
                your nominated contacts via SMS and email.
              </li>
              <li>
                <strong>Sub-processors:</strong> We use Supabase (database and authentication),
                Resend (transactional email), and Africa's Talking (SMS). Each is contractually
                bound to process data only on our instructions and to maintain appropriate security.
              </li>
              <li>
                <strong>Legal requirements:</strong> We may disclose data if required by a court
                order or applicable law, and will notify you unless prohibited.
              </li>
            </ul>
          </Section>

          <Section title="5. Data retention">
            <p>
              Under the Kenya DPA 2019 and health-sector guidance, we retain health records for a
              minimum of <strong>7 years</strong> from the date of last activity, or until you
              request deletion (subject to legal holds). Specific periods:
            </p>
            <ul>
              <li>Seizure and medication logs: 7 years</li>
              <li>SOS alert records: 7 years</li>
              <li>Account profile data: duration of account + 2 years</li>
              <li>Server and diagnostic logs: 90 days</li>
            </ul>
          </Section>

          <Section title="6. Security">
            <p>
              All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Access to the
              production database is restricted to authorised personnel via multi-factor
              authentication. We conduct regular security reviews and promptly patch known
              vulnerabilities. In the event of a breach affecting your rights, we will notify the
              Office of the Data Protection Commissioner (ODPC) within 72 hours and affected users
              as soon as practicable.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>Under the Kenya DPA 2019 you have the right to:</p>
            <ul>
              <li><strong>Access</strong> — request a copy of personal data we hold about you</li>
              <li><strong>Rectification</strong> — correct inaccurate data</li>
              <li><strong>Erasure</strong> — request deletion, subject to legal retention requirements</li>
              <li><strong>Portability</strong> — receive your data in a machine-readable format (JSON export available in the app under Me → Data & Privacy)</li>
              <li><strong>Restriction</strong> — ask us to limit how we use your data</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
              <li><strong>Withdraw consent</strong> — where processing is consent-based, withdraw at any time without affecting prior lawful processing</li>
            </ul>
            <p>
              To exercise any right, email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1F7A72]">{CONTACT_EMAIL}</a>.
              We will respond within 21 days. You may also lodge a complaint with the{' '}
              <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-[#1F7A72]">
                Office of the Data Protection Commissioner
              </a>.
            </p>
          </Section>

          <Section title="8. Children">
            <p>
              Epilepsy affects people of all ages. Where the account holder is under 18, a parent
              or legal guardian must provide consent on their behalf. We do not knowingly process
              data of minors without guardian consent. If you believe we have inadvertently done so,
              contact us immediately at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1F7A72]">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="9. Cookies and tracking">
            <p>
              The clinician web portal uses only essential cookies required for authentication
              (Supabase session token) and security (CSRF token). We do not use advertising
              cookies. If we add analytics in future, we will update this policy and seek consent
              where required.
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              We may update this policy to reflect changes in our practices or law. Material changes
              will be notified by in-app message and email at least 14 days before they take effect.
              Continued use after the effective date constitutes acceptance.
            </p>
          </Section>

          <Section title="11. Contact us">
            <p>
              Data protection enquiries:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1F7A72]">{CONTACT_EMAIL}</a>
              <br />
              General support:{' '}
              <a href="mailto:support@epimoyo.health" className="text-[#1F7A72]">support@epimoyo.health</a>
            </p>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0C1F20] text-[#6B8588] py-8 px-6 text-sm text-center">
        <p>© {new Date().getFullYear()} epimoyo. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/privacy" className="text-[#CFE0D8]">Privacy policy</Link>
          <Link href="/terms" className="hover:text-[#CFE0D8] transition-colors">Terms of service</Link>
        </div>
      </footer>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="text-xl font-bold text-[#0C1F20] mb-4 pb-2 border-b border-[#12383A]/20"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        {title}
      </h2>
      <div className="text-[#1a3335] leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[#1F7A72] [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}
