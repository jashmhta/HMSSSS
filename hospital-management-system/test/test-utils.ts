import { PrismaClient, UserRole, Gender, BloodType, LabTestStatus, RadiologyTestStatus, RadiologyModality } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

export class TestUtils {
  private prisma: PrismaClient;
  private app: INestApplication;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async setupTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();
    return this.app;
  }

  async teardownTestApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
    await this.prisma.$disconnect();
  }

  // Database cleanup utilities
  async cleanDatabase(): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.labTest.deleteMany(),
      this.prisma.radiologyTest.deleteMany(),
      this.prisma.prescription.deleteMany(),
      this.prisma.medication.deleteMany(),
      this.prisma.medicalRecord.deleteMany(),
      this.prisma.appointment.deleteMany(),
      this.prisma.patient.deleteMany(),
      this.prisma.user.deleteMany(),
    ]);
  }

  // User creation utilities
  async createTestUser(overrides: Partial<any> = {}): Promise<any> {
    const userData = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `test-${Date.now()}@example.com`,
       password: 'hmsadmin',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: UserRole.DOCTOR,
      isActive: true,
      tenantId: 'test-tenant',
      ...overrides
    };

    return await this.prisma.user.create({ data: userData });
  }

  async createTestPatient(userId: string, overrides: Partial<any> = {}): Promise<any> {
    const patientData = {
      id: `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      tenantId: 'test-tenant',
      mrn: `MRN${Date.now()}`,
      dateOfBirth: new Date('1990-01-01'),
      gender: Gender.MALE,
      bloodType: BloodType.O_POSITIVE,
      emergencyContact: 'Emergency Contact',
      emergencyPhone: '+1234567890',
      address: { street: '123 Test St', city: 'Test City', state: 'Test State', zipCode: '12345' },
      allergies: [],
      currentMedications: [],
      ...overrides
    };

    return await this.prisma.patient.create({ data: patientData });
  }

  // Laboratory test utilities
  async createTestLabTest(patientId: string, orderedBy: string, overrides: Partial<any> = {}): Promise<any> {
    const labTestData = {
      id: `lab-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      tenantId: 'test-tenant',
      testName: 'Complete Blood Count',
      testCode: 'CBC',
      category: 'HEMATOLOGY',
      status: LabTestStatus.ORDERED,
      orderedBy,
      specimenType: 'Blood',
      urgent: false,
      ...overrides
    };

    return await this.prisma.labTest.create({ data: labTestData });
  }

  async createTestRadiologyTest(patientId: string, orderedBy: string, overrides: Partial<any> = {}): Promise<any> {
    const radiologyTestData = {
      id: `radiology-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      testName: 'Chest X-Ray',
      testCode: 'CXR',
      modality: RadiologyModality.XRAY,
      status: RadiologyTestStatus.ORDERED,
      orderedBy,
      urgent: false,
      ...overrides
    };

    return await this.prisma.radiologyTest.create({ data: radiologyTestData });
  }

  // Authentication utilities
  async getAuthToken(user: any): Promise<string> {
    // Mock JWT token generation for testing
    return `mock-jwt-token-${user.id}`;
  }

  // API testing utilities
  async makeAuthenticatedRequest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    token: string,
    data?: any
  ): Promise<request.Test> {
    let req = request(this.app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${token}`);

    if (data && (method === 'post' || method === 'put' || method === 'patch')) {
      req = req.send(data);
    }

    return req;
  }

  // Validation utilities
  validateLabTestResponse(data: any): void {
    expect(data).toHaveRequiredFields(['id', 'patientId', 'testName', 'testCode', 'status', 'orderedDate']);
    expect(data.id).toBeValidUUID();
    expect(['ORDERED', 'SPECIMEN_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).toContain(data.status);
  }

  validateRadiologyTestResponse(data: any): void {
    expect(data).toHaveRequiredFields(['id', 'patientId', 'testName', 'testCode', 'modality', 'status', 'orderedDate']);
    expect(data.id).toBeValidUUID();
    expect(['ORDERED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).toContain(data.status);
  }

  // Performance testing utilities
  async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }

  // Memory usage monitoring
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  // Database connection health check
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  // Bulk data creation for performance testing
  async createBulkPatients(count: number): Promise<any[]> {
    const patients = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser({
        email: `bulk-patient-${i}@example.com`,
        firstName: `Patient${i}`,
        lastName: 'Test',
        role: UserRole.PATIENT
      });
      const patient = await this.createTestPatient(user.id, {
        mrn: `BULK${i.toString().padStart(6, '0')}`
      });
      patients.push(patient);
    }
    return patients;
  }

  async createBulkLabTests(count: number, patientIds: string[], orderedBy: string): Promise<any[]> {
    const labTests = [];
    for (let i = 0; i < count; i++) {
      const patientId = patientIds[i % patientIds.length];
      const labTest = await this.createTestLabTest(patientId, orderedBy, {
        testName: `Bulk Test ${i}`,
        testCode: `BT${i}`,
        category: 'CHEMISTRY'
      });
      labTests.push(labTest);
    }
    return labTests;
  }
}

// Export singleton instance
export const testUtils = new TestUtils();