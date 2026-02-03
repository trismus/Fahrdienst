-- =============================================================================
-- FAHRDIENST: Complete Database Initialization
-- =============================================================================
-- This script initializes a fresh Supabase database from scratch.
-- It performs the following steps:
--
--   PART A: Clean slate (drop all existing objects)
--   PART B: Create schema (from consolidated-schema.sql)
--   PART C: Seed test data (patients, drivers, destinations)
--   PART D: Configure demo users (profiles + driver linkage)
--
-- PREREQUISITES:
--   1. Create two users in Supabase Auth Dashboard:
--      - dispatcher@demo.fahrdienst.ch
--      - fahrer@demo.fahrdienst.ch
--   2. Copy their User IDs
--   3. Replace the placeholder UUIDs in PART D (search for "REPLACE_ME")
--   4. Run this entire script in the Supabase SQL Editor
--
-- WARNING: This script DROPS ALL EXISTING DATA! Only use for fresh setup.
--
-- Generated: 2026-02-03
-- =============================================================================


-- #############################################################################
-- PART A: CLEAN SLATE
-- #############################################################################

-- Drop views
DROP VIEW IF EXISTS active_rides_view CASCADE;

-- Drop triggers (must happen before functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS patients_updated_at ON patients;
DROP TRIGGER IF EXISTS drivers_updated_at ON drivers;
DROP TRIGGER IF EXISTS destinations_updated_at ON destinations;
DROP TRIGGER IF EXISTS rides_updated_at ON rides;
DROP TRIGGER IF EXISTS availability_blocks_updated_at ON availability_blocks;
DROP TRIGGER IF EXISTS absences_updated_at ON absences;
DROP TRIGGER IF EXISTS audit_patients ON patients;
DROP TRIGGER IF EXISTS audit_drivers ON drivers;
DROP TRIGGER IF EXISTS audit_destinations ON destinations;
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
DROP TRIGGER IF EXISTS prevent_self_role_change ON profiles;
DROP TRIGGER IF EXISTS enforce_default_role_on_insert ON profiles;
DROP TRIGGER IF EXISTS ensure_admin_exists ON profiles;
DROP TRIGGER IF EXISTS restrict_driver_user_linking ON drivers;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS application_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS absences CASCADE;
DROP TABLE IF EXISTS availability_blocks CASCADE;
DROP TABLE IF EXISTS rides CASCADE;
DROP TABLE IF EXISTS destinations CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_operator() CASCADE;
DROP FUNCTION IF EXISTS is_dispatcher() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS get_driver_id() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS audit_log_changes() CASCADE;
DROP FUNCTION IF EXISTS prevent_self_role_change() CASCADE;
DROP FUNCTION IF EXISTS enforce_default_role_on_insert() CASCADE;
DROP FUNCTION IF EXISTS ensure_admin_exists() CASCADE;
DROP FUNCTION IF EXISTS restrict_driver_user_linking() CASCADE;
DROP FUNCTION IF EXISTS get_audit_history(TEXT, UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS get_user_audit_trail(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) CASCADE;
DROP FUNCTION IF EXISTS purge_old_audit_logs(INT) CASCADE;
DROP FUNCTION IF EXISTS check_driver_availability(UUID, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS calculate_ride_duration(UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_application_logs() CASCADE;
DROP FUNCTION IF EXISTS get_log_stats() CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS log_level CASCADE;
DROP TYPE IF EXISTS ride_substatus CASCADE;
DROP TYPE IF EXISTS weekday CASCADE;
DROP TYPE IF EXISTS ride_status CASCADE;
DROP TYPE IF EXISTS destination_type CASCADE;
DROP TYPE IF EXISTS vehicle_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;


-- #############################################################################
-- PART B: CREATE SCHEMA
-- #############################################################################
-- (Consolidated from all migrations 001-010 + security fixes + RLS overhaul)

-- =============================================================================
-- B.1 EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- B.2 ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'operator', 'driver');
CREATE TYPE vehicle_type AS ENUM ('car', 'van', 'accessible_van');
CREATE TYPE destination_type AS ENUM ('hospital', 'doctor', 'therapy', 'other');
CREATE TYPE ride_status AS ENUM ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE weekday AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');
CREATE TYPE ride_substatus AS ENUM ('waiting', 'en_route_pickup', 'at_pickup', 'en_route_destination', 'at_destination', 'completed');
CREATE TYPE log_level AS ENUM ('info', 'warn', 'error');

-- =============================================================================
-- B.3 TABLES
-- =============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'driver',
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_number TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    phone TEXT NOT NULL,
    email TEXT,
    street TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'CH',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    pickup_instructions TEXT,
    needs_wheelchair BOOLEAN NOT NULL DEFAULT FALSE,
    needs_walker BOOLEAN NOT NULL DEFAULT FALSE,
    needs_assistance BOOLEAN NOT NULL DEFAULT FALSE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    insurance TEXT,
    cost_center TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    driver_code TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    home_city TEXT,
    home_street TEXT,
    home_postal_code TEXT,
    has_driving_license BOOLEAN NOT NULL DEFAULT TRUE,
    vehicle_type vehicle_type NOT NULL DEFAULT 'car',
    vehicle_plate TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT,
    name TEXT NOT NULL,
    destination_type destination_type NOT NULL DEFAULT 'other',
    department TEXT,
    street TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'CH',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone TEXT,
    email TEXT,
    opening_hours TEXT,
    arrival_instructions TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
    pickup_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    return_time TIMESTAMPTZ,
    status ride_status NOT NULL DEFAULT 'planned',
    substatus ride_substatus DEFAULT 'waiting',
    recurrence_group UUID,
    estimated_duration INTEGER,
    estimated_distance NUMERIC(10,2),
    started_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_times CHECK (arrival_time >= pickup_time),
    CONSTRAINT valid_return_time CHECK (return_time IS NULL OR return_time > arrival_time),
    CONSTRAINT valid_execution_timestamps CHECK (
        (started_at IS NULL OR picked_up_at IS NULL OR started_at <= picked_up_at)
        AND (picked_up_at IS NULL OR arrived_at IS NULL OR picked_up_at <= arrived_at)
        AND (arrived_at IS NULL OR completed_at IS NULL OR arrived_at <= completed_at)
        AND (started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at)
    )
);

CREATE TABLE availability_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    weekday weekday NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_block_times CHECK (end_time > start_time),
    CONSTRAINT unique_driver_weekday_time UNIQUE (driver_id, weekday, start_time)
);

CREATE TABLE absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_absence_dates CHECK (to_date >= from_date)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    record_id UUID,
    user_id UUID REFERENCES auth.users(id),
    user_role TEXT,
    ip_address INET,
    user_agent TEXT,
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    request_id UUID,
    session_id UUID,
    notes TEXT
);

