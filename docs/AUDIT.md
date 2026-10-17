# PROJECT EPI — Codebase Audit (v2)

> Updated: 2026-10-17. Every requirement from the Master Prompt (section 4) is listed.
> **Status key:**
> - `done` — code present **and** a named test passes (e.g. `CR-SOS-03 queues SOS with no signal`)
> - `partial` — code or schema exists; test missing, UI incomplete, or integration gap
> - `missing` — not started
> - `conflicts` — contradicts spec or another decision

---

## Actual Stack

| Layer | What exists | Notes |
|---|---|---|
| Preview canvas | React + Vite (root `src/`) | Figma Make prototype — not a deployable app |
| Mobile | Expo ~51 + Expo Router ~3.5 (`mobile/`) | Patient + caregiver |
| Clinician web | Next.js 14 App Router (`clinician-web/`) | Clinician + admin |
| Database | Supabase Postgres + RLS (`supabase/migrations/`) | 4 migrations applied |
| BLE | **Not installed** — `react-native-ble-plx` absent | No strap or add-on BLE |
| Firmware | **None** | Hardware layer not started |
| Offline store | SQLite (`mobile/db/schema.ts`) — plain, no SQLCipher | Outbox pattern in `sync.ts` |
| Location | expo-location ~17.0.1 installed; used in `sos.tsx` | No background location loop (feature-flagged off) |
| Contacts | **expo-contacts not installed** | Manual entry in circle-invite; picker not implemented |
| Notifications | expo-notifications ~0.28.19 installed; `notifications.ts` fully implemented | Push token registered on login; local reminders scheduled after sync |
| SMS | expo-sms ~12.0.1 installed; wired in `sos.tsx` offline path | Africa's Talking / Twilio not integrated for server-side SMS |
| Maps | **react-native-maps not installed** | No in-app map; Google Maps `tel:`/`geo:` deep links planned |
| Edge Functions | `escalation-tick` implemented (Phase 2) | T0→T+2→T+4 state machine, sandbox dispatch |
| Tests | pgTAP suite added (Phase 1) — 28 assertions | No Vitest, Playwright, or Maestro yet |
| CI | `.github/workflows/ci.yml` added (Phase 1) | TypeScript check, pgTAP, service-key grep |

### Folder layout

```
project EPI/
├── src/                        # Figma Make preview (React/Vite, single App.tsx)
├── mobile/
│   ├── app/(auth)/             # login.tsx, signup.tsx
│   ├── app/(tabs)/             # index(Today), health, meds, circle, records, me
│   ├── app/sos.tsx             # SOS countdown screen
│   ├── app/sos-alert.tsx       # Caregiver emergency alert screen
│   ├── app/circle-invite.tsx   # Invite care-circle member
│   ├── app/insights.tsx        # AI insights screen
│   ├── db/schema.ts            # TypeScript types + SQLite DDL
│   ├── db/offline.ts           # Read/write helpers
│   ├── db/sync.ts              # Outbox push + pull sync
│   └── lib/                    # supabase.ts, theme.ts, notifications.ts, mock-data.ts
├── clinician-web/
│   ├── app/login/              # Email + password login
│   ├── app/signup/             # Clinician sign-up with licence number
│   ├── app/mfa-setup/          # TOTP setup
│   ├── app/mfa-verify/         # TOTP verification gate
│   ├── app/verification-pending/ # Pending admin approval
│   ├── app/forgot-password/    # Password reset
│   ├── app/dashboard/          # patient list, [id] overview, follow-ups, activity
│   ├── app/dashboard/patients/[id]/alert-rules/  # CR-CLIN-05 rule editor
│   ├── app/dashboard/patients/[id]/schedules/    # CR-CLIN-06 schedule editor
│   ├── app/dashboard/patients/[id]/adherence/    # CR-CLIN-07 + CSV export
│   ├── app/admin/              # overview, clinicians, activity, settings
│   └── lib/                    # supabase, audit, password, supabase-admin
├── supabase/
│   └── migrations/             # 001 init, 002 patch, 003 phase1 (~40 tables + RLS), 004 sos_responses
├── ui/                         # SVG assets
└── docs/                       # AUDIT.md, DECISIONS.md, GAPS.md
```

