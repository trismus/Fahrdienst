# Security Verification Checklist

This checklist verifies that all security features implemented in this sprint are working correctly.

## HIGH-002: Deprecated Server Actions

### Test: Original actions throw errors

```bash
# Start dev server
npm run dev

# Try to use deprecated action (should fail with error)
# In browser console or test file:
import { createPatient } from '@/lib/actions/patients'
await createPatient({ name: 'Test' }) // Should throw "DEPRECATED: ..."
```

### Expected Result
- All functions in `patients.ts`, `drivers.ts`, `destinations.ts`, `rides.ts` throw errors
- v2 functions work normally

---

## HIGH-003: Phone Number Masking

### Test: Logs show masked phone numbers

```bash
# In notification-service.ts or twilio-client.ts
# Trigger an SMS notification (can use mock mode)

# Check console output
[SMS] Notification log: {
  recipientPhone: '+41*******67',  # Should be masked
  ...
}
```

### Test: Phone masking function

```typescript
import { maskPhoneNumber } from '@/lib/utils/mask-phone';

console.assert(maskPhoneNumber('+41791234567') === '+41*******67');
console.assert(maskPhoneNumber('0791234567') === '079*****67');
console.assert(maskPhoneNumber('') === '****');
console.assert(maskPhoneNumber(null) === '****');
```

### Expected Result
- No full phone numbers in logs
- Phone numbers masked as `+XX*******YY` format

---

## HIGH-004: API Route Origin Validation

### Test: Unauthorized origin rejected (production only)

```bash
# Set NODE_ENV=production temporarily
# Make request from unauthorized origin

curl -X POST http://localhost:3000/api/routes/calculate \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"origin":"Zurich","destination":"Bern"}'

# Expected: 403 Forbidden
```

### Test: Server key required

```bash
# Remove GOOGLE_MAPS_SERVER_API_KEY from .env.local
# Make request to route calculation

# Expected: 503 Service Unavailable
```

### Expected Result
- Requests with unauthorized origins are rejected with 403
- Without server API key, returns 503 (not falling back to client key)

---

## HIGH-005: Rate Limiting

### Test: In-memory rate limiting (development)

```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

// Make rapid requests
for (let i = 0; i < 35; i++) {
  const result = await checkRateLimit('test:search', RATE_LIMITS.search);
  console.log(`Request ${i + 1}: ${result.success ? 'allowed' : 'blocked'}`);
}

// Expected: First 30 allowed, then blocked
```

### Test: Redis rate limiting (with Redis configured)

```bash
# Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
# Run same test above

# Check Redis: key should be created as ratelimit:test:search
```

### Expected Result
- Without Redis: in-memory rate limiting works
- With Redis: distributed rate limiting works
- After limit exceeded: 429 Too Many Requests with Retry-After header

---

## HIGH-006: CSRF Protection

### Test: Cookies have secure attributes

```bash
# Start dev server and log in
# Check cookies in browser DevTools > Application > Cookies

# Verify cookie attributes:
# - SameSite: Lax
# - Secure: true (production only)
# - HttpOnly: true
```

### Test: Cross-origin requests blocked

```javascript
// From a different origin (e.g., localhost:3001)
// Try to make authenticated request

fetch('http://localhost:3000/api/some-endpoint', {
  method: 'POST',
  credentials: 'include', // Try to send cookies
  body: JSON.stringify({ data: 'test' })
});

// Expected: Session cookie not sent due to SameSite
```

### Expected Result
- Session cookies have `SameSite: lax`
- Cross-origin requests don't have session cookies
- Server Actions only accept same-origin requests

---

## HIGH-008: Content Security Policy

### Test: CSP headers present

```bash
# Make request and check headers
curl -I http://localhost:3000

# Look for:
# Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
```

### Test: Inline scripts blocked (partially)

```html
<!-- Add to a test page -->
<script>alert('test')</script>

<!-- Should work because 'unsafe-inline' is required for Next.js -->
<!-- But scripts from unauthorized domains should be blocked -->
```

### Test: CSP violation reporting

```bash
# Check browser console for CSP violations
# Any violations should be logged to /api/csp-report
```

### Expected Result
- CSP header present on all responses
- XSS attempts blocked by CSP
- CSP violations logged (check console)

---

## Security Headers Verification

### Test: All security headers present

```bash
curl -I https://your-app.vercel.app 2>/dev/null | grep -E "Content-Security|X-Frame|X-Content|Referrer|Permissions|Strict-Transport"

# Expected output:
Content-Security-Policy: default-src 'self'; script-src ...
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Build Verification

```bash
# Verify build succeeds
npm run build

# Expected: Build completes without errors
# Warnings for unused variables in deprecated files are expected
```

---

## Summary Checklist

| Issue | Status | Verification |
|-------|--------|--------------|
| HIGH-002: Deprecated Actions | [ ] | Original actions throw errors |
| HIGH-003: Phone Masking | [ ] | Logs show masked numbers |
| HIGH-004: API Security | [ ] | Origin validation works |
| HIGH-005: Rate Limiting | [ ] | Requests blocked after limit |
| HIGH-006: CSRF Protection | [ ] | SameSite cookies configured |
| HIGH-008: CSP Headers | [ ] | Headers present on responses |
| Build | [ ] | `npm run build` succeeds |

---

## Notes

- Development mode is more lenient (origin validation skipped)
- Redis not required for development (in-memory fallback)
- CSP requires `unsafe-inline` and `unsafe-eval` for Next.js
- Phone masking only affects new code - audit old logs manually
