-- Row Level Security (RLS) Policies for Hospital Management System
-- Execute these policies after running Prisma migrations

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE opd_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgeries ENABLE ROW LEVEL SECURITY;

-- Create roles for RLS
-- These roles should match your application roles
CREATE ROLE IF NOT EXISTS hms_superadmin;
CREATE ROLE IF NOT EXISTS hms_admin;
CREATE ROLE IF NOT EXISTS hms_doctor;
CREATE ROLE IF NOT EXISTS hms_nurse;
CREATE ROLE IF NOT EXISTS hms_receptionist;
CREATE ROLE IF NOT EXISTS hms_lab_technician;
CREATE ROLE IF NOT EXISTS hms_pharmacist;
CREATE ROLE IF NOT EXISTS hms_patient;

-- Users table policies
CREATE POLICY users_superadmin_policy ON users
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY users_admin_policy ON users
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY users_doctor_policy ON users
  FOR SELECT USING (current_setting('app.current_user_role', true) = 'DOCTOR');

CREATE POLICY users_own_record ON users
  FOR ALL USING (id = current_setting('app.current_user_id', true)::text);

-- Patients table policies
CREATE POLICY patients_superadmin_policy ON patients
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY patients_admin_policy ON patients
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY patients_doctor_policy ON patients
  FOR ALL USING (current_setting('app.current_user_role', true) IN ('DOCTOR', 'NURSE'));

CREATE POLICY patients_receptionist_policy ON patients
  FOR SELECT USING (current_setting('app.current_user_role', true) = 'RECEPTIONIST');

CREATE POLICY patients_own_record ON patients
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::text);

-- Doctors table policies
CREATE POLICY doctors_superadmin_policy ON doctors
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY doctors_admin_policy ON doctors
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY doctors_read_policy ON doctors
  FOR SELECT USING (current_setting('app.current_user_role', true) IN ('DOCTOR', 'NURSE', 'RECEPTIONIST'));

-- Appointments table policies
CREATE POLICY appointments_superadmin_policy ON appointments
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY appointments_admin_policy ON appointments
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY appointments_doctor_policy ON appointments
  FOR ALL USING (
    current_setting('app.current_user_role', true) IN ('DOCTOR', 'NURSE') OR
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );

CREATE POLICY appointments_receptionist_policy ON appointments
  FOR ALL USING (current_setting('app.current_user_role', true) = 'RECEPTIONIST');

CREATE POLICY appointments_patient_policy ON appointments
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );

-- Medical Records table policies
CREATE POLICY medical_records_superadmin_policy ON medical_records
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY medical_records_admin_policy ON medical_records
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY medical_records_doctor_policy ON medical_records
  FOR ALL USING (current_setting('app.current_user_role', true) IN ('DOCTOR', 'NURSE'));

CREATE POLICY medical_records_patient_policy ON medical_records
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );

-- Lab Tests table policies
CREATE POLICY lab_tests_superadmin_policy ON lab_tests
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY lab_tests_admin_policy ON lab_tests
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY lab_tests_doctor_policy ON lab_tests
  FOR ALL USING (current_setting('app.current_user_role', true) IN ('DOCTOR', 'NURSE'));

CREATE POLICY lab_tests_lab_technician_policy ON lab_tests
  FOR ALL USING (current_setting('app.current_user_role', true) = 'LAB_TECHNICIAN');

CREATE POLICY lab_tests_patient_policy ON lab_tests
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );

-- Prescriptions table policies
CREATE POLICY prescriptions_superadmin_policy ON prescriptions
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY prescriptions_admin_policy ON prescriptions
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY prescriptions_doctor_policy ON prescriptions
  FOR ALL USING (current_setting('app.current_user_role', true) IN ('DOCTOR', 'NURSE'));

CREATE POLICY prescriptions_pharmacist_policy ON prescriptions
  FOR ALL USING (current_setting('app.current_user_role', true) = 'PHARMACIST');

CREATE POLICY prescriptions_patient_policy ON prescriptions
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );

-- Bills table policies
CREATE POLICY bills_superadmin_policy ON bills
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY bills_admin_policy ON bills
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY bills_patient_policy ON bills
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );

-- OPD Visits table policies
CREATE POLICY opd_visits_superadmin_policy ON opd_visits
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY opd_visits_admin_policy ON opd_visits
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY opd_visits_doctor_policy ON opd_visits
  FOR ALL USING (current_setting('app.current_user_role', true) IN ('DOCTOR', 'NURSE'));

CREATE POLICY opd_visits_receptionist_policy ON opd_visits
  FOR SELECT USING (current_setting('app.current_user_role', true) = 'RECEPTIONIST');

CREATE POLICY opd_visits_patient_policy ON opd_visits
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );

-- Surgeries table policies
CREATE POLICY surgeries_superadmin_policy ON surgeries
  FOR ALL USING (current_setting('app.current_user_role', true) = 'SUPERADMIN');

CREATE POLICY surgeries_admin_policy ON surgeries
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN');

CREATE POLICY surgeries_doctor_policy ON surgeries
  FOR ALL USING (current_setting('app.current_user_role', true) IN ('DOCTOR', 'NURSE'));

-- Function to set RLS context (call this in your application before queries)
CREATE OR REPLACE FUNCTION set_rls_context(user_id text, user_role text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
  PERFORM set_config('app.current_user_role', user_role, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear RLS context
CREATE OR REPLACE FUNCTION clear_rls_context()
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', '', false);
  PERFORM set_config('app.current_user_role', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;