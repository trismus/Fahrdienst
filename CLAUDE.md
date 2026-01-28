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
│   │   └── destinations/ # Destination CRUD with address autocomplete
│   ├── (driver)/         # Driver routes (mobile-first)
│   │   ├── rides/        # Assigned rides, confirm/reject/start/complete
│   │   └── availability/ # Availability grid & absence management
│   └── api/
│       ├── routes/       # POST: Directions API, PUT: Distance Matrix
│       └── notifications/ # Email/SMS notifications (stub)
├── components/
│   ├── ui/               # Button, Input, Select, Card, Badge, Table
│   ├── forms/            # PatientForm, DriverForm, DestinationForm, RideForm
│   ├── maps/             # AddressAutocomplete, RouteMap
│   ├── calendar/         # CalendarView (day/week/month)
│   ├── availability/     # AvailabilityGrid, AbsenceList
│   └── rides/            # RideDetailCard, RideList
├── lib/
│   ├── supabase/         # Supabase client (client.ts, server.ts, middleware.ts)
│   └── actions/          # Server actions for CRUD operations
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
All CRUD operations use Next.js Server Actions with automatic revalidation. The codebase has two versions:
- Original versions: `patients.ts`, `drivers.ts`, `destinations.ts`, `rides.ts`
- V2 versions with security hardening: `patients-v2.ts`, `drivers-v2.ts`, `destinations-v2.ts`

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

## Database

Schema is in `supabase/schema.sql`. Run in Supabase SQL Editor to set up tables.

### Important Notes
- All master data tables (patients, drivers, destinations) use **soft delete** pattern with `is_active` flag
- Database interactions use **parameterized queries** through Supabase client (prevents SQL injection)
- Search queries use `sanitizeSearchQuery()` to escape special PostgreSQL pattern characters (%, _, \)

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Client-side Google Maps key
- `GOOGLE_MAPS_SERVER_API_KEY` - Server-side Google Maps key (optional)
- `SMS_ENABLED` - Set to 'true' to enable SMS sending
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_FROM_NUMBER` - Twilio phone number (E.164 format)

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

### Security Utils
- `src/lib/utils/sanitize.ts` - Input sanitization (search queries, IDs)
- `src/lib/utils/rate-limit.ts` - Rate limiting implementation
- `src/lib/validations/schemas.ts` - Zod schemas for all entities

## Still TODO

- Recurring rides UI
- RLS policies for role-based access
- Notification logs database table (currently logs to console)
- Ride reminder scheduler (cron job for pre-pickup reminders)

## Language

The project and UI are in German. Maintain language consistency.
