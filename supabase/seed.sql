-- =============================================================================
-- SEED DATA - Swiss Sample Data for Fahrdienst App
-- Run this after the migration to populate test data
-- =============================================================================

-- =============================================================================
-- PATIENTS
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
    'PAT-001',
    'Hans',
    'Müller',
    '1945-03-15',
    '+41 79 123 45 67',
    'hans.mueller@bluewin.ch',
    'Bahnhofstrasse 12',
    '5400',
    'Baden',
    'CH',
    47.4731,
    8.3068,
    'Klingel bei Müller, 2. Stock links',
    FALSE,
    TRUE,
    TRUE,
    'Maria Müller',
    '+41 79 234 56 78',
    'Helsana',
    'Herr Müller braucht etwas mehr Zeit beim Einsteigen'
),
(
    'PAT-002',
    'Elisabeth',
    'Schneider',
    '1952-07-22',
    '+41 76 987 65 43',
    NULL,
    'Hauptstrasse 45',
    '5430',
    'Wettingen',
    'CH',
    47.4622,
    8.3193,
    'Rollstuhlrampe vorhanden, Seiteneingang benutzen',
    TRUE,
    FALSE,
    TRUE,
    'Peter Schneider',
    '+41 76 876 54 32',
    'CSS',
    'Dialyse-Patientin, 3x wöchentlich'
),
(
    'PAT-003',
    'Walter',
    'Brunner',
    '1938-11-08',
    '+41 78 111 22 33',
    'w.brunner@gmail.com',
    'Kirchgasse 8',
    '5442',
    'Fislisbach',
    'CH',
    47.4372,
    8.2912,
    NULL,
    FALSE,
    FALSE,
    FALSE,
    'Anna Brunner',
    '+41 78 222 33 44',
    'Swica',
    NULL
),
(
    'PAT-004',
    'Margrit',
    'Keller',
    '1960-04-30',
    '+41 79 555 66 77',
    'margrit.keller@sunrise.ch',
    'Zürcherstrasse 102',
    '5200',
    'Brugg',
    'CH',
    47.4856,
    8.2082,
    'Wohnung A3, Erdgeschoss',
    FALSE,
    TRUE,
    FALSE,
    NULL,
    NULL,
    'Concordia',
    'Hörgerät - bitte deutlich sprechen'
),
(
    'PAT-005',
    'Fritz',
    'Weber',
    '1949-09-12',
    '+41 76 444 55 66',
    NULL,
    'Dorfstrasse 23',
    '5412',
    'Gebenstorf',
    'CH',
    47.4797,
    8.2372,
    'Gelbes Haus mit grünen Fensterläden',
    TRUE,
    FALSE,
    TRUE,
    'Ruth Weber',
    '+41 76 333 44 55',
    'Visana',
    'Rollstuhl muss mitgenommen werden'
);

-- =============================================================================
-- DRIVERS
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
    'DRV-01',
    'Thomas',
    'Steiner',
    '+41 79 888 99 00',
    'thomas.steiner@fahrdienst.ch',
    'Baden',
    'Landstrasse 15',
    '5400',
    TRUE,
    'accessible_van',
    'AG 123456',
    'Erfahren mit Rollstuhltransport'
),
(
    'DRV-02',
    'Sandra',
    'Huber',
    '+41 76 777 88 99',
    's.huber@fahrdienst.ch',
    'Wettingen',
    'Bahnhofplatz 3',
    '5430',
    TRUE,
    'car',
    'AG 654321',
    NULL
),
(
    'DRV-03',
    'Marco',
    'Berger',
    '+41 78 666 77 88',
    'marco.berger@fahrdienst.ch',
    'Brugg',
    'Neumarkt 7',
    '5200',
    TRUE,
    'van',
    'AG 112233',
    'Bevorzugt Frühdienst'
);

-- =============================================================================
-- DESTINATIONS
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
    'Kantonsspital Baden',
    'hospital',
    NULL,
    'Im Ergel 1',
    '5404',
    'Baden',
    'CH',
    47.4654,
    8.2954,
    '+41 56 486 21 11',
    'info@ksb.ch',
    'Notfall 24h, Ambulant Mo-Fr 07:00-18:00',
    'Haupteingang, dann links zur Anmeldung',
    'Grosses Spital, Parkplätze vor Haupteingang'
),
(
    'Kantonsspital Baden - Dialyse',
    'hospital',
    'Dialysezentrum',
    'Im Ergel 1',
    '5404',
    'Baden',
    'CH',
    47.4654,
    8.2954,
    '+41 56 486 25 00',
    'dialyse@ksb.ch',
    'Mo-Sa 06:00-22:00',
    'Eingang Haus B, Lift in den 2. Stock',
    'Patienten sollten 10min vor Termin da sein'
),
(
    'Praxis Dr. med. Andrea Fischer',
    'doctor',
    'Allgemeinmedizin',
    'Weite Gasse 34',
    '5400',
    'Baden',
    'CH',
    47.4726,
    8.3042,
    '+41 56 222 33 44',
    'praxis@dr-fischer.ch',
    'Mo-Fr 08:00-12:00, 14:00-17:00',
    'Klingeln bei Fischer, 1. OG',
    NULL
),
(
    'Physiotherapie Limmat',
    'therapy',
    'Physiotherapie',
    'Mellingerstrasse 12',
    '5400',
    'Baden',
    'CH',
    47.4712,
    8.3001,
    '+41 56 555 66 77',
    'info@physio-limmat.ch',
    'Mo-Fr 07:00-20:00, Sa 08:00-12:00',
    'Erdgeschoss, rollstuhlgängig',
    'Eigene Parkplätze vorhanden'
),
(
    'Augenzentrum Aargau',
    'doctor',
    'Augenheilkunde',
    'Bahnhofstrasse 42',
    '5430',
    'Wettingen',
    'CH',
    47.4598,
    8.3145,
    '+41 56 444 55 66',
    'kontakt@augenzentrum-ag.ch',
    'Mo-Fr 08:00-17:00',
    'Lift vorhanden, Anmeldung im 3. Stock',
    'Nach Augenuntersuchung oft Begleitperson nötig (Pupillenerweiterung)'
),
(
    'Hirslanden Klinik Baden',
    'hospital',
    NULL,
    'Schänisweg',
    '5400',
    'Baden',
    'CH',
    47.4712,
    8.2945,
    '+41 56 486 81 11',
    'info@hirslanden.ch',
    'Ambulant Mo-Fr 07:30-18:00',
    'Haupteingang, Valet Parking möglich',
    'Privatklinik'
),
(
    'Rheumazentrum Baden',
    'therapy',
    'Rheumatologie',
    'Kurplatz 2',
    '5400',
    'Baden',
    'CH',
    47.4698,
    8.3112,
    '+41 56 333 44 55',
    NULL,
    'Mo-Fr 08:00-18:00',
    'Thermalbad-Gebäude, Eingang Nord',
    'Warme Umgebung, leichte Kleidung empfohlen'
);

-- =============================================================================
-- VERIFY SEED DATA
-- =============================================================================

-- Verify counts
DO $$
DECLARE
    patient_count INTEGER;
    driver_count INTEGER;
    destination_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO patient_count FROM patients;
    SELECT COUNT(*) INTO driver_count FROM drivers;
    SELECT COUNT(*) INTO destination_count FROM destinations;

    RAISE NOTICE 'Seed data loaded:';
    RAISE NOTICE '  Patients: %', patient_count;
    RAISE NOTICE '  Drivers: %', driver_count;
    RAISE NOTICE '  Destinations: %', destination_count;
END $$;
