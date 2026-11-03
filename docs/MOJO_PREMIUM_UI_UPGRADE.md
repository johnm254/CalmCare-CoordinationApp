# MOJO — Premium UI Upgrade Spec (for Claude)

> The Mojo app (formerly Project Epi) is **fully built**. This file upgrades its **look and feel only**: a brighter light brand palette, premium cards and layouts, motion, and imagery, across the patient, caregiver, clinician and admin portals.
> **Do not change features, data, business logic, navigation flows or copy meaning.** If a visual change needs a logic change, stop and ask.

---

## 0. How Claude must work

1. **Audit first.** List every screen/page per portal, the theme file(s), shared components, and current libraries in `docs/ui-upgrade/AUDIT.md`.
2. **Before screenshots.** Capture every main screen in light and dark (mobile: Maestro or simulator screenshots; web: Playwright) into `docs/ui-upgrade/before/`.
3. **Upgrade in this order** (each step is a separate commit):
   1. Tokens (section 2–4) in the existing theme file
   2. Primitive components (Button, Card, Chip, Input, Avatar, Tabs, Skeleton, Toast)
   3. Layout shells (mobile screen container, header, tab bar; web sidebar, top bar, page grid)
   4. Screens, highest traffic first: Patient Today → Vitals → Meds → SOS → Care; Caregiver home + alert; Clinician roster + patient overview; Admin overview
   5. Motion (section 5)
   6. Imagery (section 6)
4. **After screenshots** into `docs/ui-upgrade/after/`, same names, and a `COMPARE.md` table linking before/after.
5. Never hard-code colours, sizes or durations. Everything comes from tokens.
6. All existing tests must still pass. Update snapshot tests only for visual changes.
7. Safety stays first: SOS and alert screens stay calm, high-contrast and fast. No decorative animation there.

---

## ★ Approved reference designs (match these exactly)

The client-approved screens are on the canvas **"Mojo Modern App Design"** (claude.ai artifact, ask the owner for access). Its artboards are the source of truth for layout, hierarchy, sizes and colours; where they differ from sections 4 and 8 below, **the canvas wins**. Save screenshots of each artboard in `docs/ui-upgrade/reference/` and compare every rebuilt screen against them.

| Artboard | Build into | Key elements to reproduce |
|---|---|---|
| **Today** (`Main`) | Patient Today | Avatar + date + "Habari, {name}" header with ruby **SOS** pill right · **dark ink hero** (`#0F1B2D`, radius 28) with strap-live chip, 64 px heart-rate number, status line, and **three concentric rings** (meds lagoon, sleep iris, activity coral) + legend · sun **next-dose strip** with Taken button · 2-col row: **seizure-free streak** (number + 7-day squares) and **"Seizure now"** tile (`lagoon-700`, glow) · 4 round **quick actions** (Symptom, Mood, ECG, Hospital) · **floating pill tab bar** (white, radius 26, active tab = ink pill with label) |
| **Heart rate** (`Heart`) | Vitals → heart detail (same pattern for every metric) | Back / title / share header · sliding **Day/Week/Month** segmented control · 56 px value + "Within limits" chip · smooth area chart with **dashed ruby limit line**, highlighted peak dot and dark tooltip · 3 stat tiles (Resting, Peak, HRV) · **dark ECG card** with gold trace, rhythm chip and gold "Record new ECG" button |
| **Seizure timer** (`Seizure`) | Seizure now / first-aid mode | Night background `#0B1220` always (even in light mode) · 72 px timer inside a **progress ring to the care-plan threshold** · "Care circle told" chip · **one first-aid step at a time** with step dots, Back / Next · bottom: mint "Seizure has ended" (60 px), ruby Ambulance, Record video, rescue-medicine line from the care plan · no decorative motion |
| **Medication** (`Meds`) | Patient Meds | 28 px title + prescriber · **adherence ring** card (iris) with plain-language sentence · **vertical dose timeline** (mint check = taken, sun dot + expanded card = due with Taken / Snooze) · **dose-plan step bar** (titration) · lagoon refill banner |
| **Clinician dashboard** (`Clinician`) | Clinician roster (same shell for admin) | White sidebar with Mojo logo, lagoon active item, alert count badge, verified clinician footer · greeting + search · **4 KPI cards, first one dark ink** for critical alerts · **triage table** with avatars, coloured status chips, heart-rate sparklines, adherence, last seen (critical row tinted) · **pre-visit summary panel** with iris weekly bar chart, insight sentence, patient's questions, Open patient button |

