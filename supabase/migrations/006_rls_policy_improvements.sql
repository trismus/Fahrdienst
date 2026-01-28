-- Migration: RLS Policy Improvements
-- Adds missing policies identified during Sprint 5 security review

-- =============================================================================
-- PATIENTS: Allow drivers to read patient data for their assigned rides
-- =============================================================================

-- Drop existing policy to recreate with better logic
DROP POLICY IF EXISTS "Admin/Operator can read patients" ON patients;

-- Admin/Operator can read ALL patients (including inactive for review)
CREATE POLICY "Admin/Operator can read all patients"
    ON patients FOR SELECT
    TO authenticated
    USING (is_admin_or_operator());

-- Drivers can read patient data only for their assigned rides
CREATE POLICY "Drivers can read patients for own rides"
    ON patients FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT r.patient_id
            FROM rides r
            JOIN drivers d ON r.driver_id = d.id
            WHERE d.user_id = auth.uid()
            AND r.status NOT IN ('cancelled')
        )
    );

-- =============================================================================
-- DRIVERS: Allow drivers to update their own phone number
-- =============================================================================

-- Drivers can update only their phone number
CREATE POLICY "Drivers can update own phone"
    ON drivers FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        -- Only phone can be changed - enforced via application layer
        -- PostgreSQL RLS cannot easily restrict which columns are updated
    );

-- =============================================================================
-- DESTINATIONS: Allow drivers to read destinations for their assigned rides
-- =============================================================================

-- Note: destinations already has a policy allowing all authenticated users to read
-- This is correct as drivers need destination info for navigation

-- =============================================================================
-- AUDIT LOG: Restrict to admins only (if not already done)
-- =============================================================================

-- Check if audit_log table exists before applying policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        -- Enable RLS if not already enabled
        EXECUTE 'ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY';

        -- Drop existing policies to avoid conflicts
        DROP POLICY IF EXISTS "Only admins can read audit log" ON audit_log;

        -- Only admins can read audit log
        EXECUTE 'CREATE POLICY "Only admins can read audit log" ON audit_log FOR SELECT TO authenticated USING (get_user_role() = ''admin'')';
    END IF;
END $$;

-- =============================================================================
-- Add comment explaining the RLS strategy
-- =============================================================================

COMMENT ON TABLE profiles IS 'User profiles with role-based access control. RLS enabled.';
COMMENT ON TABLE patients IS 'Patient master data. RLS: Admin/Operator full access, Drivers read-only for assigned rides.';
COMMENT ON TABLE drivers IS 'Driver master data. RLS: Admin/Operator full access, Drivers can read own record and update phone.';
COMMENT ON TABLE destinations IS 'Destination master data. RLS: All authenticated users can read, Admin/Operator can write.';
COMMENT ON TABLE rides IS 'Ride records. RLS: Admin/Operator full access, Drivers can read/update own assigned rides.';
COMMENT ON TABLE availability_blocks IS 'Driver availability schedules. RLS: Drivers can manage own, Admin/Operator full access.';
COMMENT ON TABLE absences IS 'Driver absence records. RLS: Drivers can manage own, Admin/Operator full access.';
