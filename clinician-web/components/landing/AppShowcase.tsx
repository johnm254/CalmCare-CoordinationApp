'use client';

import { useState, useEffect } from 'react';

const TABS = ['Today', 'SOS Alert', 'Medications', 'Care Circle'] as const;
type Tab = (typeof TABS)[number];

function TodayScreen() {
  return (
    <div style={{ background: '#F5EFE3', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #E8E0D4' }}>
        <div style={{ fontSize: 10, color: '#6B8588' }}>Monday, Nov 10</div>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 700, color: '#0C1F20' }}>Today</div>
      </div>
      {/* BPM */}
      <div style={{ margin: '10px 10px 0', background: '#12383A', borderRadius: 14, padding: '10px 12px', color: 'white' }}>
        <div style={{ fontSize: 9, color: '#CFE0D8' }}>Heart rate · Now</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 700 }}>72</span>
          <span style={{ fontSize: 11, color: '#CFE0D8' }}>bpm</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#CFE0D8', background: 'rgba(31,122,114,0.4)', padding: '2px 7px', borderRadius: 20 }}>Normal</span>
        </div>
      </div>
      {/* Stats */}
      <div style={{ margin: '8px 10px 0', display: 'flex', gap: 6 }}>
        {[
          { label: 'Seizure-free', value: '14', unit: 'days', color: '#1F7A72' },
          { label: 'Mood', value: '8/10', unit: 'today', color: '#0C1F20' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: 'white', border: '1px solid #E8E0D4', borderRadius: 12, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: '#6B8588' }}>{s.label}</div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#6B8588' }}>{s.unit}</div>
          </div>
        ))}
      </div>
      {/* Next med */}
      <div style={{ margin: '8px 10px 0', background: 'white', border: '1px solid #E8E0D4', borderRadius: 12, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFF5E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💊</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#0C1F20' }}>Levetiracetam 500mg</div>
          <div style={{ fontSize: 9, color: '#6B8588' }}>Next dose at 8:00 PM</div>
        </div>
        <div style={{ fontSize: 9, color: '#1F7A72', fontWeight: 600 }}>Remind</div>
      </div>
      {/* Bottom nav */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid #E8E0D4', background: 'white', display: 'flex', padding: '7px 0 10px' }}>
        {['🏠', '📋', '💊', '👥', '👤'].map((icon, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 16, opacity: i === 0 ? 1 : 0.35 }}>{icon}</div>
        ))}
      </div>
    </div>
  );
}

