# Fahrdienst – Dispatching-Plattform für Patiententransporte

Eine moderne, webbasierte Lösung zur effizienten Koordination von nicht-notfallmäßigen Patiententransporten. Disponenten planen Fahrten, Fahrer bestätigen und führen sie durch – alles in Echtzeit, mit automatischer Routenberechnung und mobiler Unterstützung.

**Status**: Sprint 1 Ready | **Version**: MVP 0.1 in Development | **Go-Live**: 2026-04-25

---

## Projektübersicht

### Das Problem
Traditionelle Patiententransport-Koordination erfolgt manuell (Telefon, Excel, Papier):
- Ineffizient und zeitaufwendig
- Fehleranfällig (Doppelbuchungen, verpasste Termine)
- Keine Transparenz über Fahrerverfügbarkeit
- Kein Echtzeit-Tracking

### Unsere Lösung
**Fahrdienst** digitalisiert den gesamten Prozess:
- Zentrale Planung mit Kalender-Übersicht
- Automatische Routenberechnung (Google Maps)
- Verfügbarkeits-Check für Fahrer
- Mobile-First UI für Fahrer (Smartphone)
- Echtzeit-Status-Updates

### Kernfunktionen
- **Stammdaten-Verwaltung**: Patienten, Fahrer, Ziele (mit Adress-Autocomplete)
- **Fahrtplanung**: Einzelfahrten und wiederkehrende Transporte
- **Intelligente Zuweisung**: Verfügbarkeits-basierte Fahrer-Vorschläge
- **Benachrichtigungen**: Email/SMS bei Zuweisung und Änderungen
- **Status-Tracking**: Live-Übersicht für Disponenten
- **Kalender-Ansicht**: Tages-, Wochen- und Monatsansicht

---

## Aktueller Projektstatus

### Was ist fertig
- ✅ **Technische Basis**: Next.js 15, Supabase, Google Maps API Setup
- ✅ **Datenbank-Schema**: Vollständig definiert (Patients, Drivers, Destinations, Rides, Availability)
- ✅ **Security-Layer**: V2 Server Actions mit Input-Validierung, SQL-Injection-Schutz, Rate Limiting
- ✅ **Komponenten-Bibliothek**: UI-Components, Forms, Maps, Calendar, Availability
- ✅ **Design System**: Uber-inspiriertes minimalistisches Design (Tailwind)
- ✅ **Produktdokumentation**: 32.000 Wörter (Workflow Canvas, Sprint Backlog, Roadmap, Test Plan)
- ✅ **GitHub Issues**: 34 Issues für Sprint 1-4 erstellt und priorisiert
- ✅ **Milestones**: 5 GitHub Milestones für Sprint-Tracking

### Was kommt als Nächstes (Sprint 1)
**Sprint Goal**: "Dispatcher kann sich anmelden, Stammdaten verwalten und eine Fahrt anlegen"

**Start**: 2026-02-01 | **Ende**: 2026-02-14 | **Dauer**: 2 Wochen

**Kern-Features**:
- 🟡 Authentication (Login/Logout, RLS Policies)
- 🟡 Stammdaten CRUD (Patienten, Fahrer, Ziele)
- 🟡 Fahrt anlegen/bearbeiten/stornieren
- 🟡 Fahrer zuweisen mit Verfügbarkeits-Check
- 🟡 Kalender-Ansicht (Woche)