Design changes these screens make to the rest of this spec:
- **Hero cards are solid dark ink, not gradients.** Use `--grad-hero` / `--grad-warm` only for the splash screen and onboarding; in-app hero = `#0F1B2D` with lagoon/iris/coral accents.
- **Rings and timelines replace plain card grids** for meds, sleep, activity and adherence wherever the data is a progress or a sequence.
- **Large numbers:** Plus Jakarta Sans 800, tabular figures, negative letter-spacing (-1 to -2 px) on values ≥ 34 px.
- **Phone screens:** 20 px side padding, 12–18 px gaps, radius 22 for standard cards, 28 for heroes, floating tab bar 16 px from the edges and 20 px from the bottom.
- Swahili greeting on Today ("Habari"), switching with the app language.
- Apply the same language to the caregiver home (patient avatars + dark status hero) and admin overview (clinician shell, KPI row, device fleet table).

---

## 1. Design direction: "Bright, calm, cared-for"

Mojo should feel like a premium wellness product (think Apple Health, Oura, Headspace), not a hospital system.

- **Light and airy:** soft off-white canvas, white cards, plenty of space.
- **Vivid but calm colour:** a bright lagoon teal as the hero colour, warm coral for energy, iris violet for insights. Colour is used deliberately, not everywhere.
- **Depth through softness:** layered soft shadows, subtle gradients, rounded shapes echoing the strap.
- **Alive:** live data gently animates (heart pulse, count-ups, chart draw-in), and every tap gets feedback.
- **Human:** warm illustrations and photography featuring African people and Kenyan settings.
- **One hero per screen:** every screen has a single most-important card; everything else supports it.

---

## 2. New light brand palette

Replace the current dull palette. Keep the semantic role names from the build spec so all portals change at once.

### 2.1 Core colours

| Token | Hex | Use |
|---|---|---|
| `lagoon-50` | `#ECFDF9` | Tinted card backgrounds, selected rows |
| `lagoon-100` | `#CCFBEF` | Chips, soft highlights |
| `lagoon-300` | `#5EEAD4` | Gradient stops, glows, illustration accents |
| `lagoon-500` | `#14B8A6` | **Brand hero colour**: icons, rings, active tab, charts, gradients |
| `lagoon-600` | `#0D9488` | Primary button fill (white label, 17px+ semibold) |
| `lagoon-700` | `#0F766E` | Links, small primary text, pressed buttons |
| `coral-50` | `#FFF3EE` | Warm tinted surfaces |
| `coral-400` | `#FF8A6B` | Secondary accent, streaks, celebration, onboarding |
| `coral-500` | `#FF6B4A` | Secondary CTA fill (ink label) |
| `iris-50` | `#F1F0FF` | Insight card backgrounds |
| `iris-500` | `#6C63FF` | Insights, analytics, chart series 2, clinician highlights |
| `iris-700` | `#4B44C9` | Iris text on light |
| `sun-100` | `#FFF4D6` | Reminder card background |
| `sun-400` | `#FFC24B` | **Medication reminders**, "Taken" button (ink label) |
| `gold-500` | `#F5B700` | **ECG only** |
| `mint-500` | `#22C08A` | Success, dose taken, in-range |
| `mint-700` | `#13865F` | Success text |
| `ruby-500` | `#EF4444` | **SOS and critical alerts only** |
| `ruby-700` | `#C62828` | Danger text |

### 2.2 Neutrals

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F6F9FC` | App background (never pure grey) |
| `surface` | `#FFFFFF` | Cards |
| `surface-raised` | `#FFFFFF` + shadow-lg | Hero cards, sheets |
| `hairline` | `#E6ECF2` | Card borders, dividers |
| `ink` | `#0F1B2D` | Primary text |
| `ink-muted` | `#5B6B7F` | Secondary text |
| `ink-subtle` | `#8C9AAB` | Captions, placeholders (not for essential text) |

