-- =============================================================================
-- PRIVILEGE ESCALATION PREVENTION
-- Prevents users from modifying their own roles
-- =============================================================================

-- =============================================================================
-- TRIGGER TO PREVENT SELF-ROLE-MODIFICATION
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_self_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user is trying to modify their own profile
    IF NEW.id = auth.uid() THEN
        -- Allow updates to other fields, but not role
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            RAISE EXCEPTION 'Users cannot modify their own role. Please contact an administrator.';
        END IF;
    END IF;

    -- Only admins can change roles
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Only administrators can change user roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS prevent_self_role_change ON profiles;
CREATE TRIGGER prevent_self_role_change
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_role_change();

-- =============================================================================
-- PREVENT ROLE ESCALATION VIA INSERT
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_default_role_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- New users always start as 'driver' role (least privilege)
    -- Admin must explicitly promote them
    IF NEW.role != 'driver' THEN
        -- Only allow if inserting user is admin
        IF NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        ) THEN
            -- Force default role for non-admins
            NEW.role := 'driver';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS enforce_default_role_on_insert ON profiles;
CREATE TRIGGER enforce_default_role_on_insert
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION enforce_default_role_on_insert();

-- =============================================================================
-- ADDITIONAL SECURITY: PREVENT ADMIN FROM DEMOTING THEMSELVES
-- (Ensures at least one admin always exists)
-- =============================================================================

CREATE OR REPLACE FUNCTION ensure_admin_exists()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INT;
BEGIN
    -- Check if this would remove the last admin
    IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin' THEN
        SELECT COUNT(*) INTO admin_count
        FROM profiles
        WHERE role = 'admin'
        AND id != OLD.id;

        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot remove the last administrator. Promote another user to admin first.';
        END IF;
    END IF;

    -- Check if deleting last admin
    IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
        SELECT COUNT(*) INTO admin_count
        FROM profiles
        WHERE role = 'admin'
        AND id != OLD.id;

        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot delete the last administrator account.';
        END IF;

        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS ensure_admin_exists ON profiles;
CREATE TRIGGER ensure_admin_exists
    BEFORE UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_admin_exists();

-- =============================================================================
-- RESTRICT DRIVER LINKING
-- Only admins can link users to driver records (prevents impersonation)
-- =============================================================================

CREATE OR REPLACE FUNCTION restrict_driver_user_linking()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user_id is being set or changed
    IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
        -- Only admins can link users to drivers
        IF NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Only administrators can link user accounts to driver profiles.';
        END IF;

        -- Verify the user_id exists and isn't already linked to another driver
        IF EXISTS (
            SELECT 1 FROM drivers
            WHERE user_id = NEW.user_id
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'This user account is already linked to another driver profile.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to drivers table
DROP TRIGGER IF EXISTS restrict_driver_user_linking ON drivers;
CREATE TRIGGER restrict_driver_user_linking
    BEFORE INSERT OR UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION restrict_driver_user_linking();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION prevent_self_role_change IS 'Prevents users from modifying their own role, requires admin for any role change';
COMMENT ON FUNCTION enforce_default_role_on_insert IS 'Forces new users to start with driver role (least privilege)';
COMMENT ON FUNCTION ensure_admin_exists IS 'Ensures at least one admin account always exists in the system';
COMMENT ON FUNCTION restrict_driver_user_linking IS 'Prevents unauthorized linking of user accounts to driver profiles';
