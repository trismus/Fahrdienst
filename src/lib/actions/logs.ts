'use server';

/**
 * Server Actions for Application Logs
 * Issue #58: Admin Log Page
 *
 * Security: Only admins can access logs (sensitive data)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserProfile } from './auth';
import { z } from 'zod';
import {
  LogEntry,
  LogEntryRow,
  LogStats,
  PaginatedResult,
  logRowToEntry,
  type LogLevel,
} from '@/lib/logging/types';
import { sanitizeSearchQuery, validateId } from '@/lib/utils/sanitize';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const logLevelSchema = z.enum(['info', 'warn', 'error', 'all']);

const logFilterSchema = z.object({
  level: logLevelSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  source: z.string().max(50).optional(),
  feature: z.string().max(50).optional(),
  route: z.string().max(200).optional(),
  userId: z.string().uuid().optional(),
  requestId: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
});

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

// =============================================================================
// ACCESS CONTROL
// =============================================================================

/**
 * Check if current user is admin
 * Throws error if not authenticated or not admin
 */
async function requireAdmin(): Promise<void> {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error('Nicht authentifiziert');
  }

  if (profile.role !== 'admin') {
    throw new Error('Zugriff verweigert. Nur Administratoren koennen Logs einsehen.');
  }
}

/**
 * Check if current user is admin (non-throwing version)
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === 'admin';
}

// =============================================================================
// GET LOGS (with filtering and pagination)
// =============================================================================

export interface GetLogsInput {
  filter?: {
    level?: LogLevel | 'all';
    dateFrom?: string;
    dateTo?: string;
    source?: string;
    feature?: string;
    route?: string;
    userId?: string;
    requestId?: string;
    search?: string;
  };
  pagination?: {
    page?: number;
    pageSize?: number;
  };
}

export async function getLogs(
  input: GetLogsInput = {}
): Promise<PaginatedResult<LogEntry>> {
  // Verify admin access
  await requireAdmin();

  // Validate input
  const filterResult = logFilterSchema.safeParse(input.filter || {});
  if (!filterResult.success) {
    throw new Error(`Ungueltiger Filter: ${filterResult.error.message}`);
  }
  const filter = filterResult.data;

  const paginationResult = paginationSchema.safeParse(input.pagination || {});
  if (!paginationResult.success) {
    throw new Error(`Ungueltige Pagination: ${paginationResult.error.message}`);
  }
  const { page, pageSize } = paginationResult.data;

  // Use admin client to bypass RLS (we've already verified admin role)
  const supabase = createAdminClient();

  // Build query
  let query = supabase
    .from('application_logs')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filter.level && filter.level !== 'all') {
    query = query.eq('level', filter.level);
  }

  if (filter.dateFrom) {
    query = query.gte('created_at', filter.dateFrom);
  }

  if (filter.dateTo) {
    query = query.lte('created_at', filter.dateTo);
  }

  if (filter.source) {
    query = query.eq('source', filter.source);
  }

  if (filter.feature) {
    query = query.eq('feature', filter.feature);
  }

  if (filter.route) {
    const sanitizedRoute = sanitizeSearchQuery(filter.route);
    if (sanitizedRoute) {
      query = query.ilike('route', `%${sanitizedRoute}%`);
    }
  }

  if (filter.userId) {
    // Validate UUID format
    const validUserId = validateId(filter.userId, 'user');
    query = query.eq('user_id', validUserId);
  }

  if (filter.requestId) {
    query = query.eq('request_id', filter.requestId);
  }

  if (filter.search) {
    const sanitizedSearch = sanitizeSearchQuery(filter.search);
    if (sanitizedSearch) {
      query = query.ilike('message', `%${sanitizedSearch}%`);
    }
  }

  // Apply ordering (newest first)
  query = query.order('created_at', { ascending: false });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Fehler beim Laden der Logs: ${error.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: (data as LogEntryRow[]).map(logRowToEntry),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// =============================================================================
// GET SINGLE LOG
// =============================================================================

export async function getLogById(id: string): Promise<LogEntry | null> {
  // Verify admin access
  await requireAdmin();

  // Validate ID format
  const validId = validateId(id, 'log');

  // Use admin client
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('application_logs')
    .select('*')
    .eq('id', validId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Fehler beim Laden des Logs: ${error.message}`);
  }

  return logRowToEntry(data as LogEntryRow);
}

// =============================================================================
// GET LOG STATS
// =============================================================================

export async function getLogStats(): Promise<LogStats> {
  // Verify admin access
  await requireAdmin();

  // Use admin client
  const supabase = createAdminClient();

  // Use the database function for stats
  const { data, error } = await supabase.rpc('get_log_stats');

  if (error) {
    throw new Error(`Fehler beim Laden der Log-Statistiken: ${error.message}`);
  }

  // Handle case where function returns array
  const stats = Array.isArray(data) ? data[0] : data;

  return {
    totalCount: stats?.total_count || 0,
    errorCount: stats?.error_count || 0,
    warnCount: stats?.warn_count || 0,
    infoCount: stats?.info_count || 0,
    oldestLog: stats?.oldest_log ? new Date(stats.oldest_log) : null,
    newestLog: stats?.newest_log ? new Date(stats.newest_log) : null,
  };
}

// =============================================================================
// GET DISTINCT SOURCES
// =============================================================================

export async function getLogSources(): Promise<string[]> {
  // Verify admin access
  await requireAdmin();

  // Use admin client
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('application_logs')
    .select('source')
    .not('source', 'is', null)
    .order('source');

  if (error) {
    throw new Error(`Fehler beim Laden der Sources: ${error.message}`);
  }

  // Get unique sources
  const sources = new Set<string>();
  for (const row of data || []) {
    if (row.source) {
      sources.add(row.source);
    }
  }

  return Array.from(sources);
}

// =============================================================================
// GET DISTINCT FEATURES
// =============================================================================

export async function getLogFeatures(): Promise<string[]> {
  // Verify admin access
  await requireAdmin();

  // Use admin client
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('application_logs')
    .select('feature')
    .not('feature', 'is', null)
    .order('feature');

  if (error) {
    throw new Error(`Fehler beim Laden der Features: ${error.message}`);
  }

  // Get unique features
  const features = new Set<string>();
  for (const row of data || []) {
    if (row.feature) {
      features.add(row.feature);
    }
  }

  return Array.from(features);
}

// =============================================================================
// MANUAL CLEANUP (admin-triggered)
// =============================================================================

export async function triggerLogCleanup(): Promise<number> {
  // Verify admin access
  await requireAdmin();

  // Use admin client
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('cleanup_application_logs');

  if (error) {
    throw new Error(`Fehler beim Cleanup: ${error.message}`);
  }

  return data as number;
}
