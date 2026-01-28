-- =============================================================================
-- PRODUCTION DEMO DATA
-- =============================================================================
-- Realistic demo data for production demonstrations.
-- All data is fictional but professionally presented.
-- Compatible with the original schema.sql structure.
-- =============================================================================

-- =============================================================================
-- PATIENTS (Fiktive Schweizer Namen)
-- =============================================================================
-- Schema: id, name, address, latitude, longitude, phone, special_needs, notes

INSERT INTO patients (
    name,
    address,
    latitude,
    longitude,
    phone,
    special_needs,
    notes
) VALUES
-- Patient 1: Dialyse-Patient mit Rollstuhl
(
    'Elisabeth Brunner',
    'Bahnhofstrasse 42, 5400 Baden',
    47.4731,
    8.3069,
    '+41 56 221 34 56',
    'Rollstuhl, Begleitung nötig',
    'Dialyse Mo/Mi/Fr. Klingeln bei Brunner, 2. Stock rechts. Lift vorhanden. Notfall: Hans Brunner +41 79 334 55 66'
),
-- Patient 2: Gehfähig mit Rollator
(
    'Werner Müller',
    'Hauptstrasse 15, 5000 Aarau',
    47.3925,
    8.0444,
    '+41 62 823 45 67',
    'Rollator',
    'Regelmässige Physiotherapie. Erdgeschoss, direkt an der Strasse. Notfall: Margrit Müller +41 62 823 45 68'
),
-- Patient 3: Mobil, keine besonderen Anforderungen
(
    'Ruth Schneider',
    'Lindenweg 8, 5430 Wettingen',
    47.4625,
    8.3228,
    '+41 56 426 78 90',
    NULL,
    'Augenarzt-Kontrollen alle 3 Monate. Notfall: Peter Schneider +41 79 456 78 90'
),
-- Patient 4: Rollstuhl, regelmässige Onkologie
(
    'Kurt Weber',
    'Römerstrasse 25, 5200 Brugg',
    47.4858,
    8.2082,
    '+41 56 222 11 33',
    'Rollstuhl, Begleitung nötig',
    'Chemotherapie-Termine. Oft müde nach Behandlung. Hintereingang benutzen, Rampe vorhanden. Notfall: Silvia Weber +41 79 222 11 34'
),
-- Patient 5: Leichte Mobilitätseinschränkung
(
    'Maria Huber',
    'Kirchplatz 3, 5600 Lenzburg',
    47.3884,
    8.1750,
    '+41 62 891 23 45',
    'Begleitung nötig',
    'Kardiologie-Kontrollen. Wohnung im 1. Stock, kein Lift. Braucht Zeit für Treppen. Notfall: Thomas Huber +41 79 891 23 46'
),
-- Patient 6: Stammpatient Dialyse
(
    'Fritz Steiner',
    'Industriestrasse 10, 5432 Neuenhof',
    47.4517,
    8.3194,
    '+41 56 441 55 66',
    'Rollator',
    'Dialyse Di/Do/Sa morgens. Bitte hupen, Patient kommt selbst raus. Notfall: Anna Steiner +41 79 441 55 67'
),
-- Patient 7: Rollstuhl, Wohnheim
(
    'Heidi Keller',
    'Altersheim Sonnenberg, Zimmer 204, 5413 Birmenstorf',
    47.4622,
    8.2525,
    '+41 56 203 44 55',
    'Rollstuhl, Begleitung nötig',
    'Bewohnerin Altersheim. Abholung an der Rezeption. Personal informiert. Notfall: Altersheim +41 56 203 44 00'
),
-- Patient 8: Mobiler Senior
(
    'Hans-Peter Zimmermann',
    'Dorfstrasse 55, 5034 Suhr',
    47.3722,
    8.0789,
    '+41 62 844 77 88',
    NULL,
    'Hausarzt-Termine und gelegentlich Spital. Notfall: Beatrice Zimmermann +41 79 844 77 89'
);

-- =============================================================================
-- DRIVERS (Fiktive Fahrer)
-- =============================================================================
-- Schema: id, user_id, name, phone, email

INSERT INTO drivers (
    name,
    phone,
    email
) VALUES
(
    'Marco Bernasconi',
    '+41 79 300 10 01',
    'm.bernasconi@example.com'
),
(
    'Sandra Frei',
    '+41 79 300 10 02',
    's.frei@example.com'
),
(
    'Thomas Gerber',
    '+41 79 300 10 03',
    't.gerber@example.com'
),
(
    'Nicole Bühler',
    '+41 79 300 10 04',
    'n.buehler@example.com'
);

-- =============================================================================
-- DESTINATIONS (Echte Spitäler/Praxen der Region)
-- =============================================================================
-- Schema: id, name, address, latitude, longitude, arrival_window_start, arrival_window_end

INSERT INTO destinations (
    name,
    address,
    latitude,
    longitude,
    arrival_window_start,
    arrival_window_end
) VALUES
(
    'Kantonsspital Baden',
    'Im Ergel 1, 5404 Baden',
    47.4689,
    8.3047,
    '06:00',
    '22:00'
),
(
    'Kantonsspital Baden - Dialyse',
    'Im Ergel 1, 5404 Baden (Eingang Ost, Ebene 2)',
    47.4689,
    8.3047,
    '06:00',
    '22:00'
),
(
    'Kantonsspital Baden - Onkologie',
    'Im Ergel 1, 5404 Baden (Eingang Süd, Ebene 1)',
    47.4689,
    8.3047,
    '07:30',
    '17:00'
),
(
    'Kantonsspital Aarau',
    'Tellstrasse 25, 5001 Aarau',
    47.3892,
    8.0503,
    '06:00',
    '22:00'
),
(
    'Augenzentrum Aarau',
    'Bahnhofstrasse 12, 5000 Aarau',
    47.3912,
    8.0511,
    '08:00',
    '17:00'
),
(
    'Physiotherapie am Bahnhof',
    'Bahnhofplatz 7, 5400 Baden',
    47.4763,
    8.3064,
    '07:00',
    '20:00'
),
(
    'Praxis Dr. med. A. Fischer',
    'Landstrasse 100, 5430 Wettingen',
    47.4608,
    8.3156,
    '08:00',
    '18:00'
),
(
    'Kardiologie Aarau',
    'Laurenzenvorstadt 90, 5000 Aarau',
    47.3928,
    8.0467,
    '08:00',
    '17:00'
);

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT 'Patients' as entity, COUNT(*) as count FROM patients
UNION ALL
SELECT 'Drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'Destinations', COUNT(*) FROM destinations;
