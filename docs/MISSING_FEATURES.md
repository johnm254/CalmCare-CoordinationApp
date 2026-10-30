# Missing Features & Entities — Mojo Build Reference

> Last updated: 2026-10-29  
> Sources: MOJO_CONTENT_PLAYBOOK.md · docs/GAPS.md · docs/AUDIT.md · docs/COPY_LOG.md · docs/DECISIONS.md · docs/MANUAL_TEST_PLAN.md

---

## 1. CRITICAL — Blocks go-live / pilot

### Mobile APK

| # | Feature | File(s) | Notes |
|---|---------|---------|-------|
| M-01 | **Consent screens** (CON-01 → CON-03 + 4 more) | `mobile/app/(auth)/consent.tsx` (missing) | Required before any real-patient data is collected. Must include: data usage, location share, caregiver visibility, mood data, research opt-in, DPA rights. Playbook Project 7. |
| M-02 | **SOS trigger on every screen** | All tab screens | Playbook Project 5: SOS must be one tap from anywhere. Currently only accessible from the SOS dedicated screen. Add persistent FAB or bottom-bar SOS button. |
| M-03 | **Caregiver emergency screen** `sos-alert.tsx` | `mobile/app/sos-alert.tsx` | Missing: "Get Directions" button (Google Maps deep-link), "Nearest Hospital" button (live query), ambulance call button (999/112). |
| M-04 | **Mood never dispatches ambulance** | `mobile/app/(tabs)/mood.tsx` | If mood pathway detects crisis, it must offer SOS escalation — currently it does not link to SOS or emergency services. |
| M-05 | **Location share row on SOS screen** | `mobile/app/sos.tsx` | SOS screen must show the patient's current GPS coordinates and a "Share location" row so the caregiver knows where they are. |
| M-06 | **Onboarding flow** (5 screens) | `mobile/app/onboarding/` (missing) | Welcome → condition setup → caregiver invite → strap pair → notifications permission. Without this, new users have no guided setup. |

### Clinician Web

| # | Feature | File(s) | Notes |
|---|---------|---------|-------|
| C-01 | **ECG strip viewer** | `clinician-web/app/dashboard/patients/[id]/ecg/` (missing) | 25 mm/s grid, zoom in/out, mark-as-reviewed button, link from patient timeline. Blocked until BLE strap ships hardware; UI can be built against mock data now. |
| C-02 | **Urgency sort on patient list** | `clinician-web/app/dashboard/patients/page.tsx` | Sort patients by highest-severity recent event (last 24 h). Currently alphabetical only. |
| C-03 | **Alert inbox copy** | `clinician-web/app/dashboard/alerts/page.tsx` | All alert strings must match MOJO_CONTENT_PLAYBOOK.md Project 8 (clinician onboarding messages). Current strings are dev placeholders. |

### Admin Portal

| # | Feature | File(s) | Notes |
|---|---------|---------|-------|
| A-01 | **"Dispatch not live" banner** | `clinician-web/app/admin/(protected)/page.tsx` | When `feature_flags.live_dispatch = false`, show prominent red banner: "Emergency dispatch is in sandbox mode — no real ambulances are called." Decision D-10. |
| A-02 | **DPA request queue UI** | `clinician-web/app/admin/(protected)/dpa/` (missing) | List of patient data-access / deletion requests with approve/reject actions. Required before ODPC registration. |
| A-03 | **Break-glass + incident log UI** | `clinician-web/app/admin/(protected)/incident-log/` (missing) | Clinician break-glass access events must be logged and visible to admin. Decision D-14. |

---

## 2. COPY VIOLATIONS — Playbook non-compliant strings

| # | Location | Current string | Required string | Source |
|---|----------|---------------|-----------------|--------|
| CP-01 | `mobile/lib/sms.ts` or SOS send | SMS body varies | `"Mojo SOS: [Name] needs help (sent [time]). Reply 1 = yes, 2 = no."` — no emoji, no "alarm" styling | Playbook Project 5 §SMS format |
| CP-02 | All 34 strings in `docs/COPY_LOG.md` | Status: `draft` | Status: `approved` — requires clinician + legal sign-off before pilot | COPY_LOG.md |
| CP-03 | `mobile/app/(tabs)/me.tsx` | No mood-privacy note | Add: "Mood data is private by default — only you and your doctor can see it." | Playbook Project 6 |
| CP-04 | `mobile/app/(tabs)/mood.tsx` | No crisis resource card | When mood pathway is active, show: "Feeling overwhelmed? Talk to Befrienders Kenya: 0800 723 253 (free, 24/7)" | Playbook Project 6 |
| CP-05 | `mobile/app/sos.tsx` escalated state | Placeholder copy | "Paramedics are on their way. Stay calm and stay still. [Contact name] has been told. Tap below when you're safe." | Playbook Project 5 §escalated |