### Database tables (post migration 003)

All ~40 spec-required tables are present. Key additions in 003:
`organisations`, `org_members`, `clinician_verifications`, `break_glass_requests`,
`devices`, `approved_addon_models`, `addon_devices`,
`vital_samples` (partitioned), `vital_rollups`, `ecg_recordings`, `addon_readings`, `motion_events`,
`medication_schedules`, `dose_events`, `refill_alerts`,
`condition_templates` (19 seeded), `symptom_logs`, `mood_checkins`,
`appointments`, `records`, `clinician_notes`,
`alert_rules`, `alerts`, `alert_escalations`,
`emergency_providers` (Kenya 999/112 seeded, sandbox),
`paramedic_dispatches`, `crisis_resources` (Befrienders Kenya seeded),
`patient_locations`, `saved_places`, `location_shares`,
`health_facilities`, `preferred_facilities`, `facility_notifications`,
`notifications`, `dpa_requests`, `feature_flags`, `firmware_releases`

Helper functions: `is_verified_clinician`, `has_grant`, `is_emergency_contact`, `log_access`, `has_break_glass`

---

## ★ Requirement Status Table

### Conditions — `CR-COND`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-COND-01 | partial | `supabase/migrations/003_phase1_foundation.sql` | `condition_templates` table exists with 19 seeded conditions; no admin UI to edit templates; no test |
| CR-COND-02 | partial | migration 003 seed | 11 Group A conditions seeded; no strap metrics wired to mobile UI |
| CR-COND-03 | partial | migration 003 seed | 5 Group B conditions seeded; `addon_devices` table exists; no BLE integration |
| CR-COND-04 | partial | migration 003 seed | 4 Group C conditions seeded; `mood_checkins` table exists; no mobile mood UI |

### Strap — `CR-STRAP`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-STRAP-01 | missing | — | No BLE stack (`react-native-ble-plx` not installed); no firmware |
| CR-STRAP-02 | missing | — | `vital_samples` table exists; no data source (no BLE, no strap) |
| CR-STRAP-03 | missing | — | `motion_events` table exists; no fall/seizure detection firmware |
| CR-STRAP-04 | missing | — | Schema supports 72 h buffer; no device to buffer |
| CR-STRAP-05 | missing | — | `medication_schedules` table exists; no strap sync or firmware reminder |
| CR-STRAP-06 | missing | — | SOS button UI exists; no 3-s hold, no strap vibration, no BLE SOS command |
| CR-STRAP-07 | missing | — | `devices.battery_pct` column exists; no BLE to populate it |
| CR-STRAP-08 | missing | — | `firmware_releases` table exists; no BLE OTA implementation |
| CR-STRAP-09 | missing | — | `vital_samples.quality` column exists; no device to generate quality scores |

### Add-on devices — `CR-ADD`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-ADD-01 | partial | `ecg_recordings` table, migration 003 RLS | Table + RLS exist; no ECG GATT profile; no 30-s recording UI; no strip viewer (CR-CLIN-04) |
| CR-ADD-02 | partial | `addon_devices` (kind=bp_cuff), `addon_readings` | Table exists; no BLE BP cuff profile; no pairing UI |
| CR-ADD-03 | partial | `addon_devices` (kind=glucometer/cgm), `addon_readings` | Table exists; no BLE or CGM integration |
| CR-ADD-04 | partial | `addon_devices` (kind=scale), `addon_readings` | Table exists; no BLE scale profile |
| CR-ADD-05 | partial | `addon_readings.measured_at` on same timeline | Schema correct; no readings yet because no BLE |
| CR-ADD-06 | partial | `approved_addon_models` table + admin RLS policy | Table + admin RLS exist; no admin UI to manage list |
| CR-ADD-07 | partial | `feature_flags` table (`health_kit_bridge` flag) | Flag row not yet seeded; no HealthKit/Health Connect integration code |

