/*[object Object]*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { PatientsModule } from '../../modules/patients/patients.module';
import { SharedModule } from '../../shared/shared.module';
import { testUtils } from '../../../test/test-utils';
import { PrismaService } from '../../database/prisma.service';

import { LaboratoryModule } from './laboratory.module';

describe('LaboratoryController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testUser: any;
  let testPatient: any;
  let testLabTest: any;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthModule, PatientsModule, LaboratoryModule, SharedModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Setup test data
    testUser = await testUtils.createTestUser(
      {
        role: 'DOCTOR',
        email: 'doctor@test.com',
      },
      prisma,
    );
    testPatient = await testUtils.createTestPatient(testUser.id, prisma);
    authToken = await testUtils.getAuthToken(testUser, app.get('JwtService'));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await testUtils.cleanDatabase(prisma);
  });

  describe('/laboratory/tests (POST)', () => {
    const createTestDto = {
      patientId: '',
      testCatalogId: 'test-catalog-123',
      orderedBy: '',
      clinicalInfo: 'Routine check',
      diagnosis: 'Anemia',
      priority: 'ROUTINE',
    };

    it('should create a lab test successfully', async () => {
      createTestDto.patientId = testPatient.id;
      createTestDto.orderedBy = testUser.id;

      // Create a test catalog item first
      const testCatalog = await prisma.labTestCatalog.create({
        data: {
          tenantId: 'test-tenant',
          testName: 'Complete Blood Count',
          testCode: 'CBC',
          category: 'HEMATOLOGY',
          department: 'HEMATOLOGY',
          specimenType: 'BLOOD',
          containerType: 'EDTA Tube',
          turnaroundTime: 60,
          cost: 25.0,
          isActive: true,
        },
      });
      createTestDto.testCatalogId = testCatalog.id;

      const response = await request(app.getHttpServer())
        .post('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('patientId');
      expect(response.body).toHaveProperty('testCatalogId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('orderedDate');
      expect(response.body.status).toBe('ORDERED');
      expect(response.body.patientId).toBe(testPatient.id);
      expect(response.body.testCatalogId).toBe(testCatalog.id);

      testLabTest = response.body;
    });

    it('should return 401 when not authenticated', async () => {
      createTestDto.patientId = testPatient.id;
      createTestDto.orderedBy = testUser.id;

      await request(app.getHttpServer()).post('/laboratory/tests').send(createTestDto).expect(401);
    });

    it('should return 403 when user lacks permission', async () => {
      const patientUser = await testUtils.createTestUser(
        {
          role: 'PATIENT',
          email: 'patient@test.com',
        },
        prisma,
      );
      const patientToken = await testUtils.getAuthToken(patientUser, app.get('JwtService'));
      createTestDto.patientId = testPatient.id;
      createTestDto.orderedBy = testUser.id;

      await request(app.getHttpServer())
        .post('/laboratory/tests')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(createTestDto)
        .expect(403);
    });

    it('should return 404 when patient does not exist', async () => {
      const invalidDto = { ...createTestDto, patientId: 'non-existent-id' };
      invalidDto.orderedBy = testUser.id;

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
        await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma, {
          testName: `Test ${i}`,
          testCode: `T${i}`,
          category: i % 2 === 0 ? 'HEMATOLOGY' : 'CHEMISTRY',
          urgent: i === 0,
        });
      }
    });

    it('should return lab tests without filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'ORDERED' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach(test => {
        expect(test.status).toBe('ORDERED');
      });
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'HEMATOLOGY' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach(test => {
        expect(test.category).toBe('HEMATOLOGY');
      });
    });

    it('should filter by urgent flag', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ urgent: 'true' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(test => {
        expect(test.urgent).toBe(true);
      });
    });

    it('should search by test name', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Test 0' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(test => {
        expect(test.testName.toLowerCase()).toContain('test 0');
      });
    });
  });

  describe('/laboratory/tests/:id (GET)', () => {
    it('should return lab test by ID', async () => {
      const createdTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma);

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

    it('should return 401 when not authenticated', async () => {
      const createdTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma);

      await request(app.getHttpServer()).get(`/laboratory/tests/${createdTest.id}`).expect(401);
    });
  });

  describe('/laboratory/tests/:id (PATCH)', () => {
    it('should update test status', async () => {
      const createdTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma);

      const updateData = {
        status: 'IN_PROGRESS',
        notes: 'Test started',
      };

      const response = await request(app.getHttpServer())
        .patch(`/laboratory/tests/${createdTest.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe(updateData.status);
      expect(response.body.notes).toBe(updateData.notes);
    });

    it('should return 404 for non-existent test', async () => {
      await request(app.getHttpServer())
        .patch('/laboratory/tests/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      const createdTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma);

      await request(app.getHttpServer())
        .patch(`/laboratory/tests/${createdTest.id}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(401);
    });
  });

  describe('/laboratory/tests/:id/cancel (POST)', () => {
    it('should cancel a test', async () => {
      const createdTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma);

      const response = await request(app.getHttpServer())
        .post(`/laboratory/tests/${createdTest.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Patient request' })
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
    });

    it('should return 404 for non-existent test', async () => {
      await request(app.getHttpServer())
        .post('/laboratory/tests/non-existent-id/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Patient request' })
        .expect(404);
    });
  });

  describe('/laboratory/tests/:id/results (POST)', () => {
    it('should submit test results', async () => {
      const createdTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma);

      // Update test status to IN_PROGRESS first
      await prisma.labTest.update({
        where: { id: createdTest.id },
        data: { status: 'IN_PROGRESS' },
      });

      const resultsData = {
        results: { hemoglobin: '14.5', wbc: '7500' },
        referenceRange: 'Normal',
        interpretation: 'All values normal',
      };

      const response = await request(app.getHttpServer())
        .post(`/laboratory/tests/${createdTest.id}/results`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(resultsData)
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.results).toEqual(resultsData.results);
    });

    it('should return 400 when results submitted for invalid status', async () => {
      const createdTest = await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma);

      const resultsData = {
        results: { hemoglobin: '14.5' },
        referenceRange: 'Normal',
        interpretation: 'Normal',
      };

      await request(app.getHttpServer())
        .post(`/laboratory/tests/${createdTest.id}/results`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(resultsData)
        .expect(400);
    });
  });

  describe('/laboratory/catalog (GET)', () => {
    beforeEach(async () => {
      // Create test catalog items
      await prisma.labTestCatalog.createMany({
        data: [
          {
            tenantId: 'test-tenant',
            testName: 'Complete Blood Count',
            testCode: 'CBC',
            category: 'HEMATOLOGY',
            department: 'HEMATOLOGY',
            specimenType: 'BLOOD',
            containerType: 'EDTA Tube',
            turnaroundTime: 60,
            cost: 25.0,
            isActive: true,
          },
          {
            tenantId: 'test-tenant',
            testName: 'Liver Function Test',
            testCode: 'LFT',
            category: 'CHEMISTRY',
            department: 'CHEMISTRY',
            specimenType: 'BLOOD',
            containerType: 'Serum Tube',
            turnaroundTime: 120,
            cost: 50.0,
            isActive: true,
          },
          {
            tenantId: 'test-tenant',
            testName: 'X-Ray',
            testCode: 'XRAY',
            category: 'IMAGING',
            department: 'RADIOLOGY' as any,
            specimenType: 'OTHER',
            containerType: 'N/A',
            turnaroundTime: 30,
            cost: 100.0,
            isActive: false,
          },
        ],
      });
    });

    it('should return active test catalog', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Only active items
      expect(response.body.find(item => item.code === 'XRAY')).toBeUndefined();
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'HEMATOLOGY' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].category).toBe('HEMATOLOGY');
    });
  });

  describe('/laboratory/statistics (GET)', () => {
    beforeEach(async () => {
      // Create test data for statistics
      await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma, { status: 'ORDERED' });
      await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma, {
        status: 'IN_PROGRESS',
      });
      await testUtils.createTestLabTest(testPatient.id, testUser.id, prisma, {
        status: 'COMPLETED',
      });
    });

    it('should return lab statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/laboratory/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalTests');
      expect(response.body).toHaveProperty('pendingTests');
      expect(response.body).toHaveProperty('completedToday');
      expect(response.body).toHaveProperty('urgentTests');
      expect(response.body).toHaveProperty('testsByStatus');
      expect(response.body).toHaveProperty('testsByDepartment');
      expect(response.body).toHaveProperty('turnaroundTime');
    });
  });
});
