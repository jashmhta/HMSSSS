import { Test, TestingModule } from '@nestjs/testing';
import { RadiologyService } from './radiology.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RadiologyTestStatus, RadiologyModality } from '@prisma/client';

describe('RadiologyService', () => {
  let service: RadiologyService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    patient: {
      findUnique: jest.fn(),
    },
    radiologyTest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RadiologyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RadiologyService>(RadiologyService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const createData = {
      patientId: 'patient-123',
      testName: 'Chest X-Ray',
      testCode: 'CXR',
      modality: RadiologyModality.XRAY,
      orderedBy: 'doctor-123',
      scheduledDate: new Date('2024-12-01'),
      urgent: true,
      clinicalIndication: 'Chest pain evaluation',
      notes: 'PA and lateral views',
    };

    const mockPatient = {
      id: 'patient-123',
      userId: 'user-123',
      mrn: 'MRN001',
    };

    const mockCreatedRadiologyTest = {
      id: 'radiology-test-123',
      ...createData,
      status: RadiologyTestStatus.ORDERED,
      orderedDate: new Date(),
      patient: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
    };

    it('should create a radiology test successfully', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.radiologyTest.create.mockResolvedValue(mockCreatedRadiologyTest);

      const result = await service.create(createData);

      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: createData.patientId },
      });
      expect(mockPrismaService.radiologyTest.create).toHaveBeenCalledWith({
        data: {
          patientId: createData.patientId,
          testName: createData.testName,
          testCode: createData.testCode,
          modality: createData.modality,
          orderedBy: createData.orderedBy,
          scheduledDate: createData.scheduledDate,
          urgent: createData.urgent,
          notes: createData.notes,
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
        },
      });
      expect(result).toEqual(mockCreatedRadiologyTest);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.create(createData)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: createData.patientId },
      });
      expect(mockPrismaService.radiologyTest.create).not.toHaveBeenCalled();
    });

    it('should create radiology test with default values', async () => {
      const minimalData = {
        patientId: 'patient-123',
        testName: 'Basic X-Ray',
        testCode: 'XR',
        modality: RadiologyModality.XRAY,
        orderedBy: 'doctor-123',
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.radiologyTest.create.mockResolvedValue({
        ...mockCreatedRadiologyTest,
        ...minimalData,
        scheduledDate: undefined,
        urgent: false,
        clinicalIndication: undefined,
        notes: undefined,
      });

      await service.create(minimalData);

      expect(mockPrismaService.radiologyTest.create).toHaveBeenCalledWith({
        data: {
          ...minimalData,
          scheduledDate: undefined,
          urgent: false,
          clinicalIndication: undefined,
          notes: undefined,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    const mockRadiologyTests = [
      {
        id: 'radiology-test-1',
        patientId: 'patient-1',
        testName: 'Chest X-Ray',
        modality: RadiologyModality.XRAY,
        status: RadiologyTestStatus.ORDERED,
        patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
      },
      {
        id: 'radiology-test-2',
        patientId: 'patient-2',
        testName: 'MRI Brain',
        modality: RadiologyModality.MRI,
        status: RadiologyTestStatus.COMPLETED,
        patient: { user: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' } },
      },
    ];

    it('should return paginated radiology tests without filters', async () => {
      const page = 1;
      const limit = 10;
      const total = 2;

      mockPrismaService.radiologyTest.findMany.mockResolvedValue(mockRadiologyTests);
      mockPrismaService.radiologyTest.count.mockResolvedValue(total);

      const result = await service.findAll(page, limit);

      expect(mockPrismaService.radiologyTest.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        skip: 0,
        take: limit,
        orderBy: { orderedDate: 'desc' },
      });
      expect(result).toEqual({
        data: mockRadiologyTests,
        meta: {
          page,
          limit,
          total,
          totalPages: 1,
        },
      });
    });

    it('should apply modality filter', async () => {
      const filters = { modality: RadiologyModality.MRI };

      mockPrismaService.radiologyTest.findMany.mockResolvedValue([mockRadiologyTests[1]]);
      mockPrismaService.radiologyTest.count.mockResolvedValue(1);

      await service.findAll(1, 10, filters);

      expect(mockPrismaService.radiologyTest.findMany).toHaveBeenCalledWith({
        where: { modality: RadiologyModality.MRI },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { orderedDate: 'desc' },
      });
    });

    it('should apply date range filter', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');
      const filters = { dateFrom, dateTo };

      mockPrismaService.radiologyTest.findMany.mockResolvedValue(mockRadiologyTests);
      mockPrismaService.radiologyTest.count.mockResolvedValue(2);

      await service.findAll(1, 10, filters);

      expect(mockPrismaService.radiologyTest.findMany).toHaveBeenCalledWith({
        where: {
          orderedDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { orderedDate: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    const mockRadiologyTest = {
      id: 'radiology-test-123',
      patientId: 'patient-123',
      testName: 'Chest X-Ray',
      modality: RadiologyModality.XRAY,
      status: RadiologyTestStatus.ORDERED,
      patient: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      },
    };

    it('should return radiology test when found', async () => {
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(mockRadiologyTest);

      const result = await service.findOne('radiology-test-123');

      expect(mockPrismaService.radiologyTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'radiology-test-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockRadiologyTest);
    });

    it('should throw NotFoundException when radiology test not found', async () => {
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.radiologyTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: expect.any(Object),
      });
    });
  });

  describe('scheduleTest', () => {
    const scheduleData = {
      scheduledDate: new Date('2024-12-01T10:00:00Z'),
      notes: 'Scheduled for morning slot',
    };

    const mockRadiologyTest = {
      id: 'radiology-test-123',
      status: RadiologyTestStatus.ORDERED,
    };

    const mockUpdatedRadiologyTest = {
      ...mockRadiologyTest,
      status: RadiologyTestStatus.SCHEDULED,
      scheduledDate: scheduleData.scheduledDate,
      notes: scheduleData.notes,
      patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
    };

    it('should schedule test successfully', async () => {
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(mockRadiologyTest);
      mockPrismaService.radiologyTest.update.mockResolvedValue(mockUpdatedRadiologyTest);

      const result = await service.scheduleTest('radiology-test-123', scheduleData);

      expect(mockPrismaService.radiologyTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'radiology-test-123' },
      });
      expect(mockPrismaService.radiologyTest.update).toHaveBeenCalledWith({
        where: { id: 'radiology-test-123' },
        data: {
          status: RadiologyTestStatus.SCHEDULED,
          scheduledDate: scheduleData.scheduledDate,
          notes: scheduleData.notes,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedRadiologyTest);
    });

    it('should throw BadRequestException when trying to schedule non-ordered test', async () => {
      const scheduledTest = { ...mockRadiologyTest, status: RadiologyTestStatus.SCHEDULED };
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(scheduledTest);

      await expect(service.scheduleTest('radiology-test-123', scheduleData)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.radiologyTest.update).not.toHaveBeenCalled();
    });
  });

  describe('startTest', () => {
    const mockRadiologyTest = {
      id: 'radiology-test-123',
      status: RadiologyTestStatus.SCHEDULED,
    };

    const mockUpdatedRadiologyTest = {
      ...mockRadiologyTest,
      status: RadiologyTestStatus.IN_PROGRESS,
      performedDate: expect.any(Date),
      performedBy: 'radiologist-123',
      patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
    };

    it('should start test successfully', async () => {
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(mockRadiologyTest);
      mockPrismaService.radiologyTest.update.mockResolvedValue(mockUpdatedRadiologyTest);

      const result = await service.startTest('radiology-test-123', 'radiologist-123');

      expect(mockPrismaService.radiologyTest.update).toHaveBeenCalledWith({
        where: { id: 'radiology-test-123' },
        data: {
          status: RadiologyTestStatus.IN_PROGRESS,
          performedDate: expect.any(Date),
          performedBy: 'radiologist-123',
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedRadiologyTest);
    });

    it('should throw BadRequestException when trying to start unscheduled test', async () => {
      const orderedTest = { ...mockRadiologyTest, status: RadiologyTestStatus.ORDERED };
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(orderedTest);

      await expect(service.startTest('radiology-test-123', 'radiologist-123')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.radiologyTest.update).not.toHaveBeenCalled();
    });
  });

  describe('completeTest', () => {
    const completeData = {
      findings: 'No acute abnormalities detected',
      impression: 'Normal chest X-ray',
      recommendations: 'No follow-up required',
      images: ['image1.jpg', 'image2.jpg'],
      performedBy: 'radiologist-123',
    };

    const mockRadiologyTest = {
      id: 'radiology-test-123',
      status: RadiologyTestStatus.IN_PROGRESS,
    };

    const mockUpdatedRadiologyTest = {
      ...mockRadiologyTest,
      status: RadiologyTestStatus.COMPLETED,
      reportDate: expect.any(Date),
      findings: completeData.findings,
      impression: completeData.impression,
      recommendations: completeData.recommendations,
      images: completeData.images,
      performedBy: completeData.performedBy,
      patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
    };

    it('should complete test successfully', async () => {
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(mockRadiologyTest);
      mockPrismaService.radiologyTest.update.mockResolvedValue(mockUpdatedRadiologyTest);

      const result = await service.completeTest('radiology-test-123', completeData);

      expect(mockPrismaService.radiologyTest.update).toHaveBeenCalledWith({
        where: { id: 'radiology-test-123' },
        data: {
          status: RadiologyTestStatus.COMPLETED,
          reportDate: expect.any(Date),
          findings: completeData.findings,
          impression: completeData.impression,
          recommendations: completeData.recommendations,
          images: completeData.images,
          performedBy: completeData.performedBy,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedRadiologyTest);
    });

    it('should throw BadRequestException when trying to complete non-in-progress test', async () => {
      const scheduledTest = { ...mockRadiologyTest, status: RadiologyTestStatus.SCHEDULED };
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(scheduledTest);

      await expect(service.completeTest('radiology-test-123', completeData)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.radiologyTest.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelTest', () => {
    const mockRadiologyTest = {
      id: 'radiology-test-123',
      status: RadiologyTestStatus.SCHEDULED,
    };

    it('should cancel test successfully', async () => {
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(mockRadiologyTest);
      mockPrismaService.radiologyTest.update.mockResolvedValue({
        ...mockRadiologyTest,
        status: RadiologyTestStatus.CANCELLED,
        notes: 'Test cancelled due to patient condition',
      });

      const result = await service.cancelTest(
        'radiology-test-123',
        'Test cancelled due to patient condition',
      );

      expect(mockPrismaService.radiologyTest.update).toHaveBeenCalledWith({
        where: { id: 'radiology-test-123' },
        data: {
          status: RadiologyTestStatus.CANCELLED,
          notes: 'Test cancelled due to patient condition',
        },
      });
      expect(result.status).toBe(RadiologyTestStatus.CANCELLED);
    });

    it('should throw BadRequestException when trying to cancel completed test', async () => {
      const completedTest = { ...mockRadiologyTest, status: RadiologyTestStatus.COMPLETED };
      mockPrismaService.radiologyTest.findUnique.mockResolvedValue(completedTest);

      await expect(service.cancelTest('radiology-test-123', 'Reason')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.radiologyTest.update).not.toHaveBeenCalled();
    });
  });

  describe('getRadiologyStats', () => {
    it('should return comprehensive radiology statistics', async () => {
      mockPrismaService.radiologyTest.count
        .mockResolvedValueOnce(100) // totalTests
        .mockResolvedValueOnce(25) // pendingTests
        .mockResolvedValueOnce(15) // completedToday
        .mockResolvedValueOnce(5); // urgentTests

      const result = await service.getRadiologyStats();

      expect(result).toEqual({
        totalTests: 100,
        pendingTests: 25,
        completedToday: 15,
        urgentTests: 5,
      });
      expect(mockPrismaService.radiologyTest.count).toHaveBeenCalledTimes(4);
    });
  });

  describe('getTestsByModality', () => {
    it('should return test count grouped by modality', async () => {
      const mockModalities = [
        { modality: RadiologyModality.XRAY, _count: { id: 50 } },
        { modality: RadiologyModality.MRI, _count: { id: 30 } },
        { modality: RadiologyModality.CT, _count: { id: 20 } },
      ];

      mockPrismaService.radiologyTest.groupBy.mockResolvedValue(mockModalities);

      const result = await service.getTestsByModality();

      expect(result).toEqual([
        { modality: RadiologyModality.XRAY, count: 50 },
        { modality: RadiologyModality.MRI, count: 30 },
        { modality: RadiologyModality.CT, count: 20 },
      ]);
      expect(mockPrismaService.radiologyTest.groupBy).toHaveBeenCalledWith({
        by: ['modality'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });
    });
  });

  describe('getScheduledTests', () => {
    it('should return tests scheduled for a specific date', async () => {
      const testDate = new Date('2024-12-01');
      const mockScheduledTests = [
        {
          id: 'test-1',
          scheduledDate: new Date('2024-12-01T10:00:00Z'),
          patient: {
            user: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              phone: '+1234567890',
            },
          },
        },
      ];

      mockPrismaService.radiologyTest.findMany.mockResolvedValue(mockScheduledTests);

      const result = await service.getScheduledTests(testDate);

      expect(mockPrismaService.radiologyTest.findMany).toHaveBeenCalledWith({
        where: {
          scheduledDate: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          status: RadiologyTestStatus.SCHEDULED,
        },
        include: expect.any(Object),
        orderBy: { scheduledDate: 'asc' },
      });
      expect(result).toEqual(mockScheduledTests);
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow valid status transitions', () => {
      // Test ORDERED -> SCHEDULED
      expect(() => (service as any).validateStatusTransition('ORDERED', 'SCHEDULED')).not.toThrow();

      // Test SCHEDULED -> IN_PROGRESS
      expect(() =>
        (service as any).validateStatusTransition('SCHEDULED', 'IN_PROGRESS'),
      ).not.toThrow();

      // Test IN_PROGRESS -> COMPLETED
      expect(() =>
        (service as any).validateStatusTransition('IN_PROGRESS', 'COMPLETED'),
      ).not.toThrow();
    });

    it('should reject invalid status transitions', () => {
      // Test ORDERED -> COMPLETED (invalid)
      expect(() => (service as any).validateStatusTransition('ORDERED', 'COMPLETED')).toThrow(
        BadRequestException,
      );

      // Test COMPLETED -> ORDERED (invalid - terminal state)
      expect(() => (service as any).validateStatusTransition('COMPLETED', 'ORDERED')).toThrow(
        BadRequestException,
      );
    });
  });
});
