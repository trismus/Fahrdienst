# Architecture Overview

Eine detaillierte Übersicht der Fahrdienst-Systemarchitektur, Datenmodell und Kommunikationsmuster.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
│  Browser (Next.js Frontend, React, Tailwind, TypeScript)    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS
                       │ Real-time WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Application Layer                          │
│  Next.js 15 (Server Components, Server Actions, API Routes) │
│                                                              │
│  Server Actions (Zod Validation, Rate Limiting)             │
│  API Routes (Google Maps, Notifications)                    │
│  Middleware (Auth, Route Protection)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ SDK
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 Backend Services                            │
│  Supabase (Managed PostgreSQL, Auth, Real-time)            │
│  - Database (PostgreSQL)                                    │
│  - Authentication (JWT)                                     │
│  - Row-Level Security (RLS)                                │
│  - Real-time Subscriptions (WebSocket)                      │
│  - Storage (Files, Images)                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST/WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│             External Services                               │
│  Google Maps API (Places, Directions, Distance Matrix)      │
│  Twilio SMS API                                             │
│  Vercel Hosting (CDN, Auto-Scaling)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────────┐
│    patients     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ address         │
│ latitude        │
│ longitude       │
│ phone           │
│ special_needs   │
│ notes           │
│ is_active       │
│ created_at      │
└────────┬────────┘
         │
         │ (1:N)
         │
    ┌────▼──────────────┐
    │     rides         │
    ├───────────────────┤
    │ id (PK)           │
    │ patient_id (FK)   │
    │ driver_id (FK)    │
    │ destination_id(FK)│
    │ pickup_time       │
    │ arrival_time      │
    │ status            │
    │ timestamps *      │
    │ is_active         │
    │ recurrence_group  │
    │ created_at        │
    └───┬───┬───────────┘
        │   │
        │   └──────────────┐
        │                  │
    ┌───▼────────────┐  ┌──▼──────────────┐
    │    drivers     │  │  destinations   │
    ├────────────────┤  ├─────────────────┤
    │ id (PK)        │  │ id (PK)         │
    │ name           │  │ name            │
    │ email          │  │ address         │
    │ phone          │  │ latitude        │
    │ is_active      │  │ longitude       │
    │ created_at     │  │ arrival_window  │
    └────┬───────────┘  │ is_active       │
         │              │ created_at      │
         │ (1:N)        └─────────────────┘
         │
    ┌────▼─────────────────┐
    │ availability_blocks  │
    ├──────────────────────┤
    │ id (PK)              │
    │ driver_id (FK)       │
    │ weekday (0-4)        │
    │ start_time           │
    │ end_time             │
    └──────────────────────┘

    ┌──────────────────────┐
    │    absences         │
    ├──────────────────────┤
    │ id (PK)              │
    │ driver_id (FK)       │
    │ from_date            │
    │ to_date              │
    │ reason               │
    └──────────────────────┘
```

### Ride Timestamps

```
Timeline für eine Fahrt:

planned (angelegt)
  │
  ├─ created_at: 2026-01-28 08:00:00 (Dispatcher legt Fahrt an)
  │
confirmed (Fahrer bestätigt)
  │
  ├─ (Fahrer sieht Fahrt, klickt "Bestätigen")
  │
in_progress (Fahrer unterwegs)
  │
  ├─ started_at: 2026-01-28 08:30:00 (Fahrer startet Fahrt)
  ├─ picked_up_at: 2026-01-28 08:42:00 (Patient abgeholt)
  │
completed (Fahrt beendet)
  │
  ├─ arrived_at: 2026-01-28 08:52:00 (Am Ziel angekommen)
  ├─ completed_at: 2026-01-28 08:55:00 (Fahrt abgeschlossen)
```

### Core Entities

#### Patients
```typescript
interface Patient {
  id: string;                    // UUID
  name: string;                  // Required
  formatted_address: string;     // Full address
  latitude: number;              // Coordinates from Google
  longitude: number;
  phone: string;                 // Optional
  special_needs: string;         // Optional: Rollstuhl, Sauerstoff, etc.
  notes: string;                 // Optional
  is_active: boolean;            // Soft delete
  created_at: string;            // ISO timestamp
}
```

#### Drivers
```typescript
interface Driver {
  id: string;                    // UUID
  name: string;                  // Required
  email: string;                 // Unique, for Login
  phone: string;                 // Required
  is_active: boolean;            // Soft delete
  created_at: string;
  // Relations:
  availability_blocks: AvailabilityBlock[];
  absences: Absence[];
}
```

#### Rides
```typescript
interface Ride {
  id: string;                    // UUID
  patient_id: string;            // FK to patients
  driver_id: string | null;      // FK to drivers (optional)
  destination_id: string;        // FK to destinations

  // Times
  pickup_time: string;           // ISO timestamp
  arrival_time: string;          // ISO timestamp

  // Status
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

  // Execution Timestamps
  started_at: string | null;     // When driver leaves for pickup
  picked_up_at: string | null;   // When patient picked up
  arrived_at: string | null;     // When arrived at destination
  completed_at: string | null;   // When fully completed

