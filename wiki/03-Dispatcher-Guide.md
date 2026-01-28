# Benutzerhandbuch: Dispatcher

Eine praktische Schritt-für-Schritt Anleitung für Disponenten zur Planung und Verwaltung von Patientenfahrten.

---

## Überblick

Als Dispatcher ist deine Hauptaufgabe, Fahrten zu planen und Fahrern zuzuweisen. Die Fahrdienst App hilft dir dabei, alle Informationen zentral zu organisieren.

**Hauptfunktionen:**
- Patienten, Fahrer und Ziele verwalten
- Fahrten anlegen und disponieren
- Fahrer mit Verfügbarkeitsprüfung zuweisen
- Kalender-Übersicht aller Fahrten
- Live-Status verfolgen

---

## Login

1. Gehe auf die Startseite: `http://localhost:3000` (oder deine Produktions-URL)
2. Gib deine Email ein: `test-dispatcher@example.com`
3. Gib dein Passwort ein
4. Klick **Login**

Du wirst zum Dispatcher-Dashboard weitergeleitet.

---

## Dashboard (Übersicht)

Das Dashboard zeigt:

### Kalender-Ansicht
- **Wochenkalender** mit allen Fahrten (Mo-Fr, 08:00-18:00)
- **Farben nach Status:**
  - Grau: `planned` (geplant, noch nicht bestätigt)
  - Gelb: `confirmed` (bestätigt durch Fahrer)
  - Grün: `in_progress` (Fahrer ist unterwegs)
  - Dunkelgrün: `completed` (abgeschlossen)

### Live-Statistiken (rechts oben)
- **Aktive Fahrten**: Anzahl `in_progress`
- **Heute bestätigt**: Anzahl `confirmed` heute
- **Diese Woche**: Gesamt-Anzahl

### Fahrtenliste (unten)
- **Filter**: Nach Status, Fahrer, Datum
- **Such-Feld**: Nach Patient, Fahrer, Destination suchen

---

## Stammdaten verwalten

### Patienten

#### Patient anlegen

1. **Sidebar** → **Patienten**
2. Button **+ Neu** oben rechts
3. Formular ausfüllen:
   - **Name** (Pflichtfeld): Z.B. "Max Muster"
   - **Adresse** (Pflichtfeld):
     - Tippe eine Adresse ein
     - Google Places zeigt Vorschläge
     - Wähle die richtige Adresse
   - **Telefon** (optional): "+41791234567"
   - **Besondere Bedürfnisse** (optional):
     - Rollstuhl?
     - Sauerstoff?
     - Begleitperson erforderlich?
   - **Notizen** (optional): Z.B. "Patient möchte immer pünktlich ankommen"
4. Klick **Speichern**

Der Patient ist jetzt in der Liste und verfügbar für Fahrten.

#### Patient bearbeiten

1. **Patienten-Liste** → Klick auf Patient
2. **Bearbeiten** Button
3. Felder ändern
4. **Speichern**

#### Patient löschen

1. **Patienten-Liste** → Klick auf Patient
2. **Löschen** Button
3. Bestätigung: "Wirklich löschen?"

**Hinweis:** Der Patient wird nicht wirklich gelöscht, sondern als `deleted` markiert. Die Fahrts-Historie bleibt erhalten.

---

### Fahrer

#### Fahrer anlegen

1. **Sidebar** → **Fahrer**
2. Button **+ Neu**
3. Formular:
   - **Name** (Pflichtfeld): Z.B. "Hans Müller"
   - **Email** (Pflichtfeld): "hans.mueller@example.com"
   - **Telefon** (Pflichtfeld): "+41791234567"
   - **Verfügbarkeit** (optional später):
     - Klick auf Verfügbarkeits-Tab
     - Wähle die verfügbaren 2h-Blöcke
4. **Speichern**

#### Fahrer-Verfügbarkeit anschauen

1. **Fahrer-Liste** → Klick auf Fahrer
2. Tab **Verfügbarkeit**
3. Siehst du:
   - **Grid**: Mo-Fr, 08:00-18:00 in 2h-Blöcken
   - **Grün** = Verfügbar
   - **Grau** = Nicht verfügbar
   - **Abwesenheiten** (unten): Liste der Urlaube/Krankheiten

**Hinweis:** Du kannst als Dispatcher die Verfügbarkeit nur anschauen. Der Fahrer ändert seine Verfügbarkeit selbst über die Fahrer-App.

#### Fahrer deaktivieren

1. **Fahrer-Liste** → Klick auf Fahrer
2. **Deaktivieren** Button
3. Der Fahrer kann sich nicht mehr anmelden

---

### Ziele (Destinations)

#### Ziel anlegen

1. **Sidebar** → **Ziele**
2. Button **+ Neu**
3. Formular:
   - **Name** (Pflichtfeld): Z.B. "Kantonsspital Zürich"
   - **Adresse** (Pflichtfeld): Tippe ein, wähle aus Google Places
   - **Ankunftsfenster** (optional):
     - **Von**: Z.B. 08:00 (wenn Ziel spezielle Öffnungszeiten hat)
     - **Bis**: Z.B. 18:00
