-- =============================================================================
-- FIX: Profiles RLS Policy Recursion
-- =============================================================================
-- Problem: "Admins can read all profiles" policy calls get_user_role()
-- which reads from profiles table, causing infinite recursion.
--
-- Solution: Remove the problematic policy and rely on "Users can read own profile"
-- =============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- The "Users can read own profile" policy is sufficient:
-- Users can always read their own profile (id = auth.uid())
-- This avoids the recursion since it doesn't need to check the role.

-- Verify the remaining policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles';
