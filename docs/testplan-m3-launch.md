# Testplan M3 Launch – Fahrdienst Applikation

**Version**: 1.0
**Datum**: 2026-02-03
**Milestone**: M3 – Production Launch
**Verantwortlich**: QA / Product Owner
**Sprache**: Deutsch

---

## Inhaltsverzeichnis

1. [Vorbedingungen](#1-vorbedingungen)
2. [Authentifizierung & Rollen](#2-authentifizierung--rollen)
3. [Stammdaten CRUD](#3-stammdaten-crud)
4. [Fahrten-Management](#4-fahrten-management)
5. [Fahrer-Workflow](#5-fahrer-workflow)
6. [Verfügbarkeit & Abwesenheiten](#6-verfügbarkeit--abwesenheiten)
7. [Dashboard & Realtime](#7-dashboard--realtime)
8. [SMS-Benachrichtigungen](#8-sms-benachrichtigungen)
9. [Security](#9-security)
10. [Edge Cases & Fehlerbehandlung](#10-edge-cases--fehlerbehandlung)

---

## 1. Vorbedingungen

### Test-Accounts

| Rolle | E-Mail | Passwort | Beschreibung |
|-------|--------|----------|-------------|
| Admin/Dispatcher | `dispatcher@test.ch` | `Test1234!` | Vollzugriff auf alle Dispatcher-Features |
| Operator | `operator@test.ch` | `Test1234!` | Gleiche Rechte wie Dispatcher |
| Fahrer 1 | `fahrer1@test.ch` | `Test1234!` | Hat zugewiesene Fahrten, Verfügbarkeit Mo-Fr 08-18 |
| Fahrer 2 | `fahrer2@test.ch` | `Test1234!` | Hat eigene Fahrten, abweichende Verfügbarkeit |

### Testdaten vorbereiten

- [ ] Mindestens 3 Patienten angelegt (mit gültigen Adressen und Koordinaten)
- [ ] Mindestens 2 Fahrer angelegt (mit Verfügbarkeitsblöcken und Abwesenheiten)
- [ ] Mindestens 3 Destinationen angelegt (z.B. Kantonsspital Aarau, Universitätsspital Zürich, Hausarzt Aarau)
- [ ] Mindestens 5 Fahrten in verschiedenen Status: `planned`, `confirmed`, `in_progress`, `completed`, `cancelled`
- [ ] Fahrer 1 hat mindestens 2 zugewiesene Fahrten (1× heute, 1× morgen)
- [ ] Fahrer 2 hat mindestens 1 zugewiesene Fahrt
- [ ] Fahrer 2 hat eine Abwesenheit für übermorgen eingetragen

### Test-Umgebung

| Umgebung | URL | Zweck |
|----------|-----|-------|
| Development | `http://localhost:3000` | Lokale Tests |
| Staging | `https://fahrdienst-staging.vercel.app` | Pre-Production |
| Production | `https://fahrdienst.vercel.app` | Go-Live-Check |

---

## 2. Authentifizierung & Rollen

### T-AUTH-01: Login als Dispatcher (Happy Path)

**Beschreibung**: Dispatcher kann sich erfolgreich anmelden und wird zum Dashboard weitergeleitet.

**Schritte**:
1. Öffne `/login`
2. E-Mail eingeben: `dispatcher@test.ch`
3. Passwort eingeben: `Test1234!`
4. Auf "Anmelden" klicken

**Erwartetes Ergebnis**:
- Redirect zu `/dashboard`
- Dashboard wird korrekt angezeigt (Statistik-Cards, Kalender, Fahrerliste)
- Logout-Button sichtbar im Header/Menü
- Navigation zeigt Dispatcher-Menüpunkte (Fahrten, Patienten, Fahrer, Ziele)

- [ ] Bestanden

---

### T-AUTH-02: Login als Fahrer (Happy Path)

**Beschreibung**: Fahrer kann sich anmelden und sieht nur die Fahrer-Ansicht.

**Schritte**:
1. Öffne `/login`
2. E-Mail eingeben: `fahrer1@test.ch`
3. Passwort eingeben: `Test1234!`
4. Auf "Anmelden" klicken

**Erwartetes Ergebnis**:
- Redirect zu Fahrer-Übersicht ("Meine Fahrten")
- Begrüssung: "Hallo [Fahrer-Name]" mit Zusammenfassung
- Keine Dispatcher-Menüpunkte sichtbar (kein Zugriff auf Patienten, Fahrer-Verwaltung, Ziele)
- Navigation zeigt nur: Meine Fahrten, Meine Verfügbarkeit

- [ ] Bestanden

---

### T-AUTH-03: Login mit falschen Credentials

**Beschreibung**: Fehlerbehandlung bei ungültigen Anmeldedaten.

**Schritte**:
1. Öffne `/login`
2. E-Mail eingeben: `dispatcher@test.ch`
3. Passwort eingeben: `wrongpassword`
4. Auf "Anmelden" klicken

**Erwartetes Ergebnis**:
- Fehlermeldung wird angezeigt (z.B. "Ungültige Anmeldedaten")
- Benutzer bleibt auf `/login`
- E-Mail-Feld bleibt gefüllt

- [ ] Bestanden

---

### T-AUTH-04: Logout und Zugriffskontrolle

**Beschreibung**: Nach Logout kann keine geschützte Seite mehr aufgerufen werden.

**Schritte**:
1. Als Dispatcher einloggen
2. Auf "Logout" klicken
3. Versuche, direkt `/dashboard` aufzurufen

**Erwartetes Ergebnis**:
- Nach Logout: Redirect zu `/login`
- Zugriff auf `/dashboard` ohne Session: Redirect zu `/login`
- Session-Cookie wurde entfernt

- [ ] Bestanden

---

## 3. Stammdaten CRUD

### Patienten

#### T-PAT-01: Patient anlegen

**Beschreibung**: Dispatcher legt einen neuen Patienten mit Adress-Autocomplete an.

**Schritte**:
1. Login als Dispatcher
2. Navigation → "Patienten" → "Neu"
3. Formular ausfüllen:
   - Name: "Max Mustermann"
   - Adresse: "Bahnhofstrasse 1, Zürich" eingeben → Autocomplete-Vorschlag wählen
   - Telefon: "+41 79 123 45 67"
   - Besondere Bedürfnisse: "Rollstuhl" auswählen
   - Notizen: "Benötigt Hilfe beim Einsteigen"
4. Auf "Speichern" klicken

**Erwartetes Ergebnis**:
- Erfolgsmeldung (Toast: "Patient erfolgreich angelegt")
- Redirect zu Patienten-Liste
- Patient erscheint in der Liste
- In DB: `formatted_address`, `latitude`, `longitude` korrekt gespeichert
- In DB: `is_active = true`

- [ ] Bestanden

---

#### T-PAT-02: Patient bearbeiten

**Beschreibung**: Bestehenden Patienten bearbeiten.

**Schritte**:
1. Patienten-Liste öffnen
2. Auf "Max Mustermann" klicken → Detail/Bearbeiten
3. Telefon ändern auf "+41 79 999 99 99"
4. Notizen ändern auf "Neuer Hinweis"
5. Auf "Speichern" klicken

**Erwartetes Ergebnis**:
- Erfolgsmeldung
- Änderungen in der Liste sichtbar
- DB enthält aktualisierte Werte

- [ ] Bestanden

---

#### T-PAT-03: Patient löschen (Soft Delete)

**Beschreibung**: Patient ohne aktive Fahrten kann gelöscht werden (Soft Delete).

**Schritte**:
1. Patient ohne zugewiesene Fahrten auswählen
2. Auf "Löschen" klicken
3. Bestätigungsdialog bestätigen

**Erwartetes Ergebnis**:
- Patient verschwindet aus der aktiven Liste
- In DB: `is_active = false` (nicht physisch gelöscht)
- Patient erscheint nicht mehr in Dropdowns bei Fahrt-Erstellung

- [ ] Bestanden

---

#### T-PAT-04: Patienten durchsuchen

**Beschreibung**: Patienten-Suche funktioniert korrekt.

**Schritte**:
1. Patienten-Liste öffnen
2. Im Suchfeld "Muster" eingeben

**Erwartetes Ergebnis**:
- Liste filtert auf Patienten mit "Muster" im Namen
- Ergebnisse werden live aktualisiert
- Bei leerer Suche: Alle aktiven Patienten angezeigt

- [ ] Bestanden

---

### Fahrer

#### T-DRV-01: Fahrer anlegen

**Beschreibung**: Dispatcher legt einen neuen Fahrer an.

**Schritte**:
1. Navigation → "Fahrer" → "Neu"
2. Formular ausfüllen:
   - Name: "Hans Müller"
   - E-Mail: "hans.mueller@test.ch"
   - Telefon: "+41 79 111 22 33"
3. Auf "Speichern" klicken

**Erwartetes Ergebnis**:
- Erfolgsmeldung
- Fahrer erscheint in der Fahrer-Liste
- Fahrer erscheint im Fahrer-Dropdown bei Fahrt-Erstellung

- [ ] Bestanden

---

#### T-DRV-02: Fahrer bearbeiten

**Beschreibung**: Fahrer-Daten aktualisieren.

**Schritte**:
1. Fahrer-Liste öffnen
2. "Hans Müller" auswählen → Bearbeiten
3. Telefon ändern auf "+41 79 444 55 66"
4. Auf "Speichern" klicken

**Erwartetes Ergebnis**:
- Erfolgsmeldung
- Aktualisierte Daten in der Liste sichtbar

- [ ] Bestanden

---

#### T-DRV-03: Fahrer löschen (Soft Delete)

**Beschreibung**: Fahrer ohne aktive Fahrten kann gelöscht werden.

**Schritte**:
1. Fahrer ohne zugewiesene Fahrten auswählen
2. Auf "Löschen" klicken
3. Bestätigungsdialog bestätigen

**Erwartetes Ergebnis**:
- Fahrer verschwindet aus der aktiven Liste
- In DB: `is_active = false`
- Fahrer erscheint nicht mehr in Fahrer-Dropdowns

- [ ] Bestanden

---

#### T-DRV-04: Fahrer durchsuchen

**Beschreibung**: Fahrer-Suche funktioniert korrekt.

**Schritte**:
1. Fahrer-Liste öffnen
2. Im Suchfeld "Müller" eingeben

**Erwartetes Ergebnis**:
- Liste filtert auf Fahrer mit "Müller" im Namen
- Ergebnisse werden live aktualisiert

- [ ] Bestanden

---

### Destinationen

#### T-DST-01: Destination anlegen

**Beschreibung**: Dispatcher legt ein neues Ziel mit Adress-Autocomplete an.

**Schritte**:
1. Navigation → "Ziele" → "Neu"
2. Formular ausfüllen:
   - Name: "Kantonsspital Aarau"
   - Adresse: "Tellstrasse 15, Aarau" → Autocomplete-Vorschlag wählen
   - Ankunftsfenster von: "08:00"
   - Ankunftsfenster bis: "09:00"
3. Auf "Speichern" klicken

**Erwartetes Ergebnis**:
- Erfolgsmeldung
- Destination erscheint in der Liste
- Koordinaten korrekt gespeichert
- Destination erscheint im Dropdown bei Fahrt-Erstellung

- [ ] Bestanden

---

#### T-DST-02: Destination bearbeiten

**Beschreibung**: Bestehende Destination aktualisieren.

**Schritte**:
1. Destinationen-Liste öffnen
2. "Kantonsspital Aarau" auswählen → Bearbeiten
3. Ankunftsfenster ändern: "07:30" bis "08:30"
4. Auf "Speichern" klicken

**Erwartetes Ergebnis**:
- Erfolgsmeldung
- Aktualisierte Daten sichtbar

- [ ] Bestanden

---

#### T-DST-03: Destination löschen (Soft Delete)

**Beschreibung**: Destination ohne aktive Fahrten kann gelöscht werden.

**Schritte**:
1. Destination ohne zugewiesene Fahrten auswählen
2. Auf "Löschen" klicken
3. Bestätigungsdialog bestätigen

**Erwartetes Ergebnis**:
- Destination verschwindet aus der aktiven Liste
- In DB: `is_active = false`

- [ ] Bestanden

---

#### T-DST-04: Destinationen durchsuchen

**Beschreibung**: Destinationen-Suche funktioniert korrekt.

**Schritte**:
1. Destinationen-Liste öffnen
2. Im Suchfeld "Kanton" eingeben

**Erwartetes Ergebnis**:
- Liste filtert auf Destinationen mit "Kanton" im Namen

- [ ] Bestanden

---

## 4. Fahrten-Management

### T-RIDE-01: Fahrt anlegen mit Routenberechnung

**Beschreibung**: Dispatcher legt eine Fahrt an, Route wird automatisch berechnet.

**Vorbedingungen**: Patient und Destination mit gültigen Koordinaten existieren.

**Schritte**:
1. Navigation → "Fahrten" → "Neue Fahrt" (oder Dashboard → "Neue Fahrt")
2. Formular ausfüllen:
   - Patient: "Max Mustermann" (Dropdown)
   - Destination: "Kantonsspital Aarau" (Dropdown)
   - Abholzeit: Morgen 09:00
3. Warten, bis Route berechnet wird (1-2 Sekunden)
4. Prüfen: "Geschätzte Dauer" und "Distanz" sind befüllt
5. Auf "Fahrt erstellen" klicken

**Erwartetes Ergebnis**:
- Ankunftszeit automatisch berechnet (Abholzeit + Dauer + 5 Min Puffer)
- Fahrt gespeichert mit Status `planned`
- Redirect zur Fahrtenliste
- In DB: `estimated_duration` und `estimated_distance` gespeichert
- Fahrt erscheint im Kalender

- [ ] Bestanden

---

### T-RIDE-02: Fahrt mit Rückfahrt

**Beschreibung**: Rückfahrt wird als separate Fahrt gespeichert.

**Schritte**:
1. Neue Fahrt anlegen (wie T-RIDE-01)
2. Checkbox "Rückfahrt" aktivieren
3. Rückfahrtzeit eingeben: Morgen 12:00
4. Auf "Fahrt erstellen" klicken

**Erwartetes Ergebnis**:
- 2 Fahrten in DB:
  - Fahrt 1: Patient → Kantonsspital (09:00)
  - Fahrt 2: Kantonsspital → Patient (12:00)
- Beide haben denselben `recurrence_group` (UUID)
- Beide erscheinen in der Fahrtenliste und im Kalender

- [ ] Bestanden

---

### T-RIDE-03: Fahrt bearbeiten

**Beschreibung**: Dispatcher kann eine geplante Fahrt bearbeiten.

**Schritte**:
1. Fahrt in Status `planned` öffnen
2. Auf "Bearbeiten" klicken
3. Abholzeit ändern auf 10:00
4. Notizen hinzufügen: "Bitte 5 Min früher da sein"
5. Auf "Speichern" klicken

**Erwartetes Ergebnis**:
- Fahrt mit neuer Abholzeit gespeichert
- Notizen sichtbar in Fahrt-Detail
- Route wird ggf. neu berechnet

- [ ] Bestanden

---

### T-RIDE-04: Fahrt stornieren

**Beschreibung**: Dispatcher kann eine Fahrt stornieren.

**Schritte**:
1. Fahrt in Status `planned` oder `confirmed` öffnen
2. Auf "Stornieren" klicken
3. Bestätigungsdialog: Grund eingeben "Patient hat abgesagt"
4. Auf "Bestätigen" klicken

**Erwartetes Ergebnis**:
- Status → `cancelled`
- `cancelled_at` Timestamp gespeichert
- Fahrt erscheint mit rotem Badge "Storniert" in der Liste
- Fahrt kann nicht mehr bearbeitet werden (ausser Notizen)

- [ ] Bestanden

---

### T-RIDE-05: Fahrer zuweisen

**Beschreibung**: Dispatcher weist einer Fahrt einen Fahrer zu.

**Schritte**:
1. Fahrt ohne Fahrer öffnen → "Bearbeiten"
2. Im Fahrer-Dropdown einen Fahrer auswählen
3. Auf "Speichern" klicken

**Erwartetes Ergebnis**:
- Fahrt hat zugewiesenen Fahrer
- Fahrer sieht Fahrt nach Login in seiner Liste
- In DB: `driver_id` gesetzt

- [ ] Bestanden

---

### T-RIDE-06: Fahrer entfernen

**Beschreibung**: Dispatcher entfernt einen zugewiesenen Fahrer von einer Fahrt.

**Schritte**:
1. Fahrt mit zugewiesenem Fahrer öffnen → "Bearbeiten"
2. Fahrer-Dropdown auf "Nicht zugewiesen" setzen / "Fahrer entfernen" klicken
3. Auf "Speichern" klicken

**Erwartetes Ergebnis**:
- `driver_id = NULL`
- Status zurück auf `planned`
- Fahrt erscheint wieder unter "Braucht Zuweisung" im Dashboard

- [ ] Bestanden

---

### T-RIDE-07: Verfügbarkeits-Check (Grün/Gelb/Grau)

**Beschreibung**: Fahrer-Dropdown zeigt Verfügbarkeit visuell an.

**Vorbedingungen**:
- Fahrer 1: Availability Block Mo-Fr 08-10 Uhr, keine Abwesenheit
- Fahrer 2: Abwesenheit am gewählten Datum
- Fahrer 3: Kein Availability Block für den Zeitraum

**Schritte**:
1. Neue Fahrt anlegen, Abholzeit = Morgen 09:00 (Werktag)
2. Fahrer-Dropdown öffnen

**Erwartetes Ergebnis**:
- Fahrer 1: **Grün** markiert (verfügbar)
- Fahrer 2: **Grau** markiert (abwesend)
- Fahrer 3: **Grau** markiert (keine Verfügbarkeit)
- Falls ein Fahrer bereits eine Fahrt zur ähnlichen Zeit hat: **Gelb** markiert (Warnung)
- Alle Fahrer können trotzdem ausgewählt werden (kein Blocker)

- [ ] Bestanden

---

### T-RIDE-08: Fahrtenliste und Filter

**Beschreibung**: Fahrtenliste zeigt alle Fahrten mit funktionierenden Filtern.

**Schritte**:
1. Navigation → "Fahrten"
2. Filter setzen:
   - Datum: Heute
   - Status: "Geplant"
3. Ergebnisse prüfen
4. Filter ändern:
   - Fahrer: "Nicht zugewiesen"
5. Ergebnisse prüfen
6. Suche: Patientenname eingeben

**Erwartetes Ergebnis**:
- Fahrtenliste zeigt korrekt gefilterte Ergebnisse
- Tabellenspalten sichtbar: Zeit, Patient, Von, Nach, Fahrer, Status
- Status-Badges farblich korrekt (Geplant=grau, Bestätigt=blau, Unterwegs=orange, Abgeschlossen=grün, Storniert=rot)
- Klick auf Fahrt → Detail-Seite

- [ ] Bestanden

---

### T-RIDE-09: Kalender Tages-/Wochen-/Monatsansicht

**Beschreibung**: Kalender zeigt Fahrten korrekt in allen Ansichten.

**Schritte**:
1. Dashboard oder Kalender öffnen
2. Wochen-Ansicht prüfen: Fahrten der aktuellen Woche sichtbar
3. Zu Tages-Ansicht wechseln: Nur Fahrten des aktuellen Tages
4. Zu Monats-Ansicht wechseln: Alle Fahrten des Monats
5. Navigation: "Nächste Woche" → "Vorherige Woche" → "Heute"

**Erwartetes Ergebnis**:
- Fahrten als Cards im Kalender: Patient, Zeit, Fahrer, Status-Badge
- Heutiger Tag hervorgehoben
- Navigation zwischen Zeiträumen funktioniert
- Klick auf Fahrt-Card → Redirect zu Fahrt-Detail

- [ ] Bestanden

---

### T-RIDE-10: Kalender-Navigation und Heute-Button

**Beschreibung**: Kalender-Navigation funktioniert korrekt.

**Schritte**:
1. Kalender öffnen (Wochen-Ansicht)
2. Auf "Nächste Woche" klicken (2×)
3. Prüfen: Korrekte Woche angezeigt
4. Auf "Heute" klicken

**Erwartetes Ergebnis**:
- Navigation aktualisiert den angezeigten Zeitraum
- "Heute"-Button springt zurück zur aktuellen Woche
- Fahrten der jeweiligen Woche werden geladen

- [ ] Bestanden

---

## 5. Fahrer-Workflow

### T-FW-01: Meine Fahrten sehen

**Beschreibung**: Fahrer sieht nach Login nur seine zugewiesenen Fahrten.

**Vorbedingungen**: Fahrer 1 hat 2 Fahrten (1× heute, 1× morgen). Fahrer 2 hat 1 Fahrt.

**Schritte**:
1. Login als Fahrer 1
2. "Meine Fahrten" öffnen

**Erwartetes Ergebnis**:
- Begrüssung: "Hallo [Name]" + Zusammenfassung (z.B. "Du hast 1 Fahrt für heute")
- Nächste Fahrt als Hero-Card hervorgehoben
- Nur eigene Fahrten sichtbar (keine Fahrten von Fahrer 2)
- Fahrten gruppiert nach: Heute, Morgen, Kommend
- Sortierung nach Uhrzeit

- [ ] Bestanden

---

### T-FW-02: Fahrt bestätigen

**Beschreibung**: Fahrer bestätigt eine zugewiesene Fahrt.

**Schritte**:
1. Login als Fahrer
2. Fahrt in Status `planned` finden (unter "Ausstehende Bestätigungen")
3. Auf "Bestätigen" klicken

**Erwartetes Ergebnis**:
- Status → `confirmed`
- Status-Badge ändert sich (blau)
- Fahrt bleibt in der Liste
- Dispatcher sieht Status-Änderung in Echtzeit

- [ ] Bestanden

---

### T-FW-03: Fahrt ablehnen

**Beschreibung**: Fahrer lehnt eine zugewiesene Fahrt ab.

**Schritte**:
1. Login als Fahrer
2. Fahrt in Status `planned` finden
3. Auf "Ablehnen" klicken
4. Modal: Grund eingeben "Terminkollision"
5. Auf "Ablehnen bestätigen" klicken

**Erwartetes Ergebnis**:
- `driver_id = NULL` (Fahrt nicht mehr zugewiesen)
- Ablehnungsgrund in `notes` gespeichert
- Fahrt verschwindet aus Fahrer-Liste
- Dispatcher sieht Fahrt wieder als "Nicht zugewiesen" mit Ablehnungsgrund

- [ ] Bestanden

---

### T-FW-04: 6-Schritt Fahrt-Durchführung

**Beschreibung**: Fahrer durchläuft den vollständigen Fahrt-Workflow (6 Schritte).

**Vorbedingung**: Fahrt in Status `confirmed` für heute.

**Schritte**:
1. Login als Fahrer
2. Fahrt öffnen
3. **Schritt 1**: "Fahrt starten" klicken → Status `in_progress`, Substatus `en_route_pickup`
4. **Schritt 2**: "Bei Patient angekommen" klicken → Substatus `at_pickup`
5. **Schritt 3**: "Patient abgeholt" klicken → Substatus `en_route_destination`
6. **Schritt 4**: "Am Ziel angekommen" klicken → Substatus `at_destination`
7. **Schritt 5**: "Fahrt abschliessen" klicken
8. **Schritt 6**: Optional Notiz eingeben → "Bestätigen"

**Erwartetes Ergebnis**:
- Nach Schritt 1: Status `in_progress`, `started_at` gespeichert
- Nach Schritt 3: `picked_up_at` gespeichert
- Nach Schritt 4: `arrived_at` gespeichert
- Nach Schritt 6: Status `completed`, `completed_at` gespeichert
- Fahrt verschwindet aus "Heute" und erscheint in "Abgeschlossene Fahrten"
- Dispatcher sieht Status-Änderungen in Echtzeit

- [ ] Bestanden

---

### T-FW-05: Timestamps chronologisch korrekt

**Beschreibung**: Alle Timestamps werden in der richtigen Reihenfolge gespeichert.

**Schritte**:
1. Nach T-FW-04: Fahrt-Detail in der DB prüfen

**Erwartetes Ergebnis**:
- `started_at < picked_up_at < arrived_at < completed_at`
- Alle Timestamps haben korrekte Zeitzone

- [ ] Bestanden

---

### T-FW-06: Schnell-Abschluss (Quick Complete)

**Beschreibung**: Fahrer kann eine Fahrt ohne alle Zwischenschritte direkt abschliessen.

**Schritte**:
1. Fahrt in Status `confirmed` oder `in_progress`
2. "Schnell abschliessen" klicken (falls verfügbar)

**Erwartetes Ergebnis**:
- Status → `completed`
- Fehlende Timestamps werden mit aktuellem Zeitpunkt gefüllt
- `completed_at` gespeichert

- [ ] Bestanden

---

### T-FW-07: Fahrt-Detail mit Karte

**Beschreibung**: Fahrer sieht Fahrt-Detail mit Route-Karte.

**Schritte**:
1. Login als Fahrer
2. Fahrt aus der Liste öffnen

**Erwartetes Ergebnis**:
- Patient-Name, Adresse, Telefon sichtbar
- Zielort-Name, Adresse sichtbar
- Besondere Bedürfnisse angezeigt (z.B. Rollstuhl-Icon)
- Google Maps Karte mit Route (Patient → Destination)
- Dauer und Distanz angezeigt
- Navigations-Link zu Google Maps

- [ ] Bestanden

---

### T-FW-08: Rückfahrt erscheint nach Abschluss

**Beschreibung**: Nach Abschluss der Hinfahrt erscheint die Rückfahrt in der Liste.

**Vorbedingungen**: Fahrt mit Rückfahrt (gleicher `recurrence_group`).

**Schritte**:
1. Hinfahrt abschliessen (wie T-FW-04)
2. Fahrten-Liste prüfen

**Erwartetes Ergebnis**:
- Rückfahrt sichtbar in der Liste mit eigenem Status
- Rückfahrt kann separat bestätigt und durchgeführt werden

- [ ] Bestanden

---

## 6. Verfügbarkeit & Abwesenheiten

### T-AVAIL-01: AvailabilityGrid – Dispatcher readonly

**Beschreibung**: Dispatcher sieht Verfügbarkeit eines Fahrers als readonly.

**Schritte**:
1. Login als Dispatcher
2. Navigation → "Fahrer" → Fahrer auswählen → "Verfügbarkeit"-Tab

**Erwartetes Ergebnis**:
- AvailabilityGrid (5×5: Mo-Fr, 08-18 Uhr in 2h-Blöcken) angezeigt
- Grüne Blöcke = verfügbar, graue Blöcke = nicht verfügbar
- Grid ist **readonly** (Klick auf Block ändert nichts)
- Liste der zukünftigen Abwesenheiten angezeigt

- [ ] Bestanden

---

### T-AVAIL-02: AvailabilityGrid – Fahrer editierbar

**Beschreibung**: Fahrer kann eigene Verfügbarkeit per Klick ändern.

**Schritte**:
1. Login als Fahrer
2. Navigation → "Meine Verfügbarkeit"
3. Auf grauen Block "Mo 08:00-10:00" klicken → wird grün
4. Auf grünen Block "Di 14:00-16:00" klicken → wird grau

**Erwartetes Ergebnis**:
- Blöcke ändern Farbe sofort (Optimistic UI)
- DB wird aktualisiert: `availability_blocks` Einträge erstellt/gelöscht
- Dispatcher sieht Änderungen (readonly-Ansicht aktualisiert)
- Änderung wird automatisch gespeichert (kein Speichern-Button nötig)

- [ ] Bestanden

---

### T-AVAIL-03: Abwesenheit anlegen

**Beschreibung**: Fahrer erfasst eine neue Abwesenheit.

**Schritte**:
1. Login als Fahrer
2. "Meine Verfügbarkeit" → Abschnitt "Abwesenheiten"
3. "Neue Abwesenheit" klicken
4. Von: 2026-03-01, Bis: 2026-03-07, Grund: "Urlaub"
5. "Speichern" klicken

**Erwartetes Ergebnis**:
- Abwesenheit in der Liste sichtbar
- Dispatcher sieht Abwesenheit
- Bei Fahrer-Zuweisung in diesem Zeitraum: Fahrer wird grau markiert

- [ ] Bestanden

---

### T-AVAIL-04: Abwesenheit bearbeiten und löschen

**Beschreibung**: Fahrer kann bestehende Abwesenheit ändern oder entfernen.

**Schritte**:
1. Abwesenheit aus T-AVAIL-03 auswählen
2. "Bearbeiten" → Bis-Datum ändern auf 2026-03-10 → "Speichern"
3. Abwesenheit erneut auswählen → "Löschen" → Bestätigen

**Erwartetes Ergebnis**:
- Nach Bearbeiten: Neues Bis-Datum korrekt gespeichert
- Nach Löschen: Abwesenheit aus der Liste entfernt
- Validierung: Von-Datum ≤ Bis-Datum

- [ ] Bestanden

---

## 7. Dashboard & Realtime

### T-DASH-01: Statistik-Cards

**Beschreibung**: Dashboard zeigt korrekte Schnellstatistiken.

**Schritte**:
1. Login als Dispatcher
2. Dashboard öffnen

**Erwartetes Ergebnis**:
- Card "Nicht zugewiesen": Korrekte Anzahl Fahrten ohne Fahrer
- Card "Aktiv": Korrekte Anzahl Fahrten in Status `in_progress`
- Card "Fahrer": Korrekte Anzahl verfügbarer Fahrer (z.B. "3/5")
- Klick auf "Nicht zugewiesen" → Zeigt Liste oder navigiert zu gefilterter Ansicht

- [ ] Bestanden

---

### T-DASH-02: Zeitstrahl Heute

**Beschreibung**: Zeitstrahl zeigt Fahrten über den Tag korrekt an.

**Schritte**:
1. Dashboard öffnen
2. Zeitstrahl (08:00-18:00) prüfen

**Erwartetes Ergebnis**:
- Fahrten als farbige Punkte auf dem Zeitstrahl:
  - Orange: Aktive Fahrten (in_progress)
  - Hellblau: Nicht zugewiesen
  - Blau: Zugewiesen/Bestätigt
  - Grün: Abgeschlossen
- Senkrechte Linie zeigt aktuelle Uhrzeit
- Korrekte Positionierung der Fahrten auf der Zeitachse

- [ ] Bestanden

---

### T-DASH-03: Wochenübersicht

**Beschreibung**: Wochenübersicht zeigt Fahrtenzahlen pro Tag.

**Schritte**:
1. Dashboard öffnen
2. Wochenübersicht (rechte Spalte) prüfen

**Erwartetes Ergebnis**:
- Alle Wochentage (Mo-So) mit Fahrtenzahl
- Heutiger Tag hervorgehoben (blauer Hintergrund)
- Status-Punkte unter Zahlen (orange = aktiv, hellblau = nicht zugewiesen)
- Klick auf Tag → Fahrtenliste für diesen Tag

- [ ] Bestanden

---

### T-DASH-04: Realtime-Updates

**Beschreibung**: Dashboard aktualisiert sich in Echtzeit bei Statusänderungen.

**Schritte**:
1. Dashboard in Browser-Tab 1 offen (Dispatcher)
2. In Browser-Tab 2 als Fahrer einloggen
3. Fahrer bestätigt eine Fahrt (Tab 2)
4. Dashboard in Tab 1 prüfen (ohne manuelles Neuladen)

**Erwartetes Ergebnis**:
- Dashboard aktualisiert sich automatisch (Realtime via Supabase)
- Statistik-Cards zeigen aktualisierte Zahlen
- Live-Aktivitätsfeed zeigt die Statusänderung
- "Aktiv Unterwegs"-Section aktualisiert sich bei Fahrt-Start

- [ ] Bestanden

---

## 8. SMS-Benachrichtigungen

**Hinweis**: SMS-Tests erfordern `SMS_ENABLED=true` und konfigurierte Twilio-Credentials. Falls Twilio nicht konfiguriert, im Log prüfen, ob SMS-Versand korrekt getriggert wird.

### T-SMS-01: Fahrt bestätigt → Patient erhält SMS

**Beschreibung**: Patient wird per SMS informiert, wenn Fahrer die Fahrt bestätigt.

**Schritte**:
1. Fahrt mit Patient (Telefonnummer hinterlegt) und zugewiesenem Fahrer
2. Fahrer bestätigt Fahrt

**Erwartetes Ergebnis**:
- Patient erhält SMS: "Ihre Fahrt am [Datum] um [Uhrzeit] wurde bestätigt."
- SMS enthält Fahrer-Name oder relevante Infos
- Im Log: SMS-Versand protokolliert

- [ ] Bestanden

---

### T-SMS-02: Fahrt gestartet → Patient erhält SMS

**Beschreibung**: Patient wird per SMS informiert, wenn Fahrer die Fahrt startet.

**Schritte**:
1. Fahrt in Status `confirmed`
2. Fahrer klickt "Fahrt starten"

**Erwartetes Ergebnis**:
- Patient erhält SMS: "Ihr Fahrer ist unterwegs – Ankunft ca. [Zeit]"
- ETA basiert auf Routenberechnung

- [ ] Bestanden

---

### T-SMS-03: Fahrer angekommen → Patient erhält SMS

**Beschreibung**: Patient wird informiert, wenn Fahrer am Abholort angekommen ist.

**Schritte**:
1. Fahrt in Status `in_progress`
2. Fahrer klickt "Bei Patient angekommen"

**Erwartetes Ergebnis**:
- Patient erhält SMS: "Ihr Fahrer ist da."

- [ ] Bestanden

---

### T-SMS-04: Patient abgeholt → Destination erhält SMS

**Beschreibung**: Destination wird per SMS informiert, wenn Patient unterwegs ist.

**Schritte**:
1. Fahrer klickt "Patient abgeholt"

**Erwartetes Ergebnis**:
- Destination erhält SMS (falls Telefonnummer hinterlegt): "Patient [Name] ist unterwegs – Ankunft ca. [Zeit]"
- ETA basiert auf Routenberechnung

- [ ] Bestanden

---

### T-SMS-05: Fahrt abgeschlossen → Patient erhält SMS

**Beschreibung**: Patient wird per SMS informiert, dass die Fahrt abgeschlossen ist.

**Schritte**:
1. Fahrer schliesst Fahrt ab

**Erwartetes Ergebnis**:
- Patient erhält SMS: "Ihre Fahrt wurde abgeschlossen. Danke für Ihr Vertrauen."

- [ ] Bestanden

---

## 9. Security

### T-SEC-01: RLS – Fahrer sieht nur eigene Fahrten

**Beschreibung**: Row Level Security verhindert, dass Fahrer fremde Fahrten sehen.

**Vorbedingungen**: Fahrer 1 hat Fahrt A, Fahrer 2 hat Fahrt B.

**Schritte**:
1. Login als Fahrer 1
2. Fahrten-Liste prüfen
3. Direkte URL zur Fahrt von Fahrer 2 aufrufen: `/rides/[id_fahrt_b]`

**Erwartetes Ergebnis**:
- Liste zeigt nur Fahrt A (eigene)
- Fahrt B nicht sichtbar
- Direkter URL-Zugriff auf Fahrt B → 403 Forbidden oder Redirect

- [ ] Bestanden

---

### T-SEC-02: IDOR – Fahrer kann keine fremden Fahrten ändern

**Beschreibung**: Server Actions leiten Driver-ID aus der Session ab, nicht aus Client-Parametern.

**Schritte**:
1. Login als Fahrer 1
2. Via Browser DevTools oder API-Call versuchen:
   - `driverConfirmRide(id_fahrt_von_fahrer_2)` aufrufen
   - `driverStartRide(id_fahrt_von_fahrer_2)` aufrufen

**Erwartetes Ergebnis**:
- API-Call schlägt fehl (Fehler: "Not authorized" oder ähnlich)
- Fahrt von Fahrer 2 bleibt unverändert
- Session-basierte Driver-ID-Ableitung verhindert IDOR

- [ ] Bestanden

---

### T-SEC-03: Input Validation – SQL Injection

**Beschreibung**: SQL Injection wird durch parameterisierte Queries und Zod-Validierung verhindert.

**Schritte**:
1. Patient anlegen mit Name: `'; DROP TABLE patients; --`
2. Suche nach: `%' OR 1=1; --`
3. Patienten-Liste prüfen

**Erwartetes Ergebnis**:
- Patient wird mit dem Literal-String als Name gespeichert
- Tabelle `patients` existiert weiterhin
- Suchfunktion gibt kein unerwartetes Ergebnis (kein Full-Table-Dump)
- `sanitizeSearchQuery()` escaped %, _, \

- [ ] Bestanden

---

### T-SEC-04: Input Validation – XSS

**Beschreibung**: Cross-Site Scripting wird verhindert.

**Schritte**:
1. Patient anlegen mit Name: `<script>alert('XSS')</script>`
2. Patient anlegen mit Notizen: `<img src=x onerror=alert('XSS')>`
3. Patienten-Liste und Detail-Seite öffnen

**Erwartetes Ergebnis**:
- Kein JavaScript wird ausgeführt
- Eingaben werden als Text angezeigt (HTML-escaped)
- Kein Alert-Popup erscheint

- [ ] Bestanden

---

### T-SEC-05: Rate Limiting

**Beschreibung**: Rate Limiting verhindert übermässige Anfragen.

**Schritte**:
1. In schneller Folge 15× hintereinander `createPatient` aufrufen (z.B. via Script oder DevTools)

**Erwartetes Ergebnis**:
- Nach Erreichen des Rate-Limits (z.B. 10 creates/min): Fehlermeldung "Zu viele Anfragen"
- Weitere Requests werden abgelehnt bis Cooldown abgelaufen
- Bestehende Daten bleiben intakt

- [ ] Bestanden

---

### T-SEC-06: Admin Logs nur für Admins

**Beschreibung**: Nur Admins haben Zugriff auf Application Logs.

**Schritte**:
1. Login als Fahrer
2. Direkte URL aufrufen: `/admin/logs`

**Erwartetes Ergebnis**:
- Zugriff verweigert (Redirect oder 403)
- Log-Einträge sind nicht sichtbar

3. Login als Dispatcher/Admin
4. `/admin/logs` aufrufen

**Erwartetes Ergebnis**:
- Log-Einträge sichtbar
- Filter nach Level, Feature, Zeitraum funktioniert

- [ ] Bestanden

---

## 10. Edge Cases & Fehlerbehandlung

### T-EDGE-01: Ungültige Eingaben in Formularen

**Beschreibung**: Formular-Validierung verhindert ungültige Eingaben.

**Schritte**:
1. Patient anlegen ohne Pflichtfelder (Name leer, keine Adresse)
2. Fahrt anlegen ohne Patient und Destination
3. Abwesenheit anlegen mit Von-Datum nach Bis-Datum

**Erwartetes Ergebnis**:
- Validierungsfehler werden angezeigt (rote Hinweistexte unter Feldern)
- Formular wird nicht abgeschickt
- Keine fehlerhaften Einträge in DB

- [ ] Bestanden

---

### T-EDGE-02: Duplikate bei Fahrer-E-Mail

**Beschreibung**: Doppelte E-Mail-Adresse bei Fahrer wird abgefangen.

**Schritte**:
1. Fahrer anlegen mit E-Mail: "hans@test.ch"
2. Zweiten Fahrer anlegen mit gleicher E-Mail: "hans@test.ch"

**Erwartetes Ergebnis**:
- Fehlermeldung: "E-Mail-Adresse bereits vergeben" (oder ähnlich)
- Zweiter Fahrer wird nicht angelegt

- [ ] Bestanden

---

### T-EDGE-03: Löschen mit aktiven Abhängigkeiten

**Beschreibung**: Stammdaten mit aktiven Fahrten können nicht gelöscht werden.

**Schritte**:
1. Patient auswählen, der aktive (nicht abgeschlossene/stornierte) Fahrten hat
2. Auf "Löschen" klicken

**Erwartetes Ergebnis**:
- Warnung/Fehler: "Löschen nicht möglich – aktive Fahrten vorhanden"
- Patient bleibt aktiv

- [ ] Bestanden

---

### T-EDGE-04: Abgeschlossene Fahrt kann nicht storniert werden

**Beschreibung**: Bereits abgeschlossene Fahrten können nicht mehr storniert werden.

**Schritte**:
1. Fahrt in Status `completed` öffnen
2. Versuchen, "Stornieren" zu klicken

**Erwartetes Ergebnis**:
- "Stornieren"-Button ist deaktiviert oder nicht sichtbar
- Kein Statuswechsel möglich

- [ ] Bestanden

---

### T-EDGE-05: Leere Listen-Ansichten

**Beschreibung**: Leere Zustände werden benutzerfreundlich dargestellt.

**Schritte**:
1. Als neuer Fahrer einloggen (ohne zugewiesene Fahrten)
2. "Meine Fahrten" prüfen
3. Als Dispatcher: Fahrtenliste mit Filter öffnen, der 0 Ergebnisse liefert

**Erwartetes Ergebnis**:
- Fahrer: Meldung "Du hast aktuell keine zugewiesenen Fahrten. Sobald dir Fahrten zugewiesen werden, erscheinen sie hier."
- Dispatcher: Meldung "Keine Fahrten gefunden" (oder ähnlich)
- Keine Fehler oder leere weisse Seiten

- [ ] Bestanden

---

### T-EDGE-06: Google Maps API Fehler

**Beschreibung**: Bei Fehler der Google Maps API wird eine sinnvolle Meldung angezeigt.

**Schritte**:
1. Fahrt anlegen
2. Adresse eingeben, die keine Autocomplete-Ergebnisse liefert (z.B. "xyzabc123nonsense")
3. Versuchen, Route berechnen zu lassen

**Erwartetes Ergebnis**:
- Kein Autocomplete-Vorschlag → Hinweis angezeigt
- Bei fehlgeschlagener Routenberechnung: Fehlermeldung (z.B. "Route konnte nicht berechnet werden")
- Formular bleibt nutzbar, Fahrt kann ohne Route gespeichert werden oder Fehler wird klar kommuniziert

- [ ] Bestanden

---

## Zusammenfassung

| Bereich | Anzahl Tests | Bestanden | Fehlgeschlagen | Offen |
|---------|-------------|-----------|----------------|-------|
| Authentifizierung & Rollen | 4 | | | |
| Stammdaten CRUD | 12 | | | |
| Fahrten-Management | 10 | | | |
| Fahrer-Workflow | 8 | | | |
| Verfügbarkeit & Abwesenheiten | 4 | | | |
| Dashboard & Realtime | 4 | | | |
| SMS-Benachrichtigungen | 5 | | | |
| Security | 6 | | | |
| Edge Cases & Fehlerbehandlung | 6 | | | |
| **Total** | **59** | | | |

### Release-Kriterium

- Alle Tests in den Bereichen **Authentifizierung**, **Stammdaten**, **Fahrten-Management**, **Fahrer-Workflow** und **Security** müssen bestehen.
- SMS-Tests: Mindestens Log-Ausgabe korrekt, falls Twilio nicht konfiguriert.
- Edge Cases: Keine P0/P1-Bugs offen.

### Bug Severity

| Level | Beschreibung | Beispiel |
|-------|-------------|---------|
| **P0 Critical** | System unbrauchbar, Blocker | Login fehlerhaft, RLS fehlt, Datenverlust |
| **P1 High** | Feature kaputt, Workaround möglich | Kalender zeigt keine Fahrten, Fahrt-Start fehlerhaft |
| **P2 Medium** | Feature teilweise kaputt | Filter funktioniert nicht, SMS verzögert |
| **P3 Low** | Kosmetisch, UX | Button-Text falsch, Tooltip fehlt |

---

**Erstellt**: 2026-02-03
**Nächster Review**: Vor M3 Production Launch
