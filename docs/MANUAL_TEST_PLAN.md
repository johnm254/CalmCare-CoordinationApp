# Mojo — Manual Test Plan

> Stage 7 · 27 Oct 2026
> Run these tests before any pilot with real patients. Tag each result with the tester's name, device, and date.
> Automated pgTAP RLS tests are in `supabase/tests/`. Run with: `pnpm supabase test db`

---

## How to read this document

Each test has:
- **ID** — unique test identifier, linked to requirement IDs
- **Pre-condition** — what must be set up before the test
- **Steps** — numbered, one action per step
- **Expected** — what a passing result looks like
- **Blocked by** — what must exist before this test can run

**Pass/fail status column** — fill in after each run: `PASS / FAIL / SKIP (reason)`.

---

## Automated pgTAP tests (run first)

| File | Assertions | Run command |
|---|---|---|
| `supabase/tests/rls_phase1.sql` | 28 | `pnpm supabase test db` |
| `supabase/tests/rls_stage4.sql` | 14 | `pnpm supabase test db` |

All 42 assertions must pass before proceeding to manual tests.

---

## Scenario 1 — Fall with no response dispatches at T+4 min (CR-SOS-01a, CR-SOS-02, CR-CG-06)

**Pre-condition:** Demo patient connected; `escalation-tick` running (cron every minute); emergency provider in sandbox mode; at least one accepted SOS contact.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1 | Simulate a fall: insert a row into `motion_events` with `type = 'fall'` for the demo patient. | `trigger_fall_alert` fires and inserts an alert with `state = 'fall_check'`. | |
| 2 | Wait 30 seconds without tapping "I'm OK". | `escalation-tick` advances alert to `state = 'raised'`. | |
| 3 | Observe alert state after next cron tick. | Alert moves to `notifying`; push sent to SOS contact (Expo log shows message with "pressed SOS" title, no emoji). | |
| 4 | Wait 2 minutes without responding. | Alert moves to `awaiting_response`; reminder push sent ("No reply yet" title). | |
| 5 | Insert a `sos_responses` row with `response_type = 'not_reached'` for the SOS contact. | Alert stays in `awaiting_response`; escalation continues. | |
| 6 | Wait 4 minutes total from alert open without any `reached` or `ok` response. | Alert moves to `dispatching`; a row inserted in `paramedic_dispatches` with `status = 'sandbox_skipped'`. | |
| 7 | Verify `paramedic_dispatches.payload` JSON. | Payload contains `location_lat`, `location_lon`, `patient_name`, `alert_time_str`, `script` (starts with "This is an automated emergency alert from Mojo." — no emoji, location first). | |

**Variation — reply 1 stops escalation at T+3 min:**

| # | Step | Expected |
|---|---|---|
| A | Repeat steps 1–3. At T+3 min, insert `sos_responses` row with `response_type = 'reached'`. | Alert moves to `responded`; no paramedic dispatch row inserted. |

---

## Scenario 2 — SOS with no internet queues and retries (CR-SOS-03)

**Pre-condition:** `sms_queue` table exists; mobile app accessible.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1 | Disconnect from internet (airplane mode on device). | |
| 2 | Press the SOS button in the app. | App shows "Not sent yet — retrying" (or equivalent offline message); SOS button remains accessible. | |
| 3 | Check `sms_queue` table after reconnect. | Row with `status = 'queued'` (or `'sent'` if auto-retry ran); `created_at` matches the original SOS time, not the reconnect time. | |
| 4 | Verify no "Epi" in any notification title or body shown to the user. | All visible text says "Mojo". | |

---

## Scenario 3 — Caregiver grant/revoke cycle (CR-SEC-01, CR-SEC-02, CR-CG-01)