CREATE TABLE application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level log_level NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    source TEXT,
    route TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    request_id TEXT,
    feature TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    CONSTRAINT message_not_empty CHECK (length(trim(message)) > 0),
    CONSTRAINT metadata_is_object CHECK (jsonb_typeof(metadata) = 'object')
);

-- =============================================================================
-- B.4 INDEXES
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

-- Rides
CREATE INDEX idx_rides_patient_id ON rides(patient_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_destination_id ON rides(destination_id);
CREATE INDEX idx_rides_pickup_time ON rides(pickup_time);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_recurrence_group ON rides(recurrence_group) WHERE recurrence_group IS NOT NULL;
-- Note: DATE(pickup_time) index removed - not IMMUTABLE on TIMESTAMPTZ.
-- Use idx_rides_pickup_time and idx_rides_pickup_status for date range queries.
CREATE INDEX idx_rides_started_at ON rides(started_at) WHERE started_at IS NOT NULL AND completed_at IS NULL;
CREATE INDEX idx_rides_completed_at ON rides(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_rides_driver_status ON rides(driver_id, status);
CREATE INDEX idx_rides_pickup_status ON rides(pickup_time, status);

-- Availability blocks
CREATE INDEX idx_availability_driver_id ON availability_blocks(driver_id);
CREATE INDEX idx_availability_weekday ON availability_blocks(weekday);
CREATE INDEX idx_availability_driver_weekday ON availability_blocks(driver_id, weekday);

-- Absences
CREATE INDEX idx_absences_driver_id ON absences(driver_id);
CREATE INDEX idx_absences_dates ON absences(from_date, to_date);
CREATE INDEX idx_absences_driver_dates ON absences(driver_id, from_date, to_date);

-- Audit logs
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_compliance ON audit_logs(table_name, record_id, created_at DESC);

-- Application logs
CREATE INDEX idx_logs_created_at ON application_logs(created_at DESC);
CREATE INDEX idx_logs_level ON application_logs(level);
CREATE INDEX idx_logs_level_created_at ON application_logs(level, created_at DESC);
CREATE INDEX idx_logs_source ON application_logs(source) WHERE source IS NOT NULL;
CREATE INDEX idx_logs_route ON application_logs(route) WHERE route IS NOT NULL;
CREATE INDEX idx_logs_user_id ON application_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_logs_request_id ON application_logs(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_logs_feature ON application_logs(feature) WHERE feature IS NOT NULL;

-- =============================================================================
-- B.5 FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
    RETURN COALESCE(v_role, 'driver');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_operator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_dispatcher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_driver_id()
RETURNS UUID AS $$
DECLARE
    driver_uuid UUID;
BEGIN
    SELECT id INTO driver_uuid FROM drivers WHERE user_id = auth.uid() LIMIT 1;
    RETURN driver_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup (always 'driver' role)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, role, display_name)
    VALUES (NEW.id, 'driver', COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB := NULL;
    new_data JSONB := NULL;
    changed TEXT[] := '{}';
    col TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action, table_name, record_id, user_id, user_role, old_data, new_data, changed_fields)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, auth.uid(),
                (SELECT role FROM profiles WHERE id = auth.uid()),
                to_jsonb(OLD), NULL, changed);
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        FOR col IN SELECT column_name FROM information_schema.columns
                   WHERE table_name = TG_TABLE_NAME AND column_name NOT IN ('updated_at', 'created_at')
        LOOP
            IF old_data->col IS DISTINCT FROM new_data->col THEN
                changed := array_append(changed, col);
            END IF;
        END LOOP;

        IF array_length(changed, 1) > 0 THEN
            INSERT INTO audit_logs (action, table_name, record_id, user_id, user_role, old_data, new_data, changed_fields)
            VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, auth.uid(),
                    (SELECT role FROM profiles WHERE id = auth.uid()),
                    old_data, new_data, changed);
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action, table_name, record_id, user_id, user_role, old_data, new_data, changed_fields)
        VALUES ('INSERT', TG_TABLE_NAME, NEW.id, auth.uid(),
                (SELECT role FROM profiles WHERE id = auth.uid()),
                NULL, to_jsonb(NEW), changed);
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Privilege escalation prevention
CREATE OR REPLACE FUNCTION prevent_self_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id = auth.uid() AND OLD.role IS DISTINCT FROM NEW.role THEN
        RAISE EXCEPTION 'Users cannot modify their own role. Please contact an administrator.';
    END IF;
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
            RAISE EXCEPTION 'Only administrators can change user roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION enforce_default_role_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role != 'driver' THEN
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
            NEW.role := 'driver';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION ensure_admin_exists()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin' THEN
        SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin' AND id != OLD.id;
        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot remove the last administrator. Promote another user to admin first.';
        END IF;
    END IF;
    IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
        SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin' AND id != OLD.id;
        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot delete the last administrator account.';
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION restrict_driver_user_linking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
            RAISE EXCEPTION 'Only administrators can link user accounts to driver profiles.';
        END IF;
        IF EXISTS (SELECT 1 FROM drivers WHERE user_id = NEW.user_id AND id != NEW.id) THEN
            RAISE EXCEPTION 'This user account is already linked to another driver profile.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit query helpers
