# PROJECT EPI — Codebase Audit

> Generated: 2026-10-16. One row per requirement ID from the ★ traceability table.
> Status: **done** = works + has a test · **partial** = code exists, incomplete · **missing** = not started · **conflicts** = contradicts spec

---

## Actual Stack (existing project wins)

| Spec says | Actual project | Notes |
|---|---|---|
| pnpm workspaces + Turborepo monorepo | Three separate apps in one folder (no workspace config, no Turborepo) | Root is a Figma Make Vite app; `mobile/` = Expo; `clinician-web/` = Next.js |
| React Native + Expo (dev client) | Expo ~51 + Expo Router ~3.5 | ✅ matches |
| `react-native-ble-plx` | **Not installed** | BLE not implemented at all |
| SQLite + SQLCipher, key in Keychain/Keystore | `mobile/db/` has schema.ts + offline.ts + sync.ts but SQLCipher not configured, no secure-store key | Plain SQLite only |
| PowerSync or custom outbox | Custom outbox in `mobile/db/sync.ts` | No PowerSync |
| `expo-notifications` | **Not installed** | Local reminders not implemented |
| `expo-location` | **Not installed** | GPS not implemented |
| `expo-contacts` | **Not installed** | Contacts picker not implemented |
| Next.js (App Router) | Next.js 14, App Router | ✅ matches |
| shadcn/ui | **Not installed** (raw Tailwind only) | |
| `packages/tokens` shared design tokens | `mobile/lib/theme.ts` + Tailwind config — two separate systems, not shared | |
| Recharts (web) | recharts ^2.10 ✅ | |
| Victory Native (mobile) | **Not installed** | No mobile charts |
| Supabase (Auth, Postgres+RLS, Realtime, Storage, Edge Functions) | Supabase Auth + Postgres + RLS ✅; Realtime **not integrated**; Storage **not integrated**; Edge Functions **none** | |
| pgTAP RLS tests | **None** | |
| Vitest / Playwright / Maestro | **None** | No test infrastructure at all |
| Africa's Talking / Twilio SMS | **Not integrated** | |
| Firmware (nRF52840 / Zephyr) | **None** | Hardware layer not started |

### Folder layout (actual)

```
project EPI/
├── src/                   # Root Vite + React (Figma Make preview only)
├── mobile/                # Expo React Native (patient + caregiver)
│   ├── app/(auth)/        # login, signup
│   ├── app/(tabs)/        # index, health, circle, records
│   ├── app/insights.tsx
│   ├── app/sos.tsx
│   ├── db/                # schema.ts, offline.ts, sync.ts
│   └── lib/               # supabase.ts, theme.ts, mock-data.ts
├── clinician-web/         # Next.js 14 (clinician + admin)
│   ├── app/dashboard/     # patients, [id], activity, follow-ups
│   ├── app/admin/         # login, clinicians, activity, settings
│   ├── app/api/           # sos, admin/clinicians, admin/invite
│   └── lib/               # supabase.ts, supabase-browser.ts, supabase-server.ts, supabase-admin.ts
├── supabase/
│   └── migrations/        # 001_init_schema.sql, 002_schema_patch.sql
├── ui/                    # SVG assets
└── docs/                  # (this folder, created now)
```

### Existing tables (13 out of ~40+ required)
profiles, conditions, medications, medication_logs, events, observations, care_circle, grants, clinician_links, followups, sos_events, audit_log, sync_state

### ⚠️ Conflicts requiring go-ahead

| # | Conflict | Impact |
|---|---|---|
| **C-1** | App name is **"Duara"** (app.json, package names, SVG assets) — spec calls the product "Epi" / "Project Epi" | Cosmetic / branding: need client confirmation whether "Duara" is intentional |
| **C-2** | Existing theme teal = `#00BFA6`; spec `epi-teal` = `#2F7F79`. Dark theme (navy) vs lighter backgrounds. | Visual: update tokens or keep existing palette? |
| **C-3** | `SUPABASE_SERVICE_ROLE_KEY` present in `clinician-web/.env.local` and used in `lib/supabase-admin.ts` and `app/api/*` routes | **Security violation (CR-SEC-03)**: service key must never be in a client-accessible bundle. Next.js API routes run server-side so the key is not in the browser bundle, but it must not be committed to git or shipped to Vercel environment without secrets management |
| **C-4** | Existing `medication_logs` table uses different columns than spec's `dose_events`. Spec requires `dose_events` with unique `(schedule_id, scheduled_for)` and a `medication_logs` view as an alias. | Additive migration needed; existing `medication_logs` data must be preserved |

