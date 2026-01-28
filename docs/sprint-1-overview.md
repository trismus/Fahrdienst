# Sprint 1 Overview – Quick Reference

**Sprint Goal**: "Dispatcher kann sich anmelden, Stammdaten verwalten und eine Fahrt anlegen"

**Dauer**: 2 Wochen (2026-02-01 bis 2026-02-14)
**Team**: 1 Developer (AI-assisted) + 1 Product Owner

---

## Must-Have Stories (P0)

### Week 1: Foundation
- [x] **Story 1.1**: Login-Seite (Email/Password) → `/login`
- [x] **Story 1.2**: Logout-Funktion
- [x] **Story 1.3**: RLS Policies (Dispatcher/Fahrer Rollen)
- [x] **Story 2.1**: Patienten-Liste → `/patients`
- [x] **Story 2.2**: Patient anlegen (Google Places Autocomplete)
- [x] **Story 2.5**: Fahrer CRUD → `/drivers`
- [x] **Story 2.6**: Destinations CRUD → `/destinations`

### Week 2: Core Dispatcher Workflow
- [x] **Story 3.1**: Fahrt anlegen → `/rides/new`
  - Patient + Destination auswählen
  - Route automatisch berechnen (Google Directions API)
  - Rückfahrt als separate Fahrt
- [x] **Story 3.2**: Fahrtenliste mit Filter → `/rides`
- [x] **Story 4.1**: Fahrer zuweisen mit Verfügbarkeits-Check
  - Dropdown zeigt Verfügbarkeit (Grün/Gelb/Grau)
- [x] **Story 5.1**: Wochen-Kalender → `/dashboard`
  - Fahrten als Cards mit Status-Farben

---

## Important (P1)
- [x] **Story 3.3**: Fahrt bearbeiten
- [x] **Story 3.4**: Fahrt stornieren
- [x] **Story 2.3**: Patient bearbeiten
- [x] **Story 2.4**: Patient löschen (Soft-Delete)

---

## Nice-to-Have (P2)
- [ ] Erweiterte Filter (Freitext-Suche)
- [ ] Ride-Detail mit Karte (RouteMap Component)
- [ ] Fahrer-Zuweisung entfernen

---

## Definition of Done (Sprint 1)

- [ ] Alle P0 Stories implementiert und getestet
- [ ] RLS Policies aktiv und verifiziert (siehe Test-Plan TS-1.4)
- [ ] Demo-Szenario erfolgreich durchführbar (siehe unten)
- [ ] Deployment auf Vercel Staging
- [ ] Code Review abgeschlossen
- [ ] Keine P0/P1 Bugs offen

---

## Demo-Szenario (End of Sprint 1)

**Ziel**: Zeigen, dass Dispatcher eine Fahrt von Anfang bis Ende planen kann

**Schritte**:
1. **Login**: Dispatcher loggt sich ein (`dispatcher@test.ch`)
2. **Patient anlegen**: "Max Mustermann", Adresse via Google Places, Telefon, Rollstuhl
3. **Destination anlegen**: "Kantonsspital Aarau", Adresse via Google Places
4. **Fahrer anlegen**: "Hans Müller", Email, Telefon
5. **Verfügbarkeit** (readonly): Dispatcher sieht, dass Hans Mo-Fr 08:00-10:00 verfügbar ist
6. **Fahrt anlegen**:
   - Patient: Max Mustermann
   - Destination: Kantonsspital Aarau
   - Abholzeit: Morgen 09:00
   - Route wird berechnet → Ankunftszeit automatisch gesetzt
   - Fahrer: Hans Müller zuweisen (Dropdown zeigt grün = verfügbar)
   - Speichern
7. **Kalender**: Fahrt erscheint im Wochen-Kalender als Card (grau = geplant)
8. **Fahrtenliste**: Fahrt erscheint in Liste, Filter funktioniert
9. **Fahrt bearbeiten**: Zeit ändern, speichern
10. **Fahrt stornieren**: Stornieren mit Grund "Patient hat abgesagt"
11. **Logout**: Dispatcher meldet sich ab

**Erwartete Dauer**: 5-7 Minuten

---

## Technical Implementation Checklist

