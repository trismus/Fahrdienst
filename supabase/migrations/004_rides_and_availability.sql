-- Migration: Rides, Availability Blocks, and Absences with RLS
-- This builds on top of 001_master_data.sql

-- =============================================================================
-- RIDE STATUS ENUM
-- =============================================================================

CREATE TYPE ride_status AS ENUM ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- =============================================================================
-- WEEKDAY ENUM
-- =============================================================================

CREATE TYPE weekday AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');

-- =============================================================================
-- RIDES TABLE
-- =============================================================================

CREATE TABLE rides (
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

    -- Recurring rides grouping
    recurrence_group UUID,

    -- Route info (cached from Google Maps)
    estimated_duration INTEGER, -- minutes
    estimated_distance NUMERIC(10,2), -- kilometers

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
    CONSTRAINT valid_return_time CHECK (return_time IS NULL OR return_time > arrival_time)
);

-- =============================================================================
-- AVAILABILITY BLOCKS TABLE
-- =============================================================================

CREATE TABLE availability_blocks (
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

-- =============================================================================
-- ABSENCES TABLE
-- =============================================================================

CREATE TABLE absences (
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

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Rides
CREATE INDEX idx_rides_patient_id ON rides(patient_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_destination_id ON rides(destination_id);
CREATE INDEX idx_rides_pickup_time ON rides(pickup_time);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_recurrence_group ON rides(recurrence_group) WHERE recurrence_group IS NOT NULL;
-- Note: DATE(pickup_time) index removed - not IMMUTABLE on TIMESTAMPTZ.

-- Availability blocks
CREATE INDEX idx_availability_driver_id ON availability_blocks(driver_id);
CREATE INDEX idx_availability_weekday ON availability_blocks(weekday);

-- Absences
CREATE INDEX idx_absences_driver_id ON absences(driver_id);
CREATE INDEX idx_absences_dates ON absences(from_date, to_date);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER rides_updated_at
    BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER availability_blocks_updated_at
    BEFORE UPDATE ON availability_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER absences_updated_at
    BEFORE UPDATE ON absences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RIDES RLS POLICIES
-- =============================================================================

-- Admin/Operator can read all rides
CREATE POLICY "Admin/Operator can read all rides"
    ON rides FOR SELECT
    TO authenticated
    USING (is_admin_or_operator());

-- Drivers can read their own assigned rides
CREATE POLICY "Drivers can read own rides"
    ON rides FOR SELECT
    TO authenticated
    USING (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Admin/Operator can insert rides
CREATE POLICY "Admin/Operator can insert rides"
    ON rides FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_operator());

-- Admin/Operator can update rides
CREATE POLICY "Admin/Operator can update rides"
    ON rides FOR UPDATE
    TO authenticated
    USING (is_admin_or_operator());

-- Drivers can update status of their own rides (confirm, start, complete)
CREATE POLICY "Drivers can update own ride status"
    ON rides FOR UPDATE
    TO authenticated
    USING (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
    WITH CHECK (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Admin/Operator can delete rides
CREATE POLICY "Admin/Operator can delete rides"
    ON rides FOR DELETE
    TO authenticated
    USING (is_admin_or_operator());

-- =============================================================================
-- AVAILABILITY BLOCKS RLS POLICIES
-- =============================================================================

-- Admin/Operator can read all availability blocks
CREATE POLICY "Admin/Operator can read all availability"
    ON availability_blocks FOR SELECT
    TO authenticated
    USING (is_admin_or_operator());

-- Drivers can read their own availability blocks
CREATE POLICY "Drivers can read own availability"
    ON availability_blocks FOR SELECT
    TO authenticated
    USING (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Drivers can insert their own availability blocks
CREATE POLICY "Drivers can insert own availability"
    ON availability_blocks FOR INSERT
    TO authenticated
    WITH CHECK (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Drivers can update their own availability blocks
CREATE POLICY "Drivers can update own availability"
    ON availability_blocks FOR UPDATE
    TO authenticated
    USING (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Drivers can delete their own availability blocks
CREATE POLICY "Drivers can delete own availability"
    ON availability_blocks FOR DELETE
    TO authenticated
    USING (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Admin/Operator can manage all availability
CREATE POLICY "Admin/Operator can insert any availability"
    ON availability_blocks FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_operator());

CREATE POLICY "Admin/Operator can update any availability"
    ON availability_blocks FOR UPDATE
    TO authenticated
    USING (is_admin_or_operator());

CREATE POLICY "Admin/Operator can delete any availability"
    ON availability_blocks FOR DELETE
    TO authenticated
    USING (is_admin_or_operator());

-- =============================================================================
-- ABSENCES RLS POLICIES
-- =============================================================================

-- Admin/Operator can read all absences
CREATE POLICY "Admin/Operator can read all absences"
    ON absences FOR SELECT
    TO authenticated
    USING (is_admin_or_operator());

-- Drivers can read their own absences
CREATE POLICY "Drivers can read own absences"
    ON absences FOR SELECT
    TO authenticated
    USING (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Drivers can insert their own absences
CREATE POLICY "Drivers can insert own absences"
    ON absences FOR INSERT
    TO authenticated
    WITH CHECK (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Drivers can update their own absences
CREATE POLICY "Drivers can update own absences"
    ON absences FOR UPDATE
    TO authenticated
    USING (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Drivers can delete their own absences
CREATE POLICY "Drivers can delete own absences"
    ON absences FOR DELETE
    TO authenticated
    USING (
        driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
    );

-- Admin/Operator can manage all absences
CREATE POLICY "Admin/Operator can insert any absences"
    ON absences FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_operator());

CREATE POLICY "Admin/Operator can update any absences"
    ON absences FOR UPDATE
    TO authenticated
    USING (is_admin_or_operator());

CREATE POLICY "Admin/Operator can delete any absences"
    ON absences FOR DELETE
    TO authenticated
    USING (is_admin_or_operator());

-- =============================================================================
-- HELPER FUNCTION: Check driver availability
-- =============================================================================

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
    -- Extract weekday and time from pickup_time
    v_date := p_pickup_time::DATE;
    v_time := p_pickup_time::TIME;
    v_weekday := LOWER(TO_CHAR(p_pickup_time, 'Day'))::weekday;

    -- Check availability block
    SELECT EXISTS (
        SELECT 1 FROM availability_blocks ab
        WHERE ab.driver_id = p_driver_id
        AND ab.weekday = v_weekday
        AND ab.start_time <= v_time
        AND ab.end_time > v_time
    ) INTO has_availability_block;

    -- Check absences
    SELECT EXISTS (
        SELECT 1 FROM absences a
        WHERE a.driver_id = p_driver_id
        AND a.from_date <= v_date
        AND a.to_date >= v_date
    ) INTO is_absent;

    -- Check overlapping rides (within 1 hour)
    SELECT EXISTS (
        SELECT 1 FROM rides r
        WHERE r.driver_id = p_driver_id
        AND r.status NOT IN ('cancelled', 'completed')
        AND ABS(EXTRACT(EPOCH FROM (r.pickup_time - p_pickup_time)) / 60) < 60
    ) INTO has_overlapping_ride;

    -- Get overlapping ride ID if any
    SELECT r.id INTO overlapping_ride_id
    FROM rides r
    WHERE r.driver_id = p_driver_id
    AND r.status NOT IN ('cancelled', 'completed')
    AND ABS(EXTRACT(EPOCH FROM (r.pickup_time - p_pickup_time)) / 60) < 60
    LIMIT 1;

    -- Determine overall availability
    is_available := has_availability_block AND NOT is_absent AND NOT has_overlapping_ride;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
