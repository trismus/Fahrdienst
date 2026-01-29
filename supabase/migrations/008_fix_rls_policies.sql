-- Migration: 008_fix_rls_policies.sql
-- Purpose: Remove overly permissive RLS policies added in add_write_policies.sql
--
-- SECURITY FIX: The add_write_policies.sql migration added policies with `using (true)`
-- which allows ANY authenticated user to perform ANY operation. This is a critical
-- security vulnerability that bypasses all role-based access control.
--
-- The proper role-based policies already exist in:
-- - 001_master_data.sql (patients, drivers, destinations, profiles)
-- - 004_rides_and_availability.sql (rides, availability_blocks, absences)
-- - 006_rls_policy_improvements.sql (additional driver access)
--
-- This migration removes the broken policies from add_write_policies.sql
-- =============================================================================

-- =============================================================================
-- DROP BROKEN POLICIES FROM add_write_policies.sql
-- =============================================================================

-- These policies use `using (true)` / `with check (true)` which is insecure

-- Patients
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON patients;

-- Drivers
DROP POLICY IF EXISTS "Authenticated users can insert drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can update drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can delete drivers" ON drivers;

-- Destinations
DROP POLICY IF EXISTS "Authenticated users can insert destinations" ON destinations;
DROP POLICY IF EXISTS "Authenticated users can update destinations" ON destinations;
DROP POLICY IF EXISTS "Authenticated users can delete destinations" ON destinations;

-- Rides
DROP POLICY IF EXISTS "Authenticated users can insert rides" ON rides;
DROP POLICY IF EXISTS "Authenticated users can update rides" ON rides;
DROP POLICY IF EXISTS "Authenticated users can delete rides" ON rides;

-- Availability blocks
DROP POLICY IF EXISTS "Authenticated users can insert availability_blocks" ON availability_blocks;
DROP POLICY IF EXISTS "Authenticated users can update availability_blocks" ON availability_blocks;
DROP POLICY IF EXISTS "Authenticated users can delete availability_blocks" ON availability_blocks;

-- Absences
DROP POLICY IF EXISTS "Authenticated users can insert absences" ON absences;
DROP POLICY IF EXISTS "Authenticated users can update absences" ON absences;
DROP POLICY IF EXISTS "Authenticated users can delete absences" ON absences;

-- =============================================================================
-- ADD MISSING DELETE POLICIES (with proper role checks)
-- =============================================================================

-- The original migrations had INSERT and UPDATE but not DELETE for some tables

-- Patients DELETE (soft delete via is_active, but we allow hard delete for admins)
CREATE POLICY IF NOT EXISTS "Admin/Operator can delete patients"
    ON patients FOR DELETE
    TO authenticated
    USING (is_admin_or_operator());

-- Drivers DELETE
CREATE POLICY IF NOT EXISTS "Admin/Operator can delete drivers"
    ON drivers FOR DELETE
    TO authenticated
    USING (is_admin_or_operator());

-- Destinations DELETE
CREATE POLICY IF NOT EXISTS "Admin/Operator can delete destinations"
    ON destinations FOR DELETE
    TO authenticated
    USING (is_admin_or_operator());

-- =============================================================================
-- PROFILES TABLE: Add missing insert policy for trigger
-- =============================================================================

-- The on_auth_user_created trigger needs to insert profiles
-- SECURITY DEFINER functions bypass RLS, but we add this for completeness
CREATE POLICY IF NOT EXISTS "System can insert profiles"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- =============================================================================
-- VERIFY RLS IS ENABLED ON ALL TABLES
-- =============================================================================

-- These are idempotent, safe to run multiple times
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Admin/Operator can read all patients" ON patients IS
    'Dispatchers (admin/operator) can read all patient records for scheduling';

COMMENT ON POLICY "Drivers can read patients for own rides" ON patients IS
    'Drivers can only see patient data for rides assigned to them';

COMMENT ON POLICY "Admin/Operator can insert patients" ON patients IS
    'Only dispatchers can create new patient records';

COMMENT ON POLICY "Admin/Operator can update patients" ON patients IS
    'Only dispatchers can modify patient records';

COMMENT ON POLICY "Admin/Operator can delete patients" ON patients IS
    'Only dispatchers can delete patient records (prefer soft delete via is_active)';

-- =============================================================================
-- POLICY SUMMARY (for reference)
-- =============================================================================
--
-- PROFILES:
--   SELECT: Users can read own profile; Admins can read all
--   UPDATE: Only admins can update profiles
--   INSERT: Only own profile (for trigger)
--
-- PATIENTS:
--   SELECT: Admin/Operator can read all; Drivers can read for assigned rides
--   INSERT/UPDATE/DELETE: Admin/Operator only
--
-- DRIVERS:
--   SELECT: Admin/Operator can read all; Drivers can read own record
--   INSERT/UPDATE/DELETE: Admin/Operator only (except phone update for own record)
--
-- DESTINATIONS:
--   SELECT: All authenticated users (needed for ride display)
--   INSERT/UPDATE/DELETE: Admin/Operator only
--
-- RIDES:
--   SELECT: Admin/Operator can read all; Drivers can read assigned rides
--   INSERT/DELETE: Admin/Operator only
--   UPDATE: Admin/Operator can update all; Drivers can update status of own rides
--
-- AVAILABILITY_BLOCKS:
--   SELECT: Admin/Operator can read all; Drivers can read own
--   INSERT/UPDATE/DELETE: Admin/Operator for all; Drivers for own only
--
-- ABSENCES:
--   SELECT: Admin/Operator can read all; Drivers can read own
--   INSERT/UPDATE/DELETE: Admin/Operator for all; Drivers for own only
-- =============================================================================
