# Workflow Canvas – Fahrdienst App

**Version**: 1.0
**Status**: Verbindliche Grundlage für Product Backlog
**Letzte Aktualisierung**: 2026-01-28

---

## Übersicht

Dieses Dokument definiert die **10 Kern-Workflows** der Fahrdienst-Applikation. Jeder Workflow beschreibt:
- **Akteure**: Wer ist beteiligt?
- **Trigger**: Was startet den Workflow?
- **Schritte**: Was passiert?
- **Outputs**: Was ist das Ergebnis?
- **Edge Cases**: Was kann schiefgehen?
- **MVP-Scope**: Was ist in Phase 1 vs. später?

---

## Workflow 1: Stammdaten-Workflow

### Beschreibung
Verwaltung von Patienten, Fahrern und Zielen (Master Data). Diese Daten sind die Grundlage für alle Fahrten.

### Akteure
- **Dispatcher** (Admin-Rolle)

### Trigger
- Neuer Patient wird aufgenommen
- Neuer Fahrer wird eingestellt
- Neue Destination (Klinik, Praxis) wird registriert
- Änderungen an bestehenden Stammdaten

### Schritte

#### 1.1 Patient anlegen
1. Dispatcher öffnet "Patienten" → "Neu"
2. Formular ausfüllen:
   - Name (Pflichtfeld)
   - Adresse mit Google Places Autocomplete (Pflichtfeld)
   - Telefon (optional)
   - Besondere Bedürfnisse (optional: Rollstuhl, Sauerstoff, Begleitperson)
   - Notizen (optional)
3. System speichert `formatted_address`, `latitude`, `longitude` aus Places API
4. Patient wird in Datenbank mit Status `active` angelegt

#### 1.2 Fahrer anlegen
1. Dispatcher öffnet "Fahrer" → "Neu"
2. Formular ausfüllen:
   - Name (Pflichtfeld)
   - Email (Pflichtfeld, muss unique sein)
   - Telefon (Pflichtfeld)
3. System legt Fahrer mit Status `active` an
4. Optional: Supabase User Account für Login wird angelegt (siehe Workflow 10)

#### 1.3 Destination anlegen
1. Dispatcher öffnet "Ziele" → "Neu"
2. Formular ausfüllen:
   - Name (z.B. "Kantonsspital Aarau")
   - Adresse mit Google Places Autocomplete (Pflichtfeld)
   - Ankunftsfenster (optional): von/bis (z.B. 08:00-09:00 für Dialyse)
3. System speichert Koordinaten

#### 1.4 Stammdaten bearbeiten/löschen
1. Dispatcher öffnet Listen-Ansicht
2. Click auf Eintrag → Detail-Ansicht
3. "Bearbeiten" → Formular vorausgefüllt
4. "Löschen" → Soft Delete (Status = `deleted`)
   - Validierung: Nur löschen, wenn keine aktiven Fahrten verknüpft sind

### Outputs
- Patient/Fahrer/Destination in Datenbank gespeichert
- Verfügbar in Dropdowns bei Fahrt-Erstellung

### Edge Cases
- **Duplikate**: Email-Adresse von Fahrer bereits vorhanden → Fehler
- **Löschen mit Dependencies**: Patient hat zukünftige Fahrten → Warnung, Löschen verbieten
- **Adresse nicht gefunden**: Places API findet Adresse nicht → Manuelle Eingabe erlauben (später)

### MVP-Scope
✅ **Phase 1 (Sprint 1)**
- CRUD für Patient, Fahrer, Destination
- Google Places Autocomplete
- Soft Delete Pattern
- Basic Validierung

❌ **Später (Phase 2+)**
- Bulk-Import via CSV
- Duplikat-Erkennung (Fuzzy Matching)
- Historien-Ansicht (Audit Log)
- Manuelle Koordinaten-Eingabe falls Places API fehlschlägt

---

## Workflow 2: Fahrerverfügbarkeits-Workflow

### Beschreibung
Fahrer pflegen ihre wöchentlichen Verfügbarkeiten (2-Stunden-Blöcke) und Abwesenheiten (Urlaub, Krankheit).

