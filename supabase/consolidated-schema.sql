-- =============================================================================
-- FAHRDIENST: Consolidated Database Schema
-- =============================================================================
-- This script creates the complete database from scratch.
-- It consolidates all migrations (001-010), security fixes, RLS policies,
-- and ad-hoc patches into a single idempotent script.
--
-- Usage:
--   1. Create a new Supabase project
--   2. Run this entire script in the SQL Editor
--   3. Then run demo-users-setup.sql or seed.sql for initial data
--
-- Migrations consolidated:
--   001_master_data.sql           - Profiles, Patients, Drivers, Destinations
--   002_audit_logging.sql         - GDPR audit trail
--   003_privilege_escalation.sql  - Role change prevention triggers
--   004_rides_and_availability.sql - Rides, Availability, Absences
--   005_ride_execution.sql        - Execution timestamps, substatus
--   006_rls_policy_improvements.sql - Driver patient read access
--   007_application_logs.sql      - Application logging
--   008_fix_rls_policies.sql      - Remove insecure policies
--   009_fix_driver_admin_read.sql - Admin can see inactive drivers
--   010_compound_indexes.sql      - Performance indexes
--   rls-policies.sql              - Complete RLS policy overhaul
--   security-fixes.sql            - Signup trigger hardening
--   fix-profiles-rls.sql          - Profiles recursion fix
--
-- Generated: 2026-02-03
-- =============================================================================


-- =============================================================================
-- PART 1: EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- PART 2: ENUM TYPES
-- =============================================================================

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'operator', 'driver'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE vehicle_type AS ENUM ('car', 'van', 'accessible_van'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE destination_type AS ENUM ('hospital', 'doctor', 'therapy', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ride_status AS ENUM ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE weekday AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ride_substatus AS ENUM ('waiting', 'en_route_pickup', 'at_pickup', 'en_route_destination', 'at_destination', 'completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE log_level AS ENUM ('info', 'warn', 'error'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================================
-- PART 3: TABLES
-- =============================================================================

-- ===== 3.1 PROFILES (RLS role management) =====

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'driver',
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== 3.2 PATIENTS =====

CREATE TABLE IF NOT EXISTS patients (
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

    -- Status (soft delete)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== 3.3 DRIVERS =====

CREATE TABLE IF NOT EXISTS drivers (
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

    -- Status (soft delete)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== 3.4 DESTINATIONS =====

CREATE TABLE IF NOT EXISTS destinations (
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

    -- Status (soft delete)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== 3.5 RIDES =====

CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,

    -- Times
    pickup_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    return_time TIMESTAMPTZ,

    -- Status
    status ride_status NOT NULL DEFAULT 'planned',
    substatus ride_substatus DEFAULT 'waiting',

    -- Recurring rides grouping
    recurrence_group UUID,

    -- Route info (cached from Google Maps)
    estimated_duration INTEGER,       -- minutes
    estimated_distance NUMERIC(10,2), -- kilometers

    -- Execution timestamps (Sprint 4)
    started_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Cancellation info
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_times CHECK (arrival_time >= pickup_time),
    CONSTRAINT valid_return_time CHECK (return_time IS NULL OR return_time > arrival_time),
    CONSTRAINT valid_execution_timestamps CHECK (
        (started_at IS NULL OR picked_up_at IS NULL OR started_at <= picked_up_at)
        AND (picked_up_at IS NULL OR arrived_at IS NULL OR picked_up_at <= arrived_at)
        AND (arrived_at IS NULL OR completed_at IS NULL OR arrived_at <= completed_at)
        AND (started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at)
    )
);

-- ===== 3.6 AVAILABILITY BLOCKS =====

CREATE TABLE IF NOT EXISTS availability_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    weekday weekday NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_block_times CHECK (end_time > start_time),
    CONSTRAINT unique_driver_weekday_time UNIQUE (driver_id, weekday, start_time)
);

-- ===== 3.7 ABSENCES =====

CREATE TABLE IF NOT EXISTS absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_absence_dates CHECK (to_date >= from_date)
);

-- ===== 3.8 AUDIT LOGS (GDPR/FADP) =====

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What happened
    action TEXT NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    record_id UUID,

    -- Who did it
    user_id UUID REFERENCES auth.users(id),
    user_role TEXT,
    ip_address INET,
    user_agent TEXT,

    -- What changed
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],

    -- When
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Additional context
    request_id UUID,
    session_id UUID,
    notes TEXT
);

-- ===== 3.9 APPLICATION LOGS =====

CREATE TABLE IF NOT EXISTS application_logs (
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

    -- Constraints
    CONSTRAINT message_not_empty CHECK (length(trim(message)) > 0),
    CONSTRAINT metadata_is_object CHECK (jsonb_typeof(metadata) = 'object')
);


-- =============================================================================
-- PART 4: INDEXES
-- =============================================================================

-- ===== Profiles =====
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ===== Patients =====
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients(is_active);
CREATE INDEX IF NOT EXISTS idx_patients_last_name ON patients(last_name);
CREATE INDEX IF NOT EXISTS idx_patients_postal_code ON patients(postal_code);
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number) WHERE patient_number IS NOT NULL;

