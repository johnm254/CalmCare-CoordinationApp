# Mojo — Copy Log

Auto-generated from `src/i18n/catalogue.ts`. Do not edit manually.
Mirrors the approval log in Content Playbook v1 (O'Brien Kyalo, 23 Oct 2026).

Last generated: 27 Oct 2026

---

## Legend

| Status | Meaning |
|---|---|
| `draft` | Written but not yet approved by required reviewer(s) |
| `approved` | Signed off by all required reviewers |

| Review gate | Reviewer |
|---|---|
| `none` | No external approval needed |
| `clinician` | Clinical accuracy review required |
| `legal` | Legal / DPA / consent wording review required |
| `both` | Both clinician and legal review required |

**Release build policy:** Any entry with `review != none` and `status = draft` must carry a visible `DRAFT` marker in dev mode and will **block** a production release build.

---

## SOS Flow Copy (Project 5)

| ID | Surface | Review | Status | English (truncated to 80 chars) |
|---|---|---|---|---|
| SOS-00-STRAP-A | strap_a | both | **DRAFT** | Fall detected / Are you OK? / [I'm OK] |
| SOS-00-APP | app | both | **DRAFT** | We think you may have fallen. Tap "I'm OK" if you're fine… |
| SOS-01-STRAP-A | strap_a | both | **DRAFT** | SOS sent / Contact alerted / Hold to cancel |
| SOS-01-APP | app | both | **DRAFT** | SOS sent. We've told your SOS contact. If you're OK, tap… |
| SOS-01-PUSH | push | both | **DRAFT** | [Name] pressed SOS. Please check they are safe. Tap to respond. |
| SOS-01-SMS | sms | both | **DRAFT** | Mojo SOS: [Name] needs help (sent [time]). Reply 1 = yes, 2 = no. |
| SOS-02-PUSH | push | both | **DRAFT** | No reply yet. Please confirm [Name] is safe… |
| SOS-03-VOICE | voice | both | **DRAFT** | This is an automated emergency alert from Mojo… |
| SOS-04-PUSH | push | both | **DRAFT** | Paramedics called for [Name]. No one responded… |
| SOS-FA-APP | app | both | **DRAFT** | SOS cancelled. Your SOS contact has been told you're OK… |

**Pending approvals:** All SOS entries require clinician + legal sign-off before any pilot with patients.

---

## Concept A Strap Screen Text (Project 6)

Budget: ≤ 3 lines × 20 characters per line.

| ID | Review | Status | Line 1 | Line 2 | Line 3 |
|---|---|---|---|---|---|
| STRAP-A-DOSE-DUE | clinician | **DRAFT** | [time] | Time for your dose | [Confirm] |
| STRAP-A-DOSE-CONFIRMED | none | **DRAFT** | Dose logged | Thank you | — |
| STRAP-A-DOSE-NOT-CONFIRMED | clinician | **DRAFT** | Dose not confirmed | Press to confirm | — |
| STRAP-A-ECG-START | clinician | **DRAFT** | Touch the top strip | with your other hand | Rest your arm |
| STRAP-A-ECG-RECORDING | clinician | **DRAFT** | Keep still | 12 sec left | — |
| STRAP-A-ECG-DONE | clinician | **DRAFT** | ECG saved | You can let go | — |
| STRAP-A-ECG-RETAKE | clinician | **DRAFT** | Signal weak | Rest your arm | Try again |
| STRAP-A-ECG-CONTACT-LOST | clinician | **DRAFT** | Contact lost | Keep finger on strip | — |
| STRAP-A-FALL-CHECK | both | **DRAFT** | Fall detected | Are you OK? | [I'm OK] |
| STRAP-A-SOS-SENT | both | **DRAFT** | SOS sent | Contact alerted | Hold to cancel |
| STRAP-A-HELP-CALLED | both | **DRAFT** | Help called | Paramedics alerted | — |
| STRAP-A-BATTERY-LOW | none | **DRAFT** | Battery low | Charge today | — |
| STRAP-A-PHONE-NOT-LINKED | none | **DRAFT** | Phone not linked | Open the Mojo app | — |

**Character counts (longest line):**

| ID | Max chars | Budget | Pass? |
|---|---|---|---|
| STRAP-A-DOSE-DUE | 18 (Time for your dose) | 20 | PASS |
| STRAP-A-DOSE-CONFIRMED | 11 (Dose logged) | 20 | PASS |
| STRAP-A-DOSE-NOT-CONFIRMED | 18 (Dose not confirmed) | 20 | PASS |
| STRAP-A-ECG-START | 20 (Touch the top strip) | 20 | PASS |
| STRAP-A-ECG-RECORDING | 13 (12 sec left) | 20 | PASS |
| STRAP-A-ECG-DONE | 14 (You can let go) | 20 | PASS |
| STRAP-A-ECG-RETAKE | 15 (Rest your arm) | 20 | PASS |
| STRAP-A-ECG-CONTACT-LOST | 20 (Keep finger on strip) | 20 | PASS |
| STRAP-A-FALL-CHECK | 13 (Are you OK?) | 20 | PASS |
| STRAP-A-SOS-SENT | 15 (Contact alerted) | 20 | PASS |
| STRAP-A-HELP-CALLED | 18 (Paramedics alerted) | 20 | PASS |
| STRAP-A-BATTERY-LOW | 12 (Charge today) | 20 | PASS |
| STRAP-A-PHONE-NOT-LINKED | 18 (Open the Mojo app) | 20 | PASS |

---

## Concept B Phone Messages (Project 6)

| ID | Review | Status | English |
|---|---|---|---|
| STRAP-B-DOSE-DUE | clinician | **DRAFT** | Time for your [time] dose. Tap the strap or this button to confirm. |
| STRAP-B-DOSE-CONFIRMED | none | **DRAFT** | Dose logged. Thank you. |
| STRAP-B-ECG-RECORDING | clinician | **DRAFT** | ECG recording. Keep still. |
| STRAP-B-ECG-RETAKE | clinician | **DRAFT** | Signal weak. Rest your arm and try again. |
| STRAP-B-FALL-CHECK | both | **DRAFT** | We think you may have fallen. Tap "I'm OK" if you're fine. |
| STRAP-B-SOS-SENT | both | **DRAFT** | SOS sent. Your SOS contact has been alerted. |
| STRAP-B-BATTERY-LOW | none | **DRAFT** | Battery low. Charge today. |
| STRAP-B-PHONE-NOT-LINKED | none | **DRAFT** | Your Mojo strap is not linked to a phone. Open the Mojo app. |

---

## Concept B Firmware Pattern IDs

Named patterns the hardware lead tunes in config. Pulse count + length distinguish events (not colour alone).

| Pattern ID | Event | Light | Vibration | Notes |
|---|---|---|---|---|
| `dose_due` | Dose reminder | Slow amber pulse | 2 short, repeating | Repeats until confirmed or snoozed |
| `dose_confirmed` | Dose logged | One quick flash | 1 short | Confirmation feedback |
| `ecg_recording` | ECG in progress | Steady amber | Long continuous | Stops when recording ends |
| `ecg_retake` | Signal weak | 3 rapid amber | 3 short | Retry prompt |
| `fall_check` | Fall detected | Slow red pulse | 2 long, 1 short | 30 s window before SOS |
| `sos_sent` | SOS active | Fast red pulse | Continuous | Until cancelled or responded |
| `battery_low` | Battery < 20% | Slow red | 1 short, hourly | Ramps at < 10% |
| `phone_not_linked` | BLE disconnected | Slow white | None at night | Silent between 22:00–07:00 |

---

## Consent Screens (Project 7)

| ID | Review | Status | Purpose |
|---|---|---|---|
| CON-01 | both | **DRAFT** | Welcome / onboarding |
| CON-02 | legal | **DRAFT** | Location sharing |
| CON-03 | both | **DRAFT** | Medical details with paramedics |

**Remaining consent screens to draft (per CR-SEC-10):**
- SOS contact acceptance message (CR-CG-07)
- Clinician link consent
- Stop sharing / data deletion
- Offline / background use

---

## Summary

| Status | Count |
|---|---|
| approved | 0 |
| draft (review = none) | 7 |
| draft (review = clinician) | 10 |
| draft (review = legal) | 1 |
| draft (review = both) | 16 |
| **Total** | **34** |

**Zero strings are approved.** All must pass clinician and/or legal review before any pilot with patients. See `docs/GAPS.md` for the full list of items awaiting human sign-off.
