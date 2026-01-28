# Executive Summary – Fahrdienst App

**Projekt**: Fahrdienst – Dispatching-Plattform für Patiententransporte
**Status**: Ready for Sprint 1
**Datum**: 2026-01-28
**Product Owner**: Greg

---

## Projektziel

Eine **webbasierte Dispatching-Plattform** für die Koordination von nicht-notfallmäßigen Patiententransporten. Die App ermöglicht es Disponenten, Fahrten effizient zu planen, Fahrern zuzuweisen und den Status in Echtzeit zu verfolgen.

**Kernversprechen**: Boring reliability over novel solutions – wir bauen ein zuverlässiges Werkzeug für echte operative Prozesse.

---

## Business Value

### Problem
Heute werden Patiententransporte oft manuell koordiniert (Telefon, Excel, Papier):
- **Ineffizient**: Dispatcher verlieren Zeit mit Telefongesprächen
- **Fehleranfällig**: Doppelbuchungen, verpasste Termine
- **Intransparent**: Dispatcher wissen nicht, welcher Fahrer verfügbar ist
- **Kein Tracking**: Keine Echtzeit-Übersicht über Fahrt-Status

### Lösung
Fahrdienst App digitalisiert den gesamten Prozess:
- **Zentrale Planung**: Dispatcher sehen alle Fahrten, Fahrer, Patienten in einer App
- **Automatische Routenberechnung**: Google Maps Integration spart manuelle Arbeit
- **Verfügbarkeits-Check**: System zeigt, welche Fahrer verfügbar sind
- **Echtzeit-Updates**: Fahrer bestätigen/starten/beenden Fahrten → Dispatcher sieht Status live
- **Mobile-First für Fahrer**: Fahrer nutzen Smartphone für alle Interaktionen

### ROI (nach 6 Monaten)
- **Zeitersparnis**: -30% Planungszeit pro Fahrt (5 min → 3.5 min)
- **Fehlerreduktion**: -50% Doppelbuchungen/Konflikte
- **Skalierung**: +100% Fahrten bei gleichem Dispatcher-Team

---

## Projektumfang

### MVP Features (3 Monate)
**Phase 1: Dispatcher Workflows** (Sprint 1-2, 4 Wochen)
- Stammdaten-Verwaltung (Patienten, Fahrer, Destinations)
- Fahrt anlegen/bearbeiten/stornieren
- Fahrer zuweisen mit Verfügbarkeits-Check
- Kalender-Übersicht (Woche)

**Phase 2: Fahrer Integration** (Sprint 3-4, 4 Wochen)
- Fahrer sieht zugewiesene Fahrten (Mobile UI)
- Fahrer bestätigt/lehnt Fahrt ab
- Email-Benachrichtigung bei Zuweisung
- Fahrer pflegt Verfügbarkeit und Abwesenheiten

**Phase 3: Production Launch** (Sprint 5-6, 4 Wochen)
- Fahrer startet/beendet Fahrt (Status-Tracking)
- SMS-Benachrichtigung
- Sicherheits-Audit und Performance-Optimierung
- **Launch mit echten Kunden**

### Explizit NICHT im MVP
- Wiederkehrende Fahrten → Post-MVP
- Automatische Fahrer-Vorschläge (KI) → Post-MVP
- Abrechnung & Reporting → Post-MVP
- Native Mobile App → Post-MVP (PWA reicht)

---

## Timeline & Milestones

| Milestone | Datum | Deliverable |
|-----------|-------|-------------|
| **M1: Dispatcher kann disponieren** | 2026-02-25 | Stammdaten + Fahrt anlegen + Kalender |
| **M2: Fahrer können reagieren** | 2026-03-25 | Fahrer UI + Benachrichtigungen |
| **M3: Production Launch** | 2026-04-25 | Status-Tracking + Sicherheits-Audit |

**Go-Live**: 2026-04-25 (12 Wochen ab heute)

---

## Technologie-Stack

- **Frontend**: Next.js 15 (React), Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Hosting**: Vercel (CI/CD, Auto-Scaling)
- **Maps**: Google Maps API (Places, Directions)
- **Notifications**: Supabase Email + Twilio SMS

**Warum dieser Stack?**
- **Schnelle Entwicklung**: Next.js + Supabase = 50% weniger Code als traditionelles Backend
- **Skalierbar**: Vercel handled 10.000+ Requests/Minute ohne Infrastruktur-Management
- **Bewährt**: Stack wird von Uber, Airbnb, DoorDash genutzt (ähnliche Use Cases)
- **AI-friendly**: Claude Code arbeitet optimal mit TypeScript + Next.js

---

## Budget & Ressourcen

### Team
- **1 Developer** (AI-assisted, Vollzeit)
- **1 Product Owner** (Sie, 20% Zeit)

