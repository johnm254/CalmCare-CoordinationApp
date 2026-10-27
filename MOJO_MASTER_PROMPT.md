# MASTER PROMPT — Mojo: verify, rename and complete the built app

Paste this into Claude Code at the repo root.

---

You are the lead engineer doing the **final verification and completion pass** on an app that is already built. It was developed as **Project Epi**, and it is now called **Mojo**.

Your job has three parts:
1. **Rename** the product to Mojo everywhere a user sees it.
2. **Prove** that every requirement in `MOJO_REQUIREMENTS.md` is built and working, with evidence.
3. **Fix** whatever is missing, partial or wrong, without redesigning or rewriting what already works.

## Files to read first, in full

| File | What it is |
|---|---|
| `MOJO_REQUIREMENTS.md` | The checklist. Over 100 requirement IDs (`CR-…`), plus the brand, defaults, stop list and copy rules. **This is the scope.** |
| `docs/content/MOJO_CONTENT_PLAYBOOK.md` | Every word a user sees: voice, word list, claims by release, SOS messages, strap screen text, Concept B light and vibration patterns, consent screens, clinician messages |
| `PROJECT_EPI_BUILD_SPEC.md` (if present) | Technical detail: data model, RLS, BLE protocol, Edge Functions, test list. Read "Epi" as "Mojo" |

If these files disagree, `MOJO_REQUIREMENTS.md` section 8.1 says which wins. For any other conflict, stop and ask me.

---

## Ground rules

1. **Evidence, not belief.** A requirement is `verified` only when you have traced the behaviour in the code (not just a file or function name) **and** a test with the requirement ID in its name passes, e.g. `CR-SOS-04 "I can't reach them" does not stop escalation`. A screen existing is not proof that it works.
2. **Don't fake it.** Never skip, delete or loosen a test to make it pass. Never mock the thing under test, and never mark something verified because a TODO, comment or stub suggests it. If a test fails, the code is wrong until shown otherwise.
3. **Preserve what works.** Keep the existing tech stack, structure, design system and screens. Change only what a requirement needs. If a fix needs a redesign or a new library, ask first.
4. **Database rules first.** Consent and access are enforced in the database (RLS) and tested for every role. A rule that exists only in the UI counts as `partial`.
5. **Offline first.** On the phone, logging, confirming a dose, opening records and pressing SOS never wait for the network.
6. **No medical logic.** Mojo shows trends and alerts against limits the clinician sets. It never diagnoses, suggests a dose or changes a dose.
7. **No home-made copy.** Every user-facing string comes from the playbook through the i18n catalogue (`MOJO_REQUIREMENTS.md` section 8.2). Keep `[placeholders]` as config or TODO values. If a string is missing from the playbook, use `TODO(COPY): …` and list it in `docs/COPY_GAPS.md`.
8. **Never drop a feature silently.** If something cannot be finished, put it behind a feature flag, add `TODO(MOJO-xxx)` with the reason, and list it in `docs/GAPS.md`.
9. **Secrets.** Only public/anon keys in the apps. CI fails if a service key appears in a client bundle.
10. **Small commits** named by stage, e.g. `s3(mobile): CR-LOC-05 cache hospitals within 50 km`.
11. **Stop list.** Never do anything in `MOJO_REQUIREMENTS.md` section 7 without asking me, including changing bundle IDs, application IDs, deep-link schemes, table names or BLE UUIDs during the rename.

### Definition of done (every requirement)
Types compile · unit tests pass · RLS tests pass for every role it touches · works offline (mobile) · usable at 200% text size · screen reader labels · English and Swahili strings · light and dark mode · copy passes the section 8.2 checks.

---

## Stage 1 — Inventory and baseline (no code changes)

1. Map the repo: apps, packages, backend, firmware, tests, CI. Note the stack actually used.
2. Run the existing build, typecheck, lint and full test suite. Record the results as the **baseline** in `docs/VERIFICATION.md`, including tests that were already failing.
3. List every place "Epi" appears (whole word, case-insensitive; not "epilepsy"), split into **user-facing**, **internal code** and **identifiers in CR-NAME-06**.

## Stage 2 — Verification audit (no code changes)

Create `docs/VERIFICATION.md` with one row for **every** ID in `MOJO_REQUIREMENTS.md`, CR-NAME to CR-SEC, plus a row for each section 8 rule:

| ID | Requirement (short) | Status | Evidence (files, functions) | Test (name, pass/fail/none) | What is needed |
|---|---|---|---|---|---|

Status is one of `verified`, `partial`, `missing`, `conflicts` (built differently from the requirement, e.g. the old `SAFE 1234` SMS code) or `blocked` (needs hardware, a real SIM, a provider contract or a decision).

