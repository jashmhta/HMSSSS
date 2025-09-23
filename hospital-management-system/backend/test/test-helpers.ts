import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { TestDatabaseManager, createTestUser, getTestAuthHeaders } from './test-database.config';

// Test application wrapper
export class TestApp {
  private app: INestApplication;
  private module: TestingModule;
  private prisma: PrismaService;

  async initialize(): Promise<void> {
    this.module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.module.createNestApplication();
    this.prisma = this.module.get<PrismaService>(PrismaService);

    // Set up test environment
    process.env.NODE_ENV = 'test';

    await this.app.init();
  }

  getApp(): INestApplication {
    return this.app;
  }

  getModule(): TestingModule {
    return this.module;
  }

  getPrisma(): PrismaService {
    return this.prisma;
  }

  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  // HTTP request helpers
  async get(url: string, headers?: Record<string, string>) {
    return request(this.app.getHttpServer())
      .get(url)
      .set(headers || {});
  }

  async post(url: string, data?: any, headers?: Record<string, string>) {
    return request(this.app.getHttpServer())
      .post(url)
      .send(data)
      .set(headers || {});
  }

  async put(url: string, data?: any, headers?: Record<string, string>) {
    return request(this.app.getHttpServer())
      .put(url)
      .send(data)
      .set(headers || {});
  }

  async patch(url: string, data?: any, headers?: Record<string, string>) {
    return request(this.app.getHttpServer())
      .patch(url)
      .send(data)
      .set(headers || {});
  }

  async delete(url: string, headers?: Record<string, string>) {
    return request(this.app.getHttpServer())
      .delete(url)
      .set(headers || {});
  }
}

// Authentication test helpers
export class AuthTestHelper {
  private testApp: TestApp;
  private testUsers: Map<Role, any> = new Map();

  constructor(testApp: TestApp) {
    this.testApp = testApp;
  }

  async createTestUsers(): Promise<void> {
    const roles = [Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.PATIENT, Role.RECEPTIONIST];

    for (const role of roles) {
      const userData = {
        email: `${role.toLowerCase()}@test.com`,
        password: 'Test123!',
        firstName: 'Test',
        lastName: role.charAt(0) + role.slice(1).toLowerCase(),
        role,
        isActive: true,
      };

      const user = await createTestUser(userData);
      this.testUsers.set(role, user);
    }
  }

  async login(role: Role): Promise<{ token: string; user: any }> {
    const testUser = this.testUsers.get(role);
    if (!testUser) {
      throw new Error(`Test user for role ${role} not found`);
    }

    const response = await this.testApp.post('/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');

    return {
      token: response.body.access_token,
      user: response.body.user,
    };
  }

  getAuthHeaders(role: Role): Record<string, string> {
    const testUser = this.testUsers.get(role);
    if (!testUser) {
      throw new Error(`Test user for role ${role} not found`);
    }

    return getTestAuthHeaders(testUser);
  }

  getTestUser(role: Role): any {
    return this.testUsers.get(role);
  }
}

// Test data builders
export class TestDataBuilder {
  static user(overrides: Partial<any> = {}): any {
    return {
      email: `user.${Date.now()}@test.com`,
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: Role.PATIENT,
      isActive: true,
      ...overrides,
    };
  }

  static patient(overrides: Partial<any> = {}): any {
    return {
      firstName: 'Test',
      lastName: 'Patient',
      email: `patient.${Date.now()}@test.com`,
      phone: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'MALE',
      bloodType: 'A+',
      address: '123 Test St',
      emergencyContact: 'Emergency Contact',
      emergencyPhone: '+1234567891',
      medicalHistory: 'No known conditions',
      ...overrides,
    };
  }

  static appointment(overrides: Partial<any> = {}): any {
    return {
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      appointmentTime: '09:00',
      duration: 30,
      status: 'SCHEDULED',
      type: 'GENERAL_CONSULTATION',
      reason: 'Regular checkup',
      notes: 'Patient needs consultation',
      ...overrides,
    };
  }

