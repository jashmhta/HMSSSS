import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

export class TestDatabaseConfig {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/hms_test',
        },
      },
    });
  }

  async setupTestDatabase(): Promise<void> {
    try {
      // Create test database if it doesn't exist
      await this.createTestDatabase();

      // Run migrations
      await this.runMigrations();

      // Seed test data
      await this.seedTestData();

      console.log('✅ Test database setup completed');
    } catch (error) {
      console.error('❌ Test database setup failed:', error);
      throw error;
    }
  }

  async teardownTestDatabase(): Promise<void> {
    try {
      // Clean up test data
      await this.cleanTestData();

      // Optionally drop test database
      // await this.dropTestDatabase();

      console.log('✅ Test database teardown completed');
    } catch (error) {
      console.error('❌ Test database teardown failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async createTestDatabase(): Promise<void> {
    const testDbName = 'hms_test';

    try {
      // Connect to default database to create test database
      const adminPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
          },
        },
      });

      await adminPrisma.$executeRaw`CREATE DATABASE ${testDbName} WITH OWNER = postgres;`;
      await adminPrisma.$disconnect();

      console.log(`✅ Test database '${testDbName}' created`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️  Test database '${testDbName}' already exists`);
      } else {
        throw error;
      }
    }
  }

  private async runMigrations(): Promise<void> {
    // Run Prisma migrations
    const { execSync } = require('child_process');

    try {
      execSync('npx prisma migrate deploy', {
        cwd: process.cwd(),
        stdio: 'pipe',
        env: {
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/hms_test',
        },
      });

      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  private async seedTestData(): Promise<void> {
    // Create essential test data
    await this.createTestUsers();
    await this.createTestPatients();
    await this.createTestDepartments();

    console.log('✅ Test data seeded');
  }

  private async cleanTestData(): Promise<void> {
    // Clean up in reverse order of dependencies
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

    console.log('✅ Test data cleaned');
  }

  private async dropTestDatabase(): Promise<void> {
    const testDbName = 'hms_test';

    try {
      const adminPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
          },
        },
      });

      // Terminate active connections to the test database
      await adminPrisma.$executeRaw`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = ${testDbName};
      `;

      // Drop the test database
      await adminPrisma.$executeRaw`DROP DATABASE IF EXISTS ${testDbName};`;

      await adminPrisma.$disconnect();

      console.log(`✅ Test database '${testDbName}' dropped`);
    } catch (error) {
      console.error('❌ Failed to drop test database:', error);
      throw error;
    }
  }

  private async createTestUsers(): Promise<void> {
    const testUsers = [
       {
         id: 'test-superadmin-id',
         email: 'superadmin@test.com',
         password: '$2b$10$eI6taUOMWXGmz.syXdwFzuKMafYokB0.71JAQxOjuIbxhad8JnGC6', // bcrypt hash for 'hmsadmin'
         firstName: 'Super',
         lastName: 'Admin',
         role: 'SUPERADMIN',
         isActive: true,
       },
       {
         id: 'test-admin-id',
         email: 'admin',
         password: '$2b$10$eI6taUOMWXGmz.syXdwFzuKMafYokB0.71JAQxOjuIbxhad8JnGC6',
         firstName: 'Test',
         lastName: 'Admin',
         role: 'ADMIN',
         isActive: true,
       },
       {
         id: 'test-doctor-id',
         email: 'doctor@test.com',
         password: '$2b$10$eI6taUOMWXGmz.syXdwFzuKMafYokB0.71JAQxOjuIbxhad8JnGC6',
         firstName: 'Test',
         lastName: 'Doctor',
         role: 'DOCTOR',
         isActive: true,
       },
       {
         id: 'test-nurse-id',
         email: 'nurse@test.com',
         password: '$2b$10$eI6taUOMWXGmz.syXdwFzuKMafYokB0.71JAQxOjuIbxhad8JnGC6',
         firstName: 'Test',
         lastName: 'Nurse',
         role: 'NURSE',
         isActive: true,
       },
       {
         id: 'test-lab-tech-id',
         email: 'labtech@test.com',
         password: '$2b$10$eI6taUOMWXGmz.syXdwFzuKMafYokB0.71JAQxOjuIbxhad8JnGC6',
         firstName: 'Test',
         lastName: 'Lab Tech',
         role: 'LAB_TECHNICIAN',
         isActive: true,
       },
       {
         id: 'test-patient-id',
         email: 'patient@test.com',
         password: '$2b$10$eI6taUOMWXGmz.syXdwFzuKMafYokB0.71JAQxOjuIbxhad8JnGC6',
         firstName: 'Test',
         lastName: 'Patient',
         role: 'PATIENT',
         isActive: true,
       },
    ];

    for (const user of testUsers) {
      await this.prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
  }

  private async createTestPatients(): Promise<void> {
    const testPatients = [
      {
        id: 'test-patient-1-id',
        userId: 'test-patient-id',
        mrn: 'MRN001',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        bloodType: 'O_POSITIVE',
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '+1234567890',
        allergies: ['Penicillin'],
        currentMedications: ['Aspirin 81mg daily'],
      },
      {
        id: 'test-patient-2-id',
        userId: 'test-patient-id',
        mrn: 'MRN002',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'FEMALE',
        bloodType: 'A_POSITIVE',
        emergencyContact: 'Family Member',
        emergencyPhone: '+1234567891',
        allergies: [],
        currentMedications: ['Metformin 500mg twice daily'],
      },
    ];

    for (const patient of testPatients) {
      await this.prisma.patient.upsert({
        where: { id: patient.id },
        update: patient,
        create: patient,
      });
    }
  }

  private async createTestDepartments(): Promise<void> {
    // Create test departments if your schema includes them
    // This is a placeholder for department creation
    console.log('ℹ️  Department seeding skipped (not implemented in current schema)');
  }

  // Utility methods for tests
  async getTestUser(role: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { role: role as any },
    });
    return user;
  }

  async getTestPatient(): Promise<any> {
    const patient = await this.prisma.patient.findFirst();
    return patient;
  }

  async createTestLabTest(patientId: string, overrides: any = {}): Promise<any> {
    const labTest = {
      id: `lab-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      testName: 'Complete Blood Count',
      testCode: 'CBC',
      category: 'HEMATOLOGY',
      status: 'ORDERED',
      orderedBy: 'test-doctor-id',
      ...overrides,
    };

    return await this.prisma.labTest.create({ data: labTest });
  }

  async createTestRadiologyTest(patientId: string, overrides: any = {}): Promise<any> {
    const radiologyTest = {
      id: `radiology-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      testName: 'Chest X-Ray',
      testCode: 'CXR',
      modality: 'XRAY',
      status: 'ORDERED',
      orderedBy: 'test-doctor-id',
      ...overrides,
    };

    return await this.prisma.radiologyTest.create({ data: radiologyTest });
  }

  async cleanupTestEntity(entityName: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    switch (entityName) {
      case 'labTest':
        await this.prisma.labTest.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      case 'radiologyTest':
        await this.prisma.radiologyTest.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      case 'patient':
        await this.prisma.patient.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      case 'user':
        await this.prisma.user.deleteMany({
          where: { id: { in: ids } },
        });
        break;
    }
  }
}

// Export singleton instance
export const testDatabaseConfig = new TestDatabaseConfig();