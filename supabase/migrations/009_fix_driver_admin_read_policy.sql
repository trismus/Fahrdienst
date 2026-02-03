-- Migration: 009_fix_driver_admin_read_policy.sql
-- Purpose: Remove is_active filter from admin driver read policy
--
-- SECURITY FIX: Admin/Operator could not view inactive (soft-deleted) drivers.
-- This prevents admins from accessing historical records needed for:
-- - Audit/compliance reviews
-- - GDPR data subject access requests
-- - Historical ride analysis
--
-- The is_active filter should be handled at the application layer, not RLS.
-- =============================================================================

-- Fix Admin/Operator driver read policy (remove is_active filter)
DROP POLICY IF EXISTS "Admin/Operator can read all drivers" ON drivers;

CREATE POLICY "Admin/Operator can read all drivers"
    ON drivers FOR SELECT
    TO authenticated
    USING (is_admin_or_operator());

-- Note: The driver's own-record policy keeps is_active = TRUE,
-- which is correct (drivers should not see their deactivated record)
