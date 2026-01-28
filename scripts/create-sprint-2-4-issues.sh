#!/bin/bash

# Script to create GitHub Issues for Sprint 2-4
# Usage: ./scripts/create-sprint-2-4-issues.sh

set -e

REPO="trismus/Fahrdienst"

echo "Creating Sprint 2 Issues..."

# Sprint 2: Dispatcher Workflows

gh api repos/$REPO/issues -X POST -f title="Story 5.2: Tages-Ansicht Kalender" -F milestone=2 \
  -f labels[]="P1: Important" -f labels[]="Epic: Kalender" \
  -f body="**Als** Dispatcher
**möchte ich** eine detaillierte Tages-Ansicht im Kalender haben
**damit** ich den Tagesablauf besser planen kann

## Acceptance Criteria
- [ ] Toggle zwischen Wochen- und Tages-Ansicht
- [ ] Tages-Ansicht zeigt alle Fahrten des Tages chronologisch
- [ ] Zeitachse mit 30-Minuten-Schritten
- [ ] Navigation: Vorheriger/Nächster Tag

**Story Points:** 3"

echo "Created Story 5.2"

gh api repos/$REPO/issues -X POST -f title="Story 6.1: Fahrerverfügbarkeit readonly anzeigen" -F milestone=2 \
  -f labels[]="P1: Important" -f labels[]="Epic: Disposition" \
  -f body="**Als** Dispatcher
**möchte ich** die Verfügbarkeit aller Fahrer sehen
**damit** ich informiert planen kann

