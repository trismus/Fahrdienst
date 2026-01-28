/**
 * Input sanitization utilities for database queries
 * Prevents SQL injection in Supabase/PostgREST queries
 */

/**
 * Sanitizes user input for use in ILIKE patterns
 * Escapes special PostgreSQL pattern characters: %, _, \
 * Also escapes single quotes to prevent SQL injection
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Limit length to prevent DoS
  const MAX_SEARCH_LENGTH = 100;
  if (sanitized.length > MAX_SEARCH_LENGTH) {
    sanitized = sanitized.substring(0, MAX_SEARCH_LENGTH);
  }

  // Escape special PostgreSQL LIKE/ILIKE pattern characters
  // Order matters: escape backslash first
  sanitized = sanitized
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/%/g, '\\%')    // Escape percent signs
    .replace(/_/g, '\\_')    // Escape underscores
    .replace(/'/g, "''");    // Escape single quotes (SQL standard)

  return sanitized;
}

/**
 * Validates that a string is a valid UUID
 * Use this before passing IDs to database queries
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Sanitizes and validates an ID parameter
 * Throws an error if the ID is not a valid UUID
 */
export function validateId(id: string, entityName: string = 'entity'): string {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid ${entityName} ID format`);
  }
  return id;
}
