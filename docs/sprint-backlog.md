# Sprint Backlog – Fahrdienst App

**Product Owner**: Greg
**Version**: 1.0
**Letzte Aktualisierung**: 2026-01-28

---

## Sprint 1: Foundation & Dispatcher Core (Woche 1-2)

**Sprint Goal**: "Dispatcher kann sich anmelden, Stammdaten verwalten und eine Fahrt anlegen"

**Dauer**: 2 Wochen
**Start**: 2026-02-01
**Ende**: 2026-02-14

---

### Epic 1: Authentication & Security

#### Story 1.1: Login-Seite
**Als** Dispatcher
**möchte ich** mich mit Email und Passwort anmelden
**damit** ich Zugriff auf die Dispatching-Features habe

**Acceptance Criteria**:
- [ ] Login-Seite unter `/login` erreichbar
- [ ] Formular mit Email (type=email, required) und Passwort (type=password, required)
- [ ] Button "Anmelden" validiert Eingabe client-side (Email-Format)
- [ ] Bei erfolgreichem Login: Redirect zu `/dashboard`
- [ ] Bei fehlerhaften Credentials: Fehler "Ungültige Anmeldedaten" anzeigen
- [ ] Supabase Auth Session wird gespeichert (Cookie)
- [ ] Responsive Design (funktioniert auf Desktop und Mobile)

**Technische Umsetzung**:
- `/app/login/page.tsx` mit LoginForm Component
- Server Action: `signIn(email, password)` in `/lib/actions/auth.ts`
- Supabase Auth: `supabase.auth.signInWithPassword()`
- Redirect via `redirect('/dashboard')`

**Edge Cases**:
- Email nicht registriert → Fehler "Kein Benutzer gefunden"
- Passwort falsch → Fehler "Ungültiges Passwort"
- Netzwerkfehler → Fehler "Verbindung fehlgeschlagen, bitte erneut versuchen"

**Definition of Done**:
- [ ] Code implementiert und getestet
- [ ] UI entspricht Design (Uber-Stil, minimalistisch)
- [ ] Funktioniert in Chrome, Safari, Firefox
- [ ] Error Handling implementiert

---

#### Story 1.2: Logout-Funktion
**Als** angemeldeter Benutzer
**möchte ich** mich abmelden können
**damit** niemand anderes auf meinen Account zugreifen kann

**Acceptance Criteria**:
- [ ] Logout-Button im Header/Navigation sichtbar (nur wenn eingeloggt)
- [ ] Click auf Logout → Server Action `signOut()`
- [ ] Session wird gelöscht
- [ ] Redirect zu `/login`
- [ ] Nach Logout: Zugriff auf protected routes nicht mehr möglich

**Technische Umsetzung**:
- Server Action: `signOut()` in `/lib/actions/auth.ts`
- Supabase: `supabase.auth.signOut()`
- Middleware: Protected routes prüfen Session

**Definition of Done**:
- [ ] Logout funktioniert
- [ ] Session wird korrekt gelöscht
- [ ] Redirect funktioniert

---

#### Story 1.3: Rollen-Basierte RLS Policies
**Als** Systemarchitekt
**möchte ich** sicherstellen, dass Fahrer nur ihre eigenen Fahrten sehen
**damit** Datenschutz gewährleistet ist

**Acceptance Criteria**:
- [ ] Supabase RLS Policies aktiviert für `rides`, `patients`, `drivers`, `destinations`
- [ ] Dispatcher (Role = `dispatcher`): Voller Zugriff auf alle Tabellen
- [ ] Fahrer (Role = `driver`): `SELECT` nur eigene Fahrten (`rides.driver_id = auth.uid()`)
- [ ] Fahrer: `SELECT` Patients nur für eigene Fahrten (via JOIN)
- [ ] Fahrer: `SELECT` eigenen Driver-Eintrag, `UPDATE` nur Telefon
- [ ] Fahrer: Voller Zugriff auf eigene `availability_blocks` und `absences`
- [ ] Policies getestet mit Test-Usern (Dispatcher + Fahrer)

**Technische Umsetzung**:
- SQL-Script in Supabase SQL Editor: `/supabase/rls-policies.sql`
- User-Rolle gespeichert in `user_roles` Tabelle oder Custom Claims
- Helper-Function in Supabase: `is_dispatcher()`, `is_driver()`

