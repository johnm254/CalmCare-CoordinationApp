import Link from 'next/link';
import type { Metadata } from 'next';
import AnimatedHero from '@/components/landing/AnimatedHero';
import AppShowcase from '@/components/landing/AppShowcase';
import ScrollReveal from '@/components/landing/ScrollReveal';

export const metadata: Metadata = {
  title: 'epimoyo — Epilepsy care, coordinated',
  description:
    'epimoyo connects patients, families, and clinicians for smarter epilepsy management — seizure tracking, medication reminders, SOS alerts, and real-time care coordination.',
};

function Logo({ light = false }: { light?: boolean }) {
  const stroke = light ? '#F5EFE3' : '#0C1F20';
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 48 48" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M39.6 15 A18 18 0 1 1 39.6 33" stroke={stroke} strokeWidth="5.5" strokeLinecap="round"/>
        <polyline points="3,24 12,24 16,13 22,35 27,24 39.6,24" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="40" cy="34" r="4.5" fill="#E8603C"/>
      </svg>
      <span style={{ fontFamily: "'Fraunces', Georgia, serif" }} className={`text-xl font-semibold tracking-tight ${light ? 'text-[#F5EFE3]' : 'text-[#0C1F20]'}`}>
        epimoyo
      </span>
    </span>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-[#F5EFE3]/95 backdrop-blur border-b border-[#D6CFC4]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="epimoyo home">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#3A5255]">
          <a href="#patients" className="hover:text-[#1F7A72] transition-colors">For Patients</a>
          <a href="#clinicians" className="hover:text-[#1F7A72] transition-colors">For Clinicians</a>
          <a href="#how-it-works" className="hover:text-[#1F7A72] transition-colors">How it works</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="#download"
            className="text-sm font-semibold bg-[#E8603C] text-white px-4 py-2 rounded-lg hover:bg-[#c94e2d] transition-colors"
          >
            Get the app
          </Link>
        </div>
      </div>
    </header>
  );
}


