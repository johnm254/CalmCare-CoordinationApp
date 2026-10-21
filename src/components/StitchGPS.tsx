export default function StitchGPS({ back }: { back: () => void }) {
  return (
    <div className="dark bg-surface text-on-surface antialiased min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Back button */}
      <div className="fixed top-0 left-0 z-[100] pt-4 pl-4">
        <button
          onClick={back}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-primary text-sm font-semibold hover:bg-surface-container-highest transition-colors"
        >
          ← Back
        </button>
      </div>

      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-surface-container-low/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
        <div className="h-16 w-full px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-max">
            <div className="flex flex-col">
              <span className="font-title-md text-on-surface tracking-tight leading-none" style={{ fontSize: 16, fontWeight: 600 }}>Project Epi</span>
              <span className="text-secondary text-xs mt-1">GPS &amp; Emergency</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-error-container hover:bg-error-container/80 text-on-error-container font-semibold transition-all shadow-[0_0_12px_rgba(226,75,74,0.35)]" type="button">
              <span className="material-symbols-outlined text-lg animate-pulse">e911_emergency</span>
              <span>SOS</span>
            </button>
          </div>
        </div>
      </header>

      <div className="md:pl-64">
        <main className="relative w-full pt-20 pb-20 md:pb-8 bg-surface px-4 lg:px-8 min-h-screen">

          {/* Hero section */}
          <section className="w-full mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-low p-4 lg:p-6 rounded-xl shadow-md relative overflow-hidden">
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-start md:items-center gap-4 relative z-10">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-error-container text-on-error-container shadow-lg">
                  <span className="material-symbols-outlined text-2xl animate-pulse">crisis_alert</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-error uppercase tracking-wider bg-error-container/30 px-2 py-0.5 rounded-full">Automated Triage Standby</span>
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                      High-Precision RTK Fix (0.8m)
                    </span>
                  </div>
                  <h1 className="text-xl font-semibold text-on-surface tracking-tight">GPS Telemetry &amp; Critical Response Unit</h1>
                  <p className="text-sm text-on-surface-variant mt-0.5">Live vectoring • Wearable Strap Link: 92% Signal Sync</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 relative z-10">
                <button className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all" type="button">
                  <span className="material-symbols-outlined text-error text-lg">cancel</span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-error uppercase leading-none">Safe Override</span>
                    <span className="font-semibold text-on-surface leading-tight mt-0.5">Cancel False Alarm</span>
                  </div>
                </button>
                <a className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-error hover:bg-error/90 text-on-error font-semibold shadow-lg transition-transform active:scale-95" href="tel:999">
                  <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                  <span>Call Ambulance (999)</span>
                </a>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full mb-8">
            {/* Map */}
            <div className="xl:col-span-8 flex flex-col gap-6">
              <div className="relative w-full rounded-xl overflow-hidden bg-surface-container shadow-xl min-h-[520px] flex flex-col">
                <div className="relative w-full h-[400px] lg:h-[460px] bg-surface-container-lowest overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-6xl text-primary">map</span>
                      <p className="mt-2 text-sm">Live GPS Map — Nairobi Upper Hill</p>
                      <p className="text-xs mt-1">1.2988° S, 36.8122° E</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/20 to-transparent pointer-events-none"></div>
                  <div className="absolute top-4 left-4 bg-surface-container-low/90 backdrop-blur-md px-3.5 py-2 rounded-lg shadow-md flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-base">my_location</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface-variant uppercase">Coordinates</span>
                      <span className="text-sm font-medium text-primary tracking-wider">1.2988° S, 36.8122° E</span>
                    </div>
                    <span className="text-xs font-bold bg-secondary-container/40 text-on-secondary-container px-2 py-0.5 rounded-full">Alt: 1,678m</span>
                  </div>
                  <div className="absolute bottom-6 left-6 max-w-sm bg-surface-container-low/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                        </span>
                        <span className="font-semibold text-on-surface">Active Subject Target</span>
                      </div>
                      <span className="text-xs font-bold bg-surface-container-highest px-2 py-0.5 rounded text-secondary">Aura Phase 2</span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-3">Telemetry detected high spike in galvanic skin conductance + tachycardia.</p>
                    <div className="flex items-center justify-between text-sm text-secondary bg-surface-container-high/60 px-3 py-1.5 rounded-lg">
                      <span>ETA Nearest ALS Unit:</span>
                      <span className="text-on-surface font-bold">04m 12s</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-sm">satellite_alt</span>
                      <span className="text-sm text-on-surface-variant">Galileo + GPS L5 Lock</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">cell_tower</span>
                      <span className="text-sm text-on-surface-variant">Cell ID: NRB-UHP-0881</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              {/* Hospitals */}
              <div className="bg-surface-container-low p-5 rounded-xl shadow-md flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-xl">local_hospital</span>
                    <h3 className="font-semibold text-on-surface">Nearest Hospitals</h3>
                  </div>
                  <span className="text-xs font-bold bg-surface-container-high text-secondary px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">offline_pin</span> Offline Cached
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-on-surface">The Nairobi Hospital</h4>
                        <p className="text-sm text-on-surface-variant">Argwings Kodhek Rd, Upper Hill</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-semibold text-primary leading-none">1.8 <span className="text-xs uppercase">km</span></span>
                        <span className="block text-xs font-bold text-secondary mt-0.5">6 mins ETA</span>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-sm text-on-surface-variant flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> ER Open (0 wait)
                      </span>
                      <a className="text-sm text-primary hover:underline flex items-center gap-1" href="tel:+254202845000">
                        <span className="material-symbols-outlined text-sm">call</span> Direct ER
                      </a>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-on-surface">Aga Khan University Hospital</h4>
                        <p className="text-sm text-on-surface-variant">3rd Parklands Avenue</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-semibold text-on-surface leading-none">3.4 <span className="text-xs uppercase">km</span></span>
                        <span className="block text-xs font-bold text-on-surface-variant mt-0.5">11 mins</span>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-sm text-on-surface-variant flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> 3 Ambulances Ready
                      </span>
                      <a className="text-sm text-primary hover:underline flex items-center gap-1" href="tel:+254203662000">
                        <span className="material-symbols-outlined text-sm">call</span> Dispatch
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMS Fallback */}
              <div className="bg-surface-container-low p-5 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-xl">sms_failed</span>
                    <span className="font-semibold text-on-surface">SMS Fallback Engine</span>
                  </div>
                  <span className="text-xs font-bold bg-secondary-container/40 text-on-secondary-container px-2 py-0.5 rounded">GSM Standby</span>
                </div>
                <p className="text-sm text-on-surface-variant mb-3">If data drops, hardware sends encrypted GSM SMS with GPS coords to kin.</p>
                <div className="bg-surface-container-lowest p-3 rounded-lg font-mono text-sm text-primary mb-3 leading-relaxed break-all">
                  [EPI-SOS] Patient: Sarah Mwangi LOC: -1.2988,36.8122 ACC:0.8m TIME:14:02EAT MED:Keppra-750mg
                </div>
              </div>
            </div>
          </div>

          {/* Medical profile footer */}
          <section className="w-full bg-surface-container-low p-6 rounded-xl shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container/30 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">medication_liquid</span>
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface">Immediate Med Profile</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Levetiracetam (Keppra) 750mg BID. Last taken: 08:30 AM. Known mild reaction to Benzodiazepine boluses.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">health_and_safety</span>
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface">First Responder Action</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Roll into left lateral recovery. Clear furniture. Do not insert objects in mouth. O2 if SpO2 &lt; 90%.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">contact_phone</span>
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface">Lead Neurologist</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Dr. Kenneth Omondi, MD (Aga Khan). Telemetry auto-transmitted to neurology on-call desk.</p>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
