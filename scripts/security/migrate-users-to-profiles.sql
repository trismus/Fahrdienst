-- =============================================================================
-- SCRIPT: migrate-users-to-profiles.sql
-- PURPOSE: Migrate existing auth.users to profiles table
-- =============================================================================
--
-- This script creates profile records for any auth.users that don't have one.
-- The on_auth_user_created trigger should handle new users, but this script
-- catches any users created before the trigger was added.
--
-- ROLE ASSIGNMENT LOGIC:
-- 1. If user is linked to a driver record (drivers.user_id) -> role = 'driver'
-- 2. Otherwise -> role = 'admin' (first user is typically the admin)
--
-- RUN THIS: In Supabase SQL Editor
-- =============================================================================

-- First, show current state
SELECT
    'BEFORE MIGRATION' AS status,
    (SELECT COUNT(*) FROM auth.users) AS total_users,
    (SELECT COUNT(*) FROM profiles) AS total_profiles,
    (SELECT COUNT(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)) AS users_without_profile;

-- =============================================================================
-- CREATE MISSING PROFILES
-- =============================================================================

INSERT INTO profiles (id, role, display_name, created_at, updated_at)
SELECT
    u.id,
    CASE
        -- If user is linked to a driver record, they're a driver
        WHEN EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = u.id) THEN 'driver'::user_role
        -- First user (by created_at) is likely the admin
        WHEN u.created_at = (SELECT MIN(created_at) FROM auth.users) THEN 'admin'::user_role
        -- Default to admin for other existing users (they were likely dispatchers)
        ELSE 'admin'::user_role
    END AS role,
    COALESCE(u.raw_user_meta_data->>'display_name', u.email) AS display_name,
    NOW() AS created_at,
    NOW() AS updated_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
);

-- =============================================================================
-- VERIFY RESULTS
-- =============================================================================

SELECT
    'AFTER MIGRATION' AS status,
    (SELECT COUNT(*) FROM auth.users) AS total_users,
    (SELECT COUNT(*) FROM profiles) AS total_profiles,
    (SELECT COUNT(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)) AS users_without_profile;

-- Show all profiles with their roles
SELECT
    p.id,
    u.email,
    p.role,
    p.display_name,
    CASE WHEN d.id IS NOT NULL THEN 'Yes' ELSE 'No' END AS is_driver,
    p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN drivers d ON d.user_id = p.id
ORDER BY p.created_at;

-- =============================================================================
-- OPTIONAL: Manually set specific user roles
-- =============================================================================

-- Uncomment and modify as needed:

-- Set a specific user as admin:
-- UPDATE profiles
-- SET role = 'admin', updated_at = NOW()
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- Set a specific user as operator:
-- UPDATE profiles
-- SET role = 'operator', updated_at = NOW()
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'dispatcher@example.com');

-- Set a specific user as driver:
-- UPDATE profiles
-- SET role = 'driver', updated_at = NOW()
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'driver@example.com');
