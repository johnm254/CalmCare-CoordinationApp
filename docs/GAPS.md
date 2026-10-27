# GAPS.md — Mojo / Project Epi
> As of Stage 9 (27 Oct 2026). All items below are either fully missing or meaningfully incomplete.
> Items marked **[BLOCKED]** require hardware, a third-party contract, or a human decision before any code can be written.
> Everything else can be built now.

---

## 1. Fully missing — no code exists

| ID | What | Gate |
|---|---|---|
| CR-STRAP-01 | Concept A (screen) and Concept B (LED) firmware flag gating | **[BLOCKED]** Hardware + firmware; no physical strap |
| CR-STRAP-05 | Medication reminder on strap + Confirm button logs dose with device time | **[BLOCKED]** Firmware required |
| CR-ADD-07 | HealthKit / Health Connect bridge | Feature flag seeded; bridge stub not yet written |
| CR-PAT-09 | Full offline SQLite + AES-256 encryption (op-sqlite + secure storage) | Mobile library decision needed |
| CR-CG-05 | SMS-only contacts: digit-reply alerts + YES/NO invite parse | **[BLOCKED]** Africa's Talking / Twilio contract required |
| CR-MED-01 | Reminder engine: push on strap + phone, repeat up to max_repeats, mark missed, notify caregiver | Edge Function or cron not yet written |
| CR-SOS-07 | Automated TTS call script (location first, name, time, consented details, callback, repeats once) | **[BLOCKED]** Voice provider contract needed |
| Section 8.3 | Concept A strap string IDs — 13 events dispatched as IDs, placeholders filled on phone | Strap BLE event dispatcher not built |
| Section 8.3 | Concept B light + vibration named firmware patterns | **[BLOCKED]** Hardware + firmware |

---

## 2. Zero verified requirements

All 108 requirements sit at `partial` or `missing`. The 42-assertion pgTAP suite exists at `supabase/tests/` but has never been run. Running `pnpm supabase test db` against a local Supabase instance is the single highest-leverage action remaining.

If all 42 assertions pass, these move to **verified**:

> CR-SEC-01, CR-ADM-01, CR-CLIN-01, CR-MED-02, CR-SEC-04, CR-CG-06, CR-CG-07, CR-SOS-01a

**Gate:** `supabase start` → run migrations → `pnpm supabase test db`

---

## 3. Partial — built but meaningfully incomplete

### Patient app

| ID | Gap | What to do |
|---|---|---|
| CR-PAT-01 | SOS button only on Home; spec requires it on every screen | Add floating SOS button to CircleScreen, Insights, RecordsScreen, MeScreen |
| CR-PAT-03 | Today: no live vitals (BLE stubbed), no appointments card, no nearest-hospital tile | Wire `useBle()` vitals row; add appointment + hospital tiles |
| CR-PAT-04 | Vitals charts: no clinician limit lines, no ECG 25 mm/s grid, no mark-reviewed status | Add limit lines to SVG charts; build ECG grid in StitchVitals; add review button |
| CR-PAT-05 | Meds: no once-per-slot client dedup, no snooze, no adherence % chart, no stock count shown | Enforce UNIQUE insert; add snooze timer; add adherence mini-chart |
| CR-PAT-06 | Care: no linked clinicians panel, no appointments, no follow-ups | Add clinician card + appointments section to CircleScreen |
| CR-PAT-07 | Records: no offline cache | Add IndexedDB / local-storage cache layer |

### Caregiver

| ID | Gap | What to do |
|---|---|---|
| CR-CG-01 | Hardcoded single patient; no patient switcher | Add switcher dropdown; enforce grant-only data per patient |
| CR-CG-04 | "Record an observation" button leads nowhere | Build observation form (text + category + date) → `caregiver_observations` |
| CR-CG-06 | Escalation logic correct; pgTAP assertion unrun | Run `pnpm supabase test db` |

### Clinician dashboard

