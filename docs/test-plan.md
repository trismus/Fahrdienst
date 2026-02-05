# Test Plan – Fahrdienst App

**Version**: 1.0
**Letzte Aktualisierung**: 2026-01-28

---

## Übersicht

Dieses Dokument definiert die Test-Strategie und kritische Test-Szenarien für die Fahrdienst-App. Tests werden auf drei Ebenen durchgeführt:
1. **Unit Tests**: Server Actions, Utilities
2. **Integration Tests**: End-to-End User Journeys
3. **Manual Testing**: UI/UX, Edge Cases, Sicherheit

---

## Test-Strategie

### Automatisierte Tests (Phase 2)
- **Framework**: Vitest für Unit Tests, Playwright für E2E Tests
- **Coverage-Ziel**: >80% für kritische Flows (Auth, CRUD, Disposition)
- **CI/CD**: Tests laufen automatisch bei jedem Commit (GitHub Actions)

### Manuelle Tests (MVP)
- **Verantwortlich**: Developer + Product Owner
- **Frequenz**: Nach jedem Sprint (Sprint Review)
- **Fokus**: User Journeys, Edge Cases, Sicherheit

---

## Sprint 1 – Test-Szenarien

### TS-1.1: Login Happy Path
**Ziel**: Dispatcher kann sich erfolgreich anmelden

**Preconditions**:
- Test-User existiert in Supabase: `dispatcher@test.ch` (Passwort aus `DEMO_USER_PASSWORD` in `.env.local`)

**Schritte**:
1. Öffne `/login`
2. Eingabe: Email = `dispatcher@test.ch`, Passwort aus `DEMO_USER_PASSWORD`
3. Click "Anmelden"

**Erwartetes Ergebnis**:
- Redirect zu `/dashboard`
- Header zeigt "Willkommen, Dispatcher" (oder Email)
- Logout-Button sichtbar

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.2: Login mit falschen Credentials
**Ziel**: Fehlerbehandlung bei ungültigen Anmeldedaten

**Schritte**:
1. Öffne `/login`
2. Eingabe: Email = `dispatcher@test.ch`, Passwort = `wrongpassword`
3. Click "Anmelden"

**Erwartetes Ergebnis**:
- Fehler "Ungültige Anmeldedaten" wird angezeigt
- User bleibt auf `/login`
- Formular nicht zurückgesetzt (Email bleibt gefüllt)

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.3: Logout
**Ziel**: User kann sich abmelden

**Schritte**:
1. Als Dispatcher eingeloggt
2. Click "Logout" im Header

**Erwartetes Ergebnis**:
- Redirect zu `/login`
- Session gelöscht (Cookie entfernt)
- Zugriff auf `/dashboard` ohne Login → Redirect zu `/login`

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.4: RLS Policy – Fahrer sieht nur eigene Fahrten
**Ziel**: Datenschutz – Fahrer kann keine fremden Fahrten sehen

**Preconditions**:
- Test-Fahrer 1: `fahrer1@test.ch` (hat Fahrt A zugewiesen)
- Test-Fahrer 2: `fahrer2@test.ch` (hat Fahrt B zugewiesen)

**Schritte**:
1. Login als `fahrer1@test.ch`
2. Öffne `/rides` (Fahrer-Ansicht)
3. Prüfe: Nur Fahrt A sichtbar

**Erwartetes Ergebnis**:
- Liste zeigt nur Fahrt A
- Fahrt B nicht sichtbar
- Direkte URL `/rides/[id_of_fahrt_b]` → 403 Forbidden oder Redirect

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.5: Patient anlegen
**Ziel**: Dispatcher kann neuen Patienten erfassen

**Schritte**:
1. Login als Dispatcher
2. Öffne `/patients/new`
3. Eingabe:
   - Name: "Max Mustermann"
   - Adresse: Beginne Eingabe "Bahnhofstrasse 1, Zürich" → Autocomplete wählt
   - Telefon: "+41 79 123 45 67"
   - Besondere Bedürfnisse: Rollstuhl (auswählen)
   - Notizen: "Benötigt Hilfe beim Einsteigen"
4. Click "Speichern"

**Erwartetes Ergebnis**:
- Redirect zu `/patients`
- Toast: "Patient erfolgreich angelegt"
- Patient erscheint in Liste
- DB-Check: `latitude`, `longitude`, `formatted_address` gespeichert

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.6: Google Places API – Adresse nicht gefunden
**Ziel**: Error Handling wenn Places API keine Resultate liefert

