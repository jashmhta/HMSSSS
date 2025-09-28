import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  TestApp,
  setupTestEnvironment,
  teardownTestEnvironment,
  createAuthHelper,
  TestDataBuilder,
  TestAssertions,
} from '../test-helpers';
import {
  TestDatabaseManager,
  setupTestDatabase,
  teardownTestDatabase,
} from '../test-database.config';

describe('Radiology Integration Tests', () => {
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

  describe('POST /api/radiology/exams', () => {
    it('should create radiology exam successfully', async () => {
      const authHeaders = authHelper.getAuthHeaders('RADIOLOGIST');
      const examData = TestDataBuilder.radiologyExam();

      const response = await app.post('/api/radiology/exams', examData, authHeaders);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.patientId).toBe(examData.patientId);
    });
  });

  describe('GET /api/radiology/exams/:id/report', () => {
    it('should retrieve exam report', async () => {
      const authHeaders = authHelper.getAuthHeaders('DOCTOR');
      const examData = TestDataBuilder.radiologyExam();

      const createResponse = await app.post('/api/radiology/exams', examData, authHeaders);
      const examId = createResponse.body.id;

      const reportResponse = await app.get(`/api/radiology/exams/${examId}/report`, authHeaders);

      expect(reportResponse.status).toBe(200);
      expect(reportResponse.body).toHaveProperty('findings');
    });
  });
});
