# Secrets Rotation Guide

This guide documents how to rotate all compromised secrets after the Git history cleanup.

## CRITICAL: Timeline

**All secrets must be rotated IMMEDIATELY after running the cleanup script.**

Even after removing secrets from Git history:
- They may still exist in cached copies
- They may have been scraped by bots
- They may exist in CI/CD logs or backups

---

## 1. Supabase Keys

### Service Role Key (MOST CRITICAL)

The service role key bypasses Row Level Security. If compromised, attackers have full database access.

**Steps to rotate:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** -> **API**
4. Under "Project API keys", click **Regenerate** for the `service_role` key
5. **WARNING**: This invalidates the old key immediately
6. Update your environment:
   - Vercel: Settings -> Environment Variables -> Update `SUPABASE_SERVICE_ROLE_KEY`
   - Local: Update `.env.local` (which is now gitignored)

### Anon Key

The anon key is public by design but should still be rotated.

1. Same location: **Settings** -> **API**
2. Click **Regenerate** for the `anon` key
3. Update:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### Database Password

1. Go to **Settings** -> **Database**
2. Click **Reset database password**
3. Update any direct database connections

---

## 2. Google Maps API Keys

### Steps to rotate:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** -> **Credentials**
4. Find your API key and click the pencil icon to edit
5. Click **Regenerate key** (or create a new key and delete the old one)
6. Update:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side key)
   - `GOOGLE_MAPS_SERVER_API_KEY` (server-side key)

### IMPORTANT: Configure API Key Restrictions

**Application Restrictions:**

For the client-side key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):
1. Set **Application restrictions** -> **HTTP referrers**
2. Add your domains:
   ```
   https://your-production-domain.com/*
   https://*.vercel.app/*
   http://localhost:3000/*
   ```

For the server-side key (`GOOGLE_MAPS_SERVER_API_KEY`):
1. Set **Application restrictions** -> **IP addresses**
2. Add your server IPs (or leave unrestricted if dynamic)

**API Restrictions:**

Limit each key to only the APIs it needs:

Client-side key:
- Maps JavaScript API
- Places API

Server-side key:
- Directions API
- Distance Matrix API
- Geocoding API

---

## 3. Twilio Credentials (if used)

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Account** -> **API keys & tokens**
3. Generate new API credentials
4. Update:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`

---

## 4. User Passwords

### Demo User Password

If a demo user password was committed:

1. Go to Supabase Dashboard -> **Authentication** -> **Users**
2. Find the demo user
3. Click **Reset password** or delete the user

### Admin Passwords

Force password reset for all admin users:

```sql
-- In Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data =
    raw_user_meta_data || '{"force_password_change": true}'::jsonb
WHERE id IN (
    SELECT id FROM profiles WHERE role = 'admin'
);
```

---

## 5. Environment Setup for Team

After rotation, share new credentials securely:

1. **NEVER** share via:
   - Email
   - Slack/Teams messages
   - Git commits
   - Screenshots

2. **DO** share via:
   - 1Password / LastPass / Bitwarden team vault
   - Encrypted file (GPG)
   - In-person / secure call

3. Create `.env.local.example` with placeholder values (this IS committed):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key-here
   ```

---

## 6. Verification Checklist

After rotating all secrets:

- [ ] Old Supabase keys return 401/403 errors
- [ ] Old Google Maps keys are disabled
- [ ] Application works with new keys (dev and prod)
- [ ] CI/CD pipelines have updated secrets
- [ ] Team members have new `.env.local`
- [ ] API key restrictions are configured
- [ ] Git history shows no secrets: `git log --all -p | grep -i "supabase\|api.*key"`

---

## 7. Monitoring

Set up alerts for unusual activity:

### Supabase
- Enable **Database Webhooks** for auth events
- Check **Logs** -> **API** for unusual patterns

### Google Cloud
- Enable **Cloud Monitoring** alerts
- Set up billing alerts for unexpected usage

---

## Contact

If you suspect ongoing unauthorized access:
1. Immediately disable/delete all API keys
2. Reset all user passwords
3. Review database access logs
4. Contact security@your-company.com
