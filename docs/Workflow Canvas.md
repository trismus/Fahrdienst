# Fahrdienst App – Workflow Canvas

Dieses Canvas beschreibt die **zentralen Workflows** der Fahrdienst App in einer strukturierten, projekt- und backlog-tauglichen Form. Es dient als gemeinsame Referenz für Product (Greg), Design (Kim) und Engineering (Peter).

---

## 1. Stammdaten-Workflow (Master Data)

**Ziel**
Sicherstellen, dass alle relevanten Basisdaten sauber, konsistent und jederzeit verfügbar sind.

**Akteur**
Operator / Admin

**Workflow**

1. Operator erfasst oder aktualisiert **Patienten**, **Fahrer** oder **Ziele**
2. Pflichtfelder werden validiert (Name, Adresse, Kontakt)
3. Datensatz wird als *aktiv* gespeichert
4. Änderungen werden versioniert (created_at / updated_at)
5. Datensätze können deaktiviert, aber nicht gelöscht werden

**Output**

* Verlässliche Stammdaten als Grundlage für Planung

**Risiken bei Fehlen**

* Unplanbare Fahrten
* Fehlerhafte Kommunikation

---

## 2. Fahrerverfügbarkeits-Workflow

**Ziel**
Abbildung der grundsätzlichen Einsatzfähigkeit von Fahrern.

**Akteur**
Operator

**Workflow**

1. Operator wählt Fahrer
2. Operator definiert Verfügbarkeitsblöcke (z. B. Mo–Fr, 08:00–18:00 in 2h-Slots)
3. System speichert Zeitblöcke unabhängig von konkreten Fahrten
4. Änderungen wirken nur auf zukünftige Planungen

**Output**

* Planbare Zeitfenster pro Fahrer

**Hinweis**
Keine Feinplanung, keine Ferienlogik im MVP – nur planbare Realität.

---

## 3. Fahrtenbedarf erfassen (Anfrage-Workflow)

**Ziel**
Strukturierte Erfassung eines Transportbedarfs.

**Akteur**
Operator

**Workflow**

1. Eingang eines Bedarfs (Telefon, Mail, manuell)
2. Operator wählt Patient
3. Operator wählt Ziel
4. Operator definiert:

   * Datum
   * Termin- oder Abholzeit
   * Richtung (Hin / Rück / Hin+Rück)
5. Optionale Zusatzinfos (Rollstuhl, Begleitung, Abholhinweis)
6. Fahrt erhält Status **Ungeplant**

**Output**

* Fahrt(en) als planbare Einheiten

---

## 4. Wiederkehrende Fahrten (Serien-Workflow)

**Ziel**
Effiziente Abbildung regelmässiger Fahrten (z. B. Dialyse).

**Akteur**
Operator

**Workflow**

1. Operator aktiviert „wiederkehrend“
2. Definition der Regel:

   * Wochentage
   * Zeitraum (Start / Ende)
   * Uhrzeit
3. System erzeugt:

   * eine Serien-Definition
   * einzelne Fahrteninstanzen
4. Instanzen sind einzeln änderbar

**Output**

* Konsistente Serien + flexible Einzelbearbeitung

---

## 5. Disposition & Zuteilung (Kernworkflow)

**Ziel**
Effiziente Zuordnung von Fahrten zu Fahrern.

**Akteur**
Operator

**Workflow**

1. Operator öffnet Tages- oder Wochenansicht
2. System zeigt:

   * ungeplante Fahrten
   * verfügbare Fahrer-Slots
3. Operator weist Fahrt einem Fahrer zu
4. Abholzeit wird finalisiert
5. Fahrt erhält Status **Geplant**

**Output**

* Klar disponierte Fahrten

---

## 6. Fahrerbenachrichtigung & Bestätigung

**Ziel**
Verbindliche Zusage durch den Fahrer.

**Akteur**
System → Fahrer → Operator

**Workflow**

1. System informiert Fahrer über neue Fahrt
2. Fahrer sieht:

   * Zeit
   * Patient (minimal)
   * Ziel
3. Fahrer bestätigt oder lehnt ab
4. Statuswechsel:

   * Bestätigt
   * Abgelehnt
5. Operator reagiert bei Ablehnung

**Output**

* Verbindliche Planung

---

## 7. Durchführung der Fahrt

**Ziel**
Nachvollziehbare Abwicklung am Einsatztag.

**Akteur**
Fahrer

**Statusfluss**
Geplant → Bestätigt → Unterwegs → Abgeholt → Angekommen → Abgeschlossen

**Sonderfälle**

* No-Show
* Abgebrochen
* Verspätet

---

## 8. Änderungen & Störungen

**Ziel**
Alltagstauglicher Umgang mit Abweichungen.

**Akteur**
Operator

**Workflow**

* Terminänderung
* Fahrerausfall
* Patient nicht erreichbar
* Zieländerung

System unterstützt:

* Neuplanung
* Re-Zuteilung
* Status- und Kommentarhistorie

---

## 9. Abrechnung & Nachbearbeitung (Phase 2)

**Ziel**
Finanzielle Nachvollziehbarkeit.

**Workflow (später)**

* Fahrt abschliessen
* Kosten erfassen
* Quittung hochladen
* Auswertungen generieren

---

## 10. Rollen & Governance (Querschnitt)

**Rollen**

* Admin
* Operator
* Fahrer

**Prinzipien**

* Fahrer sieht nur eigene Fahrten
* Operator sieht alles
* Vollständige Änderungsnachvollziehbarkeit

---

**Dieses Canvas ist die verbindliche Grundlage für:**

* Produktentscheidungen
* UX-Design
* Technische Implementierung

---

# GitHub Backlog – Dispatcher Workflow (Epics & User Stories)