**Edge Cases**:
- Fahrer versucht andere Fahrten zu sehen → 403 Forbidden oder leere Liste
- Dispatcher ohne Rolle → Default = kein Zugriff (fail-safe)

**Definition of Done**:
- [ ] Policies in Supabase aktiviert
- [ ] Manuell getestet mit 2 Test-Accounts
- [ ] Dokumentiert in `/supabase/rls-policies.sql`

---

### Epic 2: Stammdaten-Verwaltung

#### Story 2.1: Patienten-Liste anzeigen
**Als** Dispatcher
**möchte ich** alle Patienten in einer Liste sehen
**damit** ich schnell einen Überblick habe

**Acceptance Criteria**:
- [ ] Route `/patients` zeigt Tabelle mit: Name, Adresse, Telefon, Aktionen
- [ ] Nur Patienten mit Status `active` werden angezeigt (Soft-Delete)
- [ ] Sortierung: Alphabetisch nach Name
- [ ] Button "Neuer Patient" führt zu `/patients/new`
- [ ] Click auf Zeile → `/patients/[id]` (Detail-Ansicht)
- [ ] Leere Liste zeigt: "Noch keine Patienten vorhanden"

**Technische Umsetzung**:
- Component: `PatientList` in `/src/components/patients/PatientList.tsx`
- Server Action: `getPatients()` aus `/lib/actions/patients-v2.ts` (bereits vorhanden)
- Route: `/app/(dispatcher)/patients/page.tsx`

**Definition of Done**:
- [ ] Liste funktioniert
- [ ] UI entspricht Design
- [ ] Performance: <1s Load Time bei 100 Patienten

---

#### Story 2.2: Patient anlegen
**Als** Dispatcher
**möchte ich** einen neuen Patienten anlegen
**damit** ich Fahrten für ihn planen kann

**Acceptance Criteria**:
- [ ] Route `/patients/new` zeigt Formular
- [ ] Felder: Name (Text, required), Adresse (Autocomplete, required), Telefon (optional), Besondere Bedürfnisse (Dropdown multi-select: Rollstuhl, Sauerstoff, Begleitperson), Notizen (Textarea, optional)
- [ ] Adresse nutzt Google Places Autocomplete (Component bereits vorhanden: `AddressAutocomplete`)
- [ ] System speichert `formatted_address`, `latitude`, `longitude` aus Places API
- [ ] Button "Speichern" → Server Action `createPatient()`
- [ ] Bei Erfolg: Redirect zu `/patients` mit Toast "Patient erfolgreich angelegt"
- [ ] Bei Fehler: Inline-Fehler anzeigen (z.B. "Name ist erforderlich")

**Technische Umsetzung**:
- Component: `PatientForm` in `/src/components/forms/PatientForm.tsx` (bereits vorhanden?)
- Server Action: `createPatient()` aus `/lib/actions/patients-v2.ts` (bereits vorhanden)
- Route: `/app/(dispatcher)/patients/new/page.tsx`

**Validierung**:
- Name: min 2 Zeichen
- Adresse: muss aus Places API kommen (latitude/longitude vorhanden)
- Telefon: optional, aber falls angegeben: Format validieren (z.B. Schweizer Format)

**Edge Cases**:
- Places API findet Adresse nicht → Fehler "Adresse konnte nicht gefunden werden" (manuelle Eingabe später)
- Duplikat-Name → Warnung, aber erlaubt (gleicher Name möglich)

**Definition of Done**:
- [ ] Formular funktioniert
- [ ] Validierung client-side + server-side
- [ ] Google Places Autocomplete funktioniert
- [ ] Daten werden korrekt gespeichert

---

#### Story 2.3: Patient bearbeiten
**Als** Dispatcher
**möchte ich** Patienten-Daten ändern können
**damit** ich Korrekturen vornehmen kann

**Acceptance Criteria**:
- [ ] Route `/patients/[id]/edit` zeigt vorausgefülltes Formular
- [ ] Alle Felder editierbar (gleiche wie bei Anlegen)
- [ ] Button "Speichern" → Server Action `updatePatient(id, data)`
- [ ] Bei Erfolg: Redirect zu `/patients` mit Toast "Patient aktualisiert"
- [ ] Button "Abbrechen" → Redirect zu `/patients` (ohne Speichern)

**Technische Umsetzung**:
- Gleiche `PatientForm` Component, aber mit Prop `initialData`
- Server Action: `updatePatient()` aus `/lib/actions/patients-v2.ts` (bereits vorhanden)

