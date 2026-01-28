-- Migration: Master Data Schema for Fahrdienst App
-- Entities: Patient, Driver, Destination, Profile (for RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'operator', 'driver');
CREATE TYPE vehicle_type AS ENUM ('car', 'van', 'accessible_van');
CREATE TYPE destination_type AS ENUM ('hospital', 'doctor', 'therapy', 'other');

-- =============================================================================
-- PROFILES TABLE (for RLS role management)
-- =============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'driver',
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PATIENTS TABLE
-- =============================================================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    patient_number TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,

    -- Contact
    phone TEXT NOT NULL,
    email TEXT,

    -- Address
    street TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'CH',

    -- Geo (for mapping)
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    -- Pickup details
    pickup_instructions TEXT,

    -- Mobility / Assistance
    needs_wheelchair BOOLEAN NOT NULL DEFAULT FALSE,
    needs_walker BOOLEAN NOT NULL DEFAULT FALSE,
    needs_assistance BOOLEAN NOT NULL DEFAULT FALSE,

    -- Emergency contact
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,

    -- Administrative
    insurance TEXT,
    cost_center TEXT,
    notes TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- DRIVERS TABLE
-- =============================================================================

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Link to auth user (optional, for driver login)
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Identification
    driver_code TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    -- Contact
    phone TEXT NOT NULL,
    email TEXT,

    -- Home base
    home_city TEXT,
    home_street TEXT,
    home_postal_code TEXT,

    -- License & Vehicle
    has_driving_license BOOLEAN NOT NULL DEFAULT TRUE,
    vehicle_type vehicle_type NOT NULL DEFAULT 'car',
    vehicle_plate TEXT,

    -- Administrative
    notes TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- DESTINATIONS TABLE
-- =============================================================================

CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    external_id TEXT,
    name TEXT NOT NULL,
    destination_type destination_type NOT NULL DEFAULT 'other',
    department TEXT,

    -- Address
    street TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'CH',

    -- Geo (for mapping/routing)
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    -- Contact
    phone TEXT,
    email TEXT,

    -- Operations
    opening_hours TEXT,
    arrival_instructions TEXT,

    -- Administrative
    notes TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);

-- Patients
CREATE INDEX idx_patients_is_active ON patients(is_active);
CREATE INDEX idx_patients_last_name ON patients(last_name);
CREATE INDEX idx_patients_postal_code ON patients(postal_code);
CREATE INDEX idx_patients_patient_number ON patients(patient_number) WHERE patient_number IS NOT NULL;

-- Drivers
CREATE INDEX idx_drivers_is_active ON drivers(is_active);
CREATE INDEX idx_drivers_last_name ON drivers(last_name);
CREATE INDEX idx_drivers_user_id ON drivers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_drivers_vehicle_type ON drivers(vehicle_type);

-- Destinations
CREATE INDEX idx_destinations_is_active ON destinations(is_active);
CREATE INDEX idx_destinations_destination_type ON destinations(destination_type);
CREATE INDEX idx_destinations_postal_code ON destinations(postal_code);
CREATE INDEX idx_destinations_name ON destinations(name);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER destinations_updated_at
    BEFORE UPDATE ON destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin or operator
CREATE OR REPLACE FUNCTION is_admin_or_operator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== PROFILES POLICIES =====

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (get_user_role() = 'admin');

-- Only admins can update profiles
CREATE POLICY "Admins can update profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (get_user_role() = 'admin');

-- ===== PATIENTS POLICIES =====

-- Admin/Operator can read all patients
CREATE POLICY "Admin/Operator can read patients"
    ON patients FOR SELECT
    TO authenticated
    USING (is_admin_or_operator() AND is_active = TRUE);

-- Admin/Operator can insert patients
CREATE POLICY "Admin/Operator can insert patients"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_operator());

-- Admin/Operator can update patients
CREATE POLICY "Admin/Operator can update patients"
    ON patients FOR UPDATE
    TO authenticated
    USING (is_admin_or_operator());

-- ===== DRIVERS POLICIES =====

-- Admin/Operator can read all drivers
CREATE POLICY "Admin/Operator can read all drivers"
    ON drivers FOR SELECT
    TO authenticated
    USING (is_admin_or_operator() AND is_active = TRUE);

-- Drivers can read their own record
CREATE POLICY "Drivers can read own record"
    ON drivers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND is_active = TRUE);

-- Admin/Operator can insert drivers
CREATE POLICY "Admin/Operator can insert drivers"
    ON drivers FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_operator());

-- Admin/Operator can update drivers
CREATE POLICY "Admin/Operator can update drivers"
    ON drivers FOR UPDATE
    TO authenticated
    USING (is_admin_or_operator());

-- ===== DESTINATIONS POLICIES =====

-- All authenticated users can read active destinations
CREATE POLICY "Authenticated users can read destinations"
    ON destinations FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Admin/Operator can insert destinations
CREATE POLICY "Admin/Operator can insert destinations"
    ON destinations FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_operator());

-- Admin/Operator can update destinations
CREATE POLICY "Admin/Operator can update destinations"
    ON destinations FOR UPDATE
    TO authenticated
    USING (is_admin_or_operator());

-- =============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, role, display_name)
    VALUES (
        NEW.id,
        'driver',  -- Default role
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
