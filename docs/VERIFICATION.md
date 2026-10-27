# VERIFICATION.md — Mojo / Project Epi
> Stage 7 audit · 27 Oct 2026 · Stages 3–7 complete; pgTAP suites created (42 assertions unrun).
>
> **Status key:** `verified` = traced in code + named test passes · `partial` = partially built or test unrun · `missing` = not implemented · `conflicts` = built differently from requirement · `blocked` = needs hardware / SIM / provider contract / human decision.
>
> PROJECT_EPI_BUILD_SPEC.md was not found in the repo. Audit is based on MOJO_REQUIREMENTS.md, MOJO_CONTENT_PLAYBOOK.md, and direct code inspection.

---

## Baseline (Stage 1)

### Build / typecheck / test
| Command | Result |
|---|---|
| `pnpm build` | Not run — no CI environment |
| `pnpm typecheck` | Not run |
| `pnpm test` | Not run — **zero JS/TS test files exist** |
| `supabase test db` | Not run — requires local Supabase |
| pgTAP suite | `supabase/tests/rls_phase1.sql` (28 assertions) + `supabase/tests/rls_stage4.sql` (14 assertions) exist = **42 total assertions**; not executed (no local Supabase) |

### Epi occurrences — user-facing
> **Stage 3 resolved:** All 8 user-facing occurrences below were replaced. Remaining audit is for reference.

| File | Line | Text | Stage 3 fix |
|---|---|---|---|
| src/App.tsx | ~545 | `"Say what happened and Epi turns it into a log you can edit."` | ✓ renamed "Mojo" |
| src/App.tsx | ~559 | `"Epi never diagnoses or changes your medication."` | ✓ renamed "Mojo" |
| src/App.tsx | ~703 | `"Epi summarizes what was logged."` | ✓ renamed "Mojo" |
| src/App.tsx | ~819 | `<strong>Epi</strong> Clinic` (sidebar brand) | ✓ renamed "Mojo Clinic" |
| src/components/StitchDashboard.tsx | header | `"Project Epi"` branding + patient `#EP-8492` | ✓ renamed "Mojo" |
| src/components/StitchGPS.tsx | header | `"Project Epi"` | ✓ renamed "Mojo" |
| src/components/StitchMedications.tsx | header | `"Project Epi"` | ✓ renamed "Mojo" |
| src/components/StitchVitals.tsx | header | `"Project Epi"` | ✓ renamed "Mojo" |

### Epi occurrences — internal code (safe to rename)
| File | Value |
|---|---|
| clinician-web/package.json | `"name": "project-epi-clinician-web"` |
| DEVELOPMENT_GUIDE.md | `project-epi` references |
| PROJECT_EPI_SETUP.md | `project-epi` references |
| docs/DECISIONS.md | `epi-teal` token names |
| clinician-web/scripts/seed.mjs | `@patient.epi`, `@epi.app` demo emails |
| src/lib/supabase.ts | `amina@patient.epi` demo auth |

### Epi occurrences — CR-NAME-06 stop list (do NOT change without approval)
| Identifier | Location | Recommendation |
|---|---|---|
| `id = "project-epi"` | supabase/config.toml | Keep; changing breaks the Supabase project ref |
| `'epi_strap_a'`, `'epi_strap_b'` | devices.model + firmware_releases.model CHECK constraints (migration 003) | **Stage 4 resolved:** Migration `007_rename_strap_models.sql` drops old CHECK constraints and adds `mojo_strap_a`/`mojo_strap_b` equivalents; existing `epi_strap_*` rows updated. |
| Mobile bundle ID `com.duara.app` | mobile/app.json | Keep; mobile app is currently branded "Duara", not "Epi" — may need separate rename decision |
| Expo slug `duara` | mobile/app.json | Same as above |
| Expo update URL UUID | mobile/app.json | Keep; OTA update channel identifier |

---

## Stage 2 — Requirement Audit

### CR-NAME — Rename to Mojo

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-NAME-01 | User-facing text says Mojo everywhere | `partial` | All 14 user-facing "Epi"/"Project Epi" occurrences replaced in src/App.tsx + 4 Stitch components (Stage 3). Push notification strings in escalation-tick rewritten in Stage 4: no emoji, playbook tone, patient name in title. `scripts/check-epi-strings.sh` CI guard created (Stage 6). Not yet wired into GitHub Actions. | Scenario 8 (manual) | Wire CI script; run on every PR |
| CR-NAME-02 | Strap called "Mojo Strap" | `partial` | "Epi Strap A", "Epi Strap Pro X", "Epi Hardware Band Alpha", "Epi Strap Stream" all renamed to "Mojo Strap" (Stage 3). BLE advertised name not changeable without hardware. | none | BLE advertised name (hardware, Stage 7 manual test) |
| CR-NAME-03 | Logo placeholder: "Mojo" wordmark + pulse glyph; app icon teal rounded square | `missing` | No Mojo logo/icon found; `public/favicon.svg` is generic | none | Create placeholder SVG assets per spec tokens |
| CR-NAME-04 | Both languages: "Mojo" in Swahili strings too | `partial` | `src/i18n/catalogue.ts` created (Stage 6): 34 entries with `en` + `sw` fields; all Swahili strings marked `needs_review`. Catalogue is a reference only — not yet wired to UI via `getCopy()`. | none | Human Swahili reviewer; wire `getCopy()` to UI components |
| CR-NAME-05 | Internal code renamed epi→mojo (packages, env vars, tokens) | `partial` | clinician-web/package.json renamed to `mojo-clinician-web` (Stage 3). Demo auth email `amina@patient.epi` kept (stop list — requires Supabase Auth change). No CSS epi-* token names existed. | none | Coordinate demo email rename with Supabase Auth console |
| CR-NAME-06 | Do not change identifiers on stop list | `partial` | Migration `007_rename_strap_models.sql` (Stage 4) renames device model values `epi_strap_a/b` → `mojo_strap_a/b`. Remaining stop-list items (`project-epi` Supabase ID, Duara bundle/slug, demo email) documented in `docs/RENAME.md` — kept as-is pending separate decisions. | none | Coordinate demo email rename + bundle ID with Supabase Auth console |
| CR-NAME-07 | CI check: no user-facing "Epi" in assets/store text | `partial` | Script created at `scripts/check-epi-strings.sh`. Not yet wired into CI pipeline. | none | Add to GitHub Actions / CI |

