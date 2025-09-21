-- HMS Database Initialization Script
-- This script sets up the initial database structure and configurations

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS hms_db;
\c hms_db;

-- Create application user with limited privileges
CREATE USER IF NOT EXISTS hms_app WITH ENCRYPTED PASSWORD 'hmsadmin';
GRANT CONNECT ON DATABASE hms_db TO hms_app;

-- Create readonly user for reporting
CREATE USER IF NOT EXISTS hms_readonly WITH ENCRYPTED PASSWORD 'hmsadmin';
GRANT CONNECT ON DATABASE hms_db TO hms_readonly;

-- Create admin user for maintenance
CREATE USER IF NOT EXISTS hms_admin WITH ENCRYPTED PASSWORD 'hmsadmin';
GRANT ALL PRIVILEGES ON DATABASE hms_db TO hms_admin;

-- Create monitoring user for Prometheus
CREATE USER IF NOT EXISTS hms_monitor WITH ENCRYPTED PASSWORD 'hmsadmin';
GRANT pg_monitor TO hms_monitor;
GRANT CONNECT ON DATABASE hms_db TO hms_monitor;

-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";
CREATE EXTENSION IF NOT EXISTS "pgstattuple";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS hms;
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant schema permissions
GRANT USAGE ON SCHEMA hms TO hms_app, hms_readonly;
GRANT USAGE ON SCHEMA audit TO hms_app, hms_readonly;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA hms GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hms_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA hms GRANT SELECT ON TABLES TO hms_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT ON TABLES TO hms_app, hms_readonly;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit.audit_trigger_function() RETURNS trigger AS $$
DECLARE
    old_row jsonb;
    new_row jsonb;
    audit_row audit.audit_log;
BEGIN
    IF TG_OP = 'DELETE' THEN
        old_row = row_to_json(OLD)::jsonb;
        new_row = null;
    ELSIF TG_OP = 'UPDATE' THEN
        old_row = row_to_json(OLD)::jsonb;
        new_row = row_to_json(NEW)::jsonb;
    ELSIF TG_OP = 'INSERT' THEN
        old_row = null;
        new_row = row_to_json(NEW)::jsonb;
    END IF;

    INSERT INTO audit.audit_log (
        table_name,
        operation,
        old_values,
        new_values,
        changed_by,
        changed_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        old_row,
        new_row,
        current_user,
        now()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for audit table
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit.audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit.audit_log(operation);

-- Grant permissions on audit table
GRANT SELECT ON audit.audit_log TO hms_readonly;
GRANT SELECT, INSERT ON audit.audit_log TO hms_app;

-- Create health check function
CREATE OR REPLACE FUNCTION hms.health_check() RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'database', 'connected',
        'version', version()
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create performance monitoring view
CREATE OR REPLACE VIEW hms.database_stats AS
SELECT
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Grant permissions on the view
GRANT SELECT ON hms.database_stats TO hms_readonly, hms_app;

-- Create backup verification function
CREATE OR REPLACE FUNCTION hms.verify_backup() RETURNS TABLE (
    table_name text,
    row_count bigint,
    last_modified timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.table_name::text,
        c.reltuples::bigint as row_count,
        GREATEST(
            c.relfrozenxid::text::timestamp with time zone,
            t.last_modified
        ) as last_modified
    FROM information_schema.tables t
    JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'hms'
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up maintenance settings
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Create monitoring role for Prometheus
GRANT pg_monitor TO hms_monitor;

-- Set up connection limits
ALTER USER hms_app CONNECTION LIMIT 100;
ALTER USER hms_readonly CONNECTION LIMIT 50;
ALTER USER hms_monitor CONNECTION LIMIT 10;

-- Create database maintenance job (requires pg_cron extension if available)
-- This would be set up separately if pg_cron is installed
-- SELECT cron.schedule('daily-vacuum', '0 2 * * *', 'VACUUM ANALYZE;');

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'HMS Database initialization completed successfully';
END $$;