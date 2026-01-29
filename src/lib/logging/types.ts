/**
 * Type definitions for application logging
 * Issue #56: Centralized Logging Utility
 */

// =============================================================================
// LOG LEVELS
// =============================================================================

/**
 * Log severity levels matching database enum
 */
export type LogLevel = 'info' | 'warn' | 'error';

/**
 * Log levels as constants for type-safe usage
 */
export const LOG_LEVELS = {
  INFO: 'info' as const,
  WARN: 'warn' as const,
  ERROR: 'error' as const,
};

// =============================================================================
// LOG METADATA
// =============================================================================

/**
 * Optional metadata that can be attached to any log entry
 * All fields are optional and will be sanitized before storage
 */
export interface LogMeta {
  /** User ID if authenticated */
  userId?: string;

  /** HTTP route or server action name */
  route?: string;

  /** Unique request ID for correlating logs */
  requestId?: string;

  /** Feature/module name (e.g., 'rides', 'patients', 'sms') */
  feature?: string;

  /** Source code location (auto-detected or manual) */
  source?: LogSource;

  /** Additional structured data (will be sanitized) */
  payload?: Record<string, unknown>;

  /** Error code if applicable */
  errorCode?: string;

  /** Duration in milliseconds (for performance logging) */
  durationMs?: number;
}

/**
 * Known source types for categorizing log origin
 */
export type LogSource =
  | 'server-action'
  | 'api-route'
  | 'middleware'
  | 'database'
  | 'cron'
  | 'sms'
  | 'external-api'
  | 'unknown';

// =============================================================================
// LOG ENTRY
// =============================================================================

/**
 * Complete log entry as stored in database
 */
export interface LogEntry {
  id: string;
  createdAt: Date;
  level: LogLevel;
  message: string;
  stackTrace?: string;
  source?: string;
  route?: string;
  userId?: string;
  requestId?: string;
  feature?: string;
  metadata: Record<string, unknown>;
}

/**
 * Log entry as returned from database (snake_case)
 */
export interface LogEntryRow {
  id: string;
  created_at: string;
  level: LogLevel;
  message: string;
  stack_trace: string | null;
  source: string | null;
  route: string | null;
  user_id: string | null;
  request_id: string | null;
  feature: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Convert database row to LogEntry
 */
export function logRowToEntry(row: LogEntryRow): LogEntry {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    level: row.level,
    message: row.message,
    stackTrace: row.stack_trace ?? undefined,
    source: row.source ?? undefined,
    route: row.route ?? undefined,
    userId: row.user_id ?? undefined,
    requestId: row.request_id ?? undefined,
    feature: row.feature ?? undefined,
    metadata: row.metadata,
  };
}

// =============================================================================
// LOG FILTER
// =============================================================================

/**
 * Filter options for querying logs
 */
export interface LogFilter {
  /** Filter by log level */
  level?: LogLevel | 'all';

  /** Date range - start */
  dateFrom?: Date;

  /** Date range - end */
  dateTo?: Date;

  /** Filter by source */
  source?: string;

  /** Filter by feature */
  feature?: string;

  /** Filter by route (partial match) */
  route?: string;

  /** Filter by user ID */
  userId?: string;

  /** Filter by request ID */
  requestId?: string;

  /** Search in message (partial match) */
  search?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// DATE RANGE PRESETS
// =============================================================================

/**
 * Preset date ranges for filtering
 */
export type DateRangePreset = '24h' | '7d' | '30d' | 'custom';

/**
 * Get date range from preset
 */
export function getDateRangeFromPreset(preset: DateRangePreset): { from: Date; to: Date } | null {
  const now = new Date();

  switch (preset) {
    case '24h':
      return {
        from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        to: now,
      };
    case '7d':
      return {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: now,
      };
    case '30d':
      return {
        from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: now,
      };
    case 'custom':
      return null; // Custom range provided separately
  }
}

// =============================================================================
// LOG STATS
// =============================================================================

/**
 * Log statistics for dashboard display
 */
export interface LogStats {
  totalCount: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  oldestLog: Date | null;
  newestLog: Date | null;
}