4. **Speichern**

Das Ankunftsfenster ist hilfreich für:
- Dialyse-Zentren (z.B. nur 08:00-09:00)
- Praxen mit Öffnungszeiten
- Spitäler mit Besuchszeiten

---

## Fahrten verwalten

### Fahrt anlegen

1. **Sidebar** → **Fahrten**
2. Button **+ Neu** oben rechts
3. Formular ausfüllen:

#### Abschnitt 1: Fahrt-Basics
- **Patient** (Pflichtfeld): Dropdown, suche und wähle Patient
- **Destination** (Pflichtfeld): Dropdown, suche und wähle Ziel
- **Abholzeit** (Pflichtfeld):
  - Wähle Datum (heute, morgen, oder zukünftig)
  - Wähle Uhrzeit (z.B. 08:30)
- **Ankunftszeit** (optional):
  - Wenn leer: System berechnet automatisch (Fahrtdauer + 5min Puffer)
  - Wenn manuell eingegeben: Das Feld wird benutzt

#### Abschnitt 2: Rückfahrt (Optional)
- **Rückfahrt?**: Checkbox an/aus
- Wenn an:
  - **Rückfahrtzeit**: Wann soll Fahrer Patient abholen?
  - Eine separate Fahrt wird automatisch erstellt

#### Abschnitt 3: Fahrer & Notizen
- **Fahrer** (optional):
  - Dropdown mit allen Fahrern
  - **Grün** = Verfügbar (Availability Block passt, nicht abwesend)
  - **Gelb** = Warnung (andere Fahrt zur ähnlichen Zeit)
  - **Grau** = Nicht verfügbar
  - Wenn nicht zugewiesen jetzt: Kann später zugewiesen werden
- **Notizen** (optional): Spezielle Anweisungen
  - Z.B. "Patient hat Krücken, langsam fahren"
  - Z.B. "Klingelton funktioniert nicht, anklopfen"

4. Klick **Speichern**

Die Fahrt wird angelegt mit Status **`planned`** (geplant).

**Route wird automatisch berechnet:**
- Google Maps berechnet Fahrtdauer
- Ankunftszeit wird berechnet (falls nicht manuell eingegeben)
- Distanz wird gespeichert

---

### Fahrt bearbeiten

1. **Fahrten-Liste** → Klick auf Fahrt (oder Doppelklick im Kalender)
2. Button **Bearbeiten**
3. Felder ändern (gleich wie beim Anlegen)
4. Klick **Speichern**

**Besonderheit:** Falls Fahrer zugewiesen ist und sich Zeit ändert → Warnung wenn Konflikt mit anderer Fahrt.

---

### Fahrt stornieren

1. **Fahrten-Liste** → Klick auf Fahrt
2. Button **Stornieren**
3. Modal: "Grund für Stornierung?" (optional)
   - Z.B. "Patient hat abgesagt"
   - Z.B. "Fahrer krank"
4. **Bestätigen**

Die Fahrt bekommt Status **`cancelled`** und wird nicht mehr im Kalender angezeigt.

---

### Fahrer zuweisen / ändern

#### Fahrt einer verfügbaren Fahrer zuweisen

1. **Fahrt öffnen** → Button **Fahrer zuweisen**
2. Dropdown öffnet sich
3. **Grüne Fahrer** (verfügbar) können direkt zugewiesen werden
4. Klick auf Fahrer → Fahrt wird zugewiesen
5. Status bleibt **`planned`** (warten auf Bestätigung)

#### Fahrer austauschen (bereits zugewiesene Fahrt)

1. **Fahrt öffnen** → Abschnitt "Fahrer"
2. Button **Fahrer ändern**
3. Neuen Fahrer aus Dropdown wählen
4. **Speichern**

Der neue Fahrer erhält eine Benachrichtigung.

#### Fahrer entfernen

1. **Fahrt öffnen** → Button **Fahrer entfernen**
2. `driver_id` ist jetzt leer
3. Fahrt kann später erneut zugewiesen werden

---

## Kalender nutzen

### Navigation

- **Pfeile** (< >): Zur nächsten/vorherigen Woche
- **Heute**: Springt zur aktuellen Woche
- Die aktuelle Woche hat Hintergrund-Markierung

### Fahrt anzeigen

- **Klick auf Fahrt-Card** im Kalender → Detailansicht
- **Doppelklick** → Bearbeitungs-Formular

### Filter & Such-Feld (unter Kalender)

- **Status-Filter**: Nur geplante, bestätigte, in_progress, abgeschlossene Fahrten anzeigen
- **Fahrer-Filter**: Alle Fahrten eines bestimmten Fahrers
- **Such-Feld**: Patient-Name, Fahrer-Name, Adresse

---

## Benachrichtigungen & Status

### Fahrt-Status-Flow

