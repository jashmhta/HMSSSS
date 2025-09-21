import { Test, TestingModule } from '@nestjs/testing';
import { LaboratoryService } from './laboratory.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LabTestStatus } from '@prisma/client';

describe('LaboratoryService', () => {
  let service: LaboratoryService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    patient: {
      findUnique: jest.fn(),
    },
    labTest: {
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
        LaboratoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LaboratoryService>(LaboratoryService);
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
      testName: 'Complete Blood Count',
      testCode: 'CBC',
      category: 'HEMATOLOGY',
      orderedBy: 'doctor-123',
      specimenType: 'Blood',
      urgent: true,
      notes: 'Routine check',
    };

    const mockPatient = {
      id: 'patient-123',
      userId: 'user-123',
      mrn: 'MRN001',
    };

    const mockCreatedLabTest = {
      id: 'lab-test-123',
      ...createData,
      status: LabTestStatus.ORDERED,
      orderedDate: new Date(),
      patient: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
    };

    it('should create a lab test successfully', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.labTest.create.mockResolvedValue(mockCreatedLabTest);

      const result = await service.create(createData);

      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: createData.patientId },
      });
      expect(mockPrismaService.labTest.create).toHaveBeenCalledWith({
        data: {
          patientId: createData.patientId,
          testName: createData.testName,
          testCode: createData.testCode,
          category: createData.category,
          orderedBy: createData.orderedBy,
          specimenType: createData.specimenType,
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
      expect(result).toEqual(mockCreatedLabTest);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.create(createData)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: createData.patientId },
      });
      expect(mockPrismaService.labTest.create).not.toHaveBeenCalled();
    });

    it('should create lab test with default values', async () => {
      const minimalData = {
        patientId: 'patient-123',
        testName: 'Basic Test',
        testCode: 'BT',
        category: 'CHEMISTRY',
        orderedBy: 'doctor-123',
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.labTest.create.mockResolvedValue({
        ...mockCreatedLabTest,
        ...minimalData,
        specimenType: undefined,
        urgent: false,
        notes: undefined,
      });

      await service.create(minimalData);

      expect(mockPrismaService.labTest.create).toHaveBeenCalledWith({
        data: {
          ...minimalData,
          specimenType: undefined,
          urgent: false,
          notes: undefined,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    const mockLabTests = [
      {
        id: 'lab-test-1',
        patientId: 'patient-1',
        testName: 'CBC',
        status: LabTestStatus.ORDERED,
        patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
      },
      {
        id: 'lab-test-2',
        patientId: 'patient-2',
        testName: 'LFT',
        status: LabTestStatus.COMPLETED,
        patient: { user: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' } },
      },
    ];

    it('should return paginated lab tests without filters', async () => {
      const page = 1;
      const limit = 10;
      const total = 2;

      mockPrismaService.labTest.findMany.mockResolvedValue(mockLabTests);
      mockPrismaService.labTest.count.mockResolvedValue(total);

      const result = await service.findAll(page, limit);

      expect(mockPrismaService.labTest.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        skip: 0,
        take: limit,
        orderBy: { orderedDate: 'desc' },
      });
      expect(result).toEqual({
        data: mockLabTests,
        meta: {
          page,
          limit,
          total,
          totalPages: 1,
        },
      });
    });

    it('should apply status filter', async () => {
      const filters = { status: LabTestStatus.COMPLETED };

      mockPrismaService.labTest.findMany.mockResolvedValue([mockLabTests[1]]);
      mockPrismaService.labTest.count.mockResolvedValue(1);

      await service.findAll(1, 10, filters);

      expect(mockPrismaService.labTest.findMany).toHaveBeenCalledWith({
        where: { status: LabTestStatus.COMPLETED },
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

      mockPrismaService.labTest.findMany.mockResolvedValue(mockLabTests);
      mockPrismaService.labTest.count.mockResolvedValue(2);

      await service.findAll(1, 10, filters);

      expect(mockPrismaService.labTest.findMany).toHaveBeenCalledWith({
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

    it('should apply urgent filter', async () => {
      const filters = { urgent: true };

      mockPrismaService.labTest.findMany.mockResolvedValue([]);
      mockPrismaService.labTest.count.mockResolvedValue(0);

      await service.findAll(1, 10, filters);

      expect(mockPrismaService.labTest.findMany).toHaveBeenCalledWith({
        where: { urgent: true },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { orderedDate: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    const mockLabTest = {
      id: 'lab-test-123',
      patientId: 'patient-123',
      testName: 'CBC',
      status: LabTestStatus.ORDERED,
      patient: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      },
    };

    it('should return lab test when found', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(mockLabTest);

      const result = await service.findOne('lab-test-123');

      expect(mockPrismaService.labTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockLabTest);
    });

    it('should throw NotFoundException when lab test not found', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.labTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    const updateData = {
      status: LabTestStatus.IN_PROGRESS,
      notes: 'Updated notes',
    };

    const mockLabTest = {
      id: 'lab-test-123',
      status: LabTestStatus.ORDERED,
    };

    const mockUpdatedLabTest = {
      ...mockLabTest,
      ...updateData,
      patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
    };

    it('should update lab test successfully', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(mockLabTest);
      mockPrismaService.labTest.update.mockResolvedValue(mockUpdatedLabTest);

      const result = await service.update('lab-test-123', updateData);

      expect(mockPrismaService.labTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
      });
      expect(mockPrismaService.labTest.update).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
        data: updateData,
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedLabTest);
    });

    it('should throw NotFoundException when lab test not found', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateData)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.labTest.update).not.toHaveBeenCalled();
    });

    it('should validate status transitions', async () => {
      const invalidTransition = {
        status: LabTestStatus.COMPLETED, // Invalid transition from ORDERED
      };

      mockPrismaService.labTest.findUnique.mockResolvedValue(mockLabTest);

      await expect(service.update('lab-test-123', invalidTransition)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.labTest.update).not.toHaveBeenCalled();
    });
  });

  describe('collectSpecimen', () => {
    const collectData = {
      specimenType: 'Blood',
      collectedBy: 'nurse-123',
      notes: 'Specimen collected successfully',
    };

    const mockLabTest = {
      id: 'lab-test-123',
      status: LabTestStatus.ORDERED,
    };

    const mockUpdatedLabTest = {
      ...mockLabTest,
      status: LabTestStatus.SPECIMEN_COLLECTED,
      specimenType: 'Blood',
      specimenCollected: expect.any(Date),
      collectedBy: 'nurse-123',
      notes: 'Specimen collected successfully',
      patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
    };

    it('should collect specimen successfully', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(mockLabTest);
      mockPrismaService.labTest.update.mockResolvedValue(mockUpdatedLabTest);

      const result = await service.collectSpecimen('lab-test-123', collectData);

      expect(mockPrismaService.labTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
      });
      expect(mockPrismaService.labTest.update).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
        data: {
          status: LabTestStatus.SPECIMEN_COLLECTED,
          specimenType: collectData.specimenType,
          specimenCollected: expect.any(Date),
          collectedBy: collectData.collectedBy,
          notes: collectData.notes,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedLabTest);
    });

    it('should throw BadRequestException when trying to collect specimen for non-ordered test', async () => {
      const completedTest = { ...mockLabTest, status: LabTestStatus.COMPLETED };
      mockPrismaService.labTest.findUnique.mockResolvedValue(completedTest);

      await expect(service.collectSpecimen('lab-test-123', collectData)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.labTest.update).not.toHaveBeenCalled();
    });
  });

  describe('submitResults', () => {
    const resultsData = {
      results: { hemoglobin: '14.5', wbc: '7500' },
      referenceRange: 'Hemoglobin: 12-16 g/dL, WBC: 4000-11000 /μL',
      interpretation: 'Normal values',
      performedBy: 'lab-tech-123',
    };

    const mockLabTest = {
      id: 'lab-test-123',
      status: LabTestStatus.SPECIMEN_COLLECTED,
    };

    const mockUpdatedLabTest = {
      ...mockLabTest,
      status: LabTestStatus.COMPLETED,
      resultDate: expect.any(Date),
      results: resultsData.results,
      referenceRange: resultsData.referenceRange,
      interpretation: resultsData.interpretation,
      patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
    };

    it('should submit results successfully', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(mockLabTest);
      mockPrismaService.labTest.update.mockResolvedValue(mockUpdatedLabTest);

      const result = await service.submitResults('lab-test-123', resultsData);

      expect(mockPrismaService.labTest.update).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
        data: {
          status: LabTestStatus.COMPLETED,
          resultDate: expect.any(Date),
          results: resultsData.results,
          referenceRange: resultsData.referenceRange,
          interpretation: resultsData.interpretation,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedLabTest);
    });

    it('should throw BadRequestException when submitting results for invalid status', async () => {
      const orderedTest = { ...mockLabTest, status: LabTestStatus.ORDERED };
      mockPrismaService.labTest.findUnique.mockResolvedValue(orderedTest);

      await expect(service.submitResults('lab-test-123', resultsData)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.labTest.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelTest', () => {
    const mockLabTest = {
      id: 'lab-test-123',
      status: LabTestStatus.ORDERED,
    };

    it('should cancel test successfully', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(mockLabTest);
      mockPrismaService.labTest.update.mockResolvedValue({
        ...mockLabTest,
        status: LabTestStatus.CANCELLED,
        notes: 'Test cancelled due to patient request',
      });

      const result = await service.cancelTest(
        'lab-test-123',
        'Test cancelled due to patient request',
      );

      expect(mockPrismaService.labTest.update).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
        data: {
          status: LabTestStatus.CANCELLED,
          notes: 'Test cancelled due to patient request',
        },
      });
      expect(result.status).toBe(LabTestStatus.CANCELLED);
    });

    it('should throw BadRequestException when trying to cancel completed test', async () => {
      const completedTest = { ...mockLabTest, status: LabTestStatus.COMPLETED };
      mockPrismaService.labTest.findUnique.mockResolvedValue(completedTest);

      await expect(service.cancelTest('lab-test-123', 'Reason')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.labTest.update).not.toHaveBeenCalled();
    });
  });

  describe('getLabStats', () => {
    it('should return comprehensive lab statistics', async () => {
      mockPrismaService.labTest.count
        .mockResolvedValueOnce(100) // totalTests
        .mockResolvedValueOnce(25) // pendingTests
        .mockResolvedValueOnce(15); // completedToday

      const result = await service.getLabStats();

      expect(result).toEqual({
        totalTests: 100,
        pendingTests: 25,
        completedToday: 15,
        urgentTests: 0, // No urgent tests in this mock
      });
      expect(mockPrismaService.labTest.count).toHaveBeenCalledTimes(4);
    });
  });

  describe('getTestsByCategory', () => {
    it('should return test count grouped by category', async () => {
      const mockCategories = [
        { category: 'HEMATOLOGY', _count: { id: 50 } },
        { category: 'CHEMISTRY', _count: { id: 30 } },
        { category: 'MICROBIOLOGY', _count: { id: 20 } },
      ];

      mockPrismaService.labTest.groupBy.mockResolvedValue(mockCategories);

      const result = await service.getTestsByCategory();

      expect(result).toEqual([
        { category: 'HEMATOLOGY', count: 50 },
        { category: 'CHEMISTRY', count: 30 },
        { category: 'MICROBIOLOGY', count: 20 },
      ]);
      expect(mockPrismaService.labTest.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow valid status transitions', () => {
      // Test ORDERED -> SPECIMEN_COLLECTED
      expect(() =>
        (service as any).validateStatusTransition('ORDERED', 'SPECIMEN_COLLECTED'),
      ).not.toThrow();

      // Test SPECIMEN_COLLECTED -> IN_PROGRESS
      expect(() =>
        (service as any).validateStatusTransition('SPECIMEN_COLLECTED', 'IN_PROGRESS'),
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
