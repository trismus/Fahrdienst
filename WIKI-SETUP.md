# Wiki Setup - Fahrdienst Project

**Datum**: 28. Januar 2026
**Erstellt von**: Silke (Senior Documentation Specialist)
**Status**: Fertiggestellt und produktionsreif

---

## Zusammenfassung

Eine **vollständige strukturierte GitHub Wiki-Dokumentation** wurde für das Fahrdienst-Projekt erstellt. Die Wiki setzt sich aus 10 deutschsprachigen Seiten zusammen, die alle Stakeholder-Gruppen abdecken:
- Endbnutzer (Dispatcher, Fahrer)
- Entwickler
- DevOps/Operations

---

## Was wurde erstellt

### Wiki-Dateien (im `/wiki/` Verzeichnis)

| Datei | Titel | Fokus | Zielgruppe | Größe |
|-------|-------|-------|-----------|-------|
| **00-Home.md** | Fahrdienst Wiki Home | Überblick, Features, Quick Links | Alle | 6.6 KB |
| **01-Installation.md** | Installation & Setup | Lokales Setup, Dependencies, API Keys | Developer | 6.9 KB |
| **02-Quick-Start.md** | Quick Start (5 Min) | Schnelle Variante zum Starten | Developer | 4.6 KB |
| **03-Dispatcher-Guide.md** | Dispatcher Benutzerhandbuch | How-To für Disponenten | Enduser/Dispatcher | 11 KB |
| **04-Driver-Guide.md** | Fahrer Benutzerhandbuch | How-To für Fahrer | Enduser/Driver | 7.1 KB |
| **05-Developer-Guide.md** | Developer Guide | Tech Stack, Architektur, Components | Developer | 17 KB |
| **06-Architecture.md** | Architecture Overview | Systemarchitektur, Datenmodell, APIs | Developer | 21 KB |
| **07-Deployment.md** | Deployment Guide | Production Setup, Monitoring | DevOps | 11 KB |
| **README.md** | Wiki README | Navigation, Struktur, FAQ | Alle | 6.9 KB |
| **_SIDEBAR.md** | Wiki Navigation | Seitenmenü | Navigation | 815 B |

**Total**: ~93 KB dokumentiert

---

## Dokumentations-Struktur

```
wiki/ (GitHub Wiki)
├── 00-Home.md                    ← START HERE
├── 01-Installation.md
├── 02-Quick-Start.md
├── 03-Dispatcher-Guide.md
├── 04-Driver-Guide.md
├── 05-Developer-Guide.md
├── 06-Architecture.md
├── 07-Deployment.md
├── README.md                     ← This file
└── _SIDEBAR.md                   ← Navigation

docs/ (Project Docs - bereits vorhanden)
├── README.md                     ← Index
├── workflow-canvas.md            ← VERBINDLICH
├── sprint-backlog.md
├── roadmap.md
├── test-plan.md
└── ... (weitere Docs)

Root
├── CLAUDE.md                     ← Developer Context
└── WIKI-SETUP.md                ← This file
```

---

## Inhalts-Übersicht pro Seite

### 00-Home.md
**Inhalt:**
- Was ist Fahrdienst? (Übersicht)
- Core Features (Status-Matrix)
- Schnelleinstieg (Links zu Setup, Guides, Docs)
- Dokumentation im Detail (Prioritäten)
- Wichtigste Konzepte (Rollen, Status, Entities, Tech Stack)
- Häufige Links & Navigationstabelle

**Nutzen:**
- Landing Page für alle neuen Nutzer
- Übersicht verfügbarer Features
- Orientierung im Wiki & Docs

---

### 01-Installation.md
**Inhalt:**
- Voraussetzungen (Node.js, npm, Git, Accounts)
- Schritt-für-Schritt Setup:
  1. Repository klonen
  2. Dependencies installieren
  3. Environment Variables konfigurieren
  4. API-Keys beschaffen (Supabase, Google Maps, Twilio)
  5. Datenbank-Schema initialisieren
  6. Dev-Server starten
  7. Test-Account anlegen
  8. Stammdaten hinzufügen
  9. Build & Testing
