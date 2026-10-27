import { useEffect, useRef } from "react";

export default function StitchDashboard({ back }: { back: () => void }) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const snoozeBtnRef = useRef<HTMLButtonElement>(null);
  const doseCardRef = useRef<HTMLDivElement>(null);
  const actionContainerRef = useRef<HTMLDivElement>(null);
  const ecgBtnRef = useRef<HTMLButtonElement>(null);
  const shareBtnRef = useRef<HTMLButtonElement>(null);
  const bpmRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const confirmBtn = confirmBtnRef.current;
    const snoozeBtn = snoozeBtnRef.current;
    const doseCard = doseCardRef.current;
    const actionContainer = actionContainerRef.current;

    if (confirmBtn && actionContainer && doseCard) {
      const handler = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        actionContainer.innerHTML = `
          <div class="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/10 text-secondary transition-all">
            <div class="flex items-center gap-2 font-title-md text-title-md">
              <span class="material-symbols-outlined text-base">verified</span>
              <span>Dose Confirmed & Locked (${timeStr})</span>
            </div>
            <span class="font-label-badge text-label-badge bg-secondary-container/30 px-2 py-0.5 rounded text-on-surface">No Duplicate Risk</span>
          </div>
        `;
        doseCard.classList.remove("bg-surface-container");
        doseCard.classList.add("bg-surface-container/60");
      };
      confirmBtn.addEventListener("click", handler);
      return () => confirmBtn.removeEventListener("click", handler);
    }
  }, []);

  useEffect(() => {
    const snoozeBtn = snoozeBtnRef.current;
    if (snoozeBtn) {
      const handler = () => {
        snoozeBtn.innerHTML = `<span class="material-symbols-outlined text-sm">snooze</span> Snoozed (+10m)`;
        snoozeBtn.disabled = true;
        snoozeBtn.classList.add("opacity-70");
      };
      snoozeBtn.addEventListener("click", handler);
      return () => snoozeBtn.removeEventListener("click", handler);
    }
  }, []);

  useEffect(() => {
    const ecgBtn = ecgBtnRef.current;
    if (ecgBtn) {
      const handler = () => {
        const originalHTML = ecgBtn.innerHTML;
        ecgBtn.disabled = true;
        let count = 30;
        ecgBtn.innerHTML = `
          <span class="material-symbols-outlined text-base animate-spin" style="color: #FFC23C;">progress_activity</span>
          <span class="font-body-md text-body-md font-semibold text-secondary">Calibrating Strip... (${count}s)</span>
        `;
        const timer = setInterval(() => {
          count -= 5;
          if (count > 0) {
            ecgBtn.innerHTML = `
              <span class="material-symbols-outlined text-base animate-pulse" style="color: #FFC23C;">ecg_heart</span>
              <span class="font-body-md text-body-md font-semibold text-secondary">Sampling Lead I (${count}s remaining)</span>
            `;
          } else {
            clearInterval(timer);
            ecgBtn.innerHTML = `
              <span class="material-symbols-outlined text-base text-secondary">check_circle</span>
              <span class="font-body-md text-body-md font-semibold text-on-surface">30s Strip Saved to Clinical Audit</span>
            `;
            setTimeout(() => {
              ecgBtn.disabled = false;
              ecgBtn.innerHTML = originalHTML;
            }, 3500);
          }
        }, 1000);
      };
      ecgBtn.addEventListener("click", handler);
      return () => ecgBtn.removeEventListener("click", handler);
    }
  }, []);

  useEffect(() => {
    const shareBtn = shareBtnRef.current;
    if (shareBtn) {
      const handler = () => {
        const prev = shareBtn.innerHTML;
        shareBtn.innerHTML = `<span class="material-symbols-outlined text-base text-secondary">check</span><span>Link Copied</span>`;
        setTimeout(() => { shareBtn.innerHTML = prev; }, 2000);
      };
      shareBtn.addEventListener("click", handler);
      return () => shareBtn.removeEventListener("click", handler);
    }
  }, []);

  useEffect(() => {
    const bpmElem = bpmRef.current;
    if (!bpmElem) return;
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 3) - 1;
      const current = parseInt(bpmElem.textContent || "74", 10);
      const next = Math.min(78, Math.max(72, current + delta));
      bpmElem.textContent = String(next);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
              <span className="font-title-md text-on-surface tracking-tight leading-none" style={{ fontSize: 16, fontWeight: 600 }}>Mojo</span>
              <span className="text-secondary tracking-normal leading-none mt-1" style={{ fontSize: 12 }}>Clinical Telemetry</span>
            </div>
          </div>
          <div className="hidden xl:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Offline-ready • Last synced 2m ago</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high/80">
              <span className="material-symbols-outlined text-secondary text-base">watch</span>
              <span className="text-on-surface" style={{ fontSize: 13 }}>Mojo Strap</span>
              <span className="text-secondary bg-surface-container-highest px-1.5 py-0.5 rounded-full" style={{ fontSize: 11 }}>Connected 92%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary transition-colors" type="button">
              <span className="material-symbols-outlined text-lg">call</span>
              <span className="hidden md:inline text-on-surface" style={{ fontSize: 12 }}>Care Quick-Dial</span>
            </button>
            <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-error-container hover:bg-error-container/80 text-on-error-container transition-all shadow-[0_0_12px_rgba(226,75,74,0.35)]" style={{ fontSize: 16, fontWeight: 600 }} type="button">
              <span className="material-symbols-outlined text-lg animate-pulse">e911_emergency</span>
              <span className="tracking-wide">SOS</span>
              <span className="hidden sm:inline bg-surface-container-lowest/60 text-error px-1.5 py-0.5 rounded" style={{ fontSize: 11 }}>HOLD 3s</span>
            </button>
            <div className="h-6 w-px bg-surface-container-highest hidden sm:block"></div>
            <div className="flex items-center gap-3 pl-1">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-on-surface leading-tight" style={{ fontSize: 16, fontWeight: 600 }}>Sarah Mwangi</span>
                <span className="text-on-surface-variant leading-none" style={{ fontSize: 12 }}>#EP-8492</span>
              </div>
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZHvEQfRMKKsUyG0oJD6jSDD97bXPljyxE693me0YakuCXLI3wffJGb7mCwmYTVtSoXSKG--wdYPF7NwrFg0CjpqLDOM6L3Xhu0kduX2SwPo9wvq104nEDqjbIMuzzRZd7bwp2wQY7XP3TnwWhINdJwppbbsXm3DbmeZE2oHCvMKugq7nLy99M-6dKEsE-FV1XcZMh0Lj5Q4DDDzvZbA3U5AVBGZmWUDcnlKYhh2p95SOa5ccFmWbyVg" />
            </div>
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-low hidden md:flex flex-col justify-between py-6 z-40 shadow-[1px_0_12px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-6 px-4">
          <div className="px-3 flex items-center justify-between">
            <span className="text-on-surface-variant uppercase tracking-wider" style={{ fontSize: 11 }}>Patient Navigation</span>
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
          </div>
          <nav className="flex flex-col gap-1.5">
            <a aria-current="page" className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors bg-primary-container text-on-primary-container" style={{ fontSize: 16, fontWeight: 600 }} href="#">
              <span className="material-symbols-outlined text-lg">grid_view</span>Dashboard
            </a>
            <a className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" style={{ fontSize: 14 }} href="#">
              <span className="material-symbols-outlined text-lg">ecg_heart</span>Vitals &amp; Wearable
            </a>
            <a className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" style={{ fontSize: 14 }} href="#">
              <span className="material-symbols-outlined text-lg">fmd_good</span>GPS &amp; Emergency
            </a>
            <a className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" style={{ fontSize: 14 }} href="#">
              <span className="material-symbols-outlined text-lg">medication</span>Medication
            </a>
            <a className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" style={{ fontSize: 14 }} href="#">
              <span className="material-symbols-outlined text-lg">shield_person</span>Care &amp; Consent
            </a>
          </nav>
        </div>
        <div className="px-4 flex flex-col gap-3">
          <div className="p-3 rounded-lg bg-surface-container-high/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-on-surface-variant uppercase" style={{ fontSize: 11 }}>Hardware Link</span>
              <span className="text-secondary font-bold" style={{ fontSize: 11 }}>BLE 5.3</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">sensors</span>
              <span className="text-on-surface truncate" style={{ fontSize: 12 }}>Skin Impedance Normal</span>
            </div>
          </div>
          <div className="px-2 flex items-center justify-between text-on-surface-variant">
            <span style={{ fontSize: 12 }}>Coordinator Link</span>
            <span className="h-2 w-2 rounded-full bg-secondary"></span>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-low/95 backdrop-blur-xl z-50 flex items-center justify-around px-2 shadow-[0_-2px_12px_rgba(0,0,0,0.35)]">
        <a aria-current="page" className="flex flex-col items-center justify-center py-1 transition-colors text-primary" style={{ fontWeight: 600 }} href="#">
          <span className="material-symbols-outlined text-xl">grid_view</span>
          <span style={{ fontSize: 11 }} className="mt-0.5">Overview</span>
        </a>
        <a className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          <span className="material-symbols-outlined text-xl">ecg_heart</span>
          <span style={{ fontSize: 11 }} className="mt-0.5">Vitals</span>
        </a>
        <a className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          <span className="material-symbols-outlined text-xl">fmd_good</span>
          <span style={{ fontSize: 11 }} className="mt-0.5">GPS SOS</span>
        </a>
        <a className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          <span className="material-symbols-outlined text-xl">medication</span>
          <span style={{ fontSize: 11 }} className="mt-0.5">Meds</span>
        </a>
        <a className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          <span className="material-symbols-outlined text-xl">shield_person</span>
          <span style={{ fontSize: 11 }} className="mt-0.5">Consent</span>
        </a>
      </nav>

      <div className="md:pl-64">
        <main className="relative w-full pt-16 pb-20 md:pb-8 bg-surface px-4 lg:px-8 min-h-screen">
          <div className="flex flex-col w-full gap-6">

            {/* TOP HERO */}
            <div className="relative w-full rounded-2xl bg-surface-container-low p-6 lg:p-8 overflow-hidden shadow-xl">
              <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-secondary-container/15 blur-3xl pointer-events-none"></div>
              <div className="absolute left-1/3 -bottom-32 w-80 h-80 rounded-full bg-tertiary-container/10 blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                <div className="flex flex-col gap-3 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary uppercase" style={{ fontSize: 11, letterSpacing: "0.05em", fontWeight: 700 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                      Live Continuous Telemetry
                    </span>
                    <span className="text-on-surface-variant" style={{ fontSize: 12 }}>UTC+3 (Nairobi)</span>
                  </div>
                  <div>
                    <h1 className="text-on-surface tracking-tight" style={{ fontSize: 36, lineHeight: "44px", fontWeight: 600 }}>Good evening, Sarah</h1>
                    <p className="text-on-surface-variant mt-1" style={{ fontSize: 14 }}>Biometric baseline is steady. No nocturnal seizures or erratic spikes logged in the past 48 hours.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-on-surface-variant uppercase tracking-wider mr-1" style={{ fontSize: 11 }}>Active Protocols:</span>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>Hypertension</span>
                    <span className="px-2.5 py-1 rounded-full bg-tertiary-container/30 text-tertiary" style={{ fontSize: 11, fontWeight: 700 }}>Epilepsy Telemetry</span>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-primary" style={{ fontSize: 11, fontWeight: 700 }}>Post-Op Watch (Day 14)</span>
                  </div>
                </div>
                <div className="w-full xl:w-auto min-w-[340px] lg:min-w-[420px] bg-surface-container rounded-xl p-4 shadow-md flex items-center gap-4">
                  <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-container-lowest">
                    <img alt="Modern smart health wearable wristband strap device" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-sZcmtZIEwGqFTmcJbFT5VQxZotrtQ0AMhIcFbjN2j3hA_2D6JeypaZ5xmrN_d3xu5W0qCRKCoWhRzV8ZGpVcgPrRGfy3nEu_gbfmy8lCLl20pES3FHzff_ncvb5auWU_tZRdjCMvtpCa8jXHTmvoLEF8qZQkaBrXBhiXXHrTi6vtuzJ8Why7uf4FZMEQuqQgJ-cmOGjtbNIJc4WG3jys9Lx2cO8pGgSx_stTlJo3DBA6fCfyDaPoRA" />
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-surface-dim/80 text-secondary font-semibold" style={{ fontSize: 10 }}>BLE 5.3</span>
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface truncate" style={{ fontSize: 16, fontWeight: 600 }}>Mojo Strap</span>
                      <span className="flex items-center gap-1 text-secondary font-semibold" style={{ fontSize: 13 }}>
                        <span className="material-symbols-outlined text-sm">battery_charging_90</span> 92%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="text-secondary font-medium truncate" style={{ fontSize: 12 }}>Firmly Worn • Optimal signal</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant mt-2 pt-2 bg-surface-container-high/40 rounded px-2 py-1" style={{ fontSize: 12 }}>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary">sync</span> Sync: Live
                      </span>
                      <span style={{ fontSize: 13 }}>Skin: 14.2 kΩ (Good)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOUR CORE METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* CARD 1: Steps */}
              <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-5 shadow-md hover:bg-surface-container-high/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-xl">directions_walk</span>
                    </div>
                    <div>
                      <h3 className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Daily Steps</h3>
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Target: 10,000</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>84% Goal</span>
                </div>
                <div className="my-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-on-surface tracking-tight" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>8,420</span>
                    <span className="text-on-surface-variant" style={{ fontSize: 14 }}>/ 10k steps</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: "84.2%" }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between text-on-surface-variant" style={{ fontSize: 11, fontWeight: 700 }}>
                    <span>HOURLY CADENCE</span>
                    <span className="text-secondary font-medium">Peak: 11 AM - 1 PM</span>
                  </div>
                  <div className="h-14 flex items-end gap-1.5 px-1 py-1 bg-surface-container rounded-lg">
                    {[25, 45, 70, 98, 82, 40, 65, 50, 35, 20].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t hover:bg-secondary transition-colors ${i === 3 ? "bg-secondary" : i === 2 || i === 4 ? "bg-secondary-container/70" : "bg-surface-container-highest"}`} style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 bg-surface-container rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">route</span>
                    <div>
                      <div className="text-on-surface-variant" style={{ fontSize: 12 }}>Distance</div>
                      <div className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>5.8 km</div>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-surface-container-highest"></div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">local_fire_department</span>
                    <div>
                      <div className="text-on-surface-variant" style={{ fontSize: 12 }}>Energy Burn</div>
                      <div className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>412 kcal</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Heart Rate */}
              <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-5 shadow-md hover:bg-surface-container-high/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-error-container/20 flex items-center justify-center text-error">
                      <span className="material-symbols-outlined text-xl animate-pulse">favorite</span>
                    </div>
                    <div>
                      <h3 className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Heart Rate &amp; Rhythm</h3>
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Resting: 68-76 BPM</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700 }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Sinus Rhythm
                  </span>
                </div>
                <div className="flex items-baseline justify-between my-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-on-surface" id="live-bpm" ref={bpmRef} style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>74</span>
                    <span className="text-on-surface-variant" style={{ fontSize: 16, fontWeight: 600 }}>BPM</span>
                  </div>
                  <div className="text-right">
                    <span className="text-on-surface-variant" style={{ fontSize: 12 }}>HRV (rMSSD)</span>
                    <div className="text-secondary font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>58 ms</div>
                  </div>
                </div>
                <div className="relative w-full h-16 bg-surface-container rounded-lg overflow-hidden flex items-center">
                  <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#74d8c5_1px,transparent_1px),linear-gradient(to_bottom,#74d8c5_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 60">
                    <path className="opacity-95" d="M0,30 L30,30 L38,30 L42,22 L46,38 L50,30 L65,30 L72,28 L76,12 L82,52 L88,24 L94,30 L120,30 L128,30 L132,22 L136,38 L140,30 L155,30 L162,28 L166,12 L172,52 L178,24 L184,30 L210,30 L218,30 L222,22 L226,38 L230,30 L245,30 L252,28 L256,12 L262,52 L268,24 L274,30 L300,30" fill="none" stroke="#74d8c5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <span className="absolute right-2 top-1.5 text-secondary font-mono tracking-widest" style={{ fontSize: 10 }}>LEAD I • 25mm/s</span>
                </div>
                <div className="pt-3 mt-1">
                  <button className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-container hover:text-white text-on-surface transition-all" id="ecg-trigger-btn" ref={ecgBtnRef} type="button">
                    <span className="material-symbols-outlined text-base" style={{ color: "#FFC23C" }}>monitor_heart</span>
                    <span style={{ fontSize: 14 }} className="font-medium">Record 30s Lead I Strip</span>
                    <span className="px-1.5 rounded bg-surface-container-low text-on-surface-variant" style={{ fontSize: 10 }}>Ready</span>
                  </button>
                </div>
              </div>

              {/* CARD 3: Blood Pressure */}
              <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-5 shadow-md hover:bg-surface-container-high/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary-container/30 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-xl">speed</span>
                    </div>
                    <div>
                      <h3 className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Blood Pressure</h3>
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Omron BLE Cuff #992</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>Optimal Range</span>
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-on-surface" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>118/76</span>
                    <span className="text-on-surface-variant font-normal" style={{ fontSize: 16, fontWeight: 600 }}>mmHg</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-secondary" style={{ fontSize: 12 }}>
                    <span className="material-symbols-outlined text-sm">trending_down</span>
                    <span>-3 mmHg vs yesterday morning (121/78)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 my-1">
                  <div className="p-2.5 rounded-lg bg-surface-container">
                    <span className="text-on-surface-variant uppercase" style={{ fontSize: 11 }}>Mean Arterial (MAP)</span>
                    <div className="text-on-surface font-semibold mt-0.5" style={{ fontSize: 16, fontWeight: 600 }}>90 <span className="text-on-surface-variant font-normal" style={{ fontSize: 12 }}>mmHg</span></div>
                    <span className="text-secondary" style={{ fontSize: 11 }}>Target: 70-100</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container">
                    <span className="text-on-surface-variant uppercase" style={{ fontSize: 11 }}>Pulse Pressure</span>
                    <div className="text-on-surface font-semibold mt-0.5" style={{ fontSize: 16, fontWeight: 600 }}>42 <span className="text-on-surface-variant font-normal" style={{ fontSize: 12 }}>mmHg</span></div>
                    <span className="text-secondary" style={{ fontSize: 11 }}>Normal elasticity</span>
                  </div>
                </div>
                <div className="pt-2 text-on-surface-variant flex items-center justify-between" style={{ fontSize: 12 }}>
                  <span>Last synced: Today, 07:45 AM</span>
                  <button className="text-primary hover:underline" style={{ fontSize: 13 }} type="button">Log Manual</button>
                </div>
              </div>

              {/* CARD 4: Gas & Thermometry */}
              <div className="flex flex-col justify-between gap-3 rounded-xl bg-surface-container-low p-5 shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Gas &amp; Thermometry</h3>
                    <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 700 }}>Continuous Optic</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-xl">air</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant uppercase" style={{ fontSize: 11 }}>Blood Oxygen (SpO2)</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-on-surface leading-none" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>98%</span>
                        <span className="text-secondary font-medium" style={{ fontSize: 12 }}>Normal</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-surface-container-highest stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3.5" />
                      <path className="text-secondary stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="98, 100" strokeLinecap="round" strokeWidth="3.5" />
                    </svg>
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-xl">device_thermostat</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant uppercase" style={{ fontSize: 11 }}>Skin Temp (Strap Sensor)</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-on-surface leading-none" style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600 }}>36.8°C</span>
                        <span className="text-primary font-medium" style={{ fontSize: 12 }}>Steady</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-on-surface-variant" style={{ fontSize: 11 }}>Baseline</span>
                    <div className="text-on-surface" style={{ fontSize: 13 }}>36.6 - 37.1</div>
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-between text-on-surface-variant" style={{ fontSize: 12 }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span> Peripheral perfusion index: 4.8
                  </span>
                </div>
              </div>
            </div>

            {/* GPS SECTION */}
            <div className="w-full rounded-2xl bg-surface-container-low p-6 lg:p-7 shadow-xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-error-container/20 text-error flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                    </span>
                    <h2 className="text-on-surface" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600 }}>Emergency Geolocation &amp; Dispatch Routing</h2>
                  </div>
                  <p className="text-on-surface-variant" style={{ fontSize: 14 }}>Live telemetry beacon armed for auto-dispatch in case of fall, loss of consciousness, or tonic-clonic event detection.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                    </span>
                    <span className="text-secondary uppercase font-semibold" style={{ fontSize: 11 }}>Active Beacon • Broadcast on Alert</span>
                  </div>
                  <span className="text-on-surface-variant px-2.5 py-1 rounded bg-surface-container" style={{ fontSize: 13 }}>GPS Acc: ±4m</span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 relative rounded-xl overflow-hidden min-h-[300px] lg:min-h-[360px] bg-surface-container-lowest shadow-inner flex flex-col justify-between p-4">
                  <img alt="Modern digital GPS map interface showing user live pulse location marker" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsXV2FpaW5bWcQwdlGQnWSlD-spbH2UXMVZ7uLhOs_xAvZGGtpX0tgqE2vs_gPMwilU6z8AMbHlmJXtMqxh8e9gW-XQ2LETlj4UviuZZsL2pYV2imsrK2muTj2ILmdRTtsDz6YuzVuny4BpwlceXmcA3Hqap2YjfgYS3C6VRZ8E2bMODJLjdUciOmZjZfaGurdeil1cPzh0DgpmIVe_1UWXS7bP_sFN4PKkoGP3Ck0--lKxywgfiWG6g" />
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-dim/85 backdrop-blur-md text-on-surface shadow-md">
                      <span className="material-symbols-outlined text-primary text-base">my_location</span>
                      <span className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Upper Hill, Nairobi</span>
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>• 1°18&apos;04.2&quot;S 36°48&apos;56.1&quot;E</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-surface-dim/85 backdrop-blur-md text-secondary font-mono" style={{ fontSize: 11 }}>RTK-CORRECTED</div>
                  </div>
                  <div className="relative z-10 p-3.5 rounded-xl bg-surface-dim/90 backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-lg">local_shipping</span>
                      </div>
                      <div>
                        <div className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Dispatched Evac Corridors Open</div>
                        <div className="text-on-surface-variant" style={{ fontSize: 12 }}>Haile Selassie Ave clear • Ambulatory traffic priority active</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary whitespace-nowrap transition-colors" style={{ fontSize: 12 }} type="button">Expand GIS HUD</button>
                  </div>
                </div>
                <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-surface-container rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-error-container/20 text-error font-bold uppercase tracking-wider" style={{ fontSize: 11 }}>Primary Designated Facility</span>
                      <span className="text-secondary font-semibold" style={{ fontSize: 13 }}>ETA: 6 mins</span>
                    </div>
                    <div>
                      <h3 className="text-on-surface font-semibold" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600 }}>The Nairobi Hospital</h3>
                      <p className="text-on-surface-variant" style={{ fontSize: 14 }}>Argwings Kodhek Rd, Upper Hill • Level 6 Tertiary</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 my-1">
                      <div className="p-2.5 rounded-lg bg-surface-container-high/70 flex flex-col gap-0.5">
                        <span className="text-on-surface-variant uppercase" style={{ fontSize: 11 }}>Emergency Readiness</span>
                        <span className="text-secondary font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>24/7 Trauma &amp; ICU</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-container-high/70 flex flex-col gap-0.5">
                        <span className="text-on-surface-variant uppercase" style={{ fontSize: 11 }}>Proximity Distance</span>
                        <span className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>1.8 km Direct</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-on-surface-variant pt-1" style={{ fontSize: 12 }}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                        <span>Neuro-critical care team on active standby</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                        <span>Full EHR pre-authorized for emergency handover</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5 pt-3">
                    <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-error hover:bg-error/90 text-on-error font-bold transition-all shadow-[0_0_20px_rgba(255,180,171,0.25)]" style={{ fontSize: 16, fontWeight: 600 }} type="button">
                      <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                      <span>One-Tap Ambulance (999 &amp; Dispatch)</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface transition-colors" style={{ fontSize: 14 }} type="button">
                        <span className="material-symbols-outlined text-base text-primary">navigation</span>
                        <span>Turn-by-Turn</span>
                      </button>
                      <button className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface transition-colors" id="share-link-btn" ref={shareBtnRef} type="button" style={{ fontSize: 14 }}>
                        <span className="material-symbols-outlined text-base text-secondary">share_location</span>
                        <span>Share Location</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MEDICATION & CARE CIRCLE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Medication */}
              <div className="lg:col-span-7 flex flex-col gap-4 rounded-2xl bg-surface-container-low p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(245, 194, 107, 0.15)", color: "#F5C26B" }}>
                      <span className="material-symbols-outlined text-xl">medication</span>
                    </div>
                    <div>
                      <h2 className="text-on-surface" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600 }}>Medication Check-In</h2>
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Scheduled neuro-protective &amp; vascular therapies</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high" style={{ color: "#F5C26B" }}>
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>94% Weekly Adherence</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 my-2">
                  <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-3 transition-all" id="dose-card-levetiracetam" ref={doseCardRef}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ backgroundColor: "#F5C26B" }}></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>Levetiracetam</span>
                            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-mono" style={{ fontSize: 12 }}>500 mg</span>
                          </div>
                          <div className="text-on-surface-variant mt-0.5" style={{ fontSize: 14 }}>Anticonvulsant • Oral Tablet with Water</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold" style={{ color: "#F5C26B", fontSize: 16, fontWeight: 600 }}>8:00 PM</span>
                        <div className="text-on-surface-variant" style={{ fontSize: 12 }}>in 45 mins</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2" id="dose-action-container" ref={actionContainerRef}>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-surface-dim transition-all shadow-md hover:brightness-110" id="confirm-taken-btn" ref={confirmBtnRef} style={{ backgroundColor: "#F5C26B", fontSize: 16, fontWeight: 600 }} type="button">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        <span>Confirm Taken</span>
                      </button>
                      <button className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface transition-colors" id="snooze-btn" ref={snoozeBtnRef} style={{ fontSize: 14 }} type="button">
                        <span className="material-symbols-outlined text-base">alarm</span>
                        <span>Snooze 10m</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-base">done</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant line-through" style={{ fontSize: 16, fontWeight: 600 }}>Amlodipine</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant" style={{ fontSize: 12 }}>5 mg</span>
                        </div>
                        <div className="text-on-surface-variant" style={{ fontSize: 12 }}>Antihypertensive • Morning Regimen</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700 }}>
                        <span className="material-symbols-outlined text-xs">check</span> Taken 08:02 AM
                      </span>
                      <span className="text-on-surface-variant mt-0.5" style={{ fontSize: 12 }}>Recorded via Smart Cap</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 text-on-surface-variant" style={{ fontSize: 12 }}>
                  <span>7-Day Log: 14 of 14 Doses Logged on Time</span>
                  <button className="text-secondary hover:underline" style={{ fontSize: 13 }} type="button">Pharmacy Refill (18 days left)</button>
                </div>
              </div>

              {/* Care Circle */}
              <div className="lg:col-span-5 flex flex-col gap-4 rounded-2xl bg-surface-container-low p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-xl">shield_person</span>
                    </div>
                    <div>
                      <h2 className="text-on-surface" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600 }}>Care Circle &amp; Consent</h2>
                      <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Real-time doctor access &amp; SOS mesh</span>
                    </div>
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-primary" title="Live Link"></span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold" style={{ fontSize: 16, fontWeight: 600 }}>AO</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-on-surface font-semibold" style={{ fontSize: 16, fontWeight: 600 }}>Dr. Amara Okafor</span>
                          <span className="material-symbols-outlined text-secondary text-sm" title="Verified Board License">verified</span>
                        </div>
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>KMPDC Reg #A49182 • Attending Neurologist</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-surface-container-high/60 rounded-lg p-2.5 text-on-surface-variant" style={{ fontSize: 12 }}>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">visibility</span>
                      <span>Audited trends <strong>1h ago</strong></span>
                    </span>
                    <button className="text-primary hover:underline" style={{ fontSize: 13 }} type="button">Send Note</button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-on-surface-variant uppercase tracking-wider" style={{ fontSize: 11 }}>Automated SOS Dispatch Mesh:</span>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-secondary text-base">family_restroom</span>
                      <div>
                        <div className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>David Mwangi</div>
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Spouse • Primary SOS Proxy</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>Priority #1</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-secondary text-base">support_agent</span>
                      <div>
                        <div className="text-on-surface" style={{ fontSize: 16, fontWeight: 600 }}>Grace Otieno</div>
                        <span className="text-on-surface-variant" style={{ fontSize: 12 }}>Caregiver • Community Nurse</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant" style={{ fontSize: 11, fontWeight: 700 }}>Priority #2</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-container-highest/60 flex items-start gap-3 mt-1">
                  <span className="material-symbols-outlined text-secondary text-lg mt-0.5 shrink-0">database</span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface font-bold uppercase tracking-wide" style={{ fontSize: 11 }}>Encrypted Local SQLite Active</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    </div>
                    <p className="text-on-surface-variant" style={{ fontSize: 12 }}>All biometric intervals, medications, and GPS coordinates log securely offline with AES-256 and sync seamlessly upon signal recovery.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
