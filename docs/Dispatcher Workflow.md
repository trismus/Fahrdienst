Dispatcher Workflow (Epics & User Stories)

Dieses Backlog ist direkt aus dem Dispatcher-Workflow abgeleitet und MVP-fokussiert. Jede Story ist umsetzbar, testbar und klar abgrenzbar.

EPIC 1 – Stammdaten verwalten (Patienten, Ziele, Fahrer)
Story 1.1 – Patient anlegen und bearbeiten

Als Operator
möchte ich Patienten erfassen und bearbeiten können
damit Fahrten korrekt geplant werden können.

Acceptance Criteria

Pflichtfelder: Vorname, Nachname, Telefon, Adresse

Optionale Felder: Abholhinweise, Mobilität, Notizen, Notfallkontakt

Patient kann aktiviert/deaktiviert werden (kein Hard-Delete)

Änderungen sind sofort für neue Fahrten wirksam

Story 1.2 – Ziel (Spital/Arzt/Therapie) anlegen und bearbeiten

Als Operator
möchte ich medizinische Ziele erfassen und pflegen
damit Fahrten eindeutig zuordenbar sind.

Acceptance Criteria

Pflichtfelder: Name, Typ, Adresse

Optionale Felder: Abteilung, Kontakt, Hinweise

Ziel kann deaktiviert werden

Zieländerungen wirken nur auf zukünftige Fahrten

Story 1.3 – Fahrer anlegen und bearbeiten

Als Operator
möchte ich Fahrer verwalten können
damit ich sie in der Planung berücksichtigen kann.

Acceptance Criteria

Pflichtfelder: Name, Telefon

Optionale Felder: Fahrzeugtyp, Kennzeichen, Notizen

Fahrer kann deaktiviert werden

EPIC 2 – Fahrerverfügbarkeit pflegen
Story 2.1 – Verfügbarkeitsblöcke definieren

Als Operator
möchte ich Zeitblöcke für Fahrer definieren
damit ich nur realistisch verfügbare Fahrer einplane.

Acceptance Criteria

Rasteransicht (Mo–Fr, 08:00–18:00, 2h-Blöcke)

Blöcke können aktiviert/deaktiviert werden

Änderungen gelten nur für zukünftige Planungen

EPIC 3 – Fahrten erfassen
Story 3.1 – Einzelne Fahrt erfassen

Als Operator
möchte ich einen Fahrtenbedarf erfassen können
damit er disponiert werden kann.

Acceptance Criteria

Auswahl von Patient und Ziel

Datum, Zeit, Richtung (Hin/Rück/Hin+Rück)

Zusatzinformationen möglich

Status nach Erstellung: Ungeplant

Story 3.2 – Wiederkehrende Fahrten anlegen

Als Operator
möchte ich wiederkehrende Fahrten definieren
damit ich Serien nicht manuell erfassen muss.

Acceptance Criteria

Regel: Wochentage, Zeitraum, Uhrzeit

System erzeugt einzelne Fahrteninstanzen

Jede Instanz ist separat bearbeitbar

EPIC 4 – Disposition & Zuteilung
Story 4.1 – Ungeplante Fahrten anzeigen

Als Operator
möchte ich alle ungeplanten Fahrten sehen
damit ich sie priorisieren kann.

Acceptance Criteria

Liste filterbar nach Datum, Ziel, Patient

Klare visuelle Kennzeichnung „Ungeplant“

Story 4.2 – Fahrt einem Fahrer zuweisen

Als Operator
möchte ich eine Fahrt einem verfügbaren Fahrer zuweisen
damit sie durchgeführt werden kann.

Acceptance Criteria

Nur Fahrer mit passender Verfügbarkeit auswählbar

Abholzeit kann gesetzt oder angepasst werden

Status wechselt zu „Geplant“

EPIC 5 – Dispatch & Bestätigung
Story 5.1 – Fahrer automatisch benachrichtigen

Als System
möchte ich den Fahrer über eine geplante Fahrt informieren
damit er sie bestätigen kann.

Acceptance Criteria

Versand bei Statuswechsel zu „Geplant“

Nachricht enthält Zeit, Patient, Ziel, Hinweise

Story 5.2 – Fahrt bestätigen oder ablehnen

Als Fahrer
möchte ich eine Fahrt annehmen oder ablehnen können
damit die Planung verbindlich wird.

Acceptance Criteria

Annehmen → Status „Bestätigt"

Ablehnen → Status „Abgelehnt" mit Grund

Operator wird informiert

EPIC 6 – Änderungen & Re-Planning
Story 6.1 – Fahrt neu disponieren nach Ablehnung

Als Operator
möchte ich eine abgelehnte Fahrt neu zuteilen
damit sie trotzdem durchgeführt wird.

Acceptance Criteria

Fahrt kehrt in Status „Ungeplant“ zurück

Neuer Fahrer kann zugewiesen werden

EPIC 7 – Durchführung & Abschluss
Story 7.1 – Fahrtstatus führen

Als Fahrer
möchte ich den Status einer Fahrt aktualisieren
damit der Operator den Fortschritt sieht.

Acceptance Criteria

Statusfluss: Bestätigt → Unterwegs → Abgeholt → Angekommen → Abgeschlossen

Sonderstatus: No-Show, Abgebrochen

Dieses Backlog ist MVP-tauglich und vollständig genug, um:

direkt in GitHub Issues importiert zu werden

Sprint 1–3 zu planen

Design- und Implementationsarbeit zu synchronisieren

