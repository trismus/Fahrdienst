-- =============================================================================
-- AUDIT LOGGING - GDPR/FADP Compliance
-- Tracks all data access and modifications for patient data
-- =============================================================================

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

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

-- Index for common queries
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Composite index for compliance queries
CREATE INDEX idx_audit_logs_compliance ON audit_logs(table_name, record_id, created_at DESC);

-- =============================================================================
-- AUDIT LOG FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB := NULL;
    new_data JSONB := NULL;
    changed TEXT[] := '{}';
    col TEXT;
BEGIN
    -- Determine action and data
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;

        INSERT INTO audit_logs (
            action,
            table_name,
            record_id,
            user_id,
            user_role,
            old_data,
            new_data,
            changed_fields
        ) VALUES (
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            auth.uid(),
            (SELECT role FROM profiles WHERE id = auth.uid()),
            old_data,
            new_data,
            changed
        );

        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        -- Find changed fields (excluding timestamps)
        FOR col IN SELECT column_name FROM information_schema.columns
                   WHERE table_name = TG_TABLE_NAME
                   AND column_name NOT IN ('updated_at', 'created_at')
        LOOP
            IF old_data->col IS DISTINCT FROM new_data->col THEN
                changed := array_append(changed, col);
            END IF;
        END LOOP;

        -- Only log if something actually changed
        IF array_length(changed, 1) > 0 THEN
            INSERT INTO audit_logs (
                action,
                table_name,
                record_id,
                user_id,
                user_role,
                old_data,
                new_data,
                changed_fields
            ) VALUES (
                'UPDATE',
                TG_TABLE_NAME,
                NEW.id,
                auth.uid(),
                (SELECT role FROM profiles WHERE id = auth.uid()),
                old_data,
                new_data,
                changed
            );
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);

        INSERT INTO audit_logs (
            action,
            table_name,
            record_id,
            user_id,
            user_role,
            old_data,
            new_data,
            changed_fields
        ) VALUES (
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            auth.uid(),
            (SELECT role FROM profiles WHERE id = auth.uid()),
            old_data,
            new_data,
            changed
        );

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ATTACH AUDIT TRIGGERS TO SENSITIVE TABLES
-- =============================================================================

-- Patients (contains health data - GDPR relevant)
DROP TRIGGER IF EXISTS audit_patients ON patients;
CREATE TRIGGER audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Drivers (contains personal data)
DROP TRIGGER IF EXISTS audit_drivers ON drivers;
CREATE TRIGGER audit_drivers
    AFTER INSERT OR UPDATE OR DELETE ON drivers
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Destinations (less sensitive but still tracked)
DROP TRIGGER IF EXISTS audit_destinations ON destinations;
CREATE TRIGGER audit_destinations
    AFTER INSERT OR UPDATE OR DELETE ON destinations
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Profiles (role changes are security-relevant)
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- =============================================================================
-- RLS FOR AUDIT LOGS
-- =============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- No one can modify audit logs directly (immutable)
CREATE POLICY "Audit logs are immutable"
    ON audit_logs FOR INSERT
    TO authenticated
    USING (false);

-- Service role can insert (for the trigger function)
CREATE POLICY "Service role can insert audit logs"
    ON audit_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- =============================================================================
-- AUDIT LOG QUERY HELPERS
-- =============================================================================

-- Function to get audit history for a specific record
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
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Only admins can view audit logs';
    END IF;

    RETURN QUERY
    SELECT
        al.action,
        al.changed_fields,
        al.user_id,
        al.user_role,
        al.created_at,
        al.old_data,
        al.new_data
    FROM audit_logs al
    WHERE al.table_name = p_table_name
    AND al.record_id = p_record_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all changes by a specific user
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
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Only admins can view audit logs';
    END IF;

    RETURN QUERY
    SELECT
        al.action,
        al.table_name,
        al.record_id,
        al.changed_fields,
        al.created_at
    FROM audit_logs al
    WHERE al.user_id = p_user_id
    AND al.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- AUDIT LOG RETENTION POLICY
-- Keeping logs for 7 years (Swiss legal requirement for medical data)
-- =============================================================================

-- Function to purge old audit logs (should be run via cron job)
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

-- Grant execute to service role only
REVOKE ALL ON FUNCTION purge_old_audit_logs FROM PUBLIC;
GRANT EXECUTE ON FUNCTION purge_old_audit_logs TO service_role;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for GDPR/FADP compliance. Records all changes to sensitive data.';
COMMENT ON FUNCTION audit_log_changes IS 'Trigger function that automatically logs all INSERT, UPDATE, DELETE operations.';
COMMENT ON FUNCTION get_audit_history IS 'Returns audit history for a specific record. Admin access only.';
COMMENT ON FUNCTION get_user_audit_trail IS 'Returns all actions performed by a specific user. Admin access only.';
COMMENT ON FUNCTION purge_old_audit_logs IS 'Removes audit logs older than retention period. Service role only.';
