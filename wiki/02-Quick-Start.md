# Quick Start (5 Minuten)

Schnelle Übersicht zum Starten der Fahrdienst-App im Development-Modus.

---

## TL;DR

```bash
# 1. Repository klonen
git clone https://github.com/your-org/fahrdienst.git
cd fahrdienst

# 2. Dependencies installieren
npm install

# 3. .env.local kopieren und ausfüllen
cp .env.local.example .env.local
# → Editor öffnen, Supabase URL + Keys eintragen

# 4. Development-Server starten
npm run dev

# 5. Browser öffnen
# http://localhost:3000
```

---

## Minimale Environment

Die App funktioniert mit nur diesen 2 Variablen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_xxxx...
```

**Ohne diese:** Authentifizierung und Adress-Autocomplete funktionieren nicht.

---

## Was funktioniert lokal?

Nach `npm run dev`:

| Feature | ✅/❌ | Notes |
|---------|-------|-------|
| Login/Logout | ✅ | Supabase Auth |
| Dispatcher-Dashboard | ✅ | Kalender, Live-Updates |
| Stammdaten (CRUD) | ✅ | Patient, Fahrer, Destination |
| Fahrt-Management | ✅ | Anlegen, bearbeiten, stornieren |
| Adress-Autocomplete | ✅ | Google Places API |
| Fahrer-App (Mobile) | ✅ | Fahrten sehen, bestätigen/ablehnen |
| SMS-Benachrichtigungen | ⚠️ | Nur wenn Twilio konfiguriert |
| Email-Benachrichtigungen | ⚠️ | Nur wenn Supabase Email konfiguriert |

---

## Befehle

```bash
# Development-Server starten
npm run dev

# Production-Build erstellen
npm run build

# Production-Server starten (lokal)
npm run start

# Linting (ESLint)
npm run lint

# Linting mit Fix
npm run lint -- --fix
```

---

## Struktur erkunden

Nach dem Login suchst du nach:

### Dispatcher-Seite (Admin-Panel)
```
http://localhost:3000/dispatcher/dashboard       # Kalender & Übersicht
http://localhost:3000/dispatcher/rides           # Fahrten-Liste
http://localhost:3000/dispatcher/drivers         # Fahrer-Verwaltung
http://localhost:3000/dispatcher/patients        # Patient-Verwaltung
http://localhost:3000/dispatcher/destinations    # Ziel-Verwaltung
```

### Fahrer-Seite (Mobile App)
```
http://localhost:3000/driver/rides               # Meine Fahrten
http://localhost:3000/driver/availability        # Meine Verfügbarkeit
```

---

## Testdaten schnell hinzufügen

### SQL zum manuellen Eintrag

In Supabase SQL Editor:

```sql
-- Patienten
INSERT INTO patients (name, formatted_address, latitude, longitude, phone, is_active)
VALUES
  ('Max Muster', 'Bahnhofstrasse 5, 8000 Zürich', 47.3769, 8.5472, '+41791234567', true),
  ('Anna Schmidt', 'Limmatquai 100, 8001 Zürich', 47.3703, 8.5466, '+41791234568', true);

-- Fahrer
INSERT INTO drivers (name, email, phone, is_active)
VALUES
  ('Hans Müller', 'hans.mueller@example.com', '+41791234569', true),
  ('Eva Keller', 'eva.keller@example.com', '+41791234570', true);

-- Destinations
INSERT INTO destinations (name, formatted_address, latitude, longitude, is_active)
VALUES
  ('Kantonsspital Zürich', 'Rämistrasse 100, 8091 Zürich', 47.3744, 8.5533, true),
  ('Uniklinik', 'Gloriastrasse 19, 8091 Zürich', 47.3794, 8.5507, true);

-- Fahrten (für diese Woche)
INSERT INTO rides (patient_id, driver_id, destination_id, pickup_time, arrival_time, status, is_active)
SELECT
  p.id AS patient_id,
  d.id AS driver_id,
  dest.id AS destination_id,
  NOW() + INTERVAL '1 day 08:00', -- Morgen, 08:00
  NOW() + INTERVAL '1 day 08:30', -- Ankunft
  'planned',
  true
FROM patients p, drivers d, destinations dest
WHERE p.name = 'Max Muster' AND d.name = 'Hans Müller' AND dest.name = 'Kantonsspital Zürich'
LIMIT 1;
```

---

## Debugging

### Network-Tab anschauen
```
Browser DevTools → Network → Filter: "api"
```

### Supabase Logs prüfen
```
Supabase Dashboard → Logs → SQL
```

### TypeScript Fehler
```bash
npm run lint
```

---

## Performance lokal

- **Initial Load**: ~2-3s (Next.js cold start)
- **Page Navigation**: ~500ms (React Router)
- **API Calls**: ~200-500ms (Supabase)
- **Real-time Updates**: ~100-200ms (Supabase Realtime)

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `Module not found` | `npm install` und `npm run dev` neu starten |
| `Supabase connection failed` | `.env.local` prüfen, dev-Server neustarten |
| `Google Maps not loading` | API Key in `.env.local` prüfen, ggf. API aktivieren |
| `Port 3000 in use` | `npm run dev -- -p 3001` (alternativer Port) |

---

## Nächste Schritte

1. **Vollständige Installation**: **[01-Installation](/wiki/01-Installation.md)**
2. **Dispatcher Anleitung**: **[03-Dispatcher-Guide](/wiki/03-Dispatcher-Guide.md)**
3. **Für Entwickler**: **[05-Developer-Guide](/wiki/05-Developer-Guide.md)**

---

**Ready to go? Öffne `http://localhost:3000` und leg los!**
