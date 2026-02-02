# Distributed Rate Limiting Setup

This document describes how to set up distributed rate limiting using Upstash Redis.

## Why Distributed Rate Limiting?

In serverless environments (like Vercel), each request may be handled by a different instance. In-memory rate limiting doesn't work because:

1. Each instance has its own memory
2. Instances are ephemeral and can be recycled
3. There's no shared state between instances

**Solution:** Use Redis as a shared data store for rate limit counters.

## Setup Upstash Redis

### Step 1: Create Upstash Account

1. Go to [Upstash Console](https://console.upstash.com)
2. Sign up or log in
3. Create a new database

### Step 2: Configure Database

1. Name: `fahrdienst-ratelimit`
2. Region: Choose closest to your deployment (e.g., `eu-central-1` for Europe)
3. Type: Regional (or Global for multi-region deployments)
4. Plan: Free tier is sufficient for most use cases

### Step 3: Get Credentials

After creating the database:

1. Go to database details
2. Copy the REST URL and Token
3. These will be your environment variables

## Environment Variables

Add to your environment:

### Local Development (`.env.local`)

```bash
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://eu1-...upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

### Vercel

1. Go to your Vercel project
2. Settings > Environment Variables
3. Add both variables for Production, Preview, and Development

## Install Dependencies

```bash
npm install @upstash/redis
```

Note: The application will work without this package - it will fall back to in-memory rate limiting if Redis is not available.

## How It Works

### Rate Limit Algorithm

Uses a sliding window counter algorithm:

1. Each operation type + user ID creates a unique key
2. On each request, increment the counter atomically
3. If first request in window, set expiry time
4. If counter exceeds limit, deny request

### Key Format

```
ratelimit:{operation}:{userId}
```

Examples:
- `ratelimit:search:patients:user-123`
- `ratelimit:create:rides:user-456`
- `ratelimit:api:ip-192.168.1.1`

### Expiry

Keys automatically expire after the window period, so Redis memory stays clean.

## Rate Limits

Current limits (configurable in `src/lib/utils/rate-limit.ts`):

| Operation | Window | Max Requests |
|-----------|--------|--------------|
| Search | 1 min | 30 |
| Create | 1 min | 10 |
| Update | 1 min | 20 |
| Delete | 1 min | 5 |
| Login | 15 min | 5 |
| API | 1 min | 100 |

## Fallback Behavior

If Redis is not available:

1. **Development**: Uses in-memory rate limiting (acceptable)
2. **Production**: Logs warning, uses in-memory (not recommended)
3. **Redis error**: Allows request, logs error (fail-open to prevent outages)

## Monitoring

### Upstash Console

- View request count
- Monitor memory usage
- Check for errors

### Application Logs

Rate limit events are logged:

```
[Rate Limit] Redis not available, falling back to in-memory
[Rate Limit] Rate limit exceeded for key: search:user-123
```

## Cost Considerations

Upstash Free Tier:
- 10,000 commands/day
- 256 MB storage
- 1 database

For Fahrdienst (typical usage):
- ~50 dispatchers = ~5,000 requests/day (well within free tier)

If you exceed limits, consider:
1. Reducing rate limit check frequency
2. Upgrading to paid plan
3. Using Redis only for critical operations

## Testing

### Verify Redis Connection

```bash
# Check if Redis is configured
curl -X POST https://YOUR_UPSTASH_URL/incr/test-key \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Rate Limiting

1. Make repeated requests to a rate-limited endpoint
2. After exceeding the limit, you should see:
   - HTTP 429 response
   - `Retry-After` header
   - Error message with wait time

## Troubleshooting

### "Redis not available" warning

1. Check `UPSTASH_REDIS_REST_URL` is set
2. Check `UPSTASH_REDIS_REST_TOKEN` is set
3. Verify URL is correct (should start with `https://`)

### Rate limit not working

1. Ensure `@upstash/redis` is installed
2. Check Upstash console for errors
3. Verify database is not suspended (free tier limits)

### Unexpected rate limit errors

1. Check if multiple users share IP (NAT)
2. Verify rate limit configuration matches expected usage
3. Consider increasing limits if legitimate use exceeds them

## Security Considerations

1. **Never commit credentials**: Use environment variables only
2. **Use least privilege**: Rate limit keys don't need full Redis access
3. **Monitor usage**: Watch for unusual patterns (possible abuse)
4. **Fail-open carefully**: Current implementation allows requests on Redis error
