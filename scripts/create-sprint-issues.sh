#!/bin/bash

# Script to create GitHub Issues for Sprint 1-4
# Usage: ./scripts/create-sprint-issues.sh

set -e

REPO="trismus/Fahrdienst"

echo "Creating Sprint 1 Issues..."

# Epic 1: Authentication & Security

gh api repos/$REPO/issues -X POST -f title="Story 1.1: Login-Seite" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Auth" \
  -f body="**Als** Dispatcher
**möchte ich** mich mit Email und Passwort anmelden
**damit** ich Zugriff auf die Dispatching-Features habe

## Acceptance Criteria
- [ ] Login-Seite unter \`/login\` erreichbar
- [ ] Formular mit Email (type=email, required) und Passwort (type=password, required)
- [ ] Button \"Anmelden\" validiert Eingabe client-side (Email-Format)
- [ ] Bei erfolgreichem Login: Redirect zu \`/dashboard\`
- [ ] Bei fehlerhaften Credentials: Fehler \"Ungültige Anmeldedaten\" anzeigen
- [ ] Supabase Auth Session wird gespeichert (Cookie)
- [ ] Responsive Design (funktioniert auf Desktop und Mobile)

## Technische Umsetzung
- \`/app/login/page.tsx\` mit LoginForm Component
- Server Action: \`signIn(email, password)\` in \`/lib/actions/auth.ts\`
- Supabase Auth: \`supabase.auth.signInWithPassword()\`
- Redirect via \`redirect('/dashboard')\`

## Edge Cases
- Email nicht registriert → Fehler \"Kein Benutzer gefunden\"
- Passwort falsch → Fehler \"Ungültiges Passwort\"
- Netzwerkfehler → Fehler \"Verbindung fehlgeschlagen, bitte erneut versuchen\"

## Definition of Done
- [ ] Code implementiert und getestet
- [ ] UI entspricht Design (Uber-Stil, minimalistisch)
- [ ] Funktioniert in Chrome, Safari, Firefox
- [ ] Error Handling implementiert

**Story Points:** 3"

echo "Created Story 1.1"

gh api repos/$REPO/issues -X POST -f title="Story 1.2: Logout-Funktion" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Auth" \
  -f body="**Als** angemeldeter Benutzer
**möchte ich** mich abmelden können
**damit** niemand anderes auf meinen Account zugreifen kann

## Acceptance Criteria
- [ ] Logout-Button im Header/Navigation sichtbar (nur wenn eingeloggt)
- [ ] Click auf Logout → Server Action \`signOut()\`
- [ ] Session wird gelöscht
- [ ] Redirect zu \`/login\`
- [ ] Nach Logout: Zugriff auf protected routes nicht mehr möglich

## Technische Umsetzung
- Server Action: \`signOut()\` in \`/lib/actions/auth.ts\`
- Supabase: \`supabase.auth.signOut()\`
- Middleware: Protected routes prüfen Session

## Definition of Done
- [ ] Logout funktioniert
- [ ] Session wird korrekt gelöscht
- [ ] Redirect funktioniert

**Story Points:** 1"

echo "Created Story 1.2"

gh api repos/$REPO/issues -X POST -f title="Story 1.3: Rollen-Basierte RLS Policies" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Auth" \
  -f body="**Als** Systemarchitekt
**möchte ich** sicherstellen, dass Fahrer nur ihre eigenen Fahrten sehen
**damit** Datenschutz gewährleistet ist

## Acceptance Criteria
- [ ] Supabase RLS Policies aktiviert für \`rides\`, \`patients\`, \`drivers\`, \`destinations\`
- [ ] Dispatcher (Role = \`dispatcher\`): Voller Zugriff auf alle Tabellen
- [ ] Fahrer (Role = \`driver\`): \`SELECT\` nur eigene Fahrten (\`rides.driver_id = auth.uid()\`)
- [ ] Fahrer: \`SELECT\` Patients nur für eigene Fahrten (via JOIN)
- [ ] Fahrer: \`SELECT\` eigenen Driver-Eintrag, \`UPDATE\` nur Telefon
- [ ] Fahrer: Voller Zugriff auf eigene \`availability_blocks\` und \`absences\`
- [ ] Policies getestet mit Test-Usern (Dispatcher + Fahrer)

## Technische Umsetzung
- SQL-Script in Supabase SQL Editor: \`/supabase/rls-policies.sql\`
- User-Rolle gespeichert in \`user_roles\` Tabelle oder Custom Claims
- Helper-Function in Supabase: \`is_dispatcher()\`, \`is_driver()\`

## Edge Cases
- Fahrer versucht andere Fahrten zu sehen → 403 Forbidden oder leere Liste
- Dispatcher ohne Rolle → Default = kein Zugriff (fail-safe)

## Definition of Done
- [ ] Policies in Supabase aktiviert
- [ ] Manuell getestet mit 2 Test-Accounts
- [ ] Dokumentiert in \`/supabase/rls-policies.sql\`

**Story Points:** 8"

echo "Created Story 1.3"

# Epic 2: Stammdaten-Verwaltung

gh api repos/$REPO/issues -X POST -f title="Story 2.1: Patienten-Liste anzeigen" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Stammdaten" \
  -f body="**Als** Dispatcher
**möchte ich** alle Patienten in einer Liste sehen
**damit** ich schnell einen Überblick habe

## Acceptance Criteria
- [ ] Route \`/patients\` zeigt Tabelle mit: Name, Adresse, Telefon, Aktionen
- [ ] Nur Patienten mit Status \`active\` werden angezeigt (Soft-Delete)
- [ ] Sortierung: Alphabetisch nach Name
- [ ] Button \"Neuer Patient\" führt zu \`/patients/new\`
- [ ] Click auf Zeile → \`/patients/[id]\` (Detail-Ansicht)
- [ ] Leere Liste zeigt: \"Noch keine Patienten vorhanden\"

## Technische Umsetzung
- Component: \`PatientList\` in \`/src/components/patients/PatientList.tsx\`
- Server Action: \`getPatients()\` aus \`/lib/actions/patients-v2.ts\` (bereits vorhanden)
- Route: \`/app/(dispatcher)/patients/page.tsx\`

## Definition of Done
- [ ] Liste funktioniert
- [ ] UI entspricht Design
- [ ] Performance: <1s Load Time bei 100 Patienten

**Story Points:** 2"

echo "Created Story 2.1"

gh api repos/$REPO/issues -X POST -f title="Story 2.2: Patient anlegen" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Stammdaten" \
  -f body="**Als** Dispatcher
**möchte ich** einen neuen Patienten anlegen
**damit** ich Fahrten für ihn planen kann

## Acceptance Criteria
- [ ] Route \`/patients/new\` zeigt Formular
- [ ] Felder: Name (Text, required), Adresse (Autocomplete, required), Telefon (optional), Besondere Bedürfnisse (Dropdown multi-select: Rollstuhl, Sauerstoff, Begleitperson), Notizen (Textarea, optional)
- [ ] Adresse nutzt Google Places Autocomplete (Component bereits vorhanden: \`AddressAutocomplete\`)
- [ ] System speichert \`formatted_address\`, \`latitude\`, \`longitude\` aus Places API
- [ ] Button \"Speichern\" → Server Action \`createPatient()\`
- [ ] Bei Erfolg: Redirect zu \`/patients\` mit Toast \"Patient erfolgreich angelegt\"
- [ ] Bei Fehler: Inline-Fehler anzeigen (z.B. \"Name ist erforderlich\")

## Technische Umsetzung
- Component: \`PatientForm\` in \`/src/components/forms/PatientForm.tsx\`
- Server Action: \`createPatient()\` aus \`/lib/actions/patients-v2.ts\` (bereits vorhanden)
- Route: \`/app/(dispatcher)/patients/new/page.tsx\`

## Validierung
- Name: min 2 Zeichen
- Adresse: muss aus Places API kommen (latitude/longitude vorhanden)
- Telefon: optional, aber falls angegeben: Format validieren

## Edge Cases
- Places API findet Adresse nicht → Fehler \"Adresse konnte nicht gefunden werden\"
- Duplikat-Name → Warnung, aber erlaubt (gleicher Name möglich)

## Definition of Done
- [ ] Formular funktioniert
- [ ] Validierung client-side + server-side
- [ ] Google Places Autocomplete funktioniert
- [ ] Daten werden korrekt gespeichert

**Story Points:** 5"

echo "Created Story 2.2"

gh api repos/$REPO/issues -X POST -f title="Story 2.3: Patient bearbeiten" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Stammdaten" \
  -f body="**Als** Dispatcher
**möchte ich** Patienten-Daten ändern können
**damit** ich Korrekturen vornehmen kann

## Acceptance Criteria
- [ ] Route \`/patients/[id]/edit\` zeigt vorausgefülltes Formular
- [ ] Alle Felder editierbar (gleiche wie bei Anlegen)
- [ ] Button \"Speichern\" → Server Action \`updatePatient(id, data)\`
- [ ] Bei Erfolg: Redirect zu \`/patients\` mit Toast \"Patient aktualisiert\"
- [ ] Button \"Abbrechen\" → Redirect zu \`/patients\` (ohne Speichern)

## Technische Umsetzung
- Gleiche \`PatientForm\` Component, aber mit Prop \`initialData\`
- Server Action: \`updatePatient()\` aus \`/lib/actions/patients-v2.ts\` (bereits vorhanden)

## Definition of Done
- [ ] Bearbeiten funktioniert
- [ ] Formular vorausgefüllt

**Story Points:** 2"

echo "Created Story 2.3"

gh api repos/$REPO/issues -X POST -f title="Story 2.4: Patient löschen (Soft-Delete)" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Stammdaten" \
  -f body="**Als** Dispatcher
**möchte ich** Patienten löschen können
**damit** ich die Liste sauber halte

## Acceptance Criteria
- [ ] Button \"Löschen\" in Patient-Detail-Ansicht
- [ ] Click → Confirmation Dialog: \"Wirklich löschen? Patient: [Name]\"
- [ ] Bestätigung → Server Action \`deletePatient(id)\` (Soft-Delete: Status = \`deleted\`)
- [ ] Patient verschwindet aus Liste
- [ ] Falls Patient zukünftige Fahrten hat → Fehler \"Patient hat aktive Fahrten, kann nicht gelöscht werden\"

## Technische Umsetzung
- Server Action: \`deletePatient()\` aus \`/lib/actions/patients-v2.ts\` (bereits vorhanden)
- Validierung: Prüfe \`rides\` Tabelle auf zukünftige Fahrten

## Definition of Done
- [ ] Löschen funktioniert
- [ ] Confirmation Dialog vorhanden
- [ ] Validierung verhindert Löschen bei Dependencies

**Story Points:** 3"

echo "Created Story 2.4"

gh api repos/$REPO/issues -X POST -f title="Story 2.5: Fahrer-CRUD (Liste, Anlegen, Bearbeiten, Löschen)" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Stammdaten" \
  -f body="**Als** Dispatcher
**möchte ich** Fahrer verwalten (analog zu Patienten)
**damit** ich sie Fahrten zuweisen kann

## Acceptance Criteria
- [ ] Route \`/drivers\` zeigt Tabelle: Name, Email, Telefon, Aktionen
- [ ] Formular: Name (required), Email (required, unique), Telefon (required)
- [ ] Validierung: Email-Format, Email unique in DB
- [ ] Anlegen/Bearbeiten/Löschen analog zu Patienten
- [ ] Soft-Delete: Status = \`deleted\`

## Technische Umsetzung
- Component: \`DriverList\`, \`DriverForm\`
- Server Actions: \`getDrivers()\`, \`createDriver()\`, \`updateDriver()\`, \`deleteDriver()\` aus \`/lib/actions/drivers-v2.ts\` (bereits vorhanden)
- Routes: \`/app/(dispatcher)/drivers/...\`

## Definition of Done
- [ ] Alle CRUD-Operationen funktionieren
- [ ] Email-Validierung funktioniert

**Story Points:** 5"

echo "Created Story 2.5"

gh api repos/$REPO/issues -X POST -f title="Story 2.6: Destinations-CRUD (Liste, Anlegen, Bearbeiten, Löschen)" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Stammdaten" \
  -f body="**Als** Dispatcher
**möchte ich** Ziele verwalten (analog zu Patienten)
**damit** ich Fahrten planen kann

## Acceptance Criteria
- [ ] Route \`/destinations\` zeigt Tabelle: Name, Adresse, Ankunftsfenster, Aktionen
- [ ] Formular: Name (required), Adresse (Autocomplete, required), Ankunftsfenster von/bis (optional)
- [ ] Ankunftsfenster: Zwei Time-Picker (z.B. 08:00 - 09:00)
- [ ] Google Places Autocomplete wie bei Patienten
- [ ] CRUD analog zu Patienten

## Technische Umsetzung
- Component: \`DestinationList\`, \`DestinationForm\`
- Server Actions: \`getDestinations()\`, \`createDestination()\`, \`updateDestination()\`, \`deleteDestination()\` aus \`/lib/actions/destinations-v2.ts\` (bereits vorhanden)
- Routes: \`/app/(dispatcher)/destinations/...\`

## Definition of Done
- [ ] CRUD funktioniert
- [ ] Ankunftsfenster wird gespeichert

**Story Points:** 5"

echo "Created Story 2.6"

# Epic 3: Fahrtenverwaltung

gh api repos/$REPO/issues -X POST -f title="Story 3.1: Fahrt anlegen (Basic)" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Dispatcher
**möchte ich** eine neue Fahrt anlegen
**damit** ich einen Transportauftrag planen kann

## Acceptance Criteria
- [ ] Route \`/rides/new\` zeigt Formular
- [ ] Felder: Patient (Dropdown), Destination (Dropdown), Abholzeit (DateTime), Ankunftszeit (DateTime), Fahrer (optional), Rückfahrt (Checkbox), Rückfahrtzeit, Notizen
- [ ] Bei Auswahl Patient + Destination: Automatische Routenberechnung
- [ ] Anzeige: Geschätzte Dauer, Distanz (readonly)
- [ ] Falls Ankunftszeit leer: Automatisch berechnen (Abholzeit + Dauer + 5min Puffer)
- [ ] Button \"Speichern\" → Server Action \`createRide()\`
- [ ] Status initial: \`planned\`
- [ ] Bei Erfolg: Redirect zu \`/rides\`

## Rückfahrt-Logik
- Falls Rückfahrt = true: Zwei separate Fahrten in DB speichern
- Beide Fahrten bekommen gleichen \`recurrence_group\` (UUID)
- Fahrt 1: Patient → Destination (pickup_time = Abholzeit)
- Fahrt 2: Destination → Patient (pickup_time = Rückfahrtzeit)

## Validierung
- Abholzeit muss in Zukunft liegen
- Ankunftszeit > Abholzeit
- Falls Rückfahrt: Rückfahrtzeit > Ankunftszeit

## Definition of Done
- [ ] Formular funktioniert
- [ ] Routenberechnung funktioniert
- [ ] Validierung client + server
- [ ] Rückfahrt wird als separate Fahrt gespeichert

**Story Points:** 8"

echo "Created Story 3.1"

gh api repos/$REPO/issues -X POST -f title="Story 3.2: Fahrtenliste mit Filter" -F milestone=1 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Dispatcher
**möchte ich** alle Fahrten in einer Liste sehen
**damit** ich den Überblick behalte

## Acceptance Criteria
- [ ] Route \`/rides\` zeigt Tabelle: Datum, Abholzeit, Patient, Fahrer, Destination, Status, Aktionen
- [ ] Filter: Datum (default = heute), Status (Dropdown), Fahrer (Dropdown)
- [ ] Sortierung: Standard nach Abholzeit (aufsteigend)
- [ ] Status-Badge farblich: planned=grau, confirmed=blau, in_progress=gelb, completed=grün, cancelled=rot
- [ ] Click auf Zeile → \`/rides/[id]\` (Detail-Ansicht)
- [ ] Button \"Neue Fahrt\" → \`/rides/new\`
- [ ] Pagination: 50 Einträge pro Seite

## Technische Umsetzung
- Component: \`RideList\` in \`/src/components/rides/RideList.tsx\`
- Server Action: \`getRides(filters)\` in \`/lib/actions/rides.ts\`
- Route: \`/app/(dispatcher)/rides/page.tsx\`

## Definition of Done
- [ ] Liste zeigt Fahrten
- [ ] Filter funktionieren
- [ ] Performance: <2s bei 500 Fahrten

**Story Points:** 3"

echo "Created Story 3.2"

gh api repos/$REPO/issues -X POST -f title="Story 3.3: Fahrt bearbeiten" -F milestone=1 \
  -f labels[]="P1: Important" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Dispatcher
**möchte ich** Fahrt-Details ändern können
**damit** ich auf Änderungen reagieren kann

## Acceptance Criteria
- [ ] Route \`/rides/[id]/edit\` zeigt vorausgefülltes Formular
- [ ] Alle Felder editierbar (gleiche wie bei Anlegen)
- [ ] Falls Fahrer geändert wird: Keine Benachrichtigung (erst Sprint 2)
- [ ] Button \"Speichern\" → Server Action \`updateRide(id, data)\`
- [ ] Bei Erfolg: Redirect zu \`/rides\` mit Toast \"Fahrt aktualisiert\"

## Validierung
- Gleiche Regeln wie bei Anlegen
- Falls Status = \`completed\` oder \`cancelled\`, nur Notizen editierbar (Zeiten/Fahrer locked)

## Definition of Done
- [ ] Bearbeiten funktioniert
- [ ] Validierung aktiv

**Story Points:** 3"

echo "Created Story 3.3"

gh api repos/$REPO/issues -X POST -f title="Story 3.4: Fahrt stornieren" -F milestone=1 \
  -f labels[]="P1: Important" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Dispatcher
**möchte ich** Fahrten stornieren können
**damit** ich auf Absagen reagieren kann

## Acceptance Criteria
- [ ] Button \"Stornieren\" in Fahrt-Detail-Ansicht
- [ ] Click → Confirmation Dialog: \"Fahrt wirklich stornieren?\"
- [ ] Optionales Feld: \"Grund für Stornierung\" (Freitext)
- [ ] Bestätigung → Server Action \`cancelRide(id, reason)\`
- [ ] Status → \`cancelled\`, \`cancelled_at = NOW()\`, Grund in \`notes\`
- [ ] Fahrt bleibt in DB (kein Delete)

## Validierung
- Nur möglich wenn Status = \`planned\`, \`confirmed\`, \`in_progress\`
- Falls Status = \`completed\`: Fehler \"Abgeschlossene Fahrten können nicht storniert werden\"

## Definition of Done
- [ ] Stornieren funktioniert
- [ ] Grund wird gespeichert

**Story Points:** 2"

echo "Created Story 3.4"

# Epic 4: Disposition

gh api repos/$REPO/issues -X POST -f title="Story 4.1: Fahrer zuweisen mit Verfügbarkeits-Check" -F milestone=1 \
  -f labels[]="P1: Important" -f labels[]="Epic: Disposition" \
  -f body="**Als** Dispatcher
**möchte ich** beim Zuweisen eines Fahrers sehen, ob er verfügbar ist
**damit** ich informierte Entscheidungen treffe

## Acceptance Criteria
- [ ] Im Fahrt-Formular: Dropdown \"Fahrer zuweisen\"
- [ ] Dropdown zeigt alle Fahrer mit Verfügbarkeits-Indikator
- [ ] **Grün**: Fahrer verfügbar (Availability Block + keine Abwesenheit + keine überlappende Fahrt)
- [ ] **Gelb**: Fahrer verfügbar, aber andere Fahrt zur ähnlichen Zeit (Warnung)
- [ ] **Grau**: Fahrer nicht verfügbar (Abwesenheit oder kein Availability Block)
- [ ] Hover über Indikator → Tooltip erklärt Status
- [ ] Dispatcher kann trotzdem jeden Fahrer zuweisen (auch graue)

## Technische Umsetzung
- Server Action: \`getAvailableDrivers(pickup_time)\` in \`/lib/actions/drivers-v2.ts\`
- Logik: Prüfe availability_blocks, absences, überlappende rides
- Component: \`DriverDropdown\` mit farblichen Badges

## Definition of Done
- [ ] Dropdown zeigt Verfügbarkeit farblich
- [ ] Tooltip funktioniert
- [ ] Logik korrekt implementiert

**Story Points:** 5"

echo "Created Story 4.1"

gh api repos/$REPO/issues -X POST -f title="Story 4.2: Fahrer-Zuweisung entfernen" -F milestone=1 \
  -f labels[]="P2: Nice-to-have" -f labels[]="Epic: Disposition" \
  -f body="**Als** Dispatcher
**möchte ich** einen Fahrer von einer Fahrt entfernen
**damit** ich ihn neu zuweisen kann

## Acceptance Criteria
- [ ] In Fahrt-Detail oder Fahrt-Bearbeiten: Button \"Fahrer entfernen\"
- [ ] Click → \`driver_id = NULL\`, Status bleibt unverändert
- [ ] Fahrt erscheint in Liste als \"Nicht zugewiesen\"

## Definition of Done
- [ ] Entfernen funktioniert

**Story Points:** 1"

echo "Created Story 4.2"

# Epic 5: Kalender

gh api repos/$REPO/issues -X POST -f title="Story 5.1: Wochen-Kalender mit Fahrten" -F milestone=1 \
  -f labels[]="P1: Important" -f labels[]="Epic: Kalender" \
  -f body="**Als** Dispatcher
**möchte ich** alle Fahrten der Woche im Kalender sehen
**damit** ich visuell planen kann

## Acceptance Criteria
- [ ] Route \`/dashboard\` oder \`/calendar\` zeigt Kalender
- [ ] Ansicht: 7 Tage (Mo-So), Zeitachse 08:00-18:00
- [ ] Jede Fahrt als Card: Patient-Name, Abholzeit-Ankunftszeit, Fahrer, Status-Badge
- [ ] Farbe nach Status: grau, blau, gelb, grün, rot
- [ ] Click auf Card → \`/rides/[id]\` (Detail)
- [ ] Navigation: \"Vorherige Woche\", \"Diese Woche\", \"Nächste Woche\"
- [ ] Highlight: Heutiger Tag markiert

## Technische Umsetzung
- Component: \`CalendarView\` in \`/src/components/calendar/CalendarView.tsx\`
- Server Action: \`getRides({ from_date, to_date })\`
- Kalender-Library: FullCalendar.js ODER custom Grid

## Edge Cases
- Überlappende Fahrten → Stacked Cards oder Warnung
- Keine Fahrten in Woche → \"Keine Fahrten geplant\"

## Definition of Done
- [ ] Kalender zeigt Fahrten
- [ ] Navigation funktioniert
- [ ] Performance: <2s Load bei 100 Fahrten/Woche

**Story Points:** 8"

echo "Created Story 5.1"

echo ""
echo "✅ Sprint 1 Issues created successfully!"
echo ""
echo "Summary:"
echo "- Total Issues: 15"
echo "- P0 (Blocker): 10"
echo "- P1 (Important): 4"
echo "- P2 (Nice-to-have): 1"
echo ""
echo "View issues: gh issue list --milestone 'Sprint 1: Foundation & Dispatcher Core'"
