# Developer Guide

Eine technische Übersicht der Fahrdienst-Architektur für Entwickler.

---

## Überblick

Fahrdienst ist eine **Full-Stack Next.js Anwendung** mit folgender Architektur:

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js 15, React, TypeScript, Tailwind)     │
├─────────────────────────────────────────────────────────┤
│  Server Actions (V2 mit Zod, Sanitization, Rate Limit)  │
├─────────────────────────────────────────────────────────┤
│  Backend (Supabase: PostgreSQL + Auth + Real-time)      │
├─────────────────────────────────────────────────────────┤
│  External APIs (Google Maps, Twilio SMS)                │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version | Grund |
|-------|-----------|---------|-------|
| **Frontend** | Next.js | 15 | Modern React, Server Components, Built-in Optimizations |
| **Language** | TypeScript | 5.3+ | Type Safety, Developer Experience |
| **Styling** | Tailwind CSS | 3.4+ | Utility-First, Rapid Development |
| **Components** | React | 19 | Hooks, Suspense, Concurrent Features |
| **Database** | Supabase (PostgreSQL) | Latest | Managed, Real-time, Auth Included |
| **Auth** | Supabase Auth | JWT-based | Email/Password, Row-Level Security |
| **Real-time** | Supabase Realtime | WebSockets | Live Updates ohne Polling |
| **Maps** | Google Maps API | v3 | Places, Directions, Distance Matrix |
| **SMS** | Twilio | Latest | Reliable, Swiss Support |
| **Hosting** | Vercel | Latest | Serverless, CI/CD, Auto-Scaling |

---

## Projekt-Struktur

```
fahrdienst/
├── src/
│   ├── app/
│   │   ├── (dispatcher)/          # Dispatcher Routes (Admin Panel)
│   │   │   ├── dashboard/         # Calendar View, Stats
│   │   │   ├── rides/             # Ride CRUD
│   │   │   ├── drivers/           # Driver CRUD + Availability
│   │   │   ├── patients/          # Patient CRUD
│   │   │   ├── destinations/      # Destination CRUD
│   │   │   └── layout.tsx
│   │   ├── (driver)/              # Driver Routes (Mobile App)
│   │   │   ├── rides/             # Assigned Rides
│   │   │   ├── availability/      # Availability Grid + Absences
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── routes/            # POST: Calculate Directions
│   │   │   └── notifications/     # Notification Endpoints
│   │   ├── auth/                  # Auth Pages (Login, Logout)
│   │   ├── layout.tsx             # Root Layout
│   │   └── page.tsx               # Home/Redirect
│   ├── components/
│   │   ├── ui/                    # Reusable UI (Button, Input, Card, etc.)
│   │   ├── forms/                 # Form Components (PatientForm, RideForm, etc.)
│   │   ├── maps/                  # Map Components (AddressAutocomplete, RouteMap)
│   │   ├── calendar/              # CalendarView (Day/Week/Month)
│   │   ├── availability/          # AvailabilityGrid, AbsenceList
│   │   ├── rides/                 # RideDetailCard, RideList
│   │   ├── dashboard/             # Dashboard Components (Real-time)
│   │   └── layout/                # Layout Components (Header, Sidebar)
│   ├── lib/
│   │   ├── supabase/              # Supabase Client Setup
│   │   │   ├── client.ts          # Client-side Supabase
│   │   │   ├── server.ts          # Server-side Supabase
│   │   │   └── middleware.ts      # Auth Middleware
│   │   ├── actions/               # Server Actions (CRUD)
│   │   │   ├── patients-v2.ts     # Patient CRUD (V2: with validation)
│   │   │   ├── drivers-v2.ts      # Driver CRUD (V2)
│   │   │   ├── destinations-v2.ts # Destination CRUD (V2)
│   │   │   ├── rides-v2.ts        # Ride CRUD (V2)
│   │   │   ├── rides-driver.ts    # Driver-specific Actions
│   │   │   └── availability.ts    # Availability CRUD
│   │   ├── validations/           # Zod Schemas
│   │   │   └── schemas.ts         # All Input Validation
│   │   ├── utils/                 # Utilities
│   │   │   ├── sanitize.ts        # Input Sanitization
│   │   │   ├── rate-limit.ts      # Rate Limiting
│   │   │   └── helpers.ts         # Other Helpers
│   │   ├── sms/                   # SMS Integration (Twilio)
│   │   │   ├── notification-service.ts
│   │   │   ├── twilio-client.ts
│   │   │   ├── templates.ts
│   │   │   └── types.ts
│   │   └── hooks/
│   │       ├── use-realtime-rides.ts
│   │       └── other hooks
│   ├── types/
│   │   └── index.ts               # TypeScript Type Definitions
│   └── styles/
│       └── globals.css            # Global Styles
├── supabase/
│   ├── schema.sql                 # Database DDL
│   ├── rls-policies.sql           # Row Level Security Policies
│   └── seed-data.sql              # Example Data
├── public/
│   └── assets/                    # Images, Icons
├── tailwind.config.ts             # Tailwind Configuration
├── tsconfig.json                  # TypeScript Configuration
├── next.config.js                 # Next.js Configuration
├── package.json
└── CLAUDE.md                      # Developer Context for AI
```