### 2.3 Gradients (use sparingly: max one gradient card per screen)

```
--grad-hero:     linear-gradient(135deg, #14B8A6 0%, #3BA7F5 55%, #6C63FF 100%);
--grad-warm:     linear-gradient(135deg, #FFC24B 0%, #FF8A6B 100%);   /* reminders, streaks */
--grad-calm:     linear-gradient(180deg, #ECFDF9 0%, #F6F9FC 60%);   /* screen header wash */
--grad-insight:  linear-gradient(135deg, #F1F0FF 0%, #ECFDF9 100%);
--grad-sos:      none  /* SOS is always solid ruby, never a gradient */
```
Text on `--grad-hero` is white, 17px+ semibold, with a subtle text shadow `0 1px 2px rgba(15,27,45,.18)`.

### 2.4 Dark mode (premium night, not black)

`canvas #0B1220`, `surface #121C2E`, `surface-raised #172338`, `hairline #22304A`, `ink #EEF3F9`, `ink-muted #9FB0C6`. Brand colours shift one step lighter (`lagoon-400 #2DD4BF`, `iris-400 #8B85FF`, `coral-400`). Gradients drop to 70% saturation. Patient app switches automatically at night.

### 2.5 Colour rules
- Ratio per screen: roughly 70% neutral, 20% lagoon family, 10% accents.
- White text only on `lagoon-600+`, `iris-500+`, `ruby-500+` (≥17px semibold) or 700 shades (any size).
- Ink text on sun, gold, coral, mint fills.
- Ruby appears only for SOS, critical alerts and destructive actions.
- Every status pairs colour + icon + word.
- Run an automated contrast check on every token pair used (WCAG AA).

---

## 3. Typography

- **Headings:** Plus Jakarta Sans (600/700). **Body/UI:** Inter (400/500/600). Load with `expo-font` / `next/font`.
- **Numbers:** Inter with tabular figures (`fontVariant: ['tabular-nums']`) for all vitals, doses and times.

| Style | Size / line | Weight |
|---|---|---|
| Display (hero vitals) | 44 / 48 | Jakarta 700 |
| H1 | 28 / 34 | Jakarta 700 |
| H2 | 22 / 28 | Jakarta 600 |
| H3 (card title) | 17 / 22 | Inter 600 |
| Body | 16 / 24 | Inter 400 |
| Label | 14 / 20 | Inter 500 |
| Caption | 12 / 16 | Inter 500, +0.2 letter-spacing |

Units sit next to big numbers at 50% size in `ink-muted` (e.g. **72** bpm). Must stay usable at 200% dynamic type: cards grow, nothing truncates essential values.

---

## 4. Spacing, shape, elevation and card system

### 4.1 Tokens
- 4-pt base, 8-pt rhythm: `4, 8, 12, 16, 20, 24, 32, 40, 56`.
- Screen padding: mobile 20, tablet 28, web content 32.
- Gap between cards: 12 (mobile), 16–20 (web).
- Radius: `sm 10` (inputs, chips), `md 16` (cards web), `lg 20` (cards mobile), `xl 28` (hero cards, sheets), `pill 999`.
- Shadows (light mode), soft and layered:
  - `shadow-sm`: `0 1px 2px rgba(15,27,45,.04), 0 2px 8px rgba(15,27,45,.04)`
  - `shadow-md`: `0 2px 4px rgba(15,27,45,.04), 0 8px 24px rgba(15,27,45,.06)`
  - `shadow-lg`: `0 4px 8px rgba(15,27,45,.05), 0 16px 40px rgba(15,27,45,.08)`
  - `glow-lagoon`: `0 8px 28px rgba(20,184,166,.28)` (hero card and primary CTA only)
- Dark mode: no drop shadows; use `surface-raised` plus a 1px `hairline` top highlight.