-- ===== Drivers =====
CREATE INDEX IF NOT EXISTS idx_drivers_is_active ON drivers(is_active);
CREATE INDEX IF NOT EXISTS idx_drivers_last_name ON drivers(last_name);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_type ON drivers(vehicle_type);

-- ===== Destinations =====
CREATE INDEX IF NOT EXISTS idx_destinations_is_active ON destinations(is_active);
CREATE INDEX IF NOT EXISTS idx_destinations_destination_type ON destinations(destination_type);
CREATE INDEX IF NOT EXISTS idx_destinations_postal_code ON destinations(postal_code);
CREATE INDEX IF NOT EXISTS idx_destinations_name ON destinations(name);

-- ===== Rides =====
CREATE INDEX IF NOT EXISTS idx_rides_patient_id ON rides(patient_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_destination_id ON rides(destination_id);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_time ON rides(pickup_time);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_recurrence_group ON rides(recurrence_group) WHERE recurrence_group IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rides_pickup_date ON rides(DATE(pickup_time));
CREATE INDEX IF NOT EXISTS idx_rides_started_at ON rides(started_at) WHERE started_at IS NOT NULL AND completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rides_completed_at ON rides(completed_at) WHERE completed_at IS NOT NULL;

-- Compound indexes (010)
CREATE INDEX IF NOT EXISTS idx_rides_driver_status ON rides(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_status ON rides(pickup_time, status);

-- ===== Availability Blocks =====
CREATE INDEX IF NOT EXISTS idx_availability_driver_id ON availability_blocks(driver_id);
CREATE INDEX IF NOT EXISTS idx_availability_weekday ON availability_blocks(weekday);
CREATE INDEX IF NOT EXISTS idx_availability_driver_weekday ON availability_blocks(driver_id, weekday);

-- ===== Absences =====
CREATE INDEX IF NOT EXISTS idx_absences_driver_id ON absences(driver_id);
CREATE INDEX IF NOT EXISTS idx_absences_dates ON absences(from_date, to_date);
CREATE INDEX IF NOT EXISTS idx_absences_driver_dates ON absences(driver_id, from_date, to_date);

-- ===== Audit Logs =====
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance ON audit_logs(table_name, record_id, created_at DESC);

-- ===== Application Logs =====
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON application_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_level_created_at ON application_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_source ON application_logs(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_route ON application_logs(route) WHERE route IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON application_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_request_id ON application_logs(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_feature ON application_logs(feature) WHERE feature IS NOT NULL;


-- =============================================================================
-- PART 5: FUNCTIONS
-- =============================================================================

-- ===== 5.1 Updated_at trigger function =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== 5.2 RLS helper: get user role =====

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM profiles
    WHERE id = auth.uid();

    RETURN COALESCE(v_role, 'driver');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.3 RLS helper: is admin or operator =====

CREATE OR REPLACE FUNCTION is_admin_or_operator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.4 RLS helper: is dispatcher (alias) =====

CREATE OR REPLACE FUNCTION is_dispatcher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.5 RLS helper: is admin =====

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.6 RLS helper: get driver ID for current user =====

CREATE OR REPLACE FUNCTION get_driver_id()
RETURNS UUID AS $$
DECLARE
    driver_uuid UUID;
BEGIN
    SELECT id INTO driver_uuid
    FROM drivers
    WHERE user_id = auth.uid()
    LIMIT 1;

    RETURN driver_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.7 Auto-create profile on user signup =====
-- SECURITY: Always assigns 'driver' role. Admin must promote manually.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, role, display_name)
    VALUES (
        NEW.id,
        'driver',  -- Always driver, never trust client input
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.8 Audit log trigger function =====

CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB := NULL;
    new_data JSONB := NULL;
    changed TEXT[] := '{}';
    col TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);

        INSERT INTO audit_logs (action, table_name, record_id, user_id, user_role, old_data, new_data, changed_fields)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, auth.uid(),
                (SELECT role FROM profiles WHERE id = auth.uid()),
                old_data, NULL, changed);

        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        FOR col IN SELECT column_name FROM information_schema.columns
                   WHERE table_name = TG_TABLE_NAME
                   AND column_name NOT IN ('updated_at', 'created_at')
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
        new_data := to_jsonb(NEW);

        INSERT INTO audit_logs (action, table_name, record_id, user_id, user_role, old_data, new_data, changed_fields)
        VALUES ('INSERT', TG_TABLE_NAME, NEW.id, auth.uid(),
                (SELECT role FROM profiles WHERE id = auth.uid()),
                NULL, new_data, changed);

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.9 Privilege escalation prevention =====

-- Prevent self-role-modification
CREATE OR REPLACE FUNCTION prevent_self_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id = auth.uid() THEN
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            RAISE EXCEPTION 'Users cannot modify their own role. Please contact an administrator.';
        END IF;
    END IF;

    IF OLD.role IS DISTINCT FROM NEW.role THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Only administrators can change user roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforce default role on insert
CREATE OR REPLACE FUNCTION enforce_default_role_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role != 'driver' THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            NEW.role := 'driver';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure at least one admin exists
CREATE OR REPLACE FUNCTION ensure_admin_exists()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin' THEN
        SELECT COUNT(*) INTO admin_count
        FROM profiles WHERE role = 'admin' AND id != OLD.id;

        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot remove the last administrator. Promote another user to admin first.';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
        SELECT COUNT(*) INTO admin_count
        FROM profiles WHERE role = 'admin' AND id != OLD.id;

        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot delete the last administrator account.';
        END IF;

        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict driver-user linking to admins only
CREATE OR REPLACE FUNCTION restrict_driver_user_linking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Only administrators can link user accounts to driver profiles.';
        END IF;

        IF EXISTS (
            SELECT 1 FROM drivers WHERE user_id = NEW.user_id AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'This user account is already linked to another driver profile.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.10 Audit log query helpers =====

CREATE OR REPLACE FUNCTION get_audit_history(
    p_table_name TEXT,
    p_record_id UUID,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    action TEXT,
    changed_fields TEXT[],
    user_id UUID,
    user_role TEXT,
    created_at TIMESTAMPTZ,
    old_data JSONB,
    new_data JSONB
) AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Only admins can view audit logs';
    END IF;

    RETURN QUERY
    SELECT al.action, al.changed_fields, al.user_id, al.user_role, al.created_at, al.old_data, al.new_data
    FROM audit_logs al
    WHERE al.table_name = p_table_name AND al.record_id = p_record_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_audit_trail(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW(),
    p_limit INT DEFAULT 1000
)
RETURNS TABLE (
    action TEXT,
    table_name TEXT,
    record_id UUID,
    changed_fields TEXT[],
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Only admins can view audit logs';
    END IF;

    RETURN QUERY
    SELECT al.action, al.table_name, al.record_id, al.changed_fields, al.created_at
    FROM audit_logs al
    WHERE al.user_id = p_user_id
    AND al.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.11 Audit log retention =====

CREATE OR REPLACE FUNCTION purge_old_audit_logs(retention_years INT DEFAULT 7)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - (retention_years || ' years')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION purge_old_audit_logs FROM PUBLIC;
GRANT EXECUTE ON FUNCTION purge_old_audit_logs TO service_role;

-- ===== 5.12 Check driver availability =====

CREATE OR REPLACE FUNCTION check_driver_availability(
    p_driver_id UUID,
    p_pickup_time TIMESTAMPTZ
) RETURNS TABLE (
    is_available BOOLEAN,
    has_availability_block BOOLEAN,
    is_absent BOOLEAN,
    has_overlapping_ride BOOLEAN,
    overlapping_ride_id UUID
) AS $$
DECLARE
    v_weekday weekday;
    v_time TIME;
    v_date DATE;
BEGIN
    v_date := p_pickup_time::DATE;
    v_time := p_pickup_time::TIME;
    v_weekday := LOWER(TO_CHAR(p_pickup_time, 'Day'))::weekday;

    SELECT EXISTS (
        SELECT 1 FROM availability_blocks ab
        WHERE ab.driver_id = p_driver_id
        AND ab.weekday = v_weekday
        AND ab.start_time <= v_time
        AND ab.end_time > v_time
    ) INTO has_availability_block;

    SELECT EXISTS (
        SELECT 1 FROM absences a
        WHERE a.driver_id = p_driver_id
        AND a.from_date <= v_date
        AND a.to_date >= v_date
    ) INTO is_absent;

    SELECT EXISTS (
        SELECT 1 FROM rides r
        WHERE r.driver_id = p_driver_id
        AND r.status NOT IN ('cancelled', 'completed')
        AND ABS(EXTRACT(EPOCH FROM (r.pickup_time - p_pickup_time)) / 60) < 60
    ) INTO has_overlapping_ride;

    SELECT r.id INTO overlapping_ride_id
    FROM rides r
    WHERE r.driver_id = p_driver_id
    AND r.status NOT IN ('cancelled', 'completed')
    AND ABS(EXTRACT(EPOCH FROM (r.pickup_time - p_pickup_time)) / 60) < 60
    LIMIT 1;

    is_available := has_availability_block AND NOT is_absent AND NOT has_overlapping_ride;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.13 Ride duration calculation =====

CREATE OR REPLACE FUNCTION calculate_ride_duration(ride_id UUID)
RETURNS TABLE (
    total_duration_minutes INTEGER,
    pickup_duration_minutes INTEGER,
    transport_duration_minutes INTEGER,
    waiting_duration_minutes INTEGER
) AS $$
DECLARE
    r rides%ROWTYPE;
BEGIN
    SELECT * INTO r FROM rides WHERE id = ride_id;

    IF r IS NULL THEN
        RETURN;
    END IF;

    IF r.started_at IS NOT NULL AND r.completed_at IS NOT NULL THEN
        total_duration_minutes := EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) / 60;
    END IF;

    IF r.started_at IS NOT NULL AND r.picked_up_at IS NOT NULL THEN
        pickup_duration_minutes := EXTRACT(EPOCH FROM (r.picked_up_at - r.started_at)) / 60;
    END IF;

    IF r.picked_up_at IS NOT NULL AND r.arrived_at IS NOT NULL THEN
        transport_duration_minutes := EXTRACT(EPOCH FROM (r.arrived_at - r.picked_up_at)) / 60;
    END IF;

    IF r.arrived_at IS NOT NULL AND r.completed_at IS NOT NULL THEN
        waiting_duration_minutes := EXTRACT(EPOCH FROM (r.completed_at - r.arrived_at)) / 60;
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.14 Application log cleanup =====

CREATE OR REPLACE FUNCTION cleanup_application_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    cutoff_date TIMESTAMPTZ;
    total_count INTEGER;
    excess_count INTEGER;
BEGIN
    cutoff_date := NOW() - INTERVAL '30 days';

    DELETE FROM application_logs WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    SELECT COUNT(*) INTO total_count FROM application_logs;

    IF total_count > 10000 THEN
        excess_count := total_count - 10000;

        DELETE FROM application_logs
        WHERE id IN (
            SELECT id FROM application_logs
            ORDER BY created_at ASC
            LIMIT excess_count
        );

        GET DIAGNOSTICS excess_count = ROW_COUNT;
        deleted_count := deleted_count + excess_count;
    END IF;

    IF deleted_count > 0 THEN
        INSERT INTO application_logs (level, message, source, metadata)
        VALUES ('info', 'Log cleanup completed', 'database',
                jsonb_build_object('deleted_count', deleted_count, 'trigger', 'scheduled_cleanup'));
    END IF;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5.15 Log stats helper =====

CREATE OR REPLACE FUNCTION get_log_stats()
RETURNS TABLE (
    total_count BIGINT,
    error_count BIGINT,
    warn_count BIGINT,
    info_count BIGINT,
    oldest_log TIMESTAMPTZ,
    newest_log TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE level = 'error')::BIGINT,
        COUNT(*) FILTER (WHERE level = 'warn')::BIGINT,
        COUNT(*) FILTER (WHERE level = 'info')::BIGINT,
        MIN(created_at),
        MAX(created_at)
    FROM application_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- PART 6: TRIGGERS
-- =============================================================================

-- ===== 6.1 Updated_at triggers =====

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS patients_updated_at ON patients;
CREATE TRIGGER patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS drivers_updated_at ON drivers;
CREATE TRIGGER drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS destinations_updated_at ON destinations;
CREATE TRIGGER destinations_updated_at
    BEFORE UPDATE ON destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS rides_updated_at ON rides;
CREATE TRIGGER rides_updated_at
    BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS availability_blocks_updated_at ON availability_blocks;
CREATE TRIGGER availability_blocks_updated_at
    BEFORE UPDATE ON availability_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS absences_updated_at ON absences;
CREATE TRIGGER absences_updated_at
    BEFORE UPDATE ON absences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 6.2 Auto-create profile on signup =====

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===== 6.3 Audit log triggers =====

DROP TRIGGER IF EXISTS audit_patients ON patients;
CREATE TRIGGER audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

DROP TRIGGER IF EXISTS audit_drivers ON drivers;
CREATE TRIGGER audit_drivers
    AFTER INSERT OR UPDATE OR DELETE ON drivers
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

DROP TRIGGER IF EXISTS audit_destinations ON destinations;
CREATE TRIGGER audit_destinations
    AFTER INSERT OR UPDATE OR DELETE ON destinations
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- ===== 6.4 Privilege escalation prevention triggers =====

DROP TRIGGER IF EXISTS prevent_self_role_change ON profiles;
CREATE TRIGGER prevent_self_role_change
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION prevent_self_role_change();

DROP TRIGGER IF EXISTS enforce_default_role_on_insert ON profiles;
CREATE TRIGGER enforce_default_role_on_insert
    BEFORE INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION enforce_default_role_on_insert();

DROP TRIGGER IF EXISTS ensure_admin_exists ON profiles;
CREATE TRIGGER ensure_admin_exists
    BEFORE UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION ensure_admin_exists();

-- ===== 6.5 Driver-user linking restriction =====

DROP TRIGGER IF EXISTS restrict_driver_user_linking ON drivers;
CREATE TRIGGER restrict_driver_user_linking
    BEFORE INSERT OR UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION restrict_driver_user_linking();


-- =============================================================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- ===== 7.0 Enable RLS on all tables =====

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- ===== 7.1 Drop ALL existing policies (clean slate) =====

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ===== 7.2 PROFILES policies =====

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Admins can read all profiles (uses is_admin() to avoid recursion)
CREATE POLICY "Admins can read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (is_admin());

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- System can insert own profile (for signup trigger)
CREATE POLICY "System can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Service role full access (for admin scripts)
CREATE POLICY "Service role full access profiles"
    ON profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ===== 7.3 PATIENTS policies =====

-- Dispatchers can read all patients
CREATE POLICY "Dispatchers can read patients"
    ON patients FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read patients for their assigned rides
CREATE POLICY "Drivers can read their patients"
    ON patients FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM rides
            WHERE rides.patient_id = patients.id
            AND rides.driver_id = get_driver_id()
            AND rides.status IN ('planned', 'confirmed', 'in_progress')
        )
    );

-- Dispatchers can create patients
CREATE POLICY "Dispatchers can create patients"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Dispatchers can update patients
CREATE POLICY "Dispatchers can update patients"
    ON patients FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Dispatchers can delete patients
CREATE POLICY "Dispatchers can delete patients"
    ON patients FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- ===== 7.4 DRIVERS policies =====

-- Dispatchers can read all drivers (including inactive)
CREATE POLICY "Dispatchers can read drivers"
    ON drivers FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read their own record
CREATE POLICY "Drivers can read own record"
    ON drivers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Dispatchers can create drivers
CREATE POLICY "Dispatchers can create drivers"
    ON drivers FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Dispatchers can update drivers
CREATE POLICY "Dispatchers can update drivers"
    ON drivers FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Drivers can update their own contact info
CREATE POLICY "Drivers can update own contact info"
    ON drivers FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Dispatchers can delete drivers
CREATE POLICY "Dispatchers can delete drivers"
    ON drivers FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- ===== 7.5 DESTINATIONS policies =====

-- All authenticated users can read destinations
CREATE POLICY "Authenticated users can read destinations"
    ON destinations FOR SELECT
    TO authenticated
    USING (true);

-- Dispatchers can create destinations
CREATE POLICY "Dispatchers can create destinations"
    ON destinations FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Dispatchers can update destinations
CREATE POLICY "Dispatchers can update destinations"
    ON destinations FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Dispatchers can delete destinations
CREATE POLICY "Dispatchers can delete destinations"
    ON destinations FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- ===== 7.6 RIDES policies =====

-- Dispatchers can read all rides
CREATE POLICY "Dispatchers can read rides"
    ON rides FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read their own assigned rides
CREATE POLICY "Drivers can read own rides"
    ON rides FOR SELECT
    TO authenticated
    USING (driver_id = get_driver_id());

-- Dispatchers can create rides
CREATE POLICY "Dispatchers can create rides"
    ON rides FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Dispatchers can update all rides
CREATE POLICY "Dispatchers can update rides"
    ON rides FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Drivers can update their own rides (status changes)
CREATE POLICY "Drivers can update own rides"
    ON rides FOR UPDATE
    TO authenticated
    USING (driver_id = get_driver_id())
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can delete rides
CREATE POLICY "Dispatchers can delete rides"
    ON rides FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- ===== 7.7 AVAILABILITY_BLOCKS policies =====

-- Dispatchers can read all availability blocks
CREATE POLICY "Dispatchers can read availability"
    ON availability_blocks FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read their own availability blocks
CREATE POLICY "Drivers can read own availability"
    ON availability_blocks FOR SELECT
    TO authenticated
    USING (driver_id = get_driver_id());

-- Dispatchers can create availability blocks
CREATE POLICY "Dispatchers can create availability"
    ON availability_blocks FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Drivers can create their own availability blocks
CREATE POLICY "Drivers can create own availability"
    ON availability_blocks FOR INSERT
    TO authenticated
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can update availability blocks
CREATE POLICY "Dispatchers can update availability"
    ON availability_blocks FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Drivers can update their own availability blocks
CREATE POLICY "Drivers can update own availability"
    ON availability_blocks FOR UPDATE
    TO authenticated
    USING (driver_id = get_driver_id())
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can delete availability blocks
CREATE POLICY "Dispatchers can delete availability"
    ON availability_blocks FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- Drivers can delete their own availability blocks
CREATE POLICY "Drivers can delete own availability"
    ON availability_blocks FOR DELETE
    TO authenticated
    USING (driver_id = get_driver_id());

-- ===== 7.8 ABSENCES policies =====

-- Dispatchers can read all absences
CREATE POLICY "Dispatchers can read absences"
    ON absences FOR SELECT
    TO authenticated
    USING (is_dispatcher());

-- Drivers can read their own absences
CREATE POLICY "Drivers can read own absences"
    ON absences FOR SELECT
    TO authenticated
    USING (driver_id = get_driver_id());

-- Dispatchers can create absences
CREATE POLICY "Dispatchers can create absences"
    ON absences FOR INSERT
    TO authenticated
    WITH CHECK (is_dispatcher());

-- Drivers can create their own absences
CREATE POLICY "Drivers can create own absences"
    ON absences FOR INSERT
    TO authenticated
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can update absences
CREATE POLICY "Dispatchers can update absences"
    ON absences FOR UPDATE
    TO authenticated
    USING (is_dispatcher())
    WITH CHECK (is_dispatcher());

-- Drivers can update their own absences
CREATE POLICY "Drivers can update own absences"
    ON absences FOR UPDATE
    TO authenticated
    USING (driver_id = get_driver_id())
    WITH CHECK (driver_id = get_driver_id());

-- Dispatchers can delete absences
CREATE POLICY "Dispatchers can delete absences"
    ON absences FOR DELETE
    TO authenticated
    USING (is_dispatcher());

-- Drivers can delete their own absences
CREATE POLICY "Drivers can delete own absences"
    ON absences FOR DELETE
    TO authenticated
    USING (driver_id = get_driver_id());

-- ===== 7.9 AUDIT_LOGS policies =====

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (is_admin());

-- Service role can insert audit logs (for trigger function)
CREATE POLICY "Service role can insert audit logs"
    ON audit_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ===== 7.10 APPLICATION_LOGS policies =====

-- Only admins can read logs
CREATE POLICY "Only admins can read logs"
    ON application_logs FOR SELECT
    TO authenticated
    USING (is_admin());

-- Service role can insert logs
CREATE POLICY "Service role can insert logs"
    ON application_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Authenticated users can insert logs (fallback)
CREATE POLICY "Authenticated users can insert logs"
    ON application_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);


