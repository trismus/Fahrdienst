/**
 * CSRF Token Utility
 *
 * Provides CSRF token generation and validation for extra protection
 * beyond SameSite cookies.
 *
 * Note: Next.js Server Actions are protected by default through:
 * 1. POST-only requests
 * 2. Same-origin policy
 * 3. Server-side validation
 *
 * This utility provides additional protection for:
 * - API routes that accept form submissions
 * - High-security operations (password changes, etc.)
 */

import { randomBytes, timingSafeEqual } from 'crypto';

/**
 * Generates a cryptographically secure CSRF token.
 *
 * @returns A 64-character hex string
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validates a CSRF token using timing-safe comparison.
 *
 * IMPORTANT: Always use this function instead of === to prevent timing attacks.
 *
 * @param token - The token from the request
 * @param sessionToken - The token stored in the session
 * @returns True if tokens match, false otherwise
 */
export function validateCsrfToken(
  token: string | null | undefined,
  sessionToken: string | null | undefined
): boolean {
  // Null/undefined checks
  if (!token || !sessionToken) {
    return false;
  }

  // Length check (prevents timing attacks on length)
  if (token.length !== sessionToken.length) {
    return false;
  }

  // Timing-safe comparison
  try {
    const tokenBuffer = Buffer.from(token, 'utf-8');
    const sessionBuffer = Buffer.from(sessionToken, 'utf-8');

    return timingSafeEqual(tokenBuffer, sessionBuffer);
  } catch {
    // Handle buffer creation errors
    return false;
  }
}

/**
 * Creates a CSRF token and returns it along with a cookie configuration.
 *
 * @returns Object with token and cookie options
 */
export function createCsrfCookie(): {
  token: string;
  cookieOptions: {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path: string;
    maxAge: number;
  };
} {
  const token = generateCsrfToken();

  return {
    token,
    cookieOptions: {
      name: 'csrf-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    },
  };
}

/**
 * Gets the CSRF token from request headers.
 *
 * The token should be sent in the `x-csrf-token` header.
 *
 * @param headers - Request headers
 * @returns The CSRF token or null
 */
export function getCsrfTokenFromHeaders(
  headers: Headers | { get: (name: string) => string | null }
): string | null {
  return headers.get('x-csrf-token');
}

/**
 * Gets the CSRF token from cookies.
 *
 * @param cookies - Request cookies
 * @returns The CSRF token or null
 */
export function getCsrfTokenFromCookies(
  cookies: { get: (name: string) => { value: string } | undefined }
): string | null {
  const cookie = cookies.get('csrf-token');
  return cookie?.value || null;
}

/**
 * Validates CSRF token from request against cookie.
 *
 * The token in the header must match the token in the cookie.
 * This works because:
 * 1. Attacker cannot read cookies from another origin
 * 2. Attacker cannot set the x-csrf-token header from another origin
 *
 * @param headers - Request headers
 * @param cookies - Request cookies
 * @returns True if valid, false otherwise
 */
export function validateCsrfFromRequest(
  headers: Headers | { get: (name: string) => string | null },
  cookies: { get: (name: string) => { value: string } | undefined }
): boolean {
  const headerToken = getCsrfTokenFromHeaders(headers);
  const cookieToken = getCsrfTokenFromCookies(cookies);

  return validateCsrfToken(headerToken, cookieToken);
}