### Akteure
- **Fahrer** (pflegt eigene Verfügbarkeit)
- **Dispatcher** (sieht alle Verfügbarkeiten readonly)

### Trigger
- Fahrer ändert Arbeitszeiten
- Fahrer meldet Urlaub/Krankheit
- Dispatcher plant Fahrten und prüft Verfügbarkeit

### Schritte

#### 2.1 Verfügbarkeitsblöcke setzen
1. Fahrer öffnet "Meine Verfügbarkeit"
2. Grid angezeigt: 5 Tage (Mo-Fr) × 5 Zeitblöcke (08-10, 10-12, 12-14, 14-16, 16-18)
3. Click auf Block → Toggle (grau = nicht verfügbar, grün = verfügbar)
4. System speichert `availability_blocks` (driver_id, weekday, start_time, end_time)

#### 2.2 Abwesenheit erfassen
1. Fahrer öffnet "Abwesenheiten" → "Neu"
2. Formular:
   - Von (Datum)
   - Bis (Datum)
   - Grund (optional: Urlaub, Krankheit, Sonstiges)
3. System validiert: `from_date <= to_date`
4. Abwesenheit wird gespeichert

#### 2.3 Verfügbarkeit prüfen (Dispatcher-Sicht)
1. Dispatcher öffnet "Fahrer" → Fahrer auswählen → "Verfügbarkeit"
2. Readonly-Grid mit Verfügbarkeitsblöcken
3. Liste der Abwesenheiten (vergangene ausgeblendet)

### Outputs
- Verfügbarkeitsblöcke in DB
- Abwesenheiten in DB
- Dispatcher kann verfügbare Fahrer bei Disposition filtern

### Edge Cases
- **Überlappende Abwesenheiten**: Fahrer erfasst 10.02-15.02 und 12.02-18.02 → Erlaubt (System merged nicht)
- **Abwesenheit in Vergangenheit**: Erlaubt (für Dokumentation)
- **Verfügbarkeit ändern bei bestehenden Fahrten**: Keine Validierung → Fahrer kann sich "wegklicken" (Warnung erst Phase 2)

### MVP-Scope
✅ **Phase 1 (Sprint 1-2)**
- AvailabilityGrid Component (toggle Blöcke)
- Abwesenheiten CRUD
- Dispatcher readonly-Ansicht

❌ **Später (Phase 2+)**
- Warnung bei Verfügbarkeitsänderung wenn Fahrten betroffen
- Recurring Abwesenheiten (z.B. "Jeden Freitag Nachmittag")
- Verfügbarkeit kopieren (z.B. "gleiche Verfügbarkeit wie letzte Woche")

---

## Workflow 3: Fahrtenbedarf erfassen

### Beschreibung
Dispatcher erfasst eine Fahrtanfrage und legt eine neue Fahrt an.

### Akteure
- **Dispatcher**

### Trigger
- Telefonanruf von Patient/Praxis
- Email-Anfrage
- Regelmäßiger Bedarf (z.B. Dialyse)

### Schritte

#### 3.1 Neue Fahrt anlegen
1. Dispatcher öffnet "Fahrten" → "Neu"
2. Formular ausfüllen:
   - **Patient** (Dropdown, Pflichtfeld)
   - **Destination** (Dropdown, Pflichtfeld)
   - **Abholzeit** (Datum + Uhrzeit, Pflichtfeld)
   - **Ankunftszeit** (optional, wird berechnet falls leer)
   - **Rückfahrt** (Checkbox: Ja/Nein)
   - **Rückfahrtzeit** (falls Rückfahrt = Ja)
   - **Fahrer** (Dropdown, optional – kann später zugewiesen werden)
   - **Notizen** (optional)
3. System berechnet Route:
   - Patient-Adresse → Destination
   - Google Directions API: Dauer + Distanz
   - Falls Ankunftszeit leer: Ankunftszeit = Abholzeit + Dauer + 5min Puffer
4. System speichert Fahrt mit Status `planned`