-- =============================================================================
-- PART 8: VIEWS
-- =============================================================================

-- Active rides for real-time dashboard
CREATE OR REPLACE VIEW active_rides_view AS
SELECT
    r.id,
    r.patient_id,
    r.driver_id,
    r.destination_id,
    r.pickup_time,
    r.arrival_time,
    r.status,
    r.substatus,
    r.started_at,
    r.picked_up_at,
    r.arrived_at,
    r.updated_at,
    CASE
        WHEN r.substatus = 'en_route_pickup' THEN
            r.pickup_time + (r.estimated_duration || ' minutes')::INTERVAL
        WHEN r.substatus = 'en_route_destination' THEN
            r.arrival_time
        ELSE NULL
    END as eta,
    d.first_name as driver_first_name,
    d.last_name as driver_last_name,
    d.phone as driver_phone,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.phone as patient_phone,
    dest.name as destination_name
FROM rides r
LEFT JOIN drivers d ON r.driver_id = d.id
LEFT JOIN patients p ON r.patient_id = p.id
LEFT JOIN destinations dest ON r.destination_id = dest.id
WHERE r.status IN ('confirmed', 'in_progress')
  AND r.pickup_time::DATE = CURRENT_DATE
ORDER BY r.pickup_time;

GRANT SELECT ON active_rides_view TO authenticated;


