-- =============================================================================
-- SEED DATA - DEVELOPMENT/TEST ONLY
-- =============================================================================
-- WARNING: This file contains FAKE TEST DATA only!
-- DO NOT deploy this to production environments.
-- All names, addresses, and contact information are entirely fictional.
-- =============================================================================

-- Safety check: Prevent accidental execution in production
DO $$
BEGIN
    -- Check for production indicators
    IF current_setting('app.environment', true) = 'production' THEN
        RAISE EXCEPTION 'SEED DATA BLOCKED: Cannot run seed data in production environment!';
    END IF;
END $$;

-- =============================================================================
-- TEST PATIENTS (Fictional Characters)
-- All data is obviously fake - using cartoon/movie character names
-- =============================================================================

INSERT INTO patients (
    patient_number,
    first_name,
    last_name,
    date_of_birth,
    phone,
    email,
    street,
    postal_code,
    city,
    country,
    latitude,
    longitude,
    pickup_instructions,
    needs_wheelchair,
    needs_walker,
    needs_assistance,
    emergency_contact_name,
    emergency_contact_phone,
    insurance,
    notes
) VALUES
(
    'TEST-PAT-001',
    'Heidi',
    'Testperson',
    '1945-01-01',
    '+41 79 000 00 01',
    'heidi.test@example.invalid',
    'Teststrasse 1',
    '0001',
    'Testdorf',
    'CH',
    47.0000,
    8.0000,
    '[TEST] Fiktive Abhol-Anweisungen',
    FALSE,
    TRUE,
    TRUE,
    'Peter Testperson',
    '+41 79 000 00 02',
    'Test-Versicherung',
    '[TEST DATA] Dies ist ein fiktiver Testpatient'
),
(
    'TEST-PAT-002',
    'Wilhelm',
    'Beispiel',
    '1950-06-15',
    '+41 76 000 00 03',
    NULL,
    'Musterweg 42',
    '0002',
    'Musterstadt',
    'CH',
    47.1000,
    8.1000,
    '[TEST] Rollstuhlrampe - TESTDATEN',
    TRUE,
    FALSE,
    TRUE,
    'Klara Beispiel',
    '+41 76 000 00 04',
    'Muster-Krankenkasse',
    '[TEST DATA] Fiktiver Dialyse-Patient'
),
(
    'TEST-PAT-003',
    'Max',
    'Mustermann',
    '1938-12-31',
    '+41 78 000 00 05',
    'max.mustermann@example.invalid',
    'Beispielgasse 99',
    '0003',
    'Demoville',
    'CH',
    47.2000,
    8.2000,
    NULL,
    FALSE,
    FALSE,
    FALSE,
    'Erika Mustermann',
    '+41 78 000 00 06',
    'Demo-Versicherung',
    '[TEST DATA] Standard-Testpatient ohne spezielle Anforderungen'
),
(
    'TEST-PAT-004',
    'Anna',
    'Testerin',
    '1960-03-20',
    '+41 79 000 00 07',
    'anna.test@example.invalid',
    'Fakestrasse 123',
    '0004',
    'Fiktivhausen',
    'CH',
    47.3000,
    8.3000,
    '[TEST] Erdgeschoss - TESTDATEN',
    FALSE,
    TRUE,
    FALSE,
    NULL,
    NULL,
    'Fake-Insurance AG',
    '[TEST DATA] Testpatientin mit Rollator'
),
(
    'TEST-PAT-005',
    'Otto',
    'Platzhalter',
    '1949-09-09',
    '+41 76 000 00 08',
    NULL,
    'Dummyweg 7',
    '0005',
    'Placeholder',
    'CH',
    47.4000,
    8.4000,
    '[TEST] Gelbes Testhaus',
    TRUE,
    FALSE,
    TRUE,
    'Greta Platzhalter',
    '+41 76 000 00 09',
    'Placeholder-Kasse',
    '[TEST DATA] Rollstuhl erforderlich - TESTDATEN'
);

-- =============================================================================
-- TEST DRIVERS (Fictional)
-- =============================================================================

INSERT INTO drivers (
    driver_code,
    first_name,
    last_name,
    phone,
    email,
    home_city,
    home_street,
    home_postal_code,
    has_driving_license,
    vehicle_type,
    vehicle_plate,
    notes
) VALUES
(
    'TEST-DRV-01',
    'Fahrer',
    'Eins',
    '+41 79 000 00 10',
    'fahrer1@example.invalid',
    'Testdorf',
    'Teststrasse 10',
    '0001',
    TRUE,
    'accessible_van',
    'XX 000001',
    '[TEST] Testfahrer mit Rollstuhltransport-Erfahrung'
),
(
    'TEST-DRV-02',
    'Fahrerin',
    'Zwei',
    '+41 76 000 00 11',
    'fahrer2@example.invalid',
    'Musterstadt',
    'Musterplatz 5',
    '0002',
    TRUE,
    'car',
    'XX 000002',
    '[TEST] Standard-Testfahrerin'
),
(
    'TEST-DRV-03',
    'Test',
    'Driver',
    '+41 78 000 00 12',
    'testdriver@example.invalid',
    'Demoville',
    'Demostrasse 3',
    '0003',
    TRUE,
    'van',
    'XX 000003',
    '[TEST] Testfahrer - DEVELOPMENT ONLY'
);

