import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestApp, setupTestEnvironment, teardownTestEnvironment, createAuthHelper, TestDataBuilder, TestAssertions, TestSecurity, generateTestData } from '../test-helpers';
import { TestDatabaseManager, setupTestDatabase, teardownTestDatabase } from '../test-database.config';

describe('Patients Integration Tests', () => {
  let app: TestApp;
  let authHelper: any;
  let testDbManager: TestDatabaseManager;

  beforeAll(async () => {
    await setupTestDatabase();
    testDbManager = new TestDatabaseManager();
    await testDbManager.initialize();

    app = await setupTestEnvironment();
    authHelper = await createAuthHelper(app);
  });

  afterAll(async () => {
    await teardownTestEnvironment(app);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await testDbManager.clearDatabase();
    await authHelper.createTestUsers();
  });

  describe('POST /api/patients', () => {
    it('should create patient successfully', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const patientData = TestDataBuilder.patient();

      const response = await app.post('/api/patients', patientData, authHeaders);

      TestAssertions.expectSuccess(response, 201);
      TestAssertions.expectValidPatient(response.body.data);
      expect(response.body.data.email).toBe(patientData.email);
      expect(response.body.data.firstName).toBe(patientData.firstName);
      expect(response.body.data.lastName).toBe(patientData.lastName);
    });

    it('should create patient with minimal required fields', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const minimalPatient = {
        firstName: 'Minimal',
        lastName: 'Patient',
        email: `minimal.${Date.now()}@test.com`,
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
      };

      const response = await app.post('/api/patients', minimalPatient, authHeaders);

      TestAssertions.expectSuccess(response, 201);
      TestAssertions.expectValidPatient(response.body.data);
    });

    it('should reject patient creation without authentication', async () => {
      const patientData = TestDataBuilder.patient();

      const response = await app.post('/api/patients', patientData);

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should reject patient creation without proper authorization', async () => {
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');
      const patientData = TestDataBuilder.patient();

      const response = await app.post('/api/patients', patientData, patientHeaders);

      TestSecurity.expectAuthorizationRequired(response);
    });

    it('should validate required fields', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const invalidPatient = {
        // Missing required fields
        firstName: 'Test',
      };

      const response = await app.post('/api/patients', invalidPatient, authHeaders);

      TestAssertions.expectError(response, 400);
    });

    it('should validate email format', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const invalidEmailPatient = TestDataBuilder.patient({
        email: 'invalid-email',
      });

      const response = await app.post('/api/patients', invalidEmailPatient, authHeaders);

      TestAssertions.expectError(response, 400);
    });

    it('should validate phone format', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const invalidPhonePatient = TestDataBuilder.patient({
        phone: 'invalid-phone',
      });

      const response = await app.post('/api/patients', invalidPhonePatient, authHeaders);

      TestAssertions.expectError(response, 400);
    });

    it('should validate date format', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const invalidDatePatient = TestDataBuilder.patient({
        dateOfBirth: 'invalid-date',
      });

      const response = await app.post('/api/patients', invalidDatePatient, authHeaders);

      TestAssertions.expectError(response, 400);
    });

    it('should validate gender enum', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const invalidGenderPatient = TestDataBuilder.patient({
        gender: 'INVALID_GENDER',
      });

      const response = await app.post('/api/patients', invalidGenderPatient, authHeaders);

      TestAssertions.expectError(response, 400);
    });

    it('should prevent duplicate email addresses', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const patientData = TestDataBuilder.patient();

      // Create first patient
      const firstResponse = await app.post('/api/patients', patientData, authHeaders);
      TestAssertions.expectSuccess(firstResponse, 201);

      // Try to create patient with same email
      const duplicateResponse = await app.post('/api/patients', patientData, authHeaders);

      TestAssertions.expectError(duplicateResponse, 409, 'Email already exists');
    });

    it('should sanitize input data', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const xssPatient = TestDataBuilder.patient({
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        email: 'xss@test.com',
        medicalHistory: '<script>alert("medical xss")</script>',
      });

      const response = await app.post('/api/patients', xssPatient, authHeaders);

      TestAssertions.expectSuccess(response, 201);
      expect(response.body.data.firstName).not.toContain('<script>');
      expect(response.body.data.medicalHistory).not.toContain('<script>');
    });

    it('should handle file upload with patient creation', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const patientData = TestDataBuilder.patient();

      // Create mock file
      const mockFile = Buffer.from('test file content');
      const formData = new FormData();
      formData.append('photo', new Blob([mockFile], { type: 'image/jpeg' }), 'photo.jpg');
      formData.append('data', JSON.stringify(patientData));

      const response = await fetch(`${app.getApp().getHttpServer()}/api/patients`, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.data).toHaveProperty('photoUrl');
    });

    it('should validate file uploads', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const patientData = TestDataBuilder.patient();

      // Try to upload executable file
      const maliciousFile = Buffer.from('malicious content');
      const formData = new FormData();
      formData.append('photo', new Blob([maliciousFile], { type: 'application/exe' }), 'malware.exe');
      formData.append('data', JSON.stringify(patientData));

      const response = await fetch(`${app.getApp().getHttpServer()}/api/patients`, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('GET /api/patients', () => {
    beforeEach(async () => {
      // Create test patients
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      for (let i = 0; i < 5; i++) {
        await app.post('/api/patients', TestDataBuilder.patient(), authHeaders);
      }
    });

    it('should list patients with authentication', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get('/api/patients', authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      TestAssertions.expectPagination(response.body);
    });

    it('should reject patient listing without authentication', async () => {
      const response = await app.get('/api/patients');

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should support pagination', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get('/api/patients?page=1&limit=2', authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
      expect(response.body.meta.totalPages).toBeGreaterThan(0);
    });

    it('should support search functionality', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create specific patient
      await app.post('/api/patients', TestDataBuilder.patient({
        firstName: 'Searchable',
        lastName: 'Patient',
      }), authHeaders);

      const response = await app.get('/api/patients?search=Searchable', authHeaders);

      TestAssertions.expectSuccess(response, 200);
      const foundPatient = response.body.data.find((p: any) =>
        p.firstName.includes('Searchable') || p.lastName.includes('Searchable')
      );
      expect(foundPatient).toBeDefined();
    });

    it('should support filtering by various criteria', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create patients with different blood types
      await app.post('/api/patients', TestDataBuilder.patient({
        firstName: 'TypeA',
        bloodType: 'A+',
      }), authHeaders);

      await app.post('/api/patients', TestDataBuilder.patient({
        firstName: 'TypeO',
        bloodType: 'O+',
      }), authHeaders);

      const response = await app.get('/api/patients?bloodType=A+', authHeaders);

      TestAssertions.expectSuccess(response, 200);
      response.body.data.forEach((patient: any) => {
        expect(patient.bloodType).toBe('A+');
      });
    });

    it('should support sorting', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get('/api/patients?sortBy=firstName&order=asc', authHeaders);

      TestAssertions.expectSuccess(response, 200);
      const patients = response.body.data;

      // Check if sorted by firstName
      for (let i = 1; i < patients.length; i++) {
        expect(patients[i - 1].firstName <= patients[i].firstName).toBe(true);
      }
    });

    it('should handle empty results', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get('/api/patients?search=NonExistentPatient', authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta.total).toBe(0);
    });

    it('should respect role-based access', async () => {
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');

      const response = await app.get('/api/patients', patientHeaders);

      // Patients might only see their own data
      TestAssertions.expectSuccess(response, 200);
      // In a real system, this would return only the patient's own record
    });
  });

  describe('GET /api/patients/:id', () => {
    let testPatient: any;

    beforeEach(async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const response = await app.post('/api/patients', TestDataBuilder.patient(), authHeaders);
      testPatient = response.body.data;
    });

    it('should retrieve patient by ID', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get(`/api/patients/${testPatient.id}`, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      TestAssertions.expectValidPatient(response.body.data);
      expect(response.body.data.id).toBe(testPatient.id);
    });

    it('should reject retrieval without authentication', async () => {
      const response = await app.get(`/api/patients/${testPatient.id}`);

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should handle non-existent patient', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get('/api/patients/non-existent-id', authHeaders);

      TestAssertions.expectError(response, 404);
    });

    it('should validate patient ID format', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get('/api/patients/invalid-id-format', authHeaders);

      TestAssertions.expectError(response, 400);
    });

    it('should respect data ownership', async () => {
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');

      const response = await app.get(`/api/patients/${testPatient.id}`, patientHeaders);

      // Patient should not access other patients' data
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('PUT /api/patients/:id', () => {
    let testPatient: any;

    beforeEach(async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const response = await app.post('/api/patients', TestDataBuilder.patient(), authHeaders);
      testPatient = response.body.data;
    });

    it('should update patient successfully', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const updateData = {
        firstName: 'Updated',
        lastName: 'Patient',
        phone: '+1987654321',
        address: '456 Updated St',
      };

      const response = await app.put(`/api/patients/${testPatient.id}`, updateData, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      TestAssertions.expectValidPatient(response.body.data);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Patient');
      expect(response.body.data.phone).toBe('+1987654321');
      expect(response.body.data.address).toBe('456 Updated St');
    });

    it('should allow partial updates', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const partialUpdate = {
        phone: '+1555555555',
      };

      const response = await app.put(`/api/patients/${testPatient.id}`, partialUpdate, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(response.body.data.phone).toBe('+1555555555');
      // Other fields should remain unchanged
      expect(response.body.data.firstName).toBe(testPatient.firstName);
    });

    it('should reject update without authentication', async () => {
      const updateData = { firstName: 'Updated' };

      const response = await app.put(`/api/patients/${testPatient.id}`, updateData);

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should reject update without proper authorization', async () => {
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');
      const updateData = { firstName: 'Updated' };

      const response = await app.put(`/api/patients/${testPatient.id}`, updateData, patientHeaders);

      expect([403, 404]).toContain(response.status);
    });

    it('should validate update data', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const invalidUpdate = {
        email: 'invalid-email',
        phone: 'invalid-phone',
      };

      const response = await app.put(`/api/patients/${testPatient.id}`, invalidUpdate, authHeaders);

      TestAssertions.expectError(response, 400);
    });

    it('should prevent email duplication on update', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create another patient
      const otherPatientResponse = await app.post('/api/patients', TestDataBuilder.patient(), authHeaders);
      const otherPatient = otherPatientResponse.body.data;

      // Try to update first patient with second patient's email
      const updateData = { email: otherPatient.email };
      const response = await app.put(`/api/patients/${testPatient.id}`, updateData, authHeaders);

      TestAssertions.expectError(response, 409, 'Email already exists');
    });

    it('should handle concurrent updates optimistically', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Get current patient data
      const getCurrentResponse = await app.get(`/api/patients/${testPatient.id}`, authHeaders);
      const currentData = getCurrentResponse.body.data;

      // Simulate concurrent updates
      const update1 = app.put(`/api/patients/${testPatient.id}`, {
        ...currentData,
        firstName: 'Update1',
        version: currentData.version,
      }, authHeaders);

      const update2 = app.put(`/api/patients/${testPatient.id}`, {
        ...currentData,
        firstName: 'Update2',
        version: currentData.version,
      }, authHeaders);

      const [response1, response2] = await Promise.allSettled([update1, update2]);

      // One should succeed, one should fail due to version conflict
      expect([response1, response2].some(r => r.status === 'fulfilled' && r.value.status === 200)).toBe(true);
      expect([response1, response2].some(r => r.status === 'rejected' || r.value.status === 409)).toBe(true);
    });
  });

  describe('DELETE /api/patients/:id', () => {
    let testPatient: any;

    beforeEach(async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const response = await app.post('/api/patients', TestDataBuilder.patient(), authHeaders);
      testPatient = response.body.data;
    });

    it('should delete patient successfully', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.delete(`/api/patients/${testPatient.id}`, authHeaders);

      TestAssertions.expectSuccess(response, 200);

      // Verify patient is deleted
      const getResponse = await app.get(`/api/patients/${testPatient.id}`, authHeaders);
      TestAssertions.expectError(getResponse, 404);
    });

    it('should reject deletion without authentication', async () => {
      const response = await app.delete(`/api/patients/${testPatient.id}`);

      TestSecurity.expectAuthenticationRequired(response);
    });

    it('should reject deletion without proper authorization', async () => {
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');

      const response = await app.delete(`/api/patients/${testPatient.id}`, patientHeaders);

      expect([403, 404]).toContain(response.status);
    });

    it('should handle non-existent patient deletion', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.delete('/api/patients/non-existent-id', authHeaders);

      TestAssertions.expectError(response, 404);
    });

    it('should prevent deletion of patient with active appointments', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create appointment for patient
      const doctor = await testDbManager.getTestUser('DOCTOR');
      await app.post('/api/appointments', {
        patientId: testPatient.id,
        doctorId: doctor.id,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        appointmentTime: '09:00',
        duration: 30,
        status: 'SCHEDULED',
        type: 'GENERAL_CONSULTATION',
      }, authHeaders);

      const response = await app.delete(`/api/patients/${testPatient.id}`, authHeaders);

      TestAssertions.expectError(response, 400, 'Cannot delete patient with active appointments');
    });

    it('should handle cascade deletion properly', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create medical record for patient
      const doctor = await testDbManager.getTestUser('DOCTOR');
      await app.post('/api/medical-records', {
        patientId: testPatient.id,
        doctorId: doctor.id,
        diagnosis: 'Test diagnosis',
        treatment: 'Test treatment',
        visitDate: new Date(),
      }, authHeaders);

      // Delete patient
      const deleteResponse = await app.delete(`/api/patients/${testPatient.id}`, authHeaders);
      TestAssertions.expectSuccess(deleteResponse, 200);

      // Verify related records are also deleted or handled appropriately
      const recordsResponse = await app.get(`/api/medical-records?patientId=${testPatient.id}`, authHeaders);
      expect(recordsResponse.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/patients/:id/medical-history', () => {
    let testPatient: any;

    beforeEach(async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const patientResponse = await app.post('/api/patients', TestDataBuilder.patient(), authHeaders);
      testPatient = patientResponse.body.data;

      const doctor = await testDbManager.getTestUser('DOCTOR');

      // Create medical records
      for (let i = 0; i < 3; i++) {
        await app.post('/api/medical-records', {
          patientId: testPatient.id,
          doctorId: doctor.id,
          diagnosis: `Diagnosis ${i + 1}`,
          treatment: `Treatment ${i + 1}`,
          visitDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }, authHeaders);
      }
    });

    it('should retrieve patient medical history', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get(`/api/patients/${testPatient.id}/medical-history`, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((record: any) => {
        expect(record).toHaveProperty('id');
        expect(record).toHaveProperty('diagnosis');
        expect(record).toHaveProperty('treatment');
        expect(record).toHaveProperty('visitDate');
      });
    });

    it('should respect data ownership', async () => {
      const patientHeaders = authHelper.getAuthHeaders('PATIENT');

      const response = await app.get(`/api/patients/${testPatient.id}/medical-history`, patientHeaders);

      expect([403, 404]).toContain(response.status);
    });

    it('should support filtering by date range', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const response = await app.get(
        `/api/patients/${testPatient.id}/medical-history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        authHeaders
      );

      TestAssertions.expectSuccess(response, 200);
      response.body.data.forEach((record: any) => {
        const recordDate = new Date(record.visitDate);
        expect(recordDate >= startDate && recordDate <= endDate).toBe(true);
      });
    });
  });

  describe('GET /api/patients/:id/appointments', () => {
    let testPatient: any;

    beforeEach(async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const patientResponse = await app.post('/api/patients', TestDataBuilder.patient(), authHeaders);
      testPatient = patientResponse.data;

      const doctor = await testDbManager.getTestUser('DOCTOR');

      // Create appointments
      for (let i = 0; i < 3; i++) {
        await app.post('/api/appointments', {
          patientId: testPatient.id,
          doctorId: doctor.id,
          appointmentDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          appointmentTime: '09:00',
          duration: 30,
          status: 'SCHEDULED',
          type: 'GENERAL_CONSULTATION',
        }, authHeaders);
      }
    });

    it('should retrieve patient appointments', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get(`/api/patients/${testPatient.id}/appointments`, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((appointment: any) => {
        TestAssertions.expectValidAppointment(appointment);
      });
    });

    it('should support filtering by appointment status', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get(`/api/patients/${testPatient.id}/appointments?status=SCHEDULED`, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      response.body.data.forEach((appointment: any) => {
        expect(appointment.status).toBe('SCHEDULED');
      });
    });

    it('should support sorting by appointment date', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get(`/api/patients/${testPatient.id}/appointments?sortBy=appointmentDate&order=asc`, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      const appointments = response.body.data;

      for (let i = 1; i < appointments.length; i++) {
        expect(new Date(appointments[i - 1].appointmentDate) <= new Date(appointments[i].appointmentDate)).toBe(true);
      }
    });
  });

  describe('GET /api/patients/:id/billing', () => {
    let testPatient: any;

    beforeEach(async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const patientResponse = await app.post('/api/patients', TestDataBuilder.patient(), authHeaders);
      testPatient = patientResponse.data;

      // Create billing records
      for (let i = 0; i < 3; i++) {
        await app.post('/api/billing', {
          patientId: testPatient.id,
          amount: 100 + i * 50,
          description: `Billing item ${i + 1}`,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }, authHeaders);
      }
    });

    it('should retrieve patient billing information', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get(`/api/patients/${testPatient.id}/billing`, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((billing: any) => {
        TestAssertions.expectValidBilling(billing);
      });
    });

    it('should calculate total balance', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const response = await app.get(`/api/patients/${testPatient.id}/billing`, authHeaders);

      TestAssertions.expectSuccess(response, 200);
      expect(response.body).toHaveProperty('totalBalance');
      expect(typeof response.body.totalBalance).toBe('number');
      expect(response.body.totalBalance).toBeGreaterThan(0);
    });
  });

  describe('Bulk Operations', () => {
    describe('POST /api/patients/bulk-import', () => {
      it('should import patients from CSV file', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        // Create CSV content
        const csvContent = `firstName,lastName,email,phone,dateOfBirth,gender,bloodType
Test1,Patient1,test1@test.com,+1234567890,1990-01-01,MALE,A+
Test2,Patient2,test2@test.com,+1234567891,1991-02-02,FEMALE,B+
Test3,Patient3,test3@test.com,+1234567892,1992-03-03,MALE,O+`;

        const formData = new FormData();
        formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'patients.csv');

        const response = await fetch(`${app.getApp().getHttpServer()}/api/patients/bulk-import`, {
          method: 'POST',
          headers: {
            ...authHeaders,
          },
          body: formData,
        });

        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData).toHaveProperty('imported');
        expect(responseData.imported).toBeGreaterThan(0);
        expect(responseData).toHaveProperty('errors');
      });

      it('should validate CSV format', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        // Invalid CSV
        const invalidCsvContent = `invalid,csv,content`;

        const formData = new FormData();
        formData.append('file', new Blob([invalidCsvContent], { type: 'text/csv' }), 'invalid.csv');

        const response = await fetch(`${app.getApp().getHttpServer()}/api/patients/bulk-import`, {
          method: 'POST',
          headers: {
            ...authHeaders,
          },
          body: formData,
        });

        expect([400, 422]).toContain(response.status);
      });

      it('should require admin privileges', async () => {
        const patientHeaders = authHelper.getAuthHeaders('PATIENT');

        const csvContent = 'firstName,lastName,email\nTest,Patient,test@test.com';
        const formData = new FormData();
        formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'patients.csv');

        const response = await fetch(`${app.getApp().getHttpServer()}/api/patients/bulk-import`, {
          method: 'POST',
          headers: {
            ...patientHeaders,
          },
          body: formData,
        });

        expect([403, 404]).toContain(response.status);
      });
    });

    describe('POST /api/patients/bulk-export', () => {
      it('should export patients to CSV', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        const response = await app.post('/api/patients/bulk-export', {
          format: 'csv',
          filters: {},
        }, authHeaders);

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('downloadUrl');
        expect(response.body).toHaveProperty('recordCount');
        expect(response.body.recordCount).toBeGreaterThan(0);
      });

      it('should export patients to JSON', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        const response = await app.post('/api/patients/bulk-export', {
          format: 'json',
          filters: {},
        }, authHeaders);

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('downloadUrl');
        expect(response.body).toHaveProperty('recordCount');
      });

      it('should apply filters to export', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        const response = await app.post('/api/patients/bulk-export', {
          format: 'csv',
          filters: {
            bloodType: 'A+',
            gender: 'MALE',
          },
        }, authHeaders);

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('filters');
        expect(response.body.filters).toHaveProperty('bloodType', 'A+');
        expect(response.body.filters).toHaveProperty('gender', 'MALE');
      });
    });
  });

  describe('Patient Statistics', () => {
    beforeEach(async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create patients with different demographics
      await app.post('/api/patients', TestDataBuilder.patient({
        firstName: 'MaleA',
        gender: 'MALE',
        bloodType: 'A+',
      }), authHeaders);

      await app.post('/api/patients', TestDataBuilder.patient({
        firstName: 'FemaleO',
        gender: 'FEMALE',
        bloodType: 'O+',
      }), authHeaders);

      await app.post('/api/patients', TestDataBuilder.patient({
        firstName: 'MaleB',
        gender: 'MALE',
        bloodType: 'B+',
      }), authHeaders);
    });

    describe('GET /api/patients/statistics', () => {
      it('should return patient demographics', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');

        const response = await app.get('/api/patients/statistics', authHeaders);

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('totalPatients');
        expect(response.body).toHaveProperty('genderDistribution');
        expect(response.body).toHaveProperty('bloodTypeDistribution');
        expect(response.body).toHaveProperty('ageDistribution');

        expect(typeof response.body.totalPatients).toBe('number');
        expect(response.body.totalPatients).toBeGreaterThan(0);
        expect(response.body.genderDistribution).toHaveProperty('MALE');
        expect(response.body.genderDistribution).toHaveProperty('FEMALE');
      });

      it('should filter statistics by date range', async () => {
        const authHeaders = authHelper.getAuthHeaders('ADMIN');
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const endDate = new Date();

        const response = await app.get(
          `/api/patients/statistics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          authHeaders
        );

        TestAssertions.expectSuccess(response, 200);
        expect(response.body).toHaveProperty('dateRange');
        expect(response.body.dateRange).toHaveProperty('start');
        expect(response.body.dateRange).toHaveProperty('end');
      });

      it('should require admin privileges', async () => {
        const patientHeaders = authHelper.getAuthHeaders('PATIENT');

        const response = await app.get('/api/patients/statistics', patientHeaders);

        expect([403, 404]).toContain(response.status);
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle large patient datasets efficiently', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create many patients
      const createPromises = [];
      for (let i = 0; i < 50; i++) {
        createPromises.push(
          app.post('/api/patients', TestDataBuilder.patient(), authHeaders)
        );
      }
      await Promise.all(createPromises);

      const startTime = Date.now();
      const response = await app.get('/api/patients?limit=100', authHeaders);
      const duration = Date.now() - startTime;

      TestAssertions.expectSuccess(response, 200);
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
      expect(response.body.data.length).toBeGreaterThan(40);
    });

    it('should handle concurrent patient creation', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const concurrentCreates = [];
      for (let i = 0; i < 20; i++) {
        concurrentCreates.push(
          app.post('/api/patients', TestDataBuilder.patient(), authHeaders)
        );
      }

      const results = await Promise.allSettled(concurrentCreates);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201).length;

      expect(successful).toBeGreaterThan(15); // At least 75% success rate
    });
  });
});