---

## 3. BUILDABLE NOW — No hardware blockers

### Mobile APK

| # | Feature | File(s) | Notes |
|---|---------|---------|-------|
| B-01 | **Nearest hospital card (live)** | `mobile/app/sos-alert.tsx`, `mobile/app/(tabs)/home.tsx` | Replace hardcoded "Kenyatta National Hospital" with live query to `health_facilities` Supabase table filtered by `ST_Distance(location, user_location)`. |
| B-02 | **Ambulance call tile on Home** | `mobile/app/(tabs)/home.tsx` | Quick-dial tile: "Call ambulance — 999 / 112". `Linking.openURL('tel:999')`. Playbook Project 5. |
| B-03 | **Saved places screen** | `mobile/app/saved-places.tsx` (missing) | List of named locations (home, work, school) stored in `saved_places` table. Used to pre-fill SOS location. |
| B-04 | **Caregiver observation form** | `mobile/app/circle-observation.tsx` (missing) | Caregiver can log what they observed during a seizure (duration, type, postictal). Feeds into patient timeline. |
| B-05 | **Adherence chart** | `mobile/app/(tabs)/meds.tsx` | 7-day / 30-day bar chart showing taken vs missed doses. Uses existing `med_logs` table. |
| B-06 | **Crisis resource card** | `mobile/app/(tabs)/mood.tsx` | See CP-04 above — Befrienders Kenya card when mood pathway active. |
| B-07 | **Mood data private note** | `mobile/app/(tabs)/me.tsx` | See CP-03 above — one-line note under mood section. |
| B-08 | **Appointment scheduling** | `mobile/app/appointments.tsx` (missing) | Patient-side: view upcoming appointments, request reschedule. Clinician-side: confirm/decline. Uses `appointments` table (schema exists). |

### Clinician Web

| # | Feature | File(s) | Notes |
|---|---------|---------|-------|
| B-09 | **Patient list urgency sort** | `clinician-web/app/dashboard/patients/page.tsx` | See C-02 above. |
| B-10 | **Follow-up reminder emails** | `clinician-web/` or Supabase Edge Function | When a follow-up `due_at` is within 24 h and status = open, send email to clinician. Edge function + cron. |

### Admin Portal

| # | Feature | File(s) | Notes |
|---|---------|---------|-------|
| B-11 | **Condition template editor** | `clinician-web/app/admin/(protected)/templates/` (missing) | Admin can add/edit seizure type definitions, severity scales, medication categories. |
| B-12 | **Feature flag toggle UI** | `clinician-web/app/admin/(protected)/feature-flags/` (missing) | Toggle `live_dispatch`, `ble_strap`, `swahili_ui`, `research_mode` flags in `feature_flags` table. |

---

## 4. BLOCKED — External dependency required first

| # | Feature | Blocker | What to do now |
|---|---------|---------|----------------|
| BL-01 | BLE Epi Strap (Mojo Strap) pairing | Hardware not shipped | Build pairing UI skeleton against mock device; wire up when hardware arrives |
| BL-02 | SMS dispatch contract | Safaricom / Africa's Talking B2B contract not signed | Use sandbox credentials; add "SMS not live" notice in admin |
| BL-03 | Live KMHFL health facilities data | Kenya MoH API key not issued | Seed ~20 Nairobi hospitals manually; swap for live query when key arrives |
| BL-04 | Swahili UI strings | Translator review not complete | Mark all `sw` locale strings as `review_needed`; do not ship until reviewed |
| BL-05 | Live ambulance dispatch | Decision D-10: sandbox until county MoU signed | Keep `sandbox_dispatch = true`; build UI, show "sandbox" badge everywhere |
| BL-06 | 34 copy strings approval | Clinician + legal sign-off pending | Keep status `draft`; gate pilot on approval |
| BL-07 | ODPC data-protection registration | DPA queue UI (A-02) must be built first | Build A-02, then submit ODPC application |
| BL-08 | Apple HealthKit / Google Fit sync | App Store / Play Store review required | Design data model; implement behind `health_sync` feature flag |