**Definition of Done**:
- [ ] Bearbeiten funktioniert
- [ ] Formular vorausgefüllt

---

#### Story 2.4: Patient löschen (Soft-Delete)
**Als** Dispatcher
**möchte ich** Patienten löschen können
**damit** ich die Liste sauber halte

**Acceptance Criteria**:
- [ ] Button "Löschen" in Patient-Detail-Ansicht
- [ ] Click → Confirmation Dialog: "Wirklich löschen? Patient: [Name]"
- [ ] Bestätigung → Server Action `deletePatient(id)` (Soft-Delete: Status = `deleted`)
- [ ] Patient verschwindet aus Liste
- [ ] Falls Patient zukünftige Fahrten hat → Fehler "Patient hat aktive Fahrten, kann nicht gelöscht werden"

**Technische Umsetzung**:
- Server Action: `deletePatient()` aus `/lib/actions/patients-v2.ts` (bereits vorhanden)
- Validierung: Prüfe `rides` Tabelle auf zukünftige Fahrten

**Definition of Done**:
- [ ] Löschen funktioniert
- [ ] Confirmation Dialog vorhanden
- [ ] Validierung verhindert Löschen bei Dependencies

---

#### Story 2.5: Fahrer-Liste, -Anlegen, -Bearbeiten, -Löschen
**Als** Dispatcher
**möchte ich** Fahrer verwalten (analog zu Patienten)
**damit** ich sie Fahrten zuweisen kann

**Acceptance Criteria**:
- [ ] Route `/drivers` zeigt Tabelle: Name, Email, Telefon, Aktionen
- [ ] Formular: Name (required), Email (required, unique), Telefon (required)
- [ ] Validierung: Email-Format, Email unique in DB
- [ ] Anlegen/Bearbeiten/Löschen analog zu Patienten
- [ ] Soft-Delete: Status = `deleted`

**Technische Umsetzung**:
- Component: `DriverList`, `DriverForm`
- Server Actions: `getDrivers()`, `createDriver()`, `updateDriver()`, `deleteDriver()` aus `/lib/actions/drivers-v2.ts` (bereits vorhanden)
- Routes: `/app/(dispatcher)/drivers/...`

**Definition of Done**:
- [ ] Alle CRUD-Operationen funktionieren
- [ ] Email-Validierung funktioniert

---

#### Story 2.6: Destinations-Liste, -Anlegen, -Bearbeiten, -Löschen
**Als** Dispatcher
**möchte ich** Ziele verwalten (analog zu Patienten)
**damit** ich Fahrten planen kann

**Acceptance Criteria**:
- [ ] Route `/destinations` zeigt Tabelle: Name, Adresse, Ankunftsfenster, Aktionen
- [ ] Formular: Name (required), Adresse (Autocomplete, required), Ankunftsfenster von/bis (optional)
- [ ] Ankunftsfenster: Zwei Time-Picker (z.B. 08:00 - 09:00)
- [ ] Google Places Autocomplete wie bei Patienten
- [ ] CRUD analog zu Patienten

**Technische Umsetzung**:
- Component: `DestinationList`, `DestinationForm`
- Server Actions: `getDestinations()`, `createDestination()`, `updateDestination()`, `deleteDestination()` aus `/lib/actions/destinations-v2.ts` (bereits vorhanden)
- Routes: `/app/(dispatcher)/destinations/...`

**Definition of Done**:
- [ ] CRUD funktioniert
- [ ] Ankunftsfenster wird gespeichert

---

### Epic 3: Fahrtenverwaltung (Kern)

#### Story 3.1: Fahrt anlegen (Basic)
**Als** Dispatcher
**möchte ich** eine neue Fahrt anlegen
**damit** ich einen Transportauftrag planen kann

**Acceptance Criteria**:
- [ ] Route `/rides/new` zeigt Formular
- [ ] Felder:
  - Patient (Dropdown, required, nur active Patienten)
  - Destination (Dropdown, required, nur active Destinations)
  - Abholzeit (DateTime Picker, required)
  - Ankunftszeit (DateTime Picker, optional – wird berechnet)
  - Fahrer (Dropdown, optional – kann später zugewiesen werden)
  - Rückfahrt (Checkbox)
  - Rückfahrtzeit (DateTime Picker, nur wenn Rückfahrt = true)
  - Notizen (Textarea, optional)
