-- =============================================================================
-- SCRIPT: test-rls-policies.sql
-- PURPOSE: Verify RLS policies are working correctly
-- =============================================================================
--
-- This script tests that:
-- 1. Admins can access all data
-- 2. Operators can access all data
-- 3. Drivers can only access their own data
-- 4. Unauthorized access is blocked
--
-- HOW TO USE:
-- Run these queries in Supabase SQL Editor while authenticated as different users.
-- Alternatively, use set_config to simulate different user contexts.
--
-- =============================================================================

-- =============================================================================
-- HELPER: View current user and role
-- =============================================================================

-- Check current authenticated user
SELECT
    'Current Session' AS check_type,
    auth.uid() AS user_id,
    get_user_role() AS user_role;

-- List all profiles for reference
SELECT
    'All Profiles' AS info,
    p.id,
    u.email,
    p.role,
    p.display_name
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.role, u.email;

-- =============================================================================
-- TEST 1: Admin Access - Should see ALL data
-- =============================================================================

-- To test as admin, first ensure you're logged in as an admin user

-- Count all patients (admin should see all)
SELECT
    'Admin: Patients Count' AS test,
    COUNT(*) AS total_patients,
    COUNT(*) FILTER (WHERE is_active = true) AS active_patients,
    COUNT(*) FILTER (WHERE is_active = false) AS inactive_patients
FROM patients;

-- Count all drivers (admin should see all)
SELECT
    'Admin: Drivers Count' AS test,
    COUNT(*) AS total_drivers,
    COUNT(*) FILTER (WHERE is_active = true) AS active_drivers
FROM drivers;

-- Count all rides (admin should see all)
SELECT
    'Admin: Rides Count' AS test,
    COUNT(*) AS total_rides,
    status,
    COUNT(*) AS count_per_status
FROM rides
GROUP BY status
ORDER BY status;

-- =============================================================================
-- TEST 2: Driver Access - Should only see own data
-- =============================================================================

-- Get driver ID for current user (if they are a driver)
WITH current_driver AS (
    SELECT d.id as driver_id, d.first_name, d.last_name
    FROM drivers d
    WHERE d.user_id = auth.uid()
)
SELECT
    'Driver: My Profile' AS test,
    driver_id,
    first_name,
    last_name
FROM current_driver;

-- Driver: Can I see patients for my rides?
SELECT
    'Driver: Accessible Patients' AS test,
    p.id,
    p.first_name,
    p.last_name
FROM patients p
LIMIT 10;

-- Driver: Can I see my rides?
SELECT
    'Driver: My Rides' AS test,
    r.id,
    r.status,
    r.pickup_time,
    p.first_name || ' ' || p.last_name AS patient_name,
    d.name AS destination
FROM rides r
JOIN patients p ON r.patient_id = p.id
JOIN destinations d ON r.destination_id = d.id
LIMIT 10;

-- Driver: Can I see other drivers' rides? (Should return empty if policies work)
SELECT
    'Driver: Other Drivers Rides (should be empty)' AS test,
    r.id,
    r.driver_id
FROM rides r
WHERE r.driver_id != (SELECT id FROM drivers WHERE user_id = auth.uid())
LIMIT 10;

-- =============================================================================
-- TEST 3: Driver Can Manage Own Availability
-- =============================================================================

-- Driver: Can I see my availability blocks?
SELECT
    'Driver: My Availability Blocks' AS test,
    ab.id,
    ab.weekday,
    ab.start_time,
    ab.end_time
FROM availability_blocks ab
WHERE ab.driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
LIMIT 10;

-- Driver: Can I see other drivers' availability? (Should be empty if policies work)
SELECT
    'Driver: Other Drivers Availability (should be empty)' AS test,
    ab.id,
    ab.driver_id
FROM availability_blocks ab
WHERE ab.driver_id != (SELECT id FROM drivers WHERE user_id = auth.uid())
LIMIT 10;

-- =============================================================================
-- TEST 4: Driver Can Manage Own Absences
-- =============================================================================

-- Driver: Can I see my absences?
SELECT
    'Driver: My Absences' AS test,
    a.id,
    a.from_date,
    a.to_date,
    a.reason
FROM absences a
WHERE a.driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
LIMIT 10;

-- Driver: Can I see other drivers' absences? (Should be empty if policies work)
SELECT
    'Driver: Other Drivers Absences (should be empty)' AS test,
    a.id,
    a.driver_id
FROM absences a
WHERE a.driver_id != (SELECT id FROM drivers WHERE user_id = auth.uid())
LIMIT 10;

-- =============================================================================
-- TEST 5: Profile Access
-- =============================================================================

-- Can I read my own profile?
SELECT
    'Profile: My Profile' AS test,
    p.id,
    p.role,
    p.display_name
FROM profiles p
WHERE p.id = auth.uid();

-- Can I read other profiles? (Only admin should see all)
SELECT
    'Profile: All Profiles (admin only)' AS test,
    COUNT(*) AS visible_profiles
FROM profiles;

-- =============================================================================
-- TEST 6: Destinations (All authenticated can read)
-- =============================================================================

-- All users should be able to read active destinations
SELECT
    'Destinations: Visible' AS test,
    COUNT(*) AS total_destinations,
    COUNT(*) FILTER (WHERE is_active = true) AS active_destinations
FROM destinations;

-- =============================================================================
-- SECURITY VERIFICATION QUERIES
-- =============================================================================

-- List all RLS policies on each table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify RLS is enabled on all tables
SELECT
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    CASE
        WHEN relrowsecurity THEN 'RLS ENABLED'
        ELSE 'WARNING: RLS DISABLED!'
    END AS status
FROM pg_class
WHERE relname IN ('profiles', 'patients', 'drivers', 'destinations', 'rides', 'availability_blocks', 'absences')
ORDER BY relname;

-- =============================================================================
-- EXPECTED RESULTS SUMMARY
-- =============================================================================

/*
ADMIN (role = 'admin'):
- Can read ALL patients (including inactive)
- Can read ALL drivers (including inactive)
- Can read ALL rides
- Can read ALL profiles
- Can insert/update/delete patients, drivers, destinations, rides

OPERATOR (role = 'operator'):
- Same as admin for patients, drivers, destinations, rides
- Cannot modify profiles

DRIVER (role = 'driver'):
- Can read only patients for their assigned rides
- Can read only their own driver record
- Can read only their assigned rides
- Can update status of their assigned rides
- Can read/insert/update/delete their own availability blocks
- Can read/insert/update/delete their own absences
- Can read all destinations (needed for ride info)
- Cannot see other drivers' data

ANONYMOUS/UNAUTHENTICATED:
- No access to any data (RLS blocks all)
*/
