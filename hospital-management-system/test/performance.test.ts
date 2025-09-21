import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LaboratoryModule } from '../src/modules/laboratory/laboratory.module';
import { RadiologyModule } from '../src/modules/radiology/radiology.module';
import { DatabaseModule } from '../src/database/database.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PatientsModule } from '../src/modules/patients/patients.module';
import { SharedModule } from '../src/shared/shared.module';
import { testUtils } from './test-utils';

describe('Performance Tests (Enterprise Grade)', () => {
  let app: INestApplication;
  let authToken: string;
  let testUser: any;
  let testPatient: any;
  let performanceMetrics: any[] = [];

  const PERFORMANCE_THRESHOLDS = {
    API_RESPONSE_TIME: 200, // ms
    BULK_OPERATION_TIME: 5000, // ms for 100 operations
    CONCURRENT_REQUESTS: 50, // max concurrent requests
    MEMORY_USAGE_INCREASE: 50 * 1024 * 1024, // 50MB
    CPU_USAGE_SPIKE: 80, // percentage
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        AuthModule,
        PatientsModule,
        LaboratoryModule,
        RadiologyModule,
        SharedModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup test data
    testUser = await testUtils.createTestUser({
      role: 'DOCTOR',
      email: 'perf-test-doctor@test.com'
    });
    testPatient = await testUtils.createTestPatient(testUser.id);
    authToken = await testUtils.getAuthToken(testUser);

    // Initialize performance monitoring
    global.performanceMonitor = {
      startTime: 0,
      start: function() {
        this.startTime = Date.now();
      },
      end: function(threshold = PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME) {
        const duration = Date.now() - this.startTime;
        performanceMetrics.push({
          operation: 'api_call',
          duration,
          threshold,
          passed: duration <= threshold,
          timestamp: new Date().toISOString(),
        });

        if (duration > threshold) {
          console.warn(`⚠️  Performance warning: Operation took ${duration}ms (threshold: ${threshold}ms)`);
        }

        return duration;
      }
    };
  });

  afterAll(async () => {
    await testUtils.teardownTestApp();

    // Generate performance report
    generatePerformanceReport();
  });

  beforeEach(async () => {
    await testUtils.cleanDatabase();
  });

  describe('API Response Time Tests', () => {
    it('should respond to lab test creation within acceptable time', async () => {
      global.performanceMonitor.start();

      const response = await request(app.getHttpServer())
        .post('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: testPatient.id,
          testName: 'Performance Test CBC',
          testCode: 'PTCBC',
          category: 'HEMATOLOGY',
        })
        .expect(201);

      const duration = global.performanceMonitor.end();

      expect(duration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      expect(response.body).toHaveProperty('id');
    });

    it('should respond to radiology test creation within acceptable time', async () => {
      global.performanceMonitor.start();

      const response = await request(app.getHttpServer())
        .post('/radiology/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: testPatient.id,
          testName: 'Performance Test X-Ray',
          testCode: 'PTXR',
          modality: 'XRAY',
        })
        .expect(201);

      const duration = global.performanceMonitor.end();

      expect(duration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      expect(response.body).toHaveProperty('id');
    });

    it('should handle lab test queries within acceptable time', async () => {
      // Create test data
      await testUtils.createBulkLabTests(20, [testPatient.id], testUser.id);

      global.performanceMonitor.start();

      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      const duration = global.performanceMonitor.end();

      expect(duration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      expect(response.body.data).toHaveLength(10);
    });
  });

  describe('Bulk Operation Performance Tests', () => {
    it('should handle bulk lab test creation efficiently', async () => {
      const bulkSize = 50;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < bulkSize; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/laboratory/tests')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              patientId: testPatient.id,
              testName: `Bulk Lab Test ${i}`,
              testCode: `BLT${i.toString().padStart(3, '0')}`,
              category: 'CHEMISTRY',
            })
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      performanceMetrics.push({
        operation: 'bulk_lab_test_creation',
        duration,
        threshold: PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME,
        passed: duration <= PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME,
        timestamp: new Date().toISOString(),
        bulkSize,
        avgTimePerOperation: duration / bulkSize,
      });

      expect(duration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);

      // Verify all tests were created
      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 100 })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(bulkSize);
    });

    it('should handle bulk radiology test creation efficiently', async () => {
      const bulkSize = 50;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < bulkSize; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/radiology/tests')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              patientId: testPatient.id,
              testName: `Bulk Radiology Test ${i}`,
              testCode: `BRT${i.toString().padStart(3, '0')}`,
              modality: 'XRAY',
            })
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      performanceMetrics.push({
        operation: 'bulk_radiology_test_creation',
        duration,
        threshold: PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME,
        passed: duration <= PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME,
        timestamp: new Date().toISOString(),
        bulkSize,
        avgTimePerOperation: duration / bulkSize,
      });

      expect(duration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);
    });
  });

  describe('Concurrent Request Handling Tests', () => {
    it('should handle concurrent lab test operations', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/laboratory/tests')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              patientId: testPatient.id,
              testName: `Concurrent Lab Test ${i}`,
              testCode: `CLT${i.toString().padStart(3, '0')}`,
              category: 'HEMATOLOGY',
            })
        );
      }

      const results = await Promise.allSettled(promises);
      const duration = Date.now() - startTime;

      const successfulRequests = results.filter(result => result.status === 'fulfilled').length;
      const failedRequests = results.filter(result => result.status === 'rejected').length;

      performanceMetrics.push({
        operation: 'concurrent_lab_test_creation',
        duration,
        threshold: PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME,
        passed: duration <= PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME,
        timestamp: new Date().toISOString(),
        concurrentRequests,
        successfulRequests,
        failedRequests,
        successRate: (successfulRequests / concurrentRequests) * 100,
      });

      expect(successfulRequests).toBe(concurrentRequests);
      expect(duration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);
    });

    it('should handle mixed concurrent operations', async () => {
      const operations = [];
      const labTestIds: string[] = [];

      // Create initial lab tests
      for (let i = 0; i < 10; i++) {
        const response = await request(app.getHttpServer())
          .post('/laboratory/tests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            patientId: testPatient.id,
            testName: `Mixed Test ${i}`,
            testCode: `MT${i}`,
            category: 'CHEMISTRY',
          });
        labTestIds.push(response.body.id);
      }

      // Mix of different operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          // Update operation
          request(app.getHttpServer())
            .patch(`/laboratory/tests/${labTestIds[i]}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ notes: `Updated notes ${i}` })
        );

        operations.push(
          // Read operation
          request(app.getHttpServer())
            .get(`/laboratory/tests/${labTestIds[i]}`)
            .set('Authorization', `Bearer ${authToken}`)
        );

        operations.push(
          // Collect specimen operation
          request(app.getHttpServer())
            .post(`/laboratory/tests/${labTestIds[i]}/collect-specimen`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              specimenType: 'Blood',
              collectedBy: testUser.id,
            })
        );
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(operations);
      const duration = Date.now() - startTime;

      const successfulOperations = results.filter(result => result.status === 'fulfilled').length;
      const failedOperations = results.filter(result => result.status === 'rejected').length;

      performanceMetrics.push({
        operation: 'mixed_concurrent_operations',
        duration,
        threshold: PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME,
        passed: duration <= PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME,
        timestamp: new Date().toISOString(),
        totalOperations: operations.length,
        successfulOperations,
        failedOperations,
        successRate: (successfulOperations / operations.length) * 100,
      });

      expect(successfulOperations).toBeGreaterThan(operations.length * 0.95); // 95% success rate
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not have significant memory leaks during bulk operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const bulkSize = 100;

      // Perform bulk operations
      const promises = [];
      for (let i = 0; i < bulkSize; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/laboratory/tests')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              patientId: testPatient.id,
              testName: `Memory Test ${i}`,
              testCode: `MEM${i.toString().padStart(3, '0')}`,
              category: 'MICROBIOLOGY',
            })
        );
      }

      await Promise.all(promises);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      performanceMetrics.push({
        operation: 'memory_usage_test',
        memoryIncrease,
        threshold: PERFORMANCE_THRESHOLDS.MEMORY_USAGE_INCREASE,
        passed: memoryIncrease <= PERFORMANCE_THRESHOLDS.MEMORY_USAGE_INCREASE,
        timestamp: new Date().toISOString(),
        initialMemory,
        finalMemory,
      });

      expect(memoryIncrease).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_INCREASE);
    });
  });

  describe('Database Query Performance Tests', () => {
    beforeEach(async () => {
      // Create substantial test data
      await testUtils.createBulkLabTests(100, [testPatient.id], testUser.id);
    });

    it('should handle complex queries efficiently', async () => {
      global.performanceMonitor.start();

      const response = await request(app.getHttpServer())
        .get('/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 20,
          status: 'ORDERED',
          category: 'CHEMISTRY',
          urgent: 'false',
        })
        .expect(200);

      const duration = global.performanceMonitor.end();

      expect(duration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      expect(response.body.data.length).toBeLessThanOrEqual(20);
    });

    it('should handle sorting and filtering efficiently', async () => {
      const sortOptions = ['orderedDate', 'testName', 'status'];
      const filterOptions = ['status', 'category', 'urgent'];

      for (const sortBy of sortOptions) {
        global.performanceMonitor.start();

        await request(app.getHttpServer())
          .get('/laboratory/tests')
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            page: 1,
            limit: 10,
            sortBy,
            order: 'desc',
          })
          .expect(200);

        const duration = global.performanceMonitor.end();

        performanceMetrics.push({
          operation: `query_with_sort_${sortBy}`,
          duration,
          threshold: PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME,
          passed: duration <= PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME,
          timestamp: new Date().toISOString(),
        });

        expect(duration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      }
    });
  });

  describe('Load Testing Simulation', () => {
    it('should maintain performance under sustained load', async () => {
      const testDuration = 30000; // 30 seconds
      const requestInterval = 100; // 100ms between requests
      const startTime = Date.now();
      const requestTimes: number[] = [];

      const makeRequest = async () => {
        const requestStart = Date.now();
        try {
          await request(app.getHttpServer())
            .get('/laboratory/tests')
            .set('Authorization', `Bearer ${authToken}`)
            .query({ page: 1, limit: 5 })
            .expect(200);
        } catch (error) {
          // Ignore errors for load testing
        }
        const requestDuration = Date.now() - requestStart;
        requestTimes.push(requestDuration);
      };

      // Continuous requests for test duration
      const requestPromises: Promise<void>[] = [];
      let requestCount = 0;

      while (Date.now() - startTime < testDuration) {
        requestPromises.push(makeRequest());
        requestCount++;

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      await Promise.all(requestPromises);

      const totalDuration = Date.now() - startTime;
      const avgResponseTime = requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;
      const maxResponseTime = Math.max(...requestTimes);
      const minResponseTime = Math.min(...requestTimes);
      const requestsPerSecond = (requestCount / totalDuration) * 1000;

      performanceMetrics.push({
        operation: 'sustained_load_test',
        totalDuration,
        requestCount,
        requestsPerSecond,
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
        threshold: PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME,
        passed: avgResponseTime <= PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME,
        timestamp: new Date().toISOString(),
      });

      expect(avgResponseTime).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      expect(requestsPerSecond).toBeGreaterThan(5); // At least 5 requests per second
    });
  });

  function generatePerformanceReport() {
    console.log('\n📊 PERFORMANCE TEST REPORT');
    console.log('==========================');

    const passedTests = performanceMetrics.filter(metric => metric.passed).length;
    const failedTests = performanceMetrics.filter(metric => !metric.passed).length;
    const totalTests = performanceMetrics.length;

    console.log(`\n✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${failedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

    if (failedTests > 0) {
      console.log('\n⚠️  FAILED TESTS:');
      performanceMetrics
        .filter(metric => !metric.passed)
        .forEach(metric => {
          console.log(`  - ${metric.operation}: ${metric.duration}ms (threshold: ${metric.threshold}ms)`);
        });
    }

    // Calculate averages
    const avgResponseTime = performanceMetrics
      .filter(m => m.operation.includes('api_call'))
      .reduce((sum, m) => sum + m.duration, 0) / Math.max(1, performanceMetrics.filter(m => m.operation.includes('api_call')).length);

    console.log(`\n📈 AVERAGE RESPONSE TIME: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`🎯 TARGET RESPONSE TIME: ${PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME}ms`);

    if (avgResponseTime <= PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME) {
      console.log('✅ Performance targets met!');
    } else {
      console.log('⚠️  Performance targets not met. Consider optimization.');
    }

    // Save detailed report to file
    const fs = require('fs');
    const reportPath = './test-results/performance-report.json';

    try {
      if (!fs.existsSync('./test-results')) {
        fs.mkdirSync('./test-results');
      }

      fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
          totalTests,
          passedTests,
          failedTests,
          successRate: ((passedTests / totalTests) * 100).toFixed(2) + '%',
          avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
          targetResponseTime: PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME + 'ms',
        },
        details: performanceMetrics,
        generatedAt: new Date().toISOString(),
      }, null, 2));

      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.error('Failed to save performance report:', error);
    }
  }
});