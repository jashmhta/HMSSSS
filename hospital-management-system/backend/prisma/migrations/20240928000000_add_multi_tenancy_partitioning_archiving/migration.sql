-- Migration: Add multi-tenancy, partitioning, archiving, and performance optimizations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_partman";

-- Add tenant_id columns to existing tables
ALTER TABLE users ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE patients ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE doctors ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE appointments ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE medical_records ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE prescriptions ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE lab_test_catalog ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE lab_tests ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE radiology_tests ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE bills ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE emergency_visits ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE opd_visits ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE operating_theaters ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE ipd_admissions ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE audit_logs ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE notifications ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';

-- Add archiving columns
ALTER TABLE patients ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE doctors ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE doctors ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE appointments ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE medical_records ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE medical_records ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE prescriptions ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE prescriptions ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE lab_test_catalog ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE lab_test_catalog ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE lab_tests ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE lab_tests ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE radiology_tests ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE radiology_tests ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE bills ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bills ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE emergency_visits ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE emergency_visits ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE opd_visits ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE opd_visits ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE operating_theaters ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE operating_theaters ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE ipd_admissions ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ipd_admissions ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE audit_logs ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE audit_logs ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE notifications ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN archived_at TIMESTAMPTZ;

-- Create indexes for tenant_id and archiving
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_patients_tenant_mrn ON patients(tenant_id, mrn);
CREATE INDEX idx_patients_is_archived ON patients(is_archived);
CREATE INDEX idx_doctors_tenant_id ON doctors(tenant_id);
CREATE INDEX idx_doctors_is_archived ON doctors(is_archived);
CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, appointment_date);
CREATE INDEX idx_appointments_is_archived ON appointments(is_archived);
CREATE INDEX idx_medical_records_tenant_id ON medical_records(tenant_id);
CREATE INDEX idx_medical_records_tenant_date ON medical_records(tenant_id, visit_date);
CREATE INDEX idx_medical_records_is_archived ON medical_records(is_archived);
CREATE INDEX idx_prescriptions_tenant_id ON prescriptions(tenant_id);
CREATE INDEX idx_prescriptions_is_archived ON prescriptions(is_archived);
CREATE INDEX idx_lab_test_catalog_tenant_id ON lab_test_catalog(tenant_id);
CREATE INDEX idx_lab_test_catalog_is_archived ON lab_test_catalog(is_archived);
CREATE INDEX idx_lab_tests_tenant_id ON lab_tests(tenant_id);
CREATE INDEX idx_lab_tests_is_archived ON lab_tests(is_archived);
CREATE INDEX idx_radiology_tests_tenant_id ON radiology_tests(tenant_id);
CREATE INDEX idx_radiology_tests_is_archived ON radiology_tests(is_archived);
CREATE INDEX idx_bills_tenant_id ON bills(tenant_id);
CREATE INDEX idx_bills_is_archived ON bills(is_archived);
CREATE INDEX idx_emergency_visits_tenant_id ON emergency_visits(tenant_id);
CREATE INDEX idx_emergency_visits_is_archived ON emergency_visits(is_archived);
CREATE INDEX idx_opd_visits_tenant_id ON opd_visits(tenant_id);
CREATE INDEX idx_opd_visits_is_archived ON opd_visits(is_archived);
CREATE INDEX idx_operating_theaters_tenant_id ON operating_theaters(tenant_id);
CREATE INDEX idx_operating_theaters_is_archived ON operating_theaters(is_archived);
CREATE INDEX idx_ipd_admissions_tenant_id ON ipd_admissions(tenant_id);
CREATE INDEX idx_ipd_admissions_is_archived ON ipd_admissions(is_archived);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_tenant_timestamp ON audit_logs(tenant_id, timestamp);
CREATE INDEX idx_audit_logs_is_archived ON audit_logs(is_archived);
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_is_archived ON notifications(is_archived);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE opd_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipd_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example for tenant isolation)
CREATE POLICY tenant_isolation_users ON users FOR ALL USING (tenant_id = current_setting('app.tenant_id', TRUE));
CREATE POLICY tenant_isolation_patients ON patients FOR ALL USING (tenant_id = current_setting('app.tenant_id', TRUE));
-- Repeat for other tables...

-- Partitioning setup for large tables
-- Appointments: partition by month
CREATE TABLE appointments_y2024m09 PARTITION OF appointments FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE appointments_y2024m10 PARTITION OF appointments FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
-- Add more partitions as needed

-- Medical Records: partition by month
CREATE TABLE medical_records_y2024m09 PARTITION OF medical_records FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
-- Add more

-- Audit Logs: partition by month
CREATE TABLE audit_logs_y2024m09 PARTITION OF audit_logs FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
-- Add more

-- Create archive tables (example for patients)
CREATE TABLE patients_archive (
    LIKE patients INCLUDING ALL
);

-- Automated archiving function
CREATE OR REPLACE FUNCTION archive_old_data() RETURNS void AS $$
BEGIN
    -- Archive patients older than 5 years
    INSERT INTO patients_archive SELECT * FROM patients WHERE created_at < NOW() - INTERVAL '5 years' AND NOT is_archived;
    UPDATE patients SET is_archived = TRUE, archived_at = NOW() WHERE created_at < NOW() - INTERVAL '5 years' AND NOT is_archived;
    DELETE FROM patients WHERE is_archived = TRUE;

    -- Similar for other tables
END;
$$ LANGUAGE plpgsql;

-- Schedule archiving (requires pg_cron extension)
-- SELECT cron.schedule('archive-old-data', '0 2 * * *', 'SELECT archive_old_data();');

-- Performance optimizations: additional indexes
CREATE INDEX CONCURRENTLY idx_appointments_patient_date ON appointments(patient_id, appointment_date);
CREATE INDEX CONCURRENTLY idx_medical_records_patient_date ON medical_records(patient_id, visit_date);
CREATE INDEX CONCURRENTLY idx_lab_tests_patient_ordered ON lab_tests(patient_id, ordered_date);
CREATE INDEX CONCURRENTLY idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);

-- Read replicas: Ensure DATABASE_URL includes replicas
-- Example: postgresql://user:pass@primary:5432,replica1:5432,replica2:5432/db?targetServerType=preferSecondary