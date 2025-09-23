import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export interface TestDatabaseConfig {
  url: string;
  name: string;
  schema?: string;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
}

export class TestDatabaseManager {
  private prisma: PrismaService;
  private config: ConfigService;
  private testDbName: string;
  private originalDbUrl: string;

  constructor() {
    this.testDbName = `hms_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.originalDbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/hms_dev';
  }

  async initialize(): Promise<void> {
    // Create test database
    await this.createTestDatabase();

    // Initialize Prisma service
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    this.prisma = module.get<PrismaService>(PrismaService);
    this.config = module.get<ConfigService>(ConfigService);

    // Update database URL for test
    const testDbUrl = this.originalDbUrl.replace('/hms_dev', `/${this.testDbName}`);
    process.env.DATABASE_URL = testDbUrl;

    // Run migrations
    await this.runMigrations();

    // Seed test data
    await this.seedTestData();
  }

  private async createTestDatabase(): Promise<void> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      // Create test database using psql
      await execAsync(`createdb "${this.testDbName}"`);
      console.log(`Created test database: ${this.testDbName}`);
    } catch (error) {
      console.error('Error creating test database:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    const { execSync } = require('child_process');

    try {
      // Run Prisma migrations
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
      });
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }

  private async seedTestData(): Promise<void> {
    // Seed test users with different roles
    const testUsers: Omit<TestUser, 'id'>[] = [
      {
        email: 'admin@hms.test',
        password: await bcrypt.hash('Admin123!', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        isActive: true,
      },
      {
        email: 'doctor@hms.test',
        password: await bcrypt.hash('Doctor123!', 10),
        firstName: 'Doctor',
        lastName: 'Smith',
        role: Role.DOCTOR,
        isActive: true,
      },
      {
        email: 'nurse@hms.test',
        password: await bcrypt.hash('Nurse123!', 10),
        firstName: 'Nurse',
        lastName: 'Johnson',
        role: Role.NURSE,
        isActive: true,
      },
      {
        email: 'patient@hms.test',
        password: await bcrypt.hash('Patient123!', 10),
        firstName: 'John',
        lastName: 'Doe',
        role: Role.PATIENT,
        isActive: true,
      },
      {
        email: 'receptionist@hms.test',
        password: await bcrypt.hash('Reception123!', 10),
        firstName: 'Reception',
        lastName: 'Staff',
        role: Role.RECEPTIONIST,
        isActive: true,
      },
    ];

    // Create users in database
    for (const userData of testUsers) {
      await this.prisma.user.create({
        data: userData,
      });
    }

    // Seed test patients
    const testPatients = [
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        phone: '+1234567890',
        dateOfBirth: new Date('1980-01-15'),
        gender: 'FEMALE',
        bloodType: 'A+',
        address: '123 Test St, Test City, TC 12345',
        emergencyContact: 'John Smith',
        emergencyPhone: '+1234567891',
        medicalHistory: 'No known allergies',
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@test.com',
        phone: '+1234567892',
        dateOfBirth: new Date('1975-05-20'),
        gender: 'MALE',
        bloodType: 'O+',
        address: '456 Test Ave, Test Town, TT 67890',
        emergencyContact: 'Mary Johnson',
        emergencyPhone: '+1234567893',
        medicalHistory: 'Asthma, Allergic to penicillin',
      },
    ];

    for (const patientData of testPatients) {
      await this.prisma.patient.create({
        data: patientData,
      });
    }

    // Seed test appointments
    const doctor = await this.prisma.user.findFirst({
      where: { role: Role.DOCTOR },
    });
    const patient = await this.prisma.patient.findFirst();

    if (doctor && patient) {
      const testAppointments = [
        {
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          appointmentTime: '09:00',
          duration: 30,
          status: 'SCHEDULED',
          type: 'GENERAL_CONSULTATION',
          reason: 'Regular checkup',
          notes: 'Patient needs annual physical examination',
        },
        {
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
          appointmentTime: '14:30',
          duration: 45,
          status: 'SCHEDULED',
          type: 'FOLLOW_UP',
          reason: 'Follow-up consultation',
          notes: 'Follow-up for previous treatment',
        },
      ];

      for (const appointmentData of testAppointments) {
        await this.prisma.appointment.create({
          data: appointmentData,
        });
      }
    }

    console.log('Test data seeded successfully');
  }

  async cleanup(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }

    // Drop test database
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync(`dropdb "${this.testDbName}"`);
      console.log(`Dropped test database: ${this.testDbName}`);
    } catch (error) {
      console.error('Error dropping test database:', error);
      // Don't throw error here to allow other cleanup to continue
    }
  }

  async clearDatabase(): Promise<void> {
    if (!this.prisma) {
      return;
    }

    const tables = [
      'Appointment', 'MedicalRecord', 'Prescription', 'LabTest', 'RadiologyTest',
      'Billing', 'Payment', 'Patient', 'User'
    ];

    for (const table of tables) {
      try {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      } catch (error) {
        // Table might not exist, continue
      }
    }
  }

  async getTestUser(role: Role): Promise<TestUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { role },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      password: 'password123', // Plain password for testing
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  }

  async getTestPatient(): Promise<any> {
    return this.prisma.patient.findFirst();
  }

  async getTestAppointment(): Promise<any> {
    return this.prisma.appointment.findFirst();
  }

  getPrismaService(): PrismaService {
    return this.prisma;
  }

  getTestDbName(): string {
    return this.testDbName;
  }
}

// Global test database manager instance
export const testDbManager = new TestDatabaseManager();

// Test database setup and teardown utilities
export const setupTestDatabase = async (): Promise<void> => {
  await testDbManager.initialize();
};

export const teardownTestDatabase = async (): Promise<void> => {
  await testDbManager.cleanup();
};

export const clearTestData = async (): Promise<void> => {
  await testDbManager.clearDatabase();
};

// Test data creation utilities
export const createTestUser = async (userData: Partial<TestUser>): Promise<TestUser> => {
  const defaultData: Omit<TestUser, 'id'> = {
    email: 'test@example.com',
    password: await bcrypt.hash('Test123!', 10),
    firstName: 'Test',
    lastName: 'User',
    role: Role.PATIENT,
    isActive: true,
  };

  const finalData = { ...defaultData, ...userData };

  const user = await testDbManager.getPrismaService().user.create({
    data: finalData,
  });

  return {
    id: user.id,
    email: user.email,
    password: userData.password || 'Test123!',
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
  };
};

export const createTestPatient = async (patientData: any): Promise<any> => {
  const defaultPatient = {
    firstName: 'Test',
    lastName: 'Patient',
    email: `test.patient.${Date.now()}@test.com`,
    phone: '+1234567890',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'MALE',
    bloodType: 'A+',
    address: '123 Test St',
    emergencyContact: 'Emergency Contact',
    emergencyPhone: '+1234567891',
  };

  const finalData = { ...defaultPatient, ...patientData };

  return testDbManager.getPrismaService().patient.create({
    data: finalData,
  });
};

export const createTestAppointment = async (appointmentData: any): Promise<any> => {
  const doctor = await testDbManager.getTestUser(Role.DOCTOR);
  const patient = await testDbManager.getTestPatient();

  if (!doctor || !patient) {
    throw new Error('Test doctor or patient not found');
  }

  const defaultAppointment = {
    patientId: patient.id,
    doctorId: doctor.id,
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    appointmentTime: '09:00',
    duration: 30,
    status: 'SCHEDULED',
    type: 'GENERAL_CONSULTATION',
    reason: 'Test appointment',
  };

  const finalData = { ...defaultAppointment, ...appointmentData };

  return testDbManager.getPrismaService().appointment.create({
    data: finalData,
  });
};

// Test authentication utilities
export const createTestAuthToken = (user: TestUser): string => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1h' }
  );
};

export const getTestAuthHeaders = (user: TestUser): Record<string, string> => {
  const token = createTestAuthToken(user);
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Test request utilities
export const createTestRequest = (
  method: string,
  path: string,
  data?: any,
  headers?: Record<string, string>
) => {
  return {
    method,
    path,
    data,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
};

// Test assertion utilities
export const expectSuccessResponse = (response: any, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', true);
};

export const expectErrorResponse = (response: any, expectedStatus = 400) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
};

export const expectValidUUID = (uuid: string) => {
  expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
};

export const expectValidEmail = (email: string) => {
  expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

export const expectValidPhone = (phone: string) => {
  expect(phone).match(/^\+?[1-9]\d{1,14}$/);
};