CREATE OR REPLACE FUNCTION get_audit_history(p_table_name TEXT, p_record_id UUID, p_limit INT DEFAULT 100)
RETURNS TABLE (action TEXT, changed_fields TEXT[], user_id UUID, user_role TEXT, created_at TIMESTAMPTZ, old_data JSONB, new_data JSONB) AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Only admins can view audit logs';
    END IF;
    RETURN QUERY
    SELECT al.action, al.changed_fields, al.user_id, al.user_role, al.created_at, al.old_data, al.new_data
    FROM audit_logs al WHERE al.table_name = p_table_name AND al.record_id = p_record_id
    ORDER BY al.created_at DESC LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_audit_trail(p_user_id UUID, p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days', p_end_date TIMESTAMPTZ DEFAULT NOW(), p_limit INT DEFAULT 1000)
RETURNS TABLE (action TEXT, table_name TEXT, record_id UUID, changed_fields TEXT[], created_at TIMESTAMPTZ) AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Only admins can view audit logs';
    END IF;
    RETURN QUERY
    SELECT al.action, al.table_name, al.record_id, al.changed_fields, al.created_at
    FROM audit_logs al WHERE al.user_id = p_user_id AND al.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY al.created_at DESC LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION purge_old_audit_logs(retention_years INT DEFAULT 7)
RETURNS INT AS $$
DECLARE deleted_count INT;
BEGIN
    DELETE FROM audit_logs WHERE created_at < NOW() - (retention_years || ' years')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION purge_old_audit_logs FROM PUBLIC;
GRANT EXECUTE ON FUNCTION purge_old_audit_logs TO service_role;

-- Driver availability check
CREATE OR REPLACE FUNCTION check_driver_availability(p_driver_id UUID, p_pickup_time TIMESTAMPTZ)
RETURNS TABLE (is_available BOOLEAN, has_availability_block BOOLEAN, is_absent BOOLEAN, has_overlapping_ride BOOLEAN, overlapping_ride_id UUID) AS $$
DECLARE
    v_weekday weekday;
    v_time TIME;
    v_date DATE;
BEGIN
    v_date := p_pickup_time::DATE;
    v_time := p_pickup_time::TIME;
    v_weekday := LOWER(TO_CHAR(p_pickup_time, 'Day'))::weekday;

    SELECT EXISTS (SELECT 1 FROM availability_blocks ab WHERE ab.driver_id = p_driver_id AND ab.weekday = v_weekday AND ab.start_time <= v_time AND ab.end_time > v_time) INTO has_availability_block;
    SELECT EXISTS (SELECT 1 FROM absences a WHERE a.driver_id = p_driver_id AND a.from_date <= v_date AND a.to_date >= v_date) INTO is_absent;
    SELECT EXISTS (SELECT 1 FROM rides r WHERE r.driver_id = p_driver_id AND r.status NOT IN ('cancelled', 'completed') AND ABS(EXTRACT(EPOCH FROM (r.pickup_time - p_pickup_time)) / 60) < 60) INTO has_overlapping_ride;
    SELECT r.id INTO overlapping_ride_id FROM rides r WHERE r.driver_id = p_driver_id AND r.status NOT IN ('cancelled', 'completed') AND ABS(EXTRACT(EPOCH FROM (r.pickup_time - p_pickup_time)) / 60) < 60 LIMIT 1;

    is_available := has_availability_block AND NOT is_absent AND NOT has_overlapping_ride;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ride duration calculation
CREATE OR REPLACE FUNCTION calculate_ride_duration(ride_id UUID)
RETURNS TABLE (total_duration_minutes INTEGER, pickup_duration_minutes INTEGER, transport_duration_minutes INTEGER, waiting_duration_minutes INTEGER) AS $$
DECLARE r rides%ROWTYPE;
BEGIN
    SELECT * INTO r FROM rides WHERE id = ride_id;
    IF r IS NULL THEN RETURN; END IF;
    IF r.started_at IS NOT NULL AND r.completed_at IS NOT NULL THEN total_duration_minutes := EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) / 60; END IF;
    IF r.started_at IS NOT NULL AND r.picked_up_at IS NOT NULL THEN pickup_duration_minutes := EXTRACT(EPOCH FROM (r.picked_up_at - r.started_at)) / 60; END IF;
    IF r.picked_up_at IS NOT NULL AND r.arrived_at IS NOT NULL THEN transport_duration_minutes := EXTRACT(EPOCH FROM (r.arrived_at - r.picked_up_at)) / 60; END IF;
    IF r.arrived_at IS NOT NULL AND r.completed_at IS NOT NULL THEN waiting_duration_minutes := EXTRACT(EPOCH FROM (r.completed_at - r.arrived_at)) / 60; END IF;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Application log cleanup