**Schritte**:
1. Öffne `/patients/new`
2. Eingabe Adresse: "xyzabc123" (nonsense)
3. Kein Autocomplete-Result erscheint

**Erwartetes Ergebnis**:
- Kein Autocomplete-Vorschlag
- Bei Speichern ohne Autocomplete-Auswahl → Fehler "Bitte wählen Sie eine Adresse aus der Liste"
- Alternative (Phase 2): Manuelle Eingabe erlauben

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.7: Fahrt anlegen mit Routenberechnung
**Ziel**: Dispatcher legt Fahrt an, Route wird automatisch berechnet

**Preconditions**:
- Patient "Max Mustermann" existiert (Adresse: Bahnhofstrasse 1, Zürich)
- Destination "Kantonsspital Aarau" existiert

**Schritte**:
1. Öffne `/rides/new`
2. Auswahl:
   - Patient: Max Mustermann
   - Destination: Kantonsspital Aarau
   - Abholzeit: Morgen 09:00
3. Warte 1-2 Sekunden (Route wird berechnet)
4. Prüfe: Felder "Geschätzte Dauer" und "Distanz" sind befüllt
5. Click "Speichern"

**Erwartetes Ergebnis**:
- Ankunftszeit automatisch berechnet (09:00 + Dauer + 5min)
- Fahrt gespeichert mit Status `planned`
- Redirect zu `/rides`
- DB-Check: `estimated_duration`, `estimated_distance` gespeichert

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.8: Fahrt mit Rückfahrt
**Ziel**: Rückfahrt wird als separate Fahrt gespeichert

**Schritte**:
1. Öffne `/rides/new`
2. Auswahl wie TS-1.7
3. Checkbox "Rückfahrt" aktivieren
4. Rückfahrtzeit: Morgen 12:00
5. Click "Speichern"

**Erwartetes Ergebnis**:
- 2 Fahrten in DB:
  - Fahrt 1: Max → Kantonsspital (09:00)
  - Fahrt 2: Kantonsspital → Max (12:00)
- Beide haben gleichen `recurrence_group` (UUID)
- Beide erscheinen in Fahrtenliste

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.9: Fahrer zuweisen mit Verfügbarkeits-Check
**Ziel**: Dispatcher sieht Verfügbarkeit des Fahrers visuell

**Preconditions**:
- Fahrer "Hans Müller" hat Availability Block: Mo-Fr 08:00-10:00
- Fahrer "Peter Meier" hat Abwesenheit: Morgen ganzer Tag
- Fahrer "Anna Schmidt" hat keine Availability Blocks

**Schritte**:
1. Öffne `/rides/new`
2. Abholzeit: Morgen 09:00 (Montag)
3. Dropdown "Fahrer zuweisen" öffnen

**Erwartetes Ergebnis**:
- Hans Müller: **Grün** (verfügbar)
- Peter Meier: **Grau** (abwesend)
- Anna Schmidt: **Grau** (keine Verfügbarkeit)
- Hover über Grau → Tooltip erklärt: "Abwesend" oder "Keine Verfügbarkeit"
- Dispatcher kann trotzdem jeden Fahrer zuweisen (kein Blocker)

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.10: Fahrt stornieren
**Ziel**: Dispatcher kann Fahrt stornieren

**Schritte**:
1. Fahrt in Status `planned` existiert
2. Öffne Fahrt-Detail `/rides/[id]`
3. Click "Stornieren"
4. Confirmation Dialog erscheint
5. Eingabe Grund: "Patient hat abgesagt"
6. Click "Bestätigen"

**Erwartetes Ergebnis**:
- Status → `cancelled`
- `cancelled_at` Timestamp gespeichert
- Grund in `notes` Feld gespeichert
- Fahrt erscheint in Liste mit rotem Badge "Storniert"
- Fahrt kann nicht mehr bearbeitet werden (nur Notizen)

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.11: Kalender Wochen-Ansicht
**Ziel**: Dispatcher sieht alle Fahrten der Woche im Kalender

**Preconditions**:
- 5 Fahrten existieren: 3 diese Woche, 2 nächste Woche
- Stati: 1× planned, 1× confirmed, 1× in_progress, 1× completed, 1× cancelled

**Schritte**:
1. Öffne `/calendar` oder `/dashboard`
2. Kalender zeigt aktuelle Woche

**Erwartetes Ergebnis**:
- 3 Fahrten sichtbar (diese Woche)
- Jede Fahrt als Card: Patient-Name, Zeit, Fahrer, Status-Badge
- Farben korrekt: grau, blau, gelb, grün, rot
- Heutiger Tag markiert
- Click auf Card → Redirect zu `/rides/[id]`

