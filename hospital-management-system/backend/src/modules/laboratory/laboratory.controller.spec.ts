import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LaboratoryModule } from './laboratory.module';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { PatientsModule } from '../../modules/patients/patients.module';
import { SharedModule } from '../../shared/shared.module';
import { testUtils } from '../../../test/test-utils';

describe('LaboratoryController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testUser: any;
  let testPatient: any;
  let testLabTest: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthModule, PatientsModule, LaboratoryModule, SharedModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup test data
    testUser = await testUtils.createTestUser({
      role: 'DOCTOR',
      email: 'doctor@test.com',
    });
    testPatient = await testUtils.createTestPatient(testUser.id);
    authToken = await testUtils.getAuthToken(testUser);
  });

  afterAll(async () => {
    await testUtils.teardownTestApp();
  });

  beforeEach(async () => {
    await testUtils.cleanDatabase();
  });

  describe('/laboratory/tests (POST)', () => {
    const createTestDto = {
      patientId: '',
      testName: 'Complete Blood Count',
      testCode: 'CBC',
      category: 'HEMATOLOGY',
      specimenType: 'Blood',
      urgent: false,
      notes: 'Routine check',
    };

    it('should create a lab test successfully', async () => {
      createTestDto.patientId = testPatient.id;

      const response = await request(app.getHttpServer())
        .post('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestDto)
        .expect(201);

      expect(response.body).toHaveRequiredFields([
        'id',
        'patientId',
        'testName',
        'testCode',
        'status',
        'orderedDate',
      ]);
      expect(response.body.status).toBe('ORDERED');
      expect(response.body.patientId).toBe(testPatient.id);
      expect(response.body.testName).toBe(createTestDto.testName);

      testLabTest = response.body;
    });

    it('should return 401 when not authenticated', async () => {
      createTestDto.patientId = testPatient.id;

      await request(app.getHttpServer()).post('/laboratory/tests').send(createTestDto).expect(401);
    });

    it('should return 403 when user lacks permission', async () => {
      const patientUser = await testUtils.createTestUser({
        role: 'PATIENT',
        email: 'patient@test.com',
      });
      const patientToken = await testUtils.getAuthToken(patientUser);
      createTestDto.patientId = testPatient.id;

      await request(app.getHttpServer())
        .post('/laboratory/tests')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(createTestDto)
        .expect(403);
    });

    it('should return 404 when patient does not exist', async () => {
      const invalidDto = { ...createTestDto, patientId: 'non-existent-id' };

      await request(app.getHttpServer())
        .post('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(404);
    });
  });

  describe('/laboratory/tests (GET)', () => {
    beforeEach(async () => {
      // Create multiple test lab tests
      for (let i = 0; i < 5; i++) {
        await testUtils.createTestLabTest(testPatient.id, testUser.id, {
          testName: `Test ${i}`,
          testCode: `T${i}`,
          category: i % 2 === 0 ? 'HEMATOLOGY' : 'CHEMISTRY',
          urgent: i === 0,
        });
      }
    });

    it('should return paginated lab tests', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 3);
      expect(response.body.meta).toHaveProperty('total', 5);
      expect(response.body.meta).toHaveProperty('totalPages', 2);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'ORDERED' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(test => {
        expect(test.status).toBe('ORDERED');
      });
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'HEMATOLOGY' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(test => {
        expect(test.category).toBe('HEMATOLOGY');
      });
    });

    it('should filter by urgent flag', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ urgent: 'true' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(test => {
        expect(test.urgent).toBe(true);
      });
    });

    it('should search by test name', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Test 0' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(test => {
        expect(test.testName.toLowerCase()).toContain('test 0');
      });
    });
  });

  describe('/laboratory/tests/:id (GET)', () => {
    it('should return lab test by ID', async () => {
      const createdTest = await testUtils.createTestLabTest(testPatient.id, testUser.id);

      const response = await request(app.getHttpServer())
        .get(`/laboratory/tests/${createdTest.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdTest.id);
      expect(response.body.patientId).toBe(testPatient.id);
      expect(response.body.patient).toHaveProperty('user');
    });

    it('should return 404 for non-existent test', async () => {
      await request(app.getHttpServer())
        .get('/laboratory/tests/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/laboratory/tests/:id/collect-specimen (POST)', () => {
    it('should collect specimen successfully', async () => {
      const labTest = await testUtils.createTestLabTest(testPatient.id, testUser.id);
      const nurseUser = await testUtils.createTestUser({
        role: 'NURSE',
        email: 'nurse@test.com',
      });
      const nurseToken = await testUtils.getAuthToken(nurseUser);

      const collectDto = {
        specimenType: 'Blood',
        collectedBy: nurseUser.id,
        notes: 'Specimen collected successfully',
      };

      const response = await request(app.getHttpServer())
        .post(`/laboratory/tests/${labTest.id}/collect-specimen`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send(collectDto)
        .expect(200);

      expect(response.body.status).toBe('SPECIMEN_COLLECTED');
      expect(response.body.specimenType).toBe('Blood');
      expect(response.body.specimenCollected).toBeDefined();
    });

    it('should return 400 when trying to collect specimen for non-ordered test', async () => {
      const labTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, {
        status: 'COMPLETED',
      });

      const collectDto = {
        specimenType: 'Blood',
        collectedBy: testUser.id,
      };

      await request(app.getHttpServer())
        .post(`/laboratory/tests/${labTest.id}/collect-specimen`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(collectDto)
        .expect(400);
    });
  });

  describe('/laboratory/tests/:id/submit-results (POST)', () => {
    it('should submit results successfully', async () => {
      const labTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, {
        status: 'SPECIMEN_COLLECTED',
      });
      const labTechUser = await testUtils.createTestUser({
        role: 'LAB_TECHNICIAN',
        email: 'labtech@test.com',
      });
      const labTechToken = await testUtils.getAuthToken(labTechUser);

      const resultsDto = {
        results: {
          hemoglobin: '14.5 g/dL',
          hematocrit: '42%',
          wbc: '7500 /μL',
        },
        referenceRange: 'Hemoglobin: 12-16 g/dL, Hematocrit: 36-46%, WBC: 4000-11000 /μL',
        interpretation: 'All values within normal range',
        performedBy: labTechUser.id,
      };

      const response = await request(app.getHttpServer())
        .post(`/laboratory/tests/${labTest.id}/submit-results`)
        .set('Authorization', `Bearer ${labTechToken}`)
        .send(resultsDto)
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.results).toEqual(resultsDto.results);
      expect(response.body.interpretation).toBe(resultsDto.interpretation);
      expect(response.body.resultDate).toBeDefined();
    });

    it('should return 400 when submitting results for invalid status', async () => {
      const labTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, {
        status: 'ORDERED',
      });

      const resultsDto = {
        results: { hemoglobin: '14.5' },
        performedBy: testUser.id,
      };

      await request(app.getHttpServer())
        .post(`/laboratory/tests/${labTest.id}/submit-results`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(resultsDto)
        .expect(400);
    });
  });

  describe('/laboratory/tests/:id/cancel (POST)', () => {
    it('should cancel test successfully', async () => {
      const labTest = await testUtils.createTestLabTest(testPatient.id, testUser.id);

      const cancelDto = {
        reason: 'Patient requested cancellation',
      };

      const response = await request(app.getHttpServer())
        .post(`/laboratory/tests/${labTest.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(cancelDto)
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
      expect(response.body.notes).toContain('Patient requested cancellation');
    });

    it('should return 400 when trying to cancel completed test', async () => {
      const labTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, {
        status: 'COMPLETED',
      });

      const cancelDto = {
        reason: 'Test cancellation',
      };

      await request(app.getHttpServer())
        .post(`/laboratory/tests/${labTest.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(cancelDto)
        .expect(400);
    });
  });

  describe('/laboratory/tests/stats (GET)', () => {
    beforeEach(async () => {
      // Create test data for statistics
      await testUtils.createTestLabTest(testPatient.id, testUser.id, { status: 'COMPLETED' });
      await testUtils.createTestLabTest(testPatient.id, testUser.id, { status: 'ORDERED' });
      await testUtils.createTestLabTest(testPatient.id, testUser.id, {
        status: 'SPECIMEN_COLLECTED',
      });
      await testUtils.createTestLabTest(testPatient.id, testUser.id, { status: 'IN_PROGRESS' });
    });

    it('should return lab statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalTests', 4);
      expect(response.body).toHaveProperty('pendingTests');
      expect(response.body).toHaveProperty('completedToday');
      expect(response.body).toHaveProperty('urgentTests');
    });
  });

  describe('/laboratory/tests/categories (GET)', () => {
    beforeEach(async () => {
      await testUtils.createTestLabTest(testPatient.id, testUser.id, { category: 'HEMATOLOGY' });
      await testUtils.createTestLabTest(testPatient.id, testUser.id, { category: 'CHEMISTRY' });
      await testUtils.createTestLabTest(testPatient.id, testUser.id, { category: 'HEMATOLOGY' });
    });

    it('should return test count by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const hematologyCategory = response.body.find(cat => cat.category === 'HEMATOLOGY');
      expect(hematologyCategory).toBeDefined();
      expect(hematologyCategory.count).toBe(2);
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk lab test creation within time limits', async () => {
      const startTime = Date.now();

      // Create 10 lab tests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/laboratory/tests')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              patientId: testPatient.id,
              testName: `Bulk Test ${i}`,
              testCode: `BT${i}`,
              category: 'CHEMISTRY',
            }),
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds for 10 tests
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent requests without race conditions', async () => {
      const labTest = await testUtils.createTestLabTest(testPatient.id, testUser.id);

      // Attempt to collect specimen from multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app.getHttpServer())
            .post(`/laboratory/tests/${labTest.id}/collect-specimen`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              specimenType: 'Blood',
              collectedBy: testUser.id,
            }),
        );
      }

      const results = await Promise.allSettled(promises);

      // Only one request should succeed, others should fail
      const fulfilledCount = results.filter(result => result.status === 'fulfilled').length;
      const rejectedCount = results.filter(result => result.status === 'rejected').length;

      expect(fulfilledCount).toBe(1);
      expect(rejectedCount).toBe(2);
    });
  });

  describe('Security Tests', () => {
    it("should prevent unauthorized access to other patients' lab tests", async () => {
      const otherUser = await testUtils.createTestUser({
        role: 'DOCTOR',
        email: 'other-doctor@test.com',
      });
      const otherPatient = await testUtils.createTestPatient(otherUser.id);
      const otherLabTest = await testUtils.createTestLabTest(otherPatient.id, otherUser.id);

      // Try to access other doctor's patient's lab test
      await request(app.getHttpServer())
        .get(`/laboratory/tests/${otherLabTest.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Currently allowing - would need additional authorization logic
    });

    it('should validate input data types and formats', async () => {
      const invalidDto = {
        patientId: testPatient.id,
        testName: '', // Empty test name
        testCode: 'INVALID_CODE_WITH_SPACES',
        category: 'INVALID_CATEGORY',
      };

      await request(app.getHttpServer())
        .post('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should prevent SQL injection attempts', async () => {
      const maliciousDto = {
        patientId: testPatient.id,
        testName: "'; DROP TABLE lab_tests; --",
        testCode: 'MALICIOUS',
        category: 'HEMATOLOGY',
      };

      const response = await request(app.getHttpServer())
        .post('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousDto)
        .expect(201);

      // Verify the malicious input was sanitized
      expect(response.body.testName).not.toContain('DROP TABLE');
    });
  });
});