CREATE OR REPLACE FUNCTION cleanup_application_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    total_count INTEGER;
    excess_count INTEGER;
BEGIN
    DELETE FROM application_logs WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    SELECT COUNT(*) INTO total_count FROM application_logs;
    IF total_count > 10000 THEN
        excess_count := total_count - 10000;
        DELETE FROM application_logs WHERE id IN (SELECT id FROM application_logs ORDER BY created_at ASC LIMIT excess_count);
        GET DIAGNOSTICS excess_count = ROW_COUNT;
        deleted_count := deleted_count + excess_count;
    END IF;

    IF deleted_count > 0 THEN
        INSERT INTO application_logs (level, message, source, metadata)
        VALUES ('info', 'Log cleanup completed', 'database', jsonb_build_object('deleted_count', deleted_count, 'trigger', 'scheduled_cleanup'));
    END IF;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log stats
CREATE OR REPLACE FUNCTION get_log_stats()
RETURNS TABLE (total_count BIGINT, error_count BIGINT, warn_count BIGINT, info_count BIGINT, oldest_log TIMESTAMPTZ, newest_log TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(*)::BIGINT, COUNT(*) FILTER (WHERE level = 'error')::BIGINT, COUNT(*) FILTER (WHERE level = 'warn')::BIGINT, COUNT(*) FILTER (WHERE level = 'info')::BIGINT, MIN(created_at), MAX(created_at) FROM application_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- B.6 TRIGGERS
-- =============================================================================

-- Updated_at
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER destinations_updated_at BEFORE UPDATE ON destinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER availability_blocks_updated_at BEFORE UPDATE ON availability_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER absences_updated_at BEFORE UPDATE ON absences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Audit triggers
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON patients FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
CREATE TRIGGER audit_drivers AFTER INSERT OR UPDATE OR DELETE ON drivers FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
CREATE TRIGGER audit_destinations AFTER INSERT OR UPDATE OR DELETE ON destinations FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Privilege escalation prevention
CREATE TRIGGER prevent_self_role_change BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION prevent_self_role_change();
CREATE TRIGGER enforce_default_role_on_insert BEFORE INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION enforce_default_role_on_insert();
CREATE TRIGGER ensure_admin_exists BEFORE UPDATE OR DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION ensure_admin_exists();

-- Driver-user linking restriction
CREATE TRIGGER restrict_driver_user_linking BEFORE INSERT OR UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION restrict_driver_user_linking();

-- =============================================================================
-- B.7 ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "System can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Patients
CREATE POLICY "Dispatchers can read patients" ON patients FOR SELECT TO authenticated USING (is_dispatcher());
CREATE POLICY "Drivers can read their patients" ON patients FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM rides WHERE rides.patient_id = patients.id AND rides.driver_id = get_driver_id() AND rides.status IN ('planned', 'confirmed', 'in_progress')));
CREATE POLICY "Dispatchers can create patients" ON patients FOR INSERT TO authenticated WITH CHECK (is_dispatcher());
CREATE POLICY "Dispatchers can update patients" ON patients FOR UPDATE TO authenticated USING (is_dispatcher()) WITH CHECK (is_dispatcher());
CREATE POLICY "Dispatchers can delete patients" ON patients FOR DELETE TO authenticated USING (is_dispatcher());