## Acceptance Criteria
- [ ] Route \`/drivers/[id]/availability\` zeigt AvailabilityGrid (readonly)
- [ ] Grid zeigt alle Availability Blocks des Fahrers
- [ ] Farbcodierung: Grün = verfügbar, Grau = nicht verfügbar
- [ ] Keine Bearbeitungs-Möglichkeit (erst in Sprint 3 für Fahrer selbst)

**Story Points:** 2"

echo "Created Story 6.1"

gh api repos/$REPO/issues -X POST -f title="Story 6.2: Abwesenheiten readonly anzeigen" -F milestone=2 \
  -f labels[]="P1: Important" -f labels[]="Epic: Disposition" \
  -f body="**Als** Dispatcher
**möchte ich** alle Abwesenheiten der Fahrer sehen
**damit** ich nicht verfügbare Fahrer erkenne

## Acceptance Criteria
- [ ] Liste der Abwesenheiten unter \`/drivers/[id]/absences\`
- [ ] Zeigt: Von-Datum, Bis-Datum, Grund
- [ ] Sortierung: Chronologisch (neueste zuerst)
- [ ] Readonly (keine Bearbeitung durch Dispatcher)

**Story Points:** 2"

echo "Created Story 6.2"

gh api repos/$REPO/issues -X POST -f title="Story 7.1: Dashboard mit Statistiken" -F milestone=2 \
  -f labels[]="P1: Important" \
  -f body="**Als** Dispatcher
**möchte ich** ein Dashboard mit wichtigen Kennzahlen sehen
**damit** ich schnell den Überblick habe

## Acceptance Criteria
- [ ] Route \`/dashboard\` zeigt Statistik-Cards
- [ ] Kennzahlen: Fahrten heute, offene Zuweisungen, Fahrer verfügbar heute
- [ ] Click auf Card → Detail-Ansicht (z.B. Liste der offenen Zuweisungen)
- [ ] Kalender-Widget eingebettet

**Story Points:** 5"

echo "Created Story 7.1"

gh api repos/$REPO/issues -X POST -f title="Story 8.1: Erweiterte Suche über Patient/Destination" -F milestone=2 \
  -f labels[]="P2: Nice-to-have" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Dispatcher
**möchte ich** Fahrten nach Patient oder Destination durchsuchen
**damit** ich schnell relevante Fahrten finde

## Acceptance Criteria
- [ ] Suchfeld in Fahrtenliste
- [ ] Freitext-Suche über Patient-Name, Destination-Name
- [ ] Suche ist case-insensitive
- [ ] Ergebnisse werden live gefiltert (debounced)

**Story Points:** 3"

echo "Created Story 8.1"

gh api repos/$REPO/issues -X POST -f title="Story 9.1: Ride-Detail-Ansicht mit Karte" -F milestone=2 \
  -f labels[]="P1: Important" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Dispatcher
**möchte ich** die Route einer Fahrt auf einer Karte sehen
**damit** ich die Strecke visuell prüfen kann

## Acceptance Criteria
- [ ] Route \`/rides/[id]\` zeigt Detail-Ansicht
- [ ] RouteMap Component zeigt Route von Patient zu Destination
- [ ] Marker: Start (Patient), Ende (Destination)
- [ ] Infos: Distanz, Dauer, Fahrer, Status
- [ ] Buttons: Bearbeiten, Stornieren

**Story Points:** 3"

echo "Created Story 9.1"

echo ""
echo "✅ Sprint 2 Issues created (6 stories)"

echo ""
echo "Creating Sprint 3 Issues..."

# Sprint 3: Driver Integration

gh api repos/$REPO/issues -X POST -f title="Story 10.1: Fahrer sieht Liste zugewiesener Fahrten" -F milestone=3 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Fahrer
**möchte ich** meine zugewiesenen Fahrten sehen
**damit** ich weiß, was ich fahren muss

## Acceptance Criteria
- [ ] Route \`/my-rides\` (Driver Layout) zeigt Liste eigener Fahrten
- [ ] Nur Fahrten mit \`driver_id = auth.uid()\` werden angezeigt
- [ ] RLS Policy verhindert Zugriff auf fremde Fahrten
- [ ] Sortierung: Nach Abholzeit (nächste zuerst)
- [ ] Mobile-first Design
- [ ] Status-Badge: planned, confirmed, in_progress, completed

**Story Points:** 3"

echo "Created Story 10.1"

gh api repos/$REPO/issues -X POST -f title="Story 10.2: Fahrer-Detail-Ansicht für Fahrt" -F milestone=3 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Fahrer
**möchte ich** Details einer Fahrt sehen
**damit** ich alle Infos habe

## Acceptance Criteria
- [ ] Route \`/my-rides/[id]\` zeigt Fahrt-Details
- [ ] Infos: Patient-Name, Adresse, Telefon, Destination, Zeit, Notizen
- [ ] RouteMap zeigt Route
- [ ] Buttons: Bestätigen, Ablehnen (nur wenn Status = planned)

**Story Points:** 3"

echo "Created Story 10.2"

gh api repos/$REPO/issues -X POST -f title="Story 11.1: Fahrer bestätigt Fahrt" -F milestone=3 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Fahrer
**möchte ich** eine Fahrt bestätigen
**damit** der Dispatcher weiß, dass ich sie übernehme

## Acceptance Criteria
- [ ] Button \"Bestätigen\" in Fahrt-Detail
- [ ] Click → Server Action \`confirmRide(id)\`
- [ ] Status → \`confirmed\`, \`confirmed_at = NOW()\`
- [ ] Button verschwindet nach Bestätigung
- [ ] Toast: \"Fahrt bestätigt\"

**Story Points:** 2"

echo "Created Story 11.1"

gh api repos/$REPO/issues -X POST -f title="Story 11.2: Fahrer lehnt Fahrt ab" -F milestone=3 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Fahrer
**möchte ich** eine Fahrt ablehnen können
**damit** sie neu zugeteilt werden kann

## Acceptance Criteria
- [ ] Button \"Ablehnen\" in Fahrt-Detail
- [ ] Click → Confirmation Dialog mit optionalem Grund
- [ ] Server Action \`rejectRide(id, reason)\`
- [ ] Status → \`planned\`, \`driver_id = NULL\`, Grund in \`notes\`
- [ ] Dispatcher sieht in Fahrtenliste: \"Abgelehnt von [Fahrer]\" (später: Notification)

**Story Points:** 3"

echo "Created Story 11.2"

gh api repos/$REPO/issues -X POST -f title="Story 12.1: Email-Benachrichtigung bei Zuweisung" -F milestone=3 \
  -f labels[]="P0: Blocker" \
  -f body="**Als** Fahrer
**möchte ich** per Email benachrichtigt werden, wenn mir eine Fahrt zugewiesen wird
**damit** ich nicht ständig die App checken muss

## Acceptance Criteria
- [ ] Bei \`assignRide()\`: Automatischer Email-Versand an Fahrer
- [ ] Email enthält: Patient, Destination, Abholzeit, Link zur Fahrt
- [ ] Buttons in Email: \"Bestätigen\", \"Ablehnen\" (direkter Link)
- [ ] Email-Template in HTML (responsive)
- [ ] Email-Provider: SendGrid oder Postmark (Entscheidung offen)

## Technische Umsetzung
- Email-Service in \`/lib/notifications/email.ts\`
- API Route: \`/api/notifications/send\`
- Template-Engine: React Email

**Story Points:** 5"

echo "Created Story 12.1"

gh api repos/$REPO/issues -X POST -f title="Story 13.1: Fahrer pflegt Verfügbarkeit" -F milestone=3 \
  -f labels[]="P1: Important" \
  -f body="**Als** Fahrer
**möchte ich** meine Verfügbarkeit selbst pflegen
**damit** ich nur verfügbare Zeiten zugewiesen bekomme

## Acceptance Criteria
- [ ] Route \`/my-availability\` zeigt AvailabilityGrid (editierbar)
- [ ] Click auf Block → Toggle verfügbar/nicht verfügbar
- [ ] Server Action: \`setAvailabilityBlock(weekday, start_time, end_time, available)\`
- [ ] Änderungen speichern sofort (optimistic UI)
- [ ] Toast: \"Verfügbarkeit gespeichert\"

**Story Points:** 5"

echo "Created Story 13.1"

gh api repos/$REPO/issues -X POST -f title="Story 13.2: Fahrer erfasst Abwesenheit" -F milestone=3 \
  -f labels[]="P1: Important" \
  -f body="**Als** Fahrer
**möchte ich** Abwesenheiten erfassen
**damit** ich keine Fahrten an diesen Tagen bekomme

## Acceptance Criteria
- [ ] Route \`/my-availability\` hat Sektion \"Abwesenheiten\"
- [ ] Formular: Von-Datum, Bis-Datum, Grund (optional)
- [ ] Button \"Abwesenheit erfassen\" → Server Action \`createAbsence()\`
- [ ] Liste zeigt alle Abwesenheiten
- [ ] Button \"Löschen\" bei jeder Abwesenheit

**Story Points:** 3"

echo "Created Story 13.2"

echo ""
echo "✅ Sprint 3 Issues created (7 stories)"

echo ""
echo "Creating Sprint 4 Issues..."

# Sprint 4: Ride Execution

gh api repos/$REPO/issues -X POST -f title="Story 14.1: Fahrer startet Fahrt" -F milestone=4 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Fahrer
**möchte ich** eine Fahrt starten
**damit** der Dispatcher weiß, dass ich unterwegs bin

## Acceptance Criteria
- [ ] Button \"Fahrt starten\" in Fahrt-Detail (nur wenn Status = confirmed)
- [ ] Click → Server Action \`startRide(id)\`
- [ ] Status → \`in_progress\`, \`started_at = NOW()\`
- [ ] Button verschwindet, neuer Button \"Fahrt abschließen\" erscheint

**Story Points:** 2"

echo "Created Story 14.1"

gh api repos/$REPO/issues -X POST -f title="Story 14.2: Fahrer schließt Fahrt ab" -F milestone=4 \
  -f labels[]="P0: Blocker" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Fahrer
**möchte ich** eine Fahrt abschließen
**damit** sie als erledigt markiert wird

## Acceptance Criteria
- [ ] Button \"Fahrt abschließen\" in Fahrt-Detail (nur wenn Status = in_progress)
- [ ] Click → Server Action \`completeRide(id)\`
- [ ] Status → \`completed\`, \`completed_at = NOW()\`
- [ ] Fahrt verschwindet aus \"Aktive Fahrten\" Liste
- [ ] Toast: \"Fahrt abgeschlossen\"

**Story Points:** 2"

echo "Created Story 14.2"

gh api repos/$REPO/issues -X POST -f title="Story 14.3: Timestamps für Fahrt-Phasen speichern" -F milestone=4 \
  -f labels[]="P1: Important" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** System
**möchte ich** alle Timestamps einer Fahrt speichern
**damit** Nachvollziehbarkeit gewährleistet ist

## Acceptance Criteria
- [ ] DB-Schema erweitert: \`started_at\`, \`picked_up_at\`, \`arrived_at\`, \`completed_at\`
- [ ] Timestamps werden bei entsprechenden Aktionen gesetzt
- [ ] Dispatcher sieht Timestamps in Fahrt-Detail
- [ ] Optional: Buttons \"Patient abgeholt\", \"Angekommen\" für Fahrer (Nice-to-have)

**Story Points:** 3"

echo "Created Story 14.3"

gh api repos/$REPO/issues -X POST -f title="Story 14.4: Dispatcher sieht Live-Status" -F milestone=4 \
  -f labels[]="P1: Important" -f labels[]="Epic: Fahrtenverwaltung" \
  -f body="**Als** Dispatcher
**möchte ich** den aktuellen Status aller Fahrten live sehen
**damit** ich bei Problemen reagieren kann

## Acceptance Criteria
- [ ] Fahrtenliste zeigt aktuellsten Status (ohne manuelles Reload)
- [ ] Optional: Supabase Realtime Subscriptions für \`rides\` Tabelle
- [ ] Status-Badge aktualisiert sich automatisch
- [ ] Alternativ: Polling alle 30s (einfacher für MVP)

**Story Points:** 5"

echo "Created Story 14.4"

gh api repos/$REPO/issues -X POST -f title="Story 15.1: SMS-Benachrichtigung (Twilio Integration)" -F milestone=4 \
  -f labels[]="P1: Important" \
  -f body="**Als** Fahrer
**möchte ich** per SMS benachrichtigt werden
**damit** ich auch ohne Email erreichbar bin

## Acceptance Criteria
- [ ] Bei \`assignRide()\`: Automatischer SMS-Versand an Fahrer-Telefonnummer
- [ ] SMS enthält: Patient, Abholzeit, Link zur App
- [ ] Twilio Integration: Account erstellt, API Key konfiguriert
- [ ] Fehlerbehandlung: Falls SMS fehlschlägt, trotzdem Email senden
- [ ] Cost Tracking: SMS-Kosten protokollieren (später für Abrechnung)

## Technische Umsetzung
- Twilio SDK in \`/lib/notifications/sms.ts\`
- Env Vars: \`TWILIO_ACCOUNT_SID\`, \`TWILIO_AUTH_TOKEN\`, \`TWILIO_PHONE_NUMBER\`

**Story Points:** 5"

echo "Created Story 15.1"

echo ""
echo "✅ Sprint 4 Issues created (5 stories)"

echo ""
echo "===================="
echo "Summary:"
echo "===================="
echo ""
echo "Sprint 1: 16 issues (already created)"
echo "Sprint 2: 6 issues"
echo "Sprint 3: 7 issues"
echo "Sprint 4: 5 issues"
echo ""
echo "Total Issues created: 34"
echo ""
echo "View all issues:"
echo "- Sprint 1: gh issue list --milestone 'Sprint 1: Foundation & Dispatcher Core'"
echo "- Sprint 2: gh issue list --milestone 'Sprint 2: Dispatcher Workflows'"
echo "- Sprint 3: gh issue list --milestone 'Sprint 3: Driver Integration'"
echo "- Sprint 4: gh issue list --milestone 'Sprint 4: Ride Execution'"
echo ""
echo "View all milestones: gh api repos/trismus/Fahrdienst/milestones"
