/**
 * Application Logging Module
 * Issue #56: Centralized Logging Utility
 *
 * Usage:
 *   import { log } from '@/lib/logging';
 *
 *   // Basic logging
 *   log.info('Patient created successfully', { feature: 'patients' });
 *   log.warn('Rate limit approaching', { route: '/api/rides', userId: '123' });
 *   log.error(error, { feature: 'sms', route: 'sendNotification' });
 *
 *   // With request ID for correlation
 *   import { log, generateRequestId } from '@/lib/logging';
 *   const requestId = generateRequestId();
 *   log.info('Request started', { requestId, route: '/api/rides' });
 *   log.info('Request completed', { requestId, durationMs: 150 });
 *
 *   // Child logger for scoped logging
 *   const smsLogger = log.child({ feature: 'sms', source: 'sms' });
 *   smsLogger.info('SMS sent', { payload: { to: '+41...', messageId: '...' } });
 */

// Main logger
export { log, Logger, generateRequestId, detectSource } from './logger';

// Types
export type {
  LogLevel,
  LogMeta,
  LogSource,
  LogEntry,
  LogEntryRow,
  LogFilter,
  LogStats,
  PaginationOptions,
  PaginatedResult,
  DateRangePreset,
} from './types';

// Type utilities
export { LOG_LEVELS, logRowToEntry, getDateRangeFromPreset } from './types';
