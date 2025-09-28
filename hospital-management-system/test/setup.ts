import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';

// Global test setup for enterprise-grade testing
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/hms_test';

  // Initialize test database
  await setupTestDatabase();
});

afterAll(async () => {
  // Clean up test database
  await cleanupTestDatabase();
});

// Setup test database
async function setupTestDatabase() {
  try {
    // Create test database if it doesn't exist
    execSync('createdb hms_test || true', { stdio: 'ignore' });

    // Run migrations
    execSync('npx prisma migrate deploy --schema=./backend/prisma/schema.prisma', {
      cwd: join(__dirname, '../'),
      stdio: 'inherit'
    });

    // Seed test data
    execSync('npx prisma db seed', {
      cwd: join(__dirname, '../backend'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.warn('Test database setup warning:', error.message);
  }
}

// Cleanup test database
async function cleanupTestDatabase() {
  try {
    // Drop test database
    execSync('dropdb hms_test || true', { stdio: 'ignore' });
  } catch (error) {
    console.warn('Test database cleanup warning:', error.message);
  }
}

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'DOCTOR',
    isActive: true,
    ...overrides
  }),

  // Create test patient
  createTestPatient: (overrides = {}) => ({
    id: 'test-patient-id',
    userId: 'test-user-id',
    mrn: 'MRN001',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'MALE',
    bloodType: 'O_POSITIVE',
    ...overrides
  }),

  // Create test lab test
  createTestLabTest: (overrides = {}) => ({
    id: 'test-lab-test-id',
    patientId: 'test-patient-id',
    testName: 'Complete Blood Count',
    testCode: 'CBC',
    category: 'HEMATOLOGY',
    status: 'ORDERED',
    orderedBy: 'test-user-id',
    ...overrides
  }),

  // Create test radiology test
  createTestRadiologyTest: (overrides = {}) => ({
    id: 'test-radiology-test-id',
    patientId: 'test-patient-id',
    testName: 'Chest X-Ray',
    testCode: 'CXR',
    modality: 'XRAY',
    status: 'ORDERED',
    orderedBy: 'test-user-id',
    ...overrides
  }),

  // Mock request object
  createMockRequest: (user = null) => ({
    user: user || global.testUtils.createTestUser(),
    headers: {},
    body: {},
    params: {},
    query: {}
  }),

  // Mock response object
  createMockResponse: () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  }),

  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random ID
  generateId: () => Math.random().toString(36).substr(2, 9),

  // Deep clone object
  deepClone: (obj: any) => JSON.parse(JSON.stringify(obj))
};

// Custom matchers for enterprise testing
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => `expected ${received} to be a valid date`,
      pass
    };
  },

  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass
    };
  },

  toHaveRequiredFields(received, fields) {
    const missingFields = fields.filter(field => !(field in received));
    const pass = missingFields.length === 0;
    return {
      message: () => `expected object to have required fields: ${missingFields.join(', ')}`,
      pass
    };
  }
});

// Mock external dependencies
jest.mock('@nestjs/config');
jest.mock('@nestjs/cache-manager');
jest.mock('@nestjs/bull');
jest.mock('nodemailer');
jest.mock('twilio');

// Performance monitoring for tests
global.performanceMonitor = {
  startTime: 0,
  start: function() {
    this.startTime = Date.now();
  },
  end: function(threshold = 1000) {
    const duration = Date.now() - this.startTime;
    if (duration > threshold) {
      console.warn(`Performance warning: Operation took ${duration}ms (threshold: ${threshold}ms)`);
    }
    return duration;
  }
};

// Memory leak detection
global.memoryMonitor = {
  initialMemory: 0,
  start: function() {
    if (global.gc) {
      global.gc();
    }
    this.initialMemory = process.memoryUsage().heapUsed;
  },
  end: function(threshold = 50 * 1024 * 1024) { // 50MB
    if (global.gc) {
      global.gc();
    }
    const currentMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = currentMemory - this.initialMemory;
    if (memoryIncrease > threshold) {
      console.warn(`Memory leak warning: Memory increased by ${memoryIncrease} bytes (threshold: ${threshold} bytes)`);
    }
    return memoryIncrease;
  }
};