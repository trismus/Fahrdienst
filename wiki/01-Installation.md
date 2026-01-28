# Installation & Setup

Eine Schritt-für-Schritt Anleitung zum Einrichten der Fahrdienst-Entwicklungsumgebung.

---

## Voraussetzungen

- **Node.js**: 18.17+ (empfohlen: 20 LTS)
- **npm**: 9+
- **Git**: 2.40+
- **Supabase Account**: [supabase.com](https://supabase.com) (kostenlos)
- **Google Maps API Key**: [console.cloud.google.com](https://console.cloud.google.com)
- **Text-Editor**: VS Code (empfohlen mit Tailwind CSS IntelliSense Extension)

---

## Schritt 1: Repository klonen

```bash
git clone https://github.com/your-org/fahrdienst.git
cd fahrdienst
```

---

## Schritt 2: Dependencies installieren

```bash
npm install
```

Dies installiert alle erforderlichen Packages (Next.js, React, Tailwind, Supabase Client, etc.).

---

## Schritt 3: Environment Variables konfigurieren

### 3.1 `.env.local` Datei erstellen

```bash
cp .env.local.example .env.local
```

### 3.2 Variablen ausfüllen

Öffne `.env.local` und fülle folgende Werte ein:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Google Maps (Client-side)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_xxxx...

# Google Maps (Server-side, optional für Route-Berechnung)
GOOGLE_MAPS_SERVER_API_KEY=AIzaSyD_xxxx...

# SMS-Benachrichtigungen (optional)
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+41791234567
```

Siehe **Schritt 4** für Details zu jeder Variable.

---

## Schritt 4: API-Keys beschaffen

### 4.1 Supabase Setup

1. Gehe zu [supabase.com/dashboard](https://supabase.com/dashboard)
2. Neues Projekt erstellen oder bestehendes öffnen
3. Gehe zu **Settings → API**
4. Kopiere:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4.2 Google Maps API

1. Öffne [console.cloud.google.com](https://console.cloud.google.com)
2. Neues Projekt erstellen
3. Aktiviere diese APIs:
   - **Places API** (für Adressen-Autocomplete)
   - **Directions API** (für Route-Berechnung)
   - **Distance Matrix API** (für Entfernungen)
4. Erstelle einen **API Key**
5. Kopiere → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Restricted API Keys (empfohlen für Production):**
- Client-Side Key: HTTP Referer-Beschränkung (domain.com)
- Server-Side Key: Keine Beschränkung (oder Server-IP)

### 4.3 Twilio (optional, für SMS)

1. Gehe zu [twilio.com/console](https://twilio.com/console)
2. Neue Trial-Account oder bestehende nutzen
3. Kopiere:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth Token → `TWILIO_AUTH_TOKEN`
4. Kaufe eine Twilio-Nummer (z.B. +41791234567) → `TWILIO_FROM_NUMBER`

**Hinweis**: Für Testing reicht Trial mit 10 kostenlosen SMS.

---

## Schritt 5: Datenbank-Schema initialisieren

Die Datenbank muss mit den Tabellen initialisiert werden.

### 5.1 Supabase SQL Editor öffnen

1. Gehe zu Supabase Dashboard
2. Wähle dein Projekt
3. Gehe zu **SQL Editor**

### 5.2 Schema laden

1. Öffne `/supabase/schema.sql` lokal
2. Kopiere den kompletten SQL-Code
3. Füge ihn im Supabase SQL Editor ein
4. Drücke **Run**

Dies erstellt alle Tabellen:
- `patients`
- `drivers`
- `destinations`
- `rides`
- `availability_blocks`
- `absences`
- `user_roles` (für Rollen-Management)

### 5.3 Weitere SQL-Dateien (optional)

Für Production recommended:
- `/supabase/rls-policies.sql` – Row Level Security Policies
- `/supabase/seed-data.sql` – Beispiel-Daten zum Testen

---

## Schritt 6: Entwicklungs-Server starten

```bash
npm run dev
```

Der Server läuft unter `http://localhost:3000`

Öffne im Browser:
```
http://localhost:3000
```

Du solltest ein Login-Formular sehen.

---

## Schritt 7: Test-Account anlegen

### 7.1 In Supabase Auth Benutzer erstellen

1. Supabase Dashboard → **Authentication → Users**
2. **New user** Button
3. Email: `test-dispatcher@example.com`
4. Passwort: `Test1234!`
5. Erstellen

### 7.2 Benutzer-Rolle setzen

1. Supabase SQL Editor öffnen
2. Folgendes SQL ausführen:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'dispatcher'
FROM auth.users
WHERE email = 'test-dispatcher@example.com';
```

### 7.3 Anmelden

- Gehe zu `http://localhost:3000`
- Email: `test-dispatcher@example.com`
- Passwort: `Test1234!`
- Klick **Login**

---

## Schritt 8: Stammdaten hinzufügen (Optional)

Um die App zu testen, kannst du Beispiel-Daten hinzufügen:

### 8.1 Patient anlegen

1. Nach Login: Sidebar → **Patienten**
2. Button **+ Neu**
3. Formular ausfüllen:
   - Name: "Max Muster"
   - Adresse: "Bahnhofstrasse 5, 8000 Zürich" (Google Places wird Koordinaten ausfüllen)
   - Telefon: "+41791234567"
4. **Speichern**

### 8.2 Fahrer anlegen

1. Sidebar → **Fahrer**
2. Button **+ Neu**
3. Formular:
   - Name: "Hans Müller"
   - Email: "hans.mueller@example.com"
   - Telefon: "+41791234568"
4. **Speichern**

### 8.3 Destination anlegen

1. Sidebar → **Ziele**
2. Button **+ Neu**
3. Formular:
   - Name: "Kantonsspital Zürich"
   - Adresse: "Rämistrasse 100, 8091 Zürich"
4. **Speichern**

### 8.4 Fahrt anlegen

1. Sidebar → **Fahrten** → **+ Neu**
2. Formular:
   - Patient: "Max Muster" (Dropdown)
   - Destination: "Kantonsspital Zürich"
   - Abholzeit: Morgen, 08:00 Uhr
   - Fahrer: "Hans Müller"
3. **Speichern**

Du solltest die Fahrt jetzt im Kalender sehen!

---

## Schritt 9: Build & Production testen

### Development Build prüfen

```bash
npm run build
```

Dies erstellt eine optimierte Production-Version in `.next/`.

### Production-Server lokal starten

```bash
npm run start
```

Server läuft unter `http://localhost:3000` (Production-Version)

---

## Häufige Probleme

### Problem: "Environment variable not found"

**Lösung**: `.env.local` speichern und dev-Server neustarten:
```bash
npm run dev
```

### Problem: "Supabase connection failed"

**Mögliche Ursachen:**
1. `NEXT_PUBLIC_SUPABASE_URL` falsch kopiert
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` falsch kopiert
3. Netzwerk-Problem

**Lösung:**
- Werte in `.env.local` doppelt prüfen
- Supabase Dashboard → **Settings → API** → Werte nochmal kopieren

### Problem: "Google Maps API not loading"

**Mögliche Ursachen:**
1. API nicht aktiviert
2. API Key falsch
3. API Key mit falschen Beschränkungen

**Lösung:**
- Google Cloud Console → APIs aktivieren
- API Key doppelt prüfen in `.env.local`

### Problem: "Port 3000 already in use"

**Lösung**: Anderen Port nutzen:
```bash
npm run dev -- -p 3001
```

---

## Nächste Schritte

- Weiterführende Anleitung: **[02-Quick-Start](/wiki/02-Quick-Start.md)**
- Dispatcher How-To: **[03-Dispatcher-Guide](/wiki/03-Dispatcher-Guide.md)**
- Developer Setup: **[05-Developer-Guide](/wiki/05-Developer-Guide.md)**
- Deployment: **[07-Deployment](/wiki/07-Deployment.md)**

---

## Hilfe & Support

**Dokumentation im Repo:**
- `/CLAUDE.md` – Technischer Kontext
- `/docs/workflow-canvas.md` – Workflows & Requirements
- `/docs/README.md` – Dokumentations-Index

**Fragen im Team?**
- GitHub Issues erstellen
- Oder: Team Slack/Discord

---

**Installation abgeschlossen? Weiter zu [02-Quick-Start](/wiki/02-Quick-Start.md)!**
