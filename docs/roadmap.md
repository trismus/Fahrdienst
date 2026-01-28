# Fahrdienst App – Product Roadmap

**Version**: 1.0
**Product Owner**: Greg
**Letzte Aktualisierung**: 2026-01-28

---

## Vision

Eine webbasierte Dispatching-Plattform für nicht-notfallmäßige Patiententransporte, die Disponenten und Fahrer effizient koordiniert. **Boring reliability over novel solutions** – wir bauen ein zuverlässiges Werkzeug für echte operative Prozesse.

---

## Releases Overview

| Release | Zeitraum | Ziel | Status |
|---------|----------|------|--------|
| **MVP 0.1** | Sprint 1-2 (Woche 1-4) | Dispatcher kann disponieren | 🟡 In Planning |
| **MVP 0.2** | Sprint 3-4 (Woche 5-8) | Fahrer können reagieren | ⚪ Geplant |
| **v1.0** | Sprint 5-6 (Woche 9-12) | Production-Ready | ⚪ Geplant |
| **v1.1** | Sprint 7+ (Post-MVP) | Operational Excellence | ⚪ Backlog |

---

## MVP 0.1 – "Dispatcher kann disponieren"

### Ziel
Ein Dispatcher kann Patienten, Fahrer und Destinationen verwalten, Fahrten anlegen, Fahrern zuweisen und im Kalender visualisieren.

### Scope
- ✅ Authentication (Login/Logout, Rollen)
- ✅ Stammdaten-Verwaltung (Patient, Fahrer, Destination)
- ✅ Fahrerverfügbarkeit (readonly für Dispatcher)
- ✅ Fahrt anlegen/bearbeiten/stornieren
- ✅ Manuelle Fahrer-Zuweisung mit Verfügbarkeits-Check
- ✅ Kalender-Ansicht (Woche)
- ✅ Fahrtenliste mit Filter

### Explizit NICHT enthalten
- ❌ Benachrichtigungen (Email/SMS)
- ❌ Driver Mobile UI
- ❌ Wiederkehrende Fahrten
- ❌ Status-Tracking durch Fahrer
- ❌ Automatische Fahrer-Vorschläge

### User Stories
Siehe `/docs/sprint-backlog.md` für Details.

---

## MVP 0.2 – "Fahrer können reagieren"

### Ziel
Fahrer können sich anmelden, zugewiesene Fahrten sehen, bestätigen/ablehnen und Verfügbarkeit pflegen. Benachrichtigungen funktionieren.

### Scope
- ✅ Driver Mobile UI (Responsive)
- ✅ Fahrer sieht zugewiesene Fahrten
- ✅ Fahrer bestätigt/lehnt Fahrt ab
- ✅ Fahrer pflegt Verfügbarkeit (AvailabilityGrid)
- ✅ Fahrer pflegt Abwesenheiten
- ✅ Email-Benachrichtigung bei Zuweisung
- ⚠️ SMS-Benachrichtigung (optional, falls Zeit)

### Explizit NICHT enthalten
- ❌ Fahrt-Durchführung (Status-Updates)
- ❌ Wiederkehrende Fahrten
- ❌ Problem-Meldung während Fahrt

---

## v1.0 – "Production-Ready"

### Ziel
Fahrer können Fahrten durchführen und Status live aktualisieren. System ist stabil genug für echten Betrieb mit ersten Kunden.

### Scope
- ✅ Fahrer startet/beendet Fahrt
- ✅ Status-Tracking (in_progress, completed)
- ✅ Timestamps (started_at, picked_up_at, arrived_at, completed_at)
- ✅ Dispatcher sieht Live-Status
- ✅ SMS-Benachrichtigung implementiert
- ✅ Fehlerbehandlung & Edge Cases (siehe Workflow Canvas)
- ✅ Performance-Optimierung (>100 Fahrten/Tag)
- ✅ Sicherheits-Audit (Penetration Test)

---

## v1.1 – "Operational Excellence"

### Ziel
System ist ausgereift für täglichen Betrieb mit erweiterten Features.

### Scope
- ✅ Wiederkehrende Fahrten (Workflow 4)
- ✅ Problem-Meldung während Fahrt
- ✅ Automatische Änderungs-Benachrichtigungen
- ✅ Audit Log (wer hat wann was geändert)
- ✅ Erweiterte Filter & Suche
- ✅ Statistik-Dashboard (basic)

---

## Post-v1.1 – "Scale & Optimize"

### Backlog (nicht priorisiert)
- Automatische Fahrer-Vorschläge (ML-basiert)
- Route-Optimierung (mehrere Fahrten kombinieren)
- Abrechnung & Reporting (Workflow 9)
- Native Mobile App (iOS/Android)
- Offline-Support für Fahrer
- Multi-Tenant (mehrere Organisationen)
- API für Drittsysteme (z.B. Krankenhaus-Software)

---

## Milestones

### Milestone 1: Dispatcher Workflows (End of Sprint 2)
**Datum**: ca. 2026-02-25
**Definition of Done**:
- [ ] Dispatcher kann sich anmelden
- [ ] Dispatcher kann Patient/Fahrer/Destination anlegen
- [ ] Dispatcher kann Fahrt erstellen und Fahrer zuweisen
- [ ] Kalender zeigt Fahrten (Wochenansicht)
- [ ] Fahrtenliste mit Filter nach Datum/Status/Fahrer
- [ ] RLS Policies aktiv (Dispatcher sieht alles)

**Demo-Szenario**:
1. Login als Dispatcher
2. Patient "Max Muster" anlegen (Adresse via Google Places)
3. Destination "Kantonsspital Aarau" anlegen
4. Fahrt erstellen: Max Muster → Kantonsspital, morgen 09:00
5. Route wird berechnet (Dauer/Distanz)
6. Fahrer "Hans Müller" zuweisen (Dropdown zeigt Verfügbarkeit grün)
7. Fahrt erscheint in Kalender und Fahrtenliste

