-- HMS Database Migration: Multi-Tenancy and Archiving Enhancement
-- Run this migration after updating schema.prisma

BEGIN;

-- Add tenant_id and archiving columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

ALTER TABLE patients ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
-- patients already has is_archived and archived_at

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
-- medical_records already has archiving columns

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

ALTER TABLE radiology_tests ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
ALTER TABLE radiology_tests ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE radiology_tests ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

ALTER TABLE bills ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
-- audit_logs already has archiving columns

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_archived ON users(tenant_id, is_archived);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_tenant_created ON patients(tenant_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_tenant_date ON appointments(tenant_id, appointment_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_records_tenant_patient_date ON medical_records(tenant_id, patient_id, visit_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_action_timestamp ON audit_logs(tenant_id, action, timestamp);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation_patients ON patients
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation_appointments ON appointments
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation_medical_records ON medical_records
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation_prescriptions ON prescriptions
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation_lab_tests ON lab_tests
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation_radiology_tests ON radiology_tests
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation_bills ON bills
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  USING (tenant_id = current_setting('app.tenant_id')::text);

-- Create table partitions for large tables (example for PostgreSQL 12+)
-- Note: Adjust partition ranges based on your data patterns

-- Partition audit_logs by month
CREATE TABLE IF NOT EXISTS audit_logs_y2024m01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE IF NOT EXISTS audit_logs_y2024m02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Partition medical_records by year
CREATE TABLE IF NOT EXISTS medical_records_y2024 PARTITION OF medical_records
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id text) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id, false);
END;
$$ LANGUAGE plpgsql;

-- Create archiving function
CREATE OR REPLACE FUNCTION archive_old_records() RETURNS void AS $$
BEGIN
  -- Archive users inactive for 2+ years
  UPDATE users SET is_archived = TRUE, archived_at = NOW()
  WHERE last_login < NOW() - INTERVAL '2 years' AND is_archived = FALSE;

  -- Archive old medical records (7+ years)
  UPDATE medical_records SET is_archived = TRUE, archived_at = NOW()
  WHERE visit_date < NOW() - INTERVAL '7 years' AND is_archived = FALSE;

  -- Archive old audit logs (2+ years)
  UPDATE audit_logs SET is_archived = TRUE, archived_at = NOW()
  WHERE timestamp < NOW() - INTERVAL '2 years' AND is_archived = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create automated archiving job (requires pg_cron extension)
-- SELECT cron.schedule('archive-old-records', '0 2 * * *', 'SELECT archive_old_records();');

COMMIT;

-- Post-migration validation
-- Run these queries to verify the migration
/*
SELECT schemaname, tablename, attname, atttypid::regtype
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('users', 'patients', 'medical_records', 'audit_logs')
  AND attname IN ('tenant_id', 'is_archived', 'archived_at')
  AND attnum > 0
ORDER BY c.relname, attname;
*/