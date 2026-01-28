# Demo-Umgebung einrichten

Diese Anleitung beschreibt, wie du eine funktionierende Demo-Umgebung mit Test-Usern einrichtest.

## Voraussetzungen

- Supabase-Projekt erstellt
- Alle Migrations ausgeführt (001-006)
- Seed-Daten geladen (`seed.sql`)

---

## Schritt 1: Demo-User in Supabase erstellen

1. Öffne das [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt
3. Gehe zu **Authentication** → **Users**
4. Klicke auf **Add User** → **Create New User**

### User 1: Dispatcher (Admin)

| Feld | Wert |
|------|------|
| Email | `dispatcher@demo.fahrdienst.ch` |
| Password | `Demo1234!` |
| Auto Confirm User | ✅ Aktivieren |

### User 2: Fahrer (Driver)

| Feld | Wert |
|------|------|
| Email | `fahrer@demo.fahrdienst.ch` |
| Password | `Demo1234!` |
| Auto Confirm User | ✅ Aktivieren |

---

## Schritt 2: User-IDs kopieren

Nach dem Erstellen der User:

1. Klicke auf jeden User in der Liste
2. Kopiere die **User UID** (z.B. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

Notiere dir:
- Dispatcher User ID: `_______________________`
- Fahrer User ID: `_______________________`

---

## Schritt 3: SQL-Script ausführen

1. Gehe zu **SQL Editor** im Supabase Dashboard
2. Öffne die Datei `supabase/demo-users-setup.sql`
3. Ersetze die Platzhalter-UUIDs mit den echten User-IDs:

```sql
v_dispatcher_user_id UUID := 'DEINE-DISPATCHER-UUID-HIER';
v_driver_user_id UUID := 'DEINE-FAHRER-UUID-HIER';
```

4. Führe das Script aus
5. Prüfe die Ausgabe auf Erfolg

---

## Schritt 4: Testen

### Als Dispatcher anmelden

1. Öffne die App: `http://localhost:3000`
2. Melde dich an mit:
   - Email: `dispatcher@demo.fahrdienst.ch`
   - Password: `Demo1234!`
3. Du solltest zum **Dashboard** weitergeleitet werden
4. Du hast Zugriff auf:
   - Patienten, Fahrer, Ziele (CRUD)
   - Fahrten planen und zuweisen
   - Kalender-Ansicht

### Als Fahrer anmelden

1. Melde dich ab (falls eingeloggt)
2. Melde dich an mit:
   - Email: `fahrer@demo.fahrdienst.ch`
   - Password: `Demo1234!`
3. Du solltest zu **Meine Fahrten** weitergeleitet werden
4. Du hast Zugriff auf:
   - Zugewiesene Fahrten anzeigen
   - Fahrten bestätigen/starten/abschliessen
   - Eigene Verfügbarkeit pflegen

---

## Fehlerbehebung

### "Invalid login credentials"

- Prüfe, ob der User in Supabase Auth existiert
- Prüfe, ob "Auto Confirm User" aktiviert war
- Falls nicht: Gehe zu Authentication → Users → Klicke auf User → "Confirm User"

### Dispatcher wird zu "/my-rides" umgeleitet

- Die Rolle wurde nicht korrekt gesetzt
- Führe das SQL-Script erneut aus
- Prüfe in der `profiles` Tabelle: `SELECT * FROM profiles;`

### Fahrer sieht keine Fahrten

- Der Fahrer-Record muss mit dem User verknüpft sein
- Prüfe: `SELECT * FROM drivers WHERE user_id IS NOT NULL;`
- Dem Fahrer müssen Fahrten zugewiesen werden

### "Permission denied" Fehler

- RLS-Policies sind aktiv
- Prüfe, ob die Rolle in `profiles` korrekt ist
- Für Debugging: `SELECT * FROM profiles WHERE id = auth.uid();`

---

## Schnell-Setup (Copy & Paste)

Wenn du die User bereits erstellt hast, hier das komplette SQL:

```sql
-- Ersetze mit deinen echten UUIDs!
DO $$
DECLARE
    dispatcher_id UUID := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
    driver_id UUID := 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy';
BEGIN
    -- Dispatcher als Admin
    INSERT INTO profiles (id, role, display_name)
    VALUES (dispatcher_id, 'admin', 'Demo Dispatcher')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';

    -- Fahrer-Profil
    INSERT INTO profiles (id, role, display_name)
    VALUES (driver_id, 'driver', 'Demo Fahrer')
    ON CONFLICT (id) DO UPDATE SET display_name = 'Demo Fahrer';

    -- Fahrer mit Driver-Record verknüpfen
    UPDATE drivers SET user_id = driver_id WHERE driver_code = 'TEST-DRV-01';
END $$;
```

---

## Demo-Credentials Übersicht

| Rolle | Email | Password | Zugriff |
|-------|-------|----------|---------|
| Dispatcher | `dispatcher@demo.fahrdienst.ch` | `Demo1234!` | Vollzugriff |
| Fahrer | `fahrer@demo.fahrdienst.ch` | `Demo1234!` | Eigene Fahrten |

---

*Letzte Aktualisierung: Januar 2026*