| ID | Gap | What to do |
|---|---|---|
| CR-CLIN-01 | Account lockout added to schema; clinician-web sign-up UI not in this repo; pgTAP unrun | Verify `clinician-web`; run pgTAP |
| CR-CLIN-02 | Patient list alphabetical; spec requires urgency sort | Sort by critical alerts → warnings → missed doses → low adherence → strap > 24 h unworn |
| CR-CLIN-03 | Patient overview hardcoded; no limit lines; mood not gated on grant | Wire live queries; add limit lines; add mood grant gate |
| CR-CLIN-04 | ECG is animation; no 25 mm/s grid, no zoom, no mark-reviewed | Replace animation with calibrated SVG grid; add review action |
| CR-CLIN-09 | `preferred_facilities` schema exists; no UI picker; no location trail in alert detail | Add preferred-hospital picker; add location trail to alert detail view |
| CR-CLIN-10 | Follow-up queue visible; no appointment scheduling; no access history shown | Build appointment form; wire `audit_log` read into patient view |

### Admin portal

| ID | Gap | What to do |
|---|---|---|
| CR-ADM-01 | Portal built; MFA + IP allowlist not verified | Verify in Supabase Auth config; run pgTAP |
| CR-ADM-08 | Crisis resources: 1 seed row; no admin UI to manage entries | Add CRUD section to AdminPortal |
| CR-ADM-10 | `break_glass_requests` + `paramedic_dispatches` schemas exist; no incident log or false-alarm rate UI | Build incident log section in AdminPortal |
| CR-ADM-11 | `dpa_requests` table exists; no export/delete/correct workflow | Build DPA request queue + service-role export/delete Edge Function |
| CR-ADM-12 | Feature flags editable; audit log viewer not wired to live `audit_log`; notification template table seeded but no editor | Wire audit_log query; add notification template editor |

### Emergency and escalation

| ID | Gap | What to do |
|---|---|---|
| CR-SOS-01 | DB trigger `trigger_fall_alert()` exists; BLE → motion_events not wired (hardware-blocked) | When BLE available, insert motion_events row; trigger handles the rest |
| CR-SOS-02 | T+0/T+2/T+4 logic correct; push delivery unverified; dispatch ref missing from T+4 | Verify push in staging; add `dispatch_ref` to T+4 copy |
| CR-SOS-03 | SMS fallback UI exists; no actual SMS send, no offline queue, no original-timestamp sync | Blocked by CR-CG-05 (SMS contract) + CR-PAT-09 (SQLite) |
| CR-SOS-04 | Cancel stops escalation; false-alarm state not shown to clinician | Add `false_alarm` filter to AlertsInbox; add count to clinician dashboard tile |
| CR-SOS-06 | Dispatch payload has location + name + time; nearest hospital missing; medical details consent gate missing | Add nearest-hospital lookup at dispatch; add consent check for medical details |

### Location and hospitals

| ID | Gap | What to do |
|---|---|---|
| CR-LOC-01 | GPS starts on alert only (correct); `location_shares` row with expiry not created | Insert `location_shares` row (`expires_at = now() + 4h`) when SOS is triggered |
| CR-LOC-02 | SavedPlaces component built; MeScreen home address still hardcoded | Wire MeScreen address display to live `saved_places` query |
| CR-LOC-04 | 0 real KMHFL rows imported; all hospitals are hardcoded | Build KMHFL CSV import in AdminPortal (CR-ADM-07) |
| CR-LOC-05 | Haversine ranking exists; no 50 km radius filter; no client-side facility cache | Add `ST_DWithin(50km)` to DB query; cache in `localStorage` |
| CR-LOC-07 | Hospital cards in StitchGPS have call + directions; PatientHome has no hospital card | Add nearest-hospital card to PatientHome Today screen |
| CR-LOC-09 | "Call ambulance" on EmergencyMap and CaregiverScreen only; not on PatientHome | Add ambulance call tile to PatientHome quick-access |
| CR-LOC-10 | `hospital_arrival_sms = false` flag seeded; send logic not built | Build SMS-to-hospital behind flag (requires SMS contract) |

### Medications and mental health

| ID | Gap | What to do |
|---|---|---|
| CR-MED-03 | Stock columns exist; no trigger to decrement on dose taken; no refill push | Add `AFTER INSERT ON dose_events` trigger; Edge Function push when stock ≤ threshold |
| CR-MED-04 | Mental-health pathway routes to `crisis_line` correctly; crisis resources not shown to patient | Add crisis resource card to PatientHome (shown when mood pathway is active) |
| CR-MED-05 | Mood RLS policy correct; no UI shows mood is off by default | Add "Mood data is private" note with toggle to MeScreen or Care tab |

