# VERIFICATION.md — Mojo / Project Epi
> Stage 1 + 2 audit · 27 Oct 2026 · Baseline: no tests run yet.
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
| pgTAP suite | `supabase/tests/rls_phase1.sql` (28 assertions) exists; not executed at baseline |

### Epi occurrences — user-facing
| File | Line | Text |
|---|---|---|
| src/App.tsx | 545 | `"Say what happened and Epi turns it into a log you can edit."` |
| src/App.tsx | 559 | `"Epi never diagnoses or changes your medication."` |
| src/App.tsx | 703 | `"Epi summarizes what was logged."` |
| src/App.tsx | 819 | `<strong>Epi</strong> Clinic` (sidebar brand) |
| src/components/StitchDashboard.tsx | header | `"Project Epi"` branding + patient `#EP-8492` |
| src/components/StitchGPS.tsx | header | `"Project Epi"` |
| src/components/StitchMedications.tsx | header | `"Project Epi"` |
| src/components/StitchVitals.tsx | header | `"Project Epi"` |

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
| `'epi_strap_a'`, `'epi_strap_b'` | devices.model + firmware_releases.model CHECK constraints (migration 003) | Discuss — renaming DB enum values requires a data migration; recommend rename to `'mojo_strap_a'`/`'mojo_strap_b'` in a new migration, do not rename without approval |
| Mobile bundle ID `com.duara.app` | mobile/app.json | Keep; mobile app is currently branded "Duara", not "Epi" — may need separate rename decision |
| Expo slug `duara` | mobile/app.json | Same as above |
| Expo update URL UUID | mobile/app.json | Keep; OTA update channel identifier |

---

## Stage 2 — Requirement Audit