- [ ] Bei Auswahl Patient + Destination: Automatische Routenberechnung (Google Directions API)
- [ ] Anzeige: Geschätzte Dauer, Distanz (readonly)
- [ ] Falls Ankunftszeit leer: Automatisch berechnen (Abholzeit + Dauer + 5min Puffer)
- [ ] Button "Speichern" → Server Action `createRide()`
- [ ] Status initial: `planned`
- [ ] Bei Erfolg: Redirect zu `/rides` mit Toast "Fahrt erfolgreich angelegt"

**Technische Umsetzung**:
- Component: `RideForm` in `/src/components/forms/RideForm.tsx` (existiert bereits?)
- Server Action: `createRide()` in `/lib/actions/rides.ts` (muss V2-gehärtet werden)
- Route Calculation: `/app/api/routes/calculate` (bereits vorhanden?)
- Route: `/app/(dispatcher)/rides/new/page.tsx`

**Validierung**:
- Abholzeit muss in Zukunft liegen (oder heute)
- Ankunftszeit > Abholzeit
- Falls Rückfahrt: Rückfahrtzeit > Ankunftszeit
- Patient und Destination müssen existieren (Status = active)

**Rückfahrt-Logik**:
- Falls Rückfahrt = true: Zwei separate Fahrten in DB speichern
- Beide Fahrten bekommen gleichen `recurrence_group` (UUID generiert)
- Fahrt 1: Patient → Destination (pickup_time = Abholzeit)
- Fahrt 2: Destination → Patient (pickup_time = Rückfahrtzeit)

**Edge Cases**:
- Google Directions API Fehler → Fehler "Route konnte nicht berechnet werden", manuelle Eingabe Dauer/Distanz (später), MVP: Fehler anzeigen
- Fahrer zugewiesen, aber nicht verfügbar → Warnung "Fahrer hat keine Verfügbarkeit zu dieser Zeit" (Blocker? Nein, nur Warnung)

**Definition of Done**:
- [ ] Formular funktioniert
- [ ] Routenberechnung funktioniert
- [ ] Validierung client + server
- [ ] Rückfahrt wird als separate Fahrt gespeichert

---

#### Story 3.2: Fahrtenliste mit Filter
**Als** Dispatcher
**möchte ich** alle Fahrten in einer Liste sehen
**damit** ich den Überblick behalte

**Acceptance Criteria**:
- [ ] Route `/rides` zeigt Tabelle: Datum, Abholzeit, Patient, Fahrer, Destination, Status, Aktionen
- [ ] Filter:
  - Datum (DatePicker, default = heute)
  - Status (Dropdown: Alle, Geplant, Bestätigt, Unterwegs, Abgeschlossen, Storniert)
  - Fahrer (Dropdown: Alle Fahrer + "Nicht zugewiesen")
- [ ] Sortierung: Standard nach Abholzeit (aufsteigend)
- [ ] Status-Badge farblich: `planned` = grau, `confirmed` = blau, `in_progress` = gelb, `completed` = grün, `cancelled` = rot
- [ ] Click auf Zeile → `/rides/[id]` (Detail-Ansicht)
- [ ] Button "Neue Fahrt" → `/rides/new`
- [ ] Pagination: 50 Einträge pro Seite

**Technische Umsetzung**:
- Component: `RideList` in `/src/components/rides/RideList.tsx` (existiert bereits?)
- Server Action: `getRides(filters)` in `/lib/actions/rides.ts`
- Route: `/app/(dispatcher)/rides/page.tsx`

**Filter-Logik**:
- Datum-Filter: `pickup_time::date = [selected_date]`
- Status-Filter: `status = [selected_status]`
- Fahrer-Filter: `driver_id = [selected_driver_id]` ODER `driver_id IS NULL`

**Definition of Done**:
- [ ] Liste zeigt Fahrten
- [ ] Filter funktionieren
- [ ] Performance: <2s bei 500 Fahrten

---

#### Story 3.3: Fahrt bearbeiten
**Als** Dispatcher
**möchte ich** Fahrt-Details ändern können
**damit** ich auf Änderungen reagieren kann

**Acceptance Criteria**:
- [ ] Route `/rides/[id]/edit` zeigt vorausgefülltes Formular
- [ ] Alle Felder editierbar (gleiche wie bei Anlegen)
- [ ] Falls Fahrer geändert wird: Keine Benachrichtigung (erst Sprint 2)
- [ ] Button "Speichern" → Server Action `updateRide(id, data)`
- [ ] Bei Erfolg: Redirect zu `/rides` mit Toast "Fahrt aktualisiert"