**Status**: ☐ Pass | ☐ Fail

---

### TS-1.12: Kalender Navigation
**Ziel**: Dispatcher kann zwischen Wochen navigieren

**Schritte**:
1. Kalender zeigt aktuelle Woche
2. Click "Nächste Woche"
3. Click "Vorherige Woche"
4. Click "Diese Woche" (zurück zu heute)

**Erwartetes Ergebnis**:
- Navigation funktioniert
- Fahrten der jeweiligen Woche werden angezeigt
- "Diese Woche" Button markiert heutige Woche

**Status**: ☐ Pass | ☐ Fail

---

## Sprint 2 – Test-Szenarien

### TS-2.1: Fahrerverfügbarkeit readonly (Dispatcher-Sicht)
**Ziel**: Dispatcher sieht Verfügbarkeit eines Fahrers

**Schritte**:
1. Öffne `/drivers/[id]` (Fahrer-Detail)
2. Tab "Verfügbarkeit" klicken

**Erwartetes Ergebnis**:
- AvailabilityGrid (5×5) angezeigt
- Grüne Blöcke = verfügbar, graue = nicht verfügbar
- Grid ist readonly (kein Toggle möglich)
- Liste der Abwesenheiten (zukünftige) angezeigt

**Status**: ☐ Pass | ☐ Fail

---

### TS-2.2: Dashboard Statistiken
**Ziel**: Dispatcher sieht Übersicht auf Dashboard

**Schritte**:
1. Öffne `/dashboard`

**Erwartetes Ergebnis**:
- Cards zeigen:
  - Anzahl Fahrten heute
  - Anzahl offene Zuweisungen (Fahrten ohne Fahrer)
  - Anzahl bestätigte Fahrten heute
  - Anzahl abgeschlossene Fahrten heute
- Kalender sichtbar (Wochen-Ansicht)

**Status**: ☐ Pass | ☐ Fail

---

## Sprint 3 – Test-Szenarien

### TS-3.1: Fahrer sieht zugewiesene Fahrten
**Ziel**: Fahrer kann sich anmelden und zugewiesene Fahrten sehen

**Preconditions**:
- Fahrer "Hans Müller" (`hans@test.ch`) hat 2 Fahrten zugewiesen (1× heute, 1× morgen)
- Fahrer "Peter Meier" hat 1 Fahrt zugewiesen

**Schritte**:
1. Login als `hans@test.ch`
2. Öffne `/rides` (Driver UI)

**Erwartetes Ergebnis**:
- Liste zeigt nur 2 Fahrten von Hans Müller
- Fahrten sortiert nach Datum/Zeit
- Status-Badge sichtbar
- Click auf Fahrt → Detail-Ansicht mit Karte

**Status**: ☐ Pass | ☐ Fail

---

### TS-3.2: Fahrer bestätigt Fahrt
**Ziel**: Fahrer bestätigt zugewiesene Fahrt

**Schritte**:
1. Login als Fahrer
2. Fahrt in Status `planned` anklicken
3. Button "Bestätigen" klicken

**Erwartetes Ergebnis**:
- Status → `confirmed`
- Fahrt bleibt in Liste (Status-Badge ändert Farbe zu blau)
- Dispatcher sieht Update in Echtzeit (optional: via Supabase Real-time)

**Status**: ☐ Pass | ☐ Fail

---

### TS-3.3: Fahrer lehnt Fahrt ab
**Ziel**: Fahrer lehnt Fahrt ab, Dispatcher wird informiert

**Schritte**:
1. Login als Fahrer
2. Fahrt in Status `planned` anklicken
3. Button "Ablehnen" klicken
4. Modal: Grund eingeben "Terminkollision"
5. Bestätigen

**Erwartetes Ergebnis**:
- `driver_id = NULL` (Fahrt nicht mehr zugewiesen)
- Grund in `notes` gespeichert
- Fahrt verschwindet aus Fahrer-Liste
- Dispatcher sieht Fahrt wieder als "Nicht zugewiesen" (mit Notiz: "Abgelehnt von Hans Müller: Terminkollision")

**Status**: ☐ Pass | ☐ Fail

---

### TS-3.4: Email-Benachrichtigung bei Zuweisung
**Ziel**: Fahrer erhält Email wenn Fahrt zugewiesen wird

**Schritte**:
1. Dispatcher weist Fahrt Fahrer zu
2. Email-Postfach des Fahrers prüfen

