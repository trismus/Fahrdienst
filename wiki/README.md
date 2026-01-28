# Fahrdienst GitHub Wiki

Willkommen zur offiziellen Dokumentation der Fahrdienst-Applikation – einer webbasierten Dispatching-Plattform für nicht-notfallmäßige Patiententransporte.

---

## Schnelle Navigation

### Für den Start
1. **[00-Home](/wiki/00-Home.md)** – Übersicht und Feature-Matrix
2. **[01-Installation](/wiki/01-Installation.md)** – Komplette Setup-Anleitung
3. **[02-Quick-Start](/wiki/02-Quick-Start.md)** – In 5 Minuten laufen lassen

### Für Endnutzer
- **[03-Dispatcher-Guide](/wiki/03-Dispatcher-Guide.md)** – Für Disponenten: Fahrten planen, Fahrer zuweisen
- **[04-Driver-Guide](/wiki/04-Driver-Guide.md)** – Für Fahrer: Mobile App bedienen

### Für Entwickler
- **[05-Developer-Guide](/wiki/05-Developer-Guide.md)** – Tech Stack, Projekt-Struktur, Components
- **[06-Architecture](/wiki/06-Architecture.md)** – Datenmodell, APIs, Real-time
- **[07-Deployment](/wiki/07-Deployment.md)** – Production Setup auf Vercel/Supabase

### Verbindliche Dokumentation
- **[/docs/workflow-canvas.md](/docs/workflow-canvas.md)** ⭐ – WICHTIGSTE Datei: 10 Kern-Workflows
- **[/docs/README.md](/docs/README.md)** – Hauptdokumentation und Index
- **[/CLAUDE.md](/CLAUDE.md)** – Developer Context für AI und Codebase-Übersicht

---

## Wiki-Struktur

| Seite | Für wen? | Fokus | Zeit |
|-------|---------|-------|------|
| **00-Home** | Alle | Feature-Übersicht, Konzepte | 5 min |
| **01-Installation** | Developer | Lokales Setup | 30 min |
| **02-Quick-Start** | Developer | Schnelle Variante | 5 min |
| **03-Dispatcher-Guide** | Enduser/Dispatcher | How-To Bedienung | 20 min |
| **04-Driver-Guide** | Enduser/Fahrer | How-To Bedienung | 15 min |
| **05-Developer-Guide** | Developer | Tech Stack & Architektur | 30 min |
| **06-Architecture** | Developer | Tiefe Systemarchitektur | 45 min |
| **07-Deployment** | DevOps/Developer | Production Setup | 60 min |

---

## Wichtigste Konzepte

### Rollen

- **Dispatcher (Admin)**: Plant Fahrten, weist Fahrer zu, sieht alle Daten
- **Fahrer (Driver)**: Sieht eigene Fahrten, bestätigt/lehnt ab, pflegt Verfügbarkeit

### Fahrt-Status

```
planned → confirmed → in_progress → completed
```

(+ `cancelled` jederzeit möglich)

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Hosting**: Vercel (Serverless)
- **Maps**: Google Maps API
- **SMS**: Twilio

---

## Status der Entwicklung

**Sprint 1-2**: Dispatcher Workflows ✅ Abgeschlossen
- Stammdaten-Verwaltung
- Fahrt-Management
- Kalender-Ansicht
- Fahrer-Zuweisung

**Sprint 3**: Fahrer Mobile UI ✅ Abgeschlossen
- Fahrer-App
- Fahrt-Bestätigung
- Verfügbarkeit-Verwaltung

**Sprint 4**: Production Features ✅ Abgeschlossen
- Real-time Live-Updates
- SMS-Benachrichtigungen
- Status-Tracking
- Performance-Optimierung

**Status**: **Production Ready** 🚀

---

## Häufige Fragen

### Q: Wo finde ich die Requirements?
A: **[/docs/workflow-canvas.md](/docs/workflow-canvas.md)** – Das ist die verbindliche Quelle für alle 10 Workflows.

### Q: Wie starte ich local?
A: **[01-Installation](/wiki/01-Installation.md)** dann **[02-Quick-Start](/wiki/02-Quick-Start.md)**

### Q: Wie deploye ich?
A: **[07-Deployment](/wiki/07-Deployment.md)**

### Q: Welche Features sind im MVP?
A: Siehe **[00-Home](/wiki/00-Home.md)** → Feature-Matrix oder **[/docs/roadmap.md](/docs/roadmap.md)**

### Q: Wo ist der Quellcode?
A: `/src/` Verzeichnis im Repo
- Frontend: `/src/app`, `/src/components`
- Backend: `/src/lib/actions`, `/src/lib/supabase`
- Datenbank: `/supabase/schema.sql`

---

## Contribution Guide

### Dokumentation aktualisieren

1. Fork Repository
2. Edit Datei in `/wiki/`
3. Commit mit aussagekräftiger Message:
   ```
   docs: Update Driver Guide with new features
   ```
4. Push & Pull Request
5. Review & Merge

### Fehler gefunden?

- GitHub Issue erstellen mit Label `documentation`
- Oder: PR mit Fix einreichen

---

## External Resources

### Official Documentation
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Google Maps**: [developers.google.com/maps](https://developers.google.com/maps)

### Status Pages
- **Vercel Status**: [status.vercel.com](https://status.vercel.com)
- **Supabase Status**: [status.supabase.com](https://status.supabase.com)

### Tools
- **Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)

---

## Team & Support

### Documentation
- Owner: Silke (Senior Documentation Specialist)
- Language: German (primary), English (technical terms)

### Questions?
- Check `/docs/README.md` for FAQ
- Create GitHub Issue
- Or: Ask in Team Slack/Discord

### Feedback?
- Comments im PR
- Issues
- Direct conversation

---

## Project Structure in Repo

```
fahrdienst/
├── wiki/                          ← You are here
│   ├── 00-Home.md                 (Overview)
│   ├── 01-Installation.md         (Setup)
│   ├── 02-Quick-Start.md          (5 min)
│   ├── 03-Dispatcher-Guide.md     (User manual)
│   ├── 04-Driver-Guide.md         (User manual)
│   ├── 05-Developer-Guide.md      (Tech)
│   ├── 06-Architecture.md         (Tech)
│   ├── 07-Deployment.md           (Ops)
│   ├── README.md                  (This file)
│   └── _SIDEBAR.md                (Navigation)
├── docs/                          ← Product docs
│   ├── README.md                  (Index)
│   ├── workflow-canvas.md         (IMPORTANT!)
│   ├── sprint-backlog.md
│   ├── roadmap.md
│   ├── test-plan.md
│   └── ...more docs
├── src/                           ← Source code
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── supabase/                      ← Database
│   ├── schema.sql
│   ├── rls-policies.sql
│   └── seed-data.sql
├── CLAUDE.md                      ← AI Context
├── package.json
└── ... other config files
```

---

## Version History

| Date | Version | Changes | Status |
|------|---------|---------|--------|
| 2026-01-28 | 1.0 | Complete Wiki (Sprint 1-4) | ✅ Released |

---

## License

All documentation is part of the Fahrdienst project and follows the same license as the codebase.

---

## Let's Ship It! 🚀

Ready to get started?
1. Start here: **[00-Home](/wiki/00-Home.md)**
2. Setup: **[01-Installation](/wiki/01-Installation.md)**
3. Build: **[05-Developer-Guide](/wiki/05-Developer-Guide.md)**
4. Deploy: **[07-Deployment](/wiki/07-Deployment.md)**

**Questions? Check [/docs/README.md](/docs/README.md) or create an issue!**
