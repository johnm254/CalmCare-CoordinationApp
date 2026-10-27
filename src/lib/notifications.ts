/**
 * notifications.ts — Notification privacy filter (CR-SEC-11)
 *
 * Push notifications appear verbatim on a device lock screen. For patients
 * in Kenya (and globally), exposing a condition name or medicine name on the
 * lock screen constitutes a privacy violation and potentially a safety risk.
 *
 * All code that constructs a push-notification payload MUST import and call
 * either `filterNotification` (auto-redact) or `validateNotificationCopy`
 * (lint-time check) before dispatching via Expo or Supabase push.
 *
 * Vocabulary lists are kept in sync with scripts/check-copy-catalogue.sh.
 */

// ── Vocabulary lists ──────────────────────────────────────────────────────────

// Keep this list in sync with CONDITION_VOCAB in scripts/check-copy-catalogue.sh

const CONDITION_TERMS: string[] = [
  "epilepsy",

  "seizure",

  "arrhythmia",

  "atrial fibrillation",

  "hypertension",

  "diabetes",

  "hiv",

  "tuberculosis",

  "tb",

  "bipolar",

  "depression",

  "anxiety",

  "copd",

  "asthma",

  "parkinson",

  "sickle cell",

  "kidney disease",

  "pregnancy",
]

// Keep this list in sync with MEDICINE_VOCAB in scripts/check-copy-catalogue.sh

const MEDICINE_TERMS: string[] = [
  "levetiracetam",

  "carbamazepine",

  "phenytoin",

  "valproate",

  "lamotrigine",

  "metformin",

  "amlodipine",

  "atenolol",

  "warfarin",

  "aspirin",

  "insulin",

  "amoxicillin",

  "fluoxetine",

  "sertraline",
]

// All prohibited terms combined, sorted longest-first to prevent partial-match

// shadowing (e.g. "atrial fibrillation" must match before "fibrillation").

const ALL_PROHIBITED_TERMS: string[] = [
  ...CONDITION_TERMS,
  ...MEDICINE_TERMS,
].sort(
  (a, b) => b.length - a.length,
)

// Pre-compiled regex for fast repeated use; case-insensitive word-boundary match

function buildProhibitedRegex(): RegExp {
  const escaped = ALL_PROHIBITED_TERMS.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  )

  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi")
}

const PROHIBITED_REGEX: RegExp = buildProhibitedRegex()

// ── 1. filterNotification ─────────────────────────────────────────────────────

/**
 * Scans `title` and `body` for any condition or medicine term (case-insensitive,
 * whole-word match) and replaces every match with `"[health event]"`.
 *
 * Security purpose (CR-SEC-11): ensures that a push notification payload can
 * never expose a medical condition or drug name on a device lock screen, even
 * if upstream code inadvertently injects such a term.
 *
 * @returns The sanitised title and body, plus `wasFiltered: true` when at
 *   least one replacement was made. The caller should log `wasFiltered` so
 *   the copy team can fix the source template.
 */

export function filterNotification(
  title: string,

  body: string,
): { title: string body: string wasFiltered: boolean } {
  let wasFiltered = false

  const sanitise = (text: string): string =>
    text.replace(PROHIBITED_REGEX, (match) => {
      // Only flag when the match is non-empty (regex guarantees it is)

      if (match.length > 0) wasFiltered = true

      return "[health event]"
    })

  return {
    title: sanitise(title),

    body: sanitise(body),

    wasFiltered,
  }
}

// ── 2. validateNotificationCopy ───────────────────────────────────────────────

/** Regex matching ALL-CAPS words of 3+ characters that are NOT bracket placeholders. */

const ALL_CAPS_WORD_RE = /\b([A-Z]{3,})\b/g

/** Bracket placeholders such as [NAME], [Name], [PATIENT] — exempt from caps check. */

const BRACKET_PLACEHOLDER_RE = /^\[.+\]$/

/**
 * Validates that a notification title/body is suitable for lock-screen display.
 *
 * Security purpose (CR-SEC-11): acts as a lint-time gate in CI so that copy
 * writers receive actionable feedback before a bad string reaches production.
 *
 * Checks performed:
 *   (a) No condition or medicine terms.
 *   (b) No `!` characters (sensationalist tone can be alarming on lock screen).
 *   (c) No ALL-CAPS words ≥ 3 characters, excluding bracket placeholders like `[NAME]`.
 *   (d) Title ≤ 10 words.
 *   (e) Body ≤ 15 words.
 *
 * @returns An array of human-readable violation strings. Empty array means the
 *   copy is clean and safe for lock-screen delivery.
 */

