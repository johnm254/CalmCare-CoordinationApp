# epimoyo — Production Redesign Spec

Instructions for Claude Code. Read this whole file before changing anything.

## 0. How to work

1. **Inspect first.** Identify the framework (React Native / Expo / Flutter / other), navigation library, state management, theming setup, i18n setup and where each screen lives. Write a short summary of what you found before editing.
2. **Reuse what exists.** Extend the current theme, components and API layer. Do not introduce a second styling system or a new state library.
3. **Work in the phases in section 9, in order.** One phase per commit (or small group of commits). Run the app's lint, type-check and tests after each phase.
4. **Never invent backend behaviour.** If a change needs an API or data field that does not exist, stop and list it under "Backend needed" in your summary instead of faking it.
5. **Never ship demo or hard-coded health data.** Every number on screen must come from real user data or show an explicit empty state.
6. **Ask before** deleting screens, changing the data model, or changing what data is shared with whom.

Product context: epimoyo is a seizure-care app paired with a wearable strap. Roles: patient, caregiver, clinician, admin. Market: Kenya. Users have epilepsy, so safety, calm and legibility outrank decoration. Target feel: modern, premium, calm.

---

## 1. Design tokens

Create or update a single theme file. All screens must read from it; no hard-coded colours, sizes or font names in screens.

### Colour

| Token | Value | Use |
|---|---|---|
| `bg` | `#F4EEE1` | App background (current cream) |
| `surface` | `#FFFFFF` | Cards |
| `surfaceDark` | `#15383A` | Hero and primary action cards |
| `primary` | `#1F7A70` | Buttons, active states, positive data |
| `primarySoft` | `#D6E6E1` | Chips, icon backgrounds |
| `accent` | `#E8674A` | Steps ring, secondary data |
| `danger` | `#C8102E` | SOS, emergency, delete |
| `dangerSoft` | `#FBE4E7` | Emergency chip backgrounds |
| `seizure` | `#B4472E` | Seizure markers in charts and calendars (never teal) |
| `warning` | `#8A5A00` on `#FBEFD0` | Notices (replaces amber-on-amber) |
| `text` | `#10201F` | Primary text |
| `textMuted` | `#55635F` | Secondary text |
| `textOnDark` | `#FFFFFF` | Text on `surfaceDark` |
| `textOnDarkMuted` | `#B8CCC8` | Secondary text on `surfaceDark` |
| `border` | `#E3DACA` | Card borders, dividers |

Sample the exact existing brand values from the codebase and keep them where they differ slightly from this table. Every text/background pair must meet WCAG AA (4.5:1 for body, 3:1 for large text). Check and fix each pair.

Add a dark theme using the same token names.

### Typography

- **Display font:** keep the current handwritten brand font, but only for: the greeting name, screen titles, and large hero numbers.
- **Body font:** add a clean sans (Plus Jakarta Sans or Inter) for everything else: body, labels, captions, buttons, form fields, list rows, tab labels.
- Numbers use tabular figures.
- Minimum text size 13sp. Captions 13, body 15–16, section title 18, screen title 26–28, hero number 56–64.
- Section headers such as "CRISIS RESOURCES": body font, 12–13sp, semi-bold, letter-spacing 0.8, `textMuted`.
- Honour the system font scale and the in-app Accessibility text size.

### Shape, spacing, elevation

- Spacing scale: 4, 8, 12, 16, 20, 24, 32.
- Screen horizontal padding 20. Gap between cards 16.
- Radius: cards 24, buttons and chips fully rounded, inputs 16.
- One soft shadow for cards (low opacity, large blur). No stacked shadow plus thick border.
- Minimum touch target 48×48.

### Icons

One icon family across the app, consistent stroke weight. Replace every placeholder rectangle icon on the Me screen. Meds uses a pill icon, not an asterisk.

---

## 2. Global rules

### SOS

- **Exactly one SOS control per screen.** Remove the header SOS pill; keep the floating button, bottom-right, above the tab bar.
- Every scrollable screen gets bottom padding equal to tab bar height + SOS button height + 24, so no content or button ever sits under the SOS button.
- Activation: **press and hold 1.5s** with a visible progress ring and haptic ramp, then a full-screen **5-second cancel countdown** before alerts are sent. A single tap shows a hint: "Hold to send SOS".
- On send: notify the care circle with location; show call buttons for emergency services and the user's chosen hospital.
- If there is no data connection, fall back to SMS to care-circle contacts (list under "Backend needed" if not supported).
- Halo animation: slow breathing, 4-second cycle, opacity only. See section 7.