### 4.2 Card anatomy (every card follows this)
```
┌──────────────────────────────────────┐  radius lg, padding 16–20, shadow-sm, 1px hairline
│ [icon 32 in tinted circle]  Title  ›│  header row: icon chip + H3 + optional action
│                                      │
│  72 bpm            ▁▂▃▅▃▂ sparkline │  body: one key value + one supporting visual
│  Resting · 2 min ago                 │  footer: caption / status chip
└──────────────────────────────────────┘
```
- One key value per card. Supporting info is smaller and muted.
- Icons sit in a 32–40 px circle tinted with the card's colour family (`lagoon-50` bg + `lagoon-600` icon).
- Status chips: pill, 24 px high, tinted bg + strong text + icon.

### 4.3 Card types
| Card | Use | Style |
|---|---|---|
| **Hero card** | The single most important thing on a screen (next dose, open alert, today's summary) | radius xl, `--grad-hero` or `--grad-warm`, white/ink text, glow, optional illustration on the right |
| **Metric tile** | Vitals (HR, SpO2, temp, resp, BP, glucose) | Square-ish, 2-column grid, value + sparkline + status chip |
| **Action card** | One clear action (Record ECG, Log symptom) | Tinted background, icon, title, chevron, full-card tap |
| **List card** | Meds list, Care Circle, follow-ups | White, rows 64 px with avatar/icon, dividers inset 56 px |
| **Insight card** | Trends, adherence %, clinician notes | `--grad-insight`, iris accent, small chart |
| **Chart card** | Detail charts | White, header with range segmented control (Day/Week/Month), chart edge-to-edge inside 16 px |
| **Banner** | Sync status, offline, low battery | Full-width, 48 px, tinted, dismissible |
| **Alert card** | Warnings/critical | Solid tinted bg, strong left icon, no gradient, no decoration |

### 4.4 Placement rules
- **Mobile:** single column, with metric tiles in a **2-column grid**. Equal tile heights per row. Quick actions in a horizontal scroll of 4 action chips.
- **Web (clinician/admin):** 12-column grid, max width 1440. **Bento layout:** KPI row of 4 equal cards → main chart (8 cols) + side panel (4 cols) → tables full width.
- Order by importance: **status → action → data → history**.
- Align card edges and baselines; no orphan half-width card at the end of a grid (span it full width).
- Max 1 hero card and max 1 gradient per screen.
- Empty states are cards too: illustration + one sentence + one button.
- Section headers: H2 + optional "See all" link, 24 px above, 12 px below.

---

## 5. Motion system

### 5.1 Libraries
- Mobile: `react-native-reanimated` 3, `moti`, `react-native-gesture-handler`, `lottie-react-native`, `expo-haptics`, `@shopify/react-native-skia` (live heart, ECG, chart draw-in), `expo-linear-gradient`, `expo-blur`.
- Web: `motion` (Framer Motion), Tailwind transitions, `lottie-react` for illustrations.

### 5.2 Tokens
| Token | Value | Use |
|---|---|---|
| `dur-instant` | 100 ms | Press feedback |
| `dur-fast` | 180 ms | Chips, toggles, fades |
| `dur-base` | 260 ms | Cards, sheets, tabs |
| `dur-slow` | 420 ms | Screen enter, charts |
| `ease-out` | `cubic-bezier(.22,1,.36,1)` | Default |
| `spring-soft` | damping 18, stiffness 180 | Cards, sheets |
| `spring-bouncy` | damping 12, stiffness 220 | Success moments only |
| `stagger` | 40 ms per item, max 8 items | Lists and grids |

### 5.3 Patterns to implement
| Where | Animation |
|---|---|
| Screen enter | Cards fade in + rise 12 px, staggered 40 ms |
| Any card / button press | Scale to 0.97 with `dur-instant`, light haptic on primary actions |
| Vitals numbers | Count up to the value on first show; cross-fade on update |
| **Live heart rate** | Heart icon pulses in time with the actual BPM (Skia), stops when not worn |
| Sparklines / charts | Line draws in left to right (`dur-slow`); range switch morphs, doesn't reload |
| ECG strip | Trace scrolls like a monitor while recording; gold sweep line |
| Loading | Skeleton cards with soft shimmer matching final layout (no spinners on content screens) |
| Tab bar | Active pill slides between tabs; icon fills |
| Hero card | Gradient slowly shifts (12 s loop, very subtle) — off when reduced motion |
| **"Taken" dose** | Button morphs to a check, mint ring burst, success haptic, card collapses into history |
| Streaks / adherence | Ring fills with `spring-soft` |
| Sheets & modals | Slide up with `spring-soft`, backdrop blur |
| Tile → detail | Shared-element transition from metric tile to its chart screen |
| Pull to refresh | Custom strap-shaped loader (Lottie) |
| Onboarding | Lottie illustrations, page dots morph, strap 3D model rotates on pairing screen |
| Pairing success | Strap glows lagoon, confetti-free check animation |
| Web dashboards | Cards fade-up on load, table rows highlight on hover, KPI numbers count up, sidebar collapse animates width |
| **SOS** | **Only** the hold-to-activate ring and the countdown. No other animation. Instant response. |

### 5.4 Motion rules
- Animate only `transform` and `opacity` (and Skia drawing). Keep 60 fps on a mid-range Android (test on a ~KSh 20,000 phone).
- Respect "Reduce motion": swap movement for simple fades, stop loops.
- Nothing loops forever except the live heart pulse and the subtle hero gradient.
- No animation delays any medical action by more than 100 ms.

---

## 6. Imagery

### 6.1 Where images appear
| Place | Image |
|---|---|
| Onboarding (4–5 screens) | Warm illustrations: wearing the strap, family support, clinician care, medication reminder, SOS safety |
| Today hero | Small illustration or the strap render on the right of the hero card |
| Pairing / devices | Rendered strap (Concept A/B) PNG/WebP from the 3D model, or the live three.js model |
| Empty states | Spot illustrations (no meds yet, no readings yet, Care Circle empty, no alerts) |
| Care Circle | Real avatars uploaded by users; colourful initials fallback using accent colours |
| Clinicians | Uploaded profile photo with verified badge |
| Condition cards / education | Calm photography or illustrations per condition |
| Nearest hospital | Map snapshot + facility photo if available |
| Login / web dashboards | Split layout: brand illustration or photo on one side, form on the other |
| Admin | Minimal: device renders and charts, no lifestyle photos |

### 6.2 Style and sourcing
- One consistent illustration style across the app: soft shapes, lagoon/coral/iris palette, African characters in Kenyan settings (matatu stage, home compound, clinic). Ideally commissioned; otherwise a licensed set recoloured to the palette. **Check every licence and record it in `assets/LICENSES.md`.**
- Photography: real, warm, natural light, diverse ages; licensed stock only (Unsplash/Pexels licence checked). **Never real patient photos** unless uploaded by the user for their own profile.
- No photos or illustrations on SOS, alert and clinical data screens; data screens stay clean.

### 6.3 Technical
- Mobile: `expo-image` with **blurhash placeholders**, caching, `contentFit="cover"`. Web: `next/image` with blur placeholders.
- Formats: WebP/AVIF for photos, SVG for icons and simple illustrations, Lottie JSON for animated illustrations (< 150 KB each).
- Provide @1x/@2x/@3x where needed; total image weight added to the mobile bundle < 3 MB (download larger sets on first launch and cache).
- Every image has alt text / accessibility label, or is marked decorative.
- Icons: one set only (Phosphor or Lucide, duotone for feature icons, regular for UI).

---

## 7. Component upgrades

| Component | Upgrade |
|---|---|
| Button | Primary: `lagoon-600` fill, `glow-lagoon` on hero CTAs, 52 px high, radius pill, press scale. Secondary: white + hairline. Tertiary: text. Reminder: `sun-400` ink label. Danger: ruby. Loading state morphs label into dots |
| Card | Section 4.2–4.3 variants as one `Card` component with `variant` prop |
| Metric tile | New component: icon chip, value (Display/H1), unit, sparkline, status chip, last-updated caption |
| Chip / status | Pill, tinted, icon + word |
| Inputs | 52 px, radius sm, filled `canvas` bg, lagoon focus ring 3 px, floating label |
| Tab bar (mobile) | Floating, white, radius xl, shadow-md, active pill indicator, center SOS stays separate top-right as in the app |
| Header | Large title that collapses on scroll, greeting + avatar on Today, `--grad-calm` wash behind |
| Segmented control | Sliding pill indicator |
| Avatar | Ring in role colour (caregiver coral, clinician iris), verified badge |
| Toast / snackbar | Bottom, radius lg, icon, auto-dismiss, swipe away |
| Skeleton | Matches each card type |
| Sidebar (web) | White, 264 px, lagoon active pill, collapsible to 76 px icons |
| Tables (web) | Row height 56, zebra off, hover `lagoon-50`, sticky header, status chips, avatar column |
| Charts | Rounded line caps, area fill gradient 20%→0%, limit lines dashed ruby/sun, tooltips as mini cards |

---

## 8. Screen recipes

### Patient app
- **Today:** collapsing header ("Good morning, Wanjiku" + avatar + strap status chip: battery, worn, synced) → **Hero card** (next dose with `--grad-warm` and "Taken" button, or open alert, or "All good today" with `--grad-hero`) → **2×2 metric tiles** (HR with live pulse, SpO2, Temp, Steps/Sleep) → quick actions row (Log symptom, Mood, Record ECG, Nearest hospital) → today's timeline list card.
- **Vitals:** segmented metric picker → chart card with draw-in → add-on readings (BP, glucose, weight) as metric tiles → ECG action card (gold) + recordings list.
- **Meds:** adherence ring insight card at top → today's doses as a vertical timeline (taken mint, due sun, missed ruby text) → medication list cards with pill illustrations → refill banner.
- **Care:** Care Circle avatars carousel → grants list card with toggles → linked clinicians cards with photo + verified badge → appointments.
- **SOS:** solid, calm, no imagery: large ruby hold ring, status text, Call ambulance, Call contact, Nearest hospital, location accuracy.
- **Onboarding/Login:** full-bleed illustration top half, content card sliding up bottom half.

### Caregiver
- Patient switcher as avatar pills at top → hero card for the patient's status → granted tiles only → alerts list. Emergency screen stays solid and calm.

### Clinician (web)
- **Roster:** KPI row (critical alerts, warnings, missed doses today, patients not wearing strap) → triage table with avatars, status chips, sparkline column.
- **Patient overview:** profile header card (photo, conditions chips, granted scope) → bento: vitals chart 8 cols + alerts/notes 4 cols → adherence insight card → ECG review card → timeline.

### Admin (web)
- Overview: KPI cards with count-ups and trend arrows → system health charts → verification queue preview → device fleet card with strap render.
- Verification queue: split view list/detail with document preview.

---

## 9. Brand touches
- Logo/wordmark: "Mojo" in Plus Jakarta Sans 700, lagoon, with a pulse line forming part of the "j" or "o". Update app icon (lagoon→iris gradient square, white pulse mark), splash screen (gradient + animated pulse, max 1.2 s), favicon, store screenshots.
- Microcopy tone: warm and short ("Nice, dose logged" / "Your care team can see this").

---

## 10. Acceptance checklist

- [ ] All colours, radii, shadows, durations come from tokens; zero hard-coded values (lint rule).
- [ ] WCAG AA contrast on every text/background pair used; automated check passes.
- [ ] Every screen works at 200% text, in dark mode, and with Reduce Motion.
- [ ] 60 fps on scroll and transitions on a mid-range Android; cold start not slower than before by more than 10%.
- [ ] Bundle size increase documented; images lazy-loaded with placeholders.
- [ ] One hero card and at most one gradient per screen; ruby only on SOS/critical/destructive.
- [ ] Skeletons replace spinners on all content screens.
- [ ] SOS flow is not slower than before (measure tap-to-countdown time).
- [ ] Before/after screenshots for every main screen in `docs/ui-upgrade/`.
- [ ] All existing feature tests still pass; no logic changes.
- [ ] Image licences recorded in `assets/LICENSES.md`.
- [ ] Today, Heart rate, Seizure timer, Medication and Clinician screens match the approved canvas artboards (side-by-side screenshots in `docs/ui-upgrade/COMPARE.md`).