-- Drivers
CREATE POLICY "Dispatchers can read drivers" ON drivers FOR SELECT TO authenticated USING (is_dispatcher());
CREATE POLICY "Drivers can read own record" ON drivers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Dispatchers can create drivers" ON drivers FOR INSERT TO authenticated WITH CHECK (is_dispatcher());
CREATE POLICY "Dispatchers can update drivers" ON drivers FOR UPDATE TO authenticated USING (is_dispatcher()) WITH CHECK (is_dispatcher());
CREATE POLICY "Drivers can update own contact info" ON drivers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Dispatchers can delete drivers" ON drivers FOR DELETE TO authenticated USING (is_dispatcher());

-- Destinations
CREATE POLICY "Authenticated users can read destinations" ON destinations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Dispatchers can create destinations" ON destinations FOR INSERT TO authenticated WITH CHECK (is_dispatcher());
CREATE POLICY "Dispatchers can update destinations" ON destinations FOR UPDATE TO authenticated USING (is_dispatcher()) WITH CHECK (is_dispatcher());
CREATE POLICY "Dispatchers can delete destinations" ON destinations FOR DELETE TO authenticated USING (is_dispatcher());

-- Rides
CREATE POLICY "Dispatchers can read rides" ON rides FOR SELECT TO authenticated USING (is_dispatcher());
CREATE POLICY "Drivers can read own rides" ON rides FOR SELECT TO authenticated USING (driver_id = get_driver_id());
CREATE POLICY "Dispatchers can create rides" ON rides FOR INSERT TO authenticated WITH CHECK (is_dispatcher());
CREATE POLICY "Dispatchers can update rides" ON rides FOR UPDATE TO authenticated USING (is_dispatcher()) WITH CHECK (is_dispatcher());
CREATE POLICY "Drivers can update own rides" ON rides FOR UPDATE TO authenticated USING (driver_id = get_driver_id()) WITH CHECK (driver_id = get_driver_id());
CREATE POLICY "Dispatchers can delete rides" ON rides FOR DELETE TO authenticated USING (is_dispatcher());

-- Availability blocks
CREATE POLICY "Dispatchers can read availability" ON availability_blocks FOR SELECT TO authenticated USING (is_dispatcher());
CREATE POLICY "Drivers can read own availability" ON availability_blocks FOR SELECT TO authenticated USING (driver_id = get_driver_id());
CREATE POLICY "Dispatchers can create availability" ON availability_blocks FOR INSERT TO authenticated WITH CHECK (is_dispatcher());
CREATE POLICY "Drivers can create own availability" ON availability_blocks FOR INSERT TO authenticated WITH CHECK (driver_id = get_driver_id());
CREATE POLICY "Dispatchers can update availability" ON availability_blocks FOR UPDATE TO authenticated USING (is_dispatcher()) WITH CHECK (is_dispatcher());
CREATE POLICY "Drivers can update own availability" ON availability_blocks FOR UPDATE TO authenticated USING (driver_id = get_driver_id()) WITH CHECK (driver_id = get_driver_id());
CREATE POLICY "Dispatchers can delete availability" ON availability_blocks FOR DELETE TO authenticated USING (is_dispatcher());
CREATE POLICY "Drivers can delete own availability" ON availability_blocks FOR DELETE TO authenticated USING (driver_id = get_driver_id());

-- Absences
CREATE POLICY "Dispatchers can read absences" ON absences FOR SELECT TO authenticated USING (is_dispatcher());
CREATE POLICY "Drivers can read own absences" ON absences FOR SELECT TO authenticated USING (driver_id = get_driver_id());
CREATE POLICY "Dispatchers can create absences" ON absences FOR INSERT TO authenticated WITH CHECK (is_dispatcher());
CREATE POLICY "Drivers can create own absences" ON absences FOR INSERT TO authenticated WITH CHECK (driver_id = get_driver_id());
CREATE POLICY "Dispatchers can update absences" ON absences FOR UPDATE TO authenticated USING (is_dispatcher()) WITH CHECK (is_dispatcher());
CREATE POLICY "Drivers can update own absences" ON absences FOR UPDATE TO authenticated USING (driver_id = get_driver_id()) WITH CHECK (driver_id = get_driver_id());
CREATE POLICY "Dispatchers can delete absences" ON absences FOR DELETE TO authenticated USING (is_dispatcher());
CREATE POLICY "Drivers can delete own absences" ON absences FOR DELETE TO authenticated USING (driver_id = get_driver_id());

-- Audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Service role can insert audit logs" ON audit_logs FOR INSERT TO service_role WITH CHECK (true);

-- Application logs
CREATE POLICY "Only admins can read logs" ON application_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Service role can insert logs" ON application_logs FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Authenticated users can insert logs" ON application_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- B.8 VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW active_rides_view AS
SELECT
    r.id, r.patient_id, r.driver_id, r.destination_id,
    r.pickup_time, r.arrival_time, r.status, r.substatus,
    r.started_at, r.picked_up_at, r.arrived_at, r.updated_at,
    CASE
        WHEN r.substatus = 'en_route_pickup' THEN r.pickup_time + (r.estimated_duration || ' minutes')::INTERVAL
        WHEN r.substatus = 'en_route_destination' THEN r.arrival_time
        ELSE NULL
    END as eta,
    d.first_name as driver_first_name, d.last_name as driver_last_name, d.phone as driver_phone,
    p.first_name as patient_first_name, p.last_name as patient_last_name, p.phone as patient_phone,
    dest.name as destination_name
FROM rides r
LEFT JOIN drivers d ON r.driver_id = d.id
LEFT JOIN patients p ON r.patient_id = p.id
LEFT JOIN destinations dest ON r.destination_id = dest.id
WHERE r.status IN ('confirmed', 'in_progress') AND r.pickup_time::DATE = CURRENT_DATE
ORDER BY r.pickup_time;

GRANT SELECT ON active_rides_view TO authenticated;

-- =============================================================================
-- B.9 PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_operator() TO authenticated;
GRANT EXECUTE ON FUNCTION is_dispatcher() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_id() TO authenticated;

-- =============================================================================
-- B.10 COMMENTS
-- =============================================================================

COMMENT ON TABLE profiles IS 'User profiles with role-based access control. RLS enabled.';
COMMENT ON TABLE patients IS 'Patient master data. Soft delete via is_active.';
COMMENT ON TABLE drivers IS 'Driver master data. Soft delete via is_active.';
COMMENT ON TABLE destinations IS 'Destination master data. Soft delete via is_active.';
COMMENT ON TABLE rides IS 'Ride records with full execution lifecycle tracking.';
COMMENT ON TABLE availability_blocks IS 'Driver availability schedules (Mon-Fri, 2h blocks).';
COMMENT ON TABLE absences IS 'Driver absence records with date ranges.';
COMMENT ON TABLE audit_logs IS 'Immutable GDPR/FADP audit trail.';
COMMENT ON TABLE application_logs IS 'Centralized application logging with 30d retention.';


-- #############################################################################
-- PART C: SEED TEST DATA
-- #############################################################################

-- =============================================================================
-- C.1 TEST PATIENTS
-- =============================================================================

INSERT INTO patients (patient_number, first_name, last_name, date_of_birth, phone, email, street, postal_code, city, country, latitude, longitude, pickup_instructions, needs_wheelchair, needs_walker, needs_assistance, emergency_contact_name, emergency_contact_phone, insurance, notes)
VALUES
('TEST-PAT-001', 'Heidi', 'Testperson', '1945-01-01', '+41 79 000 00 01', 'heidi.test@example.invalid', 'Teststrasse 1', '0001', 'Testdorf', 'CH', 47.0000, 8.0000, '[TEST] Fiktive Abhol-Anweisungen', FALSE, TRUE, TRUE, 'Peter Testperson', '+41 79 000 00 02', 'Test-Versicherung', '[TEST DATA] Fiktiver Testpatient'),
('TEST-PAT-002', 'Wilhelm', 'Beispiel', '1950-06-15', '+41 76 000 00 03', NULL, 'Musterweg 42', '0002', 'Musterstadt', 'CH', 47.1000, 8.1000, '[TEST] Rollstuhlrampe - TESTDATEN', TRUE, FALSE, TRUE, 'Klara Beispiel', '+41 76 000 00 04', 'Muster-Krankenkasse', '[TEST DATA] Fiktiver Dialyse-Patient'),
('TEST-PAT-003', 'Max', 'Mustermann', '1938-12-31', '+41 78 000 00 05', 'max.mustermann@example.invalid', 'Beispielgasse 99', '0003', 'Demoville', 'CH', 47.2000, 8.2000, NULL, FALSE, FALSE, FALSE, 'Erika Mustermann', '+41 78 000 00 06', 'Demo-Versicherung', '[TEST DATA] Standard-Testpatient ohne spezielle Anforderungen'),
('TEST-PAT-004', 'Anna', 'Testerin', '1960-03-20', '+41 79 000 00 07', 'anna.test@example.invalid', 'Fakestrasse 123', '0004', 'Fiktivhausen', 'CH', 47.3000, 8.3000, '[TEST] Erdgeschoss - TESTDATEN', FALSE, TRUE, FALSE, NULL, NULL, 'Fake-Insurance AG', '[TEST DATA] Testpatientin mit Rollator'),
('TEST-PAT-005', 'Otto', 'Platzhalter', '1949-09-09', '+41 76 000 00 08', NULL, 'Dummyweg 7', '0005', 'Placeholder', 'CH', 47.4000, 8.4000, '[TEST] Gelbes Testhaus', TRUE, FALSE, TRUE, 'Greta Platzhalter', '+41 76 000 00 09', 'Placeholder-Kasse', '[TEST DATA] Rollstuhl erforderlich - TESTDATEN');

