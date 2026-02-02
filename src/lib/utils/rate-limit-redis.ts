/**
 * Redis-based Rate Limiting
 *
 * Uses Upstash Redis for distributed rate limiting.
 * This is required for serverless environments (like Vercel)
 * where in-memory rate limiting doesn't work across instances.
 *
 * SETUP:
 * 1. Install @upstash/redis: npm install @upstash/redis
 * 2. Set environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *
 * If @upstash/redis is not installed, this module gracefully falls back
 * to allowing all requests (with a warning).
 */

import type { RateLimitConfig, RateLimitResult } from './rate-limit';

// Type for Redis client (compatible with @upstash/redis)
interface RedisClient {
  incr: (key: string) => Promise<number>;
  pexpire: (key: string, milliseconds: number) => Promise<number>;
  pttl: (key: string) => Promise<number>;
}

// Lazy-loaded Redis client to avoid errors when not configured
let redisClient: RedisClient | null = null;
let redisInitialized = false;
let redisAvailable = false;

/**
 * Initializes the Redis client if not already done.
 * Returns null if Redis is not configured or not installed.
 */
async function getRedisClient(): Promise<RedisClient | null> {
  if (redisInitialized) {
    return redisClient;
  }

  redisInitialized = true;

  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    redisAvailable = false;
    return null;
  }

  try {
    // Dynamic import - will fail if @upstash/redis is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({
      url: restUrl,
      token: restToken,
    });
    redisAvailable = true;
    console.log('[Rate Limit] Redis client initialized');
    return redisClient;
  } catch (error) {
    console.warn(
      '[Rate Limit] @upstash/redis not installed. Install with: npm install @upstash/redis'
    );
    redisAvailable = false;
    return null;
  }
}

/**
 * Check rate limit using Redis.
 *
 * Uses a sliding window counter algorithm:
 * - Each key stores a counter
 * - Counter expires after windowMs
 * - If counter exceeds maxRequests, request is denied
 *
 * @param key - Unique identifier for the rate limit (e.g., "user:123:search")
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and remaining requests
 */
export async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = await getRedisClient();

  if (!redis) {
    // Redis not available, allow request but log warning
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Rate Limit] Redis not available, allowing request');
    }
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }

  const now = Date.now();
  const rateLimitKey = `ratelimit:${key}`;

  try {
    // Atomic increment
    const count = await redis.incr(rateLimitKey);

    if (count === 1) {
      // First request in this window, set expiry
      await redis.pexpire(rateLimitKey, config.windowMs);
    }

    if (count > config.maxRequests) {
      // Rate limit exceeded
      const ttl = await redis.pttl(rateLimitKey);
      return {
        success: false,
        remaining: 0,
        resetTime: now + (ttl > 0 ? ttl : config.windowMs),
      };
    }

    // Request allowed
    return {
      success: true,
      remaining: config.maxRequests - count,
      resetTime: now + config.windowMs,
    };
  } catch (error) {
    // On Redis error, allow request but log warning
    console.error('[Rate Limit] Redis error:', error);
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }
}

/**
 * Check if Redis rate limiting is available.
 */
export function isRedisRateLimitAvailable(): boolean {
  // Check if environment variables are set
  // The actual client initialization happens lazily
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Get rate limit headers for HTTP response.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);

  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetTime),
    'Retry-After': result.success ? '' : String(resetSeconds),
  };
}