---

## 5. DATABASE ENTITIES — Missing or incomplete

| Entity | Table | Status | Notes |
|--------|-------|--------|-------|
| `sos_events.status` | `sos_events` | Needs `'cancelled'` value | Add to DB enum + RLS policy for patient to cancel own events |
| `saved_places` | `saved_places` | Table may not exist | `id, patient_id, label, lat, lng, created_at` |
| `appointments` | `appointments` | Schema exists, no UI | `id, patient_id, clinician_id, scheduled_at, status, notes` |
| `caregiver_observations` | `caregiver_observations` | Missing | `id, patient_id, caregiver_id, event_id, observed_at, description, json_data` |
| `med_logs` | `med_logs` | Exists, adherence chart not built | Wire up to adherence chart (B-05) |
| `health_facilities` | `health_facilities` | Missing / empty | `id, name, lat, lng, type, county` — seed 20+ Nairobi entries |
| `dpa_requests` | `dpa_requests` | Missing | `id, patient_id, request_type, status, created_at, resolved_at` |
| `incident_log` | `incident_log` | Missing | `id, clinician_id, patient_id, reason, accessed_at, resolved_by` |
| `feature_flags` | `feature_flags` | Exists | Add `ble_strap`, `health_sync`, `swahili_ui` flags if not present |
| `condition_templates` | `condition_templates` | Missing | `id, name, severity_scale json, seizure_types json, created_by` |

---

## 6. SUPABASE / BACKEND — Missing functions and policies

| # | Item | Notes |
|---|------|-------|
| SB-01 | RLS policy: patient can update own `sos_events.status` to `'cancelled'` | Required for false-alarm cancel flow |
| SB-02 | Edge Function: follow-up 24 h reminder email | Cron trigger → query open follow-ups due soon → send via Resend/Postmark |
| SB-03 | Edge Function: SOS escalation timer (T+4 min) | Decision D-4: if no `'cancelled'` update within 240 s, set status to `'escalated'` and trigger dispatch |
| SB-04 | Edge Function: ambulance sandbox dispatch | Log dispatch attempt; in sandbox mode write to `dispatch_log`, never call real API |
| SB-05 | Realtime subscription: caregiver `sos_events` channel | Caregiver must receive push within 30 s of SOS sent (MANUAL_TEST_PLAN scenario 1) |
| SB-06 | Storage bucket: ECG recordings | `ecg_recordings` bucket, RLS: clinician read, device write |

---

## 7. QUICK WINS — Under 30 min each

| # | Task | File | Change |
|---|------|------|--------|
| QW-01 | Notification body privacy | `mobile/lib/notifications.ts` | Already fixed — verify body never includes med name |
| QW-02 | Me screen: mood privacy note | `mobile/app/(tabs)/me.tsx` | Add one `<Text>` line under mood section |
| QW-03 | Home screen: ambulance tile | `mobile/app/(tabs)/home.tsx` | Add `Linking.openURL('tel:999')` quick-dial card |
| QW-04 | Admin: dispatch sandbox banner | `clinician-web/app/admin/(protected)/page.tsx` | Conditionally render red banner when `live_dispatch = false` |
| QW-05 | Patient list: severity sort | `clinician-web/app/dashboard/patients/page.tsx` | Sort by `max(events.severity)` in last 24 h |
| QW-06 | SOS screen: show coordinates | `mobile/app/sos.tsx` | Read from `expo-location`, render `lat, lng` as small grey text |

---

## Build priority order

1. **M-01** Consent screens — legal gate  
2. **A-01** Dispatch sandbox banner — safety visibility  
3. **M-02** Global SOS FAB — core UX  
4. **M-03** Caregiver emergency screen completeness  
5. **SB-03** SOS escalation Edge Function — ties the 4-min timer to real DB  
6. **B-01** Nearest hospital live query  
7. **M-06** Onboarding flow  
8. **A-02** DPA request queue → unblocks ODPC registration  
9. **B-08** Appointment scheduling  
10. **C-01** ECG viewer (build against mock data)  