### Privacy and security

| ID | Gap | What to do |
|---|---|---|
| CR-SEC-01 | Grants schema correct; pgTAP unrun (8 assertions) | Run `pnpm supabase test db` |
| CR-SEC-02 | Revoke works at DB level; no client-side cache-clearing signal | Push notification on grant revoke; client clears local state on receipt |
| CR-SEC-04 | Audit log append-only policy correct; pgTAP unrun | Run `pnpm supabase test db` |
| CR-SEC-05 | Lockout columns added in migration 009; no UI enforcement; no test | Run pgTAP; verify Edge Function checks `locked_until` before auth |
| CR-SEC-06 | Supabase DB encrypted at rest; local SQLite not implemented | Blocked by CR-PAT-09 |
| CR-SEC-07 | `retention_settings` table (7-year default) exists; no export function, no retention cleanup cron | Build export Edge Function; build cleanup cron (service-role) |
| CR-SEC-08 | `guardian_of` column in profiles; no guardian flow in onboarding, no admin ID verification | Add guardian step to OnboardingScreen; add ID verification queue in AdminPortal |
| CR-SEC-10 | `consent_log` table with all required columns; no consent-screen UI flow | Build consent UI (one purpose per screen, nothing pre-ticked) → insert to `consent_log` |
| CR-SEC-12 | Playbook auth copy written; not verified in `clinician-web` code | Manual review of `clinician-web` sign-up and error messages |

### Internationalisation and copy

| ID | Gap | What to do |
|---|---|---|
| CR-NAME-04 | `getCopy()` wired to SOS screens only; all other UI strings hardcoded | Wire progressively — SOS, onboarding, care circle first |
| CR-NAME-04 | All 34 Swahili strings marked `needs_review` | Native Swahili speaker + clinical reviewer required |
| Section 8.2 | CI scripts exist and `ci.yml` added; not yet verified on a live PR | Push a test PR; fix any path issues in the yml |
| Section 8.3 | Escalation-tick push copy uses playbook voice but not wired to catalogue IDs | Refactor escalation-tick to call `getCopy("SOS-01-PUSH")` etc. |

---

## 4. Human sign-off required (cannot be completed in code)

| Item | Who must approve |
|---|---|
| All 34 Swahili strings — currently `needs_review` | Native Swahili speaker + clinical reviewer |
| ECG disclaimer wording | Legal / medical |
| SOS voice call script (SOS-03-VOICE) | Legal + clinical |
| Consent screen copy (CON-01 through CON-03) | Legal |
| "Mojo never changes your dose" safety notice | Clinical |
| Live dispatch switch (requires 2 admins to agree) | Product + ops |
| KMHFL hospital data accuracy | Ops / data team |
| Guardian ID verification process design | Legal / safeguarding |
| Demo email `amina@patient.epi` rename | Supabase Auth console (stop-list item) |

---

## 5. Quick wins — under 2 hours each

1. **CR-PAT-01** — Add floating SOS button to CircleScreen, Insights, RecordsScreen, MeScreen (one import + one JSX line per screen)
2. **CR-SOS-04** — Add `false_alarm` filter chip to AlertsInbox + counter on clinician dashboard tile
3. **CR-LOC-01** — Insert `location_shares` row in `handleSend()` in SosScreen (`expires_at = now() + 4h`)
4. **CR-MED-05** — Add "Mood data is private by default" note to MeScreen privacy section
5. **CR-ADM-08** — Add crisis resources CRUD to AdminPortal (section structure already in place)
6. **CR-LOC-07** — Add nearest-hospital card to PatientHome Today screen (reuse haversine logic from StitchGPS)
7. **CR-LOC-09** — Add ambulance call tile to PatientHome quick-access (one `<a href="tel:...">` element)
8. **CR-SEC-10 (partial)** — Add consent checkbox step to OnboardingScreen (`consent_log` insert already wired in migration)
