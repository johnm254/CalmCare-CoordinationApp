import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — epimoyo',
  description: 'Terms governing use of the epimoyo platform for patients, families, and clinical teams.',
};

const EFFECTIVE_DATE = '1 January 2025';
const CONTACT_EMAIL = 'legal@epimoyo.health';
const COMPANY = 'epimoyo Health Ltd';

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-[#CFE0D8] text-base">Effective date: {EFFECTIVE_DATE}</p>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div className="bg-[#C8102E]/8 border border-[#C8102E]/20 rounded-2xl p-6 mb-10">
            <p className="text-sm text-[#1a3335] leading-relaxed m-0">
              <strong>Important:</strong> epimoyo is a care-coordination and monitoring tool. It is{' '}
              <strong>not a substitute for professional medical advice, diagnosis, or treatment.</strong>{' '}
              Always seek the guidance of a qualified health provider for any medical condition.
            </p>
          </div>

          <Section title="1. Acceptance of terms">
            <p>
              By creating an account or using any epimoyo service (the "Platform"), you agree to
              these Terms of Service ("Terms") between you and <strong>{COMPANY}</strong>. If you
              are using the Platform on behalf of a minor or a healthcare organisation, you confirm
              you have authority to bind that party to these Terms.
            </p>
            <p>
              If you do not agree, do not use the Platform.
            </p>
          </Section>

          <Section title="2. Description of service">
            <p>The Platform consists of:</p>
            <ul>
              <li>
                <strong>epimoyo mobile app</strong> — available to patients and their nominated
                caregivers for seizure logging, medication reminders, SOS alerts, and optional
                wearable integration
              </li>
              <li>
                <strong>epimoyo clinician portal</strong> — a web dashboard for licensed healthcare
                professionals to monitor patient data and manage care plans
              </li>
              <li>
                <strong>Notification services</strong> — SMS and email alerts delivered via
                integrated third-party providers
              </li>
            </ul>
            <p>
              Features marked "coming soon" or "preview" are provided without warranty and may
              change or be removed at any time.
            </p>
          </Section>

          <Section title="3. Eligibility">
            <ul>
              <li>You must be at least 18 years old, or have verifiable parental/guardian consent</li>
              <li>
                Clinician portal access is restricted to licensed healthcare professionals and
                authorised staff of registered healthcare facilities
              </li>
              <li>
                You must provide accurate registration information and keep it up to date
              </li>
            </ul>
          </Section>

          <Section title="4. Account security">
            <p>
              You are responsible for maintaining the confidentiality of your login credentials.
              You must notify us immediately at{' '}
              <a href="mailto:support@epimoyo.health">support@epimoyo.health</a> if you suspect
              unauthorised access. We are not liable for losses resulting from your failure to
              safeguard credentials.
            </p>
          </Section>

          <Section title="5. Acceptable use">
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any unlawful purpose or in violation of any applicable law</li>
              <li>Attempt to gain unauthorised access to other users' data or any system component</li>
              <li>Reverse-engineer, decompile, or disassemble the Platform</li>
              <li>Transmit malware, spam, or any disruptive code</li>
              <li>
                Use data accessed through the clinician portal for any purpose outside direct
                patient care without explicit written consent
              </li>
              <li>Resell or sublicense access to the Platform</li>
            </ul>
          </Section>

          <Section title="6. Health data and medical disclaimer">
            <p>
              The Platform enables logging, tracking, and sharing of health information to support
              epilepsy care coordination. It does <strong>not</strong>:
            </p>
            <ul>
              <li>Provide medical diagnoses</li>
              <li>Replace clinical judgement</li>
              <li>Constitute a medical device (unless explicitly certified as such under applicable law)</li>
            </ul>
            <p>
              Heart-rate and ECG data displayed in the app is provided for informational purposes.
              Clinical decisions must be made by qualified professionals. In a medical emergency,
              call your local emergency number immediately — do not rely solely on the SOS alert
              feature.
            </p>
          </Section>

          <Section title="7. SOS alert service">
            <p>
              The SOS alert feature sends notifications to your nominated emergency contacts and
              care team. You acknowledge that:
            </p>
            <ul>
              <li>Delivery depends on third-party SMS and email providers and network availability</li>
              <li>
                epimoyo does not guarantee delivery within any specific time and is not liable for
                delayed or undelivered alerts
              </li>
              <li>
                You are responsible for ensuring emergency contacts have consented to receiving
                such alerts and that their contact details are accurate
              </li>
            </ul>
          </Section>

          <Section title="8. Intellectual property">
            <p>
              All software, content, trademarks, and designs on the Platform are the property of
              {COMPANY} or its licensors. You are granted a limited, non-exclusive,
              non-transferable licence to use the Platform for its intended purpose. No other rights
              are granted.
            </p>
            <p>
              Data you enter (seizure logs, notes, etc.) remains yours. You grant epimoyo a licence
              to store and process it solely to provide the service, as described in our{' '}
              <Link href="/privacy" className="text-[#1F7A72] hover:underline">Privacy Policy</Link>.
            </p>
          </Section>

          <Section title="9. Fees and subscriptions">
            <p>
              Current pricing (if any) is displayed at the time of purchase or subscription. We
              reserve the right to change pricing with 30 days' notice. Continued use after the
              effective date of a price change constitutes acceptance. Refunds are handled on a
              case-by-case basis — contact{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="10. Suspension and termination">
            <p>
              We may suspend or terminate your access if you breach these Terms, if required by law,
              or if we reasonably believe your account poses a security risk. We will give you
              reasonable notice except where immediate action is necessary to protect others.
            </p>
            <p>
              You may delete your account at any time via the app (Me → Data & Privacy → Delete
              account). Deletion requests are processed within 30 days subject to legal retention
              requirements.
            </p>
          </Section>

          <Section title="11. Limitation of liability">
            <p>
              To the fullest extent permitted by Kenyan law, epimoyo's total liability for any
              claim arising from use of the Platform is limited to the fees you paid in the 12
              months preceding the claim, or KES 10,000, whichever is greater. We are not liable
              for indirect, incidental, or consequential damages, including loss of data, revenue,
              or health outcomes.
            </p>
            <p>
              Nothing in these Terms excludes liability for death or personal injury caused by our
              negligence, fraud, or any other liability that cannot be excluded by law.
            </p>
          </Section>

          <Section title="12. Governing law and disputes">
            <p>
              These Terms are governed by the laws of Kenya. Any dispute that cannot be resolved
              informally will be referred to the courts of Nairobi, Kenya. We encourage you to
              contact us first at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> — most issues can be
              resolved quickly without formal proceedings.
            </p>
          </Section>

          <Section title="13. Changes to these terms">
            <p>
              We may update these Terms from time to time. Material changes will be communicated by
              in-app notification and email at least 14 days before they take effect. Your continued
              use of the Platform after the effective date constitutes acceptance of the revised
              Terms.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              Legal enquiries:{' '}
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
          <Link href="/privacy" className="hover:text-[#CFE0D8] transition-colors">Privacy policy</Link>
          <Link href="/terms" className="text-[#CFE0D8]">Terms of service</Link>
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