-- =============================================================================
-- TEST DESTINATIONS (Fictional Medical Facilities)
-- =============================================================================

INSERT INTO destinations (
    name,
    destination_type,
    department,
    street,
    postal_code,
    city,
    country,
    latitude,
    longitude,
    phone,
    email,
    opening_hours,
    arrival_instructions,
    notes
) VALUES
(
    '[TEST] Musterspital Teststadt',
    'hospital',
    NULL,
    'Spitalweg 1',
    '0001',
    'Teststadt',
    'CH',
    47.0000,
    8.0000,
    '+41 00 000 00 01',
    'info@test-hospital.invalid',
    '[TEST] Mo-Fr 08:00-17:00',
    '[TEST] Fiktiver Haupteingang',
    '[TEST DATA] Fiktives Testspital - NUR FÜR ENTWICKLUNG'
),
(
    '[TEST] Musterspital - Dialyse',
    'hospital',
    'Test-Dialysezentrum',
    'Spitalweg 1',
    '0001',
    'Teststadt',
    'CH',
    47.0000,
    8.0000,
    '+41 00 000 00 02',
    'dialyse@test-hospital.invalid',
    '[TEST] Mo-Sa 06:00-22:00',
    '[TEST] Eingang B - TESTDATEN',
    '[TEST DATA] Fiktive Dialysestation'
),
(
    '[TEST] Praxis Dr. Testdoktor',
    'doctor',
    'Test-Allgemeinmedizin',
    'Praxisstrasse 10',
    '0002',
    'Musterstadt',
    'CH',
    47.1000,
    8.1000,
    '+41 00 000 00 03',
    'praxis@testdoktor.invalid',
    '[TEST] Mo-Fr 08:00-12:00',
    '[TEST] Fiktive Praxis - 1. OG',
    '[TEST DATA] Testpraxis - DEVELOPMENT ONLY'
),
(
    '[TEST] Demo-Physiotherapie',
    'therapy',
    'Test-Physiotherapie',
    'Therapieweg 5',
    '0003',
    'Demoville',
    'CH',
    47.2000,
    8.2000,
    '+41 00 000 00 04',
    'info@test-physio.invalid',
    '[TEST] Mo-Fr 07:00-20:00',
    '[TEST] Erdgeschoss - TESTDATEN',
    '[TEST DATA] Fiktive Physiotherapie'
),
(
    '[TEST] Muster-Augenzentrum',
    'doctor',
    'Test-Augenheilkunde',
    'Augenstrasse 20',
    '0004',
    'Fiktivhausen',
    'CH',
    47.3000,
    8.3000,
    '+41 00 000 00 05',
    'info@test-augen.invalid',
    '[TEST] Mo-Fr 08:00-17:00',
    '[TEST] 3. Stock - TESTDATEN',
    '[TEST DATA] Fiktives Augenzentrum'
),
(
    '[TEST] Testklinik Premium',
    'hospital',
    NULL,
    'Klinikstrasse 99',
    '0005',
    'Placeholder',
    'CH',
    47.4000,
    8.4000,
    '+41 00 000 00 06',
    'info@testklinik.invalid',
    '[TEST] Mo-Fr 07:30-18:00',
    '[TEST] Haupteingang - TESTDATEN',
    '[TEST DATA] Fiktive Privatklinik - NUR FÜR TESTS'
),
(
    '[TEST] Demo-Rheumazentrum',
    'therapy',
    'Test-Rheumatologie',
    'Thermalweg 2',
    '0006',
    'Testbad',
    'CH',
    47.5000,
    8.5000,
    '+41 00 000 00 07',
    NULL,
    '[TEST] Mo-Fr 08:00-18:00',
    '[TEST] Nordeingang - TESTDATEN',
    '[TEST DATA] Fiktives Rheumazentrum'
);

-- =============================================================================
-- VERIFY SEED DATA
-- =============================================================================

DO $$
DECLARE
    patient_count INTEGER;
    driver_count INTEGER;
    destination_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO patient_count FROM patients;
    SELECT COUNT(*) INTO driver_count FROM drivers;
    SELECT COUNT(*) INTO destination_count FROM destinations;

    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'TEST SEED DATA LOADED (DEVELOPMENT ONLY)';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '  Test Patients: %', patient_count;
    RAISE NOTICE '  Test Drivers: %', driver_count;
    RAISE NOTICE '  Test Destinations: %', destination_count;
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'WARNING: All data is FAKE and for testing only!';
    RAISE NOTICE '=====================================================';
END $$;