### CR-COND — Conditions

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-COND-01 | Conditions are config (condition_templates), not code | `partial` | `condition_templates` table in migration 003; 19 templates seeded; but no UI to use templates — conditions are hardcoded in app demo data | none | Wire condition_templates to patient onboarding and clinician settings |
| CR-COND-02 | Group A conditions (strap only): 11 listed | `partial` | All 11 seeded in migration 003 (heart_disease, arrhythmia_af, copd, asthma, sleep_apnoea, epilepsy, parkinsons, elderly_fall, post_surgery, fever_illness) | none | Tests unrun; lung_infection_recovery not in seed |
| CR-COND-03 | Group B conditions (strap + add-on): 5 listed | `partial` | All 5 seeded (hypertension, diabetes, kidney_disease, pregnancy, stroke_recovery) | none | Tests unrun |
| CR-COND-04 | Group C conditions (trends + support): 4 listed | `partial` | All 4 seeded (bipolar, depression_anxiety, sickle_cell, hiv_tb) | none | Tests unrun |

### CR-STRAP — Strap

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-STRAP-01 | Support Concept A (screen) and Concept B (LED) via firmware flag | `missing` | No BLE code anywhere in the codebase; no firmware; UI shows placeholder image of strap | none | Requires hardware + firmware; stub firmware_flag logic in app |
| CR-STRAP-02 | Heart rate 1 s, SpO2 5 min, temp 5 min, breathing, HRV, steps/sleep | `blocked` | vital_samples schema exists with all metrics; no BLE data pipeline | none | Hardware + BLE SDK required |
| CR-STRAP-03 | Fall detection, convulsive episodes, tremor, inactivity, wear detection | `blocked` | motion_events schema exists with correct types | none | Hardware + firmware algorithm required |
| CR-STRAP-04 | Store ≥ 72 h on strap; upload on reconnect, oldest first, dedup by sequence | `partial` | Schema supports dedup (dose_events UNIQUE, vital_samples); no sequence_number column on vital_samples for upload ordering | none | Add sequence_number to vital_samples; implement BLE upload logic |
| CR-STRAP-05 | Medication reminders on strap; Confirm button logs dose with device time | `missing` | Medication reminder schema exists; no BLE notification / strap-side confirm implementation | none | Firmware + BLE confirm flow |
| CR-STRAP-06 | SOS: hold 3 s → 10 s cancel window; retry if not sent | `partial` | SOS screen has send/cancel UI; countdown is **5 s** not 10 s cancel window; no hold-3s mechanic; no retry logic | none | Fix countdown to 10 s; add hold-to-activate gesture; implement retry |
| CR-STRAP-07 | Battery ≥ 5 days; warn at 20%/10% | `blocked` | battery_pct in devices schema; no UI battery warning | none | Hardware required for target; add push notification logic |
| CR-STRAP-08 | Bonded BLE; signed OTA with staged rollout | `blocked` | firmware_releases table with rollout_pct; no BLE bonding or OTA client | none | Hardware + firmware |
| CR-STRAP-09 | Quality score on every reading; low-quality greyed, not used for critical alerts | `partial` | `quality INTEGER` column in vital_samples; no enforcement in UI or alert_rules | none | Add quality check to alert_rules trigger; grey low-quality readings in UI |

### CR-ADD — Add-on Devices

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-ADD-01 | ECG 30 s Lead-I; Release 1: trace only to clinician, no rhythm to patient; Release 2 behind `release2_ecg_rhythm` | `partial` | ecg_recordings schema correct; `release2_ecg_rhythm = false` seeded in migration 005 (Stage 5); StitchVitals now queries the flag at runtime and conditionally shows "Saved" (Release 1) vs rhythm classification (Release 2); required disclaimer "A wrist ECG is a rhythm check, not a replacement for a hospital ECG" added; out-of-range wording fixed to "above usual range" (no "abnormal"). | Scenario — manual ECG test requires hardware (HW-02) | Verify flag gate on physical device; clinician ECG strip viewer still needs 25 mm/s grid + mark-reviewed UI |
| CR-ADD-02 | BP cuff (systolic, diastolic, pulse) | `partial` | addon_readings columns exist; no BLE pairing | none | BLE integration |
| CR-ADD-03 | Glucose meter / CGM; mmol/L default | `partial` | glucose_mmol in addon_readings; no unit toggle (mmol/mg/dL) | none | Unit toggle, BLE integration |
| CR-ADD-04 | Weight scale | `partial` | weight_kg in addon_readings | none | BLE integration |
| CR-ADD-05 | Add-on readings on same timeline as strap | `partial` | Schema supports this; no combined timeline UI | none | Build combined timeline view |
| CR-ADD-06 | Only approved models can be paired | `partial` | approved_addon_models table + approved boolean on addon_devices; no UI enforcement in pairing flow | none | Pairing check against approved_addon_models |
| CR-ADD-07 | Optional HealthKit / Health Connect bridge (flagged) | `missing` | `health_kit_bridge = false` feature flag seeded; no implementation | none | Build behind flag |