---

## ★ Requirement Status Table

### Strap and measurements

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-STR-01 | missing | — | No BLE stack, no vital_samples table, no firmware |
| CR-STR-02 | missing | — | Same |
| CR-STR-03 | missing | — | Same |
| CR-STR-04 | missing | — | Same |
| CR-STR-05 | missing | — | No motion_events table, no IMU firmware |
| CR-STR-06 | missing | — | No ECG (ecg_recordings table, ECG GATT, UI, clinician viewer) |
| CR-STR-07 | missing | — | No BLE, no firmware reminder sync |
| CR-STR-08 | missing | — | No firmware |
| CR-STR-09 | missing | — | No firmware project |
| CR-STR-10 | missing | — | Phase 8 gate (validation against medical-grade device) |
| CR-STR-11 | missing | — | No firmware; Concept A/B build flag not defined |

### Add-on devices

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-ADD-01 | missing | — | No addon_devices table, no BLE BP profile, no dashboard UI |
| CR-ADD-02 | missing | — | No glucose meter / CGM integration |
| CR-ADD-03 | missing | — | No scale integration |
| CR-ADD-04 | missing | — | No approved_addon_models table |

### Conditions supported

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-CON-01 | missing | `supabase/migrations/001_init_schema.sql` (conditions table exists) | No condition_templates table; conditions table has no template_id or group column |
| CR-CON-02 | missing | — | No add-on device conditions flow |
| CR-CON-03 | missing | — | No mood_checkins table, no Group C pathway |

### Medication reminder

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-MED-01 | partial | `clinician-web/app/dashboard/patients/[id]/page.tsx` | Medications view exists; no schedule editor (times, days, snooze, etc.) for clinician |
| CR-MED-02 | partial | `supabase/migrations/001_init_schema.sql` (medications RLS) | RLS policy exists for patient read-only; no medication_schedules table |
| CR-MED-03 | missing | — | No strap reminder sync, no firmware |
| CR-MED-04 | partial | `supabase/migrations/001_init_schema.sql` (medication_logs) | Table exists; **no unique constraint on (schedule_id, scheduled_for)**; no dose_events table with proper schema |
| CR-MED-05 | missing | — | No snooze logic, no medication_schedules.snooze_interval_min |
| CR-MED-06 | missing | — | No missed-dose escalation edge function |
| CR-MED-07 | missing | — | No adherence report screen or query |
| CR-MED-08 | missing | — | No refill_alerts table, no refill reminder job |
| CR-MED-09 | missing | — | No dose-time overlay on vitals chart |
| CR-MED-10 | missing | — | No condition_templates with reminder_types |
| CR-MED-11 | partial | `mobile/app/(tabs)/index.tsx` | Disclaimer text present; not shown on all medication screens |
| CR-MED-12 | partial | `mobile/db/offline.ts`, `mobile/db/sync.ts` | Basic offline works; no local notifications, no strap reminder sync, no reboot persistence |

### Alerts, SOS and emergency

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-SOS-01 | partial | `mobile/app/sos.tsx`, `supabase/migrations/001_init_schema.sql` | SOS button + sos_events table exists; no fall/vitals detection, no alert state machine |
| CR-SOS-02 | partial | `clinician-web/app/api/sos/route.ts` | Server sends Resend email; no push notifications, no SMS, no escalation |
| CR-SOS-03 | missing | — | No escalation-tick Edge Function, no paramedic call |
| CR-SOS-04 | missing | — | SOS payload lacks name, location, medical details |
| CR-SOS-05 | missing | — | No escalation state machine (T0/T+2/T+4 steps) |
| CR-SOS-06 | missing | — | No alert_rules table, no vitals-threshold alerts |
| CR-SOS-07 | missing | — | No alert_rules table |
| CR-SOS-08 | missing | — | No mental-health pathway, no crisis_resources table |
| CR-SOS-09 | partial | `mobile/app/sos.tsx` | Countdown UI exists; no hold-to-activate ring progress |
| CR-SOS-10 | missing | — | No live location in alerts, no Realtime push to contacts |
| CR-SOS-11 | missing | — | No SMS composition (`expo-sms` not installed) |
| CR-SOS-12 | partial | `mobile/db/sync.ts` | Outbox queues writes; no user-facing "Not sent yet" message for SOS specifically |
| CR-SOS-13 | partial | `supabase/migrations/001_init_schema.sql` | sos_events table exists but missing alert_id FK, channel enum, location column |
| CR-SOS-14 | missing | — | Not tested on real SIMs |
| CR-SOS-15 | missing | — | No tested call route, no false-alarm cancel post-dispatch |

