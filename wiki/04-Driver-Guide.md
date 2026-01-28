# Benutzerhandbuch: Fahrer

Eine praktische Anleitung für Fahrer zum Nutzen der mobilen App.

---

## Überblick

Die Fahrdienst-App ist für Fahrer optimiert, um Fahrten zu verwalten. Du kannst:
- Deine zugewiesenen Fahrten sehen
- Fahrten bestätigen oder ablehnen
- Deine Verfügbarkeit einstellen
- Status während der Fahrt aktualisieren
- Benachrichtigungen erhalten

---

## Login

1. Gehe auf die Fahrer-Seite: `http://yourdomain.com/driver/rides`
2. Gib deine Email ein: (z.B. `hans.mueller@example.com`)
3. Gib dein Passwort ein
4. Klick **Login**

Du wirst zu deinen Fahrten weitergeleitet.

**Hinweis:** Der Admin erzeugt deinen Account. Bei erstem Login erhältst du ein Email mit temporärem Passwort.

---

## Fahrten-Übersicht ("Meine Fahrten")

### Haupt-Ansicht

Nach dem Login siehst du eine Liste deiner Fahrten:

| Spalte | Bedeutung |
|--------|-----------|
| **Patient** | Name des Patienten |
| **Ziel** | Wohin fahren wir? |
| **Abholzeit** | Wann Abholen? |
| **Status** | Bestätigt? In Fahrt? |
| **Aktion** | Buttons zum Verwalten |

### Filter & Sortierung

**Oben links: Filter**
- **Zeitraum**: Diese Woche, nächste Woche, alle
- **Status**: Alle, bestätigt, geplant, in Fahrt, abgeschlossen

**Oben rechts: Sortierung**
- Nach Uhrzeit
- Nach Patient
- Nach Status

---

## Fahrt bestätigen / Ablehnen

### Fahrt öffnen

1. Klick auf eine Fahrt in der Liste
2. **Detail-Ansicht** öffnet sich:
   - Patient-Name + Adresse
   - Abholzeit + Ankunftszeit
   - Ziel + Adresse
   - Notizen vom Dispatcher
   - Karte mit Route (falls verfügbar)

### Fahrt bestätigen

1. **Button "Fahrt bestätigen"** (grün)
2. Modal: "Bist du sicher?"
3. Klick **Ja, bestätigen**

Status ändert sich von `planned` → `confirmed`

**Was passiert:**
- Der Dispatcher sieht, dass du bestätigt hast
- Die Fahrt wird dir reserviert
- Du erhältst eine Bestätigungs-Benachrichtigung

### Fahrt ablehnen

1. **Button "Fahrt ablehnen"** (rot)
2. Modal: "Grund für Ablehnung?" (optional)
   - "Krankheit"
   - "Zeitkonflikt"
   - "Andere persönliche Gründe"
3. Klick **Ablehnen**

Status bleibt `planned`, Dispatcher muss einen anderen Fahrer zuweisen.

---

## Fahrt durchführen

### Am Tag der Fahrt

**Morgens:**
1. Öffne deine Fahrer-App
2. Filter auf **"Heute"**
3. Siehst du alle Fahrten für heute (nur bestätigte Fahrten)

### Fahrt starten

Wenn du losfahren möchtest zur Patient-Adresse:
1. Fahrt öffnen
2. **Button "Fahrt starten"**
3. Status ändert sich zu `in_progress`
4. Timestamp: Der System speichert, wann du gestartet bist

### An der Patient-Adresse angekommen

1. Fahrt Detail-Ansicht
2. **Button "Patient abgeholt"**
3. System speichert den Abhol-Zeitpunkt

### Fahrt abschließen

Nach Ankunft am Ziel:
1. Fahrt Detail-Ansicht
2. **Button "Fahrt abgeschlossen"**
3. Status wechselt zu `completed`

Die Fahrt verschwindet aus "Aktive Fahrten" und wird in "Abgeschlossene Fahrten" verschoben.

---

## Verfügbarkeit verwalten

### Verfügbarkeits-Grid

1. **Sidebar** → **"Meine Verfügbarkeit"** (oder "Availability")
2. Grid angezeigt:
   - **Spalten**: Montag bis Freitag
   - **Reihen**: Zeitblöcke (08-10, 10-12, 12-14, 14-16, 16-18)

### Block aktivieren / deaktivieren

- **Grüner Block**: Du bist verfügbar
- **Grauer Block**: Du bist nicht verfügbar

1. Klick auf einen Block
2. Farbe ändert sich (grau ↔ grün)
3. System speichert automatisch

**Beispiel:**
- Montag 08-10: Grün → Du bist verfügbar
- Montag 10-12: Grau → Du bist nicht verfügbar
- Dienstag 08-10: Grün → Du bist verfügbar
- etc.

