#!/bin/bash
# Script to create remaining GitHub issues for Internal Application Logging feature
# Issues 1-2 were already created (56, 57)
# This creates issues 3-5

set -e

MILESTONE="Internal Application Logging"

echo "Creating remaining GitHub Issues for Application Logging Feature..."
echo "Milestone: $MILESTONE"
echo "Note: Issues 1-2 already created (#56, #57)"
echo ""

# Issue 3: Admin Log Page (List View)
echo "Creating Issue 3: Admin Log Page (List View)..."
sleep 3
gh issue create \
  --title "[Logging] Admin Log Page (List View)" \
  --label "enhancement,logging,P1: Important" \
  --milestone "$MILESTONE" \
  --body "$(cat <<'EOF'
## User Story

**Als** Administrator
**will ich** eine Übersicht aller Application Logs sehen
**damit** ich Fehler schnell identifizieren kann

## Acceptance Criteria

- [ ] Route `/admin/logs` (nur für Role = admin zugänglich)
- [ ] Tabelle mit Spalten:
  - Timestamp (formatted: "DD.MM.YYYY HH:mm:ss")
  - Level (farbcodiert: info=blue, warn=orange, error=red)
  - Message (preview, max 100 Zeichen, mit "..." wenn truncated)
  - Source/Route (z.B. "rides", "drivers", "api/routes")
- [ ] Filter:
  - Log Level (Dropdown: "All", "Info", "Warn", "Error")
  - Date Range (Dropdown: "Last 24h", "Last 7 days", "Last 30 days", "Custom")
  - Source (Text Input mit autocomplete aus vorhandenen Sources)
- [ ] Pagination (50 Einträge pro Seite)
- [ ] Click auf Zeile → Detail View (Modal oder Side Panel)
- [ ] Initial Sort: Neueste zuerst (timestamp DESC)
- [ ] Loading State während Fetch
- [ ] Empty State wenn keine Logs vorhanden

## Technical Notes

- Use Next.js App Router: `app/(dispatcher)/admin/logs/page.tsx`
- Server Component für initial data fetch
- Client Component für Filters + Pagination (use `useRouter` + URL params)
- Fetch via Server Action: `getApplicationLogs(filters, page, limit)`
- Color coding: Use Tailwind badge component with conditional colors
- Access Control: Middleware check + Server Component auth check

## Implementation Tasks

1. Create Server Action `getApplicationLogs` in `src/lib/actions/logging.ts`
2. Create `/admin/logs/page.tsx` with table layout
3. Implement Filter component with URL param sync
4. Add pagination component
5. Implement row click → navigate to detail view or open modal
6. Add loading and empty states
7. Test with mock data (various levels, sources, timestamps)
8. Add access control checks

## Edge Cases

- Keine Logs vorhanden → "No logs found" message with icon
- Filter ergibt 0 Ergebnisse → "No matching logs" message with "Clear filters" button
- User ist kein Admin → 403 Redirect zu `/dashboard` (or show unauthorized message)
- Very long messages (>100 chars) → Truncate with "..." and show full in detail view
- Custom date range validation (start must be before end)

## Dependencies

- Issue #56 (Centralized Logging Utility)
- Issue #57 (Log Database Schema)

## Priority

**Must-Have** - Core UI for feature
EOF
)" && echo "✓ Issue 3 created" || echo "✗ Issue 3 failed"

sleep 3

# Issue 4: Log Detail View
echo "Creating Issue 4: Log Detail View..."
gh issue create \
  --title "[Logging] Log Detail View" \
  --label "enhancement,logging,P2: Nice-to-have" \
  --milestone "$MILESTONE" \
  --body "$(cat <<'EOF'
## User Story

**Als** Administrator
**will ich** Details zu einem spezifischen Log-Eintrag sehen
**damit** ich Fehler vollständig debuggen kann

## Acceptance Criteria

- [ ] Modal oder Sidebar mit vollständigem Message Text
- [ ] Stack Trace (formatted, monospace font, syntax highlighting optional)
- [ ] Metadata als JSON Viewer (syntax-highlighted, collapsible tree view)
- [ ] Felder angezeigt: Request ID, User ID, Timestamp, Source, Route
- [ ] "Copy to Clipboard" Button für Stack Trace
- [ ] "Copy to Clipboard" Button für gesamten Log-Eintrag (JSON format)
- [ ] "Close" Button zurück zur List View
- [ ] Keyboard shortcut: ESC zum Schließen

## Technical Notes