### GPS, contacts, hospitals and ambulance

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-GPS-01 | missing | — | expo-location not installed |
| CR-GPS-02 | missing | — | No live location sharing, no location_shares table |
| CR-GPS-03 | missing | — | expo-contacts not installed |
| CR-GPS-04 | missing | — | No health_facilities table, no KMHFL data |
| CR-GPS-05 | missing | — | No routing, no react-native-maps |
| CR-GPS-06 | missing | — | No ambulance number config, no tel: deep link |

### Clinician dashboard and verification

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-CLN-01 | partial | `clinician-web/app/dashboard/` | Dashboard exists but no licence verification gate; any authenticated user can access |
| CR-CLN-02 | missing | — | No licence number field in sign-up flow |
| CR-CLN-03 | missing | — | No clinician_verifications table, no register lookup |
| CR-CLN-04 | missing | — | Clinicians use standard Supabase Auth sign-up; no "set own password after verification" flow |
| CR-CLN-05 | partial | `clinician-web/app/login/page.tsx` | Email + password login exists; no licence ID login |
| CR-CLN-06 | done | Supabase Auth (bcrypt) | Passwords hashed by Supabase Auth; never exposed |
| CR-CLN-07 | missing | — | No password strength rules, no forgot-password flow, no reuse check |
| CR-CLN-08 | missing | — | No MFA (TOTP or SMS) |
| CR-CLN-09 | missing | — | No lockout after failed logins, no expired-licence check |
| CR-CLN-10 | partial | `clinician-web/app/dashboard/patients/[id]/page.tsx` | Trends + vitals exist; missing: ECG review, alert-limit editor, medication schedule editor, adherence report, follow-up detail |
| CR-CLN-11 | missing | — | Views not audited; clinician cannot see their own access history |

### Patient and caregiver apps, consent

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-APP-01 | missing | — | No BLE pairing screens, no react-native-ble-plx |
| CR-APP-02 | partial | `mobile/app/(tabs)/index.tsx` | Event log UI exists; no symptom_logs or mood_checkins tables |
| CR-APP-03 | partial | `mobile/app/(tabs)/` | Some screens: conditions, medications, care circle, records, SOS; missing: full Me tab, Vitals tab, Meds tab with "Taken" |
| CR-APP-04 | partial | `supabase/migrations/001_init_schema.sql` | Grant-based RLS exists; caregiver UI does not show "only granted categories" clearly |
| CR-APP-05 | partial | `mobile/app/(tabs)/circle.tsx` | Care Circle screen exists; no caregiver emergency alert screen, no "Mark taken" for caregiver |
| CR-APP-06 | partial | `supabase/migrations/001_init_schema.sql` (grants table) | Grants table + RLS exists; consent rules 1–5 partially enforced; no revoke-clears-cache logic |
| CR-APP-07 | partial | `mobile/app/(tabs)/circle.tsx` | Some grant toggle UI; no full consent screen with plain-language effect on grant/revoke |
| CR-APP-08 | missing | — | No guardian account flow, no guardian_of column handling |
| CR-APP-09 | missing | — | No export/delete data screen or Edge Function |
| CR-APP-10 | partial | `mobile/lib/theme.ts` | Dark mode palette defined; 200% text not tested, Swahili strings not implemented |
| CR-APP-11 | missing | — | Client canvas designs not linked; no `docs/designs/` folder |