-- =============================================================================
-- C.2 TEST DRIVERS
-- =============================================================================

INSERT INTO drivers (driver_code, first_name, last_name, phone, email, home_city, home_street, home_postal_code, has_driving_license, vehicle_type, vehicle_plate, notes)
VALUES
('TEST-DRV-01', 'Fahrer', 'Eins', '+41 79 000 00 10', 'fahrer1@example.invalid', 'Testdorf', 'Teststrasse 10', '0001', TRUE, 'accessible_van', 'XX 000001', '[TEST] Testfahrer mit Rollstuhltransport-Erfahrung'),
('TEST-DRV-02', 'Fahrerin', 'Zwei', '+41 76 000 00 11', 'fahrer2@example.invalid', 'Musterstadt', 'Musterplatz 5', '0002', TRUE, 'car', 'XX 000002', '[TEST] Standard-Testfahrerin'),
('TEST-DRV-03', 'Test', 'Driver', '+41 78 000 00 12', 'testdriver@example.invalid', 'Demoville', 'Demostrasse 3', '0003', TRUE, 'van', 'XX 000003', '[TEST] Testfahrer - DEVELOPMENT ONLY');

-- =============================================================================
-- C.3 TEST DESTINATIONS
-- =============================================================================

INSERT INTO destinations (name, destination_type, department, street, postal_code, city, country, latitude, longitude, phone, email, opening_hours, arrival_instructions, notes)
VALUES
('[TEST] Musterspital Teststadt', 'hospital', NULL, 'Spitalweg 1', '0001', 'Teststadt', 'CH', 47.0000, 8.0000, '+41 00 000 00 01', 'info@test-hospital.invalid', '[TEST] Mo-Fr 08:00-17:00', '[TEST] Fiktiver Haupteingang', '[TEST DATA] Fiktives Testspital'),
('[TEST] Musterspital - Dialyse', 'hospital', 'Test-Dialysezentrum', 'Spitalweg 1', '0001', 'Teststadt', 'CH', 47.0000, 8.0000, '+41 00 000 00 02', 'dialyse@test-hospital.invalid', '[TEST] Mo-Sa 06:00-22:00', '[TEST] Eingang B - TESTDATEN', '[TEST DATA] Fiktive Dialysestation'),
('[TEST] Praxis Dr. Testdoktor', 'doctor', 'Test-Allgemeinmedizin', 'Praxisstrasse 10', '0002', 'Musterstadt', 'CH', 47.1000, 8.1000, '+41 00 000 00 03', 'praxis@testdoktor.invalid', '[TEST] Mo-Fr 08:00-12:00', '[TEST] Fiktive Praxis - 1. OG', '[TEST DATA] Testpraxis'),
('[TEST] Demo-Physiotherapie', 'therapy', 'Test-Physiotherapie', 'Therapieweg 5', '0003', 'Demoville', 'CH', 47.2000, 8.2000, '+41 00 000 00 04', 'info@test-physio.invalid', '[TEST] Mo-Fr 07:00-20:00', '[TEST] Erdgeschoss - TESTDATEN', '[TEST DATA] Fiktive Physiotherapie'),
('[TEST] Muster-Augenzentrum', 'doctor', 'Test-Augenheilkunde', 'Augenstrasse 20', '0004', 'Fiktivhausen', 'CH', 47.3000, 8.3000, '+41 00 000 00 05', 'info@test-augen.invalid', '[TEST] Mo-Fr 08:00-17:00', '[TEST] 3. Stock - TESTDATEN', '[TEST DATA] Fiktives Augenzentrum'),
('[TEST] Testklinik Premium', 'hospital', NULL, 'Klinikstrasse 99', '0005', 'Placeholder', 'CH', 47.4000, 8.4000, '+41 00 000 00 06', 'info@testklinik.invalid', '[TEST] Mo-Fr 07:30-18:00', '[TEST] Haupteingang - TESTDATEN', '[TEST DATA] Fiktive Privatklinik'),
('[TEST] Demo-Rheumazentrum', 'therapy', 'Test-Rheumatologie', 'Thermalweg 2', '0006', 'Testbad', 'CH', 47.5000, 8.5000, '+41 00 000 00 07', NULL, '[TEST] Mo-Fr 08:00-18:00', '[TEST] Nordeingang - TESTDATEN', '[TEST DATA] Fiktives Rheumazentrum');