Also produce a **copy audit**: existing strings that break the playbook, such as the wrong product name, "abnormal", exclamation marks, a condition or medicine name on the lock screen, an ECG rhythm result in Release 1, or "emergency contact" where the term key should be used.

**Then stop and send me:**
- a short summary of the app as built
- counts by status, per group (CR-PAT, CR-SOS, …)
- the top 10 risks, safety-critical ones first
- the CR-NAME-06 identifiers, with your recommendation for each
- your fix plan for stages 3–6

Wait for my OK before stage 3.

## Stage 3 — Rename to Mojo

Do CR-NAME-01 to 05 and add the CR-NAME-07 CI check. Leave the CR-NAME-06 identifiers as they are unless I approved changing them, and record each decision in `docs/RENAME.md`. Rebuild and re-run the full suite; nothing that passed at baseline may fail.

## Stage 4 — Safety-critical gaps first

Fix and test, in this order:
1. **Access and consent:** RLS for every role, grants by category, revoke clears cache, audit log, admin has no clinical access, break-glass (CR-SEC, CR-ADM-01).
2. **SOS and escalation:** fall check, T+0 / T+2 / T+4 timeline, who can stop it ("I can't reach them" does not), the 1/2 SMS replies, contact acceptance by YES/NO, offline SMS and the no-signal queue, dispatch adapters in **sandbox**, false alarms, the mental-health pathway never dispatches (CR-SOS, CR-CG-05 to 07, CR-MED-04).
3. **Medication:** reminders on the strap and phone, a dose logged once, the missed-dose rules, lock-screen privacy (CR-MED, CR-STRAP-05, CR-SEC-11).
4. **Offline and sync:** no duplicates, stale edits rejected, reboot-safe reminders (CR-PAT-09, CR-STRAP-04).

## Stage 5 — Client add-ons and the remaining features

1. **Add-ons:** ECG Release 1 behaviour with Release 2 behind `release2_ecg_rhythm` (off), BP cuff, glucose, scale, approved models list (CR-ADD).
2. **Location:** GPS during alerts only, live link, address and landmarks, contacts picker, hospital list from KMHFL with the offline cache and ranking, directions, Call ambulance (CR-LOC).
3. **Patient, caregiver, clinician and admin gaps** (CR-PAT, CR-CG, CR-CLIN, CR-ADM).
4. **Strap:** Concept A screen text within 3 × 20 characters, Concept B light and vibration patterns (section 8.3).

## Stage 6 — Copy, accessibility and languages

Load every playbook string into the catalogue with copy IDs, review flags and status. Generate `docs/COPY_LOG.md`. Turn on the section 8.2 CI checks and fix every failure. Then do an accessibility pass (200% text, screen reader, dark mode) and a Swahili pass, marking Swahili strings `needs_review` for a human reviewer.

## Stage 7 — Final proof

1. Run the full suite plus end-to-end scenarios. Use Playwright for the web portals, and Maestro or Detox for the mobile app if set up; if not, write the scenarios so they can run later. At minimum:
   - a fall with no response dispatches (sandbox) at T+4 min, and a reply of 1 at T+3 min stops it
   - an SOS with no internet sends an SMS; with no signal it queues and tells the patient
   - a caregiver without a grant sees nothing; after a grant sees only that category; after a revoke sees nothing, and their cache is cleared
   - an unverified clinician sees nothing; every patient view is audited and appears in the patient's activity log
   - a dose confirmed on both the strap and the app is logged once
   - a mood alert never dispatches
   - the nearest-hospital list works in airplane mode
   - no "Epi" appears anywhere a user can see
2. Write `docs/MANUAL_TEST_PLAN.md` for whatever you cannot run here: real BLE straps and add-ons, real SIMs and SMS, phone calls, OTA updates, battery life, sensor accuracy, and usability with older patients. Give steps and expected results for each, tagged with requirement IDs.
3. Update `docs/VERIFICATION.md` so every row is `verified`, or is in `docs/GAPS.md` / `docs/MANUAL_TEST_PLAN.md` with a reason.

**Final report to me:** counts by status before and after · what changed · test totals (unit, RLS, e2e) · open gaps · manual tests still to run · every stop-list item waiting on a human (ambulance provider, DPA/ODPC, PPB, Mojo trademark, copy approvals, Release 2).

---

## Report format after each stage

What was done · requirement IDs that moved to `verified` · tests added and their results · anything new that is `blocked` · decisions I need to make. Keep it short. The detail lives in `docs/VERIFICATION.md`.

## Start now
Begin Stage 1.
