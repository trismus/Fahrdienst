# Benutzerhandbuch für Dispatcher – Fahrdienst

**Version**: 1.0
**Gültig ab**: Production Launch (Milestone 3)
**Sprache**: Deutsch (Schweiz)

---

## Inhaltsverzeichnis

1. [Login](#login)
2. [Dashboard-Übersicht](#dashboard-übersicht)
3. [Stammdaten verwalten](#stammdaten-verwalten)
4. [Fahrt erstellen](#fahrt-erstellen)
5. [Fahrer zuweisen](#fahrer-zuweisen)
6. [Fahrtenliste und Filter](#fahrtenliste-und-filter)
7. [Status und Benachrichtigungen](#status-und-benachrichtigungen)

---

## Login

1. Öffnen Sie Fahrdienst im Browser
2. Geben Sie Ihre **E-Mail-Adresse** und **Passwort** ein
3. Klicken Sie auf **"Anmelden"**
4. Sie werden zum **Dashboard** weitergeleitet

**Hinweis**: Ihr Passwort wurde von einem Administrator per E-Mail zugesandt.

---

## Dashboard-Übersicht

Das Dashboard ist Ihr Kontrollzentrum. Hier sehen Sie auf einen Blick:

### Schnellstatistiken (oben rechts)

- **Nicht zugewiesen**: Anzahl der Fahrten ohne Fahrer-Zuweisung → Klicken Sie darauf, um alle zu bearbeiten
- **Aktiv**: Live-Zähler der gerade unterwegs befindlichen Fahrten
- **Fahrer**: Wie viele Fahrer sind heute verfügbar (z.B. "3/5")

### Aktion-Zone (linke Spalte)

Zeigt bis zu 6 Fahrten, die **noch keinen Fahrer haben**:

| Feld | Bedeutung |
|------|-----------|
| **Uhrzeit** | Abholzeit (z.B. 09:00) |
| **Patient → Ziel** | Name des Patienten und Zielort |
| **Zuweisen-Button** | Klicken Sie, um einem Fahrer zuzuweisen |

Klicken Sie auf **"Noch X weitere anzeigen"**, um alle offenen Zuweisungen zu sehen.

### Aktuelle Fahrten (linke Spalte)

Wenn Fahrer gerade unterwegs sind, sehen Sie diese in der Section **"Aktuell Unterwegs"** mit farbigen Status-Indikatoren:

- **Wartend**: Fahrer wartet noch auf Abholzeitpunkt
- **Zur Abholung**: Fahrer fährt zum Patienten
- **Bei Patient**: Fahrer ist bei dem Patienten angekommen
- **Zum Ziel**: Fahrer ist unterwegs zur Destination
- **Am Ziel**: Fahrer ist angekommen, fahrt wird bald abgeschlossen

### Zeitstrahl Heute (linke Spalte)

Eine visuelle Darstellung der Fahrten über den Tag (08:00 – 18:00):

- **Orange Punkte**: Aktive Fahrten (gerade unterwegs)
- **Hellblau Punkte**: Nicht zugewiesen
- **Blau Punkte**: Zugewiesen
- **Grün Punkte**: Abgeschlossen

Die **senkrechte Linie** zeigt die aktuelle Zeit.

### Diese Woche (rechte Spalte)

Kompakte Wochenübersicht mit den Fahrtenzahlen pro Tag:

- **Heute hervorgehoben**: Blauer Hintergrund
- **Punkte unter der Zahl**: Status-Indikatoren (orange = aktiv, hellblau = nicht zugewiesen)
- Klicken Sie auf einen Tag, um die Fahrtenliste zu filtern

### Fahrer Heute (rechte Spalte)

Liste der Top-5-Fahrer mit Status:

- **Grüner Punkt**: Verfügbar (keine Fahrt aktuell)
- **Orange Punkt**: In Einsatz (fährt gerade)
- **Grauer Punkt**: Abwesend

Klicken Sie auf einen Fahrer, um sein Profil zu sehen (Verfügbarkeiten, Abwesenheiten).

---

## Stammdaten verwalten

### Patienten anlegen

1. Klicken Sie oben links auf das Menü
2. Wählen Sie **"Patienten"** → **"Neu"**
3. Füllen Sie das Formular aus:

| Feld | Erforderlich | Beispiel |
|------|-------------|---------|
| **Name** | Ja | Max Müller |
| **Adresse** | Ja | Hauptstrasse 42, 5000 Aarau (mit Autocomplete) |
| **Telefon** | Nein | +41 62 123 45 67 |
| **Besondere Bedürfnisse** | Nein | Rollstuhl, Sauerstoff, Begleitung |
| **Notizen** | Nein | Klingel funktioniert nicht |

4. Klicken Sie **"Speichern"**

**Adresse-Eingabe**: Tippen Sie die Adresse ein, und es erscheinen Vorschläge. Wählen Sie den korrekten Ort aus der Dropdown-Liste.

**Besondere Bedürfnisse**: Dies wird den Fahrern angezeigt, damit sie sich vorbereiten können.

### Fahrer anlegen

1. Menü → **"Fahrer"** → **"Neu"**
2. Füllen Sie aus:

| Feld | Erforderlich |
|------|-------------|
| **Name** | Ja |
| **E-Mail** | Ja (eindeutig) |
| **Telefon** | Ja |

3. Klicken Sie **"Speichern"**

**Nach dem Speichern**: Ein Administrator wird später einen Login für den Fahrer einrichten.

### Destination/Zielort anlegen

1. Menü → **"Ziele"** → **"Neu"**
2. Füllen Sie aus:

| Feld | Erforderlich | Beispiel |
|------|-------------|---------|
| **Name** | Ja | Kantonsspital Aarau |
| **Adresse** | Ja | Tellstrasse 15, 5001 Aarau |
| **Ankunftsfenster (von)** | Nein | 08:00 |
| **Ankunftsfenster (bis)** | Nein | 09:00 |

3. Klicken Sie **"Speichern"**

**Ankunftsfenster**: Sinnvoll für regelmäßige Termine (z.B. Dialyse Mo/Mi/Fr 08:00-09:00).

### Stammdaten bearbeiten oder löschen

1. Öffnen Sie die entsprechende Liste (Patienten, Fahrer, Ziele)
2. Klicken Sie auf einen Eintrag → **"Bearbeiten"** oder **"Löschen"**
3. Nach Bearbeitung: **"Speichern"**
4. Nach Löschen: Der Eintrag wird als "gelöscht" markiert (bleibt in der DB, wird aber nicht mehr verwendet)

**Löschen ist nur möglich**, wenn keine aktiven Fahrten mit diesem Eintrag verknüpft sind.

---

## Fahrt erstellen

1. Klicken Sie oben rechts auf **"Neue Fahrt"** (oder Dashboard → "Neue Fahrt")
2. Das Formular öffnet sich mit folgenden Schritten:

### Schritt 1: Fahrtdetails

| Feld | Erforderlich | Hinweis |
|------|-------------|--------|
| **Patient** | Ja | Dropdown, nur aktive Patienten |
| **Destination** | Ja | Dropdown, nur aktive Ziele |
| **Abholzeit** | Ja | Datum + Uhrzeit |
| **Ankunftszeit** | Nein | Wird automatisch berechnet, wenn leer |

3. Klicken Sie **"Route berechnen"**

Das System berechnet:
- Fahrtdauer (Google Maps Directions API)
- Fahrtdistanz
- Automatische Ankunftszeit = Abholzeit + Dauer + 5 Min Puffer

### Schritt 2: Rückfahrt (optional)

- **Rückfahrt erforderlich?** Häkchen setzen
- **Rückfahrtzeit angeben** (muss nach Ankunftszeit liegen)

**Hinweis**: Die Rückfahrt wird als **separate Fahrt** gespeichert und erscheint einzeln in der Fahrtenliste.

### Schritt 3: Fahrer zuweisen (optional)

- **Fahrer-Dropdown** zeigt alle verfügbaren Fahrer
- Sie können die Zuweisung auch später machen

Farbcodierung:
- **Grün**: Fahrer ist verfügbar (keine zeitlichen Konflikte)
- **Gelb**: Fahrer hat eine andere Fahrt zur ähnlichen Zeit (Warnung)
- **Grau**: Fahrer ist nicht verfügbar (Abwesend oder kein Availability Block)

### Schritt 4: Speichern

Klicken Sie **"Fahrt erstellen"**

Die Fahrt erhält den Status **"Geplant"** und erscheint:
- Im Dashboard unter "Braucht Zuweisung"
- In der Fahrtenliste
- Wenn ein Fahrer zugewiesen ist, sieht dieser die Fahrt in seiner Liste

---

## Fahrer zuweisen

### Zuweisung bei Fahrt-Erstellung

Siehe Abschnitt "Fahrt erstellen" – Schritt 3.

### Zuweisung später durchführen

1. Öffnen Sie **"Fahrten"** oder das **Dashboard**
2. Klicken Sie auf eine Fahrt ohne Fahrer
3. Klicken Sie auf **"Bearbeiten"** oder den **"Zuweisen"**-Button
4. Wählen Sie einen Fahrer aus dem Dropdown

**Verfügbarkeits-Indikator** hilft Ihnen:
- **Grün**: Sicher verfügbar
- **Gelb**: Warnung – bereits ein anderer Termin
- **Grau**: Nicht verfügbar

5. Klicken Sie **"Speichern"** oder **"Zuweisung bestätigen"**

Die Fahrt wird in den Status **"Bestätigt"** (pending confirmation) oder bleibt **"Geplant"**, bis der Fahrer bestätigt.

### Zuweisung ändern

1. Öffnen Sie die Fahrt
2. Klicken Sie auf **"Fahrer ändern"**
3. Wählen Sie einen neuen Fahrer
4. Klicken Sie **"Speichern"**

Der alte Fahrer wird benachrichtigt, dass die Fahrt einem anderen Fahrer zugewiesen wurde.

### Zuweisung entfernen

1. Öffnen Sie die Fahrt
2. Klicken Sie auf **"Fahrer entfernen"**
3. Die Fahrt ist wieder ohne Fahrer und erscheint unter "Braucht Zuweisung"

---

## Fahrtenliste und Filter

### Fahrtenliste öffnen

Menü → **"Fahrten"** oder Dashboard → **"Kalender"**

### Verfügbare Filter

| Filter | Funktion |
|--------|----------|
| **Datum** | Filtern Sie auf ein bestimmtes Datum (Standard: heute) |
| **Status** | Geplant, Bestätigt, Unterwegs, Abgeschlossen, Storniert |
| **Fahrer** | Wählen Sie einen bestimmten Fahrer oder "Nicht zugewiesen" |
| **Suche** | Text-Suche nach Patient-Name oder Zielort |

### Beispiel-Workflow

1. Sie möchten alle **nicht zugewiesenen Fahrten von morgen** sehen:
   - Datum: Morgen (Pfeiltaste)
   - Fahrer: "Nicht zugewiesen"
   - Klicken Sie **"Filtern"**

2. Sie möchten alle **abgeschlossenen Fahrten von Fahrer "Müller"**:
   - Status: "Abgeschlossen"
   - Fahrer: "Max Müller"
   - Klicken Sie **"Filtern"**

### Tabellenspalten

| Spalte | Inhalt |
|--------|--------|
| **Zeit** | Abholzeit (mit Datum) |
| **Patient** | Patient-Name + Icons (Rollstuhl, Begleitung, etc.) |
| **Von** | Stadt des Patienten |
| **Nach** | Zielort-Name + Stadt |
| **Fahrer** | Name des Fahrers oder "Nicht zugewiesen" (orange) |
| **Status** | Status-Badge (farbig) |
| **Details** | Link zur Fahrt-Detail-Seite |

### Fahrt-Details öffnen

Klicken Sie auf eine Zeile oder auf den **"Details"**-Button:

- **Fahrt-Informationen**: Patient, Ziel, Zeiten, Fahrer
- **Karte**: Strecke zwischen Patient und Ziel mit Distanz/Dauer
- **Bearbeiten**: Ändern Sie Zeit, Fahrer, Notizen
- **Status ändern**: Markieren Sie als abgeschlossen/storniert
- **Löschen/Stornieren**: Fahrt stornieren mit optional Grund

---

## Status und Benachrichtigungen

### Fahrt-Status Erklärung

Jede Fahrt durchläuft einen definierten Status-Fluss:

```
Geplant → Bestätigt → Unterwegs → Abgeschlossen
```

Oder bei Problemen:

```
Geplant/Bestätigt → Storniert
```

| Status | Bedeutung | Aktion durch |
|--------|-----------|------------|
| **Geplant** | Fahrt wurde angelegt, kein Fahrer zugewiesen oder wartend auf Fahrer-Bestätigung | Dispatcher |
| **Bestätigt** | Fahrer hat die Fahrt akzeptiert, bereit zu fahren | Fahrer (über App) |
| **Unterwegs** | Fahrer hat Fahrt gestartet (fährt zur Abholung) | Fahrer (über App) |
| **Abgeschlossen** | Fahrt ist fertig, Patient wurde am Ziel abgesetzt | Fahrer (über App) |
| **Storniert** | Fahrt wurde storniert (z.B. Patient abgesagt, Fahrer krank) | Dispatcher |

### SMS-Benachrichtigungen (automatisch)

Der Fahrer erhält automatisch Benachrichtigungen:

1. **Fahrt zugewiesen**: "Sie haben eine neue Fahrt: 09:00 Max Müller, Aarau → Kantonsspital. Bestätigen oder ablehnen?"
2. **Fahrt gestartet**: "Fahrt gestartet – fahren Sie zu dem Patienten (Ankunft ca. 09:15)"
3. **Patient abgeholt**: "Patient abgeholt – fahren Sie zur Destination (Ankunft ca. 09:45)"
4. **Fahrt abgeschlossen**: "Fahrt abgeschlossen. Danke für deine Hilfe!"

**Patient und Destination** werden auch benachrichtigt:
- **Patient**: Wenn die Fahrt gestartet wird ("Fahrer kommt in ca. 10 Min")
- **Destination**: Wenn der Patient unterwegs ist ("Patient kommt in ca. 30 Min")

---

## Häufig gestellte Fragen

### Kann ich eine Fahrt mehrfach wiederkehrend anlegen (z.B. 2× wöchentlich)?

**Aktuell (MVP)**: Nein. Sie müssen jede Fahrt einzeln anlegen.
**Geplant (Phase 2)**: Ja, es wird eine "Wiederholung"-Funktion geben.

### Was passiert, wenn der Fahrer die Fahrt ablehnt?

Die Fahrt bekommt den Status "Abgelehnt" oder wird wieder "Nicht zugewiesen". Sie können dann einen anderen Fahrer zuweisen.

### Kann ich eine laufende Fahrt ändern?

Begrenzt: Sie können die Notizen ändern, aber nicht die Zeiten oder den Fahrer (wenn bereits unterwegs). Stornieren Sie die Fahrt ggf. und erstellen Sie eine neue.

### Wie kann ich das System offline nutzen?

**Aktuell**: Das System benötigt Internetverbindung. Es gibt keine Offline-Funktionalität.

### Wer sieht die SMS-Nachrichten?

Nur der zugewiesene Fahrer und der Patient/die Destination (bei bestimmten Events). Sie als Dispatcher sehen die SMS nicht, aber alle Fahrt-Status in der Web-App.

---

## Support & Kontakt

Bei Fragen oder technischen Problemen:

- **Administrator**: [kontakt@fahrdienst.ch]
- **Dokumentation**: Siehe Projektdokumentation im Wiki

**Versionsverlauf**:
- **v1.0** (2026-02): Production Launch – MVP mit Dispatcher-Dashboard, Stammdaten, Fahrt-CRUD, Disposition

---

**Hinweis**: Dieses Handbuch wird regelmäßig aktualisiert. Aktuelle Version: siehe oberes Datum.
