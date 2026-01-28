# GitHub Setup Summary

**Datum**: 2026-01-28
**Status**: Milestones und Sprint 1 Issues erfolgreich erstellt

---

## Erstellte Milestones

| Milestone | Due Date | Status | Issues |
|-----------|----------|--------|--------|
| **Sprint 1: Foundation & Dispatcher Core** | 2026-02-14 | ✅ Erstellt | 16 open |
| **Sprint 2: Dispatcher Workflows** | 2026-02-28 | ✅ Erstellt | 0 open |
| **Sprint 3: Driver Integration** | 2026-03-14 | ✅ Erstellt | 0 open |
| **Sprint 4: Ride Execution** | 2026-03-28 | ✅ Erstellt | 0 open |
| **Sprint 5-6: Production Ready** | 2026-04-25 | ✅ Erstellt | 0 open |

---

## Sprint 1 Issues (ERSTELLT)

### Epic 1: Authentication & Security
- ✅ #9: Story 1.1: Login-Seite [P0: Blocker]
- ✅ #10: Story 1.2: Logout-Funktion [P0: Blocker]
- ✅ #11: Story 1.3: Rollen-Basierte RLS Policies [P0: Blocker]

### Epic 2: Stammdaten-Verwaltung
- ✅ #12: Story 2.1: Patienten-Liste anzeigen [P0: Blocker]
- ✅ #13: Story 2.2: Patient anlegen [P0: Blocker]
- ✅ #14: Story 2.3: Patient bearbeiten [P0: Blocker]
- ✅ #15: Story 2.4: Patient löschen (Soft-Delete) [P0: Blocker]
- ✅ #16: Story 2.5: Fahrer-CRUD [P0: Blocker]
- ✅ #17: Story 2.6: Destinations-CRUD [P0: Blocker]

### Epic 3: Fahrtenverwaltung
- ✅ #18: Story 3.1: Fahrt anlegen (Basic) [P0: Blocker]
- ✅ #19: Story 3.2: Fahrtenliste mit Filter [P0: Blocker]
- ✅ #20: Story 3.3: Fahrt bearbeiten [P1: Important]
- ✅ #21: Story 3.4: Fahrt stornieren [P1: Important]

### Epic 4: Disposition
- ✅ #22: Story 4.1: Fahrer zuweisen mit Verfügbarkeits-Check [P1: Important]
- ✅ #23: Story 4.2: Fahrer-Zuweisung entfernen [P2: Nice-to-have]

### Epic 5: Kalender
- ✅ #24: Story 5.1: Wochen-Kalender mit Fahrten [P1: Important]

**Total Sprint 1**: 16 Issues
- **P0 (Blocker)**: 10 Issues
- **P1 (Important)**: 5 Issues
- **P2 (Nice-to-have)**: 1 Issue

---

## Sprint 2-4 Issues (✅ ERSTELLT)

Alle Issues für Sprint 2-4 wurden erfolgreich erstellt mit:

```bash
./scripts/create-all-sprint-issues.sh
```

### Sprint 2: 6 Issues (#25-#30) ✅
- Story 5.2: Tages-Ansicht Kalender
- Story 6.1: Fahrerverfügbarkeit readonly anzeigen
- Story 6.2: Abwesenheiten readonly anzeigen
- Story 7.1: Dashboard mit Statistiken
- Story 8.1: Erweiterte Suche
- Story 9.1: Ride-Detail-Ansicht mit Karte

### Sprint 3: 7 Issues (#31-#37) ✅
- Story 10.1: Fahrer sieht Liste zugewiesener Fahrten
- Story 10.2: Fahrer-Detail-Ansicht für Fahrt
- Story 11.1: Fahrer bestätigt Fahrt
- Story 11.2: Fahrer lehnt Fahrt ab
- Story 12.1: Email-Benachrichtigung bei Zuweisung
- Story 13.1: Fahrer pflegt Verfügbarkeit
- Story 13.2: Fahrer erfasst Abwesenheit

### Sprint 4: 5 Issues (#38-#42) ✅
- Story 14.1: Fahrer startet Fahrt
- Story 14.2: Fahrer schließt Fahrt ab
- Story 14.3: Timestamps für Fahrt-Phasen speichern
- Story 14.4: Dispatcher sieht Live-Status
- Story 15.1: SMS-Benachrichtigung (Twilio Integration)

---

## Nützliche Kommandos

### Issues anzeigen
```bash
# Alle Sprint 1 Issues
gh issue list --milestone "Sprint 1: Foundation & Dispatcher Core"

# Alle offenen Issues
gh issue list --state open

# Nach Label filtern
gh issue list --label "P0: Blocker"
```

### Milestones anzeigen
```bash
gh api repos/trismus/Fahrdienst/milestones --jq '.[] | "\(.number): \(.title) - \(.open_issues) open / \(.closed_issues) closed"'
```

### Issues für Sprint 2-4 erstellen
```bash
./scripts/create-sprint-2-4-issues.sh
```

### Issue bearbeiten
```bash
# Issue schließen
gh issue close 9

# Issue wieder öffnen
gh issue reopen 9

# Label hinzufügen
gh issue edit 9 --add-label "bug"

# Milestone ändern
gh issue edit 9 --milestone "Sprint 2: Dispatcher Workflows"
```

---

## Labels

Folgende Labels wurden erstellt:

**Priorität**:
- `P0: Blocker` (rot) - Kritische Stories, die Sprint blockieren
- `P1: Important` (gelb) - Wichtige Stories für MVP
- `P2: Nice-to-have` (grün) - Optional für MVP

**Epics**:
- `Epic: Auth` (violett) - Authentication & Security
- `Epic: Stammdaten` (blau) - Master Data Management
- `Epic: Fahrtenverwaltung` (dunkelblau) - Ride Management
- `Epic: Disposition` (türkis) - Driver Assignment
- `Epic: Kalender` (hellblau) - Calendar View

---

## Nächste Schritte

1. ✅ Milestones erstellt
2. ✅ Sprint 1 Issues erstellt
3. ⏳ Sprint 2-4 Issues erstellen (Skript ausführen wenn Netzwerk verfügbar)
4. 📋 Sprint 1 starten
5. 📋 Daily Standups einrichten
6. 📋 Issue Board konfigurieren (GitHub Projects)

---

## GitHub Projects Setup (Optional)

Für bessere Visualisierung kann ein GitHub Project Board erstellt werden:

1. Gehe zu: https://github.com/trismus/Fahrdienst/projects
2. "New project" klicken
3. Template: "Board" wählen
4. Name: "Fahrdienst MVP"
5. Columns: Backlog, Sprint 1, In Progress, Review, Done
6. Issues zu Columns hinzufügen

---

## Dokumentation

Vollständige Dokumentation in:
- `/docs/sprint-backlog.md` - Detaillierte User Stories
- `/docs/roadmap.md` - Release-Planung
- `/docs/workflow-canvas.md` - Workflow-Spezifikationen
- `/docs/test-plan.md` - Test-Strategie

---

**Erstellt von**: Greg (Product Owner) & Claude Code
**Letzte Aktualisierung**: 2026-01-28
