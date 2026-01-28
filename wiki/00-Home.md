# Fahrdienst Wiki

Willkommen zur Fahrdienst App – einer webbasierten Dispatching-Plattform für die Koordination von nicht-notfallmäßigen Patiententransporten.

**Stand**: Sprint 4 abgeschlossen (Real-time Updates, SMS-Benachrichtigungen)
**Version**: 1.0 MVP (stabil für Production)
**Zielmarkt**: Schweiz (deutschsprachig)

---

## Was ist Fahrdienst?

Fahrdienst digitalisiert die Koordination von Patiententransporten:

**Für Disponenten (Admin):**
- Patienten, Fahrer und Ziele zentral verwalten
- Fahrten schnell anlegen und disponieren
- Fahrer intelligent zuweisen (mit Verfügbarkeits-Check)
- Fahrten im Kalender überblicken
- Live-Status der aktiven Fahrten verfolgen

**Für Fahrer:**
- Zugewiesene Fahrten auf dem Smartphone sehen
- Fahrten bestätigen oder ablehnen
- Verfügbarkeit in 2-Stunden-Blöcken pflegen
- Fahrt durchführen mit Status-Updates
- SMS- und Email-Benachrichtigungen erhalten

---

## Core Features

| Feature | Status | Verfügbar seit |
|---------|--------|-----------------|
| Dispatcher-Dashboard (Kalender, Übersicht) | ✅ Aktiv | Sprint 1 |
| Stammdaten-Verwaltung (Patient, Fahrer, Destination) | ✅ Aktiv | Sprint 1 |
| Fahrt-Management (anlegen, bearbeiten, stornieren) | ✅ Aktiv | Sprint 1 |
| Fahrer-Zuweisung mit Verfügbarkeits-Check | ✅ Aktiv | Sprint 1 |
| Fahrer-App (Mobile UI, Fahrten-Übersicht) | ✅ Aktiv | Sprint 2 |
| Verfügbarkeit & Abwesenheiten (Fahrer-Seite) | ✅ Aktiv | Sprint 2 |
| Fahrt-Bestätigung / Ablehnung | ✅ Aktiv | Sprint 2 |
| Email-Benachrichtigungen | ✅ Aktiv | Sprint 2 |
| Fahrt-Durchführung mit Status-Updates | ✅ Aktiv | Sprint 3 |
| Real-time Live-Updates (Dispatcher-Dashboard) | ✅ Aktiv | Sprint 4 |
| SMS-Benachrichtigungen | ✅ Aktiv | Sprint 4 |

---

## Schnelleinstieg

### Für Disponenten
1. **[Installation & Setup](/wiki/01-Installation.md)** – Entwicklungsumgebung vorbereiten
2. **[Benutzerhandbuch Dispatcher](/wiki/03-Dispatcher-Guide.md)** – Schritt-für-Schritt Anleitung
3. **[Workflow Canvas (Details)](/docs/workflow-canvas.md)** – Alle Workflows im Detail

### Für Fahrer (End User)
- **[Benutzerhandbuch Fahrer](/wiki/04-Driver-Guide.md)** – Mobile App bedienen

### Für Entwickler
1. **[Developer Guide](/wiki/05-Developer-Guide.md)** – Tech Stack, Projekt-Struktur
2. **[Architektur](/wiki/06-Architecture.md)** – Datenmodell, APIs, Real-time
3. **[Deployment](/wiki/07-Deployment.md)** – Vercel + Supabase

### Für Operations & DevOps
- **[Deployment](/wiki/07-Deployment.md)** – Produktion, Monitoring, Backups

---

## Dokumentation im Detail

### Priorität-Stufen

**MUSS lesen:**
- `/docs/workflow-canvas.md` – Die verbindliche Quelle für alle Requirements
- `/docs/README.md` – Dokumentations-Index und Navigation
- `CLAUDE.md` – Technische Übersicht und Development Context

**Sollte lesen (je nach Rolle):**
- `/docs/sprint-backlog.md` – Detaillierte User Stories
- `/docs/roadmap.md` – Release-Planung und Milestones
- `/docs/test-plan.md` – Test-Szenarien und QA-Checklist

**Kann später lesen:**
- `/docs/blueprint.md` – Original-Spezifikation (deutsch)
- `/docs/executive-summary.md` – Stakeholder-Übersicht

