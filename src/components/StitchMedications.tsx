import { useEffect, useRef, useState } from "react";

export default function StitchMedications({ back }: { back: () => void }) {
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastSuccess, setToastSuccess] = useState(true);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [eveningLogged, setEveningLogged] = useState(false);
  const [eveningFeedback, setEveningFeedback] = useState("Awaiting patient intake");
  const [refillSent, setRefillSent] = useState(false);

  const showToast = (message: string, isSuccess = true) => {
    setToastMsg(message);
    setToastSuccess(isSuccess);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3800);
  };

  const verifyEveningDose = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setEveningLogged(true);
    setEveningFeedback(`Logged at ${timeString} • Auto-transmitted to Dr. Okafor`);
    showToast(`Evening Lamotrigine logged at ${timeString}. Care circle notified.`);
  };

  const triggerRefillRequest = () => {
    setRefillSent(true);
    showToast("30-Day Levetiracetam refill electronic prescription sent!");
  };

  const notifyConsentChange = (category: string) => {
    showToast(`Privacy Matrix updated for ${category}. Keys updated.`);
  };

  const confirmRevocation = () => {
    setShowRevokeModal(false);
    showToast("Access keys revoked. Peripheral caches purged.", false);
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
          <div className="flex flex-col w-full">
            <div className="relative w-full pb-12">
              <div className="absolute -top-12 -left-12 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute top-1/3 -right-20 w-80 h-80 bg-tertiary-container/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Page header */}
              <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 relative z-10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="uppercase tracking-wider text-secondary px-2.5 py-1 rounded-full bg-secondary-container/20" style={{ fontSize: 11, fontWeight: 700 }}>Telemetry Protocol 09-B</span>
                    <span className="flex items-center gap-1.5 text-on-surface-variant" style={{ fontSize: 13 }}>
                      <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
                      E2EE Client-Side Key Active
                    </span>
                  </div>
                  <h1 className="text-on-surface tracking-tight" style={{ fontSize: 36, lineHeight: "44px", fontWeight: 600 }}>Medication, Circle &amp; Consent</h1>
                  <p className="text-on-surface-variant max-w-2xl" style={{ fontSize: 14 }}>
                    Prescription administration ledger, fine-grained caregiver telemetry grants, and real-time cryptographic audit trails for Sarah Mwangi (#EP-8492).
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-xl shadow-md">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface">
                    <span className="material-symbols-outlined text-primary text-base">lock_clock</span>
                    <span style={{ fontSize: 13 }}>Prescription Lock: Active</span>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors" onClick={() => showToast("Exporting signed SQLite cryptographic audit proof (SHA-256)...")} style={{ fontSize: 16, fontWeight: 600 }} type="button">
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>Compliance Proof</span>
                  </button>
                </div>
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
                <div className="xl:col-span-8 flex flex-col gap-8">

                  {/* Daily Regimen */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-primary text-xl">medication_liquid</span>
                        <h2 className="text-on-surface" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600 }}>Daily Regimen &amp; Dosing Telemetry</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-secondary bg-surface-container-high px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 700 }}>KMPDC Synchronized</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Morning dose */}
                      <div className="relative bg-surface-container-low rounded-xl p-5 shadow-md flex flex-col justify-between overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined text-xl">wb_sunny</span>
                            </div>
                            <div>
                              <span className="uppercase tracking-wider text-on-surface-variant block" style={{ fontSize: 11 }}>Morning Dose • 08:00 AM</span>
                              <h3 className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Levetiracetam (Keppra)</h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-surface-container-high/80 px-2 py-1 rounded text-on-surface-variant" title="Prescribed by Dr. Amara Okafor. Cannot be edited by patient.">
                            <span className="material-symbols-outlined text-xs text-primary">lock</span>
                            <span style={{ fontSize: 11 }}>CLINICIAN LOCK</span>
                          </div>
                        </div>
                        <div className="space-y-3 mb-6 bg-surface-container/60 p-3.5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Prescribed Strength</span>
                            <span className="text-on-surface" style={{ fontSize: 13 }}>500 mg (1 Film-coated tab)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Instructions</span>
                            <span className="text-secondary" style={{ fontSize: 12 }}>With 200ml water after meal</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Prescriber</span>
                            <span className="text-on-surface" style={{ fontSize: 13 }}>Dr. Amara Okafor (KMPDC #A49182)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-secondary"></span>
                            <span className="text-secondary" style={{ fontSize: 13 }}>Logged today at 08:04:12 AM</span>
                          </div>
                          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant cursor-not-allowed" disabled style={{ fontSize: 16, fontWeight: 600 }} type="button">
                            <span className="material-symbols-outlined text-base text-secondary">check_circle</span>
                            <span>Verified</span>
                          </button>
                        </div>
                      </div>

                      {/* Evening dose */}
                      <div className="relative bg-surface-container-low rounded-xl p-5 shadow-md flex flex-col justify-between overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
                              <span className="material-symbols-outlined text-xl">bedtime</span>
                            </div>
                            <div>
                              <span className="uppercase tracking-wider text-on-surface-variant block" style={{ fontSize: 11 }}>Evening Dose • 08:00 PM</span>
                              <h3 className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Lamotrigine (Lamictal)</h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-surface-container-high/80 px-2 py-1 rounded text-on-surface-variant">
                            <span className="material-symbols-outlined text-xs text-primary">lock</span>
                            <span style={{ fontSize: 11 }}>CLINICIAN LOCK</span>
                          </div>
                        </div>
                        <div className="space-y-3 mb-6 bg-surface-container/60 p-3.5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Prescribed Strength</span>
                            <span className="text-on-surface" style={{ fontSize: 13 }}>100 mg (Dispersible tab)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Instructions</span>
                            <span className="text-secondary" style={{ fontSize: 12 }}>Take 30m prior to rest cycle</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Prescriber</span>
                            <span className="text-on-surface" style={{ fontSize: 13 }}>Dr. Amara Okafor (KMPDC #A49182)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col">
                            {!eveningLogged && <span className="text-error uppercase tracking-wider" style={{ fontSize: 11, fontWeight: 700 }}>Scheduled in 4h 12m</span>}
                            <span className={eveningLogged ? "text-secondary" : "text-on-surface-variant"} style={{ fontSize: 12 }}>{eveningFeedback}</span>
                          </div>
                          {eveningLogged ? (
                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant cursor-not-allowed" disabled style={{ fontSize: 16, fontWeight: 600 }} type="button">
                              <span className="material-symbols-outlined text-base text-secondary">check_circle</span>
                              <span>Logged</span>
                            </button>
                          ) : (
                            <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-all shadow-md active:scale-95" onClick={verifyEveningDose} style={{ fontSize: 16, fontWeight: 600 }} type="button">
                              <span className="material-symbols-outlined text-base">done_all</span>
                              <span>Mark Taken</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Refill & Adherence */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 bg-surface-container-low rounded-xl p-5 shadow-md flex flex-col justify-between">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="uppercase tracking-wider text-on-surface-variant" style={{ fontSize: 11 }}>Dispenser Ledger</span>
                          <h3 className="text-on-surface mt-0.5" style={{ fontSize: 16, fontWeight: 600 }}>Refill Telemetry</h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-error-container/40 text-error" style={{ fontSize: 11, fontWeight: 700 }}>Low Reserve</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-on-surface" style={{ fontSize: 56, lineHeight: "64px", fontWeight: 700 }}>8</span>
                        <span className="text-on-surface-variant" style={{ fontSize: 16, fontWeight: 600 }}>days remaining</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mb-4">
                        <div className="bg-error h-full rounded-full transition-all duration-700" style={{ width: "26%" }}></div>
                      </div>
                      <p className="text-on-surface-variant mb-4" style={{ fontSize: 12 }}>
                        Levetiracetam reserve threshold triggered (&lt;10 days). Connected to Gertrude&apos;s Children&apos;s Hospital Outpatient Pharmacy.
                      </p>
                      <button
                        className="w-full py-2.5 px-4 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary transition-colors flex items-center justify-center gap-2"
                        disabled={refillSent}
                        onClick={triggerRefillRequest}
                        style={{ fontSize: 16, fontWeight: 600 }}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">local_shipping</span>
                        <span>{refillSent ? "Dispatched to Gertrude's Pharmacy (#RX-9821)" : "Request 30-Day Refill"}</span>
                      </button>
                    </div>

                    <div className="md:col-span-7 bg-surface-container-low rounded-xl p-5 shadow-md flex flex-col justify-between">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="uppercase tracking-wider text-on-surface-variant" style={{ fontSize: 11 }}>Biometric Validation</span>
                          <h3 className="text-on-surface mt-0.5" style={{ fontSize: 16, fontWeight: 600 }}>30-Day Dosing Adherence</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-secondary block leading-none" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>96.4%</span>
                          <span className="text-on-surface-variant uppercase" style={{ fontSize: 11 }}>Optimal Concordance</span>
                        </div>
                      </div>
                      <p className="text-on-surface-variant mb-3" style={{ fontSize: 12 }}>
                        Correlated with Mojo Strap capacitive skin impedance telemetry at administration timestamps.
                      </p>
                      <div className="w-full bg-surface-container-high/40 p-3 rounded-lg flex flex-col gap-2">
                        <div className="flex justify-between items-center text-on-surface-variant uppercase" style={{ fontSize: 11 }}>
                          <span>Oct 24</span>
                          <span>Nov 07</span>
                          <span>Nov 23 (Current)</span>
                        </div>
                        <svg className="w-full h-14 overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 60">
                          <defs>
                            <linearGradient id="adherenceGrad" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#74d8c5" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#74d8c5" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 0,55 L 0,15 L 20,12 L 40,16 L 60,10 L 80,12 L 100,10 L 120,38 L 140,12 L 160,10 L 180,12 L 200,10 L 220,10 L 240,14 L 260,12 L 280,10 L 300,12 L 320,10 L 340,10 L 360,12 L 380,10 L 400,10 L 400,55 Z" fill="url(#adherenceGrad)" />
                          <path d="M 0,15 L 20,12 L 40,16 L 60,10 L 80,12 L 100,10 L 120,38 L 140,12 L 160,10 L 180,12 L 200,10 L 220,10 L 240,14 L 260,12 L 280,10 L 300,12 L 320,10 L 340,10 L 360,12 L 380,10 L 400,10" fill="none" stroke="#74d8c5" strokeLinecap="round" strokeWidth="2.5" />
                          <circle cx="120" cy="38" fill="#ffb4ab" r="4" stroke="#0b1f1e" strokeWidth="1.5" />
                          <circle cx="400" cy="10" fill="#88d4cd" r="4" stroke="#0b1f1e" strokeWidth="1.5" />
                        </svg>
                        <div className="flex items-center justify-between text-on-surface-variant pt-1" style={{ fontSize: 12 }}>
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary"></span> 29/30 Perfect Regimen</span>
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-error"></span> 1 Delayed (+2.4h on Nov 02)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Consent Matrix */}
                  <div className="bg-surface-container-low rounded-xl p-6 shadow-md flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-xl">admin_panel_settings</span>
                          <h2 className="text-on-surface" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600 }}>Fine-Grained Consent &amp; Privacy Matrix</h2>
                        </div>
                        <p className="text-on-surface-variant mt-1" style={{ fontSize: 12 }}>
                          Zero-knowledge telemetry gating. Revoking instantly invalidates session decryption keys on remote listener pods.
                        </p>
                      </div>
                      <button
                        className="px-3.5 py-2 rounded-lg bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors flex items-center gap-2 self-start md:self-auto"
                        onClick={() => setShowRevokeModal(true)}
                        style={{ fontSize: 16, fontWeight: 600 }}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">delete_forever</span>
                        <span>Revoke All &amp; Purge Cache</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { icon: "ecg_heart", title: "Continuous Biometrics & Vitals", badge: "Mojo Strap Stream", desc: "Heart rate, EDA (galvanic skin conductance), and sleep staging packets.", label: "Shared with Care Circle", defaultChecked: true },
                        { icon: "monitor_heart", title: "Raw ECG Strip & Seizure Detection Vectors", badge: "High-Frequency", desc: "High-frequency 250Hz vector traces used for clinical spike and wave evaluation.", label: "Clinician Only", defaultChecked: true },
                        { icon: "pill", title: "Medication Regimen Adherence Logs", badge: "Daily Feed", desc: "Dosage confirmations and delay timestamps sent to care circle coordinators.", label: "Care Circle & Pharmacy", defaultChecked: true },
                        { icon: "fmd_good", title: "Emergency High-Precision GPS Coordinates", badge: "Conditional Trigger", desc: "Location remains completely obscured until manual SOS or confirmed tonic-clonic fall.", label: "SOS Dispatch Only", defaultChecked: true, iconColor: "text-error" },
                        { icon: "psychology", title: "Subjective Aura & Mood Diary", badge: "Self-Reported", desc: "Sensory disturbance logs, stress indexes, and post-ictal recovery diary entries.", label: "Private (Patient Only)", defaultChecked: false, iconColor: "text-tertiary" },
                      ].map((item) => (
                        <div key={item.title} className="p-4 rounded-lg bg-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className={`w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 ${item.iconColor || "text-primary"}`}>
                              <span className="material-symbols-outlined text-lg">{item.icon}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>{item.title}</span>
                                <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>{item.badge}</span>
                              </div>
                              <p className="text-on-surface-variant mt-0.5" style={{ fontSize: 12 }}>{item.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <span className="text-on-surface-variant" style={{ fontSize: 12 }}>{item.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                className="sr-only peer"
                                defaultChecked={item.defaultChecked}
                                onChange={() => notifyConsentChange(item.title)}
                                type="checkbox"
                              />
                              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3.5 rounded-lg bg-surface-container-high/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-secondary text-base">enhanced_encryption</span>
                        <span className="text-on-surface" style={{ fontSize: 12 }}>Data Retention Rule: Ephemeral 90-day rolling scrub configured.</span>
                      </div>
                      <button className="text-secondary hover:underline" style={{ fontSize: 16, fontWeight: 600 }} type="button">Edit Policy</button>
                    </div>
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="xl:col-span-4 flex flex-col gap-8">
                  {/* Care Circle */}
                  <div className="bg-surface-container-low rounded-xl p-6 shadow-md flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">groups</span>
                        <h2 className="text-on-surface" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600 }}>Care Circle</h2>
                      </div>
                      <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 700 }}>3 Authorized</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {[
                        { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuClnD8VVLGV5OWoVQQJbPPpioFTrrQE8PJVSwbI0gIogBZHR9M-FxDp-fTmX9uJbBMvHkkPuYEP-XJkHjho7c-iZtHFBgea6ENUXg9xX65_xV8s_3owfo5w7ngBLACeYQtjqa-xCPkPpCs6YS-lo8FJYjTnT0fLLLxyD96HYTvG0U3h8zdVLGeFiDW9PS8LKhAxxW_aa6u_KLGEnu1I8-j9Rh1NFtcChXoT6w7pnOwsPBelTTrOeMxN4w", name: "Dr. Amara Okafor", role: "Attending Neurologist", badge: "Attending MD", badgeClass: "bg-secondary-container/30 text-secondary", extra: "KMPDC Licence #A49182 • VERIFIED", org: "Aga Khan University Hosp.", action: "Message" },
                        { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3-Wx067rZCgzUh_MwaNbir2n6xBaXkgYheljECDJRUk3GMBJ9YMhOisV2P47rWM3k2HhFeWMO3FG5Wo-kpfkBVe-SPTDC8EB3q0ONcm2R2widQ80Z2LJprQsv_Y08fo5npJrE18xGuCp9EZkKGvIPm2x3cEJl7940bVHw-Amn3YlSO4cuoMgCFDAtUZ47ztbqE5jaJGds_V_eLG6gS9lTyCaNS8jkGmb8SUIRi4Qo1hXn-mhXWCQEaA", name: "Grace Mwangi", role: "Primary Caregiver / Sister", badge: "Tier 1 SOS", badgeClass: "bg-error-container/30 text-error", extra: "+254 712 ••• •89 • SMS Fallback ON", org: "Within 3.2 km distance", action: "Fast Dial" },
                        { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGBba7NV3fbuPAAGyCymCM6srfGQDbnRoxYXJ7oexla759ePz6lLYGX_jtMaaRUN4EwzPBOnZ9mf4BfghythYjxGcnz_7HIMj_jx5KjP14a7CZsYex_n9Nmw_FxX2kMldJljrZ1gwiRVsCOU2ULIz7RyN5mvJwUw-NGO4f-2AAnQTnqfLJ1sj2oAuPy6jz4yhUV5Ay5f7s41HHmxrkexdER4AeMPju3ZlXE5bnUtAYrnTlUk1XAK_wfw", name: "David Kimani", role: "Dispatched Paramedic Liaison", badge: "EMS Standby", badgeClass: "bg-surface-container-highest text-on-surface-variant", extra: "Nairobi St. John Amb. • Auto-Dispatch Ready", org: "", action: "" },
                      ].map((person) => (
                        <div key={person.name} className="bg-surface-container p-4 rounded-xl flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <img className="w-12 h-12 rounded-full object-cover" alt={person.name} src={person.img} />
                              <div>
                                <h4 className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>{person.name}</h4>
                                <span className="text-on-surface-variant" style={{ fontSize: 12 }}>{person.role}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full ${person.badgeClass}`} style={{ fontSize: 11, fontWeight: 700 }}>{person.badge}</span>
                          </div>
                          <div className="flex items-center justify-between text-on-surface-variant bg-surface-container-high/60 p-2 rounded-lg">
                            <span style={{ fontSize: 12 }}>{person.extra}</span>
                          </div>
                          {person.action && (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-on-surface-variant" style={{ fontSize: 12 }}>{person.org}</span>
                              <button className="text-primary flex items-center gap-1" style={{ fontSize: 16, fontWeight: 600 }} type="button">
                                <span className="material-symbols-outlined text-sm">{person.action === "Message" ? "chat" : "call"}</span> {person.action}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors flex items-center justify-center gap-2" style={{ fontSize: 16, fontWeight: 600 }} type="button">
                      <span className="material-symbols-outlined text-base">person_add</span>
                      <span>Invite Certified Caregiver</span>
                    </button>
                  </div>

                  {/* Audit Log */}
                  <div className="bg-surface-container-low rounded-xl p-6 shadow-md flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">history_edu</span>
                        <h2 className="text-on-surface" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600 }}>Immutable Access Audit Log</h2>
                      </div>
                      <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" title="Live stream"></span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-base">storage</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-secondary font-bold uppercase" style={{ fontSize: 11 }}>Encrypted Local SQLite</span>
                          <span className="bg-surface-container-highest px-1 rounded text-on-surface-variant" style={{ fontSize: 11 }}>AES-256</span>
                        </div>
                        <span className="text-on-surface-variant truncate" style={{ fontSize: 12 }}>Hash: 8f4a...90e3 • Zero cloud leakage</span>
                      </div>
                    </div>
                    <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
                      {[
                        { name: "Dr. Amara Okafor", time: "14 mins ago", desc: "Reviewed 48h nocturnal EEG trend & approved Keppra schedule.", badge: "Authorized by Doctor Scope Token", dot: "bg-primary" },
                        { name: "Grace Mwangi", time: "Today, 08:05 AM", desc: "Received push verification: Morning Dose Taken (500mg Keppra).", badge: "", dot: "bg-secondary-container" },
                        { name: "Emergency System Pulse", time: "Yesterday, 11:30 PM", desc: "Automated geo-fence ping check (Result: Latency 14ms, SMS ready).", badge: "", dot: "bg-surface-container-highest" },
                        { name: "Gertrude's Hosp. Pharmacy", time: "2 days ago", desc: "Inventory sync query: 8 pills remaining telemetry acknowledged.", badge: "", dot: "bg-surface-container-highest" },
                      ].map((entry) => (
                        <div key={entry.name} className="relative pl-3">
                          <span className={`absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full ${entry.dot} ring-4 ring-surface-container-low`}></span>
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface font-semibold" style={{ fontSize: 13 }}>{entry.name}</span>
                            <span className="text-on-surface-variant" style={{ fontSize: 12 }}>{entry.time}</span>
                          </div>
                          <p className="text-on-surface-variant mt-0.5" style={{ fontSize: 12 }}>{entry.desc}</p>
                          {entry.badge && <span className="text-secondary mt-1 inline-block" style={{ fontSize: 11, fontWeight: 700 }}>{entry.badge}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <button className="w-full text-center text-primary hover:text-primary/80 transition-colors" onClick={() => showToast("Loading extended 30-day chronological log entries...")} style={{ fontSize: 16, fontWeight: 600 }} type="button">
                        Inspect Full 30-Day Forensic Log →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50 bg-surface-container-highest text-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300">
          <span className={`material-symbols-outlined ${toastSuccess ? "text-secondary" : "text-primary"}`}>{toastSuccess ? "check_circle" : "info"}</span>
          <span style={{ fontSize: 14 }}>{toastMsg}</span>
        </div>
      )}

      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 bg-surface-dim/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-low rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center gap-3 text-error">
              <div className="w-10 h-10 rounded-full bg-error-container/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-on-surface" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600 }}>Emergency Access Wipe</h3>
                <span className="text-error uppercase" style={{ fontSize: 11, fontWeight: 700 }}>Irreversible Action</span>
              </div>
            </div>
            <p className="text-on-surface-variant" style={{ fontSize: 14 }}>
              This will instantly sever cryptographic sync tokens for Dr. Amara Okafor and caregiver Grace Mwangi. All cached biometric segments on peripheral mobile listener devices will be zero-filled per GDPR/HIPAA standards.
            </p>
            <div className="p-3 bg-surface-container rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">database</span>
              <span className="text-on-surface" style={{ fontSize: 12 }}>Target SQLite cache: 14.8 MB local state encrypted with hardware key.</span>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors" onClick={() => setShowRevokeModal(false)} style={{ fontSize: 16, fontWeight: 600 }} type="button">
                Cancel
              </button>
              <button className="px-4 py-2 rounded-lg bg-error-container hover:bg-error-container/80 text-on-error-container transition-all shadow-md" onClick={confirmRevocation} style={{ fontSize: 16, fontWeight: 600 }} type="button">
                Execute Wipe &amp; Sever Tokens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