export function validateNotificationCopy(
  title: string,
  body: string,
): string[] {
  const violations: string[] = []

  // (a) No prohibited medical terms ─────────────────────────────────────────

  const checkTerms = (field: string, text: string) => {
    // Reset lastIndex because PROHIBITED_REGEX is stateful (global flag)

    PROHIBITED_REGEX.lastIndex = 0

    let match: RegExpExecArray | null

    while ((match = PROHIBITED_REGEX.exec(text)) !== null) {
      violations.push(
        `${field} contains prohibited term "${match[0]}" (condition/medicine name)`,
      )
    }

    PROHIBITED_REGEX.lastIndex = 0
  }

  checkTerms("title", title)

  checkTerms("body", body)

  // (b) No exclamation marks ──────────────────────────────────────────────────

  if (title.includes("!")) violations.push('title contains "!" character')

  if (body.includes("!")) violations.push('body contains "!" character')

  // (c) No ALL-CAPS words ≥ 3 chars (except bracket placeholders) ───────────

  const checkCaps = (field: string, text: string) => {
    ALL_CAPS_WORD_RE.lastIndex = 0

    let m: RegExpExecArray | null

    while ((m = ALL_CAPS_WORD_RE.exec(text)) !== null) {
      // Walk back to see if the word sits inside a bracket placeholder

      const surroundingToken = text

        .slice(Math.max(0, m.index - 1))

        .match(/^\[([A-Z][A-Za-z]*)\]/)

      if (surroundingToken) continue // e.g. [NAME] — acceptable

      // Direct bracket-only form like [NAME] captured as word

      if (BRACKET_PLACEHOLDER_RE.test(m[0])) continue

      violations.push(
        `${field} contains ALL-CAPS word "${m[0]}" (use sentence case)`,
      )
    }

    ALL_CAPS_WORD_RE.lastIndex = 0
  }

  checkCaps("title", title)

  checkCaps("body", body)

  // (d) Title ≤ 10 words ─────────────────────────────────────────────────────

  const titleWordCount = countWords(title)

  if (titleWordCount > 10) {
    violations.push(`title is ${titleWordCount} words (maximum 10)`)
  }

  // (e) Body ≤ 15 words ──────────────────────────────────────────────────────

  const bodyWordCount = countWords(body)

  if (bodyWordCount > 15) {
    violations.push(`body is ${bodyWordCount} words (maximum 15)`)
  }

  return violations
}

/** Counts whitespace-delimited words, ignoring leading/trailing whitespace. */

function countWords(text: string): number {
  const trimmed = text.trim()

  if (trimmed.length === 0) return 0

  return trimmed.split(/\s+/).length
}

// ── 3. LOCK_SCREEN_SAFE ───────────────────────────────────────────────────────

/**
 * Pre-approved notification templates that have already passed the privacy
 * and copy review mandated by CR-SEC-11 and the Mojo content playbook.
 *
 * Security purpose: provides a single source of truth for safe notification
 * copy. Never bypass this catalogue with ad-hoc strings in application code.
 * Use `interpolate()` to substitute `[Name]` placeholders before sending.
 *
 * Template keys match `notification_templates.template_key` in the database
 * (migration 009) so that admin copy updates are reflected without a code deploy.
 */

export const LOCK_SCREEN_SAFE = {
  sos: {
    title: "[Name] pressed SOS",

    body: "Please check they are safe. Tap to respond.",
  },

  missed_dose: {
    title: "Dose reminder",

    body: "A reminder has been sent for [Name].",
  },

  fall_check: {
    title: "[Name] may need help",

    body: "They have not responded to a fall check.",
  },

  awaiting_response: {
    title: "No reply yet",

    body: "[Name] may need help. Tap to respond.",
  },

  dispatching: {
    title: "Emergency services notified",

    body: "Escalation complete for [Name].",
  },
} as const

// ── 4. interpolate ────────────────────────────────────────────────────────────

/**
 * Substitutes `[Key]` placeholders in a template string with values from `vars`.
 *
 * Security purpose: separates static, privacy-reviewed copy from runtime
 * variable data so that dynamic values (patient names, etc.) never enter the
 * copy-review pipeline and cannot accidentally introduce prohibited terms.
 *
 * @example
 *   interpolate(LOCK_SCREEN_SAFE.sos.title, { Name: "Amina" })
 *   // → "Amina pressed SOS"
 *
 * @param template - A pre-approved string from `LOCK_SCREEN_SAFE` (or the DB).
 * @param vars     - Map of placeholder keys (without brackets) to replacement values.
 * @returns The template with all matching placeholders replaced.
 */

export function interpolate(
  template: string,

  vars: Record<string, string>,
): string {
  return template.replace(/\[([^\]]+)\]/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  })
}