  // Details
  estimated_duration: number;    // Minutes
  estimated_distance: number;    // Kilometers
  notes: string;                 // Optional

  // Recurrence
  recurrence_group: string | null; // UUID linking recurring rides

  // Meta
  is_active: boolean;            // Soft delete
  created_at: string;
}
```

#### Availability Blocks
```typescript
interface AvailabilityBlock {
  id: string;
  driver_id: string;             // FK
  weekday: number;               // 0=Mon, 1=Tue, ..., 4=Fri
  start_time: string;            // HH:MM (e.g., "08:00")
  end_time: string;              // HH:MM (e.g., "10:00")
}
```

#### Absences
```typescript
interface Absence {
  id: string;
  driver_id: string;             // FK
  from_date: string;             // YYYY-MM-DD
  to_date: string;               // YYYY-MM-DD
  reason: string;                // "Urlaub", "Krankheit", etc.
}
```

---

## Status Flow & State Machine

```
        ┌─────────────────────────────────────┐
        │           CREATED                   │
        │   (Dispatcher legt Fahrt an)        │
        │   Status: planned                   │
        └────────────┬────────────────────────┘
                     │
         Dispatcher zuweist Fahrer
                     │
        ┌────────────▼──────────────────┐
        │      PENDING CONFIRMATION     │
        │   Status: planned             │
        │   Driver zugewiesen, aber     │
        │   wartet auf Bestätigung      │
        └────────────┬──────────────────┘
                     │
      ┌──────────────┴──────────────┐
      │                             │
    Fahrer                    Fahrer
    bestätigt                 lehnt
      │                       ab
      │                       │
      ▼                       ▼
  Status: confirmed    Status: planned
  (driver_id reset)
  (Fahrer muss neu
   zugewiesen
   werden)
      │
      └─────(Dispatcher zuweist
             anderen Fahrer)
            ↓
  Zurück zu: PENDING CONFIRMATION
      │
      │ Am Tag der Fahrt:
      │ Fahrer klickt "Fahrt starten"
      │
      ▼
┌─────────────────────────────────────┐
│        IN PROGRESS                  │
│   Status: in_progress               │
│   started_at = NOW()                │
│                                     │
│   Mögliche Substatus (später):      │
│   - waiting (am Abhol-Punkt)        │
│   - en_route_pickup                 │
│   - at_pickup                       │
│   - en_route_destination            │
│   - at_destination                  │
└─────────────────────┬───────────────┘
                      │
        Fahrer klickt Fortschritt-Buttons:
        - "Patient abgeholt"
        - "Angekommen"
        - "Fahrt abgeschlossen"
                      │
                      ▼
             ┌────────────────────┐
             │     COMPLETED      │
             │ Status: completed  │
             │ completed_at=NOW() │
             └────────────────────┘

Zusätzlich:
┌─────────────────────────────────────┐
│        CANCELLED                    │
│   Status: cancelled                 │
│   (kann jederzeit → completed)      │
│   cancelled_at = NOW()              │
│   cancelled_reason = notes          │
└─────────────────────────────────────┘
```

---

## API Communication

### Server Actions Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Client: Button click                                   │
│  onClick={() => createPatient(formData)}               │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Server Action (src/lib/actions/patients-v2.ts)         │
│  1. Validate Input (Zod)                               │
│  2. Check Rate Limit                                   │
│  3. Execute Query (Supabase)                           │
│  4. Revalidate Cache                                   │
│  5. Return Result                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Client: UI updated automatically                       │
│  (thanks to revalidatePath)                            │
└─────────────────────────────────────────────────────────┘
```

### Real-time Subscription Pattern

```
┌──────────────────────────────────────────────┐
│  Component: useRealtimeRides(filters)        │
└────────────┬─────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────┐
│  Subscribe to 'rides' table changes          │
│  Supabase WebSocket: realtime.subscribe()    │
└────────────┬─────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────┐
│  Database Change Detected (INSERT/UPDATE)    │
│  Webhook fired:                              │
│  - Ride status changed                       │
│  - Driver assigned                           │
│  - Timestamps updated                        │
└────────────┬─────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────┐
│  Client State Updated (setRides)             │
│  Component Re-renders with new data          │
│  Dashboard shows: "Active rides: 5"          │
│  No page reload needed                       │
└──────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### JWT Flow

```
1. Login
   Client: POST /auth/login
   Server: Supabase Auth verifies email/password
   Response: JWT token + refresh token

2. API Calls
   Client: Include JWT in Authorization header
   Server: Next.js middleware validates token
   If valid: Execute action
   If invalid: Return 401 Unauthorized

3. RLS (Row-Level Security)
   Database receives: JWT claims (user_id, role)
   RLS Policy checks:
   - Can this user view/edit this row?
   - Based on: user_id, role, data ownership
```

### RLS Policies

```sql
-- Dispatcher can see all rides
CREATE POLICY dispatcher_see_all_rides
  ON rides FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'dispatcher'
  );

-- Driver can only see own rides
CREATE POLICY driver_see_own_rides
  ON rides FOR SELECT
  USING (
    driver_id = auth.uid()
  );

