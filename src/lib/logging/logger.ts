/**
 * Centralized Logging Utility for Fahrdienst
 * Issue #56: Singleton logger with database persistence and secret masking
 *
 * Usage:
 *   import { log } from '@/lib/logging';
 *   log.info('User created', { userId: '123', feature: 'patients' });
 *   log.warn('Rate limit approaching', { route: '/api/rides' });
 *   log.error(error, { feature: 'sms', route: '/api/notifications' });
 */

import type { LogLevel, LogMeta, LogSource } from './types';
import { sanitizeLogMessage, looksLikePhoneNumber, maskPhoneNumber } from '@/lib/utils/mask-phone';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Patterns that indicate sensitive data
 * Values matching these keys will be redacted
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /passwort/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /apikey/i,
  /auth/i,
  /authorization/i,
  /bearer/i,
  /credential/i,
  /private[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /session/i,
  /cookie/i,
  /jwt/i,
  /twilio/i,
  /supabase.*key/i,
];

/**
 * Maximum length for message and metadata strings
 */
const MAX_MESSAGE_LENGTH = 2000;
const MAX_METADATA_DEPTH = 5;
const MAX_ARRAY_LENGTH = 100;

// =============================================================================
// SECRET MASKING
// =============================================================================

/**
 * Patterns that indicate phone number fields
 * Values matching these keys will be masked with maskPhoneNumber()
 */
const PHONE_FIELD_PATTERNS = [
  /phone/i,
  /telefon/i,
  /mobile/i,
  /handy/i,
  /sms/i,
  /recipient/i,
  /from_number/i,
  /to_number/i,
];

/**
 * Check if a key name indicates sensitive data
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Check if a key name indicates a phone number field
 */
function isPhoneField(key: string): boolean {
  return PHONE_FIELD_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Recursively sanitize an object, masking sensitive values
 */
function sanitizeValue(value: unknown, depth: number = 0): unknown {
  // Prevent infinite recursion
  if (depth > MAX_METADATA_DEPTH) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) {
      return [
        ...value.slice(0, MAX_ARRAY_LENGTH).map((v) => sanitizeValue(v, depth + 1)),
        `[...${value.length - MAX_ARRAY_LENGTH} more items]`,
      ];
    }
    return value.map((v) => sanitizeValue(v, depth + 1));
  }

  // Handle objects
  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (isPhoneField(key) && typeof val === 'string') {
        sanitized[key] = maskPhoneNumber(val);
      } else {
        sanitized[key] = sanitizeValue(val, depth + 1);
      }
    }

    return sanitized;
  }

  // Handle strings - check for embedded phone numbers and secrets
  if (typeof value === 'string') {
    // Truncate long strings
    if (value.length > MAX_MESSAGE_LENGTH) {
      return value.substring(0, MAX_MESSAGE_LENGTH) + '...[truncated]';
    }
    // Mask standalone phone numbers
    if (looksLikePhoneNumber(value)) {
      return maskPhoneNumber(value);
    }
    return value;
  }

  // Return primitives as-is
  return value;
}

/**
 * Sanitize metadata object for safe logging
 */
function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValue(meta, 0) as Record<string, unknown>;
}

// =============================================================================
// DATABASE WRITER
// =============================================================================

/**
 * Write log to database
 * Uses dynamic import to avoid circular dependencies
 * Falls back gracefully if database write fails
 */
