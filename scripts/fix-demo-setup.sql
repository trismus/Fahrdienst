-- =============================================================================
-- FIX DEMO SETUP
-- =============================================================================
-- This script fixes the demo user configuration
-- =============================================================================

DO $$
DECLARE
    v_dispatcher_user_id UUID := 'bdbbf386-d7b4-4d7a-9cc5-6e6306571cca';
    v_driver_user_id UUID := '20905f39-8062-411e-9b13-6560f5e7d19b';
    v_driver_record_id UUID;
BEGIN
    -- =============================================================================
    -- Link Driver User to Driver Record (TEST-DRV-01)
    -- =============================================================================

    -- Find TEST-DRV-01 driver record
    SELECT id INTO v_driver_record_id
    FROM drivers
    WHERE driver_code = 'TEST-DRV-01'
    LIMIT 1;

    IF v_driver_record_id IS NOT NULL THEN
        -- Link driver user to driver record
        UPDATE drivers
        SET user_id = v_driver_user_id
        WHERE id = v_driver_record_id;

        RAISE NOTICE 'Driver record linked: TEST-DRV-01 -> user %', v_driver_user_id;
    ELSE
        RAISE WARNING 'No driver found with code TEST-DRV-01. Creating one...';

        -- Create a test driver if none exists
        INSERT INTO drivers (
            driver_code,
            first_name,
            last_name,
            phone,
            email,
            user_id,
            is_active
        ) VALUES (
            'TEST-DRV-01',
            'Max',
            'Mustermann',
            '+41791234567',
            'fahrer@demo.fahrdienst.ch',
            v_driver_user_id,
            true
        ) RETURNING id INTO v_driver_record_id;

        RAISE NOTICE 'Created new driver record: TEST-DRV-01 (ID: %)', v_driver_record_id;
    END IF;

    -- =============================================================================
    -- DONE
    -- =============================================================================

    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DEMO SETUP FIXED SUCCESSFULLY';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Dispatcher: dispatcher@demo.fahrdienst.ch (role: admin)';
    RAISE NOTICE 'Fahrer: fahrer@demo.fahrdienst.ch (role: driver)';
    RAISE NOTICE 'Driver Record: TEST-DRV-01 linked to fahrer user';
    RAISE NOTICE '=====================================================';

END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT
    d.driver_code,
    d.first_name || ' ' || d.last_name AS driver_name,
    d.user_id,
    p.role,
    p.display_name
FROM drivers d
LEFT JOIN profiles p ON d.user_id = p.id
WHERE d.driver_code = 'TEST-DRV-01';
