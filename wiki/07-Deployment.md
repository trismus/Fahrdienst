# Deployment Guide

Eine praktische Anleitung für Deployment der Fahrdienst-App zu Production auf Vercel und Supabase.

---

## Überblick

Fahrdienst läuft auf:
- **Frontend & Serverless Functions**: Vercel (Hosting, CI/CD, Auto-Scaling)
- **Database & Auth**: Supabase (Managed PostgreSQL)
- **DNS**: Custom Domain (z.B. fahrdienst.example.com)

---

## Pre-Deployment Checklist

Vor dem ersten Deployment:

- [ ] Supabase Projekt erstellt
- [ ] Datenbank-Schema initialisiert (`supabase/schema.sql`)
- [ ] Environment Variables konfiguriert
- [ ] Google Maps API Keys beschafft
- [ ] Twilio SMS Account (optional)
- [ ] GitHub Repository connected zu Vercel
- [ ] SSL/TLS Zertifikat bereit

---

## Schritt 1: Supabase Production Setup

### 1.1 Neues Projekt erstellen

1. Gehe zu [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New Project** Button
3. Name: "fahrdienst-production"
4. Region: "Europe (Frankfurt)" (nächst zu Schweiz)
5. Password für Postgres: Generiert automatisch, speichern!
6. **Create new project** → Warte ~5 Minuten

### 1.2 Datenbank-Schema laden

1. Öffne Supabase Dashboard
2. Gehe zu **SQL Editor**
3. **+ New query**
4. Kopiere Inhalt von `/supabase/schema.sql`
5. **Run** Button
6. Warte auf Abschluss

### 1.3 RLS Policies laden (Security)

1. **+ New query**
2. Kopiere Inhalt von `/supabase/rls-policies.sql` (falls vorhanden)
3. **Run**

### 1.4 API Keys kopieren

1. Gehe zu **Settings → API**
2. Kopiere folgende Werte:
   - `Project URL` → Speichern (brauchst du später)
   - `anon` key → Speichern
   - `service_role` key → Speichern (sicher aufbewahren)

### 1.5 Auth Konfigurieren

1. Gehe zu **Authentication → Providers**
2. Email Provider sollte aktiviert sein (default)
3. (Optional) Third-party providers (Google, GitHub)

---

## Schritt 2: Environment Variables in Vercel

### 2.1 Vercel Project erstellen

1. Gehe zu [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Add New** → **Project**
3. Importiere dein GitHub Repository (`fahrdienst`)
4. Vercel zeigt Preview

### 2.2 Environment Variables setzen

1. **Project Settings** → **Environment Variables**
2. Füge diese Variablen hinzu:

```env
# Supabase (von Schritt 1.4)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_xxxx...
GOOGLE_MAPS_SERVER_API_KEY=AIzaSyD_yyyy...

# Twilio (optional, für SMS)
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+41791234567

# NODE_ENV
NODE_ENV=production
```

**Wichtig**: Setze "Environments" für jede Variable:
- ✅ Production
- ✅ Preview (optional)
- ✅ Development (optional)

### 2.3 Deployment Test

1. Merke deinen Branch auf `main`
2. Push zu GitHub:
   ```bash
   git add .
   git commit -m "config: production deployment"
   git push origin main
   ```
3. Vercel baut automatisch
4. Warte auf "Deployment Successful" ✅

---

## Schritt 3: Custom Domain (Optional)

### 3.1 Domain kaufen

Falls noch keine Domain:
- Google Domains
- Namecheap
- GoDaddy
- Oder: Bestehendes Hosting-Angebot

### 3.2 Domain zu Vercel hinzufügen

1. **Vercel Dashboard** → dein Projekt → **Settings**
2. **Domains** Section
3. **Add Domain**
4. Tippe deine Domain ein: `fahrdienst.example.com`
5. Vercel zeigt DNS Records

### 3.3 DNS Records aktualisieren

Bei deinem Domain-Provider:
1. Gehe zu DNS Settings
2. Füge diese Records hinzu:
   - `A` Record: `76.76.19.165` → `fahrdienst.example.com`
   - (Vercel zeigt genaue Records)
3. Warte 15-60 Minuten auf Propagation

### 3.4 SSL Zertifikat

Vercel erstellt automatisch kostenloses SSL-Zertifikat. Warte ~10 Minuten.

---

## Schritt 4: Monitoring & Logging

### 4.1 Vercel Logs

```
Vercel Dashboard → Deployments → Log Output
- Build Logs: Fehler während npm run build
- Runtime Logs: Fehler während Betrieb
- Edge Logs: Serverless Function Errors
```

### 4.2 Supabase Logs

```
Supabase Dashboard → Logs
- Database Query Logs (Performance, Errors)
- API Request Logs
- Auth Logs
```

### 4.3 Error Monitoring (später)

Später empfohlen:
- Sentry (error tracking)
- LogRocket (session replay)
- DataDog (comprehensive monitoring)

---

## Schritt 5: Database Backups

### 5.1 Automatische Backups (Supabase)

Supabase backup automatisch täglich:
1. Supabase Dashboard → **Backups**
2. Siehst du tägliche snapshots
3. Kannst jederzeit auf alte Version zurückwechseln

### 5.2 Manuelle Backup

Vor großen Migrationen:

```bash
# Mit Supabase CLI (optional)
supabase db pull

# Oder: Manuell im Dashboard
# Supabase → Backups → Download
```

---

## Schritt 6: Production Checklist

Vor Go-Live:

- [ ] Environment Variables alle konfiguriert
- [ ] Database Schema aktualisiert
- [ ] RLS Policies aktiviert
- [ ] SMS konfiguriert (falls gewünscht)
- [ ] Backup genommen
- [ ] Smoke Tests durchführen:
  - [ ] Login funktioniert
  - [ ] Patient anlegen funktioniert
  - [ ] Fahrt anlegen funktioniert
  - [ ] Kalender zeigt Fahrt
  - [ ] Fahrer-App funktioniert
- [ ] Admins trainiert
- [ ] Support-Plan bereit
- [ ] Monitoring aktiv
- [ ] Error Handling getestet

---

## Schritt 7: Skalierung & Performance

### 7.1 Vercel Settings

Für höheres Traffic:
1. **Vercel Dashboard** → **Settings**
2. Upgrade auf **Pro Plan** (optional)
3. Edge Caching: Bereits aktiviert

### 7.2 Supabase Skalierung

Falls viele gleichzeitige Nutzer:
1. **Supabase Dashboard** → **Settings**
2. Upgrade auf **Team oder Enterprise Plan**
3. Höhere Connection Limits
4. Increased Real-time Subscriptions

### 7.3 Database Optimization

Falls Performance-Issues:

```sql
-- Erstelle Indizes auf häufig gefilterten Feldern
CREATE INDEX rides_driver_id ON rides(driver_id);
CREATE INDEX rides_status ON rides(status);
CREATE INDEX rides_pickup_time ON rides(pickup_time);
CREATE INDEX drivers_email ON drivers(email);
CREATE INDEX patients_is_active ON patients(is_active);
CREATE INDEX destinations_is_active ON destinations(is_active);
```

---

## Troubleshooting

### Problem: Vercel Build schlägt fehl

**Fehler**: `Build failed with code 1`

**Lösungsschritte**:
1. Schaue Build Logs an (Vercel Dashboard)
2. Prüfe auf TypeScript Fehler: `npm run lint`
3. Prüfe Dependencies: `npm install` lokal neu
4. Pushe Fixes zu GitHub

### Problem: "Supabase connection refused"

**Ursache**: Environment Variables falsch oder nicht gesetzt

**Lösung**:
1. Vercel Settings → Environment Variables prüfen
2. URLs exakt kopieren (kein extra whitespace)
3. Redeploy: **Vercel Dashboard → Redeploy**

### Problem: "Google Maps API not loading"

**Ursache**: API Key falsch oder nicht aktiviert

**Lösung**:
1. Google Cloud Console → APIs aktivieren
2. API Key prüfen in Vercel Environment Variables
3. Für Production: Separate API Keys (nicht Development-Keys)

### Problem: Slow Page Load

**Ursache**: Unoptimierte Queries oder fehlende Indizes

**Lösung**:
1. Supabase Logs → langsame Queries identifizieren
2. Indizes erstellen (siehe Schritt 7.3)
3. Pagination implementieren (statt alle Rows laden)

---

## Continuous Deployment (CI/CD)

Vercel deployt automatisch bei jedem Push zu `main`:

```
Git Push zu main
    ↓
GitHub Webhook → Vercel
    ↓
Vercel startet Build
    ↓
npm run build
    ↓
npm run lint (optional)
    ↓
npm run test (optional)
    ↓
Deployment zu Vercel
    ↓
Production URL aktualisiert
```

### Deploy Anpassen

1. **Vercel Dashboard** → **Project Settings** → **Git**
2. Configure welche Branch zu deployen (default: `main`)
3. Optionale Build Commands anpassen

---

## Rollback bei Problemen

Falls Production kaputt:

### Option 1: Letzte Working Version

1. **Vercel Dashboard** → **Deployments**
2. Finde letzte funktionierende Deployment
3. Klick **Promote to Production**

### Option 2: Git Revert

```bash
git revert HEAD               # Undo last commit
git push origin main          # Vercel deployt automatisch neue Version
```

### Option 3: Database Restore

Falls Datenbank-Issue:
1. **Supabase Dashboard** → **Backups**
2. Wähle Backup vor Problem
3. **Restore**

---

## Monitoring in Production

### Tägliche Checks

- [ ] Vercel Deployment Status (green?)
- [ ] Supabase Status (green?)
- [ ] Database Connection OK?
- [ ] Error Rate acceptable?
- [ ] Response Times normal?

### Wöchentliche Checks

- [ ] Backup vorhanden?
- [ ] Logs prüfen auf Anomalien?
- [ ] Performance-Trend OK?
- [ ] Security Alerts?

### Monatliche Checks

- [ ] Database Maintenance?
- [ ] Connection Limits?
- [ ] Disk Space Usage?
- [ ] Upgrade notwendig?

---

## Production Secrets Management

**Wichtig:** Niemals hardcoden!

Verwendete Strategien:
1. **Vercel Environment Variables** (Web UI)
2. **GitHub Secrets** (für Actions)
3. **Supabase Vault** (für Service Secrets später)

```bash
# FALSCH - Nie tun!
const apiKey = "AIzaSyD_xxxx";  // Gehört in .env.local!

# RICHTIG - .env.local Datei
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_xxxx
```

---

## Performance Optimization (Production)

### 1. Image Optimization

Next.js optimiert Images automatisch:

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority={true}  // Load in priority
/>
```

### 2. Caching Strategies

```typescript
// Cache für 60 Sekunden (dann revalidate)
export const revalidate = 60;

// On-demand revalidation nach Server Action
revalidatePath('/dispatcher/rides');
```

### 3. Database Query Optimization

```typescript
// FALSCH: Alle Fahrten laden
const rides = await supabase.from('rides').select('*');

// RICHTIG: Mit Pagination
const { data, count } = await supabase
  .from('rides')
  .select('*', { count: 'exact' })
  .range(0, 19)
  .order('pickup_time', { ascending: false });
```

---

## Cost Optimization

| Service | Tier | Kosten/Monat | Limit |
|---------|------|-------------|-------|
| **Vercel** | Pro | $20 | Unlimited |
| **Supabase** | Pro | $25 | High |
| **Google Maps** | Pay-as-you-go | ~$50 | High |
| **Twilio** | Pay-as-you-go | ~$30 | High |
| **Total** | | ~$125 | Sufficient for MVP |

**Sparen:**
- Supabase: Shared database vs. dedicated
- Google Maps: Caching, Batch requests
- Twilio: Negotiate volume discount (100+ SMS/day)

---

## Disaster Recovery Plan

### Szenarien & Lösungen

| Szenario | Lösung | Zeit |
|----------|--------|------|
| Server Down | Rollback zu letztem Build | 5 min |
| Database Down | Restore von Backup | 30 min |
| Security Breach | Rotate all secrets | 1 hour |
| Data Loss | Recover von Backup | 1 hour |
| DDoS Attack | Vercel DDoS Protection | Auto |

---

## Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Status Pages**:
  - Vercel: [status.vercel.com](https://status.vercel.com)
  - Supabase: [status.supabase.com](https://status.supabase.com)
- **CLAUDE.md**: Development Context (im Repo)

---

## Support & Escalation

**Vercel Support**: support@vercel.com
**Supabase Support**: support@supabase.io
**Internal Team**: [Slack/Discord Channel]

---

**Production Deployment erfolgreich? Gratuliere! 🚀**

Nächste Schritte:
- Monitoring aufsetzen
- Team trainieren
- Beta-Testing mit echten Kunden starten
