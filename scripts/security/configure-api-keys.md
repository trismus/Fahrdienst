# Google Maps API Key Configuration

This document describes how to properly configure Google Maps API keys for security.

## Overview

Fahrdienst uses two separate API keys:

1. **Client Key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) - Used in the browser for Maps JavaScript API
2. **Server Key** (`GOOGLE_MAPS_SERVER_API_KEY`) - Used server-side for Directions and Distance Matrix APIs

## Security Principle

**Never use the same API key for client and server operations.**

- Client keys are exposed in the browser and can be extracted by anyone
- Server keys should be restricted to your server IP addresses only
- Each key should only have access to the APIs it needs

## Client Key Configuration

### Step 1: Create the Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to: APIs & Services > Credentials
4. Click "Create Credentials" > "API key"
5. Name it: `fahrdienst-client`

### Step 2: Application Restrictions

1. Click on the key to edit
2. Under "Application restrictions", select "HTTP referrers"
3. Add your allowed websites:

**Production:**
```
https://your-domain.ch/*
https://www.your-domain.ch/*
```

**Vercel Deployments:**
```
https://fahrdienst-*.vercel.app/*
```

**Development (optional - consider using a separate dev key):**
```
http://localhost:3000/*
http://127.0.0.1:3000/*
```

### Step 3: API Restrictions

1. Select "Restrict key"
2. Enable only these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### Step 4: Save and Deploy

Add to your environment:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

## Server Key Configuration

### Step 1: Create the Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to: APIs & Services > Credentials
4. Click "Create Credentials" > "API key"
5. Name it: `fahrdienst-server`

### Step 2: Application Restrictions

1. Click on the key to edit
2. Under "Application restrictions", select "IP addresses"
3. Add your server IPs:

**Vercel (Serverless):**
Unfortunately, Vercel uses dynamic IPs. Options:
- Leave unrestricted but use API restrictions
- Use a proxy service with static IPs
- Consider Google Maps Platform Premium for additional security

**Self-hosted:**
Add your server's static IP:
```
203.0.113.1
```

### Step 3: API Restrictions

1. Select "Restrict key"
2. Enable only these APIs:
   - Directions API
   - Distance Matrix API

### Step 4: Save and Deploy

Add to your environment (server-only, never expose to client):
```bash
GOOGLE_MAPS_SERVER_API_KEY=AIza...
```

**IMPORTANT:** This key should NEVER:
- Be prefixed with `NEXT_PUBLIC_`
- Be committed to version control
- Be visible in client-side code

## Quota and Billing

### Recommended Quotas

Set quotas to prevent unexpected charges:

| API | Daily Limit | Recommended |
|-----|-------------|-------------|
| Maps JavaScript API | Unlimited free tier | 28,500/day |
| Directions API | Pay per use | 2,500/day |
| Distance Matrix API | Pay per use | 2,500/day |
| Places API | Pay per use | 10,000/day |
| Geocoding API | Pay per use | 10,000/day |

### Set Quotas

1. Go to: APIs & Services > Quotas
2. Filter by API
3. Set appropriate limits

## Monitoring

### Enable Alerts

1. Go to: APIs & Services > Dashboard
2. Click on each API
3. Set up budget alerts for unexpected spikes

### Check Usage

Review usage regularly:
- APIs & Services > Dashboard
- Look for unusual patterns
- Check for 403 errors (unauthorized usage attempts)

## Troubleshooting

### "API key not valid" Error

1. Check the key is not restricted to wrong APIs
2. Verify HTTP referrer restrictions include your domain
3. Ensure the key hasn't been regenerated

### "Request denied" Error

1. Check IP restrictions allow your server
2. Verify the API is enabled for your project
3. Check billing is enabled

### "Over quota" Error

1. Check quota limits in Google Cloud Console
2. Consider upgrading your plan
3. Optimize your application to reduce API calls

## Verification

### Test Client Key

Open browser console on your site and check for errors loading the map.

### Test Server Key

```bash
curl "https://maps.googleapis.com/maps/api/directions/json?origin=Zurich&destination=Bern&key=YOUR_SERVER_KEY"
```

Should return route data, not an error.

## Security Checklist

- [ ] Client key has HTTP referrer restrictions
- [ ] Client key is restricted to client-side APIs only
- [ ] Server key is NOT prefixed with NEXT_PUBLIC_
- [ ] Server key is restricted to server-side APIs only
- [ ] Quotas are set to reasonable limits
- [ ] Billing alerts are configured
- [ ] Keys are stored in environment variables (not code)
- [ ] Keys are different for development and production