#### 3.2 Validierung
- Abholzeit muss in der Zukunft liegen (oder heute)
- Ankunftszeit > Abholzeit
- Falls Rückfahrt: Rückfahrtzeit > Ankunftszeit
- Patient, Destination müssen existieren und Status `active` haben

### Outputs
- Neue Fahrt in DB (Status: `planned`)
- Fahrt erscheint in Fahrtenliste und Kalender
- Falls Fahrer zugewiesen: Fahrt in Fahrer-Liste sichtbar (Benachrichtigung später)

### Edge Cases
- **Patient gelöscht**: Dropdown zeigt nur aktive Patienten → Kein Problem
- **Route nicht berechenbar**: Google API Fehler → Manuelle Eingabe Dauer/Distanz (später), MVP: Fehler anzeigen
- **Doppelbuchung Fahrer**: Fahrer hat bereits Fahrt zur gleichen Zeit → Warnung (kein Blocker), Dispatcher entscheidet

### MVP-Scope
✅ **Phase 1 (Sprint 1)**
- Einzelfahrt anlegen
- Route berechnen (Directions API)
- Fahrer optional zuweisen
- Rückfahrt als separate Fahrt (oder Flag in gleicher Fahrt)

❌ **Später (Phase 2+)**
- Wiederkehrende Fahrten (siehe Workflow 4)
- Template-Fahrten (häufige Routen schnell anlegen)
- Bulk-Import

### Technische Notiz: Rückfahrt
**Entscheidung**: Rückfahrt wird als **separate Fahrt** gespeichert (gleicher `recurrence_group`).
- Vorteil: Einfachere Logik (jede Fahrt = ein DB-Eintrag)
- Nachteil: Zwei Einträge, könnte Kalender vollmachen
- **Für MVP: Rückfahrt = separate Fahrt mit Referenz**

---

## Workflow 4: Wiederkehrende Fahrten

### Beschreibung
Dispatcher legt Fahrten an, die regelmäßig wiederkehren (z.B. 2×/Woche für 6 Wochen Dialyse).

### Akteure
- **Dispatcher**

### Trigger
- Patient hat langfristigen Bedarf (Dialyse, Chemo, Physio)

### Schritte

#### 4.1 Wiederkehrende Fahrt anlegen
1. Dispatcher öffnet "Fahrten" → "Neu" → Checkbox "Wiederkehrend"
2. Zusätzliche Felder:
   - **Wiederholung**: Dropdown (Täglich, Wochentage auswählen, Wöchentlich)
   - **Start-Datum**: Datum der ersten Fahrt
   - **End-Datum oder Anzahl**: "Bis Datum" oder "10 Wiederholungen"
3. System generiert alle Fahrten:
   - Jede Fahrt bekommt gleichen `recurrence_group` (UUID)
   - Status: `planned`
   - Fahrer: Optional gleich zuweisen oder leer lassen

#### 4.2 Wiederkehrende Fahrt bearbeiten
- **Option A**: Nur diese Fahrt ändern
- **Option B**: Diese und alle zukünftigen Fahrten ändern
- **Option C**: Alle Fahrten der Serie ändern

#### 4.3 Wiederkehrende Fahrt löschen
- Gleiche Optionen wie Bearbeiten

### Outputs
- Mehrere Fahrten in DB mit gleichem `recurrence_group`
- Alle Fahrten unabhängig bearbeitbar

### Edge Cases
- **Fahrer nicht durchgehend verfügbar**: Warnung anzeigen, Dispatcher muss manuell zuweisen
- **Feiertage**: Keine automatische Erkennung (Dispatcher muss manuell löschen/verschieben)

### MVP-Scope
❌ **Phase 1 (Sprint 1-2)**: NICHT im MVP
✅ **Phase 2 (Sprint 3-4)**: Wiederkehrende Fahrten

**Begründung**: Einzelfahrten reichen für ersten operativen Test. Wiederholungen sind wichtig, aber nicht kritisch für Launch.

---

## Workflow 5: Disposition & Zuteilung

### Beschreibung
Dispatcher weist einen Fahrer einer Fahrt zu. System unterstützt mit Verfügbarkeits-Check.