---

## Wichtigste Konzepte

### Rollen

**Dispatcher** (Admin)
- Benutzer-Email kann mehrere Rollen haben
- Voller Zugriff auf Stammdaten, Fahrten, Fahrer
- Kann Fahrer zuweisen und Fahrten disponieren
- Sieht Live-Status aller Fahrten

**Fahrer** (Driver)
- Sieht nur zugewiesene Fahrten
- Kann Fahrten bestätigen/ablehnen
- Kann Verfügbarkeit pflegen
- Empfängt Benachrichtigungen

**Admin**
- Verwaltet Benutzer-Accounts
- Kann RLS Policies konfigurieren
- Zugriff auf Supabase Dashboard

### Fahrt-Status

Eine Fahrt durchläuft folgende Stati:

```
planned (geplant)
  ↓
confirmed (bestätigt durch Fahrer)
  ↓
in_progress (Fahrer ist unterwegs)
  ↓
completed (abgeschlossen)
```

Zusätzlich möglich: `cancelled` (storniert)

### Key Entities

- **Patient**: Name, Adresse, Koordinaten, Telefon, besondere Bedürfnisse
- **Driver**: Name, Email, Telefon, Verfügbarkeitsnetz, Abwesenheiten
- **Destination**: Name, Adresse, Koordinaten, Ankunftsfenster
- **Ride**: Patient + Destination + Zeiten + Fahrer (optional)
- **AvailabilityBlock**: Fahrer-Verfügbarkeit (Mo-Fr in 2h-Blöcken)
- **Absence**: Fahrer-Abwesenheit (Urlaub, Krankheit)

---

## Tech Stack (Überblick)

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time, Auth)
- **Hosting**: Vercel (CI/CD, Auto-Scaling)
- **Maps**: Google Maps API (Places, Directions, Distance Matrix)
- **SMS**: Twilio
- **UI-System**: Minimalistisch, Uber-inspiriert

Für Vollständige technische Details: siehe `/wiki/05-Developer-Guide.md`

---

## Häufige Links

### Interne Dokumentation
- **Workflow Canvas**: `/docs/workflow-canvas.md` ← STARTPUNKT für alle Requirements
- **Developer Context**: `/CLAUDE.md` ← Für Codebase-Übersicht
- **Sprint Backlog**: `/docs/sprint-backlog.md` ← User Stories & Acceptance Criteria
- **Datenbank Schema**: `/supabase/schema.sql` ← Database DDL

### Externe Tools
- **Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Google Maps Console**: [console.cloud.google.com](https://console.cloud.google.com)
- **GitHub Repository**: [github.com/...](https://github.com/)

---

## Fragen & Hilfe

**Technische Fragen?**
- Siehe `/docs/README.md` → "Häufig gestellte Fragen"
- Oder: GitHub Issues erstellen mit Label `documentation` oder `question`

**Bug gefunden?**
- GitHub Issue mit Label `bug`
- Reproduction Steps hinzufügen

**Feedback zur Dokumentation?**
- Direkt ein Pull Request erstellen
- Oder: Issue erstellen

---

## Navigation

| Seite | Für wen? | Inhalt |
|-------|---------|--------|
| **[01-Installation](/wiki/01-Installation.md)** | Developer | Setup, Dependencies, Environment Variables |
| **[02-Quick-Start](/wiki/02-Quick-Start.md)** | Developer | Schnell einen lokalen Server starten |
| **[03-Dispatcher-Guide](/wiki/03-Dispatcher-Guide.md)** | Dispatcher/Enduser | How-To: Fahrten planen und disponieren |
| **[04-Driver-Guide](/wiki/04-Driver-Guide.md)** | Fahrer/Enduser | How-To: Mobile App nutzen |
| **[05-Developer-Guide](/wiki/05-Developer-Guide.md)** | Developer | Architektur, Server Actions, Components |
| **[06-Architecture](/wiki/06-Architecture.md)** | Developer | Datenmodell, Datenbank, APIs, Real-time |
| **[07-Deployment](/wiki/07-Deployment.md)** | DevOps | Production Setup, Monitoring, Skalierung |

---

**Viel Spaß mit Fahrdienst! 🚗**

Für schnelle Übersicht: Siehe `/docs/README.md` (Hauptdokumentation-Index)
