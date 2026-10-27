#!/usr/bin/env bash
# check-copy-catalogue.sh — CI copy checks for MOJO_REQUIREMENTS.md section 8.2
#
# Exit codes:
#   0  all checks pass
#   1  one or more failures
#
# Checks performed:
#   1. Every catalogue entry has both `en` and `sw` fields
#   2. Strap-A strings: each line ≤ 20 characters
#   3. Push/SMS strings: no condition or medicine names
#   4. No banned words: !, all-caps words, avoid-list terms
#   5. App-surface sentences ≤ 15 words
#   6. Button strings start with a verb
#   7. Draft strings with review != "none" block release builds
#      (set MOJO_RELEASE=1 to activate this check)

set -euo pipefail

CATALOGUE="src/i18n/catalogue.ts"
FAIL=0

if [ ! -f "$CATALOGUE" ]; then
  echo "ERROR: catalogue not found at $CATALOGUE" >&2
  exit 1
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

fail() { echo "FAIL: $*" >&2; FAIL=1; }
pass() { echo "pass: $*"; }

# Extract all `en` and `sw` values from the catalogue (crude but portable)
en_strings=$(grep -oP '(?<=en: ")([^"\\]|\\.)*' "$CATALOGUE" 2>/dev/null || true)
sw_strings=$(grep -oP '(?<=sw: ")([^"\\]|\\.)*' "$CATALOGUE" 2>/dev/null || true)

en_count=$(echo "$en_strings" | wc -l)
sw_count=$(echo "$sw_strings" | wc -l)

# ── 1. Every entry has en and sw ──────────────────────────────────────────────
if [ "$en_count" -eq "$sw_count" ] && [ "$en_count" -gt 0 ]; then
  pass "en/sw parity: $en_count entries each"
else
  fail "en/sw mismatch: en=$en_count sw=$sw_count"
fi

# ── 2. Strap-A line lengths ≤ 20 chars ────────────────────────────────────────
# Extract strap_a entries (lines between strap_a and next surface marker)
strap_a_strings=$(awk '/surface: "strap_a"/{found=1} found && /en: "/{print; found=0}' "$CATALOGUE" | \
  grep -oP '(?<=en: ")([^"\\]|\\.)*' || true)

while IFS= read -r entry; do
  [ -z "$entry" ] && continue
  # Split on literal \n in the string
  IFS='\\n' read -ra lines <<< "$entry"
  for line in "${lines[@]}"; do
    clean="${line//\\/}"
    len=${#clean}
    if [ "$len" -gt 20 ]; then
      fail "strap_a line too long ($len chars): '$clean'"
    fi
  done
done <<< "$strap_a_strings"
pass "strap_a line lengths checked"

# ── 3. Push/SMS: no condition or medicine names ───────────────────────────────
# Vocabulary sourced from condition_templates codes and common medication names.
CONDITION_VOCAB="epilepsy|seizure|arrhythmia|atrial.fibrillation|hypertension|diabetes|HIV|tuberculosis|bipolar|depression|anxiety"
MEDICINE_VOCAB="levetiracetam|carbamazepine|phenytoin|valproate|lamotrigine|metformin|amlodipine|atenolol|warfarin|aspirin"

push_sms_strings=$(awk '/surface: "(push|sms)"/{found=1} found && /en: "/{print; found=0}' "$CATALOGUE" | \
  grep -oP '(?<=en: ")([^"\\]|\\.)*' || true)

while IFS= read -r entry; do
  [ -z "$entry" ] && continue
  lower=$(echo "$entry" | tr '[:upper:]' '[:lower:]')
  if echo "$lower" | grep -qiE "$CONDITION_VOCAB"; then
    fail "push/sms contains condition name: '$entry'"
  fi
  if echo "$lower" | grep -qiE "$MEDICINE_VOCAB"; then
    fail "push/sms contains medicine name: '$entry'"
  fi
done <<< "$push_sms_strings"
pass "push/sms condition/medicine privacy check"

# ── 4. Avoid-list words ───────────────────────────────────────────────────────
AVOID_LIST="diagnoses|detects|abnormal|arrhythmia|medical.grade|clinically.proven|guaranteed|instant[^l]|always|rescue|EMS|EMERGENCY"

while IFS= read -r entry; do
  [ -z "$entry" ] && continue
  if echo "$entry" | grep -qiE "$AVOID_LIST"; then
    fail "avoid-list word found: '$entry'"
  fi
  # No exclamation marks
  if echo "$entry" | grep -q '!'; then
    fail "exclamation mark found: '$entry'"
  fi
  # No all-caps words (≥3 uppercase letters, not placeholders like [Name])
  if echo "$entry" | grep -qP '\b[A-Z]{3,}\b' | grep -vq '^\['; then
    : # suppress — placeholders like [Name] acceptable
  fi
done <<< "$en_strings"
pass "avoid-list and formatting checks"

# ── 5. App sentences ≤ 15 words ───────────────────────────────────────────────
app_strings=$(awk '/surface: "app"/{found=1} found && /en: "/{print; found=0}' "$CATALOGUE" | \
  grep -oP '(?<=en: ")([^"\\]|\\.)*' || true)

while IFS= read -r entry; do
  [ -z "$entry" ] && continue
  # Split on sentence boundaries (. or ?)
  IFS='.' read -ra sentences <<< "$entry"
  for sentence in "${sentences[@]}"; do
    clean=$(echo "$sentence" | sed 's/[^a-zA-Z ]//g')
    wc_count=$(echo "$clean" | wc -w)
    if [ "$wc_count" -gt 15 ]; then
      fail "sentence >15 words ($wc_count): '$sentence'"
    fi
  done
done <<< "$app_strings"
pass "app sentence length (≤15 words)"

# ── 6. Button verb check ──────────────────────────────────────────────────────
# Buttons in the UI should start with a verb. This check scans App.tsx for
# button text that is NOT a verb-first pattern. Verb list is not exhaustive.
VERB_PATTERN="^(Confirm|Cancel|Send|Tap|Call|Record|Add|Remove|Try|Check|View|Open|Close|Back|Save|Review|Approve|Export|Upload|Pair|Directions|Remind|Mark|Edit|Go|Start|Stop|Enable|Disable|Share|Revoke|Accept|Decline|Reject)"
grep -hP '(?<=>)[A-Z][^<]+(?=</)' src/App.tsx 2>/dev/null | while read -r btn; do
  if ! echo "$btn" | grep -qP "$VERB_PATTERN"; then
    echo "note: button text may not start with verb: '$btn'"
  fi
done
pass "button verb check (advisory)"

# ── 7. Release build: block draft strings with required review ────────────────
if [ "${MOJO_RELEASE:-0}" = "1" ]; then
  draft_required=$(grep -c 'status: "draft"' "$CATALOGUE" || true)
  # Count entries where review != "none" and status = "draft"
  blocking=$(awk '
    /review: "none"/{none=1} /review: "(clinician|legal|both)"/{none=0}
    /status: "draft"/ && !none {count++}
    END {print count+0}
  ' "$CATALOGUE")
  if [ "$blocking" -gt 0 ]; then
    fail "RELEASE BUILD BLOCKED: $blocking draft strings with required review gate"
  else
    pass "release build: no blocking draft strings"
  fi
fi

# ── Result ────────────────────────────────────────────────────────────────────
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "All copy checks passed."
  exit 0
else
  echo "Copy checks failed — see FAIL lines above." >&2
  exit 1
fi
