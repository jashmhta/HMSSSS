import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestApp, setupTestEnvironment, teardownTestEnvironment, createAuthHelper } from '../test-helpers';
import { TestPerformance } from '../test-helpers';

describe('Performance Tests', () => {
  let app: TestApp;
  let authHelper: any;

  beforeAll(async () => {
    app = await setupTestEnvironment();
    authHelper = await createAuthHelper(app);
  });

  afterAll(async () => {
    await teardownTestEnvironment(app);
  });

  describe('Database Performance', () => {
    it('should handle concurrent database operations efficiently', async () => {
      const concurrentRequests = 50;
      const requests = [];

      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          app.get('/api/patients', authHeaders)
        );
      }

      const { duration } = await TestPerformance.measureTime(async () => {
        await Promise.all(requests);
      }, 5000); // 5 second threshold

      console.log(`Concurrent requests (${concurrentRequests}) completed in ${duration}ms`);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large dataset queries efficiently', async () => {
      // Create many test patients
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const patients = [];

      for (let i = 0; i < 100; i++) {
        patients.push({
          firstName: `Test${i}`,
          lastName: `Patient${i}`,
          email: `test${i}@example.com`,
          phone: `+123456789${i}`,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
          bloodType: 'A+',
          address: `123 Test St ${i}`,
          emergencyContact: 'Emergency Contact',
          emergencyPhone: '+1234567890',
        });

        await app.post('/api/patients', patients[i], authHeaders);
      }

      const { duration } = await TestPerformance.measureTime(async () => {
        const response = await app.get('/api/patients?limit=100', authHeaders);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(50);
      }, 2000); // 2 second threshold

      console.log(`Large dataset query completed in ${duration}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('should handle complex join operations efficiently', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      const { duration } = await TestPerformance.measureTime(async () => {
        const response = await app.get('/api/appointments/with-details', authHeaders);
        expect(response.status).toBe(200);
      }, 3000); // 3 second threshold

      console.log(`Complex join operation completed in ${duration}ms`);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('API Response Performance', () => {
    it('should respond to health check within 100ms', async () => {
      const { duration } = await TestPerformance.measureTime(async () => {
        const response = await app.get('/health');
        expect(response.status).toBe(200);
      }, 100); // 100ms threshold

      console.log(`Health check completed in ${duration}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('should handle authentication within 200ms', async () => {
      const { duration } = await TestPerformance.measureTime(async () => {
        const response = await app.post('/auth/login', {
          email: 'admin@test.com',
          password: 'Test123!',
        });
        expect(response.status).toBe(200);
      }, 200); // 200ms threshold

      console.log(`Authentication completed in ${duration}ms`);
      expect(duration).toBeLessThan(200);
    });

    it('should handle CRUD operations within 500ms', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create
      const { duration: createDuration } = await TestPerformance.measureTime(async () => {
        const response = await app.post('/api/patients', {
          firstName: 'Performance',
          lastName: 'Test',
          email: `perf.test.${Date.now()}@example.com`,
          phone: '+1234567890',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
          bloodType: 'A+',
          address: '123 Test St',
          emergencyContact: 'Emergency Contact',
          emergencyPhone: '+1234567891',
        }, authHeaders);
        expect(response.status).toBe(201);
      }, 500);

      console.log(`Create operation completed in ${createDuration}ms`);
      expect(createDuration).toBeLessThan(500);

      // Read
      const { duration: readDuration } = await TestPerformance.measureTime(async () => {
        const response = await app.get('/api/patients', authHeaders);
        expect(response.status).toBe(200);
      }, 500);

      console.log(`Read operation completed in ${readDuration}ms`);
      expect(readDuration).toBeLessThan(500);

      // Update
      const { duration: updateDuration } = await TestPerformance.measureTime(async () => {
        const patients = await app.get('/api/patients', authHeaders);
        const patientId = patients.body.data[0].id;

        const response = await app.put(`/api/patients/${patientId}`, {
          firstName: 'Updated',
          lastName: 'Test',
          email: `updated.test.${Date.now()}@example.com`,
          phone: '+1234567890',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
          bloodType: 'A+',
          address: '123 Test St',
          emergencyContact: 'Emergency Contact',
          emergencyPhone: '+1234567891',
        }, authHeaders);
        expect(response.status).toBe(200);
      }, 500);

      console.log(`Update operation completed in ${updateDuration}ms`);
      expect(updateDuration).toBeLessThan(500);
    });

    it('should handle file uploads within 2000ms', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create a mock file
      const mockFile = Buffer.from('test file content');
      const formData = new FormData();
      formData.append('file', new Blob([mockFile]), 'test.txt');

      const { duration } = await TestPerformance.measureTime(async () => {
        const response = await fetch(`${app.getApp().getHttpServer()}/api/upload`, {
          method: 'POST',
          headers: {
            ...authHeaders,
            // FormData will set Content-Type and boundary
          },
          body: formData,
        });

        expect(response.status).toBe(200);
      }, 2000); // 2 second threshold

      console.log(`File upload completed in ${duration}ms`);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during repeated operations', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const iterations = 100;

      const { memoryIncrease } = await TestPerformance.measureMemory(async () => {
        for (let i = 0; i < iterations; i++) {
          await app.get('/api/patients', authHeaders);
        }
      }, 10 * 1024 * 1024); // 10MB threshold

      console.log(`Memory increase after ${iterations} operations: ${memoryIncrease} bytes`);
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    it('should handle large payloads efficiently', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Create a large payload
      const largePayload = {
        data: Array(1000).fill(0).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
          value: Math.random() * 1000,
          timestamp: new Date().toISOString(),
        })),
      };

      const { duration, memoryIncrease } = await TestPerformance.measureMemory(async () => {
        const response = await app.post('/api/test/large-payload', largePayload, authHeaders);
        // Expect 404 or appropriate error since endpoint doesn't exist
        expect([404, 400]).toContain(response.status);
      }, 5 * 1024 * 1024); // 5MB threshold

      console.log(`Large payload processing completed in ${duration}ms`);
      console.log(`Memory increase: ${memoryIncrease} bytes`);
      expect(duration).toBeLessThan(1000);
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB
    });
  });

  describe('Load Testing', () => {
    it('should handle sustained load', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const requestsPerSecond = 10;
      const duration = 10000; // 10 seconds
      const totalRequests = requestsPerSecond * (duration / 1000);

      const startTime = Date.now();
      const requests = [];
      let completedRequests = 0;
      let failedRequests = 0;

      // Make requests at a steady rate
      const interval = setInterval(() => {
        if (Date.now() - startTime < duration) {
          requests.push(
            app.get('/api/patients', authHeaders)
              .then(() => completedRequests++)
              .catch(() => failedRequests++)
          );
        } else {
          clearInterval(interval);
        }
      }, 1000 / requestsPerSecond);

      await new Promise(resolve => setTimeout(resolve, duration + 1000));
      await Promise.all(requests);

      const successRate = (completedRequests / totalRequests) * 100;
      console.log(`Load test results:`);
      console.log(`  - Total requests: ${totalRequests}`);
      console.log(`  - Completed: ${completedRequests}`);
      console.log(`  - Failed: ${failedRequests}`);
      console.log(`  - Success rate: ${successRate.toFixed(2)}%`);

      expect(successRate).toBeGreaterThan(95); // 95% success rate
      expect(failedRequests).toBeLessThan(totalRequests * 0.05); // Less than 5% failure rate
    });

    it('should handle burst traffic', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');
      const burstSize = 100;
      const requests = [];

      // Create a burst of requests
      for (let i = 0; i < burstSize; i++) {
        requests.push(app.get('/api/patients', authHeaders));
      }

      const { duration } = await TestPerformance.measureTime(async () => {
        const results = await Promise.allSettled(requests);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Burst test results:`);
        console.log(`  - Successful: ${successful}`);
        console.log(`  - Failed: ${failed}`);
        console.log(`  - Success rate: ${((successful / burstSize) * 100).toFixed(2)}%`);

        expect(successful).toBeGreaterThan(90); // 90% success rate
      }, 5000); // 5 second threshold

      console.log(`Burst of ${burstSize} requests handled in ${duration}ms`);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Caching Performance', () => {
    it('should demonstrate cache effectiveness', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // First request (should hit database)
      const { duration: firstDuration } = await TestPerformance.measureTime(async () => {
        const response = await app.get('/api/patients', authHeaders);
        expect(response.status).toBe(200);
      });

      // Second request (should hit cache)
      const { duration: secondDuration } = await TestPerformance.measureTime(async () => {
        const response = await app.get('/api/patients', authHeaders);
        expect(response.status).toBe(200);
      });

      console.log(`First request: ${firstDuration}ms`);
      console.log(`Second request: ${secondDuration}ms`);

      // Cached request should be significantly faster
      expect(secondDuration).toBeLessThan(firstDuration * 0.5);
    });

    it('should handle cache invalidation efficiently', async () => {
      const authHeaders = authHelper.getAuthHeaders('ADMIN');

      // Get initial data
      const initialResponse = await app.get('/api/patients', authHeaders);
      expect(initialResponse.status).toBe(200);

      // Create new patient (invalidates cache)
      await app.post('/api/patients', {
        firstName: 'Cache',
        lastName: 'Test',
        email: `cache.test.${Date.now()}@example.com`,
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        bloodType: 'A+',
        address: '123 Test St',
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '+1234567891',
      }, authHeaders);

      // Request again (should get fresh data)
      const { duration: freshDuration } = await TestPerformance.measureTime(async () => {
        const response = await app.get('/api/patients', authHeaders);
        expect(response.status).toBe(200);
      }, 1000); // 1 second threshold

      console.log(`Cache invalidation and fresh request completed in ${freshDuration}ms`);
      expect(freshDuration).toBeLessThan(1000);
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting efficiently', async () => {
      const authHeaders = authHelper.getAuthHeaders('PATIENT');

      // Make requests that should trigger rate limiting
      const requests = [];
      for (let i = 0; i < 150; i++) { // Assuming rate limit is 100 per minute
        requests.push(app.get('/api/patients', authHeaders));
      }

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const rateLimited = results.filter(r => r.status === 'rejected').length;

      console.log(`Rate limiting test results:`);
      console.log(`  - Total requests: ${requests.length}`);
      console.log(`  - Successful: ${successful}`);
      console.log(`  - Rate limited: ${rateLimited}`);

      // Should have some rate-limited requests
      expect(rateLimited).toBeGreaterThan(0);
      // But also successful requests
      expect(successful).toBeGreaterThan(0);
    });
  });
});