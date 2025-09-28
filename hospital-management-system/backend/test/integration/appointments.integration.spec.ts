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

describe('Appointments Integration Tests', () => {
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

  describe('POST /api/appointments', () => {
    it('should create appointment successfully', async () => {
      const authHeaders = authHelper.getAuthHeaders('DOCTOR');
      const appointmentData = TestDataBuilder.appointment();

      const response = await app.post('/api/appointments', appointmentData, authHeaders);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.patientId).toBe(appointmentData.patientId);
    });

    it('should validate required fields', async () => {
      const authHeaders = authHelper.getAuthHeaders('DOCTOR');

      const response = await app.post('/api/appointments', {}, authHeaders);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/appointments', () => {
    it('should retrieve appointments for doctor', async () => {
      const authHeaders = authHelper.getAuthHeaders('DOCTOR');

      const response = await app.get('/api/appointments', authHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    it('should update appointment status', async () => {
      const authHeaders = authHelper.getAuthHeaders('DOCTOR');
      const appointmentData = TestDataBuilder.appointment();

      const createResponse = await app.post('/api/appointments', appointmentData, authHeaders);
      const appointmentId = createResponse.body.id;

      const updateResponse = await app.put(
        `/api/appointments/${appointmentId}`,
        {
          status: 'CONFIRMED',
        },
        authHeaders,
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe('CONFIRMED');
    });
  });
});
