#!/usr/bin/env bash
# check-analytics.sh — CI check: no health data to analytics/ad networks
# CR-SEC-13: Mojo must not send health data to analytics or advertising platforms.
# Exit 0 = clean. Exit 1 = violation found.
#
# Checks:
#   1. HARD  — Ad/analytics pixel domains present in source files
#   2. HARD  — navigator.sendBeacon to external (non-localhost) URLs
#   3. ADVISORY — fetch/axios calls to non-Supabase external hosts
#   4. HARD  — Analytics code present without MOJO_ANALYTICS_APPROVED legal flag

set -uo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

FAIL=0   # accumulator: set to 1 on any hard failure

pass()     { echo -e "${GREEN}PASS${RESET}  $*"; }
fail()     { echo -e "${RED}FAIL${RESET}  $*" >&2; FAIL=1; }
advisory() { echo -e "${YELLOW}ADVISORY${RESET}  $*"; }

# ── Source file patterns to search ───────────────────────────────────────────
SRC_PATTERNS=(
  "src"
  "index.html"
  "public"
)

# Build a single grep invocation that searches all relevant source locations.
# We use --include to restrict to .ts, .tsx, .js, .html files.
grep_sources() {
  local pattern="$1"
  grep -rn \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.html" \
    -E "$pattern" \
    "${SRC_PATTERNS[@]}" 2>/dev/null || true
}

# ── 1. Ad pixel / analytics domains ──────────────────────────────────────────
echo ""
echo "=== Check 1: Ad pixel and analytics domains (HARD) ==="

AD_DOMAINS=(
  "google-analytics\\.com"
  "googletagmanager\\.com"
  "facebook\\.com/tr"
  "doubleclick\\.net"
  "amplitude\\.com"
  "mixpanel\\.com"
  "segment\\.com"
  "hotjar\\.com"
  "fullstory\\.com"
  "heap\\.io"
)

DOMAIN_PATTERN=$(printf "%s|" "${AD_DOMAINS[@]}")
DOMAIN_PATTERN="${DOMAIN_PATTERN%|}"  # strip trailing pipe

AD_MATCHES=$(grep_sources "$DOMAIN_PATTERN")

ANALYTICS_CODE_FOUND=0

if [ -n "$AD_MATCHES" ]; then
  fail "Ad/analytics domain(s) found in source files:"
  echo "$AD_MATCHES" | while IFS= read -r line; do
    echo "        $line"
  done
  ANALYTICS_CODE_FOUND=1
else
  pass "No ad/analytics pixel domains found in source files"
fi

# ── 2. navigator.sendBeacon to external URLs ──────────────────────────────────
echo ""
echo "=== Check 2: navigator.sendBeacon to external hosts (HARD) ==="

BEACON_MATCHES=$(grep_sources "sendBeacon" | grep -v "localhost" | grep -v "127\.0\.0\.1" || true)

if [ -n "$BEACON_MATCHES" ]; then
  fail "navigator.sendBeacon call(s) pointing to non-local URL:"
  echo "$BEACON_MATCHES" | while IFS= read -r line; do
    echo "        $line"
  done
else
  pass "No external sendBeacon calls found"
fi

# ── 3. fetch/axios to non-Supabase external hosts (ADVISORY) ─────────────────
echo ""
echo "=== Check 3: fetch/axios to non-Supabase external hosts (ADVISORY) ==="

# Find fetch( or axios. calls that contain a URL not matching known-safe hosts
EXTERNAL_FETCH_MATCHES=$(
  grep_sources "(fetch\(|axios\.)" \
  | grep -v "supabase" \
  | grep -v "localhost" \
  | grep -v "127\.0\.0\.1" \
  | grep -v "//'" \
  | grep -v '//`' \
  || true
)

if [ -n "$EXTERNAL_FETCH_MATCHES" ]; then
  advisory "fetch/axios calls to potentially external hosts — verify no health data is sent:"
  echo "$EXTERNAL_FETCH_MATCHES" | while IFS= read -r line; do
    echo "        $line"
  done
else
  pass "No suspicious external fetch/axios calls found (advisory)"
fi

# ── 4. Legal approval flag check ──────────────────────────────────────────────
echo ""
echo "=== Check 4: Analytics legal flag MOJO_ANALYTICS_APPROVED (HARD) ==="

ANALYTICS_LIB="src/lib/analytics.ts"
APPROVAL_TOKEN="MOJO_ANALYTICS_APPROVED"

if [ "$ANALYTICS_CODE_FOUND" -eq 1 ]; then
  # Analytics domains were found in check 1 — require the legal approval token
  if [ -f "$ANALYTICS_LIB" ] && grep -q "$APPROVAL_TOKEN" "$ANALYTICS_LIB" 2>/dev/null; then
    pass "Analytics code found and $APPROVAL_TOKEN token present in $ANALYTICS_LIB"
  else
    fail "Analytics/pixel code detected (Check 1) but $APPROVAL_TOKEN is NOT present in $ANALYTICS_LIB"
    echo "        → Obtain legal approval, add the token to $ANALYTICS_LIB, then re-run."
  fi
else
  # No analytics domains found — the approval token is not required but report its state
  if [ -f "$ANALYTICS_LIB" ] && grep -q "$APPROVAL_TOKEN" "$ANALYTICS_LIB" 2>/dev/null; then
    pass "$APPROVAL_TOKEN present in $ANALYTICS_LIB (no active analytics domains detected)"
  else
    pass "No analytics code found; $APPROVAL_TOKEN check skipped"
  fi
fi

# ── Result ────────────────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────────────────"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}All analytics checks passed.${RESET}"
  exit 0
else
  echo -e "${RED}Analytics checks FAILED — see FAIL lines above.${RESET}" >&2
  echo "  CR-SEC-13: Mojo must not send health data to analytics or ad networks." >&2
  echo "  See docs/GAPS.md for remediation steps." >&2
  exit 1
fi