### Routes zu erstellen
- [ ] `/app/login/page.tsx`
- [ ] `/app/(dispatcher)/dashboard/page.tsx`
- [ ] `/app/(dispatcher)/patients/page.tsx`
- [ ] `/app/(dispatcher)/patients/new/page.tsx`
- [ ] `/app/(dispatcher)/patients/[id]/edit/page.tsx`
- [ ] `/app/(dispatcher)/drivers/page.tsx`
- [ ] `/app/(dispatcher)/drivers/new/page.tsx`
- [ ] `/app/(dispatcher)/destinations/page.tsx`
- [ ] `/app/(dispatcher)/destinations/new/page.tsx`
- [ ] `/app/(dispatcher)/rides/page.tsx`
- [ ] `/app/(dispatcher)/rides/new/page.tsx`
- [ ] `/app/(dispatcher)/rides/[id]/edit/page.tsx`

### Components zu erstellen/anpassen
- [ ] `LoginForm` (neu)
- [ ] `PatientForm` (existiert, prüfen)
- [ ] `PatientList` (neu)
- [ ] `DriverForm` (existiert, prüfen)
- [ ] `DriverList` (neu)
- [ ] `DestinationForm` (existiert, prüfen)
- [ ] `DestinationList` (neu)
- [ ] `RideForm` (existiert, prüfen, erweitern)
- [ ] `RideList` (existiert, prüfen)
- [ ] `CalendarView` (existiert, integrieren)
- [ ] `DriverDropdown` mit Verfügbarkeits-Indikator (neu)

### Server Actions zu erstellen/härten
- [ ] `auth.ts`: `signIn()`, `signOut()`
- [ ] `patients-v2.ts`: Bereits vorhanden, prüfen
- [ ] `drivers-v2.ts`: Bereits vorhanden, prüfen, `getAvailableDrivers()` hinzufügen
- [ ] `destinations-v2.ts`: Bereits vorhanden, prüfen
- [ ] `rides.ts`: V2-Hardening (SQL Injection Protection, Rate Limiting)
  - `createRide()`, `getRides()`, `updateRide()`, `cancelRide()`

### Database
- [ ] Schema bereits vorhanden, prüfen
- [ ] RLS Policies erstellen (siehe `/docs/workflow-canvas.md` Workflow 10)
- [ ] `user_roles` Tabelle oder Custom Claims für Rollen

### External APIs
- [ ] Google Places Autocomplete (Component `AddressAutocomplete` bereits vorhanden)
- [ ] Google Directions API (Route `/api/routes/calculate` bereits vorhanden?)

---

## Risks & Mitigations

| Risiko | Mitigation |
|--------|------------|
| Google Places API zu langsam | Debounce Input (500ms), Loading Spinner |
| RLS Policies komplex | Dedizierter Test-Tag (Tag 5), Peer Review |
| Kalender-Component zu komplex | Falls FullCalendar Probleme macht → Custom Grid (einfacher) |
| Zeit zu knapp für alle P0 Stories | Priorisierung: Auth + Stammdaten + Fahrt anlegen = Minimum. Kalender kann Sprint 2 |

---

## Daily Standups (optional)

**Format** (async, schriftlich):
1. Gestern: Was wurde abgeschlossen?
2. Heute: Was ist geplant?
3. Blocker: Gibt es Hindernisse?

**Beispiel**:
- Gestern: Story 1.1 (Login) abgeschlossen, TS-1.1 und TS-1.2 erfolgreich getestet
- Heute: Story 1.3 (RLS Policies) starten
- Blocker: Unklar, wie Custom Claims in Supabase gesetzt werden → Recherche nötig

---

## Sprint Review (End of Week 2)

**Agenda**:
1. Demo-Szenario durchführen (5-7 min)
2. Review: Welche Stories sind Done? (10 min)
3. Test-Report: Welche Tests sind Pass/Fail? (5 min)
4. Retrospektive: Was lief gut? Was verbessern? (10 min)
5. Sprint 2 Preview: Grobe Planung (5 min)

**Teilnehmer**: Developer + Product Owner (+ optional: Stakeholder)

---

## Sprint Retrospective Questions

1. **Was lief gut?** (Keep doing)
2. **Was lief schlecht?** (Stop doing)
3. **Was können wir verbessern?** (Start doing)
4. **Action Items**: Konkrete Verbesserungen für Sprint 2

---

## Contact & Resources

- **Product Owner**: Greg (siehe `/docs/workflow-canvas.md`)
- **Documentation**: `/docs/` Verzeichnis
- **Codebase Context**: `/CLAUDE.md`
- **Supabase Dashboard**: [Link einfügen]
- **Vercel Staging**: [Link einfügen]
- **Google Maps API Console**: [Link einfügen]

---

**Let's build! 🚀**