**Erwartetes Ergebnis**:
- Email empfangen innerhalb 1 Minute
- Betreff: "Neue Fahrt zugewiesen"
- Body enthält: Patient-Name (oder Initiale), Abholzeit, Abholadresse, Zieladresse
- Optional: Link zu Fahrt-Detail (falls Fahrer eingeloggt)

**Status**: ☐ Pass | ☐ Fail

---

### TS-3.5: Fahrer pflegt Verfügbarkeit
**Ziel**: Fahrer kann eigene Verfügbarkeit ändern

**Schritte**:
1. Login als Fahrer
2. Öffne `/availability`
3. AvailabilityGrid (5×5) angezeigt
4. Click auf Block "Mo 08:00-10:00" (grau) → Toggle zu grün
5. Click auf Block "Di 14:00-16:00" (grün) → Toggle zu grau

**Erwartetes Ergebnis**:
- Blocks ändern Farbe sofort (optimistic UI)
- DB aktualisiert: `availability_blocks` Einträge erstellt/gelöscht
- Dispatcher sieht Update (readonly)

**Status**: ☐ Pass | ☐ Fail

---

### TS-3.6: Fahrer erfasst Abwesenheit
**Ziel**: Fahrer meldet Urlaub/Krankheit

**Schritte**:
1. Login als Fahrer
2. Öffne `/availability` → Tab "Abwesenheiten"
3. Click "Neue Abwesenheit"
4. Eingabe:
   - Von: 2026-03-01
   - Bis: 2026-03-07
   - Grund: "Urlaub"
5. Speichern

**Erwartetes Ergebnis**:
- Abwesenheit gespeichert
- Erscheint in Liste
- Dispatcher sieht Abwesenheit (Fahrer wird in diesem Zeitraum grau markiert bei Zuweisung)

**Status**: ☐ Pass | ☐ Fail

---

## Sprint 4 – Test-Szenarien

### TS-4.1: Fahrer startet Fahrt
**Ziel**: Fahrer startet Fahrt am Tag der Durchführung

**Schritte**:
1. Login als Fahrer
2. Fahrt mit Status `confirmed`, `pickup_time = heute`
3. Click "Fahrt starten"

**Erwartetes Ergebnis**:
- Status → `in_progress`
- `started_at = NOW()` gespeichert
- Button wechselt zu "Fahrt abschließen"

**Status**: ☐ Pass | ☐ Fail

---

### TS-4.2: Fahrer schließt Fahrt ab
**Ziel**: Fahrer beendet Fahrt

**Schritte**:
1. Fahrt in Status `in_progress`
2. Click "Fahrt abschließen"

**Erwartetes Ergebnis**:
- Status → `completed`
- `completed_at = NOW()` gespeichert
- Fahrt verschwindet aus "Heutige Fahrten", erscheint in "Abgeschlossene Fahrten"

**Status**: ☐ Pass | ☐ Fail

---

### TS-4.3: Timestamps korrekt gespeichert
**Ziel**: Alle Timestamps werden korrekt erfasst

**Schritte**:
1. Fahrt durchlaufen: Start → Abholen → Ankommen → Abschließen
2. DB-Check

**Erwartetes Ergebnis**:
- `started_at`, `picked_up_at`, `arrived_at`, `completed_at` alle gespeichert
- Timestamps chronologisch korrekt (started < picked_up < arrived < completed)

**Status**: ☐ Pass | ☐ Fail

---

### TS-4.4: SMS-Benachrichtigung (optional)
**Ziel**: Fahrer erhält SMS bei Zuweisung

**Schritte**:
1. Dispatcher weist Fahrt zu
2. Fahrer-Handy prüfen

**Erwartetes Ergebnis**:
- SMS empfangen innerhalb 1 Minute
- Text: "Neue Fahrt: [Patient] um [Zeit]. Details: [Link]"

**Status**: ☐ Pass | ☐ Fail

---

## Security Tests

### SEC-1: SQL Injection Prevention
**Ziel**: Sicherstellen, dass Input-Validierung SQL Injection verhindert

**Schritte**:
1. Öffne `/patients/new`
2. Eingabe Name: `'; DROP TABLE patients; --`
3. Speichern

**Erwartetes Ergebnis**:
- Input wird escaped (V2 Actions nutzen Parameterized Queries)
- Tabelle `patients` existiert weiterhin
- Patient mit Name `'; DROP TABLE patients; --` wird gespeichert (als String)

**Status**: ☐ Pass | ☐ Fail

---

### SEC-2: XSS Prevention
**Ziel**: Sicherstellen, dass XSS-Angriffe verhindert werden