**GitHub Issues**: [#9-#24](../../issues) (16 Issues)

---

## Roadmap

| Phase | Timeline | Ziel | Issues |
|-------|----------|------|--------|
| **Sprint 1-2** | Woche 1-4 | Dispatcher kann disponieren | [#9-#30](../../issues) |
| **Sprint 3-4** | Woche 5-8 | Fahrer können reagieren | [#31-#42](../../issues) |
| **Sprint 5-6** | Woche 9-12 | Production-Ready | TBD |
| **Post-MVP** | Ab Woche 13 | Operational Excellence | Backlog |

**Milestones**:
1. **M1: Dispatcher Workflows** (2026-02-25) – Stammdaten + Fahrtplanung + Kalender
2. **M2: Driver Integration** (2026-03-25) – Fahrer UI + Benachrichtigungen
3. **M3: Production Launch** (2026-04-25) – Status-Tracking + Security Audit

Detaillierte Roadmap: [`/docs/roadmap.md`](./docs/roadmap.md)

---

## Quick Start für Entwickler

### Voraussetzungen
- Node.js 18+
- npm oder yarn
- Supabase Account (kostenlos)
- Google Maps API Key ([erstellen](https://developers.google.com/maps/get-started))

### Installation

```bash
# Repository klonen
git clone https://github.com/yourusername/fahrdienst.git
cd fahrdienst

# Dependencies installieren
npm install

# Environment Variables konfigurieren
cp .env.local.example .env.local
# Öffne .env.local und füge deine Keys ein:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Development Server starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

### Datenbank Setup

1. Erstelle ein Supabase Projekt: [supabase.com/dashboard](https://supabase.com/dashboard)
2. Öffne SQL Editor in Supabase
3. Führe Schema aus: [`/supabase/schema.sql`](./supabase/schema.sql)
4. (Sprint 1) Führe RLS Policies aus: `/supabase/rls-policies.sql` (wird erstellt)

### Entwicklungs-Workflow

```bash
npm run dev        # Development Server (http://localhost:3000)
npm run build      # Production Build
npm run start      # Production Server
npm run lint       # ESLint ausführen
```

**Git Workflow**:
```bash
git checkout -b feature/issue-9-login-page
# ... Änderungen machen
git commit -m "feat: Add login page with Supabase Auth (#9)"
git push origin feature/issue-9-login-page
# Pull Request erstellen, auf Sprint 1 Milestone verlinken
```

---

## Technologie-Stack

### Frontend
- **Next.js 15** – React Framework mit App Router und Server Components
- **TypeScript** – Type Safety
- **Tailwind CSS** – Utility-First Styling (Uber-Design-System)

### Backend
- **Supabase** – PostgreSQL, Authentication, Real-time Subscriptions
- **Next.js Server Actions** – API-Layer (V2 mit Security Hardening)

### APIs & Services
- **Google Maps API** – Places (Autocomplete), Directions (Route), Maps JavaScript API
- **Twilio** – SMS-Benachrichtigungen (Sprint 2)
- **Supabase Auth Email** – Email-Benachrichtigungen (Sprint 2)

### Hosting & CI/CD
- **Vercel** – Production & Staging Deployment
- **GitHub Actions** – Automated Tests (später)

### Sicherheit
- **RLS Policies** – Row Level Security in Supabase
- **Zod Validation** – Input-Validierung
- **SQL Injection Prevention** – Parameterized Queries + Sanitization
- **Rate Limiting** – Per-Operation Limits

Details: [`CLAUDE.md#security`](./CLAUDE.md#security)

---

## Projekt-Struktur

```
fahrdienst/
├── docs/                        # Produktdokumentation (32.000 Wörter)
│   ├── README.md               # Dokumentations-Index
│   ├── workflow-canvas.md      # ⭐ 10 Kern-Workflows (VERBINDLICH)
│   ├── sprint-backlog.md       # User Stories Sprint 1-6
│   ├── roadmap.md              # Releases, Milestones, Risks
│   ├── test-plan.md            # Test-Szenarien
│   ├── sprint-1-overview.md    # Quick Reference Sprint 1
│   ├── executive-summary.md    # Projektziel, Budget, Timeline
│   └── blueprint.md            # Original Spec
├── src/
│   ├── app/
│   │   ├── (dispatcher)/       # Dispatcher Routes (Desktop-optimiert)
│   │   │   ├── dashboard/      # Kalender, Statistiken
│   │   │   ├── rides/          # Fahrten CRUD
│   │   │   ├── drivers/        # Fahrer-Verwaltung
│   │   │   ├── patients/       # Patienten-Verwaltung
│   │   │   └── destinations/   # Ziel-Verwaltung
│   │   ├── (driver)/           # Driver Routes (Mobile-First)
│   │   │   ├── rides/          # Zugewiesene Fahrten
│   │   │   └── availability/   # Verfügbarkeit pflegen
│   │   ├── login/              # Login-Seite (Sprint 1)
│   │   └── api/                # API Routes (Google Maps)
│   ├── components/
│   │   ├── ui/                 # Button, Input, Card, Badge, etc.
│   │   ├── forms/              # PatientForm, DriverForm, RideForm
│   │   ├── maps/               # AddressAutocomplete, RouteMap
│   │   ├── calendar/           # CalendarView
│   │   ├── availability/       # AvailabilityGrid, AbsenceList
│   │   └── rides/              # RideDetailCard, RideList
│   ├── lib/
│   │   ├── actions/            # Server Actions (V2 gehärtet)
│   │   ├── supabase/           # Supabase Clients
│   │   ├── validations/        # Zod Schemas
│   │   └── utils/              # Helpers (sanitize, rate-limit)
│   └── types/                  # TypeScript Types
├── supabase/
│   ├── schema.sql              # Datenbank-Schema
│   └── rls-policies.sql        # Row Level Security (Sprint 1)
├── CLAUDE.md                   # KI-Entwickler-Kontext
├── tailwind.config.ts          # Design System
└── README.md                   # Diese Datei
```

---

## Dokumentation

### Für Entwickler
1. **Start**: [`/docs/README.md`](./docs/README.md) – Dokumentations-Index
2. **Requirements**: [`/docs/workflow-canvas.md`](./docs/workflow-canvas.md) – 10 Workflows mit Acceptance Criteria
3. **Implementation**: [`/docs/sprint-backlog.md`](./docs/sprint-backlog.md) – User Stories + Tech Details
4. **Testing**: [`/docs/test-plan.md`](./docs/test-plan.md) – Test-Szenarien Sprint 1-4
5. **Quick Ref**: [`/docs/sprint-1-overview.md`](./docs/sprint-1-overview.md) – Sprint 1 Checklists

### Für Product Owner
1. [`/docs/workflow-canvas.md`](./docs/workflow-canvas.md) – Verbindliche Requirements
2. [`/docs/roadmap.md`](./docs/roadmap.md) – Langfristige Planung
3. [`/docs/executive-summary.md`](./docs/executive-summary.md) – Stakeholder-Übersicht

### Für KI-Entwickler (Claude Code)
- [`CLAUDE.md`](./CLAUDE.md) – Projekt-Kontext, Architektur, Security

---

## Datenmodell

### Core Entities

**Patient**
- Name, Adresse (Google Places), Koordinaten
- Telefon, Besondere Bedürfnisse (Rollstuhl, Sauerstoff, Begleitperson)
- Soft-Delete (`is_active`)

**Driver**
- Name, Email (unique), Telefon
- Verfügbarkeitsblöcke (Mo-Fr, 08:00-18:00, 2h-Intervalle)
- Abwesenheiten (Datum von/bis, Grund)
- Soft-Delete

**Destination**
- Name, Adresse (Google Places), Koordinaten
- Ankunftsfenster (optional, z.B. 08:00-09:00 für Dialyse)
- Soft-Delete

**Ride**
- Patient, Fahrer (optional), Destination
- Abholzeit, Ankunftszeit, Rückfahrtzeit (optional)
- Status: `planned → confirmed → in_progress → completed` (oder `cancelled`)
- Geschätzte Dauer/Distanz (Google Directions API)
- Recurrence Group (für Rückfahrten/Serien)

**AvailabilityBlock**
- Fahrer, Wochentag (0-4 = Mo-Fr), Startzeit, Endzeit
- Beispiel: Mo 08:00-10:00

**Absence**
- Fahrer, Datum von/bis, Grund (Urlaub, Krankheit, Sonstiges)

Schema: [`/supabase/schema.sql`](./supabase/schema.sql)

---

## Rollen & Berechtigungen

### Dispatcher (Admin)
- Sieht alle Fahrten, Fahrer, Patienten, Ziele
- Erstellt/bearbeitet/löscht Stammdaten
- Weist Fahrten Fahrern zu
- Desktop-optimiertes UI

### Fahrer (Driver)
- Sieht nur eigene zugewiesene Fahrten
- Bestätigt/lehnt Fahrten ab
- Startet/beendet Fahrten (Status-Updates)
- Pflegt eigene Verfügbarkeit und Abwesenheiten
- Mobile-First UI (Smartphone)

**Sicherheit**: Row Level Security (RLS) Policies in Supabase trennen Zugriff.

Details: [`/docs/workflow-canvas.md#workflow-10`](./docs/workflow-canvas.md#workflow-10-rollen--governance)

---

## Design-Prinzipien

### Product Philosophy
**"Boring reliability over novel solutions"**
- Bewährte Patterns statt experimenteller Features
- Explizite Workflows statt magischer Automatisierung
- Pragmatismus statt Perfektion
- Schnelles Feedback durch iterative Releases

### UX-Prinzipien
- **Dispatcher**: Desktop-optimiert, Tastatur-freundlich, Information Density
- **Fahrer**: Mobile-First, Touch-optimiert, große Buttons, reduzierte Komplexität
- **Minimalistisch**: Uber-inspiriertes Design (Schwarz, Blau, Grau)
- **Performance**: <2s Page Load, <500ms API Response

### Code-Prinzipien
- TypeScript strict mode
- Server Components first (Client Components nur wenn nötig)
- Security by default (V2 Server Actions)
- Soft Deletes (keine harten Löschungen)
- Explicit Error Handling (keine stillen Fehler)

Details: [`tailwind.config.ts`](./tailwind.config.ts), [`CLAUDE.md`](./CLAUDE.md)

---

## Entwicklungs-Guidelines

### Git Commit Messages
```
feat: Add login page with Supabase Auth (#9)
fix: Prevent SQL injection in patient search (#15)
docs: Update workflow canvas with RLS policies
refactor: Extract DriverDropdown to separate component
test: Add test scenarios for ride creation (#18)
```

Format: `<type>: <description> (#issue-number)`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Code Review Checklist
- [ ] TypeScript strict mode errors behoben
- [ ] Server-side Validierung (Zod Schema)
- [ ] Client-side Validierung (Formular)
- [ ] Error Handling implementiert
- [ ] Responsive Design (Desktop + Mobile getestet)
- [ ] Security: Input sanitized, SQL Injection verhindert
- [ ] Performance: Keine unnötigen Client Components
- [ ] Acceptance Criteria aus User Story erfüllt

### Testing
**Sprint 1**: Manuelles Testing (siehe `/docs/test-plan.md`)
- Unit Tests: Später (Sprint 3+)
- E2E Tests: Später (Sprint 4+)

**Vor jedem Commit**:
1. `npm run lint` (keine Errors)
2. `npm run build` (Build erfolgreich)
3. Relevante Test-Szenarien aus Test Plan manuell durchführen

---

## Sprint 1 Getting Started

### Für neue Developer

**Tag 1: Setup**
1. Repository klonen, Dependencies installieren
2. `.env.local` konfigurieren (Supabase + Google Maps)
3. Datenbank-Schema ausführen
4. Dokumentation lesen:
   - [`/docs/sprint-1-overview.md`](./docs/sprint-1-overview.md)
   - [`/docs/workflow-canvas.md`](./docs/workflow-canvas.md) (Workflow 1, 10)

**Tag 2-3: Authentication**
1. Issue #9: Login-Seite implementieren
2. Issue #10: Logout-Funktion
3. Issue #11: RLS Policies (Supabase SQL)
4. Testing: TS-1.1, TS-1.2, TS-1.3, TS-1.4

**Tag 4-7: Stammdaten**
1. Issue #12-14: Patienten CRUD
2. Issue #15-16: Fahrer CRUD
3. Issue #17-18: Destinations CRUD
4. Testing: TS-1.5, TS-1.6

**Tag 8-10: Fahrten**
1. Issue #19: Fahrt anlegen (komplex!)
2. Issue #20: Fahrtenliste mit Filter
3. Issue #21: Fahrer zuweisen mit Verfügbarkeits-Check
4. Testing: TS-1.7, TS-1.8, TS-1.9

**Tag 11-12: Kalender + Polishing**
1. Issue #22: Kalender Wochen-Ansicht
2. Issue #23-24: Fahrt bearbeiten/stornieren
3. Testing: Alle Test-Szenarien Sprint 1
4. Demo-Szenario üben

**Tag 13-14: Sprint Review**
1. Demo für Product Owner
2. Retrospektive
3. Sprint 2 Planning

---

## Umgebungen

| Umgebung | URL | Zweck |
|----------|-----|-------|
| **Development** | `http://localhost:3000` | Lokale Entwicklung |
| **Staging** | TBD (Vercel) | Pre-Production Tests |
| **Production** | TBD (Vercel) | Live System (ab Go-Live) |

**Supabase Projekte**:
- Development: Lokale DB oder separates Supabase Projekt
- Production: Produktiv-Projekt (nach Sprint 6)

---

## FAQ

### Warum Next.js und nicht React SPA?
Next.js Server Components reduzieren JavaScript-Bundle, verbessern SEO (nicht kritisch, aber nice), und Server Actions vereinfachen API-Layer. Für Dispatcher (Desktop) ist SSR kein Performance-Problem.

### Warum Supabase und nicht eigenes Backend?
Supabase = PostgreSQL + Auth + Real-time in einem. Spart 50% Entwicklungszeit vs. Express/NestJS. RLS Policies bieten Sicherheit auf DB-Ebene.

### Warum Google Maps und nicht OpenStreetMap?
Google Places Autocomplete ist präziser für Schweizer Adressen. Kosten: ~$50/Monat bei 5000 Requests. Falls Budget-Problem: Migration zu Nominatim (OSM) möglich.

### Warum keine Native App?
PWA (Progressive Web App) reicht für MVP. Fahrer nutzen Mobile Browser. Native App = 3× Aufwand (iOS, Android, Web). Post-MVP evaluieren falls Bedarf.

### Wie skaliert das bei 10× Traffic?
Vercel skaliert automatisch. Supabase: Upgrade auf Pro Plan ($100/Monat). PostgreSQL: Connection Pooling aktivieren. Google Maps: Caching implementieren.

### Ist das DSGVO-konform?
Supabase EU-Region (Frankfurt). Soft-Deletes behalten Daten. Rechtliche Prüfung vor Go-Live notwendig (Privacy Policy, Patient Consent).

---

## Team & Kontakt

**Product Owner**: Greg (siehe Workflow Canvas)
- Verantwortlich für: Requirements, Priorisierung, Acceptance Testing

**Developer**: AI-assisted Development (Claude Code)
- Verantwortlich für: Implementation, Testing, Deployment

**Stakeholder**: [Name einfügen]

**Kommunikation**:
- GitHub Issues für Tasks und Bugs
- Pull Requests für Code Review
- Sprint Review alle 2 Wochen
- Async Standups (optional)

---

## Lizenz

[Lizenz einfügen, z.B. MIT oder Proprietary]

---

## Danksagungen

- **Next.js Team** – Für das beste React Framework
- **Supabase Team** – Für PostgreSQL as a Service
- **Google Maps Platform** – Für zuverlässige Geo-APIs
- **Anthropic Claude** – Für AI-assisted Development

---

**Let's build something reliable! 🚀**

*Fahrdienst – Weil Patiententransporte effizienter koordiniert werden sollten.*