-- =============================================================================
-- C.4 TEST AVAILABILITY BLOCKS (for TEST-DRV-01)
-- =============================================================================

DO $$
DECLARE
    v_driver_id UUID;
BEGIN
    SELECT id INTO v_driver_id FROM drivers WHERE driver_code = 'TEST-DRV-01';
    IF v_driver_id IS NOT NULL THEN
        INSERT INTO availability_blocks (driver_id, weekday, start_time, end_time) VALUES
        (v_driver_id, 'monday', '08:00', '10:00'),
        (v_driver_id, 'monday', '10:00', '12:00'),
        (v_driver_id, 'monday', '14:00', '16:00'),
        (v_driver_id, 'tuesday', '08:00', '10:00'),
        (v_driver_id, 'tuesday', '10:00', '12:00'),
        (v_driver_id, 'wednesday', '08:00', '10:00'),
        (v_driver_id, 'wednesday', '10:00', '12:00'),
        (v_driver_id, 'wednesday', '14:00', '16:00'),
        (v_driver_id, 'wednesday', '16:00', '18:00'),
        (v_driver_id, 'thursday', '08:00', '10:00'),
        (v_driver_id, 'thursday', '10:00', '12:00'),
        (v_driver_id, 'friday', '08:00', '10:00'),
        (v_driver_id, 'friday', '10:00', '12:00'),
        (v_driver_id, 'friday', '14:00', '16:00');
    END IF;
END $$;


-- #############################################################################
-- PART D: DEMO USER CONFIGURATION
-- #############################################################################
-- After running this script, you need to:
--   1. Create users in Supabase Auth Dashboard
--   2. Replace the UUIDs below with the real ones
--   3. Re-run only this PART D block

DO $$
DECLARE
    -- =========================================================================
    -- REPLACE_ME: Set these to the actual User IDs from Supabase Auth!
    -- =========================================================================
    v_dispatcher_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- REPLACE_ME
    v_driver_user_id     UUID := '00000000-0000-0000-0000-000000000002'; -- REPLACE_ME
    v_driver_record_id UUID;
BEGIN
    -- Skip if placeholders haven't been replaced
    IF v_dispatcher_user_id = '00000000-0000-0000-0000-000000000001' THEN
        RAISE NOTICE '=====================================================';
        RAISE NOTICE 'PART D SKIPPED: Demo user UUIDs not configured.';
        RAISE NOTICE 'Replace REPLACE_ME UUIDs in PART D and re-run that block.';
        RAISE NOTICE '=====================================================';
        RETURN;
    END IF;

    -- Configure dispatcher as admin
    INSERT INTO profiles (id, role, display_name)
    VALUES (v_dispatcher_user_id, 'admin', 'Demo Dispatcher')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', display_name = 'Demo Dispatcher';

    -- Configure driver profile
    INSERT INTO profiles (id, role, display_name)
    VALUES (v_driver_user_id, 'driver', 'Demo Fahrer')
    ON CONFLICT (id) DO UPDATE SET role = 'driver', display_name = 'Demo Fahrer';

    -- Link driver user to TEST-DRV-01 record
    SELECT id INTO v_driver_record_id FROM drivers WHERE driver_code = 'TEST-DRV-01' LIMIT 1;

    IF v_driver_record_id IS NOT NULL THEN
        UPDATE drivers SET user_id = v_driver_user_id WHERE id = v_driver_record_id;
        RAISE NOTICE 'Driver TEST-DRV-01 linked to user %', v_driver_user_id;
    ELSE
        RAISE WARNING 'No driver record TEST-DRV-01 found!';
    END IF;

    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DEMO USERS CONFIGURED';
    RAISE NOTICE '  Dispatcher: dispatcher@demo.fahrdienst.ch (admin)';
    RAISE NOTICE '  Fahrer: fahrer@demo.fahrdienst.ch (driver)';
    RAISE NOTICE '=====================================================';
END $$;


-- #############################################################################
-- VERIFICATION
-- #############################################################################

DO $$
DECLARE
    patient_count INTEGER;
    driver_count INTEGER;
    destination_count INTEGER;
    availability_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO patient_count FROM patients;
    SELECT COUNT(*) INTO driver_count FROM drivers;
    SELECT COUNT(*) INTO destination_count FROM destinations;
    SELECT COUNT(*) INTO availability_count FROM availability_blocks;

    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DATABASE INITIALIZATION COMPLETE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '  Patients:     %', patient_count;
    RAISE NOTICE '  Drivers:      %', driver_count;
    RAISE NOTICE '  Destinations: %', destination_count;
    RAISE NOTICE '  Availability: % blocks', availability_count;
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables: profiles, patients, drivers, destinations,';
    RAISE NOTICE '        rides, availability_blocks, absences,';
    RAISE NOTICE '        audit_logs, application_logs';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS: Enabled on all tables';
    RAISE NOTICE 'Triggers: updated_at, audit, security';
    RAISE NOTICE '=====================================================';
END $$;
