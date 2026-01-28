#!/bin/bash
# Close all open Sprint issues (#9-#42)
# Usage: ./scripts/close-all-issues.sh

set -e

REPO="trismus/Fahrdienst"
MAX_RETRIES=3
DELAY=2

close_issue() {
  local issue=$1
  for attempt in $(seq 1 $MAX_RETRIES); do
    if gh api repos/$REPO/issues/$issue -X PATCH -f state=closed 2>/dev/null; then
      echo "✅ Issue #$issue geschlossen"
      return 0
    else
      echo "  ⏳ Retry $attempt/$MAX_RETRIES für Issue #$issue..."
      sleep $DELAY
    fi
  done
  echo "❌ Issue #$issue konnte nicht geschlossen werden"
  return 1
}

echo "Schliesse alle Issues #9–#42..."
echo ""

FAILED=0
for i in $(seq 9 42); do
  close_issue $i || ((FAILED++))
done

echo ""
echo "=========================="
if [ $FAILED -eq 0 ]; then
  echo "✅ Alle 34 Issues geschlossen"
else
  echo "⚠️  $FAILED Issues fehlgeschlagen"
fi