-- =============================================================================
-- PART 9: PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_operator() TO authenticated;
GRANT EXECUTE ON FUNCTION is_dispatcher() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_id() TO authenticated;


-- =============================================================================
-- PART 10: COMMENTS
-- =============================================================================

COMMENT ON TABLE profiles IS 'User profiles with role-based access control. RLS enabled.';
COMMENT ON TABLE patients IS 'Patient master data. RLS: Dispatchers full access, Drivers read-only for assigned rides.';
COMMENT ON TABLE drivers IS 'Driver master data. RLS: Dispatchers full access, Drivers can read own record and update contact info.';
COMMENT ON TABLE destinations IS 'Destination master data. RLS: All authenticated users can read, Dispatchers can write.';
COMMENT ON TABLE rides IS 'Ride records. RLS: Dispatchers full access, Drivers can read/update own assigned rides.';
COMMENT ON TABLE availability_blocks IS 'Driver availability schedules. RLS: Drivers can manage own, Dispatchers full access.';
COMMENT ON TABLE absences IS 'Driver absence records. RLS: Drivers can manage own, Dispatchers full access.';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for GDPR/FADP compliance. Records all changes to sensitive data.';
COMMENT ON TABLE application_logs IS 'Centralized application logging with automatic retention policy.';

COMMENT ON FUNCTION audit_log_changes IS 'Trigger function that automatically logs all INSERT, UPDATE, DELETE operations.';
COMMENT ON FUNCTION get_audit_history IS 'Returns audit history for a specific record. Admin access only.';
COMMENT ON FUNCTION get_user_audit_trail IS 'Returns all actions performed by a specific user. Admin access only.';
COMMENT ON FUNCTION purge_old_audit_logs IS 'Removes audit logs older than retention period. Service role only.';
COMMENT ON FUNCTION cleanup_application_logs() IS 'Retention policy: keeps max 10,000 logs or 30 days, whichever is smaller. Run daily.';
COMMENT ON FUNCTION prevent_self_role_change IS 'Prevents users from modifying their own role, requires admin for any role change.';
COMMENT ON FUNCTION enforce_default_role_on_insert IS 'Forces new users to start with driver role (least privilege).';
COMMENT ON FUNCTION ensure_admin_exists IS 'Ensures at least one admin account always exists in the system.';
COMMENT ON FUNCTION restrict_driver_user_linking IS 'Prevents unauthorized linking of user accounts to driver profiles.';

