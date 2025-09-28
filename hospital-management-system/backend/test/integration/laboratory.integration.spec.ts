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

describe('Laboratory Integration Tests', () => {
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

  describe('POST /api/laboratory/tests', () => {
    it('should create lab test successfully', async () => {
      const authHeaders = authHelper.getAuthHeaders('LAB_TECHNICIAN');
      const testData = TestDataBuilder.labTest();

      const response = await app.post('/api/laboratory/tests', testData, authHeaders);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.patientId).toBe(testData.patientId);
    });
  });

  describe('GET /api/laboratory/tests/:id/results', () => {
    it('should retrieve test results', async () => {
      const authHeaders = authHelper.getAuthHeaders('DOCTOR');
      const testData = TestDataBuilder.labTest();

      const createResponse = await app.post('/api/laboratory/tests', testData, authHeaders);
      const testId = createResponse.body.id;

      const resultsResponse = await app.get(`/api/laboratory/tests/${testId}/results`, authHeaders);

      expect(resultsResponse.status).toBe(200);
      expect(resultsResponse.body).toHaveProperty('results');
    });
  });
});
