-- =============================================================================
-- MIGRATION: Extend simple schema to full schema
-- =============================================================================
-- Run this in Supabase SQL Editor to add missing columns needed by the app.
-- =============================================================================

-- =============================================================================
-- 1. ADD MISSING COLUMNS TO PATIENTS
-- =============================================================================

ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS needs_wheelchair BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS needs_walker BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS needs_assistance BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Migrate name -> first_name + last_name
UPDATE patients
SET
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = NULLIF(SUBSTRING(name FROM POSITION(' ' IN name) + 1), '')
WHERE name IS NOT NULL AND first_name IS NULL;

-- Migrate address -> street + postal_code + city
UPDATE patients
SET
  street = SPLIT_PART(address, ',', 1),
  postal_code = TRIM(SUBSTRING(SPLIT_PART(address, ',', 2) FROM 1 FOR 5)),
  city = TRIM(SUBSTRING(SPLIT_PART(address, ',', 2) FROM 6))
WHERE address IS NOT NULL AND street IS NULL;

-- Migrate special_needs -> boolean flags
UPDATE patients
SET
  needs_wheelchair = (LOWER(special_needs) LIKE '%rollstuhl%'),
  needs_walker = (LOWER(special_needs) LIKE '%rollator%'),
  needs_assistance = (LOWER(special_needs) LIKE '%begleitung%')
WHERE special_needs IS NOT NULL;

-- =============================================================================
-- 2. ADD MISSING COLUMNS TO DRIVERS
-- =============================================================================

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Migrate name -> first_name + last_name
UPDATE drivers
SET
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = NULLIF(SUBSTRING(name FROM POSITION(' ' IN name) + 1), '')
WHERE name IS NOT NULL AND first_name IS NULL;

-- =============================================================================
-- 3. ADD MISSING COLUMNS TO DESTINATIONS
-- =============================================================================

ALTER TABLE destinations ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS arrival_instructions TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Migrate address -> street + postal_code + city
UPDATE destinations
SET
  street = SPLIT_PART(address, ',', 1),
  postal_code = TRIM(SUBSTRING(SPLIT_PART(address, ',', 2) FROM 1 FOR 5)),
  city = TRIM(SUBSTRING(SPLIT_PART(address, ',', 2) FROM 6))
WHERE address IS NOT NULL AND street IS NULL;

-- =============================================================================
-- 4. VERIFICATION
-- =============================================================================

SELECT 'Patients' as table_name,
       COUNT(*) as total,
       COUNT(first_name) as with_first_name,
       COUNT(street) as with_street
FROM patients
UNION ALL
SELECT 'Drivers', COUNT(*), COUNT(first_name), 0
FROM drivers
UNION ALL
SELECT 'Destinations', COUNT(*), 0, COUNT(street)
FROM destinations;