**Validierung**:
- Gleiche Regeln wie bei Anlegen
- Zusätzlich: Falls Status = `completed` oder `cancelled`, nur Notizen editierbar (Zeiten/Fahrer locked)

**Definition of Done**:
- [ ] Bearbeiten funktioniert
- [ ] Validierung aktiv

---

#### Story 3.4: Fahrt stornieren
**Als** Dispatcher
**möchte ich** Fahrten stornieren können
**damit** ich auf Absagen reagieren kann

**Acceptance Criteria**:
- [ ] Button "Stornieren" in Fahrt-Detail-Ansicht
- [ ] Click → Confirmation Dialog: "Fahrt wirklich stornieren?"
- [ ] Optionales Feld: "Grund für Stornierung" (Freitext)
- [ ] Bestätigung → Server Action `cancelRide(id, reason)`
- [ ] Status → `cancelled`, `cancelled_at = NOW()`, Grund in `notes`
- [ ] Fahrt bleibt in DB (kein Delete)
- [ ] Fahrt erscheint weiterhin in Liste (mit Status-Badge "Storniert")

**Validierung**:
- Nur möglich wenn Status = `planned`, `confirmed`, `in_progress`
- Falls Status = `completed`: Fehler "Abgeschlossene Fahrten können nicht storniert werden"

**Definition of Done**:
- [ ] Stornieren funktioniert
- [ ] Grund wird gespeichert

---

### Epic 4: Disposition (Fahrer-Zuweisung)

#### Story 4.1: Fahrer zuweisen mit Verfügbarkeits-Check
**Als** Dispatcher
**möchte ich** beim Zuweisen eines Fahrers sehen, ob er verfügbar ist
**damit** ich informierte Entscheidungen treffe

**Acceptance Criteria**:
- [ ] Im Fahrt-Formular (Anlegen/Bearbeiten): Dropdown "Fahrer zuweisen"
- [ ] Dropdown zeigt alle Fahrer (auch deleted = false)
- [ ] Verfügbarkeits-Indikator:
  - **Grün**: Fahrer hat Availability Block zur Abholzeit, keine Abwesenheit, keine überlappende Fahrt
  - **Gelb**: Fahrer verfügbar, aber hat bereits andere Fahrt zur ähnlichen Zeit (Warnung)
  - **Grau**: Fahrer nicht verfügbar (Abwesenheit oder kein Availability Block)
- [ ] Hover über Indikator → Tooltip erklärt Status
- [ ] Dispatcher kann trotzdem jeden Fahrer zuweisen (auch graue)
- [ ] System speichert `driver_id`

**Technische Umsetzung**:
- Server Action: `getAvailableDrivers(pickup_time)` in `/lib/actions/drivers-v2.ts`
- Logik:
  1. Prüfe `availability_blocks`: Weekday + Time passt?
  2. Prüfe `absences`: Liegt pickup_time in Abwesenheit?
  3. Prüfe `rides`: Hat Fahrer überlappende Fahrt? (pickup_time ± 1h)
- Component: `DriverDropdown` mit farblichen Badges

**Edge Cases**:
- Fahrer hat keine Availability Blocks → Grau (aber zuweisbar)
- Mehrere Fahrten zur gleichen Zeit → Gelb (Warnung, aber erlaubt)

**Definition of Done**:
- [ ] Dropdown zeigt Verfügbarkeit farblich
- [ ] Tooltip funktioniert
- [ ] Logik korrekt implementiert

---

#### Story 4.2: Fahrer-Zuweisung entfernen
**Als** Dispatcher
**möchte ich** einen Fahrer von einer Fahrt entfernen
**damit** ich ihn neu zuweisen kann

**Acceptance Criteria**:
- [ ] In Fahrt-Detail oder Fahrt-Bearbeiten: Button "Fahrer entfernen"
- [ ] Click → `driver_id = NULL`, Status bleibt unverändert
- [ ] Fahrt erscheint in Liste als "Nicht zugewiesen"

**Definition of Done**:
- [ ] Entfernen funktioniert

---

### Epic 5: Kalender-Ansicht

#### Story 5.1: Wochen-Kalender mit Fahrten
**Als** Dispatcher
**möchte ich** alle Fahrten der Woche im Kalender sehen
**damit** ich visuell planen kann