**Pre-condition:** Patient A account; Caregiver B account; no active grant.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1 | Sign in as Caregiver B. Query `vital_samples` for Patient A. | Returns 0 rows (no grant). | |
| 2 | Sign in as Patient A. Grant Caregiver B access to `vitals`. | `grants` row inserted with `category = 'vitals'`, `revoked_at = NULL`. | |
| 3 | Sign in as Caregiver B again. Query `vital_samples`. | Returns Patient A's vitals (grant active). | |
| 4 | Sign in as Patient A. Revoke the grant (set `revoked_at = NOW()`). | `grants.revoked_at` updated. | |
| 5 | Check `notifications` table for Caregiver B. | A `cache_clear` notification exists with `kind = 'cache_clear'`, `payload.category = 'vitals'`. | |
| 6 | Sign in as Caregiver B. Query `vital_samples`. | Returns 0 rows again. | |

---

## Scenario 4 — Unverified clinician sees nothing; access is audited (CR-CLIN-01, CR-SEC-03)

**Pre-condition:** Clinician account that has NOT been verified (no row in `clinician_verifications` with `status = 'verified'`).

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1 | Sign in as unverified clinician. Query `vital_samples`, `dose_events`, `alerts`, `medications`. | All return 0 rows. | |
| 2 | Attempt to read a patient's ECG recording. | 0 rows returned. | |
| 3 | Check `access_log` table for any rows from this clinician. | Each query attempt logged (patient_id, clinician_id, category, result). | |
| 4 | Patient checks their "Who viewed my data" history. | The attempted accesses appear in the activity log. | |

---

## Scenario 5 — Dose dedup: strap + app, one log (CR-MED-02)

**Pre-condition:** A medication schedule with a specific `schedule_id` and `scheduled_for` time.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1 | Patient confirms dose in the app for `(schedule_id, scheduled_for)`. | One row inserted in `dose_events` with `status = 'taken'`. | |
| 2 | Simulate the strap sending the same confirmation (same `schedule_id` + `scheduled_for`). | `ON CONFLICT DO NOTHING` (or UNIQUE violation) prevents a second row. Total rows = 1. | |
| 3 | Attempt a direct INSERT with the same `(schedule_id, scheduled_for)`. | Returns error `23505` (unique_violation). | |

---

## Scenario 6 — Mood alert never dispatches paramedics (CR-MED-04, CR-SOS-05)

**Pre-condition:** An alert with `pathway = 'mental_health'` OR `severity = 'warning'`.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1 | Insert an alert: `pathway = 'mental_health'`, `severity = 'critical'`, `state = 'awaiting_response'`, `opened_at = NOW() - interval '5 minutes'`. | |
| 2 | Wait for `escalation-tick` to run. | Alert advances to `dispatching`. NO row in `paramedic_dispatches`. | |
| 3 | Check `alert_escalations` table. | A row with `action = 'crisis_line'` exists (not `call_paramedics`). | |
| 4 | Insert a second alert: `pathway = 'medical'`, `severity = 'warning'`, same timing. | Same as above — crisis_line, no paramedic dispatch. | |

---

## Scenario 7 — Nearest hospital list works offline (CR-LOC-04, CR-LOC-05)

**Pre-condition:** `health_facilities` table populated (even with the fallback 4 Nairobi hospitals).

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1 | Open the EmergencyMap component while connected. | Map shows hospital pins loaded from `health_facilities` DB. | |
| 2 | Disconnect from internet; open EmergencyMap. | Map still shows hospital pins from the JS fallback array; haversine ranking works (nearest hospital first). | |
| 3 | Verify hospital popup content. | Shows name; 24-hour emergency flag where applicable; no emoji in popup text. | |
| 4 | Tap "Call ambulance" button. | Device dialer opens with the number from `emergency_providers` (e.g. 999). Number is not hard-coded in the source code. | |

---

## Scenario 8 — No "Epi" visible to any user (CR-NAME-07)

**Pre-condition:** The CI check script exists at `scripts/check-epi-strings.sh`.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1 | Run `bash scripts/check-epi-strings.sh` from the repo root. | Exit code 0; no "Epi" (whole word) found in user-facing files. | |
| 2 | Open the app in the browser. Click through: Home → SOS → Ambulance → Care Circle → Records → Insights → Caregiver view → Clinician view → all Stitch screens. | No screen shows "Epi" as a user-visible word. | |
| 3 | Trigger a demo SOS. Check the push notification preview (Expo Go). | Notification title contains "Mojo" or patient name, not "Epi". | |
| 4 | Check SMS fallback string in StitchGPS. | Reads "Mojo SOS:" not "[EPI-SOS]". | |

