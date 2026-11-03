# MOJO — Requirements and Verification Checklist

> Version 1 · 27 Oct 2026 · Prepared by Launchpoint Engineering
> The product formerly called **Project Epi** is now **Mojo**. This file is the single checklist of everything the built app must do. It combines the client's original documents, the client's add-ons (ECG, BP cuff, glucose meter, scale, GPS, contacts, nearest hospital, ambulance), the build spec and the Content Playbook v1.

---

## 1. What Mojo is

Mojo is a care-coordination platform for people living with chronic conditions.

| Part | What it does |
|---|---|
| **Mojo Strap** | Wrist wearable: heart rate and rhythm, SpO2, skin temperature, breathing rate, movement and falls, on-demand ECG, medication reminders, Confirm and SOS buttons. Concept A (screen) and Concept B (slim, LED bar) |
| **Add-on devices** | Bluetooth blood-pressure cuff, glucose meter / CGM, weight scale |
| **Mojo app** (iOS + Android) | Patient and caregiver views; works offline |
| **Mojo for clinicians** (web) | Verified doctors, clinical officers and nurses |
| **Mojo admin** (web) | Platform operations, no health data |
| **Mojo cloud** | Database with consent rules, alerts, escalation, ambulance dispatch |

Related files: `PROJECT_EPI_BUILD_SPEC.md` (technical detail; read "Epi" as "Mojo") and `docs/content/MOJO_CONTENT_PLAYBOOK.md` (every user-facing word).

---

## 2. Rename to Mojo — `CR-NAME`

- **01** Every user-facing place says **Mojo**, never Epi: app display name (iOS `CFBundleDisplayName`, Android `app_name`), splash, onboarding, tab titles, notifications, SMS (e.g. "Mojo SOS: …"), automated paramedic call script ("This is an automated emergency alert from Mojo…"), emails, web page titles, favicon/manifest, dashboard headers, PDFs and CSV exports, help centre, legal and consent text, app store listing drafts.
- **02** The strap is the **Mojo Strap** on screens, pairing, BLE advertised name (e.g. `Mojo-XXXX`), device info and packaging text.
- **03** Logo placeholder: wordmark "Mojo" in Inter Semibold, mojo-teal, with the pulse-line glyph; app icon teal rounded square with mint pulse line. Replace with the client's logo when supplied.
- **04** Both languages: Swahili strings use "Mojo" as the product name too (not translated).
- **05** Internal code names (packages, folders, tokens, env vars, comments, docs) renamed from epi to mojo where it is a safe rename with tests passing; brand tokens become `mojo-*`.
- **06** **Do not change without asking:** iOS bundle ID, Android application ID, URL / deep-link schemes, Supabase project ref, database table names, BLE service UUIDs, domains, push-notification credentials. Changing these can break installs, links or paired straps. List each one with a recommendation in `docs/RENAME.md`.
- **07** CI check: no user-facing string, asset or store text contains "Epi" (whole word, case-insensitive — do not flag "epilepsy").

---

## 3. Roles

| Role | Sees | Notes |
|---|---|---|
| Patient (or guardian for under-18s) | Everything about themselves | Controls all sharing |
| Caregiver | Only categories the patient granted | Same mobile app, caregiver view |
| Clinician (doctor, clinical officer, nurse) | Linked patients, granted categories only | Must be verified, MFA required |
| Admin | Operations only — **no health data** | MFA; break-glass access needs a second admin, 60-min expiry, patient notified, audited |
| Clinic manager (optional) | Their clinicians, anonymised adherence | Created by admin |

---

---

## 4. Brand (keep the existing design; these tokens fill gaps)