### Milestone 2: Driver Integration (End of Sprint 4)
**Datum**: ca. 2026-03-25
**Definition of Done**:
- [ ] Fahrer kann sich anmelden
- [ ] Fahrer sieht zugewiesene Fahrten
- [ ] Fahrer kann Fahrt bestätigen/ablehnen
- [ ] Fahrer kann Verfügbarkeit pflegen (AvailabilityGrid)
- [ ] Email-Benachrichtigung bei Zuweisung funktioniert
- [ ] Dispatcher sieht Bestätigung/Ablehnung in Echtzeit

**Demo-Szenario**:
1. Dispatcher weist Fahrt Fahrer zu
2. Fahrer erhält Email
3. Fahrer loggt sich ein, sieht Fahrt in Liste
4. Fahrer klickt "Bestätigen"
5. Status ändert sich zu `confirmed`
6. Dispatcher sieht Update im Kalender (Farbwechsel)

### Milestone 3: Production Launch (End of Sprint 6)
**Datum**: ca. 2026-04-25
**Definition of Done**:
- [ ] Fahrer kann Fahrt starten/abschließen
- [ ] Timestamps werden korrekt gespeichert
- [ ] SMS-Benachrichtigung funktioniert
- [ ] Alle kritischen Workflows getestet (siehe Test Plan)
- [ ] Sicherheits-Audit abgeschlossen
- [ ] Performance: <2s Page Load, <500ms API Response
- [ ] Dokumentation für Endnutzer (Kurzanleitung)

**Go/No-Go Kriterien**:
- ✅ Alle P0 Bugs geschlossen
- ✅ Min. 10 Test-Fahrten erfolgreich durchgeführt
- ✅ RLS Policies verifiziert (Fahrer kann nur eigene Fahrten sehen)
- ✅ Google Maps API Kosten kalkuliert (<$100/Monat für Start)
- ✅ Backup-Strategie implementiert

---

## Risiken & Mitigations

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Google Maps API zu teuer | Mittel | Hoch | Kostenüberwachung, Caching implementieren, Fallback auf OpenStreetMap vorbereiten |
| Supabase RLS Policies fehlerhaft | Mittel | Kritisch | Umfassende Tests, Code Review, Penetration Test vor Launch |
| Fahrer haben kein Smartphone | Niedrig | Mittel | Fallback: Telefon-Benachrichtigung, Desktop-Login für Fahrer |
| Performance bei >100 Fahrten/Tag | Mittel | Mittel | Pagination, Indexierung, Monitoring, Load Tests |
| Datenschutz (DSGVO) | Niedrig | Kritisch | Rechtliche Prüfung, Privacy Policy, Einwilligung einholen |

---

## Success Metrics (nach Launch)

### Operational Metrics
- **Fahrten pro Tag**: Target >20 innerhalb 3 Monate
- **Bestätigungsrate**: >80% der Fahrten bestätigt innerhalb 2h
- **Abschlussrate**: >95% der Fahrten erfolgreich abgeschlossen
- **Durchschnittliche Planungszeit**: <5 min pro Fahrt

### Technical Metrics
- **Uptime**: >99.5%
- **Page Load Time**: <2s (90th percentile)
- **API Response Time**: <500ms (95th percentile)
- **Error Rate**: <0.1%

### User Satisfaction
- **Dispatcher Zufriedenheit**: NPS >40 nach 3 Monaten
- **Fahrer Zufriedenheit**: NPS >30 nach 3 Monaten
- **Support-Tickets**: <5 pro Woche nach Onboarding-Phase

---

## Dependencies & Constraints

### External Dependencies
- **Supabase**: PostgreSQL, Auth, Real-time subscriptions
- **Google Maps API**: Places, Directions, Maps JavaScript API
- **Vercel**: Hosting, CI/CD
- **Email/SMS Provider**: Supabase Auth Email + (Twilio OR MessageBird)

### Technical Constraints
- Next.js 15 App Router (Server Components)
- TypeScript (strict mode)
- Tailwind CSS (no custom CSS modules)
- Mobile-first für Driver UI, Desktop-optimiert für Dispatcher UI

### Business Constraints
- Budget: $200/Monat für Infrastruktur (Supabase Pro, Google Maps, Vercel)
- Team: 1 Developer (AI-assisted), 1 Product Owner (Sie)
- Timeline: MVP Launch in 12 Wochen

---

## Decision Log

| Datum | Entscheidung | Begründung | Status |
|-------|--------------|------------|--------|
| 2026-01-28 | 4 Stati statt 6 für Ride Status | Einfachheit für MVP, Timestamps geben Info | ✅ Final |
| 2026-01-28 | Manuelle Disposition (kein Auto-Assignment) | Volle Kontrolle für Dispatcher | ✅ Final |
| 2026-01-28 | Rückfahrt als separate Fahrt | Einfachere DB-Logik | ✅ Final |
| 2026-01-28 | Notifications in Sprint 2 (nicht 1) | Dispatcher-Workflows zuerst | ✅ Final |
| 2026-01-28 | Keine Self-Service User-Registrierung | Geschlossenes System, Admin-managed | ✅ Final |
| TBD | Kalender-Komponente | FullCalendar vs. Custom | ⚪ Offen |
| TBD | SMS-Provider | Twilio vs. MessageBird | ⚪ Offen |
| TBD | Wiederkehrende Fahrten Logic | RRULE vs. Custom | ⚪ Offen |

---

**Nächster Schritt**: Sprint 1 Planning (siehe `/docs/sprint-backlog.md`).
