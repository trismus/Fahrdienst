# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fahrdienst is a web-based dispatching platform for coordinating non-emergency patient transportation. It enables dispatchers to plan, assign, and monitor rides between patients and medical facilities, while drivers view assignments, manage availability, and confirm/reject rides.

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Technology Stack

- **Frontend**: Next.js 15 with App Router and Server Components
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Hosting**: Vercel
- **Maps**: Google Maps API (Places, Directions, Distance Matrix)
- **Notifications**: Twilio SMS (Sprint 4)

## Architecture

### User Roles
- **Dispatcher (Admin)**: Creates/edits rides, manages drivers/patients/destinations, calendar views
- **Driver**: Views assigned rides, confirms/rejects, manages availability (2-hour blocks Mon-Fri 08:00-18:00)

### Frontend Structure
```
src/
├── app/
│   ├── (dispatcher)/     # Dispatcher routes (desktop-optimized)
│   │   ├── dashboard/    # Calendar view, ride overview, stats
│   │   ├── rides/        # Ride CRUD, detail view with map
│   │   ├── drivers/      # Driver CRUD, availability view (readonly)
│   │   ├── patients/     # Patient CRUD with address autocomplete
│   │   ├── destinations/ # Destination CRUD with address autocomplete
│   │   └── admin/        # Admin-only routes
│   │       └── logs/     # Application log viewer (Issue #58)
│   ├── (driver)/         # Driver routes (mobile-first)
│   │   ├── rides/        # Assigned rides, confirm/reject/start/complete
│   │   └── availability/ # Availability grid & absence management
│   └── api/
│       ├── routes/       # POST: Directions API, PUT: Distance Matrix
│       └── notifications/ # Email/SMS notifications (stub)
├── components/
│   ├── ui/               # Button, Input, Select, Card, Badge, Table, Modal
│   ├── forms/            # PatientForm, DriverForm, DestinationForm, RideForm
│   ├── maps/             # AddressAutocomplete, RouteMap
│   ├── calendar/         # CalendarView (day/week/month)
│   ├── availability/     # AvailabilityGrid, AbsenceList
│   ├── feedback/         # FeedbackButton (FAB + modal, GitHub Issues)
│   └── rides/            # RideDetailCard, RideList
├── lib/
│   ├── supabase/         # Supabase client (client.ts, server.ts, middleware.ts)
│   ├── actions/          # Server actions for CRUD operations
│   └── logging/          # Centralized logging utility (Issue #56)
└── types/                # TypeScript type definitions
```

### Core Entities
- **Patient**: name, address, coordinates, phone, special_needs, notes
- **Driver**: name, phone, email, availability_blocks, absences
- **Destination**: name, address, coordinates, arrival_window
- **Ride**: patient, driver (optional), destination, times, status, recurrence_group, estimated_duration/distance
- **AvailabilityBlock**: driver, weekday, start_time, end_time
- **Absence**: driver, date range, reason

### Ride Status Flow
`planned → confirmed → in_progress → completed` (or `cancelled`)

### Ride Substatus (Sprint 4)
For in_progress rides, granular tracking via substatus:
`waiting → en_route_pickup → at_pickup → en_route_destination → at_destination → completed`

### Ride Execution Timestamps
- `started_at` - When driver starts (leaves for pickup)
- `picked_up_at` - When patient is picked up
- `arrived_at` - When arrived at destination
- `completed_at` - When ride is fully completed

## Key Components

### Server Actions (`src/lib/actions/`)
All CRUD operations use Next.js Server Actions with automatic revalidation.

**IMPORTANT: Only use v2 modules for new code!**
- `patients-v2.ts`, `drivers-v2.ts`, `destinations-v2.ts`, `rides-v2.ts`
- Original versions (`patients.ts`, etc.) are **deprecated** and throw errors

**V2 Server Actions** include:
- **Input validation** using Zod schemas (via `src/lib/validations/schemas.ts`)
- **SQL injection prevention** via `sanitizeSearchQuery()` for ILIKE patterns
- **Rate limiting** per operation type (via `src/lib/utils/rate-limit.ts`)
- **ID format validation** via `validateId()` to prevent injection attacks

