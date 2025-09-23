// Integration test setup for enterprise-grade testing

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// Global variables for integration tests
let app: INestApplication;
let prisma: PrismaClient;
let moduleFixture: TestingModule;

// Setup integration test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/hms_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration';
  process.env.JWT_EXPIRES_IN = '3600';
  process.env.BCRYPT_ROUNDS = '12';
  process.env.LOG_LEVEL = 'error';

  // Initialize Prisma client for test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Connect to test database
    await prisma.$connect();
    console.log('✅ Connected to test database for integration tests');

    // Clean up any existing test data
    await cleanupTestData();

    // Run database migrations
    await runMigrations();

    // Create NestJS testing module
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Create and configure the application
    app = moduleFixture.createNestApplication();

    // Apply the same configuration as the main application
    app.useGlobalPipes(
      new (require('@nestjs/common').ValidationPipe)({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
        enableDebugMessages: true
      })
    );

    // Apply global filters
    app.useGlobalFilters(
      new (require('@nestjs/common').AllExceptionsFilter)()
    );

    // Enable CORS
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
    });

    // Initialize the application
    await app.init();

    // Set global variables for test access
    global.app = app;
    global.prisma = prisma;
    global.testRequest = request(app.getHttpServer());

    console.log('✅ Integration test environment setup completed');

  } catch (error) {
    console.error('❌ Integration test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Clean up test data
    await cleanupTestData();

    // Close application
    if (app) {
      await app.close();
    }

    // Disconnect from database
    if (prisma) {
      await prisma.$disconnect();
    }

    console.log('✅ Integration test environment cleanup completed');
  } catch (error) {
    console.error('❌ Integration test cleanup failed:', error);
    throw error;
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  await cleanupTestData();

  // Reset all mocks
  jest.clearAllMocks();
  jest.resetAllMocks();
});

// Test data cleanup utility
async function cleanupTestData(): Promise<void> {
  try {
    // Clean up in reverse order of dependencies
    await prisma.$transaction([
      prisma.labTest.deleteMany(),
      prisma.radiologyTest.deleteMany(),
      prisma.prescription.deleteMany(),
      prisma.medication.deleteMany(),
      prisma.medicalRecord.deleteMany(),
      prisma.appointment.deleteMany(),
      prisma.patient.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Reset auto-increment sequences
    await prisma.$executeRaw`
      SELECT setval(pg_get_serial_sequence('"User"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"Patient"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"Appointment"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"MedicalRecord"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"LabTest"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"RadiologyTest"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"Medication"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"Prescription"', 'id'), 1, false);
    `;

  } catch (error) {
    console.warn('Test data cleanup warning:', error.message);
  }
}

// Database migration utility
async function runMigrations(): Promise<void> {
  try {
    // Run Prisma migrations for test database
    const { execSync } = require('child_process');

    execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL
      },
    });

    console.log('✅ Database migrations completed for integration tests');
  } catch (error) {
    console.error('❌ Database migrations failed:', error.message);
    throw error;
  }
}

// Test user creation utilities
export async function createTestUser(userData: any = {}): Promise<any> {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    password: '$2b$10$eI6taUOMWXGmz.syXdwFzuKMafYokB0.71JAQxOjuIbxhad8JnGC6', // bcrypt hash for 'hmsadmin'
    phone: '+1234567890',
    role: 'DOCTOR',
    isActive: true,
    ...userData
  };

  return await prisma.user.create({ data: defaultUser });
}

export async function createTestPatient(userId: string, patientData: any = {}): Promise<any> {
  const defaultPatient = {
    userId,
    mrn: `MRN${Date.now()}`,
    dateOfBirth: new Date('1990-01-01'),
    gender: 'MALE',
    bloodType: 'O_POSITIVE',
    emergencyContact: 'Emergency Contact',
    emergencyPhone: '+1234567890',
    address: { street: '123 Test St', city: 'Test City', state: 'Test State', zipCode: '12345' },
    allergies: [],
    currentMedications: [],
    ...patientData
  };

  return await prisma.patient.create({ data: defaultPatient });
}

export async function createTestLabTest(patientId: string, orderedBy: string, labTestData: any = {}): Promise<any> {
  const defaultLabTest = {
    patientId,
    testName: 'Complete Blood Count',
    testCode: 'CBC',
    category: 'HEMATOLOGY',
    status: 'ORDERED',
    orderedBy,
    specimenType: 'Blood',
    urgent: false,
    ...labTestData
  };

  return await prisma.labTest.create({ data: defaultLabTest });
}

