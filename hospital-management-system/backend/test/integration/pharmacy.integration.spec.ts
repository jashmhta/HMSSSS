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

describe('Pharmacy Integration Tests', () => {
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

  describe('POST /api/pharmacy/prescriptions', () => {
    it('should create prescription successfully', async () => {
      const authHeaders = authHelper.getAuthHeaders('DOCTOR');
      const prescriptionData = TestDataBuilder.prescription();

      const response = await app.post('/api/pharmacy/prescriptions', prescriptionData, authHeaders);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.patientId).toBe(prescriptionData.patientId);
    });
  });

  describe('GET /api/pharmacy/medicines', () => {
    it('should retrieve medicines inventory', async () => {
      const authHeaders = authHelper.getAuthHeaders('PHARMACIST');

      const response = await app.get('/api/pharmacy/medicines', authHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
