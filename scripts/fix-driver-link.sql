-- Fix driver linkage for demo user
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    v_driver_user_id UUID := '20905f39-8062-411e-9b13-6560f5e7d19b';
    v_driver_record_id UUID;
    v_driver_code TEXT;
BEGIN
    -- Find existing TEST-DRV-01 driver
    SELECT id, driver_code INTO v_driver_record_id, v_driver_code
    FROM drivers
    WHERE driver_code = 'TEST-DRV-01'
    LIMIT 1;

    IF v_driver_record_id IS NOT NULL THEN
        -- Link existing driver to user
        UPDATE drivers
        SET user_id = v_driver_user_id
        WHERE id = v_driver_record_id;

        RAISE NOTICE 'Linked existing driver % to user', v_driver_code;
    ELSE
        -- Create new driver if none exists
        INSERT INTO drivers (
            driver_code,
            first_name,
            last_name,
            phone,
            email,
            user_id,
            is_active,
            vehicle_type
        ) VALUES (
            'TEST-DRV-01',
            'Max',
            'Mustermann',
            '+41791234567',
            'fahrer@demo.fahrdienst.ch',
            v_driver_user_id,
            true,
            'car'
        ) RETURNING id INTO v_driver_record_id;

        RAISE NOTICE 'Created new driver TEST-DRV-01';
    END IF;

    RAISE NOTICE 'Driver linkage complete: driver_id = %, user_id = %', v_driver_record_id, v_driver_user_id;
END $$;

-- Verify the linkage
SELECT
    d.id,
    d.driver_code,
    d.first_name || ' ' || d.last_name AS driver_name,
    d.user_id,
    p.role,
    p.display_name
FROM drivers d
LEFT JOIN profiles p ON d.user_id = p.id
WHERE d.driver_code = 'TEST-DRV-01';
