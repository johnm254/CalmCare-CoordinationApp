import { useEffect, useRef, useState } from "react";

export default function StitchVitals({ back }: { back: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordCountdown, setRecordCountdown] = useState(30);
  const [limitsVisible, setLimitsVisible] = useState(true);
  const [sedentaryActive, setSedentaryActive] = useState(true);
  const [liveBpm, setLiveBpm] = useState(71);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveBpm(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.min(78, Math.max(68, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRecording(false);
          setRecordCountdown(30);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    if (isRecording) return;
    setIsRecording(true);
    setRecordCountdown(30);
  };

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
            <img alt="Mojo brand logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1X11sUo6w1A3CZazeoGGiXvO4g-TAR5XyDj46485sZkPflTjh23SF-s-CBelHVfMDMI-oT_sfep3jOw_dsxyiQa2KBz0UdLB0u4gu0dMY06SsYgoQT0OOPdN0-NwxKeIYYSSZZne3ukJCan1JBqR7aHzGnOVrtFcq8F47ISnZIJ4hm84tEgOLXakHNrNegqSC0M1i70Wqx908CdPyNz5XFQHrQJZXWBUe3lYY6CS2D0HaahG_O_fSvR_cOP" />
            <div className="flex flex-col">
              <span className="text-on-surface tracking-tight leading-none" style={{ fontSize: 16, fontWeight: 600 }}>Mojo</span>
              <span className="text-secondary tracking-normal leading-none mt-1" style={{ fontSize: 12 }}>Clinical Telemetry</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-error-container hover:bg-error-container/80 text-on-error-container transition-all shadow-[0_0_12px_rgba(226,75,74,0.35)]" style={{ fontSize: 16, fontWeight: 600 }} type="button">
              <span className="material-symbols-outlined text-lg animate-pulse">e911_emergency</span>
              <span>SOS</span>
            </button>
          </div>
        </div>
      </header>

      <div className="md:pl-64">
        <main className="relative w-full pt-16 pb-20 md:pb-8 bg-surface px-4 lg:px-8 min-h-screen">
          <div className="flex flex-col w-full pb-12">

            {/* Page header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="uppercase tracking-wider text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>Diagnostic Workspace</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="text-on-surface-variant" style={{ fontSize: 11 }}>Lead-I Micro-Telemetry</span>
                </div>
                <h1 className="text-on-surface tracking-tight" style={{ fontSize: 36, lineHeight: "44px", fontWeight: 600 }}>Vitals &amp; Biometric Telemetry</h1>
              </div>
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low shadow-sm">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-on-surface font-semibold" style={{ fontSize: 13 }}>Dual-Path Offline Buffer Active</span>
                    <span className="text-on-surface-variant" style={{ fontSize: 12 }}>42.4h cache safe • Auto-sync on BLE Handshake</span>
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary transition-all shadow-sm"
                  onClick={() => setLimitsVisible(v => !v)}
                >
                  <span className="material-symbols-outlined text-lg">tune</span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Clinician Limits</span>
                  <span className={`px-1.5 py-0.5 rounded-full font-bold ${limitsVisible ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-on-surface-variant"}`} style={{ fontSize: 11 }}>
                    {limitsVisible ? "ON" : "MUTED"}
                  </span>
                </button>
              </div>
            </div>

            {/* Clinician threshold bar */}
            {limitsVisible && (
              <div className="mb-6 p-4 rounded-xl bg-surface-container-low shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary-container text-on-primary-container mt-0.5">
                      <span className="material-symbols-outlined text-xl">verified_user</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Physician Safeguard Boundaries Enforced</span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>Set by Dr. Amara Okafor, MD (Lead Cardiologist)</span>
                      </div>
                      <p className="text-on-surface-variant mt-0.5" style={{ fontSize: 12 }}>
                        Target thresholds tailored to nocturnal seizure prodrome detection: Bradycardia alert below 48 BPM; Tachycardia alarm above 128 BPM; SBP trigger threshold ≥ 140 mmHg.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container text-primary hover:bg-surface-container-highest transition-colors" style={{ fontSize: 16, fontWeight: 600 }}>
                      Audit Protocol
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Hardware Strap */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-surface-container-low p-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-xl">watch</span>
                      <span className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>Mojo Strap</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase tracking-wider" style={{ fontSize: 11 }}>BLE 5.3 Connected</span>
                  </div>
                  <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container-lowest mb-5 shadow-inner">
                    <img alt="Modern smart health wearable wristband strap device" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-sZcmtZIEwGqFTmcJbFT5VQxZotrtQ0AMhIcFbjN2j3hA_2D6JeypaZ5xmrN_d3xu5W0qCRKCoWhRzV8ZGpVcgPrRGfy3nEu_gbfmy8lCLl20pES3FHzff_ncvb5auWU_tZRdjCMvtpCa8jXHTmvoLEF8qZQkaBrXBhiXXHrTi6vtuzJ8Why7uf4FZMEQuqQgJ-cmOGjtbNIJc4WG3jys9Lx2cO8pGgSx_stTlJo3DBA6fCfyDaPoRA" />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-on-surface">
                      <span className="bg-surface-dim/80 backdrop-blur-md px-2 py-0.5 rounded" style={{ fontSize: 13 }}>Bio-Impedance: 142kΩ (Optimal)</span>
                      <span className="bg-primary/20 text-primary backdrop-blur-md px-2 py-0.5 rounded" style={{ fontSize: 11, fontWeight: 700 }}>Dual PPG + Galvanic</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-surface-container">
                      <div className="flex items-center justify-between text-on-surface-variant mb-1">
                        <span style={{ fontSize: 12 }}>Battery State</span>
                        <span className="material-symbols-outlined text-secondary text-base">battery_charging_90</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-on-surface" style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600 }}>92%</span>
                        <span className="text-secondary" style={{ fontSize: 12 }}>~38h rem</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-highest mt-2 overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "92%" }}></div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container">
                      <div className="flex items-center justify-between text-on-surface-variant mb-1">
                        <span style={{ fontSize: 12 }}>Flash Memory</span>
                        <span className="material-symbols-outlined text-primary text-base">memory</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-on-surface" style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600 }}>48h</span>
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Capacity</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-on-surface-variant" style={{ fontSize: 11 }}>
                        <span>Used: 5.6h</span>
                        <span className="text-secondary">42.4h Free</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-container">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Active Firmware</span>
                      <span className="text-on-surface font-semibold" style={{ fontSize: 13 }}>v2.4.1-rc3 (Medical Release)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Electrode Contact Quality</span>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-secondary"></span>
                        <span className="text-secondary font-medium" style={{ fontSize: 13 }}>Gold-standard Conductive</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Last Complete Flash Flush</span>
                      <span className="text-on-surface-variant" style={{ fontSize: 13 }}>14 mins ago via Coordinator</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors" style={{ fontSize: 16, fontWeight: 600 }}>
                    <span className="material-symbols-outlined text-base">restart_alt</span>
                    Calibrate Sensors
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm" style={{ fontSize: 16, fontWeight: 600 }}>
                    <span className="material-symbols-outlined text-base">sync</span>
                    Force Syllable Ping
                  </button>
                </div>
              </div>

              {/* ECG */}
              <div className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-surface-container-low p-6 shadow-sm">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-surface-container-high text-secondary">
                        <span className="material-symbols-outlined text-2xl animate-pulse">ecg_heart</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>Continuous Lead-I Rhythm Strip</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container" style={{ fontSize: 11, fontWeight: 700 }}>LIVE 250 Hz</span>
                        </div>
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Standard Calibration 25mm/s • 10mm/mV</span>
                      </div>
                    </div>
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm ${isRecording ? "bg-error-container text-on-error-container" : "bg-primary-container hover:bg-secondary-container text-on-primary-container"}`}
                      onClick={startRecording}
                      style={{ fontSize: 16, fontWeight: 600 }}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">radio_button_checked</span>
                      <span>{isRecording ? `Recording... ${recordCountdown}s` : "Capture 30s ECG"}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-surface-container">
                      <span className="text-on-surface-variant block" style={{ fontSize: 12 }}>Resting Heart Rate</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-on-surface font-bold tracking-tight" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>{liveBpm}</span>
                        <span className="text-on-surface-variant" style={{ fontSize: 13 }}>BPM</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>
                        <span className="material-symbols-outlined text-xs">trending_flat</span>
                        <span>Baseline nominal</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container">
                      <span className="text-on-surface-variant block" style={{ fontSize: 12 }}>PR &amp; QRS Durations</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-on-surface" style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600 }}>158</span>
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>/ 88 ms</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-on-surface-variant" style={{ fontSize: 11 }}>
                        <span>QTc: 412 ms (Clean)</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container">
                      <span className="text-on-surface-variant block" style={{ fontSize: 12 }}>Device Classification</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="h-2 w-2 rounded-full bg-secondary"></span>
                        <span className="text-secondary truncate" style={{ fontSize: 16, fontWeight: 600 }}>Normal Sinus</span>
                      </div>
                      <span className="text-on-surface-variant mt-1 block" style={{ fontSize: 11, fontWeight: 700 }}>Zero Ectopic Beats</span>
                    </div>
                  </div>

                  {/* ECG Waveform */}
                  <div className="relative w-full h-48 rounded-lg bg-surface-container-lowest overflow-hidden shadow-inner flex flex-col justify-center">
                    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern height="10" id="smallGridV" patternUnits="userSpaceOnUse" width="10">
                          <path className="text-primary" d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                        <pattern height="50" id="majorGridV" patternUnits="userSpaceOnUse" width="50">
                          <rect fill="url(#smallGridV)" height="50" width="50" />
                          <path className="text-primary" d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1.2" />
                        </pattern>
                      </defs>
                      <rect fill="url(#majorGridV)" height="100%" width="100%" />
                    </svg>
                    {limitsVisible && (
                      <div className="absolute inset-x-0 inset-y-0 pointer-events-none flex flex-col justify-between py-6 px-3">
                        <div className="flex items-center justify-between text-error/80" style={{ fontSize: 11 }}>
                          <span className="bg-surface-container-lowest/80 px-1 py-0.5 rounded">Tachycardia Ceiling (128 BPM / +1.8mV Limit)</span>
                          <div className="w-full h-px border-dashed bg-error/40 mx-2"></div>
                          <span>MAX</span>
                        </div>
                        <div className="flex items-center justify-between text-secondary/70" style={{ fontSize: 11 }}>
                          <span className="bg-surface-container-lowest/80 px-1 py-0.5 rounded">Isoelectric Baseline 0.0mV</span>
                          <div className="w-full h-px bg-secondary/20 mx-2"></div>
                          <span>REF</span>
                        </div>
                        <div className="flex items-center justify-between text-error/80" style={{ fontSize: 11 }}>
                          <span className="bg-surface-container-lowest/80 px-1 py-0.5 rounded">Bradycardia Floor (48 BPM / -1.2mV Limit)</span>
                          <div className="w-full h-px border-dashed bg-error/40 mx-2"></div>
                          <span>MIN</span>
                        </div>
                      </div>
                    )}
                    <svg className="relative w-full h-full text-secondary" preserveAspectRatio="none" viewBox="0 0 1000 160">
                      <path d="M0,80 L80,80 L95,78 L105,82 L115,80 L140,80 L150,75 L160,85 L170,80 L190,80 L205,80 L212,65 L220,135 L232,15 L245,95 L252,80 L265,80 L285,68 L310,80 L390,80 L402,65 L410,135 L422,15 L435,95 L442,80 L455,80 L475,68 L500,80 L580,80 L592,65 L600,135 L612,15 L625,95 L632,80 L645,80 L665,68 L690,80 L770,80 L782,65 L790,135 L802,15 L815,95 L822,80 L835,80 L855,68 L880,80 L1000,80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                    {isRecording && (
                      <div className="absolute top-3 left-4 flex items-center gap-2 px-3 py-1 rounded bg-error-container text-on-error-container">
                        <span className="h-2 w-2 rounded-full bg-error animate-ping"></span>
                        <span className="uppercase font-bold" style={{ fontSize: 11 }}>Sampling 00:{recordCountdown < 10 ? `0${recordCountdown}` : recordCountdown}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Archive */}
                <div className="mt-4 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="uppercase text-on-surface-variant font-semibold" style={{ fontSize: 11 }}>Clinician Signed Telemetry Recordings</span>
                    <span className="text-primary hover:underline cursor-pointer" style={{ fontSize: 12 }}>Archive (24)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: "Strip #2024-0419A", badge: "Reviewed", badgeClass: "bg-secondary-container text-on-secondary-container", time: "Today, 06:15 AM • 30s Sinus" },
                      { id: "Strip #2024-0418E", badge: "Dr. Okafor MD", badgeClass: "bg-surface-container-highest text-secondary", time: "Yesterday, 11:42 PM • Post-aura check" },
                    ].map((strip) => (
                      <div key={strip.id} className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-on-surface font-semibold" style={{ fontSize: 13 }}>{strip.id}</span>
                            <span className={`px-1.5 py-0.5 rounded ${strip.badgeClass}`} style={{ fontSize: 11, fontWeight: 700 }}>{strip.badge}</span>
                          </div>
                          <span className="text-on-surface-variant" style={{ fontSize: 12 }}>{strip.time}</span>
                        </div>
                        <button className="p-1.5 rounded bg-surface-container-high text-primary hover:bg-surface-container-highest">
                          <span className="material-symbols-outlined text-base">download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step Cadence */}
              <div className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-surface-container-low p-6 shadow-sm">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-surface-container-high text-primary">
                        <span className="material-symbols-outlined text-2xl">directions_walk</span>
                      </div>
                      <div>
                        <span className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>Daily Locomotor &amp; Step Cadence</span>
                        <p className="text-on-surface-variant" style={{ fontSize: 12 }}>Pedometer telemetry coupled with seizure-risk motor velocity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-surface-container">
                      <span className="text-on-surface-variant pl-2" style={{ fontSize: 12 }}>Sedentary Nudge</span>
                      <button
                        className={`px-2.5 py-1 rounded font-bold ${sedentaryActive ? "bg-primary-container text-on-primary-container" : "bg-surface-container-highest text-on-surface-variant"}`}
                        onClick={() => setSedentaryActive(v => !v)}
                        style={{ fontSize: 11 }}
                      >
                        {sedentaryActive ? "ACTIVE (50m)" : "PAUSED"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-surface-container flex flex-col">
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Steps Walked</span>
                      <div className="flex items-baseline gap-1.5 my-1">
                        <span className="text-on-surface font-bold" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>8,420</span>
                        <span className="text-on-surface-variant" style={{ fontSize: 13 }}>/ 10,000</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden mb-1">
                        <div className="h-full bg-primary rounded-full" style={{ width: "84.2%" }}></div>
                      </div>
                      <span className="text-primary mt-1 font-semibold" style={{ fontSize: 11, fontWeight: 700 }}>84% of Clinical Prescription</span>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container flex flex-col">
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Active Aerobic Minutes</span>
                      <div className="flex items-baseline gap-1.5 my-1">
                        <span className="text-secondary font-bold" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>48</span>
                        <span className="text-on-surface-variant" style={{ fontSize: 13 }}>mins</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden mb-1">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "100%" }}></div>
                      </div>
                      <span className="text-secondary mt-1 font-semibold" style={{ fontSize: 11, fontWeight: 700 }}>+18 mins over baseline daily goal</span>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container flex flex-col">
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Resting Tremor Index</span>
                      <div className="flex items-baseline gap-1.5 my-1">
                        <span className="text-on-surface font-bold" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>0.03</span>
                        <span className="text-on-surface-variant" style={{ fontSize: 13 }}>m/s²</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden mb-1">
                        <div className="h-full bg-primary/80 rounded-full" style={{ width: "12%" }}></div>
                      </div>
                      <span className="text-secondary mt-1 font-semibold" style={{ fontSize: 11, fontWeight: 700 }}>Motor Stability Intact</span>
                    </div>
                  </div>

                  {/* 7-day bar chart */}
                  <div className="p-4 rounded-xl bg-surface-container">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>7-Day Step Distribution</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-on-surface-variant" style={{ fontSize: 11 }}>
                          <span className="w-2.5 h-2.5 rounded bg-primary"></span> Cadence
                        </span>
                        <span className="flex items-center gap-1.5 text-secondary" style={{ fontSize: 11 }}>
                          <span className="w-3 h-0.5 bg-secondary"></span> 10k Target
                        </span>
                      </div>
                    </div>
                    <div className="relative h-32 w-full flex items-end justify-between gap-2 pt-6 pb-2">
                      <div className="absolute top-8 left-0 right-0 border-b border-dashed border-secondary/40 pointer-events-none flex justify-end">
                        <span className="text-secondary px-1 -mt-4 bg-surface-container rounded" style={{ fontSize: 11 }}>Target 10,000</span>
                      </div>
                      {[
                        { val: "9.1k", h: 68, label: "M", bg: "bg-surface-container-high" },
                        { val: "10.4k", h: 78, label: "T", bg: "bg-primary" },
                        { val: "7.8k", h: 58, label: "W", bg: "bg-surface-container-high" },
                        { val: "11.2k", h: 84, label: "T", bg: "bg-primary" },
                        { val: "9.9k", h: 74, label: "F", bg: "bg-surface-container-high" },
                        { val: "12.1k", h: 91, label: "S", bg: "bg-secondary" },
                        { val: "8.4k", h: 63, label: "Sun", bg: "bg-secondary-container", labelClass: "text-secondary font-bold" },
                      ].map((day) => (
                        <div key={day.label + day.val} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className={`${day.labelClass || "text-on-surface-variant"}`} style={{ fontSize: 11 }}>{day.val}</span>
                          <div className={`w-full max-w-[28px] ${day.bg} rounded-t-md hover:bg-primary transition-all`} style={{ height: `${day.h}%` }}></div>
                          <span className={`${day.labelClass || "text-on-surface-variant"}`} style={{ fontSize: 12 }}>{day.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 text-on-surface-variant" style={{ fontSize: 12 }}>
                  <span>Hourly average cadence peak: 114 steps/min between 17:00 • 18:30</span>
                  <span className="text-primary hover:underline cursor-pointer">Export Actigraphy</span>
                </div>
              </div>

              {/* Blood Pressure */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-surface-container-low p-6 shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-surface-container-high text-primary">
                        <span className="material-symbols-outlined text-2xl">vital_signs</span>
                      </div>
                      <div>
                        <span className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>Blood Pressure (BPI) &amp; Add-ons</span>
                        <p className="text-on-surface-variant" style={{ fontSize: 12 }}>Paired Bluetooth Omron Hem-907 &amp; Dexcom CGM</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Most Recent Oscillometric BP</span>
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container" style={{ fontSize: 11, fontWeight: 700 }}>Normal Baseline</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-on-surface font-bold tracking-tight" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>118 / 76</span>
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>mmHg • Pulse 68</span>
                    </div>
                    <p className="text-on-surface-variant mt-1" style={{ fontSize: 12 }}>Logged today at 08:30 AM • Dr. Okafor alert trigger: ≥ 140/90</p>
                    <div className="mt-4 pt-3">
                      <div className="flex items-center justify-between text-on-surface-variant mb-1" style={{ fontSize: 11 }}>
                        <span>30-Day Systolic Fluctuation</span>
                        <span className="text-secondary">Mean: 120 mmHg</span>
                      </div>
                      <svg className="w-full h-12 text-primary" preserveAspectRatio="none" viewBox="0 0 300 50">
                        <line className="text-error/50" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="300" y1="12" y2="12" />
                        <path className="text-primary" d="M0,28 Q25,22 50,26 T100,24 T150,30 T200,20 T250,25 T300,22" fill="none" stroke="currentColor" strokeWidth="2" />
                        <circle className="fill-primary" cx="200" cy="20" r="3" />
                        <circle className="fill-secondary" cx="300" cy="22" r="3" />
                      </svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-surface-container">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>CGM Stream</span>
                        <span className="material-symbols-outlined text-secondary text-base">glucose</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-on-surface" style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600 }}>5.6</span>
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>mmol/L</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>
                        <span className="material-symbols-outlined text-xs">trending_flat</span>
                        <span>Fasting • 98% in Range</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Smart Scale</span>
                        <span className="material-symbols-outlined text-primary text-base">scale</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-on-surface" style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600 }}>64.2</span>
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>kg</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-on-surface-variant" style={{ fontSize: 11 }}>
                        <span>BMI 21.8 • Stable ±0.2</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 mt-2">
                  <span className="text-on-surface-variant" style={{ fontSize: 12 }}>3 Peripherals Synced</span>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary transition-colors" style={{ fontSize: 16, fontWeight: 600 }}>
                    <span className="material-symbols-outlined text-base">add_link</span>
                    Pair Sensor
                  </button>
                </div>
              </div>
            </div>

            {/* Telemetry Audit Log */}
            <div className="mt-8 rounded-xl bg-surface-container-low p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>Micro-Epoch Telemetry Audit Log</h2>
                  <p className="text-on-surface-variant" style={{ fontSize: 12 }}>Direct continuous capture stream from band hardware buffer (48h local FIFO)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-on-surface-variant" style={{ fontSize: 13 }}>Showing latest 4 event bursts</span>
                  <button className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-highest text-primary transition-colors" style={{ fontSize: 16, fontWeight: 600 }}>
                    Download Raw .EDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-on-surface" style={{ fontSize: 12 }}>
                  <thead>
                    <tr className="text-on-surface-variant bg-surface-container">
                      {["Timestamp", "HR / Pulse", "Rhythm State", "Skin Conductance", "Motion Accel", "Sync Integrity"].map(h => (
                        <th key={h} className="py-2.5 px-4 uppercase" style={{ fontSize: 11, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ts: "14:24:02 UTC", hr: "71 BPM", hrClass: "text-secondary font-semibold", rhythm: "Normal Sinus", rhythmClass: "bg-secondary-container text-on-secondary-container", sc: "2.4 μS (Nominal)", ma: "0.02g (Stationary)", sync: "100% Pkt Verified", syncClass: "text-secondary font-bold", rowClass: "" },
                      { ts: "14:22:15 UTC", hr: "73 BPM", hrClass: "font-semibold", rhythm: "Normal Sinus", rhythmClass: "bg-secondary-container text-on-secondary-container", sc: "2.6 μS (Nominal)", ma: "0.14g (Gentle walk)", sync: "100% Pkt Verified", syncClass: "text-secondary font-bold", rowClass: "bg-surface-container/30" },
                      { ts: "14:15:00 UTC", hr: "88 BPM", hrClass: "font-semibold", rhythm: "Mild Elevation", rhythmClass: "bg-surface-container-highest text-secondary", sc: "3.1 μS (Warmup)", ma: "0.68g (Active Stride)", sync: "100% Pkt Verified", syncClass: "text-secondary font-bold", rowClass: "" },
                      { ts: "14:00:12 UTC", hr: "69 BPM", hrClass: "font-semibold", rhythm: "Normal Sinus", rhythmClass: "bg-secondary-container text-on-secondary-container", sc: "2.1 μS (Basal)", ma: "0.01g (Resting)", sync: "Buffered Local Cache", syncClass: "text-secondary font-bold", rowClass: "bg-surface-container/30" },
                    ].map((row) => (
                      <tr key={row.ts} className={`hover:bg-surface-container/60 transition-colors ${row.rowClass}`}>
                        <td className="py-3 px-4 font-semibold" style={{ fontSize: 13 }}>{row.ts}</td>
                        <td className={`py-3 px-4 ${row.hrClass}`}>{row.hr}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full ${row.rhythmClass}`} style={{ fontSize: 11, fontWeight: 700 }}>{row.rhythm}</span>
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">{row.sc}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{row.ma}</td>
                        <td className={`py-3 px-4 text-right ${row.syncClass}`} style={{ fontSize: 11 }}>{row.sync}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