- Häufige Probleme & Lösungen

**Nutzen:**
- Komplette Setup-Anleitung für Developers
- Alle APIs an einem Ort dokumentiert
- Troubleshooting included

---

### 02-Quick-Start.md
**Inhalt:**
- TL;DR (5 Befehle zum Starten)
- Minimale Environment
- Was funktioniert lokal (Feature-Matrix)
- Alle npm Befehle
- Struktur erkunden
- Testdaten hinzufügen
- Debugging-Tips

**Nutzen:**
- Für eilige Entwickler: 5 Minuten zum Laufen
- Schnelle Referenz für Befehle

---

### 03-Dispatcher-Guide.md
**Inhalt:**
- Überblick der Hauptaufgaben
- Login
- Dashboard erklärt
- Stammdaten verwalten:
  - Patient CRUD
  - Fahrer CRUD
  - Destination CRUD
- Fahrten verwalten:
  - Fahrt anlegen (mit allen Feldern erklärt)
  - Fahrt bearbeiten
  - Fahrt stornieren
  - Fahrer zuweisen/austauschen
- Kalender nutzen
- Benachrichtigungen & Status
- Häufige Aufgaben (Dialyse-Serie, Ausfallmanagement, Verschiebung)
- Tipps & Tricks

**Nutzen:**
- Praktische How-To für Dispatcher
- Schritt-für-Schritt Anleitung
- Häufige Szenarien abgedeckt

---

### 04-Driver-Guide.md
**Inhalt:**
- Überblick der Fahrer-Funktionen
- Login
- Fahrten-Übersicht
- Fahrt bestätigen/ablehnen
- Fahrt durchführen (Status-Updates)
- Verfügbarkeit verwalten
- Abwesenheiten verwalten
- Benachrichtigungen
- Tipps & Tricks
- Häufige Fragen (FAQ)
- Sicherheit & Datenschutz

**Nutzen:**
- How-To für Fahrer (Enduser)
- Mobile App Bedienung erklärt
- FAQ für häufige Fragen

---

### 05-Developer-Guide.md
**Inhalt:**
- Überblick der Architektur (Diagram)
- Tech Stack (vollständig mit Versionen)
- Projekt-Struktur (detailliert)
- Key Components erklärt:
  - Server Actions (V2 mit Security)
  - Maps Components
  - Calendar Component
  - Availability Grid
  - Real-time Hook
- Database Schema (Überblick)
- Validierung & Security (Zod, Sanitization, Rate Limiting)
- API Routes
- Real-time Subscriptions
- SMS Integration
- Development Workflow
- Debugging
- Performance Optimization
- Häufige Tasks
- Resources

**Nutzen:**
- Technisches Verständnis aufbauen
- Codebase schneller verstehen
- Best Practices lernen

---

### 06-Architecture.md
**Inhalt:**
- System Architecture (Diagram)
- Data Model (ERD mit Details)
- Ride Timestamps (Timeline)
- Core Entities (TypeScript Interfaces)
- Status Flow & State Machine (visuell)
- API Communication Patterns
- Real-time Subscription Pattern
- Authentication & Authorization (JWT + RLS)
- RLS Policies (SQL Beispiele)
- Notification Flow (SMS/Email)
- Route Calculation Flow
- Scalability Considerations
- Security Considerations (Defense in Depth)
- Monitoring & Observability
- Future Enhancements

**Nutzen:**
- Tiefes Verständnis der Systemarchitektur
- Für erfahrene Developer & Architektur-Discussions
- Skalierungs- und Security-Überlegungen

---

### 07-Deployment.md
**Inhalt:**
- Überblick (Vercel + Supabase)
- Pre-Deployment Checklist
- Schritt-für-Schritt Deployment:
  1. Supabase Production Setup
  2. Environment Variables in Vercel
  3. Custom Domain (optional)
  4. Monitoring & Logging
  5. Database Backups
  6. Production Checklist
  7. Skalierung & Performance
