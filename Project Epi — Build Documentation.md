# Project Epi — Build Documentation

Oct 12, 2026 · @john

## 1. Overview

Epi is a care-coordination app that connects a patient, their trusted caregivers and their verified clinician, and it must keep working with no internet. This document is the build guide: follow the sections in order, and tick off the roadmap in section 9.

**Goals**

- Give patients one place for conditions, medications, care network, SOS, doctor link and records.
- Give clinicians a verified view of patients, health trends, events and follow-ups.
- Give caregivers only the information the patient or guardian has authorized.
- Stay fully usable offline and sync cleanly when the connection returns.

**Decisions made**

| Area | Decision |
| --- | --- |
| Platforms | Mobile apps (iOS + Android) plus a web dashboard for clinicians |
| Backend | Supabase (Postgres, Auth, Realtime) |
| Works offline | Logging events and observations; medication reminders and "Taken" check-ins; SOS fallback via SMS; viewing records and care circle |
| Design | Three dashboards designed on the Project Epi canvas (patient, caregiver, clinician) |

**Proposed, to confirm:** React Native with Expo for the mobile apps, Next.js for the clinician dashboard, and SQLite on the device as the offline store. Sections 4 and 5 explain why.

## 2. Differentiators: what makes Epi unique and premium

Existing epilepsy apps mostly compete on seizure diaries, PDF reports, caregiver push alerts and wearable detection. Epi should win on consent, offline reliability and the clinician workflow instead. For the client pitch, lead with the first three rows.

| # | Differentiator | What to build | Phase |
| --- | --- | --- | --- |
| 1 | Consent as the headline feature | Per-category sharing the patient controls and can revoke, plus an activity list showing who viewed what | 1 (RLS, grants), 3 (grants screen) |
| 2 | True offline mode with SMS fallback | Everything in section 5, presented as a promise: Epi works with no signal | 2, 3 |
| 3 | SOS with confirmed response | First contact to tap "I'm on it" is shown to everyone; the alert escalates to the next contact if nobody replies | 3 |
| 4 | One-page pre-visit brief | Auto summary for the clinician: what changed since the last visit, missed doses, open follow-ups | 4 |
| 5 | Bystander card | Lock-screen card with plain first-aid steps and contact buttons, in English and Swahili | 3 |
| 6 | Discreet mode | Neutral app name and notifications that do not mention the condition | 2 |
| 7 | Wearable import, not detection | Accept data from watches and devices; do not claim seizure detection, which can count as a regulated medical device | After launch |
| 8 | Premium feel | Night-safe dark theme, large one-handed controls, calm tone, as in the Project Epi design canvas | All phases |

**Notes**

- Items 3 and 5 add scope to the section 9 roadmap. Confirm them with the client before phase 3 starts.
- Item 7 needs regulatory advice before any detection claim is made in marketing or in the app.
- The market scan used a small sample of listings, so check each competitor yourself before claiming a gap in the pitch.

**Sources (search results, 12 Oct 2026)**