Key functions:
- `patients-v2.ts` - getPatients, getPatientById, searchPatients, createPatient, updatePatient, softDeletePatient
- `drivers-v2.ts` - getDrivers, getDriverById, searchDrivers, createDriver, updateDriver, softDeleteDriver
- `destinations-v2.ts` - getDestinations, getDestinationById, searchDestinations, createDestination, updateDestination, softDeleteDestination
- `rides-v2.ts` - getRides, getRideById, getRideStats, createRide, updateRide, cancelRide
- `feedback.ts` - submitFeedback (creates GitHub Issues, rate limited 3/hr/user)
- `rides-driver.ts` - Driver-specific actions with full execution workflow:
  - `getDriverRides`, `getDriverRide` - Fetch rides for driver
  - `driverConfirmRide`, `driverRejectRide` - Confirm/reject assignments
  - `driverStartRide`, `driverArrivedAtPickup`, `driverPickedUpPatient` - Start workflow
  - `driverArrivedAtDestination`, `driverCompleteRide`, `driverQuickCompleteRide` - Complete workflow

### Maps Integration
- `AddressAutocomplete` - Google Places API for address input with coordinates
- `RouteMap` - Displays route between patient and destination with distance/duration
- `/api/routes/calculate` - Server-side route calculation

### Calendar
- `CalendarView` - Day/Week/Month views with ride cards, navigation, today highlighting

### Availability
- `AvailabilityGrid` - 5x5 grid (Mon-Fri, 08-18 in 2h blocks), click to toggle
- `AbsenceList` - CRUD for driver absences with date validation

### Real-time Updates (Sprint 4)
- `src/hooks/use-realtime-rides.ts` - Supabase real-time subscription hook
- `src/components/dashboard/` - Real-time dashboard components:
  - `ActiveRidesCard` - Live counter of in_progress rides
  - `LiveActivityPanel` - Feed of recent ride status changes
  - `DashboardAutoRefresh` - Wrapper for auto-refreshing on changes

### SMS Notifications (Sprint 4)
- `src/lib/sms/` - Twilio SMS integration:
  - `notification-service.ts` - High-level notification API
  - `twilio-client.ts` - Twilio API client with rate limiting
  - `templates.ts` - German message templates
  - `types.ts` - Type definitions

Notifications are triggered automatically on:
- `ride_confirmed` → Patient notified
- `ride_started` → Patient notified with ETA
- `driver_arrived` → Patient notified
- `patient_picked_up` → Destination notified with ETA
- `ride_completed` → Patient notified

### Application Logging (Sprint 5-6)
- `src/lib/logging/` - Centralized logging utility:
  - `logger.ts` - Singleton logger with `log.info()`, `log.warn()`, `log.error()`
  - `types.ts` - Type definitions for log entries, filters, and metadata
  - `index.ts` - Public exports

**Usage:**
```typescript
import { log, generateRequestId } from '@/lib/logging';

// Basic logging
log.info('Patient created', { feature: 'patients', route: 'createPatient' });
log.warn('Rate limit approaching', { userId: '...', feature: 'api' });
log.error(error, { feature: 'sms', route: '/api/notifications' });

// With request correlation
const requestId = generateRequestId();
log.info('Request started', { requestId, route: '/api/rides' });
log.info('Request completed', { requestId, durationMs: 150 });

// Scoped child logger
const smsLogger = log.child({ feature: 'sms', source: 'sms' });
smsLogger.error(error, { payload: { to: '+41...' } });
```

**Log Metadata (all optional):**
- `userId` - Authenticated user ID
- `route` - HTTP route or server action name
- `requestId` - UUID for correlating multiple logs
- `feature` - Module name (rides, patients, sms, auth)
- `source` - Code location (server-action, api-route, middleware)
- `payload` - Additional structured data (auto-sanitized)
- `errorCode` - Error code if applicable
- `durationMs` - Performance timing

**Security:**
- Sensitive data (passwords, tokens, keys) is automatically masked with `[REDACTED]`
- Logs are written to database AND Vercel console
- Database writes are async and never block the application
- Only admins can view logs via `/admin/logs`

**Retention Policy:**
- Logs older than 30 days are automatically deleted
- Maximum 10,000 entries (older entries purged first)
- Cleanup runs via scheduled database function

### In-App Feedback (GitHub Issues)
- `src/components/feedback/feedback-button.tsx` - Floating action button (FAB) + modal form
- `src/components/ui/modal.tsx` - Reusable modal (backdrop click, Escape, scroll lock, `z-[60]`)
- `src/lib/actions/feedback.ts` - Server action `submitFeedback()`