| Token | Hex | Use |
|---|---|---|
| mojo-teal | #2F7F79 | Primary, buttons, headers |
| mojo-deep | #0B1F1E | Dark / night mode surface |
| mojo-mint | #7FE3D0 | Live-data highlights on dark |
| mojo-amber | #F5C26B | Medication reminders, "Taken" button (dark text) |
| mojo-gold | #FFC23C | ECG features only |
| mojo-green | #1D9E75 | Dose taken, normal range |
| mojo-red | #E24B4A | SOS, critical alerts, destructive actions only |
| mojo-violet | #7F77DD | Charts, clinician insights |
| mojo-sand | #B8A99A | Caregiver surfaces, illustrations |
| mojo-slate / steel / stone | #3A3F4B / #CFD3D8 / #888780 | Sidebar, borders, secondary text |

Rules: no hard-coded colours in components · red only where there is an emergency or destructive action · colour never the only signal (always icon + word like "Normal" / "Above limit") · Inter font, tabular numerals for vitals · touch targets ≥ 48 px, SOS ≥ 72 px hold-to-activate.

---

---

## 5. Requirements checklist

Every ID must be verified in the built app with evidence: where it lives in the code and a passing test with the ID in its name.

### Conditions — `CR-COND`
- **01** Conditions are configuration (`condition_templates`), not code: metrics, chart panels, rule templates, reminder types. Clinicians confirm all limits.
- **02** Group A (strap only): heart disease/failure, arrhythmia/AF, COPD, asthma, lung-infection recovery, sleep apnoea, epilepsy, Parkinson's, elderly/fall risk/dementia, post-surgery/hospital-at-home, malaria/typhoid.
- **03** Group B (strap + add-on): hypertension (BP), diabetes (glucose), kidney disease (BP + scale), pregnancy/pre-eclampsia (BP), stroke recovery (BP + arm movement).
- **04** Group C (trends + support): bipolar, depression/anxiety, sickle cell, HIV, TB.

### Strap — `CR-STRAP`
- **01** Support Concept A (screen, Confirm + SOS buttons) and Concept B (LED bar + SOS) via a firmware flag; app UI adapts.
- **02** Heart rate every 1 s (stored as 1-min averages + quality), SpO2 every 5 min and continuously in sleep, skin temp every 5 min, breathing rate from PPG, HRV nightly and on demand, steps/activity/sleep.
- **03** Detect falls, convulsive episodes, tremor, inactivity; wear detection — no vitals alerts when not worn, raise a data-gap notice instead.
- **04** Store ≥ 72 h on the strap; upload on reconnect, oldest first, deduplicated by sequence number.
- **05** Medication reminders stored on the strap, fire with phone off; Confirm button logs the dose with device time.
- **06** SOS: hold 3 s → 10 s cancel window; keep retrying and signal the wearer if not sent.
- **07** Battery ≥ 5 days target; warnings at 20% and 10% to patient (and caregiver if granted).
- **08** Bonded secure BLE pairing; signed over-the-air updates with staged rollout.
- **09** Every reading has a quality score; low-quality readings greyed out and never trigger critical alerts alone.

### Add-on devices (client add-ons) — `CR-ADD`
- **01** ECG: 30-second lead-I recording started from strap or app; upload, avg HR, device quality result (saved / signal weak / contact lost). **Release 1:** the recording is stored and shown to the clinician as a trace to review; no rhythm classification is shown to the patient. **Release 2 (flag `release2_ecg_rhythm`, off):** device rhythm classification and "irregular rhythm" notifications to patient and clinician, switched on only after validation and PPB guidance (section 8.1).
- **02** Bluetooth BP cuff (systolic, diastolic, pulse).
- **03** Glucose meter / CGM, mmol/L default with mg/dL option.
- **04** Weight scale.
- **05** Add-on readings on the same timeline as strap readings.
- **06** Only models on the admin-managed approved list can be paired.
- **07** Optional (flagged) bridge from Apple HealthKit / Android Health Connect.

