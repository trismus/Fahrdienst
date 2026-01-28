# Fahrdienst App – Dokumentation

**Version**: 1.0 (Sprint 1 Ready)
**Letzte Aktualisierung**: 2026-01-28

---

## Übersicht

Dieses Verzeichnis enthält die **vollständige Produktdokumentation** für die Fahrdienst App. Alle Dokumente sind **verbindlich** und dienen als Grundlage für Entwicklung, Testing und Stakeholder-Kommunikation.

---

## Dokumenten-Struktur

### 1. Foundation Documents (Start hier)

#### **[Executive Summary](./executive-summary.md)** 📋
**Für**: Stakeholder, Management
**Inhalt**: Projektziel, Business Value, Timeline, Budget, Risiken
**Wann lesen**: Vor Projekt-Approval, für Überblick

#### **[Blueprint](./blueprint.md)** 🏗️
**Für**: Gesamtteam (Developer + Product Owner)
**Inhalt**: Technologie-Stack, Datenmodell, UI/UX Leitlinien, MVP-Flow
**Wann lesen**: Vor Entwicklungsstart, als technische Referenz

---

### 2. Product Definition (Verbindliche Grundlage)

#### **[Workflow Canvas](./workflow-canvas.md)** ⭐ WICHTIGSTE DATEI
**Für**: Product Owner, Developer, UX Designer
**Inhalt**: 10 Kern-Workflows mit Akteuren, Triggern, Schritten, Edge Cases, MVP-Scope
**Wann lesen**:
- Vor jedem Sprint Planning
- Bei Unklarheiten über Requirements
- Für Akzeptanzkriterien

**Workflows**:
1. Stammdaten-Workflow
2. Fahrerverfügbarkeits-Workflow
3. Fahrtenbedarf erfassen
4. Wiederkehrende Fahrten (Phase 2)
5. Disposition & Zuteilung
6. Fahrerbenachrichtigung & Bestätigung
7. Durchführung der Fahrt
8. Änderungen & Störungen
9. Abrechnung & Nachbearbeitung (Phase 4)
10. Rollen & Governance

**Produktentscheidungen dokumentiert**:
- Status-Flow: 4 Stati statt 6
- Disposition-Modus: Manuell mit Assistenz
- Rückfahrt als separate Fahrt
- Notifications in Sprint 2

---

### 3. Planning & Execution

#### **[Roadmap](./roadmap.md)** 🗺️
**Für**: Gesamtteam, Stakeholder
**Inhalt**: Releases, Milestones, Dependencies, Decision Log
**Wann lesen**:
- Für langfristige Planung
- Vor Sprint Planning (Kontext)

**Releases**:
- MVP 0.1 (Sprint 1-2): Dispatcher kann disponieren
- MVP 0.2 (Sprint 3-4): Fahrer können reagieren
- v1.0 (Sprint 5-6): Production-Ready
- v1.1 (Post-MVP): Operational Excellence

#### **[Sprint Backlog](./sprint-backlog.md)** 📝
**Für**: Developer, Product Owner
**Inhalt**: Detaillierte User Stories mit Akzeptanzkriterien, technischer Umsetzung, DoD
**Wann lesen**:
- Täglich während Sprint
- Bei Story-Implementierung

**Sprint 1 Stories** (20 Stories):
- Epic 1: Authentication & Security
- Epic 2: Stammdaten-Verwaltung
- Epic 3: Fahrtenverwaltung
- Epic 4: Disposition
- Epic 5: Kalender-Ansicht

#### **[Sprint 1 Overview](./sprint-1-overview.md)** 🚀
**Für**: Developer (Quick Reference)
**Inhalt**: Sprint Goal, Must-Haves, Checklists, Demo-Szenario, Risks
**Wann lesen**:
- Am Anfang von Sprint 1
- Täglich als Quick Reference

**Enthält**:
- Implementierungs-Checklists (Routes, Components, Server Actions)
- Demo-Szenario (End-of-Sprint)
- Risiken & Mitigations

#### **[GitHub Setup Summary](./github-setup-summary.md)** 🏷️
**Für**: Developer, Product Owner
**Inhalt**: GitHub Milestones, Issues, Labels, nützliche Kommandos
**Wann lesen**:
- Nach GitHub-Setup
- Beim Start eines neuen Sprints
- Bei Fragen zu Issue-Management

**Enthält**:
- 5 Milestones (Sprint 1-6)
- 15 Sprint 1 Issues (erstellt)
- Skripte für Sprint 2-4 Issues
- Nützliche GitHub CLI Kommandos

---

### 4. Quality Assurance

#### **[Test Plan](./test-plan.md)** ✅
**Für**: Developer, QA, Product Owner
**Inhalt**: Test-Strategie, Test-Szenarien für jeden Sprint, Security Tests, Performance Tests
**Wann lesen**:
- Vor jedem Sprint (Test-Szenarien)
- Nach Implementierung (Manuelle Tests durchführen)
- Vor Release (Regression Tests)

**Test-Typen**:
- Sprint 1: 12 Test-Szenarien (Login, CRUD, Kalender, RLS)
- Sprint 2-4: Weitere Szenarien (Fahrer, Benachrichtigungen, Ride Execution)
- Security Tests: SQL Injection, XSS, RLS Policies
- Performance Tests: Page Load, API Response, Caching