---

## Key Components

### Server Actions (V2 mit Security)

**V2 Server Actions** in `/lib/actions/` verwenden:
1. **Zod Input Validation** – Alle Inputs validiert vor DB-Zugriff
2. **SQL Injection Prevention** – `sanitizeSearchQuery()` für ILIKE Patterns
3. **Rate Limiting** – Pro-Operation Limits (z.B. 10 creates/min)
4. **ID Validation** – UUID Format Checking via `validateId()`

**Beispiel: Patient erstellen**

```typescript
// src/lib/actions/patients-v2.ts

export async function createPatient(input: CreatePatientInput) {
  // 1. Validation
  const validated = createPatientSchema.parse(input);

  // 2. Rate Limiting
  await checkRateLimit('create_patient', userId);

  // 3. Database Operation
  const { data, error } = await supabase
    .from('patients')
    .insert([{
      name: validated.name,
      formatted_address: validated.address,
      latitude: validated.latitude,
      longitude: validated.longitude,
      phone: validated.phone,
      is_active: true
    }]);

  // 4. Error Handling
  if (error) throw new Error('Failed to create patient');

  // 5. Revalidation
  revalidatePath('/dispatcher/patients');

  return data[0];
}
```

### Maps Components

#### AddressAutocomplete
Nutzt Google Places API für Adressen-Eingabe mit Koordinaten.

```typescript
import { AddressAutocomplete } from '@/components/maps/address-autocomplete';

<AddressAutocomplete
  onSelect={(address) => {
    setFormData({
      ...formData,
      formatted_address: address.formatted_address,
      latitude: address.latitude,
      longitude: address.longitude
    });
  }}
/>
```

#### RouteMap
Zeigt Route zwischen Patient und Destination mit Dauer/Distanz.

```typescript
import { RouteMap } from '@/components/maps/route-map';

<RouteMap
  pickupLat={patient.latitude}
  pickupLng={patient.longitude}
  destinationLat={destination.latitude}
  destinationLng={destination.longitude}
/>
```

### Calendar Component

`CalendarView` in `/components/calendar/` zeigt Fahrten in verschiedenen Ansichten:

```typescript
import { CalendarView } from '@/components/calendar/calendar-view';

<CalendarView
  rides={rides}
  view="week"  // "day" | "week" | "month"
  onRideClick={(ride) => openDetail(ride)}
/>
```

### Availability Grid

`AvailabilityGrid` in `/components/availability/`:

```typescript
import { AvailabilityGrid } from '@/components/availability/availability-grid';

<AvailabilityGrid
  driverId={driverId}
  readOnly={true}  // false = editable
/>
```

### Real-time Hook

Live-Updates mit Supabase Subscriptions:

```typescript
import { useRealtimeRides } from '@/lib/hooks/use-realtime-rides';

const rides = useRealtimeRides(filters);
// Automatically updates when rides change
```

---

## Database Schema (Überblick)

**Haupttabellen:**

```sql
-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  formatted_address TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  phone TEXT,
  special_needs TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rides
CREATE TABLE rides (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  driver_id UUID REFERENCES drivers(id),
  destination_id UUID REFERENCES destinations(id),
  pickup_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  status TEXT ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled'),
  estimated_duration INT,
  estimated_distance FLOAT8,
  started_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  recurrence_group UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Availability Blocks
CREATE TABLE availability_blocks (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  weekday INT (0=Mon, 1=Tue, ..., 4=Fri),
  start_time TIME,
  end_time TIME
);

-- Absences
CREATE TABLE absences (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  from_date DATE,
  to_date DATE,
  reason TEXT
);
```

**Wichtige Noten:**
- Alle Master-Daten (patients, drivers) nutzen **Soft Delete Pattern** mit `is_active` Flag
- Parametrisierte Queries verhindern **SQL Injection**
- RLS Policies sorgen für **Role-Based Access Control**

Siehe `/supabase/schema.sql` für vollständiges Schema.

---

## Validierung & Security

### Input Validation (Zod)

Alle Inputs werden validiert mit Zod Schemas in `/lib/validations/schemas.ts`:

```typescript
import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(5).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().regex(/^\+41\d{9}$/), // Swiss format
  special_needs: z.string().optional(),
  notes: z.string().optional()
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
```

### SQL Injection Prevention

Search Queries werden sanitiert mit `sanitizeSearchQuery()`:

```typescript
import { sanitizeSearchQuery } from '@/lib/utils/sanitize';

const query = sanitizeSearchQuery(userInput);
const { data } = await supabase
  .from('patients')
  .select()
  .ilike('name', `%${query}%`);
```

Sanitization escapes: `%`, `_`, `\`, `'`

### Rate Limiting

Pro-Operation Rate Limits:

```typescript
import { checkRateLimit } from '@/lib/utils/rate-limit';

await checkRateLimit('create_patient', userId);
// Default: 10 creates/min per user
// Throws error if limit exceeded
```

---

## API Routes

### `/api/routes/calculate`

Berechnet Route zwischen zwei Adressen:

```typescript
// POST /api/routes/calculate
{
  "pickupLat": 47.3769,
  "pickupLng": 8.5472,
  "destinationLat": 47.3744,
  "destinationLng": 8.5533
}

// Response
{
  "distance": 2.5,        // km
  "duration": 12,         // minutes
  "polyline": "..."       // Google encoded polyline
}
```

### `/api/notifications/send`

Sendet Email/SMS Benachrichtigungen:

```typescript
// POST /api/notifications/send
{
  "driverId": "uuid",
  "type": "ride_assigned",
  "rideId": "uuid"
}
```

---

## Real-time Subscriptions

Das Dashboard nutzt **Supabase Real-time** für Live-Updates ohne Polling:

```typescript
// src/lib/hooks/use-realtime-rides.ts

export function useRealtimeRides(filters?: Filters) {
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    // Subscribe to changes
    const subscription = supabase
      .from('rides')
      .on('*', (payload) => {
        // Update local state
        setRides(prev => updateRides(prev, payload));
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return rides;
}
```

Components können direkt den Hook verwenden:

```typescript
function ActiveRidesCard() {
  const rides = useRealtimeRides({ status: 'in_progress' });
  return <div>Active rides: {rides.length}</div>;
}
```

---

## SMS Integration (Twilio)

Automatische SMS-Benachrichtigungen bei Fahrt-Events:

```typescript
// src/lib/sms/notification-service.ts

export async function notifyDriverRideAssigned(driverId: string, rideId: string) {
  const driver = await getDriver(driverId);
  const ride = await getRide(rideId);

  const message = getSMSTemplate('ride_assigned', {
    patientName: ride.patient.name,
    pickupTime: ride.pickup_time,
    destination: ride.destination.name
  });

  await sendSMS(driver.phone, message);
}
```

Automatisch getriggert auf:
- `ride_confirmed` → Patient benachrichtigt
- `ride_started` → Patient benachrichtigt mit ETA
- `driver_arrived` → Patient benachrichtigt
- `patient_picked_up` → Destination benachrichtigt
- `ride_completed` → Patient benachrichtigt

---

## Development Workflow

### 1. Neue Feature starten

```bash
# Erstelle Branch
git checkout -b feat/new-feature

# Starte dev-Server
npm run dev

# Mache Änderungen
# ...
```

### 2. Testing

```bash
# Linting
npm run lint

# Unit Tests (falls vorhanden)
npm test
```

### 3. Commit & Push

```bash
git add .
git commit -m "feat: description"
git push origin feat/new-feature
```

### 4. Pull Request

Erstelle PR auf GitHub mit:
- Detaillierte Beschreibung
- Related Issues
- Test-Anleitung

### 5. Merge & Deploy

Nach Review → Merge auf `main`
Vercel deployed automatisch zu Staging/Production

---

## Debugging

### Browser DevTools

```
Chrome → F12 → Network Tab
Filter: "api" → siehst alle Server Action Calls
```

### Supabase Logs

```
Supabase Dashboard → Logs → SQL Editor
Siehst alle Database Queries
```

### Console Logging

```typescript
console.log('Debug message', data);
// Logs erscheinen in Terminal während npm run dev
```

### Error Boundaries

Die App hat Error Boundaries für Fehler-Handling:

```typescript
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary fallback={<ErrorPage />}>
  <MyComponent />
</ErrorBoundary>
```

---

## Performance Optimization

### Server Components

Nutze Next.js Server Components für bessere Performance:

```typescript
// app/dispatcher/rides/page.tsx
export default async function RidesPage() {
  const rides = await getRides(); // Server-side fetch
  return <RidesList rides={rides} />;
}
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority={true}
/>
```

### Caching

```typescript
// Revalidate every 60 seconds
export const revalidate = 60;

// On-demand revalidation
revalidatePath('/dispatcher/rides');
```

---

## Deployment

Siehe **[07-Deployment](/wiki/07-Deployment.md)** für Production Setup.

---

## Häufige Tasks

### Neue Tabelle hinzufügen

1. SQL in `supabase/schema.sql` hinzufügen
2. Migration durchführen (Supabase Dashboard)
3. TypeScript Types in `src/types/index.ts` definieren
4. Server Actions in `src/lib/actions/` erstellen

### Neue Route hinzufügen

1. Datei erstellen in `src/app/...`
2. Page/Layout/API Route implementieren
3. Middleware prüfen (siehe `src/lib/supabase/middleware.ts`)

### Neue Component

1. Datei in `src/components/` erstellen
2. TypeScript Props definieren
3. In Page oder Parent-Component importieren

---

## Resources

- **CLAUDE.md** – Main Developer Context
- **Workflow Canvas** – `/docs/workflow-canvas.md` (Requirements)
- **Database Schema** – `/supabase/schema.sql`
- **Next.js Docs** – [nextjs.org](https://nextjs.org)
- **Supabase Docs** – [supabase.com/docs](https://supabase.com/docs)
- **TypeScript Handbook** – [typescriptlang.org](https://www.typescriptlang.org/docs)

---

**Fragen? Siehe `/docs/README.md` oder erstelle ein GitHub Issue!**