- Use Radix UI Dialog for modal (accessible, keyboard navigation)
- Syntax highlighting: Use `react-json-view` or `react-syntax-highlighter`
- Copy to clipboard: Use `navigator.clipboard.writeText()` with fallback
- Detail route: `/admin/logs/[id]` OR Modal on same page (preferable für MVP)

## Implementation Tasks

1. Create `LogDetailModal` component
2. Fetch log detail via Server Action `getLogById(id)`
3. Implement JSON viewer for metadata
4. Add copy-to-clipboard functionality
5. Style stack trace with monospace font and optional highlighting
6. Add keyboard navigation (ESC to close)
7. Test with various log types (info, warn, error with/without stack trace)

## Edge Cases

- Stack Trace ist null → Section nicht anzeigen
- Metadata ist leer/null → Section nicht anzeigen oder "No metadata" message
- User ID ist null → "System" oder "Unknown" anzeigen
- Very long stack traces → Scrollable area mit max-height
- Copy fails (old browsers) → Show "Copied!" toast or fallback to manual select

## Dependencies

- Issue #56 (Centralized Logging Utility)
- Issue #57 (Log Database Schema)

## Priority

**Nice-to-Have** - Post-MVP Enhancement
EOF
)" && echo "✓ Issue 4 created" || echo "✗ Issue 4 failed"

sleep 3

# Issue 5: Integration in Error Handlers
echo "Creating Issue 5: Integration in Error Handlers..."
gh issue create \
  --title "[Logging] Integration in Error Handlers" \
  --label "enhancement,logging,P2: Nice-to-have" \
  --milestone "$MILESTONE" \
  --body "$(cat <<'EOF'
## User Story

**Als** Entwickler
**will ich** dass bestehende try/catch Blöcke automatisch loggen
**damit** keine Fehler verloren gehen

## Acceptance Criteria

- [ ] Server Actions (`src/lib/actions/*-v2.ts`) nutzen `log.error()` in catch-Blöcken
- [ ] API Routes (`/api/*`) nutzen `log.error()` bei Exceptions
- [ ] Background Jobs (z.B. SMS scheduler, wenn vorhanden) loggen Failures
- [ ] Validation Errors werden als `log.warn()` erfasst (z.B. Zod validation failures)
- [ ] Minimum 5 kritische Code-Paths integriert:
  1. `rides-v2.ts` - createRide, updateRide, cancelRide
  2. `patients-v2.ts` - createPatient, updatePatient
  3. `drivers-v2.ts` - createDriver, updateDriver
  4. `api/routes/calculate` - Route calculation errors
  5. `rides-driver.ts` - driverStartRide, driverCompleteRide

## Technical Notes

- Wrapper pattern: Keep existing error handling, add logging on top
- Example pattern:
  \`\`\`typescript
  try {
    // existing logic
  } catch (error) {
    await log.error(error, {
      source: 'rides-v2',
      route: 'createRide',
      userId: user?.id
    });
    return { success: false, error: error.message }; // existing error return
  }
  \`\`\`
- Ensure backward compatibility (Vercel Logs bleiben erhalten)
- Don't log sensitive data (passwords, tokens) even in metadata

## Implementation Tasks

1. Refactor `rides-v2.ts` actions to include logging
2. Refactor `patients-v2.ts` actions to include logging
3. Refactor `drivers-v2.ts` actions to include logging
4. Add logging to `api/routes/calculate` route
5. Add logging to `rides-driver.ts` actions
6. Add validation error logging (Zod failures) as warnings
7. Test that existing functionality still works (no breaking changes)
8. Verify logs appear in both DB and Vercel Console

## Edge Cases

- Logging fails → Must not break application flow (silent fail, console.error fallback)
- Circular errors (logging itself fails and tries to log) → Prevent infinite loop
- Very large error objects → Truncate or summarize before logging
- User context missing (unauthenticated requests) → Log without userId

## Dependencies

- Issue #56 (Centralized Logging Utility)

## Priority

**Nice-to-Have** - Can be done incrementally
EOF
)" && echo "✓ Issue 5 created" || echo "✗ Issue 5 failed"

echo ""
echo "✓ Remaining issues creation completed!"
echo ""
echo "Summary:"
echo "- Issue 1: Centralized Logging Utility (#56) ✓"
echo "- Issue 2: Log Database Schema (#57) ✓"
echo "- Issue 3: Admin Log Page (List View) - created above"
echo "- Issue 4: Log Detail View - created above"
echo "- Issue 5: Integration in Error Handlers - created above"
echo ""
echo "View milestone: https://github.com/trismus/Fahrdienst/milestone/12"
echo "View issues: https://github.com/trismus/Fahrdienst/issues?q=is%3Aissue+milestone%3A%22Internal+Application+Logging%22"