### Navigation

Five tabs, always with icon **and** label: **Today, Vitals, Meds, Care, Me**. Remove the Mood tab; mood logging lives on Today (quick action) and Vitals (card), opening one shared mood sheet.

### Data states

Every data-driven component must implement four states: loading (skeleton), empty (illustration + one line + one action), error (message + retry), populated. Never render `0`, `0%` or a default value when the truth is "no data".

### Identity

- Collect the user's name at onboarding.
- Greeting with name: "Habari za mchana, Amina". Without a name: "Habari za mchana" only. Never "there".
- Avatar shows photo, else initials, else a neutral person icon. Never "U".
- The app language and the greeting follow the Language setting. Fix the mismatch where the setting reads "Français" while the UI is English. Supported at launch: English and Kiswahili, fully translated. All strings go through i18n; no hard-coded copy.

### Brand

Write the product name as **epimoyo** (lowercase) everywhere, and the device as **epimoyo strap**.

---

## 3. Single sources of truth

Fix these contradictions. Each value must come from one selector/hook used by every screen.

| Value | Rule |
|---|---|
| Seizure-free days | Days since the most recent logged seizure. Used by Today and Vitals. If no seizure has ever been logged, show "No seizures logged" rather than a number. |
| Strap status | `notPaired` / `connecting` / `live` / `offline (last synced X)`. Used by Today hero and Me → Devices. Live heart rate and battery appear only when `live`. |
| Care circle status | "Active" only when at least one member has accepted. With 0 members: "Set up your care circle". |
| Medication adherence | Computed only when a schedule exists. Otherwise "No schedule yet". |
| Mood scale | One 5-point scale with one label set: Very low, Low, Okay, Good, Great. One shared component. |
| Mood privacy | See section 4. |

---

## 4. Mood privacy copy

There are currently four different statements. **Check what the backend actually enforces**, then use one statement everywhere (Mood sheet, Vitals card, Me → Privacy). Report which case applies.

- If only the patient can see mood unless they share it:
  "Your mood is private. No one else can see it unless you choose to share it."
- If the linked clinician can see it by default:
  "Your mood is visible to you and your linked clinician. Caregivers cannot see it unless you allow it."

Do not ship until the copy matches the access rules in code.

---

## 5. Screen specs

### 5.1 Today

Order, top to bottom:

1. **Header**: avatar, greeting, date. No SOS pill.
2. **Seizure now** (full width, `surfaceDark`, bolt icon, the most prominent action on the screen). Title "Seizure now", subtitle "Tap to start the timer".
3. **Hero vitals card** (`surfaceDark`):
   - `live`: heart rate large, small sparkline of the last hour, status chip ("Within your usual range"), battery, "Live".
   - `offline`: last value greyed, "Last synced 14:02".
   - `notPaired`: strap illustration, "Pair your epimoyo strap to see live vitals", button "Pair strap".
   - Rings for Meds, Sleep, Steps, each with its value in the legend (e.g. "Meds 2 of 3", "Sleep 7h 10m", "Steps 4,200"). A ring with no data is an empty track with "—".
4. **Seizure-free card** (full width or half with next dose): number, "days seizure-free", 7-dot week strip with a legend.
5. **Quick actions** row: Log symptom, Log mood, ECG, Find hospital. Icon plus label, 48dp minimum.
6. **Next dose** card (only when a schedule exists): medication, time, "Mark taken".
7. **Care circle** card: reflects real status (section 3).
8. **Emergency** card: user's chosen or nearest hospital (not a fixed Kenyatta National Hospital), with Call 999, Call 112, Call hospital. Nothing may be covered by the SOS button.
9. **Weather**: remove, unless it can show a relevant tip (e.g. "Hot day. Drink water and rest in shade."). If kept, it is the last card.

### 5.2 Seizure timer (full screen)

- Large elapsed time, body font, tabular figures. Dark calm background. No flashing.
- First-aid tips shown one at a time: "Keep them safe from injury", "Do not put anything in their mouth", "Turn them on their side when movements stop".
- At **5:00**: strong haptic and a prominent prompt "This seizure has lasted 5 minutes. Call emergency services now." with Call 999 / Call 112 buttons.
- Option "Alert my care circle" (automatic if the user enabled it in settings).
- "Seizure ended" stops the timer and opens the detail form: type (list plus "Not sure"), duration (pre-filled), awareness, possible triggers (multi-select chips: missed dose, poor sleep, stress, illness, alcohol, flashing lights, other), notes. All optional except time and duration. "Save" and "Skip details".
- Confirmation after save: "Logged. Thanks, this helps your care team spot patterns."