-- Driver can update own rides (status only, not driver_id)
CREATE POLICY driver_update_own_rides
  ON rides FOR UPDATE
  USING (
    driver_id = auth.uid()
  )
  WITH CHECK (
    driver_id = auth.uid()
    AND driver_id IS NOT DISTINCT FROM auth.uid()
  );
```

---

## Notification Flow

### SMS Notification (Twilio)

```
Fahrt-Event occurs:
├─ ride_assigned (Dispatcher zuweist Fahrer)
├─ ride_confirmed (Fahrer bestätigt)
├─ ride_started (Fahrer startet)
├─ ride_completed (Fahrt fertig)
└─ ride_cancelled (Fahrt storniert)
    │
    ▼
Event Handler triggered:
├─ Determine recipient (Driver, Patient, Destination)
├─ Select SMS template (German)
├─ Build message with details
└─ Send via Twilio API
    │
    ▼
SMS sent to phone number:
    │
    ▼
User receives notification:
"Neue Fahrt: Max M. von Bahnhof zu Spital. Abholen 08:30."
```

### Email Notification (Supabase Auth)

```
Supabase Email Integration:
├─ Configure SMTP in Supabase
├─ Send via Supabase.auth.resetPasswordForEmail()
├─ Or: Custom email via third-party service
└─ Later: Full notification service
```

---

## Route Calculation Flow

```
Dispatcher creates Ride:
├─ Patient address (from DB)
├─ Destination address (from DB)
└─ Triggers: calculateRoute(patient, destination)
    │
    ▼
Google Directions API:
├─ Request: Origin (patient), Destination
├─ Response: Distance, Duration, Polyline
└─ Store in rides table:
    ├─ estimated_duration (minutes)
    ├─ estimated_distance (km)
    └─ arrival_time (calculated)
    │
    ▼
UI displays:
├─ "Fahrt von 2.5 km, ca. 12 Minuten"
├─ Route map with polyline
└─ Arrival time: pickup + duration + buffer
```

---

## Scalability Considerations

### Current Bottlenecks

1. **Real-time Subscriptions**
   - Each connected client = one WebSocket
   - Supabase Free Tier: ~100 concurrent connections
   - Solution: Upgrade to paid tier (unlimited)

2. **Google Maps API**
   - Rate limit: ~1000 requests/day (free tier)
   - Solution: Upgrade to paid tier, add caching

3. **Database Connections**
   - Supabase pools connections
   - Large number of Server Actions = many connections
   - Solution: Connection pooling, query optimization

### Optimization Strategies

1. **Caching**
   ```typescript
   // Cache patient data for 60 seconds
   export const revalidate = 60;
   ```

2. **Pagination**
   ```typescript
   // Load rides 20 at a time
   const { data, count } = await supabase
     .from('rides')
     .select('*', { count: 'exact' })
     .range(0, 19);
   ```

3. **Indexing**
   ```sql
   CREATE INDEX rides_driver_id ON rides(driver_id);
   CREATE INDEX rides_status ON rides(status);
   CREATE INDEX rides_pickup_time ON rides(pickup_time);
   ```

---

## Security Considerations

### Defense in Depth

1. **Input Validation** (Zod)
   - Type-check all inputs before DB

2. **Rate Limiting**
   - 10 creates/min per user
   - 100 reads/min per user
   - Prevent abuse

3. **SQL Injection Prevention**
   - Parameterized queries (Supabase client)
   - Sanitization for ILIKE patterns

4. **Row-Level Security**
   - Database enforces row-level access
   - Users can't bypass RLS (even with direct API calls)

5. **HTTPS / TLS**
   - All traffic encrypted (Vercel + Supabase)

6. **CSRF Protection**
   - Next.js built-in CSRF tokens

7. **Environment Variables**
   - Sensitive keys never in client code
   - `NEXT_PUBLIC_*` only for public data

---

## Monitoring & Observability

### Logs

- **Application Logs**: `npm run dev` console
- **Database Logs**: Supabase Dashboard → Logs
- **Error Tracking**: Error boundary components

### Metrics to Monitor

1. **Performance**
   - Page load time
   - Server Action response time
   - Real-time subscription latency

2. **Availability**
   - Uptime %
   - Failed API calls
   - Database connection errors

3. **Business Metrics**
   - Rides per day
   - Driver utilization
   - Patient satisfaction

---

## Future Enhancements

1. **Granular Ride Status**
   - Add substatus: en_route_pickup, at_pickup, en_route_destination, at_destination

2. **Recurring Rides**
   - RRULE support for dialysis, chemotherapy, etc.

3. **Driver Route Optimization**
   - Suggest best order to visit patients

4. **Push Notifications**
   - App notifications (not just SMS)

5. **Offline Support**
   - ServiceWorker for offline functionality

6. **Location Tracking**
   - Real-time driver location on Dispatcher map

---

## Resources

- **Database Schema**: `/supabase/schema.sql`
- **RLS Policies**: `/supabase/rls-policies.sql`
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org](https://nextjs.org)
- **Workflow Canvas**: `/docs/workflow-canvas.md`

---

**Questions? Check `/docs/README.md` or create a GitHub Issue!**
