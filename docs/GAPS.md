# Mojo — Gaps and Blocked Items

> Items listed here cannot be completed in code alone. Each has a reason and a flag for client/legal action.
> Status: ⚠️ built with default (configurable) · ❌ blocked (cannot proceed without external action)

---

| ID | Item | Reason blocked | What is needed | Flag |
|---|---|---|---|---|
| CR-STR-09 | Prototype on ready-made modules (nRF52840 / ESP32) | Hardware procurement and firmware development — outside software scope | Client to source nRF52840 dev kit; firmware engineer to implement Zephyr/nRF Connect SDK project | ⚠️ hardware |
| CR-STR-10 | Validation against a medical-grade device | Requires physical strap prototype + clinical protocol | Phase 8 gate; client must arrange clinical-setting comparison study | ❌ Phase 8 |
| CR-STR-11 | Final casing and battery design | Industrial design task | Client to commission product designer for Concept A and B enclosures | ⚠️ industrial design |
| CR-SOS-03 | Automatic paramedic call when nobody responds | Requires a live emergency dispatch provider agreement (phone/API) | Admin must add a live `emergency_providers` row and flip `mode` to `live`. Two-admin approval required. **STOP before go-live.** | ❌ provider contract |
| CR-SOS-14 | Tested on real SIMs (iOS + Android) | Requires physical devices on real Kenyan SIM cards | QA must test on Safaricom/Airtel SIMs; Apple/Google Play policies may restrict `SEND_SMS` | ❌ Phase 8 |
| CR-SOS-15 | Tested, reliable call route | Depends on CR-SOS-03 (live provider) | Same as CR-SOS-03 | ❌ provider contract |
| CR-CLN-03 | Licence checked against official register | KMPDC/COC/NCK do not yet offer a public REST API | Admin verification queue is built as fallback. When KMPDC API becomes available, implement the `register_api` method in `verify-clinician` Edge Function. | ⚠️ external API |
| CR-GPS-02 | Live location scope change | Client must confirm in writing that live location updates during alerts (beyond the original "snapshot at SOS" scope) are acceptable | Requires written client confirmation per `docs/DECISIONS.md` D-13 | ⚠️ client sign-off |
| CR-APP-11 | Follow the three client canvas designs | Client designs not yet supplied | Client to export Figma frames to `docs/designs/` so exact layouts can be matched | ⚠️ designs needed |
| CR-SEC-06 | Kenya DPA / HIPAA / GDPR compliance | Legal review required before launch | Engage a Kenya-based data-protection lawyer; ODPC registration; assess HIPAA/GDPR if US/EU patients served | ❌ legal review |
| CR-SEC-07 | Pharmacy and Poisons Board classification | Regulatory check required before marketing | Client to engage PPB; determine if device is Class I/II medical device | ❌ regulatory |
| CR-PLT-05 | Open questions answered with client | Multiple items in spec section 16 need written answers | Schedule a client review session; use `docs/DECISIONS.md` to record answers | ⚠️ client meeting |

---

## Feature flags (built but off by default)

These features are built behind a feature flag in the `feature_flags` table and disabled until the client confirms:

| Flag key | Feature | When to enable |
|---|---|---|
| `live_dispatch` | Real paramedic dispatch (not sandbox) | After provider contract + two-admin approval |
| `background_location` | "Always" location permission for automatic location during alerts | After client written confirmation (CR-GPS-02) |
| `hospital_arrival_sms` | Notify facility emergency desk when patient may be en route | Opt-in per facility via admin portal |
| `health_kit_bridge` | Read BP/glucose/weight from Apple HealthKit / Android Health Connect | After testing on target devices |
| `org_admin_role` | org_admin role UI and permissions | After first clinic onboards |
| `release2_ecg_rhythm` | Rhythm classification in ECG panel | After PPB guidance + validation study |

---

## Stage 6 copy gaps (human sign-off required before any patient-facing pilot)

All 34 entries in `src/i18n/catalogue.ts` are `status: draft`. Zero are approved.

| Count | Gate | Items |
|---|---|---|
| 16 | clinician + legal | SOS steps 0–4, fall-check messages, caregiver alert copy, consent screens |
| 10 | clinician only | Strap screen text (dose, ECG events) |
| 1 | legal only | Location consent (CON-02) |
| 7 | none | Strap utility messages (battery, linked, etc.) |

**Action required:** Route the draft catalogue to O'Brien Kyalo (content) → named clinician → legal reviewer → project lead sign-off. See `docs/COPY_LOG.md` for the full table and playbook references.

## Stage 6 accessibility gaps (require device testing)

| Item | What is needed |
|---|---|
| 200% system text size | Manual test on iOS and Android at 200% font scale; verify no truncation in SOS screens |
| VoiceOver / TalkBack | Screen-reader walkthrough of the SOS flow end-to-end |
| Dark mode (Vitals / Clinician) | StitchVitals and Clinician shell use hardcoded dark colors; verify contrast ratios with WCAG AA tool |
| Swahili RTL | Swahili is LTR, but flag for translator: any idioms or length mismatches that break layout |

## Stage 6 i18n gaps

- Swahili strings in `catalogue.ts` are machine-drafted. All marked `needs_review`. A human Swahili speaker must review before any Swahili-language pilot.
- No runtime i18n framework is wired up yet (all strings in `catalogue.ts` are a reference catalogue, not yet connected to the UI via `getCopy()` / `getSurface()`). Wiring to the UI is Stage 6 completion work.
- `TODO(COPY): SOS-CG-02` — caregiver alert copy in Swahili not yet in the catalogue.
