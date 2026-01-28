#!/bin/bash

# Robustes Skript zum Erstellen aller Sprint 2-4 Issues
# Mit Retry-Logik und Fehlerbehandlung
# Usage: ./scripts/create-all-sprint-issues.sh

set -e

REPO="trismus/Fahrdienst"
MAX_RETRIES=3
RETRY_DELAY=2

# Farben für Output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion zum Erstellen eines Issues mit Retry
create_issue_with_retry() {
    local title="$1"
    local milestone="$2"
    local labels="$3"
    local body="$4"
    local attempt=1

    while [ $attempt -le $MAX_RETRIES ]; do
        echo -n "  Erstelle: $title (Versuch $attempt/$MAX_RETRIES)... "

        if gh api repos/$REPO/issues -X POST \
            -f title="$title" \
            -F milestone="$milestone" \
            -f labels[]="$(echo $labels | cut -d, -f1)" \
            -f labels[]="$(echo $labels | cut -d, -f2)" \
            -f body="$body" \
            > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            return 0
        else
            if [ $attempt -lt $MAX_RETRIES ]; then
                echo -e "${YELLOW}⚠ Fehler, retry in ${RETRY_DELAY}s${NC}"
                sleep $RETRY_DELAY
            else
                echo -e "${RED}✗ Fehlgeschlagen${NC}"
                return 1
            fi
        fi
        attempt=$((attempt + 1))
    done
}

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  GitHub Issues für Sprint 2-4 erstellen              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Zähler für Statistik
total_issues=0
created_issues=0
failed_issues=0

# ============================================================================
# SPRINT 2: Dispatcher Workflows (Milestone 2)
# ============================================================================

echo -e "${YELLOW}SPRINT 2: Dispatcher Workflows (6 Issues)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Story 5.2
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 5.2: Tages-Ansicht Kalender" \
    "2" \
    "P1: Important,Epic: Kalender" \
    "**Als** Dispatcher
**möchte ich** eine detaillierte Tages-Ansicht im Kalender haben
**damit** ich den Tagesablauf besser planen kann

## Acceptance Criteria
- [ ] Toggle zwischen Wochen- und Tages-Ansicht
- [ ] Tages-Ansicht zeigt alle Fahrten des Tages chronologisch
- [ ] Zeitachse mit 30-Minuten-Schritten
- [ ] Navigation: Vorheriger/Nächster Tag

**Story Points:** 3"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 6.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 6.1: Fahrerverfügbarkeit readonly anzeigen" \
    "2" \
    "P1: Important,Epic: Disposition" \
    "**Als** Dispatcher
**möchte ich** die Verfügbarkeit aller Fahrer sehen
**damit** ich informiert planen kann