### Akteure
- **Dispatcher**

### Trigger
- Neue Fahrt wurde angelegt (Fahrer noch nicht zugewiesen)
- Fahrer hat Fahrt abgelehnt (neu zuweisen)
- Dispatcher optimiert Planung

### Schritte

#### 5.1 Manuelle Zuweisung (MVP)
1. Dispatcher öffnet Fahrt-Detail oder Fahrt bearbeiten
2. Feld "Fahrer zuweisen":
   - Dropdown mit allen Fahrern
   - **Grün markiert**: Verfügbar (Availability Block passt, keine Abwesenheit, keine Überschneidung)
   - **Gelb markiert**: Verfügbar, aber anderer Auftrag zur ähnlichen Zeit (Warnung)
   - **Grau markiert**: Nicht verfügbar (Abwesend oder kein Availability Block)
3. Dispatcher wählt Fahrer
4. System speichert `driver_id`, Status bleibt `planned`
5. (Benachrichtigung erfolgt später in Workflow 6)

#### 5.2 Zuweisung entfernen
1. Dispatcher öffnet Fahrt → "Fahrer entfernen"
2. `driver_id = NULL`, Status bleibt `planned`

### Outputs
- Fahrt hat zugewiesenen Fahrer
- Fahrer sieht Fahrt in seiner Liste (nach Login)

### Edge Cases
- **Fahrer überlastet**: Fahrer hat bereits 5 Fahrten am Tag → Nur Warnung, kein Blocker
- **Fahrer abwesend**: Dropdown zeigt trotzdem alle (aber grau), Dispatcher kann trotzdem zuweisen (für Notfälle)

### MVP-Scope
✅ **Phase 1 (Sprint 1)**
- Manuelle Zuweisung mit Verfügbarkeits-Check
- Dropdown zeigt Verfügbarkeit visuell (Farben)

❌ **Später (Phase 3+)**
- Automatische Vorschläge ("Beste Matches")
- Optimierung (kürzeste Route, Balance zwischen Fahrern)
- Drag & Drop Zuweisung im Kalender

### Technische Entscheidung: Disposition-Modus
**Für MVP: Manuell mit Assistenz**
- Dispatcher hat volle Kontrolle
- System zeigt Verfügbarkeit an, entscheidet aber nicht
- Später: Machine Learning für Vorschläge

---

## Workflow 6: Fahrerbenachrichtigung & Bestätigung

### Beschreibung
Fahrer wird über neue/geänderte Zuweisung informiert und kann Fahrt bestätigen oder ablehnen.

### Akteure
- **Fahrer** (empfängt Benachrichtigung, reagiert)
- **Dispatcher** (sieht Status-Änderung)

### Trigger
- Dispatcher weist Fahrer einer Fahrt zu
- Dispatcher ändert Details einer zugewiesenen Fahrt

### Schritte

#### 6.1 Benachrichtigung versenden
1. System detektiert: Fahrt wurde Fahrer zugewiesen (Event: `driver_id` geändert von `NULL` zu Fahrer-ID)
2. System versendet Benachrichtigung:
   - **Email** an Fahrer-Email
   - **SMS** an Fahrer-Telefon (optional)
3. Benachrichtigung enthält:
   - Patient-Name (oder Initiale für Privacy)
   - Abholzeit
   - Abholadresse
   - Zieladresse
   - Link zu Fahrt-Detail
   - Buttons: "Bestätigen" / "Ablehnen"

#### 6.2 Fahrt bestätigen
1. Fahrer klickt "Bestätigen" (in Email oder in App)
2. System ändert Status: `planned` → `confirmed`
3. Dispatcher sieht Status-Update in Echtzeit

#### 6.3 Fahrt ablehnen
1. Fahrer klickt "Ablehnen"
2. Modal: "Grund für Ablehnung" (optional: Krankheit, Terminkollision, Sonstiges)
3. System ändert Status: `planned` → `rejected` (eigener Status) ODER `driver_id = NULL` + Notiz
4. Dispatcher erhält Notification: "Fahrer X hat Fahrt Y abgelehnt"
5. Dispatcher muss neu zuweisen