### 5.3 Vitals

1. Title, then range toggle: This week / This month / All time.
2. Three stat tiles: Seizures, Seizure-free days, Doses taken. Use "—" when no data.
3. **Seizure activity**: week strip or month calendar. Seizure days use `seizure` colour, clear days are an outlined neutral dot, today has a ring. Include a legend. Tap a day to see its events.
4. **Insight card**: neutral wording only. Example: "1 seizure logged this week. Built from 1 event and 0 medication check-ins. This is a pattern, not a diagnosis." One button: "See logs". **Remove "Keep it up".** Positive wording is allowed only for seizure-free streaks and adherence.
5. Heart rate and sleep trend charts (when strap data exists).
6. **Mood card**: shared mood component, last 7 days as a small chart.
7. **Events** list: type chip, severity, date and time, duration. Tap for detail.
8. "Log an event" button, full width, fully visible above the SOS button.
9. "Share report" action: generates a PDF summary for the clinician (list under "Backend needed" if not available).

### 5.4 Meds

- **Schedule exists**: summary card (adherence % over 30 days, doses today "2 of 3"), then today's doses grouped Morning / Afternoon / Evening, each with name, dose, time and actions Taken / Skip / Snooze. Haptic and a calm check animation on Taken.
- **No schedule**: empty state with illustration, "No medication schedule yet", and two actions: "Link my clinician" and "Add my own medication". Self-added items are labelled "Self-reported".
- Notice (using `warning` tokens, readable contrast): "Reminders follow the schedule your clinician entered. epimoyo never changes your dose."
- Never show "0%" or "0 of 0".

### 5.5 Care Circle

- Header: "Care Circle", "You decide who sees what."
- **Empty**: illustration, "No one in your circle yet", button "Invite someone", and a short list of what members can see (SOS alerts and location during SOS, seizure log if allowed) and cannot see (mood, unless allowed).
- **Invite flow**: name, phone, role (Caregiver / Family / Clinician), per-item permission toggles, send via WhatsApp or SMS share sheet.
- **Populated**: member cards with photo or initials, role, status (Invited / Active), and an edit-permissions screen. Remove member requires confirmation.

### 5.6 Mood (shared bottom sheet, not a tab)

- "How are you feeling today?"
- Five options with the single label set. Selected state is a clear ring and scale, with haptic.
- Optional factor chips: Slept badly, Stressed, Missed a dose, Unwell, Tired, Good day.
- Optional note.
- "Log mood" disabled until an option is chosen.
- The single privacy line from section 4.

### 5.7 Me

1. **Profile card**: photo, name, email, role chip, "Edit profile". Remove the decorative circle that clips the card. Never show "–" for a missing name; show "Add your name".
2. **Medical ID** (new): condition, medications, allergies, blood type, emergency contacts, clinician. Viewable from the SOS screen.
3. **Disclaimer**: "epimoyo helps you and your care team watch trends. It does not diagnose or treat any condition. In an emergency, hold SOS or call emergency services."
4. **Crisis resources**: rows with name, number, Call button. Numbers come from a config file, not hard-coded in the screen.
5. **Privacy**: properly aligned rows with icons. Text must wrap inside the card with 16dp padding on both sides (fix the right-edge clipping). Mood privacy line from section 4. Location line: "Your location is shared only when you send an SOS. It is never tracked in the background." Saved places row.
6. **Account**: Activity log ("Who viewed your data"), Export my data, Delete my account (danger style, typed confirmation).
7. **Devices**: epimoyo strap (real status), Add-on devices.
8. **Settings**: Language, Notifications, PIN / biometric lock, Accessibility (text size, reduce motion, high contrast), Appearance (light / dark / system).
9. **Support and legal** (new): Help, Contact support, Terms, Privacy policy, About.
10. Sign out, then version.

### 5.8 Onboarding (new, first launch)

Welcome → consent and privacy summary → name and photo → role → condition basics (optional) → pair strap (skippable) → invite first care-circle member (skippable) → notification permission with a reason → done. Progress indicator, back on every step, skip where marked.

### 5.9 Strap pairing (new or polish)

Strap render, step-by-step Bluetooth pairing, permission explanations, success state showing battery and first reading, clear failure and retry states.

---

## 6. Copy rules