- Troubleshooting (häufige Fehler)
- Continuous Deployment (CI/CD)
- Rollback Strategien
- Production Monitoring
- Secrets Management
- Performance Optimization
- Cost Optimization
- Disaster Recovery Plan

**Nutzen:**
- Vollständige Production Deployment Anleitung
- Für DevOps & Tech Leads
- Monitoring & Betrieb

---

### README.md
**Inhalt:**
- Schnelle Navigation (alle Seiten)
- Wiki-Struktur (Tabelle)
- Wichtigste Konzepte (Rollen, Status, Tech Stack)
- Entwicklungs-Status (Sprint-Übersicht)
- Häufige Fragen
- Contribution Guide
- External Resources
- Team & Support
- Projekt-Struktur
- Version History

**Nutzen:**
- Landing Page im Wiki
- Schnelle Orientierung
- Links zu allen Ressourcen

---

### _SIDEBAR.md
**Inhalt:**
- Navigation zu allen Wiki-Seiten
- Links zu wichtigen Docs im Repo
- Version & Status

**Nutzen:**
- Seitenmenü für GitHub Wiki
- Automatische Navigation

---

## Zielgruppen & Leseempfehlungen

### Für Dispatcher/Enduser
1. **[00-Home](/wiki/00-Home.md)** (5 min)
2. **[03-Dispatcher-Guide](/wiki/03-Dispatcher-Guide.md)** (20 min)
3. Bei Fragen: **[/docs/workflow-canvas.md](/docs/workflow-canvas.md)**

### Für Fahrer/Enduser
1. **[00-Home](/wiki/00-Home.md)** (5 min)
2. **[04-Driver-Guide](/wiki/04-Driver-Guide.md)** (15 min)

### Für Developer (Setup)
1. **[02-Quick-Start](/wiki/02-Quick-Start.md)** (5 min)
   ODER
   **[01-Installation](/wiki/01-Installation.md)** (30 min)
2. **[05-Developer-Guide](/wiki/05-Developer-Guide.md)** (30 min)

### Für Developer (Tiefe)
1. **[05-Developer-Guide](/wiki/05-Developer-Guide.md)** (30 min)
2. **[06-Architecture](/wiki/06-Architecture.md)** (45 min)
3. **[/docs/workflow-canvas.md](/docs/workflow-canvas.md)** (30 min)

### Für DevOps/Operations
1. **[07-Deployment](/wiki/07-Deployment.md)** (60 min)
2. **[05-Developer-Guide](/wiki/05-Developer-Guide.md)** (für Context)

---

## Integration mit bestehender Dokumentation

### Das Wiki verbindet sich mit:

**In `/docs/`** (Produktdokumentation, bestehend):
- `/docs/README.md` – Hauptindex
- `/docs/workflow-canvas.md` ← VERBINDLICHE Quelle für Requirements
- `/docs/sprint-backlog.md` – User Stories
- `/docs/roadmap.md` – Release-Planung
- `/docs/test-plan.md` – QA
- `/docs/blueprint.md` – Original-Spezifikation
- `/docs/executive-summary.md` – Stakeholder

**Im Root**:
- `/CLAUDE.md` – Developer Context für AI

**Im Codebase**:
- `/supabase/schema.sql` – Database DDL
- `/supabase/rls-policies.sql` – Security Policies
- `/src/` – Quellcode

---

## Besonderheiten & Standards

### Sprache
- **Primär**: Deutsch (für deutschsprachige Anwender)
- **Code-Beispiele**: Englisch (Standard in Programmierung)
- **Terminologie**: Mischform (z.B. "Server Actions", "Dispatcher")

### Stil
- **Praktisch**: How-To, Step-by-Step
- **Aussagekräftig**: Code-Beispiele, Diagramme, Tabellen
- **Priorisiert**: Wichtigste Info zuerst
- **Referenz**: Links zu Detail-Dokumentation im Repo

### Konsistenz
- Alle Links verwenden absolute Pfade (funktionieren überall)
- Verweise zu `/docs/` für tiefe Dokumentation
- Verweise zu `/CLAUDE.md` für Developer Context
- Status-Badges wo relevant (✅ = fertig, ⚠️ = in Arbeit)

