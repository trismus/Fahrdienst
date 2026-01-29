/**
 * Supabase Admin Client
 *
 * ============================================================================
 * WARNING: This client bypasses Row Level Security (RLS) policies!
 * ============================================================================
 *
 * This client uses the service role key and has FULL DATABASE ACCESS.
 * It can read, write, and delete ANY data regardless of RLS policies.
 *
 * ONLY USE FOR:
 * - Database migrations and seeding scripts
 * - One-time administrative scripts (run manually)
 * - Server-side background jobs with no user context
 * - Emergency data fixes (with proper logging)
 *
 * NEVER USE FOR:
 * - Regular application code
 * - User-initiated actions
 * - Server actions called from the frontend
 * - Anywhere a user session exists
 *
 * If you think you need the admin client for application code,
 * you probably need to fix your RLS policies instead.
 *
 * ============================================================================
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates an admin Supabase client using the service role key.
 *
 * @throws Error if environment variables are not configured
 * @returns Supabase client with full database access
 *
 * @example
 * // Only in scripts/migrations:
 * import { createAdminClient } from '@/lib/supabase/admin';
 * const supabase = createAdminClient();
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Admin client requires the service role key which should only be available in secure contexts.'
    );
  }

  // Log usage in development for auditing
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[ADMIN CLIENT] Creating admin Supabase client. ' +
      'This bypasses RLS. Ensure this is intentional.'
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