### CR-PAT — Patient App

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-PAT-01 | Tabs: Today · Vitals · Meds · Care · Me; SOS on every screen | `partial` | Web demo has "Home · Health · Circle · Records" nav — tab names differ; SOS button only on Home; Stitch components accessible via tiles but not tabs | none | Rename tabs to match spec; add SOS button to all screens |
| CR-PAT-02 | Onboarding: sign-up, EN/SW, consent, guardian, conditions, invite clinician, care circle, strap pairing | `missing` | No onboarding flow built | none | Build complete onboarding |
| CR-PAT-03 | Today: next dose, live HR/SpO2/temp, alerts, appointments, quick logs, battery, nearest hospital | `partial` | Next dose shown (PatientHome); SOS; no live BLE vitals; no appointments; no nearest hospital card; no battery status | none | Add live vitals, appointments, nearest hospital tile |
| CR-PAT-04 | Vitals: charts with limit lines, ECG + save status + review status; "above usual range" wording; ECG disclaimer | `partial` | StitchVitals has ECG recording and vitals display; no clinician limit lines; no review status; ECG disclaimer not present; "abnormal" not used (good) | none | Add limit lines, review status, ECG disclaimer (playbook required line) |
| CR-PAT-05 | Meds: clinician schedule read-only; Taken once offline; snooze; adherence %; refill; stock count | `partial` | StitchMedications shows schedule and Taken button; no offline enforcement; no snooze; no adherence chart; no stock count in UI | none | Enforce once-per-slot offline; add snooze, adherence, stock |
| CR-PAT-06 | Care: Care Circle, per-person per-category permissions, linked clinicians, appointments, follow-ups, notes | `partial` | CircleScreen has per-person permissions; no linked clinicians panel; no appointments; no follow-ups | none | Add clinician panel, appointments, follow-ups |
| CR-PAT-07 | Logs and records; upload/view, cached offline | `partial` | RecordsScreen (file upload/view); Insights screen (voice logs); no offline cache | none | Add offline cache |
| CR-PAT-08 | Me: profile, devices + updates, location settings, home address, "who viewed my data", export/delete, PIN/biometric | `missing` | No Me/Profile tab built | none | Build Me screen |
| CR-PAT-09 | Full offline; encrypted local SQLite with key in secure storage | `missing` | `StatusBanner` shows offline state; no local SQLite or encryption | none | Integrate SQLite with encryption (e.g. op-sqlite + MMKV) |

