/*[object Object]*/

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../src/database/prisma.service';

export const testUtils = {
  // Test database cleanup
  async cleanDatabase(prisma: PrismaService) {
    const models = [
      'user',
      'patient',
      'doctor',
      'appointment',
      'medicalRecord',
      'prescription',
      'radiologyTest',
      'labTest',
      'surgery',
      'billing',
      'invoice',
      'payment',
      'servicePricing',
      'medicine',
      'servicePackage',
    ];

    for (const model of models) {
      try {
        await (prisma as any)[model].deleteMany({});
      } catch (error) {
        // Model might not exist or have foreign key constraints
        console.warn(`Could not clean ${model}:`, error.message);
      }
    }
  },

  // Create test user
  async createTestUser(userData: any, prisma: PrismaService) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    return prisma.user.create({
      data: {
        email: userData.email || 'test@example.com',
        password: hashedPassword,
        firstName: userData.firstName || 'Test',
        lastName: userData.lastName || 'User',
        phone: userData.phone || '1234567890',
        role: userData.role || 'PATIENT',
        isActive: true,
      },
    });
  },

  // Create test patient
  async createTestPatient(userId: string, prisma: PrismaService) {
    return prisma.patient.create({
      data: {
        userId,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        bloodType: 'O+',
        address: '123 Test St',
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '9876543210',
      },
    });
  },

  // Create test doctor
  async createTestDoctor(userData: any, prisma: PrismaService) {
    const user = await this.createTestUser({ ...userData, role: 'DOCTOR' }, prisma);

    return prisma.doctor.create({
      data: {
        userId: user.id,
        specialization: userData.specialization || 'General Medicine',
        licenseNumber: userData.licenseNumber || 'LIC123456',
        department: userData.department || 'General',
        consultationFee: userData.consultationFee || 500,
        availability:
          userData.availability ||
          JSON.stringify({
            monday: ['9:00-17:00'],
            tuesday: ['9:00-17:00'],
            wednesday: ['9:00-17:00'],
            thursday: ['9:00-17:00'],
            friday: ['9:00-17:00'],
          }),
      },
    });
  },

  // Get auth token for testing
  async getAuthToken(user: any, jwtService: JwtService) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return jwtService.sign(payload);
  },

  // Setup test app
  async setupTestApp(moduleBuilder: any) {
    const module = await moduleBuilder.compile();
    const app = module.createNestApplication();
    await app.init();

    const prisma = module.get(PrismaService);
    const jwtService = module.get(JwtService);

    return { app, prisma, jwtService };
  },

  // Teardown test app
  async teardownTestApp(app: any, prisma?: PrismaService) {
    if (prisma) {
      await this.cleanDatabase(prisma);
    }
    await app.close();
  },

  // Common test data
  getTestAppointmentData() {
    return {
      patientId: '',
      doctorId: '',
      appointmentDate: new Date(),
      appointmentType: 'CONSULTATION',
      status: 'SCHEDULED',
      reason: 'Regular checkup',
      notes: 'Patient needs routine examination',
    };
  },

  getTestRadiologyData() {
    return {
      patientId: '',
      testName: 'Chest X-Ray',
      testCode: 'CXR',
      modality: 'XRAY',
      scheduledDate: new Date(),
      urgent: false,
      clinicalNotes: 'Patient reports chest pain',
      orderedBy: '',
    };
  },

  getTestPrescriptionData() {
    return {
      patientId: '',
      doctorId: '',
      medications: [
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Three times daily',
          duration: '5 days',
          instructions: 'Take after meals',
        },
      ],
      diagnosis: 'Fever',
      notes: 'Follow up after 5 days',
    };
  },

  // Create test lab test
  async createTestLabTest(
    patientId: string,
    orderedBy: string,
    prisma: PrismaService,
    additionalData = {},
  ) {
    // First create a test catalog entry if it doesn't exist
    const testCatalog = await prisma.labTestCatalog.upsert({
      where: { id: additionalData.testCatalogId || 'test-catalog-id' },
      update: {},
      create: {
        id: additionalData.testCatalogId || 'test-catalog-id',
        testName: additionalData.testName || 'Complete Blood Count',
        testCode: additionalData.testCode || 'CBC',
        category: additionalData.category || 'HEMATOLOGY',
        department: additionalData.department || 'HEMATOLOGY',
        specimenType: 'BLOOD',
        containerType: 'EDTA Tube',
        turnaroundTime: 60,
        cost: 25.0,
        isActive: true,
      },
    });

    return prisma.labTest.create({
      data: {
        patientId,
        testCatalogId: testCatalog.id,
        orderedBy,
        clinicalInfo: additionalData.clinicalInfo || 'Routine test',
        diagnosis: additionalData.diagnosis || 'Checkup',
        priority: additionalData.priority || 'ROUTINE',
        urgent: additionalData.urgent || false,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        testCatalog: true,
      },
    });
  },

  // Create test radiology test
  async createTestRadiologyTest(
    patientId: string,
    orderedBy: string,
    prisma: PrismaService,
    additionalData = {},
  ) {
    // First create a test radiology catalog entry if it doesn't exist
    const testCatalog = await prisma.radiologyTestCatalog.upsert({
      where: { id: additionalData.testCatalogId || 'test-radiology-catalog-id' },
      update: {},
      create: {
        id: additionalData.testCatalogId || 'test-radiology-catalog-id',
        testName: additionalData.testName || 'Chest X-Ray PA and Lateral',
        testCode: additionalData.testCode || 'CXR',
        category: additionalData.category || 'CHEST',
        modality: additionalData.modality || 'XRAY',
        description: additionalData.description || 'Standard chest X-ray examination',
        preparation: additionalData.preparation || 'Remove clothing from waist up',
        contraindications: additionalData.contraindications || 'Pregnancy - consult physician',
        cost: additionalData.cost || 75.0,
        estimatedDuration: additionalData.estimatedDuration || 15,
        isActive: true,
      },
    });

    return prisma.radiologyTest.create({
      data: {
        patientId,
        testCatalogId: testCatalog.id,
        orderedBy,
        status: additionalData.status || 'ORDERED',
        clinicalInfo: additionalData.clinicalInfo || 'Chest pain evaluation',
        diagnosis: additionalData.diagnosis || 'Suspected pneumonia',
        bodyPart: additionalData.bodyPart || 'CHEST',
        modality: additionalData.modality || 'XRAY',
        priority: additionalData.priority || 'ROUTINE',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        testCatalog: true,
      },
    });
  },
};
