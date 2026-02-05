-- =============================================================================
-- RLS POLICIES FOR FAHRDIENST
-- =============================================================================
-- This file contains all Row Level Security (RLS) policies for the application.
-- Run this in Supabase SQL Editor after schema.sql
--
-- User Roles:
-- - admin: Full access to all data, can manage users
-- - operator: Full access to operational data (patients, drivers, destinations, rides)
-- - driver: Read-only access to own assignments, can update availability/absences
--
-- Authentication:
-- Users are stored in auth.users, role is stored in profiles.role
-- =============================================================================

-- First, drop existing policies if they exist (to allow re-running this script)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get current user's role from profiles table
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = auth.uid();

    RETURN COALESCE(user_role, 'driver');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is a dispatcher (admin or operator)
CREATE OR REPLACE FUNCTION is_dispatcher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the driver ID for the current user
CREATE OR REPLACE FUNCTION get_driver_id()
RETURNS UUID AS $$
DECLARE
    driver_uuid UUID;
BEGIN
    SELECT id INTO driver_uuid
    FROM drivers
    WHERE user_id = auth.uid()
    LIMIT 1;

    RETURN driver_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PROFILES TABLE POLICIES
-- =============================================================================

-- Everyone can read their own profile
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (is_admin());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (is_admin());

-- Profiles are created via trigger, not directly
-- But admins can insert new profiles if needed
CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- =============================================================================
-- PATIENTS TABLE POLICIES
-- =============================================================================

-- Dispatchers (admin, operator) can read all patients
CREATE POLICY "Dispatchers can read patients"
    ON patients FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read patients for their assigned rides only
CREATE POLICY "Drivers can read their patients"
    ON patients FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM rides
            WHERE rides.patient_id = patients.id
            AND rides.driver_id = get_driver_id()
            AND rides.status IN ('planned', 'confirmed', 'in_progress')
        )
    );

-- Dispatchers can create patients
CREATE POLICY "Dispatchers can create patients"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Dispatchers can update patients
CREATE POLICY "Dispatchers can update patients"
    ON patients FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Dispatchers can delete patients (soft delete preferred)
CREATE POLICY "Dispatchers can delete patients"
    ON patients FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- =============================================================================
-- DRIVERS TABLE POLICIES
-- =============================================================================

-- Dispatchers can read all drivers
CREATE POLICY "Dispatchers can read drivers"
    ON drivers FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read their own record
CREATE POLICY "Drivers can read own record"
    ON drivers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Dispatchers can create drivers
CREATE POLICY "Dispatchers can create drivers"
    ON drivers FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Dispatchers can update drivers
CREATE POLICY "Dispatchers can update drivers"
    ON drivers FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Drivers can update their own contact info (not role-related fields)
CREATE POLICY "Drivers can update own contact info"
    ON drivers FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Dispatchers can delete drivers
CREATE POLICY "Dispatchers can delete drivers"
    ON drivers FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- =============================================================================
-- DESTINATIONS TABLE POLICIES
-- =============================================================================

-- All authenticated users can read destinations
CREATE POLICY "Authenticated users can read destinations"
    ON destinations FOR SELECT
    TO authenticated
    USING (true);

-- Dispatchers can create destinations
CREATE POLICY "Dispatchers can create destinations"
    ON destinations FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Dispatchers can update destinations
CREATE POLICY "Dispatchers can update destinations"
    ON destinations FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Dispatchers can delete destinations
CREATE POLICY "Dispatchers can delete destinations"
    ON destinations FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- =============================================================================
-- RIDES TABLE POLICIES
-- =============================================================================

-- Dispatchers can read all rides
CREATE POLICY "Dispatchers can read rides"
    ON rides FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read their own assigned rides
CREATE POLICY "Drivers can read own rides"
    ON rides FOR SELECT
    TO authenticated
    USING (driver_id = get_driver_id());

-- Dispatchers can create rides
CREATE POLICY "Dispatchers can create rides"
    ON rides FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Dispatchers can update all rides
CREATE POLICY "Dispatchers can update rides"
    ON rides FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Drivers can update their own rides (for status changes: confirm, start, complete)
CREATE POLICY "Drivers can update own rides"
    ON rides FOR UPDATE
    TO authenticated
    USING (driver_id = get_driver_id())
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can delete rides
CREATE POLICY "Dispatchers can delete rides"
    ON rides FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- =============================================================================
-- AVAILABILITY_BLOCKS TABLE POLICIES
-- =============================================================================

-- Dispatchers can read all availability blocks
CREATE POLICY "Dispatchers can read availability"
    ON availability_blocks FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read their own availability blocks
CREATE POLICY "Drivers can read own availability"
    ON availability_blocks FOR SELECT
    TO authenticated
    USING (driver_id = get_driver_id());

-- Dispatchers can create availability blocks
CREATE POLICY "Dispatchers can create availability"
    ON availability_blocks FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Drivers can create their own availability blocks
CREATE POLICY "Drivers can create own availability"
    ON availability_blocks FOR INSERT
    TO authenticated
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can update availability blocks
CREATE POLICY "Dispatchers can update availability"
    ON availability_blocks FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Drivers can update their own availability blocks
CREATE POLICY "Drivers can update own availability"
    ON availability_blocks FOR UPDATE
    TO authenticated
    USING (driver_id = get_driver_id())
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can delete availability blocks
CREATE POLICY "Dispatchers can delete availability"
    ON availability_blocks FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- Drivers can delete their own availability blocks
CREATE POLICY "Drivers can delete own availability"
    ON availability_blocks FOR DELETE
    TO authenticated
    USING (driver_id = get_driver_id());

-- =============================================================================
-- ABSENCES TABLE POLICIES
-- =============================================================================

-- Dispatchers can read all absences
CREATE POLICY "Dispatchers can read absences"
    ON absences FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read their own absences
CREATE POLICY "Drivers can read own absences"
    ON absences FOR SELECT
    TO authenticated
    USING (driver_id = get_driver_id());

-- Dispatchers can create absences
CREATE POLICY "Dispatchers can create absences"
    ON absences FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Drivers can create their own absences
CREATE POLICY "Drivers can create own absences"
    ON absences FOR INSERT
    TO authenticated
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can update absences
CREATE POLICY "Dispatchers can update absences"
    ON absences FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Drivers can update their own absences
CREATE POLICY "Drivers can update own absences"
    ON absences FOR UPDATE
    TO authenticated
    USING (driver_id = get_driver_id())
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can delete absences
CREATE POLICY "Dispatchers can delete absences"
    ON absences FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- Drivers can delete their own absences
CREATE POLICY "Drivers can delete own absences"
    ON absences FOR DELETE
    TO authenticated
    USING (driver_id = get_driver_id());

-- =============================================================================
-- PROFILES TABLE - AUTO-CREATE ON USER SIGNUP
-- =============================================================================

-- Trigger to automatically create a profile when a new user signs up
-- SECURITY: Always assigns 'driver' role. Admin must promote manually.
-- Never trust client-supplied role from raw_user_meta_data (privilege escalation risk).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, role, display_name)
    VALUES (
        NEW.id,
        'driver',  -- ALWAYS least-privileged role, never trust client input
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on all functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_dispatcher() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_id() TO authenticated;