- Plain, calm, short. Sentence case. No exclamation marks around health events.
- Never congratulate or praise in the context of a seizure, symptom or missed dose.
- Say "seizure" consistently; "event" only for the mixed log list.
- Every empty state has one line of explanation and one action.
- Errors say what happened and what to do next.
- All copy in English and Kiswahili.

---

## 7. Motion

**Safety rule (users have epilepsy): nothing may flash, strobe or blink. No animation may change luminance over a large area more than 3 times per second. No rapid colour cycling, no parallax-heavy effects, no auto-playing looping video.**

- Respect the system reduce-motion setting and the in-app toggle: when on, replace movement with simple fades or no animation.
- Durations 150–300ms, ease-out, no bounce overshoot on large elements.
- Allowed:
  - Rings fill once on load (600ms).
  - Numbers count up once (400ms).
  - Heart icon: gentle scale pulse at the real heart rate, capped at one pulse per second, scale 1.0 → 1.08.
  - SOS halo: opacity breathing on a 4-second cycle.
  - SOS hold: progress ring with haptic ramp.
  - Dose taken / log saved: single check-mark draw.
  - Card press: scale to 0.98.
  - Screen transitions: platform default or shared-axis fade.
  - Skeleton loaders: static or very slow shimmer (2s+), low contrast.
- Haptics: light on selection, medium on confirm, strong on SOS send and the 5-minute seizure warning.

---

## 8. Images and illustration

- One illustration style, flat, using only theme colours. Needed for: onboarding (3–4), each empty state (Meds, Care Circle, Vitals, Mood history), strap pairing, SOS sent.
- Use vector assets (SVG or Lottie under the motion rules). If no assets exist, build simple vector placeholders in the theme colours and list them under "Assets needed".
- Strap product render for pairing and the not-paired hero state.
- Photos: user and care-circle avatars only.

---

## 9. Build order

**Phase 1 — Correctness and safety (do first)**
- Single sources of truth (section 3); remove all demo and hard-coded data.
- Mood privacy copy aligned with backend (section 4).
- One SOS button, hold-to-activate, cancel countdown, content padding (section 2).
- Remove "Keep it up"; fix identity fallbacks and the language mismatch.
- Fix contrast failures and clipped text.

**Phase 2 — Design system**
- Tokens, typography split, icon set, shared components: Card, Button, Chip, StatTile, ListRow, SectionHeader, EmptyState, Skeleton, MoodPicker, Ring, Sheet.
- Dark theme.

**Phase 3 — Screens**
- Five-tab navigation with labels; Mood as a shared sheet.
- Rebuild Today, Vitals, Meds, Care Circle, Me to section 5.
- All four data states on every component.

**Phase 4 — New flows**
- Seizure timer and detail form, Medical ID, onboarding, strap pairing polish, care-circle invite with permissions, self-reported medication.

**Phase 5 — Polish**
- Motion and haptics (section 7), illustrations, full English and Kiswahili translation, accessibility pass (screen-reader labels on every control, font scaling to 200%, touch targets, reduce motion).

**Phase 6 — Production readiness**
- Offline-first logging with sync queue; SOS SMS fallback.
- Crash and error reporting without health data in logs.
- Biometric / PIN lock; secure storage for tokens.
- Emergency numbers and crisis lines moved to config and flagged for human verification.
- Release build checks, app icon, splash, store screenshots.

---

## 10. Acceptance checklist

- [ ] No screen shows a value that contradicts another screen.
- [ ] No hard-coded or demo health data anywhere.
- [ ] With no strap paired, no live vitals are shown.
- [ ] Exactly one SOS control per screen; nothing is hidden beneath it at any scroll position.
- [ ] SOS cannot be triggered by a single accidental tap.
- [ ] One mood privacy statement, matching backend access rules.
- [ ] One mood scale and label set.
- [ ] No praise wording attached to seizures.
- [ ] Greeting never shows "there"; avatar never shows "U"; name never shows "–".
- [ ] All body text uses the sans font, 13sp minimum, AA contrast.
- [ ] Five tabs, all labelled.
- [ ] Every list and card has loading, empty, error and populated states.
- [ ] No flashing; reduce-motion respected.
- [ ] English and Kiswahili complete; language setting matches the UI.
- [ ] Screen reader can reach and name every control.
- [ ] Lint, type-check and tests pass.

## 11. What to report at the end of each phase

- What changed (files and screens).
- **Backend needed**: APIs or fields missing.
- **Assets needed**: illustrations, renders, fonts.
- **Needs human decision**: privacy rules, emergency numbers, compliance items (Kenya Data Protection Act registration, Google Play health-app declaration), anything ambiguous in this spec.