### CR-NAME — Rename to Mojo

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-NAME-01 | User-facing text says Mojo everywhere | `partial` | All 14 user-facing "Epi"/"Project Epi" occurrences replaced in src/App.tsx + 4 Stitch components (Stage 3). Push notification copy in escalation-tick still uses raw strings with emoji — fix in Stage 4. | none | Fix escalation-tick notification strings |
| CR-NAME-02 | Strap called "Mojo Strap" | `partial` | "Epi Strap A", "Epi Strap Pro X", "Epi Hardware Band Alpha", "Epi Strap Stream" all renamed to "Mojo Strap" (Stage 3). BLE advertised name not changeable without hardware. | none | BLE advertised name (hardware, Stage 7 manual test) |
| CR-NAME-03 | Logo placeholder: "Mojo" wordmark + pulse glyph; app icon teal rounded square | `missing` | No Mojo logo/icon found; `public/favicon.svg` is generic | none | Create placeholder SVG assets per spec tokens |
| CR-NAME-04 | Both languages: "Mojo" in Swahili strings too | `missing` | Zero i18n infrastructure exists | none | Blocked on i18n catalogue (Stage 6) |
| CR-NAME-05 | Internal code renamed epi→mojo (packages, env vars, tokens) | `partial` | clinician-web/package.json renamed to `mojo-clinician-web` (Stage 3). Demo auth email `amina@patient.epi` kept (stop list — requires Supabase Auth change). No CSS epi-* token names existed. | none | Coordinate demo email rename with Supabase Auth console |
| CR-NAME-06 | Do not change identifiers on stop list | `blocked` | Stop-list decisions documented in docs/RENAME.md. Device model enum rename awaits approval. | none | Get approval for `epi_strap_a/b` → `mojo_strap_a/b` rename |
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
| CR-ADD-01 | ECG 30 s Lead-I; Release 1: trace only to clinician, no rhythm to patient; Release 2 behind `release2_ecg_rhythm` | `partial` | ecg_recordings schema correct; device_classification stored; `feature_flags` table exists but **`release2_ecg_rhythm` is NOT seeded in migration 005**; ECG UI in StitchVitals shows recording but rhythm result shown | none | Add `release2_ecg_rhythm = false` to feature_flags seed; hide device_classification from patient UI behind flag |
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
| CR-CG-02 | Full-screen emergency alert with name/time/location map, "I've reached them"/"I can't reach them"/Call/Ambulance/Directions/Hospital | `missing` | No emergency alert screen for caregiver built | none | Build full-screen alert |
| CR-CG-03 | Missed-dose alerts: "Remind them" / "Mark taken (I gave it)" | `missing` | Not built | none | Build missed-dose caregiver alert |
| CR-CG-04 | Add observations; help with follow-ups | `partial` | CaregiverScreen has "Record an observation" button; no actual form; observations schema exists | none | Build observation form |
| CR-CG-05 | SMS-only contacts get digit-reply alerts ("Reply 1 = yes, 2 = no") | `missing` | sos_responses table exists; no SMS gateway integration; no digit-reply parsing | none | Build SMS gateway adapter (Africa's Talking / Twilio) |
| CR-CG-06 | "I can't reach them" / reply 2 does NOT stop escalation; only "I've reached them" / 1 or patient "I'm OK" stops it | `conflicts` | escalation-tick (`supabase/functions/escalation-tick/index.ts:61-65`) stops escalation if ANY sos_response row exists, regardless of response type; sos_responses table has no `response_type` column to distinguish reached vs not-reached | `CR-CG-06 does not stop`: none | Add `response_type TEXT CHECK(response_type IN ('reached','not_reached','ok'))` to sos_responses; fix escalation-tick to only stop on `reached` or `ok` |
| CR-CG-07 | Contacts must accept by SMS (YES/NO) before active; pending/declined get no alerts | `missing` | care_circle table has no `accepted_at` / `status` column | none | Add contact acceptance status; implement YES/NO SMS flow |

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
| CR-SOS-01a | Fall check before alert: strap shows "Are you OK?" 30 s window; "I'm OK" ends it | `missing` | Not built; no fall_check state in alert state machine | none | Add fall_check step to alert state machine; build UI |
| CR-SOS-02 | T+0 notify contacts; T+2 reminder; T+4 call paramedics; contacts and clinician told with dispatch ref | `partial` | escalation-tick implements T+0/T+2/T+4 correctly for medical pathway; T+0 step pushes to all emergency contacts; SOS UI has 5 s countdown (not 10 s cancel window per CR-STRAP-06) | none | Fix SOS countdown to 10 s; verify push notification delivery; add dispatch reference to T+4 message |
| CR-SOS-03 | Offline SOS: push+realtime online; SMS when no internet; queue when no signal; escalation clock from original time | `partial` | SosScreen UI mentions SMS fallback; no actual SMS send; no queue; no retry; no offline clock management | none | Implement SMS gateway; offline queue; sync original timestamp |
| CR-SOS-04 | Patient or any emergency contact stops escalation; cancel before dispatch; false alarm after; false alarms shown to clinician, not penalised | `conflicts` | escalation-tick stops on ANY sos_response (no `response_type` check); sos_responses has no `response_type` column; conflicts with CR-CG-06 requirement that "I can't reach them" does NOT stop escalation | none | See CR-CG-06 fix |
| CR-SOS-05 | Warning-level alerts: clinician + granted caregivers only; no dispatch | `missing` | alerts.severity and .pathway in schema; no routing logic to skip dispatch for warning/mental_health (escalation-tick only handles `medical` vs `mental_health` pathway, not severity) | none | Add severity check: skip dispatch for warning alerts |
| CR-SOS-06 | Dispatch payload: location first, then name/time/trigger/callback/nearest hospital; medical details only if consented | `partial` | dispatchParamedics in escalation-tick inserts paramedic_dispatches but only stores provider_id; no payload construction; no medical details consent check | none | Build payload construction using saved_places + location_shares + patient consent fields |
| CR-SOS-07 | Automated call script follows playbook (location, name, time, consented details, callback); repeats once | `partial` | Dispatch action logged; no TTS call script implementation; no playbook copy wired | none | Build TTS script adapter with playbook copy |

### CR-LOC — Location, Contacts, Hospitals, Ambulance

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-LOC-01 | GPS only during SOS/alert (not continuously); live link with expiry | `partial` | patient_locations table with alert_id FK; EmergencyMap component tracks location without checking if alert is active; location_shares table exists | none | Restrict GPS to active alert only; wire location_shares expiry |
| CR-LOC-02 | Saved home address and landmarks added to SOS messages | `partial` | saved_places table (home, work, other); no UI to add them; not used in dispatch payload | none | Build saved-places UI; add to dispatch payload |
| CR-LOC-03 | Phone contacts: picker only, save name+number, never upload address book | `missing` | Not built | none | Implement contacts picker with number-only storage, E.164 normalisation |
| CR-LOC-04 | Hospitals from KMHFL with capabilities (24h, ambulance, maternity, ICU, dialysis, cardiac, stroke) | `partial` | health_facilities schema has all capability columns; 0 real data imported; StitchGPS shows 4 hardcoded Nairobi hospitals | none | KMHFL import; admin import tooling |
| CR-LOC-05 | Cache facilities within 50 km; offline haversine distance | `missing` | GiST index on health_facilities.location; no client cache or haversine | none | Build 50 km cache + haversine distance calculation |
| CR-LOC-06 | Ranking: open/24h → condition match → travel time (online)/distance (offline); clinician preferred first | `partial` | Ranking logic not in any component; StitchGPS has static ranked list | none | Build ranking function |
| CR-LOC-07 | Hospital card: name, level, distance, travel time, open now, capabilities, tap to call, Directions deep link; in-app route + compass offline | `partial` | StitchGPS shows hospital list with distance and ER status; no tap-to-call; no Directions deep link | none | Add call + directions actions |
| CR-LOC-08 | Caregivers get directions to patient then to hospital | `missing` | Not built | none | Build in caregiver emergency alert screen |
| CR-LOC-09 | "Call ambulance" button dials region number from emergency_providers; works offline | `partial` | emergency_providers seeded with 999 and 112; no button in UI | none | Build button that reads from emergency_providers; add to patient and caregiver screens |
| CR-LOC-10 | Optional SMS to hospital emergency desk (flagged, opted-in only) | `partial` | facility_notifications table; `hospital_arrival_sms = false` flag seeded | none | Build send logic behind flag |

### CR-MED — Medication and Mental Health

| ID | Requirement (short) | Status | Evidence | Test | What is needed |
|---|---|---|---|---|---|
| CR-MED-01 | Reminder on strap + phone; repeat up to max repeats; mark missed; notify caregiver/clinician; never dispatch | `partial` | medication_schedules has snooze_interval_min, max_repeats, missed_after_min, escalate_to; no reminder engine or notification dispatcher | none | Build reminder engine (Edge Function or cron); push notification on missed dose |
| CR-MED-02 | Dose logged only once (strap, app, or caregiver) | `partial` | UNIQUE(schedule_id, scheduled_for) in dose_events enforces DB-level dedup; UI "Taken" button calls the old medication_logs insert (which no longer exists — it's now a VIEW); caregiver "Mark taken" not built | `CR-MED-02: duplicate raises unique_violation` (pgTAP, unrun) | Fix client to insert into dose_events not medication_logs; run pgTAP |
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
| CR-SEC-09 | Safety statements shown ("Mojo helps you watch trends…", "Your reminders follow the schedule…") | `missing` | Neither statement appears in any component | none | Add to relevant screens |
| CR-SEC-10 | Consent screens per playbook Project 7; one purpose per screen; nothing pre-ticked; withdrawing as easy as agreeing; stored with timestamp + copy version | `partial` | No consent screens built; no consent storage table beyond grants | none | Build consent screen flow (7 screens from playbook); add consent_log table |
| CR-SEC-11 | Lock-screen notifications never name condition or medicine | `missing` | No push notification templates exist; no privacy filter | none | Build notification template system with condition/medicine vocabulary check |
| CR-SEC-12 | Clinician auth messages don't reveal which field is wrong; neutral for suspended/revoked; session timeout | `partial` | Playbook copy written (Project 8); not confirmed in clinician-web code | none | Verify clinician-web auth messages match playbook |
| CR-SEC-13 | No health data to analytics/ads; no ad pixels; anonymised analytics behind legal flag | `missing` | No analytics code exists (good); no privacy enforcement or legal flag | none | Add legal-approval flag for analytics; add CI check for ad-pixel domains |

---

## Section 8 rules audit

| Rule | Status | Evidence | What is needed |
|---|---|---|---|
| 8.1 Playbook overrides earlier spec | `partial` | Conflicts identified (CR-ADD-01, CR-CG-06, CR-SOS-04) | See CONFLICTS rows above |
| 8.2 i18n catalogue with IDs, en, sw, surface, review, status | `missing` | Zero i18n infrastructure; no `packages/shared/i18n` directory | Build i18n catalogue; load all playbook strings |
| 8.2 CI checks: strap A ≤ 60 chars, no condition/medicine names in push, no banned words, ≤ 15 words, verb-first buttons, every string has en + sw | `missing` | No CI exists | Add CI checks |
| 8.2 Release builds fail if `review != none` string is `draft` | `missing` | No build-time check | Add build check |
| 8.3 Concept A screen text: 13 events wired as string IDs | `missing` | No strap string ID system | Implement strap string dispatch |
| 8.3 Concept B: light + vibration patterns as named firmware patterns | `missing` | No firmware pattern code | Implement behind firmware flag |
| 8.3 SOS flow messages wired to escalation steps | `partial` | escalation-tick sends push with raw strings, not playbook copy IDs; strings include emoji (🚑, 🚨) which violates "no exclamation marks, no alarm styling" | Remove emoji from push titles; wire playbook copy IDs |

---

## Copy audit — violations of Content Playbook

| Location | Violation | Fix |
|---|---|---|
| `src/App.tsx:545` | "Epi turns it into a log" — wrong product name | "Mojo turns it into a log" |
| `src/App.tsx:559` | "Epi never diagnoses" — wrong product name | "Mojo never diagnoses" |
| `src/App.tsx:703` | "Epi summarizes what was logged" — wrong product name | "Mojo summarises what was logged" |
| `src/App.tsx:819` | "Epi Clinic" in sidebar — wrong product name | "Mojo Clinic" |
| `escalation-tick/index.ts:151` | `"🚑 Ambulance requested"` — emoji = alarm styling; exclamation mark violates voice guide | Remove emoji; use playbook copy |
| `escalation-tick/index.ts:152` | `"🚨 Still waiting — ... needs help!"` — emoji + exclamation | Remove; use playbook copy |
| `escalation-tick/index.ts:153` | `"🚨 EMERGENCY —"` — ALL CAPS + emoji, violates voice guide | Remove; use playbook copy |
| `StitchDashboard.tsx` | "Project Epi" in header | "Mojo" |
| `StitchGPS.tsx` | "Project Epi" in header | "Mojo" |
| `StitchMedications.tsx` | "Project Epi" in header | "Mojo" |
| `StitchVitals.tsx` | "Project Epi" in header | "Mojo" |
| All components | No Swahili strings exist anywhere | Build i18n catalogue |
| All push notification messages | Copy not from playbook; uses emoji and "EMERGENCY" | Wire to i18n catalogue |
| `src/App.tsx:591` (CaregiverScreen) | `"Patient · epilepsy care"` — shows condition name in caregiver view (not lock-screen, but should verify this isn't exposed on lock screen) | Verify this does not appear in notifications |
| `src/App.tsx` | Safety statements (CR-SEC-09) absent | Add to Home and Meds screens |
| `release2_ecg_rhythm` flag | Missing from feature_flags seed | Add to migration 005 |

---

## Summary counts

| Group | Verified | Partial | Missing | Conflicts | Blocked | Total |
|---|---|---|---|---|---|---|
| CR-NAME | 0 | 1 | 5 | 0 | 1 | 7 |
| CR-COND | 0 | 4 | 0 | 0 | 0 | 4 |
| CR-STRAP | 0 | 3 | 2 | 0 | 4 | 9 |
| CR-ADD | 0 | 6 | 1 | 0 | 0 | 7 |
| CR-PAT | 0 | 7 | 2 | 0 | 0 | 9 |
| CR-CG | 0 | 2 | 4 | 1 | 0 | 7 |
| CR-CLIN | 0 | 7 | 3 | 0 | 0 | 10 |
| CR-ADM | 0 | 5 | 7 | 0 | 0 | 12 |
| CR-SOS | 0 | 4 | 2 | 2 | 0 | 8 |
| CR-LOC | 0 | 5 | 4 | 0 | 0 | 10 (incl. 01+01a) |
| CR-MED | 0 | 5 | 0 | 0 | 0 | 5 |
| CR-SEC | 0 | 10 | 3 | 0 | 0 | 13 |
| Section 8 rules | 0 | 1 | 6 | 0 | 0 | 7 |
| **TOTAL** | **0** | **60** | **39** | **3** | **5** | **107** |

> Note: 0 verified because no test suite has been run. The pgTAP file exists with 28 assertions covering CR-SEC-01, CR-ADM-01, CR-CLIN-01, CR-MED-02, CR-SEC-04 — these are the first items to move to `verified` once `supabase test db` passes.
