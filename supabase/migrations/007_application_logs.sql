-- Migration: Application Logs for Fahrdienst App
-- Issue #56, #57: Centralized Logging with Retention Policy
-- Created: 2026-01-29

-- =============================================================================
-- LOG LEVEL ENUM
-- =============================================================================

CREATE TYPE log_level AS ENUM ('info', 'warn', 'error');

-- =============================================================================
-- APPLICATION_LOGS TABLE
-- =============================================================================

CREATE TABLE application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Timestamp when log was created
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Log level (info, warn, error)
    level log_level NOT NULL,

    -- Human-readable message
    message TEXT NOT NULL,

    -- Stack trace for errors (optional)
    stack_trace TEXT,

    -- Source of the log (e.g., 'server-action', 'api-route', 'middleware')
    source TEXT,

    -- Route/endpoint where log originated (e.g., '/api/rides/create')
    route TEXT,

    -- User ID if authenticated (references auth.users for integrity)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Request ID for correlating logs within a single request
    request_id TEXT,

    -- Feature or module name (e.g., 'rides', 'patients', 'sms')
    feature TEXT,

    -- Additional structured metadata (JSONB for flexibility)
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Constraints
    CONSTRAINT message_not_empty CHECK (length(trim(message)) > 0),
    CONSTRAINT metadata_is_object CHECK (jsonb_typeof(metadata) = 'object')
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary query pattern: filter by time range
CREATE INDEX idx_logs_created_at ON application_logs(created_at DESC);

-- Filter by level (most common: finding errors)
CREATE INDEX idx_logs_level ON application_logs(level);

-- Combined index for common query: level + time range
CREATE INDEX idx_logs_level_created_at ON application_logs(level, created_at DESC);

-- Filter by source/route for debugging specific endpoints
CREATE INDEX idx_logs_source ON application_logs(source) WHERE source IS NOT NULL;
CREATE INDEX idx_logs_route ON application_logs(route) WHERE route IS NOT NULL;

-- Find logs by user
CREATE INDEX idx_logs_user_id ON application_logs(user_id) WHERE user_id IS NOT NULL;

-- Correlate logs by request
CREATE INDEX idx_logs_request_id ON application_logs(request_id) WHERE request_id IS NOT NULL;

-- Feature-based filtering
CREATE INDEX idx_logs_feature ON application_logs(feature) WHERE feature IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs (security-sensitive data)
-- Note: Uses existing get_user_role() function from 001_master_data.sql
CREATE POLICY "Only admins can read logs"
    ON application_logs FOR SELECT
    TO authenticated
    USING (get_user_role() = 'admin');

-- Service role can insert logs (for server-side logging)
-- Note: anon/authenticated users write via service role, not directly
CREATE POLICY "Service role can insert logs"
    ON application_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Authenticated users can insert logs (fallback if service role unavailable)
-- This allows the application to log even without admin client
CREATE POLICY "Authenticated users can insert logs"
    ON application_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- No update or delete via regular queries - use cleanup function
-- Admins should not modify logs (audit trail integrity)

-- =============================================================================
-- RETENTION POLICY: CLEANUP FUNCTION
-- =============================================================================

-- Function to clean up old logs based on retention policy
-- Keeps max 10,000 entries OR entries from last 30 days, whichever is smaller
CREATE OR REPLACE FUNCTION cleanup_application_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    cutoff_date TIMESTAMPTZ;
    total_count INTEGER;
    excess_count INTEGER;
BEGIN
    -- Strategy 1: Delete entries older than 30 days
    cutoff_date := NOW() - INTERVAL '30 days';

    DELETE FROM application_logs
    WHERE created_at < cutoff_date;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Strategy 2: If still over 10,000 entries, delete oldest
    SELECT COUNT(*) INTO total_count FROM application_logs;

    IF total_count > 10000 THEN
        excess_count := total_count - 10000;

        -- Delete oldest entries beyond the 10,000 limit
        DELETE FROM application_logs
        WHERE id IN (
            SELECT id FROM application_logs
            ORDER BY created_at ASC
            LIMIT excess_count
        );

        GET DIAGNOSTICS excess_count = ROW_COUNT;
        deleted_count := deleted_count + excess_count;
    END IF;

    -- Log the cleanup action itself (meta-logging)
    IF deleted_count > 0 THEN
        INSERT INTO application_logs (level, message, source, metadata)
        VALUES (
            'info',
            'Log cleanup completed',
            'database',
            jsonb_build_object('deleted_count', deleted_count, 'trigger', 'scheduled_cleanup')
        );
    END IF;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SCHEDULED CLEANUP (using pg_cron if available)
-- =============================================================================

-- Note: pg_cron must be enabled in Supabase Dashboard under Database > Extensions
-- If pg_cron is not available, the cleanup must be triggered via external cron (e.g., Vercel Cron)

-- Uncomment if pg_cron is enabled:
-- SELECT cron.schedule(
--     'daily-log-cleanup',
--     '0 3 * * *',  -- Run at 3 AM UTC daily
--     'SELECT cleanup_application_logs()'
-- );

-- =============================================================================
-- HELPER FUNCTION: GET LOG STATS
-- =============================================================================

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
        COUNT(*)::BIGINT as total_count,
        COUNT(*) FILTER (WHERE level = 'error')::BIGINT as error_count,
        COUNT(*) FILTER (WHERE level = 'warn')::BIGINT as warn_count,
        COUNT(*) FILTER (WHERE level = 'info')::BIGINT as info_count,
        MIN(created_at) as oldest_log,
        MAX(created_at) as newest_log
    FROM application_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE application_logs IS 'Centralized application logging with automatic retention policy';
COMMENT ON COLUMN application_logs.level IS 'Log severity: info (normal operation), warn (potential issues), error (failures)';
COMMENT ON COLUMN application_logs.source IS 'Code location: server-action, api-route, middleware, database';
COMMENT ON COLUMN application_logs.route IS 'HTTP route or server action name where log originated';
COMMENT ON COLUMN application_logs.request_id IS 'UUID to correlate multiple logs from same request';
COMMENT ON COLUMN application_logs.feature IS 'Feature/module name for grouping: rides, patients, sms, auth';
COMMENT ON COLUMN application_logs.metadata IS 'Additional structured context, auto-sanitized for secrets';
COMMENT ON FUNCTION cleanup_application_logs() IS 'Retention policy: keeps max 10,000 logs or 30 days, whichever is smaller. Run daily.';