### Patient app — `CR-PAT`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-PAT-01 | partial | `mobile/app/(tabs)/` — Today, health, meds, circle, records, me | SOS button missing from non-home tabs; Today tab not named "Today" in nav |
| CR-PAT-02 | partial | `app/(auth)/login.tsx`, `app/(auth)/signup.tsx` | No EN/SW toggle; no consent explainer screen; no guardian flow; no strap-pairing step; no add-on step |
| CR-PAT-03 | partial | `mobile/app/(tabs)/index.tsx` | Next dose shown; no live HR/SpO2/temp with last-synced; no open alerts section; no battery/worn status; no nearest hospital |
| CR-PAT-04 | partial | `mobile/app/(tabs)/health.tsx` | Screen exists; no day/week/month charts; no limit lines; no add-on readings panel; no ECG record/list UI |
| CR-PAT-05 | partial | `mobile/app/(tabs)/meds.tsx` | Medication list shown; no offline "Taken" button wired to `dose_events`; no adherence %; no snooze; no refill reminder |
| CR-PAT-06 | partial | `mobile/app/(tabs)/circle.tsx`, `circle-invite.tsx` | Care Circle + invite exist; no per-person per-category permission UI; no linked-clinician display; no appointments or clinician notes |
| CR-PAT-07 | partial | `mobile/app/(tabs)/records.tsx`, `insights.tsx` | Records upload/list + insights exist; no `symptom_logs` UI; no `mood_checkins` UI (off by default) |
| CR-PAT-08 | partial | `mobile/app/(tabs)/me.tsx` | Profile screen exists; no export/delete data flow; no location settings; no saved home address; no "who viewed my data" list; no language toggle; no biometric lock |
| CR-PAT-09 | partial | `mobile/db/offline.ts`, `mobile/db/sync.ts` | Outbox pattern works; no SQLCipher; key not in secure storage; offline SOS "Not sent yet" missing |

### Caregiver — `CR-CG`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-CG-01 | partial | `mobile/app/(tabs)/circle.tsx` | Caregiver can see circle; no patient-switcher UI for multi-patient caregiver |
| CR-CG-02 | partial | `mobile/app/sos-alert.tsx` | Alert screen exists; no live location map; no full-screen lock UI; missing "Directions to patient / Nearest hospital" buttons |
| CR-CG-03 | partial | `mobile/app/(tabs)/meds.tsx` | Medication list shown; no "Remind them" or "Mark taken (I gave it)" caregiver actions |
| CR-CG-04 | partial | `observations` table, `mobile/app/(tabs)/circle.tsx` | Observation table + policy exist; no "Add observation" form in caregiver UI |
| CR-CG-05 | partial | `care_circle.sms_only` column | Column exists; no SMS reply code (`SAFE <code>`) handling in Edge Function or app |

### Clinician dashboard — `CR-CLIN`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-CLIN-01 | partial | `clinician-web/app/signup/`, `mfa-setup/`, `mfa-verify/`, `verification-pending/` | Sign-up with licence number exists; MFA screens exist; verification-pending page exists; no test that unverified clinician sees nothing; no licence-expiry reminder |
| CR-CLIN-02 | partial | `clinician-web/app/dashboard/patients/page.tsx` (Phase 3) | Urgency sort implemented: critical alert → warning alert → events this week → follow-up → stable; red dot on avatar for score ≥3; "N need attention" counter; no adherence % or unworn-strap tiers yet (no BLE) |
| CR-CLIN-03 | partial | `clinician-web/app/dashboard/patients/[id]/page.tsx` | Patient overview; granted categories not greyed when not granted; no vital charts with limit lines; no motion events; no mood/sleep section |
| CR-CLIN-04 | missing | `ecg_recordings` table exists | No ECG strip viewer (25 mm/s grid, zoom, gain); no "mark reviewed with note" UI |
| CR-CLIN-05 | partial | `app/dashboard/patients/[id]/alert-rules/` | RuleEditor component exists; no "would have fired N times in 7 days" preview; no test |
| CR-CLIN-06 | partial | `app/dashboard/patients/[id]/schedules/` | ScheduleEditor component exists; no strap-sync confirmation; no versioning display; no test |
| CR-CLIN-07 | partial | `app/dashboard/patients/[id]/adherence/`, `ExportCsvButton.tsx` | Adherence page + CSV export exist; no PDF export; no test |
| CR-CLIN-08 | partial | `clinician-web/app/api/sos/route.ts` | SOS API sends Resend email; no real-time alert inbox; no acknowledge/close with reason UI |
| CR-CLIN-09 | partial | `preferred_facilities` table, migration 003 RLS | Table + RLS exist; no UI for clinician to set preferred hospital; no location trail during alert |
| CR-CLIN-10 | partial | `clinician-web/app/dashboard/activity/page.tsx` | Audit log page exists; no per-patient view of clinician's own access history visible to patient |