### Offline, architecture and data

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-OFF-01 | partial | `mobile/db/offline.ts`, `mobile/db/sync.ts` | Basic offline R/W works; vitals, SOS, reminders not offline-safe |
| CR-OFF-02 | partial | `mobile/db/schema.ts`, `mobile/db/sync.ts` | SQLite + outbox pattern exists; no client UUID on all rows, no SQLCipher |
| CR-OFF-03 | missing | — | No Supabase Realtime subscription anywhere |
| CR-OFF-04 | partial | `mobile/db/offline.ts` | Some caching; records and care-circle not explicitly cached offline |
| CR-OFF-05 | partial | `mobile/db/sync.ts` | Basic conflict handling; no version numbers on rows, no "updated by clinician" UI |
| CR-OFF-06 | missing | — | No SQLCipher, no expo-secure-store key, no biometric/PIN lock |
| CR-OFF-07 | partial | — | React Native + Expo ✅; Next.js ✅; Supabase ✅; no PowerSync; Edge Functions missing |
| CR-OFF-08 | partial | `supabase/migrations/001_init_schema.sql` | 13 of ~40 tables present; missing: ~27 tables (vital_samples, ecg_recordings, addon_*, motion_events, medication_schedules, dose_events, symptom_logs, mood_checkins, appointments, alert_rules, alerts, alert_escalations, sos_events columns incomplete, paramedic_dispatches, emergency_providers, crisis_resources, patient_locations, health_facilities, etc.) |
| CR-OFF-09 | partial | `supabase/migrations/001_init_schema.sql` | RLS on existing 13 tables; no pgTAP tests; many required tables have no RLS yet |

### Security, privacy, regulation

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-SEC-01 | partial | `mobile/app/(tabs)/index.tsx` | Disclaimer text in one place; not on Vitals, ECG, Meds screens |
| CR-SEC-02 | partial | Supabase TLS ✅ | SQLCipher not configured (CR-OFF-06) |
| CR-SEC-03 | **conflicts** | `clinician-web/.env.local`, `clinician-web/lib/supabase-admin.ts` | Service role key in `.env.local` (should be in secrets manager, not committed); used correctly server-side in API routes only — not in browser bundle, but git-tracked |
| CR-SEC-04 | missing | — | No data-minimisation audit; contacts permission not yet needed |
| CR-SEC-05 | partial | `supabase/migrations/001_init_schema.sql` (grants) | Grant system enforced; mental-health data not yet a separate protected category |
| CR-SEC-06 | missing | — | No legal review; Kenya DPA compliance not audited |
| CR-SEC-07 | missing | — | No Pharmacy and Poisons Board check |
| CR-SEC-08 | missing | — | Location not tracked (expo-location not installed) |

### Platform and add-ons

| ID | Status | Where (files) | What is missing |
|---|---|---|---|
| CR-PLT-01 | partial | `clinician-web/app/admin/` | Admin section exists with clinician list and settings; missing: verification queue, device inventory, emergency routing, firmware, facility directory, audit viewer, DPA requests, feature flags |
| CR-PLT-02 | partial | `mobile/lib/theme.ts`, `clinician-web/tailwind.config.ts` | Teal theme applied; colours differ from spec tokens (see Conflict C-2); no shared `packages/tokens` |
| CR-PLT-03 | missing | — | No phase gates, no CI pipeline |
| CR-PLT-04 | missing | — | No QA checklist run |
| CR-PLT-05 | missing | — | Open questions from spec section 16 not yet answered |

---

## Summary counts

| Status | Count |
|---|---|
| done | 1 (CR-CLN-06) |
| partial | 33 |
| missing | 58 |
| conflicts | 1 (CR-SEC-03, plus cosmetic C-1 and C-2) |
| **Total** | **93** |

## Conflicts requiring go-ahead

| # | Conflict | Recommendation |
|---|---|---|
| C-1 | App branding is **"Duara"** throughout (`app.json` slug, package names, SVG logos, legal name). Spec calls the product "Epi". | Likely intentional (Duara is the brand name, Epi is the internal/project codename). **Please confirm:** keep "Duara" branding in the app, "Project Epi" only in repo/docs? |
| C-2 | Existing teal = `#00BFA6` (bright cyan-teal), navy dark theme. Spec `epi-teal` = `#2F7F79` (darker teal), lighter white surfaces. | Both are valid — they differ visually. Recommend **keeping the existing palette** (it matches the app already designed) and mapping spec token names onto it in `docs/AUDIT.md`. Update `packages/tokens` only for missing tokens (ECG gold, SOS red, etc.). |
| C-3 | `SUPABASE_SERVICE_ROLE_KEY` is tracked in `clinician-web/.env.local` (shows in `git status` as untracked, but is present on disk). Service key used in server-only Next.js API routes — **not** exposed to browser — but must be moved to a secrets manager (Vercel/Railway env, not the repo). | Fix immediately before any commit: add to `.gitignore`, remove from filesystem, add to Vercel/hosting environment variables. |
| C-4 | Existing `medication_logs` table vs spec's `dose_events` + `medication_logs` view. | Additive migration: rename `medication_logs` → `dose_events`, add missing columns + unique constraint, create `medication_logs` view. No data loss. |