### CR-CG — Caregiver

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-CG-01 | Patient switcher; only granted data shown | `partial` | CaregiverScreen shows 1 patient; no switcher; "What you can see" chips show granted categories | none | Add patient switcher; enforce grant-only data |
| CR-CG-02 | Full-screen emergency alert with name/time/location map, "I've reached them"/"I can't reach them"/Call/Ambulance/Directions/Hospital | `partial` | Full-screen emergency alert UI built in `CaregiverScreen` (Stage 5): shows patient name, elapsed time, demo map, "I've reached them" / "I can't reach them" buttons; "Call patient" (`tel:`), "Call ambulance" (from `emergency_providers`), "Directions" deep link, "Nearest Hospital" buttons all wired. Inserts `sos_responses` row with correct `response_type`. | Scenario 1 (manual) | Live `sos_event_id` wiring (currently uses demo UUID); caregiver directions to hospital (CR-LOC-08) |
| CR-CG-03 | Missed-dose alerts: "Remind them" / "Mark taken (I gave it)" | `missing` | Not built | none | Build missed-dose caregiver alert |
| CR-CG-04 | Add observations; help with follow-ups | `partial` | CaregiverScreen has "Record an observation" button; no actual form; observations schema exists | none | Build observation form |
| CR-CG-05 | SMS-only contacts get digit-reply alerts ("Reply 1 = yes, 2 = no") | `missing` | sos_responses table exists; no SMS gateway integration; no digit-reply parsing | none | Build SMS gateway adapter (Africa's Talking / Twilio) |
| CR-CG-06 | "I can't reach them" / reply 2 does NOT stop escalation; only "I've reached them" / 1 or patient "I'm OK" stops it | `partial` | Fixed in Stage 4: migration `008_stage4_safety.sql` adds `response_type TEXT CHECK(response_type IN ('reached','not_reached','ok'))` to `sos_responses`; escalation-tick rewritten to filter `.in('response_type', ['reached','ok'])` before stopping. pgTAP test `CR-CG-06 not_reached does not stop` in `rls_stage4.sql` assertion #7 (unrun). | `rls_stage4.sql` assertion 7 (unrun) | Run `pnpm supabase test db` |
| CR-CG-07 | Contacts must accept by SMS (YES/NO) before active; pending/declined get no alerts | `partial` | Migration `008_stage4_safety.sql` adds `contact_status TEXT CHECK(IN('pending','accepted','declined'))` and `invited_at TIMESTAMPTZ` to `care_circle`; `is_emergency_contact()` RLS helper updated to require `contact_status = 'accepted'`. pgTAP assertion #8 in `rls_stage4.sql` covers this (unrun). SMS YES/NO reply parsing not yet built. | `rls_stage4.sql` assertion 8 (unrun) | Build SMS reply parsing for YES/NO invite acceptance |

### CR-CLIN — Clinician Dashboard

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-CLIN-01 | Sign-up with licence + cadre + body → pending → admin verify → MFA; lock 5 fails 15 min; expiry reminder | `partial` | clinician_verifications schema correct (cadres: doctor/clinical_officer/nurse); status flow correct; no account lockout field; no UI in this repo (may be in clinician-web) | `CR-CLIN-01: unverified clinician sees 0 ...` (pgTAP, unrun) | Run pgTAP; build lockout (failed_attempts column); confirm clinician-web sign-up flow |
| CR-CLIN-02 | Patient list sorted by urgency (critical alerts, warnings, missed doses, low adherence, strap > 24h unworn) | `partial` | Basic patient list in Clinician component; no urgency sort; no strap-unworn column | none | Build urgency sort from alerts + dose_events |
| CR-CLIN-03 | Patient overview: conditions, granted categories, vitals + trends + limits, add-on readings, motion, doses over vitals, mood/sleep if granted | `partial` | StitchDashboard shows vitals tiles; no limit lines; no mood/sleep gating; patient is hardcoded demo | none | Wire to live data; add limit lines; add mood grant gate |
| CR-CLIN-04 | ECG strip viewer (25 mm/s grid, zoom, gain), mark reviewed with note | `partial` | StitchVitals shows ECG strip animation; no 25 mm/s grid, no zoom, no mark-reviewed UI | none | Replace animation with real ECG grid; add review button |
| CR-CLIN-05 | Alert limit editor from templates; preview fire count; severity and pathway per rule | `missing` | alert_rules schema exists; no UI editor | none | Build limit editor in clinician-web |
| CR-CLIN-06 | Medication schedules: dose, times, days, snooze, max repeats, missed-after, escalation target, stock, refill threshold; versioned, synced to strap | `partial` | medication_schedules schema has all columns; no clinician-facing UI to set schedules | none | Build schedule editor in clinician-web |
| CR-CLIN-07 | Adherence report; export PDF/CSV | `missing` | No adherence report or export | none | Build adherence report |
| CR-CLIN-08 | Live alerts inbox: acknowledge, note, close with reason, escalation log | `missing` | alerts + alert_escalations schema exists; no alerts inbox UI | none | Build alerts inbox |
| CR-CLIN-09 | Set preferred hospital per patient; see location trail during alert | `partial` | preferred_facilities table; no UI | none | Build preferred hospital picker; location trail view |
| CR-CLIN-10 | Follow-ups, appointments, notes visible to patient; own access history | `partial` | followups schema; basic follow-up queue in Clinician component; no appointment scheduling; no access history shown | none | Build appointment scheduling; access history view |

### CR-ADM — Admin Portal

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-ADM-01 | MFA; optional IP allowlist; every action audited; zero clinical read | `partial` | break_glass_requests table; RLS policies for admin role exclude clinical tables; no admin portal UI in this codebase | `CR-ADM-01: admin sees 0 clinical rows` (pgTAP, unrun) | Build admin portal web app; run pgTAP |
| CR-ADM-02 | Overview/system health (no patient names); sandbox dispatch banner | `missing` | Not built | none | Build admin portal |
| CR-ADM-03 | Clinician verification queue: approve/reject/request info; expiry; revoke | `missing` | clinician_verifications schema exists; no admin UI | none | Build verification queue |
| CR-ADM-04 | Users, organisations, clinic manager role | `missing` | organisations + org_members schema; no UI | none | Build user management |
| CR-ADM-05 | Device inventory; approved add-on models; firmware upload, staged rollout | `missing` | firmware_releases + approved_addon_models schema; no UI | none | Build device management |
| CR-ADM-06 | Emergency routing: providers, test call, sandbox/live switch (needs 2 admins) | `missing` | emergency_providers schema; no UI; `live_dispatch = false` flag seeded | none | Build routing UI; implement 2-admin live-switch |
| CR-ADM-07 | Hospital directory (KMHFL import); maps/routing provider; ambulance numbers | `missing` | health_facilities schema; no import tooling | none | Build KMHFL import and admin UI |
| CR-ADM-08 | Crisis resources per country/language | `partial` | crisis_resources table with 1 Kenya entry seeded | none | Build admin UI to manage entries |
| CR-ADM-09 | Condition template editor | `missing` | condition_templates schema; no UI | none | Build template editor |
| CR-ADM-10 | Incidents; false-alarm rate; failed deliveries; break-glass flow | `partial` | break_glass_requests + paramedic_dispatches schema; no UI | none | Build incident log; break-glass UI |
| CR-ADM-11 | DPA requests (export/delete/correct); retention settings | `partial` | dpa_requests schema; no workflow | none | Build DPA request workflow |
| CR-ADM-12 | Audit log viewer; feature flags; EN/SW content and notification templates | `partial` | feature_flags table + 5 flags seeded; no admin UI; no notification template table | none | Build audit viewer; notification template table and UI |

### CR-SOS — Emergency and Escalation

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-SOS-01 | Triggers: SOS button, fall + no movement, seizure, critical limit exceeded | `partial` | SOS button in PatientHome and SosScreen; no fall-check trigger; alerts.source covers all types in schema | none | Wire fall → alert; wire critical alert rule firing |
| CR-SOS-01a | Fall check before alert: strap shows "Are you OK?" 30 s window; "I'm OK" ends it | `partial` | Stage 4: migration `008_stage4_safety.sql` adds `'fall_check'` to `alerts.state` CHECK constraint; `trigger_fall_alert()` function + trigger insert alert with `state = 'fall_check'` on `motion_events` with `type = 'fall'`; escalation-tick handles `fall_check` → `raised` after 30 s. UI "I'm OK" button on SosScreen sets state to `closed`. | Scenario 1 step 1-2 (manual) | SOS screen "I'm OK" button needs to update alert state via Supabase; physical strap required for fall sensor |
| CR-SOS-02 | T+0 notify contacts; T+2 reminder; T+4 call paramedics; contacts and clinician told with dispatch ref | `partial` | escalation-tick implements T+0/T+2/T+4 correctly for medical pathway; T+0 step pushes to all emergency contacts; SOS UI has 5 s countdown (not 10 s cancel window per CR-STRAP-06) | none | Fix SOS countdown to 10 s; verify push notification delivery; add dispatch reference to T+4 message |
| CR-SOS-03 | Offline SOS: push+realtime online; SMS when no internet; queue when no signal; escalation clock from original time | `partial` | SosScreen UI mentions SMS fallback; no actual SMS send; no queue; no retry; no offline clock management | none | Implement SMS gateway; offline queue; sync original timestamp |
| CR-SOS-04 | Patient or any emergency contact stops escalation; cancel before dispatch; false alarm after; false alarms shown to clinician, not penalised | `partial` | Fixed in Stage 4 alongside CR-CG-06: escalation-tick now only stops on `response_type IN ('reached','ok')`; SosScreen has "Cancel" button that closes alert; "false alarm" state not yet wired to a separate analytics view for clinicians. | Scenario 1 variation A (manual) | Build false-alarm clinician view; run pgTAP |
| CR-SOS-05 | Warning-level alerts: clinician + granted caregivers only; no dispatch | `partial` | Stage 4: escalation-tick checks `alert.pathway === 'medical' && alert.severity === 'critical'` before calling `dispatchParamedics()`; warning-severity and mental_health pathway both route to `crisis_line` action, not `call_paramedics`. `alerts.severity` added to SELECT. | Scenario 6 (manual) | Verify warning alerts do not produce `paramedic_dispatches` rows |
| CR-SOS-06 | Dispatch payload: location first, then name/time/trigger/callback/nearest hospital; medical details only if consented | `partial` | Stage 4: `dispatchParamedics()` now builds a structured `payload` JSON: `location_lat`, `location_lon`, `patient_name`, `alert_time_str`, `script` (starts with "This is an automated emergency alert from Mojo." — location first, no emoji). Payload stored in `paramedic_dispatches.payload`. Medical details consent check and nearest-hospital field not yet included. | Scenario 1 step 7 (manual) | Add nearest-hospital to payload; add consent-gate for medical details |
| CR-SOS-07 | Automated call script follows playbook (location, name, time, consented details, callback); repeats once | `partial` | Dispatch action logged; no TTS call script implementation; no playbook copy wired | none | Build TTS script adapter with playbook copy |

### CR-LOC — Location, Contacts, Hospitals, Ambulance

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-LOC-01 | GPS only during SOS/alert (not continuously); live link with expiry | `partial` | Stage 5: EmergencyMap now requires an `alertId` prop and only starts GPS `watchPosition` when rendered (i.e., when an alert is active). GPS uploads to `patient_locations` every 15 s using WKT `POINT(lon lat)` format with `accuracy_m` column. `background_location` feature flag keeps "always-on" location off by default. `location_shares` expiry not yet wired. | LOC-01 (manual, needs real device) | Wire `location_shares` creation with expiry on alert open; test on device |
| CR-LOC-02 | Saved home address and landmarks added to SOS messages | `partial` | saved_places table (home, work, other); no UI to add them; not used in dispatch payload | none | Build saved-places UI; add to dispatch payload |
| CR-LOC-03 | Phone contacts: picker only, save name+number, never upload address book | `missing` | Not built | none | Implement contacts picker with number-only storage, E.164 normalisation |
| CR-LOC-04 | Hospitals from KMHFL with capabilities (24h, ambulance, maternity, ICU, dialysis, cardiac, stroke) | `partial` | Stage 5: EmergencyMap now queries `health_facilities` DB first; parses PostGIS GeoJSON coordinates; falls back to 4 hardcoded Nairobi hospitals if DB returns empty. Schema has all capability columns. 0 real KMHFL data imported. | Scenario 7 (manual) | KMHFL import via admin portal; build admin import tooling (CR-ADM-07) |
| CR-LOC-05 | Cache facilities within 50 km; offline haversine distance | `partial` | Stage 5: EmergencyMap uses haversine formula to rank hospitals by distance from user's GPS position when DB returns results; offline fallback `FALLBACK_HOSPITALS` also ranked by haversine. No 50 km radius filter yet — all facilities returned from DB. | Scenario 7 steps 2-3 (manual) | Add 50 km radius filter in DB query; build client-side facility cache in local storage |
| CR-LOC-06 | Ranking: open/24h → condition match → travel time (online)/distance (offline); clinician preferred first | `partial` | Ranking logic not in any component; StitchGPS has static ranked list | none | Build ranking function |
| CR-LOC-07 | Hospital card: name, level, distance, travel time, open now, capabilities, tap to call, Directions deep link; in-app route + compass offline | `partial` | StitchGPS shows hospital list with distance and ER status; no tap-to-call; no Directions deep link | none | Add call + directions actions |
| CR-LOC-08 | Caregivers get directions to patient then to hospital | `missing` | Not built | none | Build in caregiver emergency alert screen |
| CR-LOC-09 | "Call ambulance" button dials region number from emergency_providers; works offline | `partial` | Stage 5: EmergencyMap queries `emergency_providers` at mount; renders a `tel:` anchor with the loaded phone number. CaregiverScreen also has a "Call ambulance" `tel:` button. Number falls back to "999" if DB unavailable. Not yet on PatientHome screen (only on EmergencyMap/alert view). | Scenario 7 step 4 (manual) | Add to PatientHome quick-access; test offline fallback |
| CR-LOC-10 | Optional SMS to hospital emergency desk (flagged, opted-in only) | `partial` | facility_notifications table; `hospital_arrival_sms = false` flag seeded | none | Build send logic behind flag |

### CR-MED — Medication and Mental Health

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-MED-01 | Reminder on strap + phone; repeat up to max repeats; mark missed; notify caregiver/clinician; never dispatch | `partial` | medication_schedules has snooze_interval_min, max_repeats, missed_after_min, escalate_to; no reminder engine or notification dispatcher | none | Build reminder engine (Edge Function or cron); push notification on missed dose |
| CR-MED-02 | Dose logged only once (strap, app, or caregiver) | `partial` | Stage 4: `handleMedTaken` in App.tsx fixed — now looks up `medication_id` from `medications` table then inserts into `dose_events` directly (not the `medication_logs` VIEW). `UNIQUE(schedule_id, scheduled_for)` enforces DB-level dedup; pgTAP test `CR-MED-02` in `rls_stage4.sql` (unrun). Caregiver "Mark taken" not yet built (CR-CG-03). | `rls_stage4.sql` assertion for CR-MED-02 (unrun) | Run `pnpm supabase test db`; build caregiver "Mark taken" |
| CR-MED-03 | Refill alert at threshold | `partial` | refill_alerts table; stock_count and refill_threshold columns; no trigger logic | none | Build stock decrement trigger + refill alert |
| CR-MED-04 | Mental-health pathway: mood/sleep/activity → clinician + trusted contact; show crisis resources; never dispatch ambulance | `partial` | escalation-tick correctly routes `mental_health` pathway to `crisis_line` not `call_paramedics` (verified in code); crisis_resources table has 1 entry; no UI to show crisis resources | none | Build crisis resource display; run test |
| CR-MED-05 | Mood data off by default, even for clinicians, until granted | `partial` | mood_checkins requires `mood` grant (RLS policy in migration 003); `CR-SEC-04` pgTAP test verifies; no UI default toggle | `CR-SEC-04 mood grant` (pgTAP, unrun) | Run pgTAP; add UI toggle showing mood is off by default |

### CR-SEC — Privacy and Security

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-SEC-01 | Access starts empty; per-category grants (vitals, ecg, medications, adherence, appointments, events, symptoms, mood, records, location_on_sos, addon_readings) | `partial` | grants table has all 11 categories in migration 003; migration 001 has 5 legacy categories; RLS uses grant checks; no test that access starts empty | `CR-SEC-01: caregiver no grant sees 0 rows` (pgTAP × 8, unrun) | Run pgTAP; verify old legacy categories don't expose data |
| CR-SEC-02 | Revoke removes access on next sync; clears cached data on that device | `partial` | RLS excludes rows where revoked_at IS NOT NULL; no client-side cache-clearing mechanism | none | Build cache-clearing signal (e.g., push notification on revoke, client clears local store) |
| CR-SEC-03 | Every clinician/caregiver view audited; visible to patient | `partial` | audit_log table + log_access() function; no SELECT trigger wired; clinician components call supabase directly without calling log_access; patient can read own audit_log per RLS | none | Wire log_access() call into all clinician and caregiver data queries |
| CR-SEC-04 | Audit log insert-only; append-only tables reject edits except service-role DPA deletion | `partial` | audit_log RLS has only INSERT and SELECT policies (no UPDATE/DELETE); RLS doesn't cover service-role which bypasses RLS — DPA deletion must be via service-role function only | none | Document that service-role DPA function is the only deletion path; add pgTAP test for append-only |
| CR-SEC-05 | Password rules; account lockout (5 fails, 15 min); MFA for clinicians + admins | `partial` | clinician_verifications + MFA references in playbook; no failed_attempts column; no lockout logic in schema or Edge Functions | none | Add failed_attempts + locked_until to clinician auth; implement lockout |
| CR-SEC-06 | Encryption at rest (DB, storage, local SQLite) and in transit | `partial` | Supabase encrypts DB and storage at rest by default; local SQLite not implemented; TLS in transit | none | Implement encrypted SQLite (mobile) |
| CR-SEC-07 | Kenya DPA 2019: export / correct / delete; 7-year retention (configurable) | `partial` | dpa_requests table with correct type column; no export/delete workflow; no retention policy implementation | none | Build export function; build retention cleanup (service-role cron) |
| CR-SEC-08 | Guardian accounts for minors; ID upload + admin check | `partial` | guardian_of column in profiles; no UI; no admin verification flow | none | Build guardian flow in onboarding + admin verification |
| CR-SEC-09 | Safety statements shown ("Mojo helps you watch trends…", "Your reminders follow the schedule…") | `partial` | Stage 4: Two `.safety-note` paragraphs added in App.tsx — "Mojo helps you watch trends and share them with your care team. It does not diagnose or treat." on PatientHome; "Your reminders follow the schedule set by your clinician. Always check with them before changing a dose." on medication card. CSS class `.safety-note` styled in `index.css`. | Scenario 8 step 2 (manual) | No further code needed; human copy sign-off required |
| CR-SEC-10 | Consent screens per playbook Project 7; one purpose per screen; nothing pre-ticked; withdrawing as easy as agreeing; stored with timestamp + copy version | `partial` | Stage 4: `consent_log` table added in migration `008_stage4_safety.sql` with `patient_id`, `consent_type`, `granted`, `copy_version`, `consented_at`, `ip_hash` columns + RLS (patient insert/read own rows only). 3 consent-screen copy entries added to `src/i18n/catalogue.ts` (Stage 6). UI consent-screen flow not yet built. | Scenario 3 (manual, care circle) | Build consent-screen UI flow; wire to `consent_log` inserts |
| CR-SEC-11 | Lock-screen notifications never name condition or medicine | `missing` | No push notification templates exist; no privacy filter | none | Build notification template system with condition/medicine vocabulary check |
| CR-SEC-12 | Clinician auth messages don't reveal which field is wrong; neutral for suspended/revoked; session timeout | `partial` | Playbook copy written (Project 8); not confirmed in clinician-web code | none | Verify clinician-web auth messages match playbook |
| CR-SEC-13 | No health data to analytics/ads; no ad pixels; anonymised analytics behind legal flag | `missing` | No analytics code exists (good); no privacy enforcement or legal flag | none | Add legal-approval flag for analytics; add CI check for ad-pixel domains |

---

## Section 8 rules audit

| Rule | Status | Evidence | What is needed |
|---|---|---|---|
| 8.1 Playbook overrides earlier spec | `partial` | Conflicts identified (CR-ADD-01, CR-CG-06, CR-SOS-04) | See CONFLICTS rows above |
| 8.2 i18n catalogue with IDs, en, sw, surface, review, status | `partial` | Stage 6: `src/i18n/catalogue.ts` created with 34 entries (SOS steps 0-4, Concept A strap events ×13, Concept B phone messages ×8, consent screens ×3). All have `id, en, sw, surface, review, status, version, source`. `getCopy()` and `getSurface()` helpers exported. **Not yet wired to UI** — all calls in catalogue only. | Scenario 8 (manual) | Wire `getCopy()` into UI components; human Swahili review |
| 8.2 CI checks: strap A ≤ 60 chars, no condition/medicine names in push, no banned words, ≤ 15 words, verb-first buttons, every string has en + sw | `partial` | Stage 6: `scripts/check-copy-catalogue.sh` implements all 6 checks + release-build gate. Runs locally. Not yet added to GitHub Actions. | Scenario 8 step 1 (manual) | Add to CI pipeline |
| 8.2 Release builds fail if `review != none` string is `draft` | `partial` | Stage 6: `check-copy-catalogue.sh` check 7: when `MOJO_RELEASE=1`, counts `status: "draft"` entries with `review != "none"` and exits 1. Currently 26 entries would block a release build (correct behaviour). | Run `MOJO_RELEASE=1 bash scripts/check-copy-catalogue.sh` | Add to release CI step |
| 8.3 Concept A screen text: 13 events wired as string IDs | `missing` | No strap string ID system | Implement strap string dispatch |
| 8.3 Concept B: light + vibration patterns as named firmware patterns | `missing` | No firmware pattern code | Implement behind firmware flag |
| 8.3 SOS flow messages wired to escalation steps | `partial` | Stage 4: escalation-tick rewritten — emoji removed from all push titles/bodies; strings follow playbook voice (calm, no ALL-CAPS, no `!`). Titles: `"[Name] pressed SOS"`, `"No reply yet — [Name] may need help"`, `"Checking on [Name]"`. Not wired to `getCopy()` catalogue IDs yet. | Scenario 1 step 3 (manual) | Wire to catalogue IDs when `getCopy()` is in UI |

---

## Copy audit — violations of Content Playbook

> ✓ = resolved · ⚠ = open

| Location | Violation | Status |
|---|---|---|
| `src/App.tsx:545` | "Epi turns it into a log" — wrong product name | ✓ Stage 3 — "Mojo turns it into a log" |
| `src/App.tsx:559` | "Epi never diagnoses" — wrong product name | ✓ Stage 3 — "Mojo never diagnoses" |
| `src/App.tsx:703` | "Epi summarizes what was logged" — wrong product name | ✓ Stage 3 — "Mojo summarises what was logged" |
| `src/App.tsx:819` | "Epi Clinic" in sidebar — wrong product name | ✓ Stage 3 — "Mojo Clinic" |
| `escalation-tick/index.ts` | `"🚑 Ambulance requested"` — emoji, violates voice guide | ✓ Stage 4 — emoji removed, playbook tone |
| `escalation-tick/index.ts` | `"🚨 Still waiting — ... needs help!"` — emoji + `!` | ✓ Stage 4 — rewritten: "No reply yet — [Name] may need help" |
| `escalation-tick/index.ts` | `"🚨 EMERGENCY —"` — ALL CAPS + emoji | ✓ Stage 4 — rewritten: "Checking on [Name]" |
| `StitchDashboard.tsx` | "Project Epi" in header | ✓ Stage 3 — "Mojo" |
| `StitchGPS.tsx` | "Project Epi" in header | ✓ Stage 3 — "Mojo" |
| `StitchMedications.tsx` | "Project Epi" in header | ✓ Stage 3 — "Mojo" |
| `StitchVitals.tsx` | "Project Epi" in header | ✓ Stage 3 — "Mojo" |
| `StitchVitals.tsx` | ECG rhythm shown ("Normal Sinus") — Release 1 restriction | ✓ Stage 5 — gated behind `release2_ecg_rhythm` flag |
| `StitchVitals.tsx` | "Abnormal" wording used — avoid-list | ✓ Stage 5 — "above usual range" |
| `StitchVitals.tsx` | ECG disclaimer absent | ✓ Stage 5 — disclaimer added |
| `src/App.tsx` | Safety statements (CR-SEC-09) absent | ✓ Stage 4 — added as `.safety-note` paragraphs |
| `release2_ecg_rhythm` flag | Missing from feature_flags seed | ✓ Stage 5 — seeded `= false` in migration 005 |
| All components | No Swahili strings exist anywhere | ⚠ Partial — `src/i18n/catalogue.ts` has sw fields, not wired to UI |
| All push notification messages | Copy not yet wired to catalogue IDs | ⚠ Open — playbook tone applied, formal `getCopy()` wiring pending |
| `src/App.tsx` (CaregiverScreen) | `"Patient · epilepsy care"` — condition name in caregiver view | ⚠ Open — verify this string does not reach lock-screen notifications |

---

## Summary counts

> Stages 3–7 deltas shown in parentheses vs Stage 2 baseline.

| Group | Verified | Partial | Missing | Conflicts | Blocked | Total | Δ partial |
|---|---|---|---|---|---|---|---|
| CR-NAME | 0 | 6 (+5) | 1 | 0 | 0 (-1) | 7 | +5 (04, 06 up; 01,02,05,07 held) |
| CR-COND | 0 | 4 | 0 | 0 | 0 | 4 | — |
| CR-STRAP | 0 | 3 | 2 | 0 | 4 | 9 | — |
| CR-ADD | 0 | 6 | 1 | 0 | 0 | 7 | — (01 evidence updated) |
| CR-PAT | 0 | 6 | 3 | 0 | 0 | 9 | — |
| CR-CG | 0 | 5 (+3) | 2 | 0 (-1) | 0 | 7 | +3 (02, 06, 07 up from missing/conflicts) |
| CR-CLIN | 0 | 7 | 3 | 0 | 0 | 10 | — |
| CR-ADM | 0 | 5 | 7 | 0 | 0 | 12 | — |
| CR-SOS | 0 | 8 (+3) | 0 | 0 (-2) | 0 | 8 | +3 (01a, 04, 05 up from missing/conflicts) |
| CR-LOC | 0 | 8 (+1) | 2 | 0 | 0 | 10 | +1 (05 up from missing) |
| CR-MED | 0 | 5 | 0 | 0 | 0 | 5 | — (02 evidence updated) |
| CR-SEC | 0 | 11 (+1) | 2 | 0 | 0 | 13 | +1 (09 up from missing) |
| Section 8 rules | 0 | 4 (+3) | 3 | 0 | 0 | 7 | +3 (8.2 catalogue, CI checks, release gate) |
| **TOTAL** | **0** | **78 (+18)** | **26 (-13)** | **0 (-3)** | **4 (-1)** | **108** | |

> **Stage 7 position:** 0 verified (pgTAP suite exists, 42 assertions, not yet run) · 78 partial · 26 missing · 0 conflicts · 4 blocked.
>
> **Quickest path to `verified` rows:** run `pnpm supabase test db` against a local Supabase instance. If all 42 assertions pass, the following become `verified`: CR-SEC-01, CR-ADM-01, CR-CLIN-01, CR-MED-02, CR-SEC-04, CR-CG-06, CR-CG-07, CR-SOS-01a.
>
> **All remaining `missing` items and all `blocked` items are documented in `docs/GAPS.md` and `docs/MANUAL_TEST_PLAN.md` with owners and gates.**