### Outputs
- Fahrt-Status: `confirmed` oder `rejected`
- Dispatcher sieht Status in Liste/Kalender

### Edge Cases
- **Fahrer reagiert nicht**: Timeout nach 24h? → MVP: Kein Auto-Timeout, Dispatcher muss manuell nachfassen
- **Fahrer bestätigt, sagt dann ab**: Status `confirmed` → `cancelled` (in Workflow 8)
- **Email nicht zugestellt**: Keine Retry-Logik im MVP

### MVP-Scope
❌ **Phase 1 (Sprint 1)**: NICHT im MVP
✅ **Phase 2 (Sprint 2)**: Benachrichtigungen
- Email-Benachrichtigung (via Supabase Auth Email oder eigener SMTP)
- SMS optional (Twilio Integration)
- Bestätigen/Ablehnen in App (kein Email-Link zunächst)

**Begründung**: Für initialen Test kann Dispatcher Fahrer telefonisch informieren. Notifications sind wichtig für Skalierung, aber nicht für ersten Proof-of-Concept.

---

## Workflow 7: Durchführung der Fahrt

### Beschreibung
Fahrer startet Fahrt, holt Patient ab, fährt zu Destination, schließt Fahrt ab. Status wird kontinuierlich aktualisiert.

### Akteure
- **Fahrer** (führt Fahrt durch, updated Status)
- **Dispatcher** (sieht Live-Status)

### Trigger
- Fahrer startet Fahrt am Tag der Durchführung
- Fahrer erreicht Patient
- Fahrer erreicht Destination

### Schritte

#### 7.1 Fahrt starten
1. Fahrer öffnet App am Tag der Fahrt
2. Liste: "Heutige Fahrten" (Filter: `pickup_time = today`, Status = `confirmed`)
3. Fahrer klickt "Fahrt starten"
4. System ändert Status: `confirmed` → `in_progress`
5. Timestamp: `started_at = NOW()`

#### 7.2 Patient abholen
1. Fahrer fährt zu Abholadresse
2. Fahrer klickt "Patient abgeholt"
3. System speichert Timestamp: `picked_up_at = NOW()`
4. Status bleibt `in_progress` (ODER eigener Status `picked_up` – siehe Entscheidung unten)

#### 7.3 Ankunft am Ziel
1. Fahrer fährt zu Destination
2. Fahrer klickt "Angekommen"
3. System speichert Timestamp: `arrived_at = NOW()`

#### 7.4 Fahrt abschließen
1. Fahrer bestätigt: "Fahrt abgeschlossen"
2. System ändert Status: `in_progress` → `completed`
3. Timestamp: `completed_at = NOW()`
4. Fahrt verschwindet aus "Heutige Fahrten", erscheint in "Abgeschlossene Fahrten"

### Outputs
- Fahrt-Status: `completed`
- Timestamps: `started_at`, `picked_up_at`, `arrived_at`, `completed_at`
- Dispatcher sieht abgeschlossene Fahrt (für Abrechnung später)

### Edge Cases
- **Fahrer vergisst Status zu ändern**: Fahrt bleibt `in_progress` → Dispatcher sieht "überfällige Fahrten" (Liste mit Filter)
- **Patient nicht zuhause**: Fahrer kann Fahrt abbrechen → Status `cancelled` + Grund
- **Unfall/Panne**: Fahrer kann Notiz hinterlegen, Status bleibt `in_progress`, Dispatcher muss reagieren

### Status-Flow: Produktentscheidung

**Option A: 4 Stati (DB-Schema aktuell)**
- `planned` → `confirmed` → `in_progress` → `completed`
- Timestamps: `started_at`, `picked_up_at`, `arrived_at`, `completed_at`
- **Vorteil**: Einfach, weniger States
- **Nachteil**: Status allein sagt nicht, wo Fahrer gerade ist

**Option B: 6 Stati (detailliert)**
- `planned` → `confirmed` → `en_route_to_patient` → `picked_up` → `en_route_to_destination` → `completed`
- **Vorteil**: Sehr transparent für Dispatcher
- **Nachteil**: Mehr UI-Komplexität, mehr Buttons für Fahrer