---

## Tests that require hardware or live infrastructure

These cannot be run in the current prototype environment. They are listed here so the QA team knows what to test before any real-patient pilot.

| ID | Scenario | Requirement | Blocked by |
|---|---|---|---|
| HW-01 | Mojo Strap Concept A: press SOS hold 3 s, 10 s cancel window fires | CR-STRAP-06 | Physical strap hardware |
| HW-02 | Mojo Strap Concept A: ECG 30 s recording, signal-weak handling | CR-ADD-01 | Physical strap + firmware |
| HW-03 | Mojo Strap Concept B: LED bar + vibration patterns match firmware IDs | CR-STRAP-01 | Concept B hardware + firmware |
| HW-04 | Strap stores 72 h and uploads on reconnect, oldest first, deduplicated | CR-STRAP-04 | Physical strap hardware |
| HW-05 | Medication reminder fires with phone off (stored on strap) | CR-STRAP-05 | Physical strap hardware |
| HW-06 | BLE pairing: secure bonding, OTA firmware update | CR-STRAP-08 | Physical strap hardware |
| SIM-01 | SMS to SOS contact on real Safaricom/Airtel SIM | CR-SOS-03 | Real SIM + Africa's Talking key |
| SIM-02 | SMS reply "1" / "2" matched to correct open alert | CR-CG-05 | Real SIM + inbound SMS routing |
| LOC-01 | Expiring live-location link for contacts and ambulance | CR-LOC-01 | Real device + location perms |
| LOC-02 | Travel-time ranking via Google Maps Platform | CR-LOC-06 | Live Google Maps API key |
| ADD-01 | BP cuff pairing and reading (Bluetooth) | CR-ADD-02 | Physical Bluetooth BP cuff |
| ADD-02 | CGM stream in mmol/L | CR-ADD-03 | Physical CGM device |
| ADD-03 | Smart scale pairing | CR-ADD-04 | Physical scale |
| ADD-04 | HealthKit / Health Connect bridge | CR-ADD-07 | iOS/Android device + flag on |
| UX-01 | 200% text size: no truncation in SOS or medication screens | Section 4 | Physical device |
| UX-02 | VoiceOver (iOS) / TalkBack (Android) SOS flow end-to-end | Section 4 | Physical device + screen reader |
| UX-03 | Usability: older patient population (Concept A target group) | CR-PAT-02 | Pilot participants |
| CLIN-01 | MFA (TOTP + SMS fallback) for clinician login | CR-CLIN-01 | MFA provider (TOTP or Twilio) |
| CLIN-02 | Account lockout after 5 failed attempts | CR-CLIN-01 | Live clinician auth flow |
| SEC-01 | Encrypted local SQLite on device | CR-SEC-06 | Mobile app + expo-sqlite-encrypted |
| SEC-02 | DPA export / delete request end-to-end | CR-SEC-07 | Admin portal + legal confirmation |
| SEC-03 | Break-glass: second admin approval, 60-min expiry, patient notified | CR-ADM-01 | Two admin accounts |
| CALL-01 | Automated TTS call to emergency provider in sandbox | CR-SOS-07 | Twilio / Africa's Talking voice key |
| CALL-02 | Paramedic call script: location first, repeated once, no brand filler | CR-SOS-07 | CALL-01 |

---

## Stop-list items still requiring human sign-off

| Item | Who | Required before |
|---|---|---|
| Mojo trademark clearance (Kenya + app stores) | Client / IP lawyer | Any public store listing |
| Kenya DPA / ODPC registration | Client / data-protection lawyer | Any live patient data |
| PPB medical device classification | Client / regulatory consultant | Any clinical claim or marketing |
| Ambulance provider agreement (999/112 or private) | Client | `live_dispatch` flag switched on |
| Clinical copy approvals (SOS, consent, strap) | Named clinician + legal | Any patient-facing pilot |
| Release 2 ECG rhythm validation study | Client / clinical team | `release2_ecg_rhythm` flag switched on |
| Swahili copy review | Human Swahili reviewer | Any Swahili-language pilot |