export async function createTestRadiologyTest(patientId: string, orderedBy: string, radiologyTestData: any = {}): Promise<any> {
  const defaultRadiologyTest = {
    patientId,
    testName: 'Chest X-Ray',
    testCode: 'CXR',
    modality: 'XRAY',
    status: 'ORDERED',
    orderedBy,
    urgent: false,
    ...radiologyTestData
  };

  return await prisma.radiologyTest.create({ data: defaultRadiologyTest });
}

// Authentication utilities
export async function getAuthToken(user: any): Promise<string> {
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: user.email,
      password: 'hmsadmin' // Default test password
    })
    .expect(200);

  return loginResponse.body.access_token;
}

// API testing utilities
export function createAuthenticatedRequest(token: string) {
  return request(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json');
}

// Performance monitoring for integration tests
export function measureApiCall<T>(fn: () => Promise<T>, threshold: number = 1000): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;

      if (duration > threshold) {
        console.warn(`Performance warning: API call took ${duration}ms (threshold: ${threshold}ms)`);
      }

      resolve({ result, duration });
    } catch (error) {
      reject(error);
    }
  });
}

// Validation utilities
export function validateUserResponse(data: any): void {
  expect(data).toHaveRequiredFields(['id', 'email', 'firstName', 'lastName', 'role', 'isActive']);
  expect(data.id).toBeValidUUID();
  expect(data.email).toBeValidEmail();
  expect(['SUPERADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST', 'RECEPTIONIST', 'BILLING_STAFF', 'RADIOLOGIST', 'PATIENT']).toContain(data.role);
  expect(typeof data.isActive).toBe('boolean');
}

export function validatePatientResponse(data: any): void {
  expect(data).toHaveRequiredFields(['id', 'userId', 'mrn', 'dateOfBirth', 'gender', 'bloodType']);
  expect(data.id).toBeValidUUID();
  expect(data.userId).toBeValidUUID();
  expect(data.dateOfBirth).toBeValidDate();
  expect(['MALE', 'FEMALE', 'OTHER']).toContain(data.gender);
  expect(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']).toContain(data.bloodType);
}

export function validateLabTestResponse(data: any): void {
  expect(data).toHaveRequiredFields(['id', 'patientId', 'testName', 'testCode', 'category', 'status', 'orderedDate']);
  expect(data.id).toBeValidUUID();
  expect(data.patientId).toBeValidUUID();
  expect(data.orderedDate).toBeValidDate();
  expect(['ORDERED', 'SPECIMEN_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).toContain(data.status);
}

export function validateRadiologyTestResponse(data: any): void {
  expect(data).toHaveRequiredFields(['id', 'patientId', 'testName', 'testCode', 'modality', 'status', 'orderedDate']);
  expect(data.id).toBeValidUUID();
  expect(data.patientId).toBeValidUUID();
  expect(data.orderedDate).toBeValidDate();
  expect(['ORDERED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).toContain(data.status);
}

// Error response validation
export function validateErrorResponse(data: any, expectedStatusCode: number): void {
  expect(data).toHaveProperty('statusCode');
  expect(data).toHaveProperty('message');
  expect(data.statusCode).toBe(expectedStatusCode);
  expect(typeof data.message).toBe('string');
}

// Pagination response validation
export function validatePaginatedResponse(data: any): void {
  expect(data).toHaveRequiredFields(['items', 'total', 'page', 'limit', 'totalPages']);
  expect(Array.isArray(data.items)).toBe(true);
  expect(typeof data.total).toBe('number');
  expect(typeof data.page).toBe('number');
  expect(typeof data.limit).toBe('number');
  expect(typeof data.totalPages).toBe('number');
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

// Application health check
export async function checkApplicationHealth(): Promise<boolean> {
  try {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    return response.body.status === 'ok';
  } catch (error) {
    return false;
  }
}

// Export utilities for use in integration tests
(global as any).testUtils = {
  createTestUser,
  createTestPatient,
  createTestLabTest,
  createTestRadiologyTest,
  getAuthToken,
  createAuthenticatedRequest,
  measureApiCall,
  validateUserResponse,
  validatePatientResponse,
  validateLabTestResponse,
  validateRadiologyTestResponse,
  validateErrorResponse,
  validatePaginatedResponse,
  checkDatabaseHealth,
  checkApplicationHealth
};