**Acceptance Criteria**:
- [ ] Route `/dashboard` oder `/calendar` zeigt Kalender
- [ ] Ansicht: 7 Tage (Mo-So), Zeitachse 08:00-18:00
- [ ] Jede Fahrt als Card: Patient-Name, Abholzeit-Ankunftszeit, Fahrer (falls zugewiesen), Status-Badge
- [ ] Farbe nach Status: grau, blau, gelb, grün, rot (wie Liste)
- [ ] Click auf Card → `/rides/[id]` (Detail)
- [ ] Navigation: "Vorherige Woche", "Diese Woche", "Nächste Woche"
- [ ] Highlight: Heutiger Tag markiert

**Technische Umsetzung**:
- Component: `CalendarView` in `/src/components/calendar/CalendarView.tsx` (existiert bereits?)
- Server Action: `getRides({ from_date, to_date })`
- Kalender-Library: FullCalendar.js ODER custom Grid (Entscheidung offen)

**Edge Cases**:
- Überlappende Fahrten (gleicher Fahrer, gleiche Zeit) → Stacked Cards oder Warnung
- Keine Fahrten in Woche → "Keine Fahrten geplant"

**Definition of Done**:
- [ ] Kalender zeigt Fahrten
- [ ] Navigation funktioniert
- [ ] Performance: <2s Load bei 100 Fahrten/Woche

---

### Sprint 1 Summary

**Total User Stories**: 20
**Priorität Breakdown**:
- P0 (Blocker): 10 Stories (Auth, Stammdaten CRUD, Fahrt CRUD)
- P1 (Wichtig): 6 Stories (Kalender, Disposition mit Verfügbarkeit)
- P2 (Nice-to-have): 4 Stories (Fahrer entfernen, erweiterte Filter)

**Geschätzte Velocity**: 13-15 Stories (realistisch für 2 Wochen mit AI-Assistenz)

**Sprint 1 Risiken**:
- Google Places API Integration könnte Probleme machen → Fallback: Manuelle Adresseingabe
- RLS Policies komplex → Dedizierter Test-Tag einplanen
- Kalender-Component: Falls FullCalendar zu komplex → Custom Grid (einfacher)

---

## Sprint 2: Dispatcher Workflows abschließen (Woche 3-4)

**Sprint Goal**: "Kalender voll funktional, Fahrerverfügbarkeit readonly, Dispatcher-Workflows end-to-end testbar"

### Geplante Stories:
- Story 5.2: Tages-Ansicht Kalender (detaillierter als Woche)
- Story 6.1: Fahrerverfügbarkeit readonly anzeigen (Dispatcher sieht Availability Grid)
- Story 6.2: Abwesenheiten readonly anzeigen
- Story 7.1: Dashboard mit Statistiken (Anzahl Fahrten heute, offene Zuweisungen, etc.)
- Story 8.1: Erweiterte Suche (Freitext-Suche über Patient/Destination)
- Story 9.1: Ride-Detail-Ansicht mit Karte (RouteMap Component integrieren)

**Definition of Done Sprint 2**:
- [ ] Milestone 1 erreicht (siehe Roadmap)
- [ ] Demo-Szenario erfolgreich durchgeführt
- [ ] Alle P0 Bugs geschlossen
- [ ] Code Review abgeschlossen
- [ ] Deployment auf Vercel Staging

---

## Sprint 3: Driver Integration (Woche 5-6)

**Sprint Goal**: "Fahrer können sich anmelden, zugewiesene Fahrten sehen und bestätigen/ablehnen"

### Geplante Epics:
- Epic 6: Driver Mobile UI
- Epic 7: Fahrerbenachrichtigung
- Epic 8: Fahrer bestätigt/lehnt Fahrt ab

### Beispiel-Stories:
- Story 10.1: Fahrer sieht Liste zugewiesener Fahrten
- Story 10.2: Fahrer-Detail-Ansicht (Patient, Destination, Zeit, Karte)
- Story 11.1: Fahrer bestätigt Fahrt → Status `confirmed`
- Story 11.2: Fahrer lehnt Fahrt ab → Dispatcher erhält Notification
- Story 12.1: Email-Benachrichtigung bei Zuweisung
- Story 13.1: Fahrer pflegt Verfügbarkeit (AvailabilityGrid editierbar)
- Story 13.2: Fahrer erfasst Abwesenheit