**Hinweis:** Diese Blöcke sind deine Arbeitszeiten. Der Dispatcher sieht, wann du arbeitest, und weist dir nur während dieser Zeiten Fahrten zu.

---

## Abwesenheiten verwalten

Wenn du Urlaub, Krankheit oder andere Abwesenheit hast:

### Abwesenheit hinzufügen

1. **Sidebar** → **"Abwesenheiten"**
2. Button **"+ Neu"**
3. Formular:
   - **Von**: Startdatum (z.B. 10.02.2026)
   - **Bis**: Enddatum (z.B. 15.02.2026)
   - **Grund** (optional): "Urlaub", "Krankheit", "Privat"
4. **Speichern**

Der Dispatcher sieht, dass du abwesend bist, und weist dir keine Fahrten zu.

### Abwesenheit bearbeiten

1. **Abwesenheiten-Liste** → Klick auf Abwesenheit
2. **Button "Bearbeiten"**
3. Daten ändern
4. **Speichern**

### Abwesenheit löschen

1. **Abwesenheiten-Liste** → Klick auf Abwesenheit
2. **Button "Löschen"**
3. **Bestätigen**

---

## Benachrichtigungen

### Wann erhältst du Benachrichtigungen?

- **Email:** Wenn dir eine neue Fahrt zugewiesen wird
  - Enthält: Patient-Name, Adresse, Abholzeit, Ziel
  - Buttons: "Bestätigen" oder "Ablehnen" (in App)

- **SMS:** Wenn verfügbar (falls Dispatcher das aktiviert hat)
  - Kurznachricht: "Neue Fahrt: Max M. von Bahnhof zu Spital um 08:30"

- **In-App Notification:** Sofort in der App (falls offen)

### Benachrichtigungen verwalten

Später im Backlog:
- Benachrichtigungen stummschalten
- Nur bestimmte Typen erhalten
- Stille Zeiten einstellen

---

## Tipps & Tricks

### Offline arbeiten

Die App funktioniert auch ohne Internet-Verbindung:
- Deine Fahrten werden lokal gespeichert
- Status-Updates werden synchronisiert, wenn du wieder online bist

**Hinweis:** Noch nicht vollständig implementiert. Kontaktiere den Admin, falls Probleme.

### Bilder bei Problemen

Wenn ein Problem während der Fahrt auftritt:
1. Fahrt öffnen
2. Button **"Problem melden"** (noch nicht in MVP)
3. Foto oder Notiz hinzufügen
4. Der Dispatcher erhält eine Benachrichtigung

**Status**: Kommt in Sprint 4+

### GPS-Tracking

Der Dispatcher kann deine Position **nicht** live sehen (datenschutz-gemäß). Er sieht nur:
- Wann du die Fahrt gestartet hast
- Wann du Patient abgeholt hast
- Wann du angekommen bist

---

## Häufige Fragen

### F: Was bedeutet "planned"?
A: Die Fahrt wurde dir zugewiesen, aber du hast sie noch nicht bestätigt.

### F: Was passiert, wenn ich eine Fahrt ablehne?
A: Der Dispatcher wird benachrichtigt und muss einen anderen Fahrer suchen.

### F: Kann ich meine Verfügbarkeit täglich ändern?
A: Ja, jederzeit. Der Dispatcher sieht die Änderung sofort.

### F: Was wenn ich zu spät bin?
A: Klick "Fahrt starten", wenn du tatsächlich losfährst. Das System speichert die echte Uhrzeit.

### F: Kann ich eine bestätigte Fahrt noch ablehnen?
A: Ja, jederzeit. Klick "Fahrt stornieren" in der Detail-Ansicht. Der Dispatcher wird benachrichtigt.

---

## Sicherheit & Datenschutz

- **Passwort**: Ändere dein Passwort regelmäßig
- **Login-Daten**: Gib sie niemand anderem
- **GPS**: Deine genaue Position wird nicht trackiert (nur Timestamps)
- **Daten**: Alle Informationen sind verschlüsselt in der Datenbank

---

## Support & Hilfe

**In der App:**
- Hilfe-Icon (?) auf jeder Seite

**Fragen zum Team:**
- Dispatcher kontaktieren
- Oder: Telefon/SMS an Admin

**Feedback?**
- GitHub Issues (falls du zugang hast)
- Oder: Email an Dispatcher

---

## Next Steps

- **Alle Features verstehen?** → **[03-Dispatcher-Guide](/wiki/03-Dispatcher-Guide.md)** (für Dispatcher)
- **Installation?** → **[01-Installation](/wiki/01-Installation.md)**
- **Tech Details?** → **[05-Developer-Guide](/wiki/05-Developer-Guide.md)**

---

**Alles klar? Dann leg los! 🚗**
