Neu
+129
-0

# Fahrdienst App – Blueprint (Erstentwurf)

## Zielbild
Eine webbasierte Dispatching-Plattform („Fahrdienst App“) für die Koordination von nicht-notfallmäßigen Patiententransporten. Kernziel ist die einfache Planung, Zuweisung und Überwachung von Fahrten zwischen Patient:innen und medizinischen Einrichtungen, inkl. Routenberechnung und transparenter Verfügbarkeit der Fahrer:innen.

## Nutzerrollen
- **Dispatcher (Admin)**
  - Erstellt, bearbeitet und weist Fahrten zu
  - Verwalten von Fahrer:innen, Patient:innen und Zielen
  - Kalenderübersicht und Filtersichten
- **Driver (Fahrer:in)**
  - Sieht zugewiesene Fahrten
  - Nimmt Fahrten an oder lehnt ab
  - Pflegt wöchentliche Verfügbarkeiten und Abwesenheiten

## Kernfunktionen (MVP)
### Dispatching & Planung
- Dashboard mit Kalenderansicht (Tag/Woche/Monat)
- Fahrten anlegen/editieren:
  - Patient, Fahrer (optional), Ziel
  - Abholzeit, Ankunftszeit, Rückfahrtzeit
  - Status: planned, confirmed, in_progress, completed, cancelled
- Wiederkehrende Fahrten (z. B. 2×/Woche für 6 Wochen)
- Filter nach Fahrer:in, Datum, Status

### Fahrer:innen-Verfügbarkeit
- Verfügbarkeitsblöcke in 2-Stunden-Intervallen (Mo–Fr, 08:00–18:00)
- Abwesenheiten als Datumsbereiche mit optionalem Grund

### Benachrichtigungen
- Zuweisung per E-Mail oder SMS
- Direktaktion: „Bestätigen“ / „Ablehnen“

## Google Maps Integration
- **Places API** für Adress-Autocomplete (Patienten & Ziele)
- Speicherung von `formatted_address`, `latitude`, `longitude`
- **Directions API** für Route, Dauer & Distanz
- Anzeige der Route in der Fahrtdetailansicht (Google Maps JS API)
- Optional: **Distance Matrix API** für Batch-Planung oder spätere Abrechnung

## Datenmodell (Entitäten)
### Patient
- name
- address
- latitude
- longitude
- phone
- special_needs
- notes

### Driver
- name
- phone
- email
- availability_blocks
- absences

### Destination
- name
- address
- latitude
- longitude
- arrival_window_start
- arrival_window_end

### Ride
- patient
- driver (optional)
- destination
- pickup_time
- arrival_time
- return_time
- status
- recurrence_group
- estimated_duration
- estimated_distance

### AvailabilityBlock
- driver
- weekday
- start_time
- end_time

### Absence
- driver
- from_date
- to_date
- reason

## UI/UX Leitlinien
- **Dispatcher UI**: Desktop-optimiertes Dashboard mit Kalender + Kartenansicht
- **Driver UI**: Mobile-first UI mit Fahrtenliste & Verfügbarkeitsverwaltung

## Technologiestack
- **Frontend**: Next.js 15, App Router, Server Components
- **Styling**: Tailwind CSS (Utility-First)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Hosting**: Vercel

## Grobe Modulstruktur (Frontend)
- `/app/(dispatcher)`
  - Dashboard, Kalender, Ride-Detail, Fahrer- & Patientenverwaltung
- `/app/(driver)`
  - Fahrtenliste, Ride-Detail, Verfügbarkeit
- `/app/api`
  - Routenberechnung, Notifications, Admin-Aktionen

## MVP-Flow (Dispatcher)
1. Patient anlegen
2. Ziel anlegen
3. Fahrt erstellen (Zeiten, Route berechnen)
4. Fahrer:in zuweisen
5. Benachrichtigung versenden

## MVP-Flow (Driver)
1. Neue Zuweisung erhalten
2. Fahrt bestätigen/ablehnen
3. Fahrt am Tag der Durchführung starten
4. Fahrt abschließen

## Offene Punkte / Entscheidungen
- SMS Provider (z. B. Twilio, MessageBird)
- Auth- & Rollenmodell (Supabase RLS)
- Kalender-Komponente (z. B. FullCalendar)
- Datenmodell für Wiederholungen (RRULE oder eigene Serie)