function StatsBar() {
  const stats = [
    { value: '10,000+', label: 'Seizures logged' },
    { value: '2,400+', label: 'Patients monitored' },
    { value: '98%', label: 'SOS alerts delivered' },
    { value: '350+', label: 'Clinicians onboarded' },
  ];
  return (
    <section className="bg-[#1F7A72] py-10 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              className="text-3xl font-bold text-white"
            >
              {s.value}
            </div>
            <div className="text-sm text-[#CFE0D8] mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const patientFeatures = [
  {
    icon: '🫀',
    title: 'Seizure tracking',
    desc: 'Log seizures instantly — type, duration, triggers, and severity — and build a history your doctor can actually use.',
  },
  {
    icon: '💊',
    title: 'Medication reminders',
    desc: 'Never miss a dose. Set flexible schedules and receive smart reminders that adapt to your routine.',
  },
  {
    icon: '🆘',
    title: 'SOS alerts',
    desc: 'One tap sends your location and a seizure alert to your entire care circle. Help is always one second away.',
  },
  {
    icon: '🤝',
    title: 'Care circle',
    desc: 'Invite family members, friends, and caregivers to your circle and control exactly what each person can see.',
  },
  {
    icon: '📈',
    title: 'Mood & health log',
    desc: 'Track mood, sleep, stress, and wellness trends to uncover patterns behind your seizures.',
  },
  {
    icon: '🏥',
    title: 'Hospital ready',
    desc: 'Your emergency hospital is pinned and shared with responders automatically — no searching in a crisis.',
  },
];

function PatientFeatures() {
  return (
    <section id="patients" className="py-20 px-6 bg-[#F5EFE3]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-[#1F7A72] uppercase tracking-widest">For patients</span>
          <h2
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-3xl md:text-4xl font-bold text-[#0C1F20] mt-3"
          >
            Everything you need, in your pocket
          </h2>
          <p className="text-[#3A5255] mt-4 max-w-xl mx-auto">
            The epimoyo app gives you the tools to understand your condition, stay safe, and keep your care team in the loop.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {patientFeatures.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <div className="bg-white rounded-2xl p-6 border border-[#E8E0D4] hover:shadow-md transition-shadow h-full">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-[#0C1F20] text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B8588] leading-relaxed">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function AppDownload() {
  return (
    <section id="download" className="bg-[#12383A] py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          className="text-3xl md:text-4xl font-bold text-[#F5EFE3] mb-4"
        >
          Get the epimoyo app
        </h2>
        <p className="text-[#CFE0D8] mb-10 text-lg">
          Free for patients. Direct APK download — no app store required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/epimoyo-latest.apk"
            download
            aria-label="Download epimoyo APK for Android"
            className="flex items-center gap-3 bg-[#E8603C] text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-[#c94e2d] transition-colors w-full sm:w-auto justify-center text-base"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M17.523 15.341a.75.75 0 0 1-1.06 0L13 11.879V19.5a.75.75 0 0 1-1.5 0v-7.621l-3.463 3.462a.75.75 0 1 1-1.06-1.06l4.75-4.75a.75.75 0 0 1 1.06 0l4.736 4.75a.75.75 0 0 1 0 1.06z"/>
              <path d="M5.25 6.75A2.25 2.25 0 0 1 7.5 4.5h9a2.25 2.25 0 0 1 2.25 2.25v.75H5.25v-.75z"/>
            </svg>
            Download APK (Android)
          </a>
          <a
            href="mailto:support@epimoyo.health?subject=iOS%20Access%20Request"
            className="flex items-center gap-3 bg-[#F5EFE3]/10 border border-[#CFE0D8]/30 text-[#CFE0D8] px-7 py-3.5 rounded-xl font-semibold hover:bg-[#F5EFE3]/20 transition-colors w-full sm:w-auto justify-center text-base"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            iOS — request access
          </a>
        </div>
        <p className="text-[#6B8588] text-sm mt-6">
          Already have an account?{' '}
          <Link href="/patient" className="text-[#CFE0D8] underline hover:text-white">
            Sign in to the patient portal
          </Link>
        </p>
      </div>
    </section>
  );
}

const clinicianFeatures = [
  {
    icon: '📊',
    title: 'Patient dashboard',
    desc: 'See all your patients at a glance — seizure frequency, medication adherence, and open follow-ups.',
  },
  {
    icon: '🔔',
    title: 'Smart alerts',
    desc: 'Configurable alert rules trigger automatically when a patient crosses a threshold you define.',
  },
  {
    icon: '📋',
    title: 'Follow-up management',
    desc: 'Create, assign, and track follow-up tasks so nothing slips between appointments.',
  },
  {
    icon: '📉',
    title: 'Seizure analytics',
    desc: 'Visualise trends over days, weeks, and months to guide treatment decisions with data.',
  },
];

function ClinicianFeatures() {
  return (
    <section id="clinicians" className="py-20 px-6 bg-[#EDE8DF]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-[#1F7A72] uppercase tracking-widest">For clinicians</span>
          <h2
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-3xl md:text-4xl font-bold text-[#0C1F20] mt-3"
          >
            Your patients, always in view
          </h2>
          <p className="text-[#3A5255] mt-4 max-w-xl mx-auto">
            The clinician portal gives you a live picture of every patient — from seizure logs to medication schedules — without waiting for the next visit.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {clinicianFeatures.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <div className="bg-white rounded-2xl p-6 border border-[#D6CFC4] hover:shadow-md transition-shadow flex gap-4 h-full">
                <div className="text-3xl shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-semibold text-[#0C1F20] text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-[#6B8588] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <div className="text-center">
          <a
            href="mailto:support@epimoyo.health?subject=Clinician%20Access%20Request"
            className="inline-block font-semibold bg-[#1F7A72] text-white px-8 py-3.5 rounded-xl hover:bg-[#12383A] transition-colors text-base"
          >
            Request clinician access
          </a>
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    num: '01',
    title: 'Patient downloads the app',
    desc: 'Takes 2 minutes to set up — log a seizure, invite caregivers, and add their emergency hospital.',
  },
  {
    num: '02',
    title: 'Clinician links the patient',
    desc: 'The clinician searches by patient email, sends a link request, and gets live access once accepted.',
  },
  {
    num: '03',
    title: 'Everyone stays connected',
    desc: 'Seizure logs, SOS events, and adherence data flow automatically to the care team — no manual reporting needed.',
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-[#F5EFE3]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-[#1F7A72] uppercase tracking-widest">How it works</span>
          <h2
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-3xl md:text-4xl font-bold text-[#0C1F20] mt-3"
          >
            Up and running in minutes
          </h2>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex-1 relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-[#D6CFC4] -translate-x-1/2 z-0" />
              )}
              <div className="relative z-10 bg-white rounded-2xl p-6 border border-[#E8E0D4] h-full">
                <div
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  className="text-4xl font-bold text-[#E8603C] mb-4"
                >
                  {s.num}
                </div>
                <h3 className="font-semibold text-[#0C1F20] text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-[#6B8588] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0C1F20] text-[#CFE0D8] py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <Logo light />
            <p className="mt-4 text-sm text-[#6B8588] leading-relaxed max-w-xs">
              epimoyo is a care-coordination platform for people living with epilepsy and the teams that support them.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F5EFE3] mb-4 uppercase tracking-wider">App</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#download" className="hover:text-white transition-colors">Download epimoyo</a></li>
              <li><a href="#patients" className="hover:text-white transition-colors">For patients</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F5EFE3] mb-4 uppercase tracking-wider">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className="hover:text-white transition-colors">Create account</Link></li>
              <li><Link href="/forgot-password" className="hover:text-white transition-colors">Reset password</Link></li>
              <li><a href="mailto:support@epimoyo.health" className="hover:text-white transition-colors">Contact support</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#6B8588]">
          <span>© {new Date().getFullYear()} epimoyo. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#CFE0D8] transition-colors">Privacy policy</Link>
            <Link href="/terms" className="hover:text-[#CFE0D8] transition-colors">Terms of service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <AnimatedHero />
        <StatsBar />
        <AppShowcase />
        <PatientFeatures />
        <AppDownload />
        <ClinicianFeatures />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