**Definition of Done Sprint 3**:
- [ ] Fahrer kann volle User Journey durchlaufen
- [ ] Email-Benachrichtigung funktioniert
- [ ] Responsive Design für Mobile getestet

---

## Sprint 4: Ride Execution (Woche 7-8)

**Sprint Goal**: "Fahrer kann Fahrt durchführen und Status live aktualisieren"

### Geplante Stories:
- Story 14.1: Fahrer startet Fahrt → Status `in_progress`
- Story 14.2: Fahrer schließt Fahrt ab → Status `completed`
- Story 14.3: Timestamps werden gespeichert (started_at, picked_up_at, arrived_at, completed_at)
- Story 14.4: Dispatcher sieht Live-Status (Real-time via Supabase Subscriptions?)
- Story 15.1: SMS-Benachrichtigung (Twilio Integration)

**Definition of Done Sprint 4**:
- [ ] Milestone 2 erreicht
- [ ] Status-Flow vollständig implementiert

---

## Sprint 5-6: Stabilization & Launch Prep (Woche 9-12)

**Sprint Goal**: "Production-Ready – Alle kritischen Workflows getestet, Sicherheits-Audit, Performance-Optimierung"

### Geplante Aktivitäten:
- Bug Fixing (alle P0/P1 Bugs)
- Performance-Tests (Load Tests mit 1000 Fahrten)
- Sicherheits-Audit (Penetration Test, RLS Policy Review)
- End-to-End Tests (Automated Testing mit Playwright?)
- Dokumentation für Endnutzer (Quick Start Guide)
- Deployment auf Production (Vercel)

**Definition of Done Sprint 6**:
- [ ] Milestone 3 erreicht (siehe Roadmap)
- [ ] Go/No-Go Meeting: Alle Kriterien erfüllt
- [ ] Production Launch

---

## Backlog (Post-MVP)

### Sprint 7+: Operational Excellence
- Wiederkehrende Fahrten (Workflow 4)
- Problem-Meldung während Fahrt
- Audit Log
- Erweiterte Statistiken
- Route-Optimierung

### Sprint 10+: Scale Features
- Automatische Fahrer-Vorschläge (ML)
- Abrechnung & Reporting
- Native Mobile App
- Multi-Tenant Support

---

## Story Estimation (für Velocity-Tracking)

**Fibonacci-Skala (Story Points)**:
- 1 = Trivial (z.B. Button hinzufügen)
- 2 = Einfach (z.B. CRUD-Formular mit vorhandener Logik)
- 3 = Standard (z.B. Neue Page mit Server Action)
- 5 = Komplex (z.B. Google API Integration)
- 8 = Sehr komplex (z.B. RLS Policies + Tests)
- 13 = Epic (sollte aufgeteilt werden)

**Sprint 1 Estimation (Beispiel)**:
- Story 1.1 (Login): 3 Points
- Story 1.2 (Logout): 1 Point
- Story 1.3 (RLS): 8 Points
- Story 2.1 (Patienten-Liste): 2 Points
- Story 2.2 (Patient anlegen): 5 Points (wegen Google Places)
- Story 3.1 (Fahrt anlegen): 8 Points (komplex)
- Story 5.1 (Kalender): 8 Points (komplex)

**Total Sprint 1**: ~50 Points (realistisch für 2 Wochen mit AI-Support)

---

## Definitionen

### Definition of Ready (DoR)
Story ist bereit für Sprint, wenn:
- [ ] Akzeptanzkriterien klar definiert
- [ ] Technische Umsetzung skizziert
- [ ] Abhängigkeiten identifiziert
- [ ] Geschätzt (Story Points)
- [ ] Product Owner hat freigegeben

### Definition of Done (DoD)
Story ist fertig, wenn:
- [ ] Code implementiert
- [ ] Server-side Validierung implementiert
- [ ] Client-side Validierung implementiert
- [ ] Error Handling implementiert
- [ ] UI entspricht Design
- [ ] Responsive (funktioniert auf Desktop + Mobile)
- [ ] Manuell getestet (Happy Path + Edge Cases)
- [ ] Code Review durchgeführt (falls Team >1 Person)
- [ ] Deployed auf Staging
- [ ] Akzeptanzkriterien erfüllt (vom PO abgenommen)

---

**Nächster Schritt**: Sprint 1 starten. Team committet auf Sprint Goal und beginnt mit Story 1.1 (Login).
