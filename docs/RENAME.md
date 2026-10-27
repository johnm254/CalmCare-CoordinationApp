# RENAME.md — Epi → Mojo decisions
> Stage 3 · 27 Oct 2026

## What was renamed (Stage 3)

| Location | Before | After | Requirement |
|---|---|---|---|
| `src/App.tsx:545` | "Epi turns it into a log" | "Mojo turns it into a log" | CR-NAME-01 |
| `src/App.tsx:559` | "Epi never diagnoses…" | "Mojo never diagnoses…" | CR-NAME-01 |
| `src/App.tsx:703` | "Epi summarizes what was logged." | "Mojo summarises what was logged." | CR-NAME-01 |
| `src/App.tsx:818–819` | `<span>E</span> <strong>Epi</strong> Clinic` | `<span>M</span> <strong>Mojo</strong>` | CR-NAME-01 |
| `StitchDashboard.tsx` header | `alt="Project Epi Brand Logo"`, `"Project Epi"` | `alt="Mojo brand logo"`, `"Mojo"` | CR-NAME-01 |
| `StitchDashboard.tsx` strap | `"Epi Strap A"`, `"Epi Strap Pro X"` | `"Mojo Strap"` | CR-NAME-02 |
| `StitchGPS.tsx` header | `"Project Epi"` | `"Mojo"` | CR-NAME-01 |
| `StitchMedications.tsx` header | `alt="Project Epi Brand Logo"`, `"Project Epi"` | `alt="Mojo brand logo"`, `"Mojo"` | CR-NAME-01 |
| `StitchMedications.tsx` badge | `"Epi Strap Stream"` | `"Mojo Strap Stream"` | CR-NAME-02 |
| `StitchVitals.tsx` header | `alt="Project Epi Brand Logo"`, `"Project Epi"` | `alt="Mojo brand logo"`, `"Mojo"` | CR-NAME-01 |
| `clinician-web/package.json` | `"project-epi-clinician-web"` | `"mojo-clinician-web"` | CR-NAME-05 |
| `clinician-web/package.json` description | `"Project Epi - Clinician Dashboard"` | `"Mojo - Clinician Dashboard"` | CR-NAME-05 |
| `supabase/migrations/006_release2_flag.sql` | *(missing)* | `release2_ecg_rhythm = false` seeded | CR-ADD-01 |

## CR-NAME-04 status

Swahili strings cannot be added until the i18n catalogue (`packages/shared/i18n`) is built. This is tracked as `missing` in Stage 6. The product name "Mojo" is not translated in Swahili per the requirements.

## CR-NAME-06 stop list — decisions

The items below were identified during the Stage 2 audit. **None have been changed in Stage 3.**

| Identifier | Current value | Decision | Reason |
|---|---|---|---|
| Supabase project ref | `id = "project-epi"` in `supabase/config.toml` | **Keep** | Changing this breaks the API URL (`rtlhckntjrhdhbaqzxoy.supabase.co`), storage bucket URLs, Auth redirect URIs, and all existing push tokens. It is a Supabase platform identifier, not a user-facing string. |
| Database enum values | `'epi_strap_a'`, `'epi_strap_b'` in `devices.model` and `firmware_releases.model` CHECK constraints | **Recommend renaming — awaiting approval** | No live hardware is paired yet, so a data migration carries low risk. Proposed replacement: `'mojo_strap_a'` / `'mojo_strap_b'`. A new migration will be written once approved. |
| Mobile bundle ID | `com.duara.app` (Android + iOS) | **Keep — separate decision needed** | The mobile app is branded "Duara", not "Epi". Changing the bundle ID breaks existing installs and push certificates. A separate product decision is needed on whether "Duara" merges into "Mojo" or stays as a separate brand. |
| Expo update URL UUID | `https://u.expo.dev/9246ff32-…` | **Keep** | OTA channel identifier tied to the EAS project. Changing it breaks over-the-air updates. |
| Demo auth email | `amina@patient.epi` in `src/lib/supabase.ts` | **Keep for now** | Changing this in code without changing it in Supabase Auth would break the demo login. Rename requires a coordinated update in the Supabase Auth console. |
| Seed emails | `@patient.epi`, `@epi.app` in `clinician-web/scripts/seed.mjs` | **Keep for now** | Same reason as above — demo credentials tied to the live Supabase project. |

## What still needs doing (CR-NAME remaining)

| ID | What | Stage |
|---|---|---|
| CR-NAME-01 | Push notification copy still uses raw strings with emoji in `escalation-tick` — fix in Stage 4 | 4 |
| CR-NAME-03 | Mojo logo placeholder (wordmark SVG + app icon) — create assets | 5 |
| CR-NAME-04 | Swahili strings — blocked on i18n catalogue | 6 |
| CR-NAME-05 | CSS token names (`epi-teal` etc.) — none found in current code; DECISIONS.md references are doc-only | done |
| CR-NAME-06 | Device model enum rename — awaiting approval above | — |
| CR-NAME-07 | CI check script created at `scripts/check-epi-strings.sh` | done |