**Schritte**:
1. Patient anlegen mit Name: `<script>alert('XSS')</script>`
2. Patienten-Liste öffnen

**Erwartetes Ergebnis**:
- Kein Alert-Popup erscheint
- Name wird als Text angezeigt (escaped)

**Status**: ☐ Pass | ☐ Fail

---

### SEC-3: RLS Policy – Fahrer ändert fremde Fahrt
**Ziel**: Fahrer kann keine fremden Fahrten bearbeiten

**Schritte**:
1. Login als Fahrer 1
2. Direkte API-Call (via Browser DevTools oder Postman):
   `updateRide(id_of_fahrt_von_fahrer_2, { status: 'cancelled' })`

**Erwartetes Ergebnis**:
- API-Call schlägt fehl (403 Forbidden oder kein Update)
- Fahrt bleibt unverändert

**Status**: ☐ Pass | ☐ Fail

---

## Performance Tests

### PERF-1: Page Load Time
**Ziel**: Pages laden schnell (<2s)

**Schritte**:
1. Öffne `/dashboard` (mit 100 Fahrten diese Woche)
2. Messe Load Time (Chrome DevTools → Network Tab)

**Erwartetes Ergebnis**:
- Load Time <2s (90th percentile)

**Status**: ☐ Pass | ☐ Fail

---

### PERF-2: API Response Time
**Ziel**: Server Actions antworten schnell (<500ms)

**Schritte**:
1. Call `getRides()` mit 500 Fahrten in DB
2. Messe Response Time

**Erwartetes Ergebnis**:
- Response Time <500ms (95th percentile)

**Status**: ☐ Pass | ☐ Fail

---

### PERF-3: Google Maps API Caching
**Ziel**: Route wird gecached, nicht bei jedem Request neu berechnet

**Schritte**:
1. Fahrt anlegen: Patient A → Destination B
2. Gleiche Fahrt nochmal anlegen
3. Prüfe: Wird Route erneut berechnet?

**Erwartetes Ergebnis**:
- Phase 1 (MVP): Keine Caching (jedes Mal neu berechnet) – akzeptabel
- Phase 2: Route wird gecached (Redis oder DB-Cache)

**Status**: ☐ Pass | ☐ Fail

---

## Regression Tests (vor jedem Release)

### RT-1: Alle kritischen User Journeys
- [ ] TS-1.1 (Login)
- [ ] TS-1.5 (Patient anlegen)
- [ ] TS-1.7 (Fahrt anlegen)
- [ ] TS-1.9 (Fahrer zuweisen)
- [ ] TS-1.11 (Kalender)
- [ ] TS-3.1 (Fahrer sieht Fahrten)
- [ ] TS-3.2 (Fahrer bestätigt Fahrt)
- [ ] TS-4.1 (Fahrer startet Fahrt)
- [ ] TS-4.2 (Fahrer schließt Fahrt ab)

### RT-2: Security Tests
- [ ] SEC-1 (SQL Injection)
- [ ] SEC-2 (XSS)
- [ ] SEC-3 (RLS)

### RT-3: Performance Tests
- [ ] PERF-1 (Page Load)
- [ ] PERF-2 (API Response)

---

## Test-Umgebungen

| Umgebung | URL | Zweck |
|----------|-----|-------|
| **Development** | `http://localhost:3000` | Lokale Entwicklung |
| **Staging** | `https://fahrdienst-staging.vercel.app` | Pre-Production Tests |
| **Production** | `https://fahrdienst.vercel.app` | Live System |

**Test-Daten**:
- Development: Seed-Script erstellt Test-Patienten/Fahrer/Fahrten
- Staging: Manuelle Test-Daten (nicht produktiv)
- Production: Echte Daten (Tests nur mit Vorsicht!)

---

## Bug Severity

| Level | Beschreibung | Beispiel |
|-------|--------------|----------|
| **P0 Critical** | System unbrauchbar, Blocker für Release | Login funktioniert nicht, RLS Policy fehlt |
| **P1 High** | Wichtiges Feature kaputt, Workaround möglich | Kalender zeigt keine Fahrten, aber Liste funktioniert |
| **P2 Medium** | Feature teilweise kaputt, nicht kritisch | Filter funktioniert nicht, aber manuelle Suche möglich |
| **P3 Low** | Kosmetisch, UX-Problem | Button-Text falsch, Tooltip fehlt |

**Release-Kriterium**: Alle P0 und P1 Bugs müssen geschlossen sein.

---

**Nächster Schritt**: Sprint 1 starten, Tests während Entwicklung durchführen, Sprint Review mit Test-Report.