async function writeToDatabase(entry: {
  level: LogLevel;
  message: string;
  stackTrace?: string;
  source?: string;
  route?: string;
  userId?: string;
  requestId?: string;
  feature?: string;
  metadata: Record<string, unknown>;
}): Promise<boolean> {
  try {
    // Dynamic import to avoid issues with server/client boundary
    const { createAdminClient } = await import('@/lib/supabase/admin');

    const supabase = createAdminClient();

    const { error } = await supabase.from('application_logs').insert({
      level: entry.level,
      message: entry.message,
      stack_trace: entry.stackTrace,
      source: entry.source,
      route: entry.route,
      user_id: entry.userId,
      request_id: entry.requestId,
      feature: entry.feature,
      metadata: entry.metadata,
    });

    if (error) {
      // Log database error to console but don't throw
      console.error('[Logger] Database write failed:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    // Catch any import or connection errors
    console.error('[Logger] Database write error:', err instanceof Error ? err.message : 'Unknown error');
    return false;
  }
}

// =============================================================================
// CONSOLE FORMATTING
// =============================================================================

/**
 * Format log entry for console output
 */
function formatConsoleMessage(level: LogLevel, message: string, meta?: LogMeta): string {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);

  let formatted = `[${timestamp}] ${levelUpper} ${message}`;

  if (meta?.feature) {
    formatted += ` [${meta.feature}]`;
  }

  if (meta?.route) {
    formatted += ` (${meta.route})`;
  }

  return formatted;
}

/**
 * Output to console based on level
 */
function writeToConsole(level: LogLevel, message: string, meta?: LogMeta, error?: Error): void {
  const formatted = formatConsoleMessage(level, message, meta);

  switch (level) {
    case 'error':
      console.error(formatted);
      if (error?.stack) {
        console.error(error.stack);
      }
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'info':
    default:
      console.log(formatted);
      break;
  }
}

// =============================================================================
// LOGGER CLASS
// =============================================================================

/**
 * Logger class implementing singleton pattern
 */
class Logger {
  private static instance: Logger;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log an info message
   * Use for normal operation events, successful actions, audit trail
   */
  public info(message: string, meta?: LogMeta): void {
    this.log('info', message, meta);
  }

  /**
   * Log a warning message
   * Use for potential issues, deprecations, recoverable errors
   */
  public warn(message: string, meta?: LogMeta): void {
    this.log('warn', message, meta);
  }

  /**
   * Log an error
   * Use for failures, exceptions, unrecoverable errors
   *
   * @param errorOrMessage - Error object or error message string
   * @param meta - Optional metadata
   */
  public error(errorOrMessage: Error | string, meta?: LogMeta): void {
    const isError = errorOrMessage instanceof Error;
    const message = isError ? errorOrMessage.message : errorOrMessage;
    const stackTrace = isError ? errorOrMessage.stack : undefined;
    const error = isError ? errorOrMessage : undefined;

    this.log('error', message, meta, stackTrace, error);
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    message: string,
    meta?: LogMeta,
    stackTrace?: string,
    error?: Error
  ): void {
    // Sanitize phone numbers from message (GDPR)
    const sanitizedMessage = sanitizeLogMessage(message);

    // Always write to console first (synchronous, never fails)
    writeToConsole(level, sanitizedMessage, meta, error);

    // Build sanitized metadata
    const sanitizedPayload = meta?.payload ? sanitizeMetadata(meta.payload) : {};
    const metadata: Record<string, unknown> = {
      ...sanitizedPayload,
    };

    // Add optional fields to metadata if provided
    if (meta?.errorCode) {
      metadata.errorCode = meta.errorCode;
    }
    if (meta?.durationMs !== undefined) {
      metadata.durationMs = meta.durationMs;
    }

    // Async database write (fire and forget - never blocks)
    // Using setImmediate/setTimeout to ensure it doesn't block
    const dbEntry = {
      level,
      message: sanitizedMessage.substring(0, MAX_MESSAGE_LENGTH),
      stackTrace,
      source: meta?.source,
      route: meta?.route,
      userId: meta?.userId,
      requestId: meta?.requestId,
      feature: meta?.feature,
      metadata,
    };

    // Schedule database write without blocking
    // Note: In Node.js/Edge runtime, this runs in the same tick but after current function
    Promise.resolve().then(() => {
      writeToDatabase(dbEntry).catch((err) => {
        // Silently fail - we already logged to console
        console.error('[Logger] Async database write failed:', err);
      });
    });
  }

  /**
   * Create a child logger with preset metadata
   * Useful for scoping logs to a specific feature or request
   */
  public child(baseMeta: LogMeta): ChildLogger {
    return new ChildLogger(this, baseMeta);
  }
}

/**
 * Child logger with preset metadata
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private baseMeta: LogMeta
  ) {}

  public info(message: string, meta?: LogMeta): void {
    this.parent.info(message, { ...this.baseMeta, ...meta });
  }

  public warn(message: string, meta?: LogMeta): void {
    this.parent.warn(message, { ...this.baseMeta, ...meta });
  }

  public error(errorOrMessage: Error | string, meta?: LogMeta): void {
    this.parent.error(errorOrMessage, { ...this.baseMeta, ...meta });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Default logger instance
 * Import and use: log.info(), log.warn(), log.error()
 */
export const log = Logger.getInstance();

/**
 * Export Logger class for testing
 */
export { Logger };

/**
 * Export types
 */
export type { LogMeta, LogLevel, LogSource };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique request ID for correlating logs
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Detect source based on common patterns
 * Can be used as a hint when source is not explicitly provided
 */
export function detectSource(route?: string): LogSource {
  if (!route) return 'unknown';

  if (route.startsWith('/api/')) return 'api-route';
  if (route.includes('action')) return 'server-action';
  if (route.includes('middleware')) return 'middleware';
  if (route.includes('cron')) return 'cron';

  return 'unknown';
}