### Admin portal — `CR-ADM`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-ADM-01 | partial | `clinician-web/app/admin/`, `lib/supabase-admin.ts` | Admin section exists; MFA enforcement in place; no IP allowlist; every action NOT yet fully audited |
| CR-ADM-02 | partial | `clinician-web/app/admin/(protected)/page.tsx` | Admin overview page exists; no system-health metrics; no "Dispatch not live" banner |
| CR-ADM-03 | partial | `clinician-web/app/admin/(protected)/clinicians/page.tsx` + `/api/admin/verifications` (Phase 3) | Verification queue tab: pending badge count, approve/reject with notes modal, evidence link; `verified` field now reads `clinician_verifications` table; no KMPDC register-API lookup |
| CR-ADM-04 | partial | `organisations`, `org_members` tables | Tables + RLS exist; no admin UI to manage orgs or clinic manager role |
| CR-ADM-05 | partial | `approved_addon_models`, `firmware_releases` tables | Tables exist; no admin UI; no firmware upload/staged-rollout UI |
| CR-ADM-06 | partial | `emergency_providers` table (Kenya 999/112 seeded, sandbox) | Table seeded; no admin UI for routing; no test-call button; no sandbox/live switch UI |
| CR-ADM-07 | partial | `health_facilities` table + PostGIS index | Table exists; no KMHFL import tool; no admin facility-management UI |
| CR-ADM-08 | partial | `crisis_resources` table (Befrienders Kenya seeded) | Table seeded; no admin UI to manage per country/language |
| CR-ADM-09 | missing | `condition_templates` table exists, admin RLS policy | No admin UI to create/edit condition templates |
| CR-ADM-10 | partial | `paramedic_dispatches`, `audit_log` tables | Tables exist; no incidents dashboard; no break-glass admin UI |
| CR-ADM-11 | partial | `dpa_requests` table | Table exists; no admin UI to process export/delete/correct requests |
| CR-ADM-12 | partial | `audit_log`, `feature_flags` tables | Tables exist; no audit-log viewer UI; no feature-flag toggle UI; no notification-template editor |

### Emergency and escalation — `CR-SOS`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-SOS-01 | partial | `mobile/app/sos.tsx`, `alerts` table | SOS button trigger exists; no fall/seizure detection; no critical-limit trigger; `alert.source` = 'sos_button' only |
| CR-SOS-02 | partial | `supabase/functions/escalation-tick/index.ts` (Phase 2) | T0→T+2→T+4 state machine implemented; sandbox dispatch inserted; no Africa's Talking/Twilio for real SMS/voice |
| CR-SOS-03 | partial | `mobile/db/schema.ts` `sos_queue` table, outbox | Queue table exists in SQLite; no SMS composition (`expo-sms` not installed); no "Not sent yet — retrying" user-facing message; escalation clock not checked from original time |
| CR-SOS-04 | partial | `mobile/app/sos-alert.tsx` | Caregiver alert screen exists; no response → stop escalation wired end-to-end; SMS reply code (`SAFE <code>`) not handled |
| CR-SOS-05 | partial | `alert_rules` table + `alerts.pathway = 'mental_health'` | Schema separates medical vs mental_health pathway; no Edge Function that routes mental-health differently; no crisis_resources display in app |
| CR-SOS-06 | partial | `emergency_providers` table, `paramedic_dispatches` | Tables exist in sandbox; no adapter code (TTS call, API, call-centre); no fallback-to-next-provider logic |