Dieses Backlog ist direkt aus dem Dispatcher-Workflow abgeleitet und **MVP-fokussiert**. Jede Story ist umsetzbar, testbar und klar abgrenzbar.

---

## EPIC 1 – Stammdaten verwalten (Patienten, Ziele, Fahrer)

### Story 1.1 – Patient anlegen und bearbeiten

**Als** Operator
**möchte ich** Patienten erfassen und bearbeiten können
**damit** Fahrten korrekt geplant werden können.

**Acceptance Criteria**

* Pflichtfelder: Vorname, Nachname, Telefon, Adresse
* Optionale Felder: Abholhinweise, Mobilität, Notizen, Notfallkontakt
* Patient kann aktiviert/deaktiviert werden (kein Hard-Delete)
* Änderungen sind sofort für neue Fahrten wirksam

---

### Story 1.2 – Ziel (Spital/Arzt/Therapie) anlegen und bearbeiten

**Als** Operator
**möchte ich** medizinische Ziele erfassen und pflegen
**damit** Fahrten eindeutig zuordenbar sind.

**Acceptance Criteria**

* Pflichtfelder: Name, Typ, Adresse
* Optionale Felder: Abteilung, Kontakt, Hinweise
* Ziel kann deaktiviert werden
* Zieländerungen wirken nur auf zukünftige Fahrten

---

### Story 1.3 – Fahrer anlegen und bearbeiten

**Als** Operator
**möchte ich** Fahrer verwalten können
**damit** ich sie in der Planung berücksichtigen kann.

**Acceptance Criteria**

* Pflichtfelder: Name, Telefon
* Optionale Felder: Fahrzeugtyp, Kennzeichen, Notizen
* Fahrer kann deaktiviert werden

---

## EPIC 2 – Fahrerverfügbarkeit pflegen

### Story 2.1 – Verfügbarkeitsblöcke definieren

**Als** Operator
**möchte ich** Zeitblöcke für Fahrer definieren
**damit** ich nur realistisch verfügbare Fahrer einplane.

**Acceptance Criteria**

* Rasteransicht (Mo–Fr, 08:00–18:00, 2h-Blöcke)
* Blöcke können aktiviert/deaktiviert werden
* Änderungen gelten nur für zukünftige Planungen

---

## EPIC 3 – Fahrten erfassen

### Story 3.1 – Einzelne Fahrt erfassen

**Als** Operator
**möchte ich** einen Fahrtenbedarf erfassen können
**damit** er disponiert werden kann.

**Acceptance Criteria**

* Auswahl von Patient und Ziel
* Datum, Zeit, Richtung (Hin/Rück/Hin+Rück)
* Zusatzinformationen möglich
* Status nach Erstellung: Ungeplant

---

### Story 3.2 – Wiederkehrende Fahrten anlegen

**Als** Operator
**möchte ich** wiederkehrende Fahrten definieren
**damit** ich Serien nicht manuell erfassen muss.

**Acceptance Criteria**

* Regel: Wochentage, Zeitraum, Uhrzeit
* System erzeugt einzelne Fahrteninstanzen
* Jede Instanz ist separat bearbeitbar

---

## EPIC 4 – Disposition & Zuteilung

### Story 4.1 – Ungeplante Fahrten anzeigen

**Als** Operator
**möchte ich** alle ungeplanten Fahrten sehen
**damit** ich sie priorisieren kann.

**Acceptance Criteria**

* Liste filterbar nach Datum, Ziel, Patient
* Klare visuelle Kennzeichnung „Ungeplant“

---

### Story 4.2 – Fahrt einem Fahrer zuweisen

**Als** Operator
**möchte ich** eine Fahrt einem verfügbaren Fahrer zuweisen
**damit** sie durchgeführt werden kann.

**Acceptance Criteria**

* Nur Fahrer mit passender Verfügbarkeit auswählbar
* Abholzeit kann gesetzt oder angepasst werden
* Status wechselt zu „Geplant“

---

## EPIC 5 – Dispatch & Bestätigung

### Story 5.1 – Fahrer automatisch benachrichtigen

**Als** System
**möchte ich** den Fahrer über eine geplante Fahrt informieren
**damit** er sie bestätigen kann.

**Acceptance Criteria**

* Versand bei Statuswechsel zu „Geplant“
* Nachricht enthält Zeit, Patient, Ziel, Hinweise

---

### Story 5.2 – Fahrt bestätigen oder ablehnen

**Als** Fahrer
**möchte ich** eine Fahrt annehmen oder ablehnen können
**damit** die Planung verbindlich wird.

**Acceptance Criteria**

* Annehmen → Status „Bestätigt"
* Ablehnen → Status „Abgelehnt" mit Grund
* Operator wird informiert

---

## EPIC 6 – Änderungen & Re-Planning

### Story 6.1 – Fahrt neu disponieren nach Ablehnung

**Als** Operator
**möchte ich** eine abgelehnte Fahrt neu zuteilen
**damit** sie trotzdem durchgeführt wird.

**Acceptance Criteria**

* Fahrt kehrt in Status „Ungeplant“ zurück
* Neuer Fahrer kann zugewiesen werden

---

## EPIC 7 – Durchführung & Abschluss

### Story 7.1 – Fahrtstatus führen

**Als** Fahrer
**möchte ich** den Status einer Fahrt aktualisieren
**damit** der Operator den Fortschritt sieht.

**Acceptance Criteria**

* Statusfluss: Bestätigt → Unterwegs → Abgeholt → Angekommen → Abgeschlossen
* Sonderstatus: No-Show, Abgebrochen

---

**Dieses Backlog ist MVP-tauglich und vollständig genug, um:**

* direkt in GitHub Issues importiert zu werden
* Sprint 1–3 zu planen
* Design- und Implementationsarbeit zu synchronisieren