**How it works:**
- FAB visible on all pages (dispatcher + driver layouts), positioned above mobile bottom-nav
- Users select type (Fehlermeldung/Funktionswunsch), enter title + description
- Submission creates a GitHub Issue via API with labels (`bug`/`enhancement` + `user-feedback`)
- Issue body includes metadata: user name, role, page URL, browser, timestamp
- Rate limited to 3 submissions per hour per user
- Graceful fallback when `GITHUB_FEEDBACK_TOKEN` is not configured

**Env vars (optional):**
- `GITHUB_FEEDBACK_TOKEN` - GitHub PAT with `repo` scope
- `GITHUB_FEEDBACK_REPO` - Repository in `owner/repo` format

## Database

### Setup

For a complete fresh setup (schema + test data + demo users), run **`supabase/init-database.sql`** in the SQL Editor. This script:
1. Drops all existing objects (clean slate)
2. Creates the full schema (tables, indexes, functions, triggers, RLS)
3. Seeds test data (5 patients, 3 drivers, 7 destinations, availability blocks)
4. Configures demo users (replace `REPLACE_ME` UUIDs with actual Auth user IDs)

For schema-only setup (no seed data), use **`supabase/consolidated-schema.sql`** instead.

Individual migration files remain in `supabase/migrations/` for reference but are no longer needed for setup.

### Important Notes
- All master data tables (patients, drivers, destinations) use **soft delete** pattern with `is_active` flag
- Database interactions use **parameterized queries** through Supabase client (prevents SQL injection)
- Search queries use `sanitizeSearchQuery()` to escape special PostgreSQL pattern characters (%, _, \)

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Google Maps:**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Client-side key (restricted to Maps JS API, Places)
- `GOOGLE_MAPS_SERVER_API_KEY` - Server-side key (restricted to Directions, Distance Matrix)

**SMS (optional):**
- `SMS_ENABLED` - Set to 'true' to enable SMS sending
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_FROM_NUMBER` - Twilio phone number (E.164 format)

**Feedback (optional):**
- `GITHUB_FEEDBACK_TOKEN` - GitHub PAT with `repo` scope for creating issues
- `GITHUB_FEEDBACK_REPO` - Target repository in `owner/repo` format

**Rate Limiting (optional, recommended for production):**
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token

**Security Note:** See `scripts/security/configure-api-keys.md` for proper API key configuration.

## Design System

Tailwind configuration uses an Uber-inspired minimal design system:
- **Primary**: Black (#000000) for primary actions
- **Accent**: Blue (#0066FF) for interactive elements
- **Neutral**: Grayscale palette for backgrounds and text
- **Status colors**: Success (green), Warning (orange), Error (red)
- **Typography**: System font stack prioritizing native UI fonts
- **Spacing**: Base 4px grid with custom utility values (18, 22, 26, 30)

See `tailwind.config.ts` for complete configuration.

## Product Documentation

**Start here**: `/docs/README.md` - Complete documentation index and navigation guide

### Essential Documents (Read in order)
1. **`docs/workflow-canvas.md`** ⭐ - 10 core workflows with acceptance criteria, edge cases, MVP scope (VERBINDLICH)
2. **`docs/sprint-backlog.md`** - Detailed user stories with technical implementation (Sprint 1-6)
3. **`docs/roadmap.md`** - Releases, milestones, decision log
4. **`docs/test-plan.md`** - Test scenarios, security tests, performance tests
5. **`docs/sprint-1-overview.md`** - Quick reference for current sprint
6. **`docs/executive-summary.md`** - Project goals, budget, timeline (for stakeholders)
7. **`docs/blueprint.md`** - Original technical specification (German)

### Product Decisions (documented in Workflow Canvas)
- **Status Flow**: 4 states (planned → confirmed → in_progress → completed/cancelled)
- **Disposition Mode**: Manual assignment with availability check (no auto-assignment in MVP)
- **Return Rides**: Stored as separate ride entries (linked via recurrence_group)
- **Notifications**: Sprint 2 (not Sprint 1) - phone coordination acceptable initially

## Security

The codebase implements defense-in-depth security practices:

1. **Input Validation**: Zod schemas validate all user inputs before database operations
2. **SQL Injection Prevention**:
   - All database queries use Supabase's parameterized queries
   - Search patterns sanitized with `sanitizeSearchQuery()` (escapes %, _, \, ')
   - ID validation via `validateId()` with UUID format checking
3. **Rate Limiting**: Per-operation rate limits (e.g., 10 creates/min, 100 reads/min)
4. **Soft Deletes**: Master data uses `is_active` flag instead of hard deletes
5. **Error Handling**: Sensitive error details not exposed to client
6. **Row Level Security (RLS)**: Database-level access control based on user roles
7. **IDOR Prevention**: Driver actions derive user identity from session, never from client parameters

### Row Level Security (RLS) Policies

All tables have RLS enabled with role-based policies:

**Profiles Table:**
- Users can read their own profile
- Only admins can read all profiles and modify them

**Patients, Drivers, Destinations:**
- Admin/Operator: Full read/write access
- Drivers: Read-only access to patients for their assigned rides
- Drivers can read their own driver record

**Rides:**
- Admin/Operator: Full read/write access
- Drivers: Can read their assigned rides, can update status of their rides

**Availability Blocks & Absences:**
- Admin/Operator: Full read/write access
- Drivers: Full access to their own records only

### Driver Action Security (IDOR Prevention)

All driver actions in `src/lib/actions/rides-driver.ts` derive the driver ID from the authenticated session:

```typescript
// SECURE: Driver ID from session
async function getAuthenticatedDriverId(): Promise<string> {
  const profile = await getUserProfile();
  if (!profile?.driverId) throw new Error('Not authorized');
  return profile.driverId;
}