**ENTSCHEIDUNG (Product Owner): Option A für MVP**
- 4 Stati reichen für operativen Betrieb
- Timestamps geben zusätzliche Info
- UI einfacher (weniger Buttons)
- Phase 2: Falls Bedarf, erweitern auf granulare Stati

### MVP-Scope
❌ **Phase 1 (Sprint 1)**: NICHT im MVP (kein Driver UI)
✅ **Phase 2 (Sprint 2-3)**: Driver Mobile UI
- Fahrt starten/abschließen
- Timestamps speichern
- Dispatcher sieht Live-Status

---

## Workflow 8: Änderungen & Störungen

### Beschreibung
Umgang mit unvorhergesehenen Ereignissen: Patient sagt ab, Fahrer fällt aus, Zeit muss verschoben werden.

### Akteure
- **Dispatcher** (reagiert auf Störung)
- **Fahrer** (meldet Störung)

### Trigger
- Patient sagt Termin ab
- Fahrer erkrankt kurzfristig
- Destination verschiebt Termin
- Verkehrsstörung (Fahrer kommt zu spät)

### Schritte

#### 8.1 Fahrt verschieben
1. Dispatcher öffnet Fahrt → "Bearbeiten"
2. Abholzeit/Ankunftszeit ändern
3. System prüft: Fahrer noch verfügbar? → Warnung falls Konflikt
4. System speichert Änderung
5. (Optional: Fahrer erhält Update-Benachrichtigung – Phase 2)

#### 8.2 Fahrt stornieren
1. Dispatcher öffnet Fahrt → "Stornieren"
2. Modal: "Grund für Stornierung" (optional: Patient abgesagt, Fahrer krank, Sonstiges)
3. System ändert Status: → `cancelled`
4. Timestamp: `cancelled_at = NOW()`, Grund in `notes`

#### 8.3 Fahrer austauschen
1. Dispatcher öffnet Fahrt → "Fahrer ändern"
2. Neuen Fahrer zuweisen (Dropdown wie Workflow 5)
3. System speichert neuen `driver_id`
4. (Optional: Beide Fahrer erhalten Benachrichtigung – Phase 2)

#### 8.4 Störung während Fahrt
1. Fahrer in App: "Problem melden"
2. Freitext-Notiz + optional Foto
3. System speichert in `notes`, setzt Flag `has_issue = true`
4. Dispatcher sieht Flag in Liste → kann reagieren

### Outputs
- Fahrt geändert/storniert
- Notiz gespeichert
- Dispatcher informiert

### Edge Cases
- **Fahrt bereits abgeschlossen stornieren**: Nicht erlaubt (nur bis Status `in_progress`)
- **Mehrfach-Änderung**: Historie wird nicht getrackt (nur aktueller Stand) → Phase 2: Audit Log

### MVP-Scope
✅ **Phase 1 (Sprint 1)**
- Fahrt stornieren (Dispatcher)
- Fahrt bearbeiten (Zeit/Fahrer ändern)

❌ **Später (Phase 2+)**
- Problem melden (Fahrer)
- Automatische Benachrichtigung bei Änderungen
- Audit Log (wer hat wann was geändert)

---

## Workflow 9: Abrechnung & Nachbearbeitung

### Beschreibung
Nach Abschluss der Fahrt: Daten für Abrechnung aufbereiten, Statistiken, Archivierung.

### Akteure
- **Dispatcher / Admin**
- **Buchhaltung** (externe Rolle, kein Login)

### Trigger
- Monatsende: Abrechnung erstellen
- Fahrt abgeschlossen: Daten exportieren

### Schritte

#### 9.1 Fahrtenbericht generieren
1. Admin öffnet "Berichte" → "Fahrtenbericht"
2. Filter: Zeitraum (z.B. letzter Monat), Fahrer (optional)
3. System generiert CSV/PDF:
   - Fahrt-ID, Datum, Patient, Fahrer, Strecke, Dauer, Status
4. Download