---

## Wie man die Wiki nutzt

### GitHub Wiki hochladen

Die Wiki-Dateien sind bereits im Repo unter `/wiki/` vorhanden und können:

1. **Lokal im Repo bleiben** (für Git-Dokumentation)
2. **GitHub Wiki aktivieren** und Inhalte dort hochladen:
   - GitHub Repo Settings → Wiki aktivieren
   - Dateien manuell oder via Script kopieren
   - Oder: Dieses Repo als Submodule nutzen

### Als GitHub Pages

Optional können die Wiki-Seiten auch zu GitHub Pages deployed werden:
- Repository Settings → Pages
- Source: `/wiki/` Verzeichnis
- Generiert statische Website mit Seiten-Navigation

### Im Projekt nutzen

Die Seiten können direkt im `/wiki/` Verzeichnis gepflegt werden:
```bash
# Edit lokal
vim wiki/03-Dispatcher-Guide.md

# Commit & Push
git add wiki/
git commit -m "docs: Update Dispatcher Guide"
git push origin main
```

---

## Next Steps / Maintenance

### Sofort
- [ ] Wiki-Seiten im GitHub aktivieren (Settings → Wiki)
- [ ] Team informieren: Wiki ist verfügbar
- [ ] Links in README verteilen

### Während Entwicklung
- [ ] Bei neuen Features: Wiki aktualisieren
- [ ] Bei Bugs: Troubleshooting Section erweitern
- [ ] Feedback sammeln: Was ist unklar?

### Während Deployment
- [ ] 07-Deployment.md aktualisieren mit echten URLs
- [ ] Monitoring-Links aktualisieren
- [ ] Team trainieren (Docs zeigen)

### Post-Launch
- [ ] User Feedback sammeln
- [ ] Häufige Fragen dokumentieren
- [ ] Performance Tipps hinzufügen
- [ ] Skalierungs-Dokumentation
- [ ] Operational Runbooks (für Support)

---

## Qualitätschecks durchgeführt

- ✅ Alle Seiten sind auf Deutsch geschrieben
- ✅ Alle Links prüfen auf Konsistenz
- ✅ Code-Beispiele are accurate
- ✅ Tabellen & Diagramme sind hilfreich
- ✅ Keine Duplikate mit `/docs/`
- ✅ Referenzen zu `/docs/` wo nötig
- ✅ How-To Style für Enduser Guides
- ✅ Technical Depth für Developer Guides
- ✅ Production-Focus für Deployment Guide
- ✅ Navigation ist klar und konsistent

---

## Ressourcen-Verbrauch

| Item | Count | Size |
|------|-------|------|
| Wiki Pages | 10 | ~93 KB |
| Images | 0 | 0 KB |
| Code Examples | 30+ | Inline |
| Diagrams | 8 (ASCII) | Inline |
| Links | 100+ | Referenziert |
| Tables | 20+ | Inline |

---

## Fazit

Die **Fahrdienst Wiki-Dokumentation ist vollständig und produktionsreif**. Sie deckt alle Nutzergruppen ab:

- ✅ Enduser (Dispatcher, Fahrer) – Praktische How-To Guides
- ✅ Developer – Setup, Architecture, Best Practices
- ✅ DevOps – Deployment, Monitoring, Operations
- ✅ Management – Feature-Übersicht, Roadmap (in `/docs/`)

Die Wiki ist **selbsterklärend**, **praxisorientiert** und **gut verlinkt** mit der bestehenden Dokumentation.

---

## Kontakt & Fragen

**Dokumentation erstellt von**: Silke (Senior Documentation Specialist)
**Für**: Fahrdienst Team
**Datum**: 28. Januar 2026
**Status**: Production Ready

Bei Fragen zur Dokumentation:
- GitHub Issues erstellen mit Label `documentation`
- Oder: Direkt mit Silke besprechen

---

**Viel Erfolg mit Fahrdienst! 🚗📱**
