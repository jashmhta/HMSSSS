// Test setup for Hospital Management System Backend
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Setup global mocks
global.console = {
  ...console,
  // Uncomment to ignore specific log levels during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global beforeAll setup
beforeAll(async () => {
  // Initialize test database connection
  // This will be handled by the test database configuration
});

// Global afterAll cleanup
afterAll(async () => {
  // Cleanup test database connection
  // This will be handled by the test database configuration
});

// Global beforeEach setup
beforeEach(() => {
  // Reset mocks and test state
  jest.clearAllMocks();
});

// Global afterEach cleanup
afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// Export test utilities
export const createTestingModule = async (): Promise<TestingModule> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  return moduleFixture;
};

// Export test constants
export const TEST_CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/hms_test',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379/1',
  JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret',
  API_KEY: process.env.API_KEY || 'test-api-key',
};