// Action uses session-derived ID, not client parameter
export async function driverConfirmRide(rideId: string): Promise<ActionResult>
```

This prevents IDOR (Insecure Direct Object Reference) attacks where a malicious driver could pass another driver's ID to access their rides.

### Admin Client Usage

The `createAdminClient()` function in `src/lib/supabase/admin.ts` bypasses RLS and should ONLY be used for:
- Database migrations
- Seeding scripts
- One-time administrative scripts

**Never use in application code.** If RLS is blocking a legitimate operation, fix the RLS policies instead.

### Security Utils
- `src/lib/utils/sanitize.ts` - Input sanitization (search queries, IDs)
- `src/lib/utils/rate-limit.ts` - Rate limiting (in-memory or Redis)
- `src/lib/utils/rate-limit-redis.ts` - Distributed rate limiting with Upstash Redis
- `src/lib/utils/mask-phone.ts` - GDPR-compliant phone number masking for logs
- `src/lib/utils/validate-env.ts` - Environment variable validation
- `src/lib/utils/csrf.ts` - CSRF token generation and validation
- `src/lib/validations/schemas.ts` - Zod schemas for all entities
- `src/lib/supabase/admin.ts` - Admin client (scripts only, never in app code)

### Security Headers
Configured in `next.config.ts`:
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Disables unnecessary browser features
- **Strict-Transport-Security**: Forces HTTPS (production only)

### CSRF Protection
Implemented via:
- **SameSite cookies**: All session cookies use `sameSite: 'lax'`
- **Secure cookies**: HTTPS-only in production
- **HttpOnly cookies**: Prevents JavaScript access
- CSRF token utility available for high-security operations

### Phone Number Masking (GDPR)
All phone numbers in logs are masked:
```typescript
import { maskPhoneNumber } from '@/lib/utils/mask-phone';
// +41791234567 -> +41*******67
console.log('Phone:', maskPhoneNumber(phone));
```

### Distributed Rate Limiting
For serverless (Vercel), use Upstash Redis:
1. Install: `npm install @upstash/redis`
2. Set env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
3. See `scripts/security/setup-rate-limiting.md` for details

Falls back to in-memory rate limiting if Redis not configured.

### API Security
- Origin validation on API routes (validates `Origin` and `Referer` headers)
- Server API keys never exposed to client
- CSP violation reporting endpoint: `/api/csp-report`

### Security Scripts
- `scripts/security/remove-secrets-from-git.sh` - Remove secrets from Git history
- `scripts/security/rotate-secrets-guide.md` - Guide for rotating API keys
- `scripts/security/migrate-users-to-profiles.sql` - Migrate existing users to profiles
- `scripts/security/test-rls-policies.sql` - Verify RLS policies are working
- `scripts/security/configure-api-keys.md` - Google Maps API key configuration
- `scripts/security/setup-rate-limiting.md` - Distributed rate limiting setup

## Still TODO

- Recurring rides UI
- Ride reminder scheduler (cron job for pre-pickup reminders)
- Enable pg_cron for automatic log cleanup (currently manual or via external cron)

## Language

The project and UI are in German. Maintain language consistency.