### Location, contacts, hospitals, ambulance — `CR-LOC`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-LOC-01 | partial | `mobile/app/sos.tsx`, `patient_locations` table | `expo-location` installed + used; `sendSos` writes location to `patient_locations` on SOS; no 15-s background loop (feature-flagged off) |
| CR-LOC-02 | missing | `saved_places` table | Table exists; no UI to add home address/landmarks; not included in SOS payload |
| CR-LOC-03 | missing | `care_circle.phone`, `care_circle.sms_only` | `expo-contacts` not installed; no contacts picker; manual entry not wired |
| CR-LOC-04 | missing | `health_facilities` table + PostGIS | Table exists; zero facility rows (no KMHFL import); no fallback to Google Places |
| CR-LOC-05 | missing | — | No facility caching within 50 km; no haversine offline distance |
| CR-LOC-06 | missing | — | No facility ranking logic |
| CR-LOC-07 | missing | — | No hospital card UI; no tap-to-call; no Directions deep link |
| CR-LOC-08 | missing | — | No caregiver directions screen |
| CR-LOC-09 | missing | `emergency_providers` (999/112 seeded) | Numbers in DB; no "Call ambulance" button in mobile app; no `tel:` deep link; no offline location SMS to contacts |
| CR-LOC-10 | missing | `facility_notifications`, `feature_flags` | Tables exist; feature flag not seeded; no SMS-to-facility logic |

### Medication and mental health — `CR-MED`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-MED-01 | partial | `medication_schedules` table, `mobile/app/(tabs)/meds.tsx` | Schedule table + RLS exist; no local notification scheduled; no strap reminder sync; no repeat/snooze/missed flow |
| CR-MED-02 | partial | `dose_events` table with UNIQUE (schedule_id, scheduled_for) | Unique constraint exists; mobile "Taken" button not yet wired to `dose_events` (still writes to old path); caregiver "Mark taken" not implemented |
| CR-MED-03 | partial | `refill_alerts` table | Table exists; no threshold check job; no refill notification |
| CR-MED-04 | partial | `mobile/app/(tabs)/health.tsx` MoodCheckin (Phase 2) | 5-point emoji scale added; writes to `mood_checkins`; private by default (disclaimer shown); no "never dispatches ambulance" gate tested; crisis_resources not displayed |
| CR-MED-05 | partial | `grants.category = 'mood'` (off by default in schema) | Category exists; no UI to grant mood access; mood defaults to off |

### Privacy and security — `CR-SEC`

| ID | Status | Where | Missing |
|---|---|---|---|
| CR-SEC-01 | partial | `grants` table with 13 categories, migration 003 RLS | Full category list enforced in DB; no test confirming caregiver without grant sees zero rows |
| CR-SEC-02 | partial | `mobile/db/schema.ts` | Revoke updates `revoked_at`; no mobile code clears local cache on next sync |
| CR-SEC-03 | partial | `clinician-web/lib/audit.ts`, `audit_log` trigger | `log_access` function exists; not called on all views; no test |
| CR-SEC-04 | partial | `audit_log` table; append-only by RLS (INSERT only) | Only `INSERT` policy exists; no reject-edits trigger for service-role DPA deletion path |
| CR-SEC-05 | partial | `clinician-web/lib/password.ts`, MFA pages | Password rules + MFA screens exist; no lockout-after-5-attempts in DB or middleware; no test |
| CR-SEC-06 | partial | Supabase TLS ✅; SQLite plain ❌ | `expo-secure-store` key not used; SQLCipher not configured; no biometric/PIN lock |
| CR-SEC-07 | missing | — | No legal review; Kenya DPA compliance audit not started; ODPC registration not started |
| CR-SEC-08 | missing | — | Guardian account: `profiles.guardian_of` column exists; no UI flow; no admin ID-upload check |
| CR-SEC-09 | partial | `mobile/app/(tabs)/index.tsx` | Safety statement on Today tab only; not on Vitals, ECG, Meds, Insights screens |

---

## Summary counts

