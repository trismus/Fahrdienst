# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fahrdienst is a web-based dispatching platform for coordinating non-emergency patient transportation. It enables dispatchers to plan, assign, and monitor rides between patients and medical facilities, while drivers view assignments, manage availability, and confirm/reject rides.

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run lint      # Run ESLint
```

## Technology Stack

- **Frontend**: Next.js 15 with App Router and Server Components
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Hosting**: Vercel
- **Maps**: Google Maps API (Places, Directions, Distance Matrix)
- **Notifications**: TBD (Twilio or MessageBird for SMS/Email)

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

## Key Components

### Server Actions (`src/lib/actions/`)
All CRUD operations use Next.js Server Actions with automatic revalidation:
- `patients.ts` - getPatients, getPatient, createPatient, updatePatient, deletePatient
- `drivers.ts` - getDrivers, getDriverWithAvailability, setAvailabilityBlock, createAbsence
- `destinations.ts` - getDestinations, createDestination, updateDestination
- `rides.ts` - getRides, createRide, confirmRide, rejectRide, startRide, completeRide

### Maps Integration
- `AddressAutocomplete` - Google Places API for address input with coordinates
- `RouteMap` - Displays route between patient and destination with distance/duration
- `/api/routes/calculate` - Server-side route calculation

### Calendar
- `CalendarView` - Day/Week/Month views with ride cards, navigation, today highlighting

### Availability
- `AvailabilityGrid` - 5x5 grid (Mon-Fri, 08-18 in 2h blocks), click to toggle
- `AbsenceList` - CRUD for driver absences with date validation

## Database

Schema is in `supabase/schema.sql`. Run in Supabase SQL Editor to set up tables.

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Client-side Google Maps key
- `GOOGLE_MAPS_SERVER_API_KEY` - Server-side Google Maps key (optional)

## Key Documentation

- `docs/blueprint.md` - Complete project specification (German)

## Still TODO

- Authentication flow (login/logout pages)
- SMS/Email notifications implementation
- Recurring rides UI
- RLS policies for role-based access

## Language

The project and UI are in German. Maintain language consistency.
