-- =============================================================================
-- SECURITY FIXES
-- =============================================================================
-- Run this in Supabase SQL Editor to apply critical security fixes.
-- =============================================================================

-- =============================================================================
-- FIX #1: Privilege Escalation via Signup Trigger
-- =============================================================================
-- Problem: handle_new_user() trusts client-supplied role in raw_user_meta_data
-- Solution: Always assign 'driver' role, admin must manually promote users
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- SECURITY FIX: Always assign 'driver' role
    -- Admin promotion must be done manually via Supabase dashboard or by an admin
    INSERT INTO profiles (id, role, display_name)
    VALUES (
        NEW.id,
        'driver',  -- Always driver, never trust client input
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FIX #2: Remove Self-Service Profile Role Update
-- =============================================================================
-- Problem: "Users can update own profile" allows any user to change their role
-- Solution: Remove this policy - users cannot update their own profile
-- Admin must update profiles via Supabase dashboard or admin interface
-- =============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- =============================================================================
-- FIX #3: Also drop the problematic admin read policy (RLS recursion fix)
-- =============================================================================
-- This was already identified as causing infinite recursion
-- =============================================================================

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT 'Security fixes applied successfully!' AS status;

-- Show remaining policies on profiles table
SELECT
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