| Status | Count |
|---|---|
| done | **0** (no tests in codebase) |
| partial | **57** |
| missing | **29** |
| conflicts | **0** (C-1, C-2, C-4 resolved in DECISIONS.md; C-3 service key is git-ignored) |
| **Total** | **86** |

---

## Resolved conflicts (for reference)

| # | Conflict | Resolution |
|---|---|---|
| C-1 | Brand name: "Duara" vs "Epi" | **Duara** in all user-facing strings; "Project Epi" in repo/docs only (D-1) |
| C-2 | Colour palette: existing vs spec tokens | **Keep existing palette**; add missing spec tokens as CSS variables (D-2) |
| C-3 | Service role key in `.env.local` | `.env.local` is git-ignored; key must be in Vercel/hosting secrets only (D-3) |
| C-4 | `medication_logs` vs `dose_events` | Migration 003: `dose_events` table created; `medication_logs` VIEW alias kept (D-4) |

---

## Top risks

1. **Zero tests** — Phase 0 gate requires CI + test infrastructure before any feature is considered done. Every "partial" item cannot become "done" until a named test passes.
2. **No escalation Edge Function** — The entire CR-SOS chain (T0→T+2→T+4, dispatch adapters, SMS, response stops escalation) depends on an `escalation-tick` Supabase Edge Function that does not yet exist.
3. **No location stack** — `expo-location`, `expo-contacts`, `react-native-maps`, and `expo-sms` are all uninstalled. CR-LOC (10 items) is entirely missing and CR-SOS-03 (offline SMS) also depends on it.
4. **No BLE** — All CR-STRAP (9 items) and CR-ADD physical integration (7 items) depend on `react-native-ble-plx` which is not installed.
5. **No offline encryption** — SQLCipher not configured; patient data on-device is unencrypted; this is a security gap that must close before launch.
6. **Clinician verification gate untested** — MFA pages exist but there is no test confirming an unverified clinician sees zero patient rows (Phase 1 gate criterion).

---

## Phase 1 plan (pending your approval)

Phase 1 gate: *Caregiver without grant sees zero rows everywhere; admin sees zero clinical rows; unverified clinician sees nothing.*

### Step 1 — CI and test infrastructure (Phase 0 gate prerequisite)

- Add `supabase/tests/rls_phase1.sql` (pgTAP) with named test functions for every RLS policy critical path:
  - `CR-SEC-01 caregiver without grant sees zero rows on conditions`
  - `CR-SEC-01 admin sees zero rows on vital_samples`
  - `CR-CLIN-01 unverified clinician sees zero rows on conditions`
  - `CR-SEC-04 audit_log rejects UPDATE`
  - `CR-MED-02 dose_events rejects duplicate (schedule_id, scheduled_for)`
- Add GitHub Actions workflow (`.github/workflows/ci.yml`):
  - `pnpm typecheck` (web) · `npx tsc --noEmit` (mobile)
  - `supabase db test` (pgTAP)
  - `grep` CI check: fail if `SUPABASE_SERVICE_ROLE_KEY` appears in any file under `mobile/` or `src/`

### Step 2 — Missing data + Phase 1 gate

- Seed `feature_flags` rows (`live_dispatch=false`, `background_location=false`, `hospital_arrival_sms=false`, `health_kit_bridge=false`, `org_admin_role=false`)
- Migration 005: add `admin` role guard on `audit_log` (`audit_log` must reject admin SELECTs on patient rows unless `has_break_glass(patient_id)` — this is the "admin sees zero clinical rows" gate)
- Write pgTAP tests for the Phase 1 gate criteria
- Fix: `clinician-web/middleware.ts` must check `is_verified_clinician` before allowing any `/dashboard/*` route (currently only checks auth session)

### Step 3 — What I will NOT change yet

The following are Phase 2 (add-on devices) and Phase 3 (location + emergency) work that I will leave untouched until Phase 1 gate passes:
- BLE stack (`react-native-ble-plx`)
- `expo-location`, `expo-sms`, `expo-contacts`
- `escalation-tick` Edge Function
- Any mobile UI changes beyond fixing the "Taken" button to write to `dose_events`

---

*Awaiting your approval before starting Phase 1 build work.*