function SOSScreen() {
  return (
    <div style={{ background: '#F5EFE3', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Red header */}
      <div style={{ background: '#C8102E', padding: '14px 14px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>Emergency alert</div>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'white' }}>SOS Sent</div>
      </div>
      {/* Pulsing circle */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 8px', position: 'relative' }}>
        <div className="animate-ring-pulse" style={{ position: 'absolute', width: 72, height: 72, borderRadius: '50%', background: 'rgba(200,16,46,0.15)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16, boxShadow: '0 4px 16px rgba(200,16,46,0.4)', position: 'relative', zIndex: 1 }}>SOS</div>
      </div>
      {/* Location */}
      <div style={{ margin: '0 10px', background: 'white', border: '1px solid #E8E0D4', borderRadius: 12, padding: '8px 10px' }}>
        <div style={{ fontSize: 9, color: '#6B8588', marginBottom: 2 }}>Location shared</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#0C1F20' }}>📍 Kenyatta Ave, Nairobi</div>
      </div>
      {/* Contacts notified */}
      <div style={{ margin: '8px 10px 0' }}>
        <div style={{ fontSize: 9, color: '#6B8588', marginBottom: 4, paddingLeft: 2 }}>Care circle notified</div>
        {[
          { name: 'Mom (Grace)', role: 'Guardian', notified: true },
          { name: 'Dr. Kamau', role: 'Clinician', notified: true },
          { name: 'John (Brother)', role: 'Family', notified: true },
        ].map((c) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #E8E0D4', borderRadius: 10, padding: '6px 10px', marginBottom: 5 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#12383A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 9, fontWeight: 600 }}>
              {c.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#0C1F20' }}>{c.name}</div>
              <div style={{ fontSize: 9, color: '#6B8588' }}>{c.role}</div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1F7A72' }} />
          </div>
        ))}
      </div>
      {/* Cancel */}
      <div style={{ margin: '8px 10px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#6B8588', background: 'white', border: '1px solid #E8E0D4', borderRadius: 10, padding: '7px 14px', display: 'inline-block' }}>Cancel alert</div>
      </div>
    </div>
  );
}

function MedicationsScreen() {
  return (
    <div style={{ background: '#F5EFE3', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #E8E0D4' }}>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 700, color: '#0C1F20' }}>Medications</div>
        <div style={{ fontSize: 10, color: '#6B8588' }}>2 of 2 taken today</div>
      </div>
      {/* Progress bar */}
      <div style={{ margin: '10px 10px 0' }}>
        <div style={{ height: 6, borderRadius: 3, background: '#E8E0D4', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', background: '#1F7A72', borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 9, color: '#1F7A72', marginTop: 3, textAlign: 'right', fontWeight: 600 }}>All done ✓</div>
      </div>
      {/* Med cards */}
      {[
        { name: 'Levetiracetam', dose: '500 mg', schedule: '8:00 AM · 8:00 PM', taken: true, icon: '💊' },
        { name: 'Valproic acid', dose: '250 mg', schedule: '8:00 AM only', taken: true, icon: '🔵' },
        { name: 'Clonazepam', dose: '0.5 mg', schedule: 'As needed', taken: false, icon: '⚪' },
      ].map((m) => (
        <div key={m.name} style={{ margin: '7px 10px 0', background: 'white', border: '1px solid #E8E0D4', borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: m.taken ? '#E8F5F4' : '#F5EFE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{m.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0C1F20' }}>{m.name}</div>
            <div style={{ fontSize: 10, color: '#6B8588' }}>{m.dose} · {m.schedule}</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: m.taken ? '#1F7A72' : '#D6CFC4' }}>{m.taken ? '✓ Taken' : 'Log'}</div>
        </div>
      ))}
      {/* Add button */}
      <div style={{ margin: '10px 10px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#1F7A72', fontWeight: 600 }}>+ Add medication</div>
      </div>
      <div style={{ marginTop: 'auto', borderTop: '1px solid #E8E0D4', background: 'white', display: 'flex', padding: '7px 0 10px' }}>
        {['🏠', '📋', '💊', '👥', '👤'].map((icon, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 16, opacity: i === 2 ? 1 : 0.35 }}>{icon}</div>
        ))}
      </div>
    </div>
  );
}

function CareCircleScreen() {
  return (
    <div style={{ background: '#F5EFE3', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #E8E0D4' }}>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 700, color: '#0C1F20' }}>Care Circle</div>
        <div style={{ fontSize: 10, color: '#6B8588' }}>4 members · all active</div>
      </div>
      <div style={{ padding: '10px 10px 0', flex: 1 }}>
        {[
          { name: 'Grace Mwangi', role: 'Guardian · Mom', initials: 'GM', color: '#12383A', access: 'Full access' },
          { name: 'Dr. James Kamau', role: 'Clinician', initials: 'JK', color: '#1F7A72', access: 'Clinical data' },
          { name: 'John Mwangi', role: 'Family · Brother', initials: 'JM', color: '#E8603C', access: 'SOS alerts' },
          { name: 'Anne Wanjiru', role: 'Caregiver', initials: 'AW', color: '#F1C76B', access: 'Location only' },
        ].map((m) => (
          <div key={m.name} style={{ background: 'white', border: '1px solid #E8E0D4', borderRadius: 14, padding: '10px 12px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {m.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0C1F20', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
              <div style={{ fontSize: 9, color: '#6B8588' }}>{m.role}</div>
            </div>
            <div style={{ fontSize: 9, color: '#3A5255', background: '#F0EDEA', borderRadius: 6, padding: '2px 6px', flexShrink: 0 }}>{m.access}</div>
          </div>
        ))}
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <div style={{ fontSize: 10, color: '#1F7A72', fontWeight: 600 }}>+ Invite member</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #E8E0D4', background: 'white', display: 'flex', padding: '7px 0 10px' }}>
        {['🏠', '📋', '💊', '👥', '👤'].map((icon, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 16, opacity: i === 3 ? 1 : 0.35 }}>{icon}</div>
        ))}
      </div>
    </div>
  );
}

const SCREENS: Record<Tab, React.ReactNode> = {
  'Today': <TodayScreen />,
  'SOS Alert': <SOSScreen />,
  'Medications': <MedicationsScreen />,
  'Care Circle': <CareCircleScreen />,
};

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  'Today': 'Your daily health dashboard — heart rate, seizure-free streak, upcoming medications, and quick actions all in one place.',
  'SOS Alert': 'One tap sends your GPS location and an emergency alert to your entire care circle, instantly. Help is never more than a second away.',
  'Medications': 'Smart reminders, dose tracking, and a full medication schedule so you never miss a dose that matters.',
  'Care Circle': 'Invite family, friends, and clinicians — each with custom access levels. Everyone stays informed without compromising your privacy.',
};

export default function AppShowcase() {
  const [active, setActive] = useState<Tab>('Today');
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const idx = TABS.indexOf(prev);
        return TABS[(idx + 1) % TABS.length];
      });
      setAnimKey((k) => k + 1);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  function handleTab(tab: Tab) {
    setActive(tab);
    setAnimKey((k) => k + 1);
  }

  return (
    <section className="bg-[#EDE8DF] py-20 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-[#1F7A72] uppercase tracking-widest">
            See it in action
          </span>
          <h2
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            className="text-3xl md:text-4xl font-bold text-[#0C1F20] mt-3"
          >
            The app that moves with you
          </h2>
          <p className="text-[#3A5255] mt-4 max-w-xl mx-auto">
            Every screen built for the moments that matter — from daily check-ins to emergency alerts.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-14">
          {/* Left: tab list + descriptions */}
          <div className="flex-1 w-full max-w-lg mx-auto lg:mx-0">
            <div className="space-y-3">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTab(tab)}
                  className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-300 ${
                    active === tab
                      ? 'bg-[#12383A] border-[#12383A] text-white shadow-lg'
                      : 'bg-white border-[#E8E0D4] text-[#0C1F20] hover:border-[#1F7A72] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        active === tab ? 'bg-[#E8603C]' : 'bg-[#D6CFC4]'
                      }`}
                    />
                    <span className="font-semibold text-sm">{tab}</span>
                  </div>
                  {active === tab && (
                    <p className="mt-2 text-sm leading-relaxed text-[#CFE0D8] ml-5">
                      {TAB_DESCRIPTIONS[tab]}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2 mt-6 ml-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTab(tab)}
                  aria-label={tab}
                  className={`rounded-full transition-all duration-300 ${
                    active === tab
                      ? 'w-6 h-2 bg-[#1F7A72]'
                      : 'w-2 h-2 bg-[#D6CFC4] hover:bg-[#1F7A72]'
                  }`}
                />
              ))}
              <span className="text-xs text-[#6B8588] ml-2">Auto-playing</span>
            </div>
          </div>

          {/* Right: phone */}
          <div className="flex justify-center shrink-0">
            <div
              style={{
                width: 258,
                height: 516,
                background: '#0a1a1b',
                borderRadius: 38,
                border: '8px solid #1a3335',
                boxShadow:
                  '0 40px 80px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.07)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Dynamic island */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 84,
                  height: 24,
                  background: '#0a1a1b',
                  borderRadius: 12,
                  zIndex: 10,
                }}
              />

              {/* Status bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 44,
                  background: 'rgba(245,239,227,0.95)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  padding: '0 18px 6px',
                  fontSize: 10,
                  color: '#6B8588',
                  zIndex: 5,
                }}
              >
                <span style={{ fontWeight: 600 }}>9:41</span>
                <span>◉◉ 100%</span>
              </div>

              {/* Screen content */}
              <div
                key={animKey}
                className="animate-slide-right"
                style={{
                  position: 'absolute',
                  inset: 0,
                  paddingTop: 44,
                  overflow: 'hidden',
                }}
              >
                {SCREENS[active]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
