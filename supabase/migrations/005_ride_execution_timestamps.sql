-- Migration: Add ride execution timestamps for Sprint 4
-- This enables tracking the full ride lifecycle with precise timestamps
--
-- Story 14.3: Timestamps werden gespeichert (started_at, picked_up_at, arrived_at, completed_at)

-- =============================================================================
-- ADD EXECUTION TIMESTAMP COLUMNS TO RIDES TABLE
-- =============================================================================

-- started_at: When driver starts the ride (leaves for pickup)
ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- picked_up_at: When driver confirms patient pickup
ALTER TABLE rides ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;

-- arrived_at: When driver confirms arrival at destination
ALTER TABLE rides ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;

-- completed_at: When ride is fully completed
ALTER TABLE rides ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- =============================================================================
-- ADD INDEXES FOR TIMESTAMP QUERIES
-- =============================================================================

-- Index for finding active rides (started but not completed)
CREATE INDEX IF NOT EXISTS idx_rides_started_at ON rides(started_at)
    WHERE started_at IS NOT NULL AND completed_at IS NULL;

-- Index for completed rides (for reporting)
CREATE INDEX IF NOT EXISTS idx_rides_completed_at ON rides(completed_at)
    WHERE completed_at IS NOT NULL;

-- =============================================================================
-- ADD CONSTRAINTS FOR TIMESTAMP ORDER
-- =============================================================================

-- Ensure timestamps follow logical order
-- Note: Using a function-based approach to allow null intermediate values
ALTER TABLE rides ADD CONSTRAINT valid_execution_timestamps CHECK (
    -- started_at must be before or equal to picked_up_at
    (started_at IS NULL OR picked_up_at IS NULL OR started_at <= picked_up_at)
    -- picked_up_at must be before or equal to arrived_at
    AND (picked_up_at IS NULL OR arrived_at IS NULL OR picked_up_at <= arrived_at)
    -- arrived_at must be before or equal to completed_at
    AND (arrived_at IS NULL OR completed_at IS NULL OR arrived_at <= completed_at)
    -- started_at must be before or equal to completed_at (skip intermediates)
    AND (started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at)
);

-- =============================================================================
-- ADD RIDE SUBSTATUS ENUM FOR GRANULAR TRACKING
-- =============================================================================

-- Create enum for ride execution substatus
CREATE TYPE ride_substatus AS ENUM (
    'waiting',           -- Waiting to be started
    'en_route_pickup',   -- Driver on the way to pickup
    'at_pickup',         -- Driver arrived at pickup location
    'en_route_destination', -- Patient picked up, heading to destination
    'at_destination',    -- Arrived at destination
    'completed'          -- Fully completed
);

-- Add substatus column for granular tracking
ALTER TABLE rides ADD COLUMN IF NOT EXISTS substatus ride_substatus DEFAULT 'waiting';

-- =============================================================================
-- UPDATE RLS POLICIES FOR NEW COLUMNS
-- =============================================================================

-- Drivers can update execution timestamps on their own rides
-- (The existing "Drivers can update own ride status" policy covers this)

-- =============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN rides.started_at IS 'Timestamp when driver started the ride (left for pickup)';
COMMENT ON COLUMN rides.picked_up_at IS 'Timestamp when driver confirmed patient pickup';
COMMENT ON COLUMN rides.arrived_at IS 'Timestamp when driver arrived at destination';
COMMENT ON COLUMN rides.completed_at IS 'Timestamp when ride was fully completed';
COMMENT ON COLUMN rides.substatus IS 'Granular execution status for real-time tracking';

-- =============================================================================
-- CREATE HELPER FUNCTION FOR RIDE DURATION CALCULATION
-- =============================================================================

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

    -- Total duration from start to complete
    IF r.started_at IS NOT NULL AND r.completed_at IS NOT NULL THEN
        total_duration_minutes := EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) / 60;
    END IF;

    -- Time to pick up patient
    IF r.started_at IS NOT NULL AND r.picked_up_at IS NOT NULL THEN
        pickup_duration_minutes := EXTRACT(EPOCH FROM (r.picked_up_at - r.started_at)) / 60;
    END IF;

    -- Time from pickup to arrival
    IF r.picked_up_at IS NOT NULL AND r.arrived_at IS NOT NULL THEN
        transport_duration_minutes := EXTRACT(EPOCH FROM (r.arrived_at - r.picked_up_at)) / 60;
    END IF;

    -- Waiting time at destination (if tracked)
    IF r.arrived_at IS NOT NULL AND r.completed_at IS NOT NULL THEN
        waiting_duration_minutes := EXTRACT(EPOCH FROM (r.completed_at - r.arrived_at)) / 60;
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CREATE VIEW FOR ACTIVE RIDES (FOR REAL-TIME DASHBOARD)
-- =============================================================================

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
    -- Calculate ETA based on current status
    CASE
        WHEN r.substatus = 'en_route_pickup' THEN
            r.pickup_time + (r.estimated_duration || ' minutes')::INTERVAL
        WHEN r.substatus = 'en_route_destination' THEN
            r.arrival_time
        ELSE NULL
    END as eta,
    -- Driver info
    d.first_name as driver_first_name,
    d.last_name as driver_last_name,
    d.phone as driver_phone,
    -- Patient info
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.phone as patient_phone,
    -- Destination info
    dest.name as destination_name
FROM rides r
LEFT JOIN drivers d ON r.driver_id = d.id
LEFT JOIN patients p ON r.patient_id = p.id
LEFT JOIN destinations dest ON r.destination_id = dest.id
WHERE r.status IN ('confirmed', 'in_progress')
  AND r.pickup_time::DATE = CURRENT_DATE
ORDER BY r.pickup_time;

-- Grant access to the view
GRANT SELECT ON active_rides_view TO authenticated;
