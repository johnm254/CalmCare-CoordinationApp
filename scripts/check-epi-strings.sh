#!/usr/bin/env bash
# CR-NAME-07: fail CI if any user-facing file contains the word "Epi" (whole word,
# case-insensitive) outside of "epilepsy", file names, or known stop-list identifiers.
#
# Scans: src/, clinician-web/app/, clinician-web/components/, mobile/app/, mobile/components/,
#         public/, supabase/functions/, index.html
# Excludes: node_modules, dist, .git, *.md (docs), supabase/migrations (SQL identifiers),
#            supabase/config.toml (project ref), src/lib/supabase.ts (demo email)

set -euo pipefail

SCAN_DIRS=(
  "src"
  "clinician-web/app"
  "clinician-web/components"
  "mobile/app"
  "mobile/components"
  "public"
  "supabase/functions"
  "index.html"
)

EXCLUDE_PATTERN='epilepsy|epi_strap_[ab]|project-epi|@patient\.epi|@epi\.app|amina@|com\.duara'

FOUND=0

for target in "${SCAN_DIRS[@]}"; do
  [ -e "$target" ] || continue
  while IFS= read -r line; do
    # Skip lines that only contain known stop-list identifiers
    if echo "$line" | grep -qiE "$EXCLUDE_PATTERN"; then
      continue
    fi
    echo "$line"
    FOUND=1
  done < <(grep -rn --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --include="*.html" --include="*.json" \
    -iw "epi" "$target" 2>/dev/null || true)
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "CR-NAME-07 FAIL: user-facing 'Epi' found. Rename to 'Mojo' or add to stop-list exclusions."
  exit 1
fi

echo "CR-NAME-07 PASS: no user-facing 'Epi' found."
exit 0