## Acceptance Criteria
- [ ] Route \`/drivers/[id]/availability\` zeigt AvailabilityGrid (readonly)
- [ ] Grid zeigt alle Availability Blocks des Fahrers
- [ ] Farbcodierung: Grün = verfügbar, Grau = nicht verfügbar
- [ ] Keine Bearbeitungs-Möglichkeit (erst in Sprint 3 für Fahrer selbst)

**Story Points:** 2"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 6.2
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 6.2: Abwesenheiten readonly anzeigen" \
    "2" \
    "P1: Important,Epic: Disposition" \
    "**Als** Dispatcher
**möchte ich** alle Abwesenheiten der Fahrer sehen
**damit** ich nicht verfügbare Fahrer erkenne

## Acceptance Criteria
- [ ] Liste der Abwesenheiten unter \`/drivers/[id]/absences\`
- [ ] Zeigt: Von-Datum, Bis-Datum, Grund
- [ ] Sortierung: Chronologisch (neueste zuerst)
- [ ] Readonly (keine Bearbeitung durch Dispatcher)

**Story Points:** 2"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 7.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 7.1: Dashboard mit Statistiken" \
    "2" \
    "P1: Important,Epic: Stammdaten" \
    "**Als** Dispatcher
**möchte ich** ein Dashboard mit wichtigen Kennzahlen sehen
**damit** ich schnell den Überblick habe

## Acceptance Criteria
- [ ] Route \`/dashboard\` zeigt Statistik-Cards
- [ ] Kennzahlen: Fahrten heute, offene Zuweisungen, Fahrer verfügbar heute
- [ ] Click auf Card → Detail-Ansicht (z.B. Liste der offenen Zuweisungen)
- [ ] Kalender-Widget eingebettet

**Story Points:** 5"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 8.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 8.1: Erweiterte Suche über Patient/Destination" \
    "2" \
    "P2: Nice-to-have,Epic: Fahrtenverwaltung" \
    "**Als** Dispatcher
**möchte ich** Fahrten nach Patient oder Destination durchsuchen
**damit** ich schnell relevante Fahrten finde

## Acceptance Criteria
- [ ] Suchfeld in Fahrtenliste
- [ ] Freitext-Suche über Patient-Name, Destination-Name
- [ ] Suche ist case-insensitive
- [ ] Ergebnisse werden live gefiltert (debounced)

**Story Points:** 3"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 9.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 9.1: Ride-Detail-Ansicht mit Karte" \
    "2" \
    "P1: Important,Epic: Fahrtenverwaltung" \
    "**Als** Dispatcher
**möchte ich** die Route einer Fahrt auf einer Karte sehen
**damit** ich die Strecke visuell prüfen kann

## Acceptance Criteria
- [ ] Route \`/rides/[id]\` zeigt Detail-Ansicht
- [ ] RouteMap Component zeigt Route von Patient zu Destination
- [ ] Marker: Start (Patient), Ende (Destination)
- [ ] Infos: Distanz, Dauer, Fahrer, Status
- [ ] Buttons: Bearbeiten, Stornieren

**Story Points:** 3"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

echo ""

# ============================================================================
# SPRINT 3: Driver Integration (Milestone 3)
# ============================================================================

echo -e "${YELLOW}SPRINT 3: Driver Integration (7 Issues)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Story 10.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 10.1: Fahrer sieht Liste zugewiesener Fahrten" \
    "3" \
    "P0: Blocker,Epic: Fahrtenverwaltung" \
    "**Als** Fahrer
**möchte ich** meine zugewiesenen Fahrten sehen
**damit** ich weiß, was ich fahren muss

## Acceptance Criteria
- [ ] Route \`/my-rides\` (Driver Layout) zeigt Liste eigener Fahrten
- [ ] Nur Fahrten mit \`driver_id = auth.uid()\` werden angezeigt
- [ ] RLS Policy verhindert Zugriff auf fremde Fahrten
- [ ] Sortierung: Nach Abholzeit (nächste zuerst)
- [ ] Mobile-first Design
- [ ] Status-Badge: planned, confirmed, in_progress, completed

**Story Points:** 3"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 10.2
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 10.2: Fahrer-Detail-Ansicht für Fahrt" \
    "3" \
    "P0: Blocker,Epic: Fahrtenverwaltung" \
    "**Als** Fahrer
**möchte ich** Details einer Fahrt sehen
**damit** ich alle Infos habe

## Acceptance Criteria
- [ ] Route \`/my-rides/[id]\` zeigt Fahrt-Details
- [ ] Infos: Patient-Name, Adresse, Telefon, Destination, Zeit, Notizen
- [ ] RouteMap zeigt Route
- [ ] Buttons: Bestätigen, Ablehnen (nur wenn Status = planned)

**Story Points:** 3"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 11.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 11.1: Fahrer bestätigt Fahrt" \
    "3" \
    "P0: Blocker,Epic: Fahrtenverwaltung" \
    "**Als** Fahrer
**möchte ich** eine Fahrt bestätigen
**damit** der Dispatcher weiß, dass ich sie übernehme

## Acceptance Criteria
- [ ] Button \"Bestätigen\" in Fahrt-Detail
- [ ] Click → Server Action \`confirmRide(id)\`
- [ ] Status → \`confirmed\`, \`confirmed_at = NOW()\`
- [ ] Button verschwindet nach Bestätigung
- [ ] Toast: \"Fahrt bestätigt\"

**Story Points:** 2"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 11.2
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 11.2: Fahrer lehnt Fahrt ab" \
    "3" \
    "P0: Blocker,Epic: Fahrtenverwaltung" \
    "**Als** Fahrer
**möchte ich** eine Fahrt ablehnen können
**damit** sie neu zugeteilt werden kann

## Acceptance Criteria
- [ ] Button \"Ablehnen\" in Fahrt-Detail
- [ ] Click → Confirmation Dialog mit optionalem Grund
- [ ] Server Action \`rejectRide(id, reason)\`
- [ ] Status → \`planned\`, \`driver_id = NULL\`, Grund in \`notes\`
- [ ] Dispatcher sieht in Fahrtenliste: \"Abgelehnt von [Fahrer]\"

**Story Points:** 3"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 12.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 12.1: Email-Benachrichtigung bei Zuweisung" \
    "3" \
    "P0: Blocker,Epic: Fahrtenverwaltung" \
    "**Als** Fahrer
**möchte ich** per Email benachrichtigt werden, wenn mir eine Fahrt zugewiesen wird
**damit** ich nicht ständig die App checken muss

## Acceptance Criteria
- [ ] Bei \`assignRide()\`: Automatischer Email-Versand an Fahrer
- [ ] Email enthält: Patient, Destination, Abholzeit, Link zur Fahrt
- [ ] Buttons in Email: \"Bestätigen\", \"Ablehnen\" (direkter Link)
- [ ] Email-Template in HTML (responsive)
- [ ] Email-Provider: SendGrid oder Postmark

## Technische Umsetzung
- Email-Service in \`/lib/notifications/email.ts\`
- API Route: \`/api/notifications/send\`
- Template-Engine: React Email

**Story Points:** 5"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 13.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 13.1: Fahrer pflegt Verfügbarkeit" \
    "3" \
    "P1: Important,Epic: Disposition" \
    "**Als** Fahrer
**möchte ich** meine Verfügbarkeit selbst pflegen
**damit** ich nur verfügbare Zeiten zugewiesen bekomme

## Acceptance Criteria
- [ ] Route \`/my-availability\` zeigt AvailabilityGrid (editierbar)
- [ ] Click auf Block → Toggle verfügbar/nicht verfügbar
- [ ] Server Action: \`setAvailabilityBlock(weekday, start_time, end_time, available)\`
- [ ] Änderungen speichern sofort (optimistic UI)
- [ ] Toast: \"Verfügbarkeit gespeichert\"

**Story Points:** 5"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 13.2
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 13.2: Fahrer erfasst Abwesenheit" \
    "3" \
    "P1: Important,Epic: Disposition" \
    "**Als** Fahrer
**möchte ich** Abwesenheiten erfassen
**damit** ich keine Fahrten an diesen Tagen bekomme

## Acceptance Criteria
- [ ] Route \`/my-availability\` hat Sektion \"Abwesenheiten\"
- [ ] Formular: Von-Datum, Bis-Datum, Grund (optional)
- [ ] Button \"Abwesenheit erfassen\" → Server Action \`createAbsence()\`
- [ ] Liste zeigt alle Abwesenheiten
- [ ] Button \"Löschen\" bei jeder Abwesenheit

**Story Points:** 3"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

echo ""

# ============================================================================
# SPRINT 4: Ride Execution (Milestone 4)
# ============================================================================

echo -e "${YELLOW}SPRINT 4: Ride Execution (5 Issues)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Story 14.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 14.1: Fahrer startet Fahrt" \
    "4" \
    "P0: Blocker,Epic: Fahrtenverwaltung" \
    "**Als** Fahrer
**möchte ich** eine Fahrt starten
**damit** der Dispatcher weiß, dass ich unterwegs bin

## Acceptance Criteria
- [ ] Button \"Fahrt starten\" in Fahrt-Detail (nur wenn Status = confirmed)
- [ ] Click → Server Action \`startRide(id)\`
- [ ] Status → \`in_progress\`, \`started_at = NOW()\`
- [ ] Button verschwindet, neuer Button \"Fahrt abschließen\" erscheint

**Story Points:** 2"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 14.2
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 14.2: Fahrer schließt Fahrt ab" \
    "4" \
    "P0: Blocker,Epic: Fahrtenverwaltung" \
    "**Als** Fahrer
**möchte ich** eine Fahrt abschließen
**damit** sie als erledigt markiert wird

## Acceptance Criteria
- [ ] Button \"Fahrt abschließen\" in Fahrt-Detail (nur wenn Status = in_progress)
- [ ] Click → Server Action \`completeRide(id)\`
- [ ] Status → \`completed\`, \`completed_at = NOW()\`
- [ ] Fahrt verschwindet aus \"Aktive Fahrten\" Liste
- [ ] Toast: \"Fahrt abgeschlossen\"

**Story Points:** 2"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 14.3
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 14.3: Timestamps für Fahrt-Phasen speichern" \
    "4" \
    "P1: Important,Epic: Fahrtenverwaltung" \
    "**Als** System
**möchte ich** alle Timestamps einer Fahrt speichern
**damit** Nachvollziehbarkeit gewährleistet ist

## Acceptance Criteria
- [ ] DB-Schema erweitert: \`started_at\`, \`picked_up_at\`, \`arrived_at\`, \`completed_at\`
- [ ] Timestamps werden bei entsprechenden Aktionen gesetzt
- [ ] Dispatcher sieht Timestamps in Fahrt-Detail
- [ ] Optional: Buttons \"Patient abgeholt\", \"Angekommen\" für Fahrer (Nice-to-have)

**Story Points:** 3"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 14.4
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 14.4: Dispatcher sieht Live-Status" \
    "4" \
    "P1: Important,Epic: Fahrtenverwaltung" \
    "**Als** Dispatcher
**möchte ich** den aktuellen Status aller Fahrten live sehen
**damit** ich bei Problemen reagieren kann

## Acceptance Criteria
- [ ] Fahrtenliste zeigt aktuellsten Status (ohne manuelles Reload)
- [ ] Optional: Supabase Realtime Subscriptions für \`rides\` Tabelle
- [ ] Status-Badge aktualisiert sich automatisch
- [ ] Alternativ: Polling alle 30s (einfacher für MVP)

**Story Points:** 5"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

# Story 15.1
total_issues=$((total_issues + 1))
if create_issue_with_retry \
    "Story 15.1: SMS-Benachrichtigung (Twilio Integration)" \
    "4" \
    "P1: Important,Epic: Fahrtenverwaltung" \
    "**Als** Fahrer
**möchte ich** per SMS benachrichtigt werden
**damit** ich auch ohne Email erreichbar bin

## Acceptance Criteria
- [ ] Bei \`assignRide()\`: Automatischer SMS-Versand an Fahrer-Telefonnummer
- [ ] SMS enthält: Patient, Abholzeit, Link zur App
- [ ] Twilio Integration: Account erstellt, API Key konfiguriert
- [ ] Fehlerbehandlung: Falls SMS fehlschlägt, trotzdem Email senden
- [ ] Cost Tracking: SMS-Kosten protokollieren

## Technische Umsetzung
- Twilio SDK in \`/lib/notifications/sms.ts\`
- Env Vars: \`TWILIO_ACCOUNT_SID\`, \`TWILIO_AUTH_TOKEN\`, \`TWILIO_PHONE_NUMBER\`

**Story Points:** 5"; then
    created_issues=$((created_issues + 1))
else
    failed_issues=$((failed_issues + 1))
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                 ZUSAMMENFASSUNG                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo -e "Gesamt Issues: ${total_issues}"
echo -e "${GREEN}Erfolgreich:   ${created_issues}${NC}"
echo -e "${RED}Fehlgeschlagen: ${failed_issues}${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Issues ansehen:"
echo "  Sprint 2: gh issue list --milestone 'Sprint 2: Dispatcher Workflows'"
echo "  Sprint 3: gh issue list --milestone 'Sprint 3: Driver Integration'"
echo "  Sprint 4: gh issue list --milestone 'Sprint 4: Ride Execution'"
echo ""
echo "Alle Milestones: gh api repos/trismus/Fahrdienst/milestones"
echo ""