### Patient app — `CR-PAT`
- **01** Tabs: Today · Vitals · Meds · Care · Me, SOS button on every screen.
- **02** Onboarding: phone/email sign-up, EN/SW, consent explainer, guardian flow for minors, add conditions, invite clinician, Care Circle and emergency contacts, step-by-step strap pairing, optional add-ons, plain-language permission requests.
- **03** Today: next dose, live HR/SpO2/temp with last-synced time, open alerts, appointments, quick logs, battery and worn status, nearest hospital.
- **04** Vitals: day/week/month charts with clinician limit lines, add-on readings, ECG record + list with save status and clinician review status. Out-of-range wording per the playbook ("Heart rate above your usual range"), never "abnormal". Rhythm wording ("irregular") appears only when `release2_ecg_rhythm` is on. The required line "A wrist ECG is a rhythm check, not a replacement for a hospital ECG." appears on first ECG use, on the ECG screen and in ECG help.
- **05** Meds: clinician's schedule (read-only), reminders, "Taken" once per dose offline, snooze, adherence %, refill reminders, stock count.
- **06** Care: Care Circle (add/remove, mark emergency, SMS-only contacts), per-person per-category permissions, linked clinicians, appointments, follow-ups, clinician notes.
- **07** Logs (symptoms, optional daily mood, events) and records (upload/view, cached offline).
- **08** Me: profile, devices + updates, location settings + saved home address and landmarks, "who viewed my data", export/delete data, language, accessibility, PIN/biometric lock, crisis resources always visible.
- **09** Full offline operation; encrypted local database with key in secure storage.

