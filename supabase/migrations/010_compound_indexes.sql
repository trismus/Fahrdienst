-- Migration: 010_compound_indexes.sql
-- Purpose: Add compound indexes for common query patterns
--
-- These indexes optimize the most frequent queries:
-- - getDriversWithAvailability(): rides by driver+status, availability by driver+weekday
-- - getRides(): rides by pickup_time+status (date range + status filter)
-- =============================================================================

-- Rides: driver_id + status (used in availability overlap check)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rides_driver_status
    ON rides(driver_id, status);

-- Rides: pickup_time + status (used in getRides with date + status filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rides_pickup_status
    ON rides(pickup_time, status);

-- Availability blocks: driver_id + weekday (used in availability check)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_driver_weekday
    ON availability_blocks(driver_id, weekday);

-- Absences: driver_id + date range (used in absence overlap check)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_absences_driver_dates
    ON absences(driver_id, from_date, to_date);
