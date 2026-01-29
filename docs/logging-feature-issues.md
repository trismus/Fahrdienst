# Application Logging Feature - GitHub Issues

**Milestone:** Internal Application Logging (#12)
**Due Date:** 2026-03-15
**Milestone URL:** https://github.com/trismus/Fahrdienst/milestone/12

---

## Issue 1: [Logging] Centralized Logging Utility

**Labels:** `enhancement`, `logging`, `P1: Important`
**Milestone:** Internal Application Logging (#12)
**Priority:** Must-Have

### User Story

**Als** Entwickler
**will ich** eine zentrale Logging-Funktion nutzen
**damit** alle Fehler und Warnings konsistent erfasst werden

### Acceptance Criteria

- [ ] Logging Utility unter `src/lib/logging/` mit `log.info()`, `log.warn()`, `log.error()`
- [ ] Logs werden gleichzeitig in Vercel Console UND Datenbank geschrieben
- [ ] Fehler beim Logging selbst blockieren nicht die Anwendung
- [ ] Sensitive Daten (Passwörter, Tokens) werden automatisch maskiert
- [ ] Meta-Parameter optional: `userId`, `route`, `requestId`, `feature`

### Technical Notes

- Implementiere als Singleton-Service
- Nutze bestehende Supabase-Connection für DB writes
- Fallback auf `console.error` wenn DB write fehlschlägt
- API Interface:
  ```typescript
  log.info(message: string, meta?: LogMeta): Promise<void>
  log.warn(message: string, meta?: LogMeta): Promise<void>
  log.error(error: Error | string, meta?: LogMeta): Promise<void>
  ```

### Implementation Tasks

1. Create `src/lib/logging/logger.ts` with core logging class
2. Create `src/lib/logging/types.ts` for TypeScript definitions
3. Implement sensitive data masking utility
4. Add Supabase client integration for log persistence
5. Add fallback to console logging on DB write failure
6. Write unit tests for logging utility

### Dependencies

- Story 2 (Log Database Schema) must be completed first

---

## Issue 2: [Logging] Log Database Schema

**Labels:** `enhancement`, `logging`, `P1: Important`
**Milestone:** Internal Application Logging (#12)
**Priority:** Must-Have

### User Story

**Als** System
**muss ich** Logs persistent speichern
**damit** sie später abgerufen werden können

### Acceptance Criteria

- [ ] Neue Tabelle `application_logs` mit Feldern:
  - `id` (UUID, primary key)
  - `timestamp` (timestamptz, default now())
  - `level` (text, check constraint: 'info' | 'warn' | 'error')
  - `message` (text)
  - `stack_trace` (text, nullable)
  - `source` (text, nullable)
  - `route` (text, nullable)
  - `user_id` (UUID, nullable, foreign key to auth.users)
  - `request_id` (text, nullable)
  - `metadata` (JSONB, nullable)
- [ ] Index auf `timestamp` für schnelle Queries
- [ ] Index auf `level` für Filterung
- [ ] Composite Index auf `(timestamp DESC, level)` für optimierte Log Page Queries
- [ ] Retention Policy: 30 Tage ODER max 10.000 Einträge (welches zuerst erreicht wird)
- [ ] Auto-Cleanup via Database Function (täglich laufen via pg_cron)
- [ ] RLS Policy: Nur Admins können logs lesen (`SELECT` nur für `role = 'admin'`)

### Technical Notes

- Migration-Script in `supabase/migrations/`
- Naming: `YYYYMMDDHHMMSS_create_application_logs.sql`
- Include rollback SQL in migration comments
- Test retention policy with manual trigger before scheduling

### Implementation Tasks

1. Create migration file with table definition
2. Add indexes for performance
3. Create retention cleanup function in PL/pgSQL
4. Schedule cleanup function via pg_cron (or manual trigger for MVP)
5. Add RLS policies for admin-only access
6. Test migration on local Supabase instance
7. Document schema in CLAUDE.md

### Edge Cases

- What happens when 10k limit is reached mid-day? → Oldest entries deleted first
- Cleanup function should run in transaction to avoid partial deletes
- Handle timezone correctly (use UTC for all timestamps)

---

## Issue 3: [Logging] Admin Log Page (List View)

**Labels:** `enhancement`, `logging`, `P1: Important`
**Milestone:** Internal Application Logging (#12)
**Priority:** Must-Have

### User Story

**Als** Administrator
**will ich** eine Übersicht aller Application Logs sehen
**damit** ich Fehler schnell identifizieren kann

### Acceptance Criteria

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

### Technical Notes

- Use Next.js App Router: `app/(dispatcher)/admin/logs/page.tsx`
- Server Component für initial data fetch
- Client Component für Filters + Pagination (use `useRouter` + URL params)
- Fetch via Server Action: `getApplicationLogs(filters, page, limit)`
- Color coding: Use Tailwind badge component with conditional colors
- Access Control: Middleware check + Server Component auth check

### Implementation Tasks

1. Create Server Action `getApplicationLogs` in `src/lib/actions/logging.ts`
2. Create `/admin/logs/page.tsx` with table layout
3. Implement Filter component with URL param sync
4. Add pagination component
5. Implement row click → navigate to detail view or open modal
6. Add loading and empty states
7. Test with mock data (various levels, sources, timestamps)
8. Add access control checks

### Edge Cases

- Keine Logs vorhanden → "No logs found" message with icon
- Filter ergibt 0 Ergebnisse → "No matching logs" message with "Clear filters" button
- User ist kein Admin → 403 Redirect zu `/dashboard` (or show unauthorized message)
- Very long messages (>100 chars) → Truncate with "..." and show full in detail view
- Custom date range validation (start must be before end)

---

## Issue 4: [Logging] Log Detail View

**Labels:** `enhancement`, `logging`, `P2: Nice-to-have`
**Milestone:** Internal Application Logging (#12)
**Priority:** Nice-to-Have (Post-MVP Enhancement)

### User Story

**Als** Administrator
**will ich** Details zu einem spezifischen Log-Eintrag sehen
**damit** ich Fehler vollständig debuggen kann

### Acceptance Criteria

- [ ] Modal oder Sidebar mit vollständigem Message Text
- [ ] Stack Trace (formatted, monospace font, syntax highlighting optional)
- [ ] Metadata als JSON Viewer (syntax-highlighted, collapsible tree view)
- [ ] Felder angezeigt: Request ID, User ID, Timestamp, Source, Route
- [ ] "Copy to Clipboard" Button für Stack Trace
- [ ] "Copy to Clipboard" Button für gesamten Log-Eintrag (JSON format)
- [ ] "Close" Button zurück zur List View
- [ ] Keyboard shortcut: ESC zum Schließen

### Technical Notes

- Use Radix UI Dialog for modal (accessible, keyboard navigation)
- Syntax highlighting: Use `react-json-view` or `react-syntax-highlighter`
- Copy to clipboard: Use `navigator.clipboard.writeText()` with fallback
- Detail route: `/admin/logs/[id]` OR Modal on same page (preferable für MVP)

### Implementation Tasks

1. Create `LogDetailModal` component
2. Fetch log detail via Server Action `getLogById(id)`
3. Implement JSON viewer for metadata
4. Add copy-to-clipboard functionality
5. Style stack trace with monospace font and optional highlighting
6. Add keyboard navigation (ESC to close)
7. Test with various log types (info, warn, error with/without stack trace)

### Edge Cases

- Stack Trace ist null → Section nicht anzeigen
- Metadata ist leer/null → Section nicht anzeigen oder "No metadata" message
- User ID ist null → "System" oder "Unknown" anzeigen
- Very long stack traces → Scrollable area mit max-height
- Copy fails (old browsers) → Show "Copied!" toast or fallback to manual select

---

## Issue 5: [Logging] Integration in Error Handlers

**Labels:** `enhancement`, `logging`, `P2: Nice-to-have`
**Milestone:** Internal Application Logging (#12)
**Priority:** Nice-to-Have (Can be done incrementally)

### User Story

**Als** Entwickler
**will ich** dass bestehende try/catch Blöcke automatisch loggen
**damit** keine Fehler verloren gehen

### Acceptance Criteria

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

### Technical Notes

- Wrapper pattern: Keep existing error handling, add logging on top
- Example pattern:
  ```typescript
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
  ```
- Ensure backward compatibility (Vercel Logs bleiben erhalten)
- Don't log sensitive data (passwords, tokens) even in metadata

### Implementation Tasks

1. Refactor `rides-v2.ts` actions to include logging
2. Refactor `patients-v2.ts` actions to include logging
3. Refactor `drivers-v2.ts` actions to include logging
4. Add logging to `api/routes/calculate` route
5. Add logging to `rides-driver.ts` actions
6. Add validation error logging (Zod failures) as warnings
7. Test that existing functionality still works (no breaking changes)
8. Verify logs appear in both DB and Vercel Console

### Edge Cases

- Logging fails → Must not break application flow (silent fail, console.error fallback)
- Circular errors (logging itself fails and tries to log) → Prevent infinite loop
- Very large error objects → Truncate or summarize before logging
- User context missing (unauthenticated requests) → Log without userId

---

## Additional Tasks (Not separate issues, but part of completion)

### Documentation Updates

- [ ] Update `CLAUDE.md` with logging utility usage
- [ ] Add logging section to `/docs/sprint-backlog.md`
- [ ] Document log retention policy in README or admin docs

### Testing

- [ ] Unit tests for logging utility (masking, fallback behavior)
- [ ] Integration test: Write log → Verify in DB
- [ ] E2E test: Admin logs page loads and displays logs
- [ ] Security test: Non-admin cannot access `/admin/logs`
- [ ] Performance test: Log page loads < 2s with 1000 entries

### Deployment Checklist

- [ ] Run migration on production Supabase
- [ ] Verify RLS policies active in production
- [ ] Test retention policy triggers correctly
- [ ] Monitor Vercel logs to ensure dual logging works
- [ ] Set up alert for log DB table size (if > 50MB)

---

## Summary

**Total Issues:** 5 (3 Must-Have, 2 Nice-to-Have)
**Estimated Timeline:** Sprint 5-6 (4-6 weeks)
**Must-Have Completion Target:** End of Sprint 5
**Full Feature Completion Target:** End of Sprint 6

### Dependencies Graph

```
Issue 2 (DB Schema)
    ↓
Issue 1 (Logging Utility)
    ↓
Issue 3 (Log Page - List View)
    ↓
Issue 4 (Log Detail View) [Nice-to-Have]
    ↓
Issue 5 (Integration) [Can run in parallel with 3/4]
```

### Quick Win Path (MVP Minimum)

If time is constrained, implement in this order:
1. Issue 2 (DB Schema) - 1 day
2. Issue 1 (Logging Utility) - 2 days
3. Issue 3 (Basic Log Page without advanced filters) - 2 days
4. Issue 5 (Partial integration - only critical paths) - 1 day

**Total MVP:** ~6 days for basic functional logging system

---

## Label Recommendations

Create these labels if they don't exist:
- `logging` (green #0E8A16) - Application logging and monitoring
- `admin` (red #D93F0B) - Admin/internal features

Use existing labels:
- `enhancement` - For all feature work
- `P1: Important` - Must-have stories
- `P2: Nice-to-have` - Post-MVP enhancements

---

## How to Create Issues

Due to GitHub API connection issues during automated creation, please create these issues manually:

1. Go to https://github.com/trismus/Fahrdienst/issues/new
2. Copy content from each issue section above
3. Set milestone to "Internal Application Logging"
4. Add appropriate labels
5. Repeat for all 5 issues

Alternatively, retry automated creation with:
```bash
gh issue create --title "[Title]" --label "labels" --milestone 12 --body "content"
```
