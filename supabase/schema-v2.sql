-- =============================================================================
-- FAHRDIENST DATABASE SCHEMA V2
-- =============================================================================
-- This file contains the complete database schema for the Fahrdienst application.
-- Run this in Supabase SQL Editor to set up the database.
--
-- IMPORTANT: This extends the original schema.sql with:
-- - profiles table for user roles
-- - Extended patients/drivers/destinations tables with new fields
-- - Additional indexes and constraints
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'operator', 'driver');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Vehicle types
DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('car', 'van', 'accessible_van');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Destination types
DO $$ BEGIN
    CREATE TYPE destination_type AS ENUM ('hospital', 'doctor', 'therapy', 'other');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ride status
DO $$ BEGIN
    CREATE TYPE ride_status AS ENUM ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ride substatus (for in_progress tracking)
DO $$ BEGIN
    CREATE TYPE ride_substatus AS ENUM ('waiting', 'en_route_pickup', 'at_pickup', 'en_route_destination', 'at_destination', 'completed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Weekday
DO $$ BEGIN
    CREATE TYPE weekday AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- PROFILES TABLE (linked to auth.users)
-- =============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'driver',
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PATIENTS TABLE (V2 - Extended fields)
-- =============================================================================

-- Add new columns if they don't exist
DO $$ BEGIN
    -- Add patient_number column
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_number TEXT;

    -- Split name into first_name, last_name
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name TEXT;

    -- Add date_of_birth
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;

    -- Add email
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS email TEXT;

    -- Split address into components
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS street TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS postal_code TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CH';

    -- Add pickup_instructions
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;

    -- Add special needs flags
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS needs_wheelchair BOOLEAN DEFAULT FALSE;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS needs_walker BOOLEAN DEFAULT FALSE;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS needs_assistance BOOLEAN DEFAULT FALSE;

    -- Add emergency contact
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

    -- Add insurance info
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS cost_center TEXT;

    -- Add soft delete
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- =============================================================================
-- DRIVERS TABLE (V2 - Extended fields)
-- =============================================================================

DO $$ BEGIN
    -- Add driver_code
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_code TEXT;

    -- Split name into first_name, last_name
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_name TEXT;

    -- Add home address fields
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS home_street TEXT;
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS home_postal_code TEXT;
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS home_city TEXT;

    -- Add license info
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS has_driving_license BOOLEAN DEFAULT TRUE;

    -- Add vehicle info
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_type vehicle_type DEFAULT 'car';
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;

    -- Add notes
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS notes TEXT;

    -- Add soft delete
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- =============================================================================
-- DESTINATIONS TABLE (V2 - Extended fields)
-- =============================================================================

DO $$ BEGIN
    -- Add external_id for integration
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS external_id TEXT;

    -- Add destination type
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS destination_type destination_type DEFAULT 'other';

    -- Add department
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS department TEXT;

    -- Split address into components
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS street TEXT;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS postal_code TEXT;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CH';

    -- Add contact info
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS email TEXT;

    -- Add opening hours
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS opening_hours TEXT;

    -- Add arrival instructions
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS arrival_instructions TEXT;

    -- Add notes
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS notes TEXT;

    -- Add soft delete
    ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- =============================================================================
-- RIDES TABLE (V2 - Extended fields for Sprint 4)
-- =============================================================================

DO $$ BEGIN
    -- Add substatus for detailed tracking
    ALTER TABLE rides ADD COLUMN IF NOT EXISTS substatus ride_substatus;

    -- Add execution timestamps
    ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE rides ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE rides ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE rides ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

    -- Add notes
    ALTER TABLE rides ADD COLUMN IF NOT EXISTS notes TEXT;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number) WHERE patient_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_last_name ON patients(last_name);

-- Drivers indexes
CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_last_name ON drivers(last_name);
CREATE INDEX IF NOT EXISTS idx_drivers_driver_code ON drivers(driver_code) WHERE driver_code IS NOT NULL;

-- Destinations indexes
CREATE INDEX IF NOT EXISTS idx_destinations_active ON destinations(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_destinations_type ON destinations(destination_type);

-- Rides indexes (additional)
CREATE INDEX IF NOT EXISTS idx_rides_substatus ON rides(substatus) WHERE substatus IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rides_active ON rides(status) WHERE status NOT IN ('completed', 'cancelled');

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles trigger
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- MIGRATION: Copy data from old columns to new columns
-- =============================================================================

-- Migrate patient names (if name column exists but first_name is empty)
DO $$ BEGIN
    UPDATE patients
    SET
        first_name = SPLIT_PART(name, ' ', 1),
        last_name = SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    WHERE
        name IS NOT NULL
        AND (first_name IS NULL OR first_name = '');
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;

-- Migrate patient addresses
DO $$ BEGIN
    UPDATE patients
    SET
        street = SPLIT_PART(address, ',', 1),
        city = TRIM(SPLIT_PART(address, ',', 2))
    WHERE
        address IS NOT NULL
        AND (street IS NULL OR street = '');
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;

-- Migrate driver names
DO $$ BEGIN
    UPDATE drivers
    SET
        first_name = SPLIT_PART(name, ' ', 1),
        last_name = SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    WHERE
        name IS NOT NULL
        AND (first_name IS NULL OR first_name = '');
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;

-- Migrate destination addresses
DO $$ BEGIN
    UPDATE destinations
    SET
        street = SPLIT_PART(address, ',', 1),
        city = TRIM(SPLIT_PART(address, ',', 2))
    WHERE
        address IS NOT NULL
        AND (street IS NULL OR street = '');
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;

-- =============================================================================
-- ADD NOT NULL CONSTRAINTS AFTER MIGRATION
-- =============================================================================

-- These would need to be run after data migration is complete
-- ALTER TABLE patients ALTER COLUMN first_name SET NOT NULL;
-- ALTER TABLE patients ALTER COLUMN last_name SET NOT NULL;
-- ALTER TABLE drivers ALTER COLUMN first_name SET NOT NULL;
-- ALTER TABLE drivers ALTER COLUMN last_name SET NOT NULL;