```
planned (geplant)
   ↓ (Fahrer klickt "Bestätigen")
confirmed (bestätigt)
   ↓ (Fahrer klickt "Fahrt starten" am Tag der Fahrt)
in_progress (unterwegs)
   ↓ (Fahrer klickt "Fahrt beendet")
completed (abgeschlossen)
```

Zusätzlich: `cancelled` (storniert, jederzeit möglich)

### Benachrichtigungen erhalten

Du wirst automatisch benachrichtigt (per Email oder Notification in der App), wenn:
- **Fahrer bestätigt eine Fahrt**: Status ändert sich zu `confirmed`
- **Fahrer lehnt eine Fahrt ab**: Du musst neu zuweisen
- **Fahrer startet eine Fahrt**: Status ändert sich zu `in_progress`
- **Fahrt abgeschlossen**: Status ändert sich zu `completed`

### Live-Updates

Das Dashboard wird **automatisch aktualisiert**, wenn:
- Ein Fahrer eine Fahrt bestätigt
- Eine Fahrt startet
- Eine Fahrt abgeschlossen wird

Du siehst den Status-Change **sofort** im Kalender (keine Seite neuladen notwendig).

---

## Häufige Aufgaben

### Aufgabe: Neue Dialyse-Serie planen

1. Patient: "Mina Mustafa braucht 2x die Woche Fahrt zum Dialyse-Zentrum"
2. **Patienten:** Mina Mustafa hinzufügen
3. **Ziele:** "Dialyse-Zentrum Zürich" hinzufügen (mit Ankunftsfenster 08:00-09:00)
4. **Fahrten:**
   - Fahrt 1: Montag 08:30 → Mina → Dialyse
   - Fahrt 2: Montag 12:30 → Mina → Zuhause
   - Fahrt 3: Mittwoch 08:30 → Mina → Dialyse
   - Fahrt 4: Mittwoch 12:30 → Mina → Zuhause
5. Alle 4 Fahrten einem verfügbaren Fahrer zuweisen
6. Fahrer erhält Benachrichtigung für jede Fahrt

**Hinweis:** Im MVP wird jede Fahrt einzeln angelegt (keine Automatische Wiederholung).

---

### Aufgabe: Fahrer ausfallend ersetzen

Fahrer "Hans Müller" ruft an: "Ich bin krank, kann heute nicht fahren"

1. **Fahrten-Filter:** Status=`planned` oder `confirmed`, Fahrer="Hans Müller", Datum=heute
2. Für jede Fahrt:
   - **Fahrt öffnen** → **Fahrer ändern**
   - Einen anderen **grünen** (verfügbaren) Fahrer wählen
   - **Speichern**
3. Die neuen Fahrer erhalten Benachrichtigungen

---

### Aufgabe: Fahrt verschieben

Patient ruft an: "Könnte die Fahrt eine Stunde später sein?"

1. **Fahrt öffnen** → **Bearbeiten**
2. **Abholzeit** ändern (z.B. 08:30 → 09:30)
3. **Ankunftszeit** wird automatisch neu berechnet
4. **Speichern**

Der Fahrer erhält eine Update-Benachrichtigung.

---

## Tipps & Tricks

### Adress-Eingabe schneller machen
- Google Places Autocomplete: Tippe nur die erste Straßenzahl / Postleitzahl
- Z.B. "8000" → zeigt alle Adressen in Zürich
- Z.B. "Bahnhof" → zeigt alle Bahnhöfe in der Nähe

### Verfügbarkeits-Check nutzen
- **Grüne Fahrer** sind am sichersten
- **Gelbe Fahrer** warnen dich vor Konflikten
- Klick trotzdem drauf wenn Notfall → System zeigt Warnung

### Kalender-Übersicht
- Jeden Montag: Neue Woche planen
- Mittwochs: Shortfalls prüfen (sind alle Fahrten zugewiesen?)
- Freitags: Statistiken anschauen (wie viele Fahrten diese Woche?)

### Massenoperationen (später in Backlog)
- Mehrere Fahrten auf einmal zuweisen
- CSV-Import für Patienten
- Vorlagen für häufige Routen

---

## Support & Hilfe

**In der App:**
- Jede Seite hat einen **Hilfe-Icon** (?) → Zeigt Tooltips

**In der Dokumentation:**
- `/docs/workflow-canvas.md` → Detaillierte Workflows
- `/docs/README.md` → Dokumentations-Index

**Fragen im Team:**
- GitHub Issues erstellen
- Slack/Discord Kanal

---

## Next Steps

1. **Installation fertig?** → Gehe zu **[02-Quick-Start](/wiki/02-Quick-Start.md)**
2. **Mehr technische Details?** → **[05-Developer-Guide](/wiki/05-Developer-Guide.md)**
3. **Fahrer-App verstehen?** → **[04-Driver-Guide](/wiki/04-Driver-Guide.md)**

---

**Viel Erfolg beim Disponieren! 🚗**