COMMENT ON COLUMN rides.started_at IS 'Timestamp when driver started the ride (left for pickup)';
COMMENT ON COLUMN rides.picked_up_at IS 'Timestamp when driver confirmed patient pickup';
COMMENT ON COLUMN rides.arrived_at IS 'Timestamp when driver arrived at destination';
COMMENT ON COLUMN rides.completed_at IS 'Timestamp when ride was fully completed';
COMMENT ON COLUMN rides.substatus IS 'Granular execution status for real-time tracking';


-- =============================================================================
-- DONE
-- =============================================================================
-- RLS Policy Summary:
--
-- PROFILES:
--   SELECT: Users own profile; Admins all
--   UPDATE: Admins only
--   INSERT: Admins + own profile (signup trigger)
--
-- PATIENTS:
--   SELECT: Dispatchers all; Drivers for assigned rides
--   INSERT/UPDATE/DELETE: Dispatchers only
--
-- DRIVERS:
--   SELECT: Dispatchers all (incl. inactive); Drivers own record
--   INSERT/DELETE: Dispatchers only
--   UPDATE: Dispatchers all; Drivers own contact info
--
-- DESTINATIONS:
--   SELECT: All authenticated users
--   INSERT/UPDATE/DELETE: Dispatchers only
--
-- RIDES:
--   SELECT: Dispatchers all; Drivers assigned rides
--   INSERT/DELETE: Dispatchers only
--   UPDATE: Dispatchers all; Drivers own ride status
--
-- AVAILABILITY_BLOCKS:
--   All: Dispatchers full; Drivers own records
--
-- ABSENCES:
--   All: Dispatchers full; Drivers own records
--
-- AUDIT_LOGS:
--   SELECT: Admins only; INSERT: Service role only
--
-- APPLICATION_LOGS:
--   SELECT: Admins only; INSERT: Service role + authenticated
-- =============================================================================

SELECT 'Fahrdienst consolidated schema applied successfully!' AS status;