### Infrastruktur-Kosten (monatlich)
- Supabase Pro: $25/Monat (PostgreSQL, Auth, Real-time)
- Vercel Pro: $20/Monat (Hosting, CI/CD)
- Google Maps API: ~$50/Monat (geschätzt, 5000 Requests)
- Twilio SMS: ~$50/Monat (geschätzt, 1000 SMS)
- **Total: ~$150/Monat**

### Skalierung (bei 10× Traffic)
- Supabase: $100/Monat
- Vercel: $100/Monat
- Google Maps: $200/Monat
- Twilio: $200/Monat
- **Total: ~$600/Monat**

**Kosten pro Fahrt**: <$0.50 (bei 1000 Fahrten/Monat)

---

## Risiken & Mitigationen

| Risiko | Impact | Wahrscheinlichkeit | Mitigation |
|--------|--------|-------------------|------------|
| Google Maps API zu teuer | Hoch | Mittel | Caching implementieren, Alternative vorbereiten (OpenStreetMap) |
| Supabase RLS Policies fehlerhaft | Kritisch | Mittel | Umfassende Tests, Penetration Test vor Launch |
| Fahrer haben kein Smartphone | Mittel | Niedrig | Fallback: Desktop-Login für Fahrer, Telefon-Benachrichtigung |
| Datenschutz (DSGVO) | Kritisch | Niedrig | Rechtliche Prüfung, Privacy Policy, Einwilligung einholen |
| Timeline zu ambitioniert | Mittel | Mittel | Scope-Reduktion: Kalender/Benachrichtigungen verschiebbar |

**Notfall-Plan**: Falls 12 Wochen zu knapp → Phase 2 (Fahrer Integration) auf 16 Wochen strecken. Dispatcher-Workflows alleine sind bereits wertvoll.

---

## Success Metrics

### Launch Criteria (Go-Live)
- [ ] Alle P0 Bugs geschlossen
- [ ] Min. 10 Test-Fahrten erfolgreich durchgeführt
- [ ] RLS Policies verifiziert (kein Data Leak)
- [ ] Performance: <2s Page Load, <500ms API Response
- [ ] Sicherheits-Audit abgeschlossen

### 3 Monate nach Launch
- **Operational Metrics**:
  - >20 Fahrten/Tag
  - >80% Bestätigungsrate (Fahrten bestätigt innerhalb 2h)
  - >95% Abschlussrate (Fahrten erfolgreich abgeschlossen)
- **User Satisfaction**:
  - NPS >40 (Dispatcher)
  - NPS >30 (Fahrer)
- **Technical Metrics**:
  - >99.5% Uptime
  - <5 Support-Tickets/Woche

---

## Nächste Schritte

### Diese Woche (KW 5/2026)
1. **Dokumentation finalisieren** ✅ (dieses Dokument)
2. **Sprint 1 Planning** (siehe `/docs/sprint-1-overview.md`)
3. **Development Environment Setup** (Supabase, Vercel, Google Maps API)

### Nächste 2 Wochen (Sprint 1)
- Login & Authentication
- Stammdaten-Verwaltung (Patienten, Fahrer, Destinations)
- Fahrt anlegen/bearbeiten
- Kalender-Übersicht

### Approval benötigt
- [ ] **Budget freigegeben?** ($150/Monat Infrastruktur)
- [ ] **Timeline akzeptiert?** (12 Wochen MVP)
- [ ] **Scope bestätigt?** (siehe Roadmap)

---

## Ansprechpartner

- **Product Owner**: Greg (verantwortlich für Requirements, Priorisierung, Abnahme)
- **Technical Lead**: Developer (AI-assisted, verantwortlich für Implementierung)

**Dokumentation**:
- `/docs/workflow-canvas.md` – 10 Kern-Workflows (verbindliche Grundlage)
- `/docs/roadmap.md` – Releases & Milestones
- `/docs/sprint-backlog.md` – Detaillierte User Stories
- `/docs/sprint-1-overview.md` – Quick Reference für Sprint 1
- `/docs/test-plan.md` – Test-Szenarien & Qualitätssicherung

---

## Appendix: Competitive Landscape

**Vergleichbare Lösungen**:
- **RouteWise**: $199/Monat, komplex, Overkill für kleine Teams
- **CareTransport**: $149/Monat, keine Mobile App für Fahrer
- **Excel/Telefon**: Kostenlos, aber ineffizient

**Fahrdienst App**:
- **Kostengünstiger**: $150/Monat Infrastruktur (kein SaaS-Aufschlag)
- **Spezialisiert**: Genau auf Patiententransporte zugeschnitten
- **Modern**: Mobile-First, Echtzeit-Updates
- **Ownership**: Volle Kontrolle über Code & Daten

---

**Fazit**: Fahrdienst App ist ein **gut definiertes, realistisch umsetzbares Projekt** mit klarem Business Value. Die technische Basis ist gelegt, das Team ist bereit, die Dokumentation ist verbindlich. **Ready to build!**
