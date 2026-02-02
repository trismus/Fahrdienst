/**
 * Rate Limiting Utility
 *
 * Prevents enumeration attacks and DoS on search operations.
 *
 * Uses Redis when available (production/serverless), falls back to
 * in-memory store for development.
 */

import { checkRateLimitRedis, isRedisRateLimitAvailable } from './rate-limit-redis';

// In-memory rate limit store (fallback for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

// Default configs for different operations
export const RATE_LIMITS = {
  search: { windowMs: 60_000, maxRequests: 30 }, // 30 searches per minute
  create: { windowMs: 60_000, maxRequests: 10 }, // 10 creates per minute
  update: { windowMs: 60_000, maxRequests: 20 }, // 20 updates per minute
  delete: { windowMs: 60_000, maxRequests: 5 }, // 5 deletes per minute
  login: { windowMs: 900_000, maxRequests: 5 }, // 5 login attempts per 15 min
  api: { windowMs: 60_000, maxRequests: 100 }, // 100 API requests per minute
} as const;

/**
 * Check rate limit using in-memory store.
 * Only suitable for single-instance deployments.
 */
function checkRateLimitMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired records periodically
  if (rateLimitStore.size > 10000) {
    cleanupExpiredRecords();
  }

  // No existing record or expired
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Increment existing record
  record.count++;

  if (record.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Check rate limit for a given key.
 *
 * Automatically uses Redis in serverless/production environments,
 * falls back to in-memory for local development.
 *
 * @param key - Unique identifier for the rate limit
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.search
): RateLimitResult | Promise<RateLimitResult> {
  // Use Redis if available (production/serverless)
  if (isRedisRateLimitAvailable()) {
    return checkRateLimitRedis(key, config);
  }

  // Warn in production if Redis is not configured
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
    console.warn(
      '[Rate Limit] Redis not configured. Using in-memory rate limiting. ' +
        'This is not recommended for production.'
    );
  }

  // Fallback to in-memory for development
  return checkRateLimitMemory(key, config);
}

/**
 * Create a rate limit key from user ID and operation type.
 */
export function createRateLimitKey(
  userId: string | null,
  operation: string,
  ipAddress?: string
): string {
  // Use IP as fallback for unauthenticated requests
  const identifier = userId || ipAddress || 'anonymous';
  return `${operation}:${identifier}`;
}

/**
 * Clean up expired records from the in-memory store.
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit error for consistent error handling.
 */
export class RateLimitError extends Error {
  public retryAfter: number;

  constructor(resetTime: number) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    super(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Wrapper function for rate-limited operations.
 */
export async function withRateLimit<T>(
  key: string,
  config: RateLimitConfig,
  operation: () => Promise<T>
): Promise<T> {
  const result = await checkRateLimit(key, config);

  if (!result.success) {
    throw new RateLimitError(result.resetTime);
  }

  return operation();
}

/**
 * Get rate limit headers for HTTP response.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);

  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetTime),
    ...(result.success ? {} : { 'Retry-After': String(resetSeconds) }),
  };
}
