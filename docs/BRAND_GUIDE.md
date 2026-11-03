# Duara (codename Project Epi): Market, Brand, UX, Permissions and Security Guide

Prepared 14 Oct 2026 · companion to *Project Epi: Build Documentation* (12 Oct 2026)

**Naming:** the public app name is **Duara** (Swahili for "circle"). **Project Epi** stays as the internal codename for the repo, build documentation and client files. Final name is subject to the trademark and language checks in section 3.1.

This guide covers what the market looks like today, how Duara should stand apart, and the concrete rules for brand, imagery, responsive design, usability, permission requests and security. Sections 9 and 10 turn it into a success plan and a hand-off for Claude Code.

**How much to trust it.** The market scan is a desk scan of store listings, charity guides, two research reviews and regulator or law-firm summaries, not hands-on testing of competitors. Some sources are older (flagged below). Check every competitor yourself before the client pitch. Legal points are summaries, not legal advice.

---

## 1. Market scan

### 1.1 What exists today

| Product | What it does well | Where Duara can differ |
| --- | --- | --- |
| Seizure Tracker | Times and videos seizures, keeps a library, syncs to a web account, graphs events, logs rescue medication and VNS use (Play listing updated 2 Jul 2026) | Single-account diary; no per-category consent between patient, caregiver and clinician was found in the listing |
| Epsy (LivaNova) | Seizure log, medication reminders, notes and video, Apple Health link, report for doctor visits | Reports flow out as documents; no live clinician workflow found |
| Epilepsy Journal | One-press logging, trend graphs, shareable physician report | Built around the diary and the report |
| EpiCentr and SeizAlarm | Apple Watch based detection, alerts to contacts with location, journal, nocturnal monitoring | Needs a compatible watch; detection claims carry regulatory weight; Apple-centred |
| Seizure First Aide (Epilepsy Foundation of Minnesota) | Real-time first-aid steps for observers, plus a seizure timer | First aid only; not a care-coordination tool |
| Inspyre by SmartMonitor | Listed as an FDA-cleared wrist wearable that alerts caregivers | Hardware product; a different category |

**Older research context.** A 2021 systematic analysis (apps searched in 2018) found seizure tracking and seizure response were the most common features, followed by treatment management and medication adherence. It also found low install rates and said no single app met every need. Another review found the best-scoring apps recorded seizures, kept a full history, stored doctor details, scheduled visits and recorded prescriptions. These are dated, but they match what current listings still emphasise: diaries, reports and alerts.

### 1.2 Pattern across the scan

1. Most products are **single-user diaries** that export a report. Few appear to treat sharing as a controlled, revocable, audited relationship.
2. **Detection apps depend on a watch and a smartphone,** and detection is the regulated end of the market.
3. **Offline behaviour is rarely a headline promise** in the listings read. This was not verified in-app, so test it.
4. **First aid for bystanders** exists as a separate app, not inside a coordination product.
5. Nothing found was built for Kenyan realities (Swahili, low-end Android, feature-phone contacts). A local scan of Kenyan health apps was not covered here and should be done.

### 1.3 Kenya context (why Duara's design choices matter)