  static medicalRecord(overrides: Partial<any> = {}): any {
    return {
      diagnosis: 'Test diagnosis',
      treatment: 'Test treatment',
      notes: 'Test notes',
      visitDate: new Date(),
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ...overrides,
    };
  }

  static prescription(overrides: Partial<any> = {}): any {
    return {
      medication: 'Test Medication',
      dosage: '10mg',
      frequency: 'Twice daily',
      duration: '7 days',
      instructions: 'Take with food',
      ...overrides,
    };
  }

  static labTest(overrides: Partial<any> = {}): any {
    return {
      testName: 'Complete Blood Count',
      testType: 'BLOOD_TEST',
      status: 'PENDING',
      orderedDate: new Date(),
      expectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes: 'Routine blood work',
      ...overrides,
    };
  }

  static billing(overrides: Partial<any> = {}): any {
    return {
      amount: 100.00,
      description: 'Test billing item',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ...overrides,
    };
  }
}

// Test assertion helpers
export class TestAssertions {
  static expectSuccess(response: any, expectedStatus = 200): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', true);
  }

  static expectError(response: any, expectedStatus = 400, expectedMessage?: string): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  }

  static expectPagination(response: any): void {
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('totalPages');
  }

  static expectValidUser(user: any): void {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('firstName');
    expect(user).toHaveProperty('lastName');
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('isActive');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  }

  static expectValidPatient(patient: any): void {
    expect(patient).toHaveProperty('id');
    expect(patient).toHaveProperty('firstName');
    expect(patient).toHaveProperty('lastName');
    expect(patient).toHaveProperty('email');
    expect(patient).toHaveProperty('phone');
    expect(patient).toHaveProperty('dateOfBirth');
    expect(patient).toHaveProperty('gender');
    expect(patient).toHaveProperty('bloodType');
    expect(patient).toHaveProperty('address');
    expect(patient).toHaveProperty('createdAt');
    expect(patient).toHaveProperty('updatedAt');
  }

  static expectValidAppointment(appointment: any): void {
    expect(appointment).toHaveProperty('id');
    expect(appointment).toHaveProperty('patientId');
    expect(appointment).toHaveProperty('doctorId');
    expect(appointment).toHaveProperty('appointmentDate');
    expect(appointment).toHaveProperty('appointmentTime');
    expect(appointment).toHaveProperty('duration');
    expect(appointment).toHaveProperty('status');
    expect(appointment).toHaveProperty('type');
    expect(appointment).toHaveProperty('createdAt');
    expect(appointment).toHaveProperty('updatedAt');
  }

  static expectValidMedicalRecord(record: any): void {
    expect(record).toHaveProperty('id');
    expect(record).toHaveProperty('patientId');
    expect(record).toHaveProperty('doctorId');
    expect(record).toHaveProperty('diagnosis');
    expect(record).toHaveProperty('treatment');
    expect(record).toHaveProperty('visitDate');
    expect(record).toHaveProperty('createdAt');
    expect(record).toHaveProperty('updatedAt');
  }

  static expectValidPrescription(prescription: any): void {
    expect(prescription).toHaveProperty('id');
    expect(prescription).toHaveProperty('patientId');
    expect(prescription).toHaveProperty('doctorId');
    expect(prescription).toHaveProperty('medication');
    expect(prescription).toHaveProperty('dosage');
    expect(prescription).toHaveProperty('frequency');
    expect(prescription).toHaveProperty('duration');
    expect(prescription).toHaveProperty('createdAt');
    expect(prescription).toHaveProperty('updatedAt');
  }

  static expectValidLabTest(test: any): void {
    expect(test).toHaveProperty('id');
    expect(test).toHaveProperty('patientId');
    expect(test).toHaveProperty('testName');
    expect(test).toHaveProperty('testType');
    expect(test).toHaveProperty('status');
    expect(test).toHaveProperty('orderedDate');
    expect(test).toHaveProperty('createdAt');
    expect(test).toHaveProperty('updatedAt');
  }

  static expectValidBilling(billing: any): void {
    expect(billing).toHaveProperty('id');
    expect(billing).toHaveProperty('patientId');
    expect(billing).toHaveProperty('amount');
    expect(billing).toHaveProperty('description');
    expect(billing).toHaveProperty('status');
    expect(billing).toHaveProperty('dueDate');
    expect(billing).toHaveProperty('createdAt');
    expect(billing).toHaveProperty('updatedAt');
  }
}

