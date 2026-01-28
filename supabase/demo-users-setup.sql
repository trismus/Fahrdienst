-- =============================================================================
-- DEMO USERS SETUP
-- =============================================================================
-- This script configures demo users AFTER they have been created in Supabase Auth.
--
-- PREREQUISITES:
-- 1. Create users manually in Supabase Dashboard:
--    - Go to Authentication → Users → "Add User"
--    - Create the following users with passwords:
--
--    | Email                      | Password     | Purpose          |
--    |---------------------------|--------------|------------------|
--    | dispatcher@demo.fahrdienst.ch | Demo1234!    | Dispatcher login |
--    | fahrer@demo.fahrdienst.ch     | Demo1234!    | Driver login     |
--
-- 2. Copy the User IDs from the Supabase Dashboard
-- 3. Replace the placeholder UUIDs below with the actual User IDs
-- 4. Run this script in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: Set your User IDs here (from Supabase Auth Dashboard)
-- =============================================================================

DO $$
DECLARE
    -- REPLACE THESE WITH ACTUAL USER IDs FROM SUPABASE AUTH!
    v_dispatcher_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Replace!
    v_driver_user_id UUID := '00000000-0000-0000-0000-000000000002';     -- Replace!
    v_driver_record_id UUID;
BEGIN
    -- Validate that placeholders have been replaced
    IF v_dispatcher_user_id = '00000000-0000-0000-0000-000000000001' THEN
        RAISE EXCEPTION 'Please replace v_dispatcher_user_id with the actual User ID from Supabase Auth!';
    END IF;

    IF v_driver_user_id = '00000000-0000-0000-0000-000000000002' THEN
        RAISE EXCEPTION 'Please replace v_driver_user_id with the actual User ID from Supabase Auth!';
    END IF;

    -- =============================================================================
    -- STEP 2: Update Dispatcher Profile to Admin Role
    -- =============================================================================

    UPDATE profiles
    SET role = 'admin',
        display_name = 'Demo Dispatcher'
    WHERE id = v_dispatcher_user_id;

    IF NOT FOUND THEN
        -- Profile might not exist yet, insert it
        INSERT INTO profiles (id, role, display_name)
        VALUES (v_dispatcher_user_id, 'admin', 'Demo Dispatcher')
        ON CONFLICT (id) DO UPDATE SET role = 'admin', display_name = 'Demo Dispatcher';
    END IF;

    RAISE NOTICE 'Dispatcher profile updated: role = admin';

    -- =============================================================================
    -- STEP 3: Update Driver Profile (stays as driver role, which is default)
    -- =============================================================================

    UPDATE profiles
    SET display_name = 'Demo Fahrer'
    WHERE id = v_driver_user_id;

    IF NOT FOUND THEN
        INSERT INTO profiles (id, role, display_name)
        VALUES (v_driver_user_id, 'driver', 'Demo Fahrer')
        ON CONFLICT (id) DO UPDATE SET display_name = 'Demo Fahrer';
    END IF;

    RAISE NOTICE 'Driver profile updated: role = driver';

    -- =============================================================================
    -- STEP 4: Link Driver User to Driver Record
    -- =============================================================================

    -- Find the first test driver and link to this user
    SELECT id INTO v_driver_record_id
    FROM drivers
    WHERE driver_code = 'TEST-DRV-01'
    LIMIT 1;

    IF v_driver_record_id IS NOT NULL THEN
        UPDATE drivers
        SET user_id = v_driver_user_id
        WHERE id = v_driver_record_id;

        RAISE NOTICE 'Driver record linked: TEST-DRV-01 -> user_id';
    ELSE
        RAISE WARNING 'No test driver found with code TEST-DRV-01. Run seed.sql first!';
    END IF;

    -- =============================================================================
    -- DONE
    -- =============================================================================

    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DEMO USERS CONFIGURED SUCCESSFULLY';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Dispatcher: dispatcher@demo.fahrdienst.ch (role: admin)';
    RAISE NOTICE 'Fahrer: fahrer@demo.fahrdienst.ch (role: driver)';
    RAISE NOTICE '=====================================================';

END $$;

-- =============================================================================
-- VERIFICATION: Check the setup
-- =============================================================================

SELECT
    p.id,
    p.role,
    p.display_name,
    d.driver_code,
    d.first_name || ' ' || d.last_name AS driver_name
FROM profiles p
LEFT JOIN drivers d ON d.user_id = p.id
ORDER BY p.role;