- Android is the dominant platform: about 92% in May 2026 per StatCounter, and 94.2% in a 2025 Cloudflare survey, as reported by The Kenya Times. TECNO, Infinix, Samsung, OPPO and Xiaomi lead.
- The Communications Authority reported 52.3 million smartphones on Kenyan networks by end of June 2026, which it put at 63.7% of 78.7 million connected devices (as reported by Citizen Digital, 2 Oct 2026). Roughly a third of connected devices are therefore not smartphones, and those cannot receive app push alerts. (The article's own figures do not match exactly, so use "about a third" and confirm with the CA report.)
- Design consequence: **emergency contacts must work with SMS only**, the app must run well on entry-level Android, and iOS is a minority but still needed.

---

## 2. What makes Duara unique

Lead with consent, offline and the Kenyan fit. Do not lead with detection.

| # | Edge | Proof the client can see | Competitor gap (verify before pitching) |
| --- | --- | --- | --- |
| 1 | **Consent you can see and undo.** Per-category grants, an activity list of who viewed what, instant revoke | Grants screen and "who viewed what" list on the patient home | Not seen in diary-style listings |
| 2 | **Works with no signal, with an SMS path for SOS** | Airplane-mode demo: log, tick a dose, send SOS | Offline not highlighted in listings |
| 3 | **SOS with confirmed response and escalation** | "I'm on it" shown to everyone; next contact alerted if no reply | Alerts exist; confirmed ownership was not seen |
| 4 | **SMS-only emergency contacts** | A contact with a basic phone gets a full alert by SMS | Apps assume a smartphone on both sides |
| 5 | **Pre-visit brief for the clinician** | One page: changes since last visit, missed doses, open follow-ups | Reports exist; a change-since-last-visit brief was not seen |
| 6 | **Bystander card in English and Swahili** | Lock-screen friendly steps and call buttons | First-aid app exists in English; Swahili not confirmed |
| 7 | **Discreet mode** | Neutral name, icon and notifications | Not seen |
| 8 | **Guardian to adult hand-over and anti-coercion controls** | A guardian's grants transfer to the patient at 18; the patient can revoke fast | Rarely discussed |
| 9 | **Seizure-safe by design** | No flashing UI anywhere (section 4.6) | Rarely stated |

**Claims to avoid.**
- Do not claim seizure detection or prediction. Detection can fall under medical-device rules; take regulatory advice first (already in your build doc).
- Do not say "first" or "only" until each competitor is checked.
- Do not promise delivery of an SMS or push. Promise "Duara tells you plainly whether it was sent."

**One-line positioning (draft).** *Duara keeps the people who care for you in the loop, only as far as you choose, even when there is no signal.*

---

## 3. Brand identity

### 3.1 Name and discretion

**Public name: Duara.** Swahili for "circle". It matches the logo idea (the patient at the centre, trusted people around, the patient choosing who is inside), is short and easy to say in English and Swahili, and does not name any condition. **Project Epi** remains the internal codename.

| Item | Decision |
| --- | --- |
| Home-screen label | "Duara" (or the user's Discreet alias) |
| Store title | "Duara: Care Circle" (suggested) |
| Store description | May say it supports people living with epilepsy, so patients can find it. Only the installed app is discreet, not the store page |
| Discreet alias | Editable by the user; placeholder "Daily Notes"; matching neutral icon and notification text |
| Tagline options | "Your circle, your choice." and "Care that works even without signal." |
| Backup names | Tulia ("be calm"), Jirani ("neighbour"), Pamoja ("together"), CareRing. Each is likely already in use somewhere, so check before choosing |

**Naming rationale for the client.** The name says what the product does (a circle of care the patient controls) rather than what the patient has. That supports privacy, keeps the home screen discreet, and gives the brand a local, warm identity that can still be explained in English.

**Checks before the name is final**
- [ ] Trademark search in Kenya (KIPI) and any other launch country, plus domain, app-store and social-handle availability.
- [ ] A native Swahili speaker confirms meaning, tone and spelling; also check the word has no unintended meaning in other languages you plan to serve.
- [ ] The client approves the name and the logo concept together.
- [ ] Confirm no existing health or care product named Duara in the target markets.

**Using the name in copy:** the name is a proper noun in English. In Swahili strings, avoid using it as a grammatical subject (write "programu hii", "this app", where agreement would be needed) until a Swahili reviewer sets the preferred pattern.

### 3.2 Voice

- Calm, plain, warm. Reading level around Grade 6 to 8. Short sentences. Same meaning in English and Swahili, not word for word.
- Person-first language ("person with epilepsy"). Avoid "suffer", "victim", "attack" and alarm words in notifications.
- After an event a person may be drowsy or confused, so confirmation screens use one clear action and big text.
- Error copy says what happened and what to do next, never a code alone.

### 3.3 Colour system

Palette idea: a night-sky ink for calm, teal for trust and care, amber for gentle attention, and coral reserved for SOS. Contrast ratios below were computed against WCAG 2.2 (4.5:1 for normal text, 3:1 for large text and for the edges of controls).

**Dark theme (default at night)**

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `bg` Night Ink | `#0B1620` | App background | n/a |
| `surface` | `#112230` | Cards | n/a |
| `elevated` | `#1A3144` | Sheets, menus | n/a |
| `text` | `#EAF2F6` | Body text | 16.1:1 on bg, 11.8:1 on elevated |
| `textMuted` | `#A8BDCA` | Secondary text | 9.4:1 on bg, 8.3:1 on surface |
| `primary` Calm Teal | `#4FC3B7` | Main buttons, links | 8.5:1 on bg; bg-coloured text on it 8.5:1 |
| `attention` Warm Amber | `#F4B860` | Reminders, due doses | 10.3:1 on bg |
| `sos` Coral | `#FF7A6B` | SOS only; dark text on it | 7.2:1 |
| `success` Sage | `#7BD3A0` | Taken, synced | 10.2:1 on bg |
| `info` Sky | `#7FB7F0` | Info, offline badge | 8.6:1 on bg |
| `controlBorder` | `#4F6D84` | Input and button edges | 3.4:1 on bg |

**Light theme (daytime, clinician web default)**

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `bg` | `#F5F9FA` | Background | n/a |
| `surface` | `#FFFFFF` | Cards | n/a |
| `text` | `#0F1E29` | Body | 16.0:1 on bg, 17.0:1 on white |
| `textMuted` | `#4A6072` | Secondary | 6.2:1 on bg, 6.6:1 on white |
| `primary` | `#0B7A70` | Buttons, links; white text on it | 5.2:1 |
| `attention` text | `#8A5A00` | Amber text on white | 5.9:1 |
| `sos` | `#C2362B` | SOS only; white text on it | 5.5:1 |
| `success` | `#1F7A4D` | Taken, synced | 5.3:1 with white |
| `info` | `#1F5FA8` | Info | 6.4:1 with white |
| `controlBorder` | `#647B8D` | Input and button edges | 4.4:1 on white |

Rules:
- A decorative light divider (such as `#D3DEE5` on white, 1.4:1) is fine for separators but never for the edge of an input or button.
- **Never rely on colour alone.** Every status has an icon and a word ("Taken", "Not sent yet").
- Coral appears **only** for SOS and destructive confirmations. Keep it static (see 4.6).
- Re-check contrast whenever a hex changes. The tables above are the verified set.

**Design tokens (TypeScript, shared by Expo and Next.js)**

```ts
export const tokens = {
  dark: {
    bg: '#0B1620', surface: '#112230', elevated: '#1A3144',
    text: '#EAF2F6', textMuted: '#A8BDCA',
    primary: '#4FC3B7', onPrimary: '#0B1620',
    attention: '#F4B860', sos: '#FF7A6B', onSos: '#0B1620',
    success: '#7BD3A0', info: '#7FB7F0', controlBorder: '#4F6D84',
  },
  light: {
    bg: '#F5F9FA', surface: '#FFFFFF', elevated: '#FFFFFF',
    text: '#0F1E29', textMuted: '#4A6072',
    primary: '#0B7A70', onPrimary: '#FFFFFF',
    attention: '#8A5A00', sos: '#C2362B', onSos: '#FFFFFF',
    success: '#1F7A4D', info: '#1F5FA8', controlBorder: '#647B8D',
  },
  radius: { sm: 8, md: 14, lg: 22, pill: 999 },
  space: [0, 4, 8, 12, 16, 24, 32, 48],
  touch: { min: 48, sos: 72 },
} as const;
```

### 3.4 Typography

- **Atkinson Hyperlegible** (open-source, designed for readability by people with low vision) for all text, weights 400 and 700. Bundle the font files so it works offline, with the system font as fallback.
- Base text 16 sp; important instructions 18 to 20 sp; nothing under 14 sp. Support OS text scaling up to 200% without clipped text or broken layouts.
- Numbers (doses, times) in tabular figures, and always show unit and time of day.

### 3.5 Logo concept

A **Care Circle** mark (it also reflects the name Duara, meaning circle): a solid centre (the patient) inside open rings (the people around them). The gap in the rings suggests "you choose who is inside". Works in one colour, small sizes and as a neutral icon in Discreet mode.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Duara">
  <circle cx="48" cy="48" r="10" fill="#4FC3B7"/>
  <circle cx="48" cy="48" r="26" fill="none" stroke="#4FC3B7" stroke-width="6"
          stroke-linecap="round" stroke-dasharray="130 34" transform="rotate(-60 48 48)"/>
  <circle cx="48" cy="48" r="42" fill="none" stroke="#4FC3B7" stroke-opacity=".55"
          stroke-width="6" stroke-linecap="round" stroke-dasharray="200 64"
          transform="rotate(100 48 48)"/>
</svg>
```

Treat this as a starting concept for a designer to refine, not a finished brand.

### 3.6 Imagery and icons

**Style.** Calm, human and local. Use soft vector illustration for onboarding and empty states, and real photography sparingly.

| Where | Image direction |
| --- | --- |
| Onboarding | Three illustrations: a person at the centre of a circle of hands; a phone with a "no signal" mark and a check; a clinician and a patient looking at one page |
| Empty states | A single object (pill organiser, notebook, phone) with a short line of text |
| Care Circle | Initial avatars by default; optional user photo from the system picker |
| Marketing and web | Photos of Kenyan families, caregivers and clinicians in everyday settings, shot with written consent |
| Bystander card | Simple line diagrams (side position, clear space, time it). Have a clinician approve them |

**Do not show:** a person mid-seizure, flashing or strobing graphics, flashing lights, hospital-drama stock photos, or anything that stigmatises. Avoid red-heavy visuals.

**Icons.** One open-source set (Lucide or Phosphor), 24 px grid, 2 px stroke, always paired with a text label on primary actions.

**Image delivery for low data and low-end phones**
- Vector first. Raster images as WebP or AVIF, ideally under 100 KB each, and bundled in the app for core screens so they work offline.
- Always provide alt text; mark purely decorative images as such.
- Check the licence of every photo or illustration; keep a licence log in the repo.

---

## 4. Responsive design for all devices

### 4.1 Mobile apps (iOS and Android)

- Design for 320 to 430 dp wide phones first, then 600 dp+ tablets and foldables. Respect safe areas, notches and gesture bars. Support portrait and landscape.
- **One-handed use:** primary actions sit in the lower 40% of the screen. Keep the SOS control reachable with a thumb.
- Lists are virtualised; screens render from the local database so they open instantly with no spinner.
- **Performance targets** (suggested, tune with the client): usable cold start in about 3 seconds on a 2 GB RAM Android phone; no jank when scrolling the event list; small install size; Hermes enabled in Expo.
- **Data-light mode:** sync small deltas, no auto-download of media over mobile data, an "offline status" badge, and a sync log the user can read.
- Handle aggressive OEM battery management. Many entry-level Android brands stop background work, so include a one-time "keep reminders working" guide screen with steps for the user's phone, and test reminders on real TECNO, Infinix and Samsung devices.

### 4.2 Clinician web dashboard (Next.js)

| Breakpoint | Layout |
| --- | --- |
| under 480 px | Single column; roster as cards; trends in swipeable panels |
| 480 to 767 px | Single column, larger cards |
| 768 to 1023 px | Two panes (roster and patient) on tablets |
| 1024 px and up | Three-area layout: roster, patient summary, detail |

- Content reflows at 400% zoom without sideways scrolling (except data tables, which scroll inside their own container).
- Full keyboard navigation, visible focus rings, and no hover-only actions.
- The **pre-visit brief prints to one A4 page** with a print stylesheet and exports to PDF.
- Charts have a table alternative and use shapes plus colour, not colour alone.

### 4.3 Test matrix

| Area | Cover at least |
| --- | --- |
| Android | Entry-level (TECNO or Infinix, 2 to 3 GB RAM), a Samsung A-series, one recent flagship, Android 12 to 15 |
| iOS | A small screen (iPhone SE class) and a large one, current and previous iOS |
| Tablets | One 10-inch Android or iPad |
| Web | Chrome, Safari, Firefox and Edge at 100%, 150% and 200% zoom |
| Settings | Text size 200%, bold text, reduce motion, dark and light, grayscale, battery saver, airplane mode |
| Assistive tech | TalkBack, VoiceOver, keyboard only, switch access if possible |

---

## 5. Easy to use for everyone

### 5.1 Principles

1. **One job per screen.** The home screen answers: Is my next dose due? Do I need help? What changed?
2. **Fewer taps in the worst moment.** Logging an event takes at most three taps; extra detail is optional and can be added later.
3. **Words plus icons, English and Swahili,** switchable at any time, with the language chosen at first launch from the phone's setting.
4. **Forgiving.** Undo for the last action, confirmation before anything destructive, and clear "saved on this phone" feedback while offline.
5. **Honest status.** "Saved on this phone", "Sent", "Not sent yet, will retry". Never show a false success.

### 5.2 Accessibility checklist (target WCAG 2.2 AA, with the epilepsy-relevant AAA item)

- [ ] Text contrast 4.5:1, large text and control edges 3:1 (tokens above).
- [ ] Touch targets at least 48 dp, with 8 dp spacing; SOS at least 72 dp tall. (WCAG 2.2 AA requires only a 24 px minimum, so this is a deliberate step above it.)
- [ ] Every control has an accessible name, role and state; screen-reader order matches visual order.
- [ ] Layout survives 200% text scale; no text in images.
- [ ] No gesture is the only way to do something. The SOS "hold" has a two-step alternative for people who cannot hold.
- [ ] Time limits are adjustable; the SOS countdown can be extended.
- [ ] Forms: visible labels, clear error text, no re-typing of data already given.
- [ ] Respect reduce-motion; provide captions or transcripts for any video.
- [ ] Screen readers announce sync and SOS status changes.

### 5.3 People to design for

| Person | Design response |
| --- | --- |
| Patient who is drowsy or confused after an event | Large single "I'm OK" and "I need help" actions |
| Older caregiver or low digital confidence | Short guided setup, big text, a "call instead" button |
| Caregiver with a basic phone | SMS-only path; nothing to install |
| Guardian of a minor | Guardian controls grants; clear hand-over rules at 18 |
| Clinician in a busy clinic | Roster, trends and brief in two clicks; keyboard shortcuts |
| Low-vision or blind user | Screen-reader support, high contrast, scalable text |
| Limited data or storage | Data-light mode, small app, offline by default |

---

## 6. Permissions and external requests

**Principle: ask for the least, as late as possible, with a reason in plain words, and never block core use if the answer is no.**

### 6.1 Permission map

| Permission or access | Needed for | When to ask | If denied | Notes |
| --- | --- | --- | --- | --- |
| **Notifications** (Android 13+ runtime, iOS prompt) | Dose reminders, SOS alerts | After the first medication is added, or when a caregiver accepts an invite | In-app banner on home; reminders still shown inside the app | Neutral text in Discreet mode |
| **Exact alarms** (Android) | On-time dose reminders | When setting the first reminder | Fall back to standard scheduling plus a banner explaining possible delay | Google restricts some alarm permissions, so confirm the current policy and eligibility before declaring any |
| **Run after reboot** (Android normal permission) | Rebuild reminders after restart | No prompt | n/a | Needed for your "reboot offline" test |
| **Location, while using the app** (precise at SOS time) | Adding location to SOS | When the patient sets up SOS | SOS still sends, without location | **No background location.** Explain that sharing happens only when SOS is sent |
| **SMS** | Offline SOS fallback | Never as a runtime permission | n/a | Use the **system SMS composer** on both platforms; do not request send or read SMS (see 6.4) |
| **Phone call** | Call contact or emergency number | On tap | n/a | Open the dialer through a call link; no call permission |
| **Contacts** | Adding Care Circle members | On tap of "Add from contacts" | Type name and number manually | Use the **system contact picker** so Duara never reads the whole address book |
| **Biometrics / PIN** (Face ID, fingerprint) | App lock | When the user turns on app lock | Use a PIN | Required iOS usage text for Face ID |
| **Camera** | Scan an invite QR; photograph a prescription | On tap only | Enter a code or pick a file | Optional feature |
| **Photos and files** | Upload records | On tap | Skip upload | Use the **system picker**, which needs no blanket permission |
| **Network access** | Sync | Normal permission, no prompt | Works offline | Show an offline badge |
| **Health Connect / HealthKit** | Wearable import (after launch) | Only when the user opts in | Feature off | Separate consent per data type; import only |
| **Analytics and crash reports** | Fixing bugs | Optional switch at first launch | Off | No health content in logs; no ad or tracking SDKs |

### 6.2 How to ask

1. **Explain first, then the system prompt.** Show one in-app screen with the benefit, then trigger the OS dialog.
2. **One permission at a time,** in context. Never a wall of prompts on first launch.
3. **"Not now" is a normal answer.** Do not repeat the ask more than once after a meaningful event.
4. **Permission Centre screen:** lists every permission with its status, why it is used, and a button to open system settings.
5. **Record the choice** (granted or denied, and when) locally for support and audits.
6. Fill in the store forms honestly: Google Play Data safety, Apple privacy details and usage-description strings.

### 6.3 Plain-language prompt copy (draft)

| Permission | English | Swahili (needs review by a native speaker; the app name is not used as a grammatical subject) |
| --- | --- | --- |
| Notifications | "Allow notifications so Duara can remind you about your medicine on time, even without internet." | "Ruhusu arifa ili programu hii ikukumbushe dawa zako kwa wakati, hata bila intaneti." |
| Location | "Duara shares where you are with your emergency contacts only when you send an SOS." | "Duara hushiriki ulipo na watu wako wa dharura tu unapotuma SOS." |
| Contacts | "Pick one person from your phone. Duara does not read your whole contact list." | "Chagua mtu mmoja kutoka kwenye simu yako. Programu hii haisomi orodha yako yote ya anwani." |
| App lock | "Use your fingerprint or face to keep your health information private." | "Tumia alama ya kidole au uso ili kulinda taarifa zako za afya." |

### 6.4 Correction to the build document: SMS fallback

Your build doc says Android can send SMS directly with the SMS permission, but Google Play restricts it. Google's current policy text says apps must be the **default SMS, Phone or Assistant handler** to declare send, read or receive SMS permissions, and exceptions are narrow and must be declared in Play Console. Duara is not a messaging app, so plan on this:

- **Use the SMS composer on both Android and iOS.** The patient taps Send. This needs no SMS permission.
- Make that tap easy: prefilled recipients and message, a large "Send" prompt, and a plain status ("Message ready. Tap Send in your messages app").
- On the **online path,** send SMS from the server through an SMS gateway so contacts with basic phones are alerted without any tap on the patient's phone.
- Remove any send-SMS permission from the Android manifest unless Google approves an exception.

---

## 7. Security and privacy

### 7.1 Controls

**Data and access**
- [ ] Row-level security on every table, tested with a second account per role. Headline test: a caregiver with no grant sees zero rows.
- [ ] Grants per category, revocable; revoke wins over any offline edit and clears cached data on the next sync.
- [ ] Clinician verification record plus patient link before any access; an audit log entry for every view.
- [ ] Audit log is append-only and visible to the patient as "who viewed what".

**Accounts and sessions**
- [ ] Multi-factor sign-in for clinicians; PIN or biometric lock for the mobile app with auto-lock after a short idle time.
- [ ] Session tokens in the platform secure store (Keychain, Keystore); short-lived tokens with refresh.
- [ ] Invitation links are single-use and expire; rate-limit sign-in, invite and SOS endpoints.

**On the device**
- [ ] Encrypt the local database; keep the key in Keychain or Keystore.
- [ ] Turn off automatic Android cloud backup for the local database so health data is not copied elsewhere.
- [ ] Block screenshots and screen recording on records screens where the platform allows it, and hide content in the app-switcher preview.
- [ ] Wipe local data on sign-out, revoke, or too many failed unlocks.
- [ ] Discreet mode keeps lock-screen notifications free of condition words.

**Backend**
- [ ] Only the Supabase URL and anon key ship in the apps. The service role key lives only in server environments and Edge Functions.
- [ ] Edge Functions verify the caller's token and role before acting; validate all input.
- [ ] Secret scanning in CI and a pre-commit hook; dependency audit; static analysis on every pull request.
- [ ] Logs never contain health details, phone numbers or locations.

**Process**
- [ ] Independent security test of the apps, API and RLS before launch.
- [ ] Backup and restore tested; retention and deletion rules agreed with the client.
- [ ] Written incident plan, including who tells the regulator and patients (see 8).
- [ ] Patient can export and delete their data.

### 7.2 Threats specific to Duara

| Risk | Mitigation |
| --- | --- |
| Lost or stolen phone | Encrypted database, app lock, remote sign-out, wipe on failed unlocks |
| Controlling family member demands access (coercive control) | Patient can revoke instantly; grants are visible; Discreet mode; no forced sharing; clear wording that access is the patient's choice |
| Guardian access continues after the person turns 18 | Hand-over flow: grants transfer to the patient at 18 and the patient reviews them |
| Fake clinician | Verification record plus patient link; MFA; audit trail; patient can remove a clinician |
| SOS text exposes location or condition | Location only at send time; short neutral wording; patient previews the message |
| SOS not delivered | Honest status, queue and retry, escalate to next contact |
| Insider access to the database | Least privilege, audited admin access, no service key in clients |
| Reminders silently killed by the phone's battery manager | Setup guide, in-app banner when reminders may be blocked, real-device testing |

---

## 8. Compliance snapshot (Kenya)

*Summaries from the sources listed in section 11. This is not legal advice; get a Kenyan data-protection lawyer to review before launch.*

- **Data Protection Act, 2019** is the main statute (in force since 25 Nov 2019). It treats health status as **sensitive personal data**, defines health data broadly, and requires consent to be express, specific and freely given.
- **Digital Health Act, 2023** adds sector rules for collecting, storing and exchanging health data, including national and county health data banks. A 2026 law-firm note says regulators now expect documented governance and demonstrable compliance.
- **ODPC guidance** exists on consent, processing of health data and impact assessments. PwC's summary stresses that "tick-box" consent is being challenged, that consent must be as easy to withdraw as to give, and that **children's data needs verifiable consent from a parent or guardian**.
- **Cross-border transfers:** sensitive personal data generally needs the data subject's explicit consent or adequate safeguards when moved outside Kenya. Decide where Supabase hosts data (and where any SMS or push service processes it) and take advice on this early.
- **Facilities:** a KMPDC directive from 1 Jan 2025 requires new health facility registrations to include an ODPC data handler or processor certificate. This matters if clinics deploy Duara.

**Actions**
- [ ] Run a Data Protection Impact Assessment before launch.
- [ ] Confirm whether Duara must register with the ODPC and whether a Data Protection Officer is needed.
- [ ] Publish a privacy notice in English and Swahili written in plain language.
- [ ] Design consent screens as separate, specific choices; log each consent and withdrawal.
- [ ] Confirm breach-notification duties and time limits with counsel and rehearse the process.
- [ ] If other countries are served later, review HIPAA or GDPR as your build doc already notes.

---

## 9. Success plan

### 9.1 What to measure

| Goal | Metric (suggested target to agree with the client) |
| --- | --- |
| Easy to use | Time to log an event; share of users who finish setup; task success in usability tests, including at night and one-handed |
| Reliable offline | Sync success rate; zero duplicate or lost records in the kill-mid-sync test |
| SOS works | Time from SOS to first "I'm on it"; share of SOS alerts that escalate; delivery status accuracy |
| Consent is real | Share of patients who set grants; grant revocations that take effect on next sync; audit entries per clinician view |
| Adherence | Share of reminders answered "Taken"; missed-dose trend |
| Clinician value | Brief opened before visits; follow-ups closed |
| Trust and quality | Crash-free sessions; support tickets per 100 users; satisfaction score |

### 9.2 Launch path

1. **Prototype review with the client** using the airplane-mode demo, grants screen and SOS flow.
2. **Closed pilot** with a small group of patients, caregivers and a few clinicians, ideally through a clinic or patient association. Include entry-level Android phones and at least one feature-phone caregiver.
3. **Fix, then widen.** Release gates follow your roadmap: no phase passes until its gate passes.
4. **Business model options to put to the client:** free for patients with clinic-paid dashboards, a clinic subscription, or sponsor or NGO funding. Pick one early because it affects scope.
5. **Partnerships:** neurology clinics, epilepsy associations and community health programmes are natural channels; confirm each partner's data-sharing rules.

### 9.3 Top risks

| Risk | Response |
| --- | --- |
| SMS policy limits | Composer-first design (6.4); gateway on the online path |
| Regulatory issues (detection claims, health data) | No detection claims; legal review; DPIA |
| Reminders blocked by phone settings | Setup guide, banner, device testing |
| Low clinician adoption | Pre-visit brief as the hook; verified roster; short onboarding |
| Trust | Plain consent, audit list, visible security, honest delivery status |
| Scope growth (SOS confirmation, bystander card) | Agree with the client before phase 3 |

---

## 10. Hand-off for Claude Code

Paste this after the earlier environment prompt:

```
Apply the Duara (codename Project Epi) Brand, Security and UX Guide.

0. Rename the product to "Duara" in user-facing places: app display name,
   splash, onboarding, notifications, store metadata, web titles and the
   English and Swahili strings. Keep "Project Epi" as the repo and codename.
   Put the app name in one config value and one i18n token, never hard-coded.
   Keep the Discreet-mode alias user-editable (default "Daily Notes").
   Use placeholder bundle and package ids (for example com.duara.app) and
   flag them as "confirm before store registration". In Swahili strings do
   not use the app name as a grammatical subject; use "programu hii".

1. Create a shared design-tokens package from section 3.3 (dark and light).
   Bundle Atkinson Hyperlegible (400, 700) and fall back to system fonts.
   Add a theme switch that follows the system and a night schedule.
2. Enforce touch targets: 48 dp minimum, 72 dp for SOS. Support text scale
   up to 200%. Add accessibility labels, roles and states to every control.
3. Seizure-safe motion: nothing flashes or strobes; no pulsing red; the SOS
   countdown is a steady progress ring with numbers changing no faster than
   once per second; honour reduce-motion; use a dark splash screen and fade
   theme changes; no animated GIFs or flashing video.
4. Build a Permission Centre screen and in-context pre-prompts for
   notifications, location (while in use, only at SOS time), biometrics,
   camera (optional), using the copy in section 6.3 with English and Swahili.
   Use the system contact picker and file/photo picker; request no SMS
   permissions; use the SMS composer on Android and iOS.
5. Remove SEND_SMS and READ_SMS from the Android manifest. Add a server SMS
   gateway call (Edge Function) so emergency contacts without the app get an
   SMS on the online path.
6. Add the security items in section 7.1: encrypted local DB with the key in
   Keychain/Keystore, Android auto-backup off for the DB, screenshot blocking
   and hidden app-switcher preview on records screens, wipe on sign-out and
   revoke, discreet-mode notification text.
7. Responsive web dashboard per section 4.2, with a print stylesheet for the
   one-page pre-visit brief.
8. Add a "keep reminders working" setup screen for aggressive Android battery
   managers and an in-app banner when reminders may be blocked.
9. Report which items need real-device testing and which need legal or
   clinical review (bystander card text, Swahili copy, consent wording).
```

---

## 11. Sources

Market:
- Seizure Tracker, Google Play listing (updated 2 Jul 2026): https://play.google.com/store/apps/details?id=com.seizuretracker.seizuretracker
- Epsy: Seizure Log for Epilepsy, App Store: https://apps.apple.com/us/app/epsy-seizure-log-for-epilepsy/id1479108189
- Epilepsy Journal: https://www.epilepsy-journal.com/
- EpiCentr (Apple Watch detection app): https://epicentr.app/
- Empowering Epilepsy, seizure detection and devices: https://www.empoweringepilepsy.org/seizure-detection-and-devices
- Epilepsy Foundation, using seizure diaries: https://www.epilepsy.com/manage/tracking/seizure-diaries
- Medical News Today, best epilepsy apps (older): https://www.medicalnewstoday.com/articles/319430
- JMIR mHealth and uHealth, self-management apps for epilepsy (2021): https://doaj.org/article/3b1382fa22324aeca1095f3f6e468dcf
- PMC systematic review of epilepsy m-health apps: https://pmc.ncbi.nlm.nih.gov/articles/PMC8214595/

Kenya devices:
- Citizen Digital, smartphones reach 52.3 million (2 Oct 2026): https://citizen.digital/article/smartphone-usage-surges-in-kenya-as-connected-devices-reach-523-million-n391282
- The Kenya Times, Android share in Kenya (9 Jul 2026): https://thekenyatimes.com/sci-tech/why-many-kenyans-prefer-android-over-iphone/

Law and policy:
- DLA Piper, Kenya data protection overview: https://www.dlapiperdataprotection.com/?c=KE&t=law
- Clyde & Co, health data protection under the DPA and Digital Health Act (17 Mar 2026): https://www.clydeco.com/en/insights/2026/03/health-data-protection-in-kenya-strategic-complian
- Clyde & Co, KMPDC directive for health facilities (Jan 2025): https://www.clydeco.com/en/insights/2025/01/critical-update-for-healthcare-providers-in-kenya
- PwC Kenya, consent as a lawful basis: https://www.pwc.com/ke/en/assets/pdf/consent-lawful-basis-under-kenyas-data-protection-act.pdf
- LexAfrica, cross-border health data and the DPA (29 Jan 2026): https://lexafrica.com/?p=19858
- Data Protection Act text: https://policyvault.africa/wp-content/uploads/policy/KEN839.pdf

Platform and accessibility:
- Google Play, SMS and Call Log permissions policy: https://support.google.com/googleplay/android-developer/answer/16558241?hl=en
- W3C, Understanding SC 2.3.1 Three Flashes or Below Threshold: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- W3C, Understanding SC 2.3.2 Three Flashes (AAA): https://www.w3.org/WAI/WCAG21/Understanding/three-flashes.html