// Test performance helpers
export class TestPerformance {
  static async measureTime<T>(operation: () => Promise<T>, thresholdMs = 1000): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;

    if (duration > thresholdMs) {
      console.warn(`Performance warning: Operation took ${duration}ms (threshold: ${thresholdMs}ms)`);
    }

    return { result, duration };
  }

  static async measureMemory<T>(operation: () => Promise<T>, thresholdBytes = 1024 * 1024): Promise<{ result: T; memoryIncrease: number }> {
    const startMemory = process.memoryUsage().heapUsed;
    const result = await operation();
    const endMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = endMemory - startMemory;

    if (memoryIncrease > thresholdBytes) {
      console.warn(`Memory warning: Operation increased memory by ${memoryIncrease} bytes (threshold: ${thresholdBytes} bytes)`);
    }

    return { result, memoryIncrease };
  }
}

// Test security helpers
export class TestSecurity {
  static expectNoSensitiveData(response: any, fields: string[] = ['password', 'passwordHash', 'salt', 'token']): void {
    const responseBody = JSON.stringify(response.body);

    for (const field of fields) {
      expect(responseBody).not.toContain(field);
    }
  }

  static expectAuthenticationRequired(response: any): void {
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toMatch(/unauthorized/i);
  }

  static expectAuthorizationRequired(response: any): void {
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toMatch(/forbidden/i);
  }

  static expectRateLimited(response: any): void {
    expect([429, 403]).toContain(response.status);
    expect(response.body).toHaveProperty('message');
  }

  static expectInputValidation(response: any): void {
    expect([400, 422]).toContain(response.status);
    expect(response.body).toHaveProperty('message');
  }
}

// Test environment utilities
export const setupTestEnvironment = async (): Promise<TestApp> => {
  const testApp = new TestApp();
  await testApp.initialize();
  return testApp;
};

export const teardownTestEnvironment = async (testApp: TestApp): Promise<void> => {
  await testApp.close();
};

export const createAuthHelper = async (testApp: TestApp): Promise<AuthTestHelper> => {
  const authHelper = new AuthTestHelper(testApp);
  await authHelper.createTestUsers();
  return authHelper;
};

// Mock utilities
export const createMockContext = () => ({
  req: {
    user: { id: 'test-user-id', email: 'test@example.com', role: Role.PATIENT },
    headers: {},
    ip: '127.0.0.1',
  },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  },
});

export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

export const createMockConfigService = () => ({
  get: jest.fn((key: string) => {
    const defaults = {
      'JWT_SECRET': 'test-secret',
      'DATABASE_URL': 'postgresql://test:test@localhost:5432/test',
      'REDIS_URL': 'redis://localhost:6379',
      'BCRYPT_ROUNDS': 10,
    };
    return defaults[key];
  }),
});

// Test data utilities
export const generateTestData = {
  email: () => `test.${Date.now()}@example.com`,
  phone: () => `+1${Math.floor(Math.random() * 10000000000)}`,
  uuid: () => require('uuid').v4(),
  date: (daysFromNow = 0) => new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000),
  string: (length = 10) => Math.random().toString(36).substring(2, 2 + length),
  number: (min = 0, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min,
};

// Wait utilities
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitFor = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (condition()) {
      return;
    }
    await wait(interval);
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};