#### 9.2 Fahrerstatistik
1. Admin öffnet "Berichte" → "Fahrerstatistik"
2. Übersicht: Anzahl Fahrten pro Fahrer, Kilometer, Durchschnittliche Dauer
3. Filter: Zeitraum

#### 9.3 Archivierung
1. System: Cronjob löscht Fahrten älter als 2 Jahre (Soft Delete)
2. Oder: Manuelle Archivierung durch Admin

### Outputs
- CSV/PDF Export
- Statistik-Dashboard

### MVP-Scope
❌ **Phase 1-3**: NICHT im MVP
✅ **Phase 4 (Post-MVP)**: Abrechnung & Reporting

**Begründung**: Operativer Betrieb funktioniert ohne Reporting. Kann manuell via SQL gemacht werden. Wichtig, aber nicht kritisch für Launch.

---

## Workflow 10: Rollen & Governance

### Beschreibung
Verwaltung von Benutzer-Rollen, Zugriffsrechten, Sicherheit.

### Akteure
- **Admin** (Super-User, kann alle Rollen verwalten)
- **Dispatcher** (hat Zugriff auf alle Fahrten, Stammdaten)
- **Fahrer** (sieht nur eigene Fahrten, eigene Verfügbarkeit)

### Trigger
- Neuer Fahrer wird eingestellt → Account anlegen
- Fahrer verlässt Firma → Account deaktivieren
- Dispatcher-Rolle hinzufügen/entfernen

### Schritte

#### 10.1 User Account anlegen
1. Admin öffnet "Fahrer" → Fahrer bearbeiten → "Login aktivieren"
2. System legt Supabase User Account an:
   - Email = Fahrer-Email
   - Passwort = temporär generiert, Email an Fahrer
   - Role = `driver` (in `user_roles` Tabelle)
3. Fahrer erhält Email mit Login-Link

#### 10.2 Dispatcher-Rolle vergeben
1. Admin öffnet "Benutzer" → User auswählen → "Rolle ändern"
2. Rolle = `dispatcher`
3. User hat ab sofort Zugriff auf alle Dispatcher-Features

#### 10.3 Account deaktivieren
1. Admin öffnet Fahrer → "Login deaktivieren"
2. Supabase User wird deaktiviert (nicht gelöscht)
3. Fahrer kann sich nicht mehr anmelden
4. Fahrer-Eintrag bleibt (für Historie)

### Rollen-Matrix

| Feature | Admin | Dispatcher | Fahrer |
|---------|-------|------------|--------|
| Stammdaten CRUD | ✅ | ✅ | ❌ |
| Fahrten erstellen | ✅ | ✅ | ❌ |
| Fahrten zuweisen | ✅ | ✅ | ❌ |
| Alle Fahrten sehen | ✅ | ✅ | ❌ |
| Eigene Fahrten sehen | ✅ | ✅ | ✅ |
| Fahrt bestätigen/ablehnen | ✅ | ❌ | ✅ (nur eigene) |
| Verfügbarkeit pflegen | ✅ | ❌ (readonly) | ✅ (nur eigene) |
| User-Verwaltung | ✅ | ❌ | ❌ |

### Sicherheit (RLS Policies)

#### Tabelle: `rides`
- **Dispatcher/Admin**: `SELECT, INSERT, UPDATE, DELETE` auf alle Fahrten
- **Fahrer**: `SELECT` nur eigene Fahrten (`driver_id = auth.uid()`)
- **Fahrer**: `UPDATE` nur Status-Felder (`status`, `started_at`, etc.), nicht `driver_id`, `patient_id`

#### Tabelle: `patients`
- **Dispatcher/Admin**: Voller Zugriff
- **Fahrer**: `SELECT` nur für Fahrten, die ihm zugewiesen sind (via JOIN)

#### Tabelle: `drivers`
- **Dispatcher/Admin**: Voller Zugriff
- **Fahrer**: `SELECT` auf eigenen Eintrag, `UPDATE` nur Telefon (nicht Email/Name)