### Caregiver — `CR-CG`
- **01** Patient switcher; only granted data shown.
- **02** Full-screen loud emergency alert: name, what happened, live location map (only if granted and only during the alert), buttons: I've reached them / I can't reach them / Call them / Call ambulance / Directions to patient / Nearest hospital (escalation rules in CR-CG-06). Calm styling per the voice guide: name and time first, no alarm capitals.
- **03** Missed-dose alerts with "Remind them" and "Mark taken (I gave it)" if granted.
- **04** Add observations, help with follow-ups.
- **05** SMS-only contacts get alerts by SMS and reply with digits, per the playbook: "Reply 1 = yes, 2 = no". Replies are matched to the open alert by the sending number (and an alert reference if one contact has several open alerts).
- **06** Contact responses are "I've reached them" and "I can't reach them". Only "I've reached them" / reply 1 (or the patient's "I'm OK") stops escalation. "I can't reach them" / reply 2 is logged and does **not** stop it.
- **07** Contacts must accept before they become active: the person added gets "[Name] added you as their SOS contact on Mojo … Reply YES to accept or NO to decline." Pending or declined contacts get no alerts, and the patient sees their status.

### Clinician dashboard — `CR-CLIN`
- **01** Sign-up with licence number, cadre, registering body (KMPDC, COC, NCK) → pending → admin/register verification → clinician sets own password → MFA (TOTP, SMS fallback). Lock after 5 failed attempts for 15 min. Expired/revoked can't sign in; reminder 30 days before expiry.
- **02** Patient list sorted by urgency (critical alerts, warnings, missed doses, low adherence, strap not worn > 24 h); filters.
- **03** Patient overview: conditions, granted categories (greyed if not granted), vitals, trends with limits, add-on readings, motion events, doses over vitals, mood/sleep if granted, event timeline.
- **04** ECG strip viewer (25 mm/s grid, zoom, gain), mark reviewed with note.
- **05** Per-patient alert limit editor from templates; clinician confirms every value; preview "would have fired N times in last 7 days"; severity and pathway per rule.
- **06** Medication schedules (dose, times, days, snooze, max repeats, missed-after, escalation target, stock, refill threshold), versioned, synced to phone and strap.
- **07** Adherence report, export PDF/CSV.
- **08** Live alerts inbox: acknowledge, note, close with reason, full escalation and dispatch log.
- **09** Set preferred hospital per patient; see location trail during an alert if granted.
- **10** Follow-ups, appointments, notes visible to patient; own access history.

### Admin portal — `CR-ADM`
- **01** MFA, optional IP allowlist, every action audited, zero clinical read access.
- **02** Overview / system health (no patient names), red "Dispatch not live" banner in sandbox.
- **03** Clinician verification queue: evidence, register lookup, approve / reject with reason / request info, expiry, revoke.
- **04** Users and organisations; clinic manager role.
- **05** Device inventory and approved add-on models; firmware upload, staged rollout, pause, rollback.
- **06** Emergency routing: providers per region, priority, adapter type, test call, sandbox/live switch (live needs two admins), global escalation timings.
- **07** Hospital directory (KMHFL import), maps/routing provider settings, ambulance numbers per region.
- **08** Crisis resources per country and language.
- **09** Condition template editor.
- **10** Incidents (timings, false-alarm rate, failed deliveries) and break-glass flow.
- **11** Data-protection requests (export/delete/correct), retention settings.
- **12** Audit log viewer, feature flags, EN/SW content and notification templates.

### Emergency and escalation — `CR-SOS`
- **01** Triggers: SOS (strap/app), fall + no movement, seizure, critical limit exceeded for set duration.
- **01a** Fall check before the alert: strap shows "Fall detected / Are you OK? / [I'm OK]" and the phone asks the same; if no answer within the fall-check window (default 30 s, configurable), the SOS flow starts at T+0. "I'm OK" ends it with nothing sent.
- **02** Timeline (defaults, configurable): T+0 strap vibrates, app full-screen, emergency contacts alerted with location → T+2 min reminder "Is the patient safe?" → T+4 min no response → server calls paramedics automatically → contacts and clinician told, with dispatch reference.
- **03** Offline SOS: online push + realtime; no internet → SMS with location (iOS composer; Android direct send only where Play policy allows); no signal → queue, tell patient "Not sent yet — retrying", auto-retry; escalation clock runs from original time.
- **04** Response from patient or any emergency contact (app or SMS code) stops escalation. Cancel during countdown or before dispatch; after dispatch mark false alarm and notify provider if supported. False alarms shown to clinician, never penalised.
- **05** Warning-level alerts: clinician + granted caregivers only, no dispatch.
- **06** Dispatch adapters: automated phone call (TTS), provider API, call-centre queue; fall back to next provider; every attempt logged. Payload: location + accuracy + live link + home address/landmarks **first**, then name, time raised, trigger, call-back number, nearest suitable hospital, preferred hospital. Medical details (conditions, allergies, medicines) are included **only** if the patient chose them on the "Share key medical details with paramedics?" consent screen; location only if they allowed it on the location consent screen.
- **07** Automated call script follows the playbook order — location, name, time, consented medical details, call-back number — and repeats once. No brand message or filler.

### Location, contacts, hospitals, ambulance (client add-ons) — `CR-LOC`
- **01** GPS read when an SOS/alert starts, then every 15 s until it closes, with accuracy; not tracked otherwise. Expiring live-location link for contacts and ambulance.
- **02** Saved home address and landmarks added to SOS messages and dispatch.
- **03** Phone contacts used **only as a picker**; save only the chosen name and number; never upload the address book; manual entry if permission refused; numbers normalised to E.164 (default +254).
- **04** Hospitals from KMHFL (`health_facilities`, admin-curated) with capabilities (24 h emergency, ambulance, maternity, ICU, dialysis, cardiac, stroke); online maps as fallback.
- **05** Cache facilities within 50 km of home and current location; offline distance by haversine.
- **06** Ranking: open now / 24 h emergency → matches patient's conditions → travel time (online) or distance (offline); clinician's preferred hospital first.
- **07** Hospital card: name, level, distance, travel time, open now, capabilities, tap to call, Directions (deep link to Google/Apple Maps); in-app route map online; compass + distance offline.
- **08** Caregivers get directions to the patient, then to the hospital.
- **09** Large "Call ambulance" button dials the region's number from `emergency_providers` (never hard-coded); opens dialer (phones cannot call silently); works offline and prepares location SMS to contacts.
- **10** Optional (flagged): SMS a hospital's emergency desk about an incoming patient, only for facilities that opted in.

### Medication and mental health — `CR-MED`
- **01** Reminder on strap + phone → repeat at snooze interval up to max repeats → mark missed → notify caregiver/clinician as configured. Never dispatches paramedics.
- **02** A dose can only be logged once (strap, app or caregiver).
- **03** Refill alert at threshold.
- **04** Mental-health pathway: mood/sleep/activity rules notify clinician + trusted contact, show crisis resources in calm language; **never an automatic ambulance**; patient may still press SOS.
- **05** Mood data off by default, even for clinicians, until granted.

### Privacy and security — `CR-SEC`
- **01** Access starts empty; per-category grants: vitals, ecg, medications, adherence, appointments, events, symptoms, mood, records, location_on_sos, addon_readings.
- **02** Revoking removes access on next sync and clears cached data on that device.
- **03** Every clinician/caregiver view audited and visible to the patient.
- **04** Audit log insert-only; append-only tables reject edits except service-role DPA deletion.
- **05** Password rules, account lockout, MFA for clinicians and admins.
- **06** Encryption at rest (database, storage, local SQLite) and in transit.
- **07** Kenya Data Protection Act 2019: export / correct / delete; retention default 7 years (configurable).
- **08** Guardian accounts for minors, verified by ID upload + admin check.
- **09** Safety statements shown: "Mojo helps you and your care team watch trends. It does not diagnose or treat any condition. In an emergency, press SOS or call emergency services." and "Your reminders follow the schedule your clinician entered. Mojo never changes your dose." (Both are draft copy pending clinician + legal approval; log them as copy IDs.)
- **10** Consent screens per playbook Project 7: one consent per purpose (Welcome, Location, Medical details, SOS contact, Clinician link, Stop sharing, Offline), nothing pre-ticked, withdrawing as easy as agreeing, each consent stored with timestamp and copy version.
- **11** Lock-screen notifications never name a condition or a medicine ("Time for your 8:00 dose"); details only after unlock.
- **12** Clinician auth messages do not reveal which field is wrong or whether an account exists (wrong sign-in, forgot password); neutral wording for suspended/revoked licences; session timeout message.
- **13** No health data sent to analytics or advertising platforms; no ad pixels in the apps or dashboard; in-app analytics anonymised and behind a legal-approval flag. Track the playbook's events: onboarding steps, SOS contact added within 24 h, dose confirmed vs not, ECG attempts/saved/retakes, false SOS rate, help-content views.

---

---

## 6. Defaults (use when a decision is not yet made; keep configurable)

| Question | Default |
|---|---|
| Who stops escalation | Patient or any emergency contact |
| Time to dispatch | 4 min (reminder at 2 min), configurable per patient |
| Emergency contacts need the app? | No — SMS-only supported |
| SMS route | Patient's phone when offline; Africa's Talking gateway online (Twilio as second adapter) |
| Licence checks | Manual admin review + register lookup where permitted |
| Maps / routing | Google Maps Platform behind an adapter; OSRM fallback |
| Hospital data | KMHFL import, admin-verified; Places API only as fallback |
| Hospital arrival SMS | Off unless a facility opts in |
| Retention | 7 years for records and audit logs |
| Strap concept | Support both A and B |
| Languages | English and Swahili (all copy translation-ready; Swahili strings marked `needs_review` until approved) |
| Fall-check window | 30 s before the SOS flow starts |
| Release | Build Release 1 behaviour; Release 2 ECG rhythm features built but behind `release2_ecg_rhythm`, off |
| Name for the alerted person | One configurable term key `term.sos_contact` (playbook draft: "SOS contact", to confirm) |
| Name for the emergency service | One configurable term key `term.paramedics` (playbook draft: "paramedics", to test against "ambulance") |
| Strap A screen | 3 lines × 20 characters until the hardware lead confirms |
| Dose confirm on strap | Single press, with double-press available behind a setting for the usability test |

---

## 7. Stop and ask before

- Using the name in public or submitting to the app stores, until the **Mojo name is cleared** (trademark search in Kenya and the app stores).
- Switching ambulance dispatch from sandbox to live. This needs a signed ambulance provider agreement and a tested route per region; confirm 999/112 and provider numbers.
- Any go-live, store submission or marketing claim. Kenya DPA / ODPC registration and Pharmacy and Poisons Board review need human sign-off.
- Changing the existing design system or tech stack.
- Changing any identifier listed in CR-NAME-06.
- Turning on `release2_ecg_rhythm`.
- Producing a production or pilot build that contains clinical or legal copy without `approved` status in the copy log.
- Anything where this file, the build spec and the playbook disagree.

---

## 8. Content and copy (Content Playbook v1)

### 8.1 Where the playbook overrides the earlier spec

| Topic | Earlier spec said | Build this instead (playbook) |
|---|---|---|
| ECG results to patients | Show device classification, "Possible irregular rhythm" | Release 1: no rhythm result to the patient. Rhythm flags only in Release 2, behind a flag |
| Out-of-range wording | Free wording | "Heart rate above your usual range"; clinician alert "[Patient]: heart rate [value] bpm at [time], above the limit you set ([limit])" |
| SMS reply | `SAFE 1234` code | "Reply 1 = yes, 2 = no" |
| Who stops escalation | Any response from a contact | Only "I've reached them" / 1, or patient "I'm OK". "I can't reach them" / 2 does not stop it |
| Emergency contacts | Added by patient, active at once | Must accept by SMS (YES/NO) first |
| Dispatch payload | Conditions, allergies, medicines by default | Only medical details the patient chose to share; location first |
| Term for contacts | "Emergency contact" | One term key, draft "SOS contact" |
| Mistake-proof tone | Not specified | Voice rules: calm, no exclamation marks or capitals, "Dose not confirmed" not "You forgot" |
| Lock screen | Not specified | No condition or medicine names |
| Analytics | Not specified | No health data to analytics/ads, no pixels in apps |

### 8.2 Copy catalogue and checks
- Store every string in `packages/shared/i18n` with: `id` (playbook IDs where given, e.g. `SOS-01`, `CON-02`; otherwise `AREA-NN`), `en`, `sw`, `surface` (strap_a / strap_b / push / sms / app / web / voice), `review` (none / clinician / legal / both), `status` (draft / approved), `version`, `source` (playbook section).
- Mirror the playbook's approval log as `docs/COPY_LOG.md`, generated from the catalogue.
- CI checks: strap A strings ≤ 3 lines × 20 characters; push and lock-screen strings contain no condition or medicine names (check against the condition and medication vocabularies); no `!`, no all-caps words, no words on the "avoid" list (diagnoses, detects, abnormal, arrhythmia, medical-grade, clinically proven, guaranteed, instant, always, rescue, EMS); sentences ≤ 15 words for app copy; buttons start with a verb; every string has `en` and `sw`.
- Release builds fail if any `review != none` string is still `draft`. Dev and pilot-without-patients builds show such strings with a visible "DRAFT" marker in dev mode only.

### 8.3 Strap and SOS copy to wire up
- Concept A screen text: the 13 events in playbook Project 6 (dose due, dose confirmed, dose not confirmed, ECG start/recording/done/retake/contact lost, fall check, SOS sent, help called, battery low, phone not linked), sent to the strap as string IDs with placeholders filled on the phone.
- Concept B: implement the light and vibration patterns in the playbook table as named firmware patterns (`dose_due`, `dose_confirmed`, `ecg_recording`, `ecg_retake`, `fall_check`, `sos_sent`, `battery_low`, `phone_not_linked`), distinguished by pulse count and length, not colour alone; "phone not linked" is silent at night. Treat them as proposals the hardware lead can tune in config.
- SOS flow: wire each message in playbook Project 5 (steps 0–4 and false alarm) to its escalation step, recipient and channel. Timings come from config, never from copy; messages render the actual time.

### 8.4 Out of scope for this build
The landing page, SEO articles, pilot recruitment emails and WhatsApp messages in playbook Project 9 belong to the marketing workstream. Build only the in-app help centre FAQ and the ECG quick-start card (Release 2 content, behind the flag).