---

## Dokumenten-Workflow

### Vor Sprint Planning
1. **[Workflow Canvas](./workflow-canvas.md)** lesen → Verstehen, welche Workflows relevant sind
2. **[Roadmap](./roadmap.md)** prüfen → Kontext für Sprint-Ziel
3. **[Sprint Backlog](./sprint-backlog.md)** durchgehen → Stories priorisieren

### Während Sprint
1. **[Sprint 1 Overview](./sprint-1-overview.md)** als Daily Reference
2. **[Sprint Backlog](./sprint-backlog.md)** für Acceptance Criteria
3. **[Workflow Canvas](./workflow-canvas.md)** bei Unklarheiten
4. **[Test Plan](./test-plan.md)** nach Story-Completion

### Sprint Review
1. **[Sprint 1 Overview](./sprint-1-overview.md)** Demo-Szenario durchführen
2. **[Test Plan](./test-plan.md)** Test-Report präsentieren
3. **[Roadmap](./roadmap.md)** Milestone-Progress tracken

---

## Änderungsmanagement

### Wer darf Dokumente ändern?
- **Product Owner**: Alle Dokumente (finale Entscheidung)
- **Developer**: Technische Details (nach PO-Approval)
- **Stakeholder**: Feedback via PO

### Änderungs-Prozess
1. **Vorschlag**: Issue erstellen oder direkt mit PO besprechen
2. **Review**: PO prüft Impact auf Scope/Timeline
3. **Approval**: PO gibt frei
4. **Update**: Dokument ändern + Version hochsetzen
5. **Communication**: Team informieren (Slack/Email)

### Versionierung
- **Major Change** (z.B. Scope-Änderung): Version 1.0 → 2.0
- **Minor Change** (z.B. Story hinzufügen): Version 1.0 → 1.1
- **Patch** (z.B. Typo fix): Version 1.0 → 1.0.1

---

## Häufig gestellte Fragen

### Q: Welches Dokument ist am wichtigsten?
**A**: **[Workflow Canvas](./workflow-canvas.md)** – Es definiert alle Requirements und Produktentscheidungen verbindlich.

### Q: Wo finde ich die Akzeptanzkriterien für Story X?
**A**: **[Sprint Backlog](./sprint-backlog.md)** → Suche nach Story-Nummer.

### Q: Wie entscheide ich, ob Feature X im MVP ist?
**A**: **[Workflow Canvas](./workflow-canvas.md)** → Jeder Workflow hat "MVP-Scope" Sektion.

### Q: Welche Tests muss ich nach Story-Completion durchführen?
**A**: **[Test Plan](./test-plan.md)** → Suche Test-Szenario für deine Story (z.B. TS-1.5 für Patient anlegen).

### Q: Was ist das Sprint-Ziel für Sprint 1?
**A**: **[Sprint 1 Overview](./sprint-1-overview.md)** → "Dispatcher kann sich anmelden, Stammdaten verwalten und eine Fahrt anlegen".

### Q: Welche Produktentscheidungen wurden bereits getroffen?
**A**: **[Workflow Canvas](./workflow-canvas.md)** → Sektion "Produktentscheidungen (dokumentiert)" ganz unten.
      **[Roadmap](./roadmap.md)** → "Decision Log".

---

## Leseempfehlungen nach Rolle

### Stakeholder / Management
1. [Executive Summary](./executive-summary.md) – Projektziel, Budget, Timeline
2. [Roadmap](./roadmap.md) – Milestones, Risks

### Product Owner
1. [Workflow Canvas](./workflow-canvas.md) – Verbindliche Requirements
2. [Sprint Backlog](./sprint-backlog.md) – User Stories & Acceptance Criteria
3. [Roadmap](./roadmap.md) – Langfristige Planung

### Developer
1. [Sprint 1 Overview](./sprint-1-overview.md) – Quick Start
2. [Sprint Backlog](./sprint-backlog.md) – Detaillierte Stories
3. [Workflow Canvas](./workflow-canvas.md) – Bei Unklarheiten
4. [Test Plan](./test-plan.md) – Nach Implementierung
5. [Blueprint](./blueprint.md) – Technische Referenz

### QA / Tester
1. [Test Plan](./test-plan.md) – Test-Szenarien
2. [Workflow Canvas](./workflow-canvas.md) – Edge Cases verstehen
3. [Sprint Backlog](./sprint-backlog.md) – Acceptance Criteria

---

## Externe Ressourcen

- **Codebase Context**: `/CLAUDE.md` (im Root-Verzeichnis)
- **Datenbank-Schema**: `/supabase/schema.sql`
- **RLS Policies**: `/supabase/rls-policies.sql` (erstellen in Sprint 1)

---

## Tools & Links

- **Supabase Dashboard**: [Link einfügen nach Setup]
- **Vercel Staging**: [Link einfügen nach Deployment]
- **Google Maps API Console**: [Link einfügen]
- **GitHub Repository**: [Link einfügen]

---

## Kontakt

**Fragen zu Dokumentation?**
- Product Owner: Greg (siehe Workflow Canvas)
- Für technische Fragen: Developer

**Feedback?**
- Direkt in Dokumenten-Comments (GitHub PR)
- Oder: Issue erstellen mit Label `documentation`

---

**Let's build something reliable! 🚀**