#### Tabelle: `availability_blocks`
- **Dispatcher/Admin**: `SELECT` alle, `INSERT/UPDATE/DELETE` keine (oder readonly)
- **Fahrer**: Voller Zugriff auf eigene Blöcke

### MVP-Scope
✅ **Phase 1 (Sprint 1)**
- Login/Logout (Supabase Auth)
- Rollen: `dispatcher` und `driver` (hardcoded, keine UI für Rollen-Verwaltung)
- RLS Policies (siehe oben)
- Admin legt User manuell in Supabase an (kein Self-Service)

❌ **Später (Phase 2+)**
- User-Verwaltung UI (Admin kann User anlegen/deaktivieren)
- Self-Service Passwort-Reset
- Granulare Permissions (z.B. "Dispatcher kann nur eigene Region sehen")
- Audit Log (wer hat was wann geändert)

### Technische Implementierung
- Supabase Auth für Login
- Custom Claims oder `user_roles` Tabelle für Rollen
- RLS Policies in Supabase
- Middleware in Next.js für Route Protection

---

## Workflow-Priorisierung: Übersicht

| Workflow | MVP Phase | Begründung |
|----------|-----------|------------|
| 1. Stammdaten | ✅ Sprint 1 | Grundlage für alles |
| 2. Fahrerverfügbarkeit | ✅ Sprint 1-2 | Notwendig für Disposition |
| 3. Fahrtenbedarf erfassen | ✅ Sprint 1 | Kern-Workflow Dispatcher |
| 5. Disposition & Zuteilung | ✅ Sprint 1 | Kern-Workflow Dispatcher |
| 10. Rollen & Governance | ✅ Sprint 1 | Sicherheit kritisch |
| 8. Änderungen & Störungen | ✅ Sprint 1 | Basic (stornieren/bearbeiten) |
| 6. Benachrichtigung | ⚠️ Sprint 2 | Wichtig, aber telefonisch möglich zunächst |
| 7. Durchführung der Fahrt | ⚠️ Sprint 2-3 | Driver UI nicht kritisch für Dispatcher-Test |
| 4. Wiederkehrende Fahrten | ❌ Sprint 3-4 | Nice-to-have, manuell machbar |
| 9. Abrechnung | ❌ Phase 4 | Post-MVP |

---

## Produktentscheidungen (dokumentiert)

### 1. Status-Flow: 4 Stati statt 6
**Entscheidung**: `planned → confirmed → in_progress → completed` (+ `cancelled`)
**Begründung**: Einfachheit für MVP, Timestamps geben zusätzliche Info, UI weniger komplex

### 2. Disposition-Modus: Manuell mit Assistenz
**Entscheidung**: Dispatcher wählt Fahrer manuell aus Dropdown, System zeigt Verfügbarkeit farblich
**Begründung**: Volle Kontrolle für Dispatcher, automatische Zuweisung zu komplex für MVP

### 3. Rückfahrt als separate Fahrt
**Entscheidung**: Rückfahrt = eigene Fahrt in DB (verknüpft via `recurrence_group`)
**Begründung**: Einfachere Logik, jede Fahrt = ein Eintrag, später aggregierbar

### 4. Notifications in Sprint 2
**Entscheidung**: Email/SMS erst nach Dispatcher-Workflows fertig
**Begründung**: Telefonische Kommunikation funktioniert für initialen Test, Notifications wichtig für Skalierung

### 5. Keine Self-Service User-Registrierung
**Entscheidung**: Admin legt User manuell in Supabase an
**Begründung**: Geschlossenes System (kein öffentlicher Zugang), Self-Service nice-to-have aber nicht kritisch

---

## Offene Fragen (für nächste Iteration)

1. **Kalender-Komponente**: FullCalendar.js oder custom React Component?
2. **SMS-Provider**: Twilio, MessageBird, oder nur Email zunächst?
3. **Wiederkehrende Fahrten**: RRULE-Standard oder eigene Logik?
4. **Mobile App**: Native (React Native) oder PWA?
5. **Offline-Support**: Fahrer-App muss offline funktionieren?

---

**Nächster Schritt**: Sprint Planning basierend auf diesem Canvas.