- [Seizures Diary, App Store](https://apps.apple.com/app/id6770291683)
- [MyMedicWatch, Epilepsy Action technology guide](https://www.epilepsy.org.uk/epilepsy-technology-guide/epilepsy-apps/mymedicwatch)
- [EpiMonitor by Empatica, listing](https://www.similarweb.com/es/app/google/com.empatica.healthmonitor.epilepsy/)
- [EpiCentr: Seizure Detection, listing](https://www.similarweb.com/de/app/apple/1640509073/)
- [Apps like inEpilepsy, including Aura](https://appshunter.io/ios/app/inepilepsy/id1630905082/similar)

## 3. Users, roles and consent

The patient (or guardian) owns all data, and every other role sees only what a consent grant allows. Build this rule into the database, not just the screens.

| Role | Can see | Can do | Needs |
| --- | --- | --- | --- |
| Patient / guardian | Everything about themselves | Log events, take medication, send SOS, manage Care Circle and grants | Account (guardian for minors) |
| Caregiver | Only items the patient granted (for example medication schedule, appointments, event summaries) | Receive authorized emergency alerts, track appointments and reminders, record observations, assist follow-ups | Invitation accepted by patient |
| Clinician | Patients who linked them, within granted scope | Review trends and events, manage follow-ups | Verified clinician status plus patient link |

**Consent rules**

1. Access starts empty. A caregiver or clinician sees nothing until the patient grants it.
2. Grants are per data category (medications, appointments, events, records) and can be changed or revoked at any time.
3. Emergency alerts go only to contacts the patient marked as emergency recipients.
4. Clinician access is checked against a verification record, and every view is written to an audit log.
5. Revoking a grant removes access on the next sync, and the app clears cached data for that patient.

## 4. Architecture

&#91;embedded content: system architecture · mobile, Supabase, clinician web, SMS fallback\]

Each phone keeps its own copy of the data and syncs with Supabase when it can; the clinician dashboard reads from Supabase only what the patient granted.

**Proposed stack (confirm with the client)**

| Layer | Choice | Why |
| --- | --- | --- |
| Mobile apps | React Native with Expo, TypeScript | One codebase for iOS and Android, shared types with the web |
| Offline store | SQLite on the device plus a sync layer (PowerSync or WatermelonDB) or a small custom outbox | Reads and writes never wait for the network |
| Clinician dashboard | Next.js with TypeScript | Web access for clinicians, reuses the same Supabase client |
| Backend | Supabase: Auth, Postgres with RLS, Realtime, Edge Functions | Fast to build, and RLS enforces consent in the database |
| Alerts | Push notifications plus Edge Function for SOS dispatch | Online path for emergency alerts |
| SOS fallback | SMS sent from the patient's phone | Works with no internet |

## 5. Offline-first design

The device database is the source of truth for the screen; the network only syncs it. The app never waits for the internet to log an event, tick a dose or open a record.

**Core pattern**

1. Every write goes to the local SQLite database first and also into an outbox table with a client-generated UUID and timestamp.
2. A sync worker pushes the outbox to Supabase when a connection exists, then pulls changes since the last sync token.
3. Supabase Realtime pushes live changes (alerts, grant changes) while online; the pull covers anything missed offline.
4. Records and Care Circle data are cached on the device so they can be viewed offline.

**What works offline, and how**

| Feature | Offline behavior | Sync rule |
| --- | --- | --- |
| Log events and observations | Saved locally and shown instantly | Append-only; never overwritten, so no conflicts |
| Medication reminders | Scheduled as local notifications on the device | Schedule changes sync down; reminders keep firing without a connection |
| "Taken" check-in | Recorded locally with the real time it was tapped | Append-only; the device timestamp is kept as the true time |
| SOS | Falls back to SMS to emergency contacts (section 6) | Event is logged and the server is told once online |
| View records and Care Circle | Read from the local cache | Pulled on every sync; cleared when access is revoked |

**Conflict rules**

- Events, observations and check-ins are append-only records, so two devices never conflict.
- Editable items (medication plan, grants) use last-write-wins with a version number; the server rejects a stale version and the app re-pulls.
- Grant changes always win from the server, because revoking access must not be undone by an old offline edit.

**Local security.** Encrypt the on-device database and keep the key in the platform keystore (iOS Keychain, Android Keystore). Lock the app with biometrics or a PIN.

## 6. SOS flow

&#91;embedded content: SOS flow · online push, offline SMS, queue and retry\]

The SMS path is the offline fallback and the main differentiator, so build and test it early.

1. The patient holds the SOS button; a short countdown allows cancelling an accidental press.
2. Online: the alert goes to contacts marked as emergency recipients, with live location, through Supabase and push notifications.
3. Offline: the phone composes an SMS to the same contacts, with location if the phone has it.
4. No signal at all: the SOS is queued, the patient is told plainly it is not sent yet, and the app retries automatically.
5. Every SOS is logged in sos\_events with the channel used.

**Platform limits to check before building**

- iOS only lets an app prefill the SMS composer; the patient taps send. It cannot send silently in the background.
- Android can send directly with the SMS permission, but Google Play restricts that permission, so check the current policy and keep the composer as a fallback.
- Test on real phones with real SIM cards in each country you launch in.

## 7. Data model and row-level security

Start with these Postgres tables in Supabase, and turn on row-level security (RLS) for every one of them before writing any app code.

| Table | Purpose | Key columns |
| --- | --- | --- |
| profiles | One row per user and their role | id, role, full\_name, guardian\_of |
| conditions | Patient conditions and triggers | id, patient\_id, type, notes |
| medications | Medication plan | id, patient\_id, name, dose, schedule, version |
| medication\_logs | "Taken" check-ins | id, medication\_id, taken\_at (device time), synced\_at |
| events | Events logged by patient or caregiver | id, patient\_id, logged\_by, occurred\_at, details |
| observations | Caregiver notes | id, patient\_id, author\_id, occurred\_at, note |
| care\_circle | Trusted contacts | id, patient\_id, member\_id, phone, is\_emergency |
| grants | What each person may see | id, patient\_id, grantee\_id, category, revoked\_at |
| clinician\_links | Patient-clinician relationship | id, patient\_id, clinician\_id, verified\_at |
| followups | Follow-up tasks | id, patient\_id, clinician\_id, due\_at, status |
| sos\_events | SOS history | id, patient\_id, sent\_at, channel, location |
| audit\_log | Who viewed what | id, actor\_id, patient\_id, action, at |

**RLS rules to write first**

1. A patient can read and write rows where patient\_id is their own id.
2. A caregiver can read a row only if an active (not revoked) grant exists for that patient and category.
3. A clinician can read a row only with a verified clinician\_links record and an active grant.
4. Only the patient can create or revoke grants.
5. audit\_log is insert-only for the app and readable by the patient.

Test each rule with a second account before moving on: the most important check is that a caregiver with no grant gets zero rows.

## 8. Security, privacy and compliance

This app holds health data, so treat security as a feature from day one, not a final step.

**Build checklist**

- [ ] Encrypt data in transit (TLS) and at rest (Supabase default plus on-device encryption).
- [ ] Enforce RLS on every table and test with accounts for each role.
- [ ] Use multi-factor sign-in for clinicians, and biometric or PIN lock on the mobile apps.
- [ ] Verify clinicians before activation (license or institution check) and store the result in clinician\_links.
- [ ] Write an audit\_log entry for every clinician or caregiver view of patient data.
- [ ] Keep API keys and service roles out of the app; only the public anon key ships in the client.
- [ ] Collect only what a feature needs, and let patients export or delete their data.
- [ ] Add a clear consent screen when the patient grants or revokes access.
- [ ] Handle minors through a guardian account with the guardian controlling grants.

**Compliance.** Health data is regulated, and the rules depend on where patients live. Confirm with the client which laws apply (for example Kenya's Data Protection Act 2019, and HIPAA or GDPR if you serve US or EU patients) and get legal review before launch. This document does not replace that advice.

**Location data.** SOS shares live location only at the moment an SOS is sent, and only with the emergency contacts.

## 9. Build roadmap

Build in this order, and do not start a phase until the previous gate passes. Set dates with the client once the open questions in section 11 are answered.

&#91;embedded content: build roadmap · 5 phases, 5 gates\]

| Phase | Build | Gate (exit criteria) |
| --- | --- | --- |
| 1. Foundation | Supabase project, tables from section 7, RLS rules, auth with the three roles, one test account per role | A caregiver with no grant sees zero rows on every table |
| 2. Offline core | Expo app shell, local SQLite, outbox and sync, event and observation logging, medication schedule and "Taken", local reminders | Every offline test in section 10 passes in airplane mode |
| 3. Circle + SOS | Care Circle, invitations, grants screen, SOS online and SMS fallback, emergency alerts for caregivers | SOS works online, offline by SMS, and queues with no signal, on real phones |
| 4. Clinician | Next.js dashboard, clinician verification, patient roster, health trends, events review, follow-ups, audit log | An unverified clinician sees nothing; every view is audited |
| 5. Launch | Security review, usability tests with real patients and caregivers, compliance review, store submissions | Client sign-off |

## 10. Testing and QA checklist

Test offline behavior on real phones, not only emulators, because notifications and SMS behave differently on devices.

**Offline and sync**

- [ ] Turn on airplane mode, log an event and an observation, tick a dose, then reconnect: all appear on the server once, with the original times.
- [ ] Reboot the phone offline: medication reminders still fire.
- [ ] Edit the same medication on two devices offline: the stale edit is rejected and the app recovers.
- [ ] Revoke a grant while the caregiver is offline: cached data is cleared after their next sync.
- [ ] Kill the app mid-sync: no duplicates and no lost records.

**SOS**

- [ ] Send SOS online: every emergency contact is alerted with location.
- [ ] Send SOS in airplane mode with SMS available: the message is composed and sent to the emergency contacts.
- [ ] Send SOS with no signal at all: the app queues it, tells the patient plainly it is not sent, and retries automatically.
- [ ] Cancel window: an accidental SOS can be cancelled during the countdown.

**Permissions and security**

- [ ] A caregiver with no grant sees zero rows on every table.
- [ ] An unverified clinician sees nothing.
- [ ] Every clinician and caregiver view appears in the audit log and in the patient's activity list.

**Usability.** Test the patient app with real patients and caregivers, including at night and one-handed, and confirm text stays readable at large font sizes.

## 11. Open questions to confirm with the client

- [ ] Which conditions and regions launch first, and which laws apply to patient data there?
- [ ] Is the target an individual patient app, or will clinics or hospitals roll it out to their patients?
- [ ] How are clinicians verified (license number, institution letter, manual review)?
- [ ] Who can be an emergency contact, and do they need the app or only a phone number for SMS?
- [ ] Which SMS route for the fallback: the patient's own phone SMS (works offline, no cost to you) or a server SMS gateway (needs signal on the server side)?
- [ ] How long must records and audit logs be kept?
- [ ] Do minors use the app, and how is guardian consent proven?
- [ ] What is the business model (free, subscription, clinic-paid), since it affects scope?
- [ ] Is a native emergency integration needed, such as calling emergency services directly?
