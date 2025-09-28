/*[object Object]*/
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LabTestStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { LaboratoryService } from './laboratory.service';
import { LISIntegrationService } from './lis-integration.service';
import { BarcodeService } from './barcode.service';

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
    labTestCatalog: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockLISIntegrationService = {
    sendOrderToLIS: jest.fn(),
    getTestResults: jest.fn(),
    updateTestStatus: jest.fn(),
  };

  const mockBarcodeService = {
    generateBarcode: jest.fn(),
    validateBarcode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LaboratoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LISIntegrationService,
          useValue: mockLISIntegrationService,
        },
        {
          provide: BarcodeService,
          useValue: mockBarcodeService,
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

  describe('createTestOrder', () => {
    const createData = {
      patientId: 'patient-123',
      testCatalogId: 'test-catalog-123',
      orderedBy: 'doctor-123',
      clinicalInfo: 'Routine check',
      diagnosis: 'Anemia',
      priority: 'ROUTINE' as const,
    };

    const mockPatient = {
      id: 'patient-123',
      userId: 'user-123',
      mrn: 'MRN001',
    };

    const mockTestCatalog = {
      id: 'test-catalog-123',
      testName: 'Complete Blood Count',
      testCode: 'CBC',
      category: 'HEMATOLOGY',
      department: 'HEMATOLOGY',
    };

    const mockCreatedLabTest = {
      id: 'lab-test-123',
      patientId: createData.patientId,
      testCatalogId: createData.testCatalogId,
      orderedBy: createData.orderedBy,
      status: LabTestStatus.ORDERED,
      orderedDate: new Date(),
      testCatalog: mockTestCatalog,
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
      mockPrismaService.labTestCatalog.findUnique.mockResolvedValue(mockTestCatalog);
      mockPrismaService.labTest.create.mockResolvedValue(mockCreatedLabTest);

      const result = await service.createTestOrder(createData);

      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: createData.patientId },
      });
      expect(mockPrismaService.labTestCatalog.findUnique).toHaveBeenCalledWith({
        where: { id: createData.testCatalogId },
      });
      expect(mockPrismaService.labTest.create).toHaveBeenCalledWith({
        data: {
          patientId: createData.patientId,
          testCatalogId: createData.testCatalogId,
          orderedBy: createData.orderedBy,
          clinicalInfo: createData.clinicalInfo,
          diagnosis: createData.diagnosis,
          priority: createData.priority,
          urgent: false,
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
      expect(result).toEqual(mockCreatedLabTest);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.createTestOrder(createData)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: createData.patientId },
      });
      expect(mockPrismaService.labTestCatalog.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.labTest.create).not.toHaveBeenCalled();
    });

    it('should create urgent test when priority is STAT', async () => {
      const urgentData = {
        ...createData,
        priority: 'STAT' as const,
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.labTestCatalog.findUnique.mockResolvedValue(mockTestCatalog);
      mockPrismaService.labTest.create.mockResolvedValue({
        ...mockCreatedLabTest,
        urgent: true,
      });

      await service.createTestOrder(urgentData);

      expect(mockPrismaService.labTest.create).toHaveBeenCalledWith({
        data: {
          ...urgentData,
          urgent: true,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getTestOrders', () => {
    const mockLabTests = [
      {
        id: 'lab-test-1',
        patientId: 'patient-1',
        testCatalog: { testName: 'CBC', category: 'HEMATOLOGY' },
        status: LabTestStatus.ORDERED,
        patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
      },
      {
        id: 'lab-test-2',
        patientId: 'patient-2',
        testCatalog: { testName: 'LFT', category: 'CHEMISTRY' },
        status: LabTestStatus.COMPLETED,
        patient: { user: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' } },
      },
    ];

    it('should return lab tests without filters', async () => {
      mockPrismaService.labTest.findMany.mockResolvedValue(mockLabTests);

      const result = await service.getTestOrders();

      expect(mockPrismaService.labTest.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { orderedDate: 'desc' },
      });
      expect(result).toEqual(mockLabTests);
    });

    it('should apply status filter', async () => {
      mockPrismaService.labTest.findMany.mockResolvedValue([mockLabTests[1]]);

      await service.getTestOrders(1, 10, { status: [LabTestStatus.COMPLETED] });

      expect(mockPrismaService.labTest.findMany).toHaveBeenCalledWith({
        where: { status: LabTestStatus.COMPLETED },
        include: expect.any(Object),
        orderBy: { orderedDate: 'desc' },
      });
    });

    it('should apply date range filter', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');

      mockPrismaService.labTest.findMany.mockResolvedValue(mockLabTests);

      await service.getTestOrders({ dateFrom, dateTo } as any);

      expect(mockPrismaService.labTest.findMany).toHaveBeenCalledWith({
        where: {
          orderedDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        include: expect.any(Object),
        orderBy: { orderedDate: 'desc' },
      });
    });

    it('should apply urgent filter', async () => {
      mockPrismaService.labTest.findMany.mockResolvedValue([]);

      await service.getTestOrders({ urgent: true } as any);

      expect(mockPrismaService.labTest.findMany).toHaveBeenCalledWith({
        where: { urgent: true },
        include: expect.any(Object),
        orderBy: { orderedDate: 'desc' },
      });
    });
  });

  describe('getTestOrder', () => {
    const mockLabTest = {
      id: 'lab-test-123',
      patientId: 'patient-123',
      testCatalog: { testName: 'CBC', category: 'HEMATOLOGY' },
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

      const result = await service.getTestOrder('lab-test-123');

      expect(mockPrismaService.labTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockLabTest);
    });

    it('should throw NotFoundException when lab test not found', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(null);

      await expect(service.getTestOrder('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.labTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: expect.any(Object),
      });
    });
  });

  describe('updateTestStatus', () => {
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

      const result = await service.updateTestStatus(
        'lab-test-123',
        updateData.status,
        'tech-123',
        updateData.notes,
      );

      expect(mockPrismaService.labTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
      });
      expect(mockPrismaService.labTest.update).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
        data: {
          status: updateData.status,
          notes: updateData.notes,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedLabTest);
    });

    it('should throw NotFoundException when lab test not found', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTestStatus(
          'non-existent-id',
          updateData.status,
          'tech-123',
          updateData.notes,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.labTest.update).not.toHaveBeenCalled();
    });
  });

  describe('collectSample', () => {
    const mockLabTest = {
      id: 'lab-test-123',
      status: LabTestStatus.ORDERED,
    };

    const mockUpdatedLabTest = {
      ...mockLabTest,
      status: LabTestStatus.SAMPLE_COLLECTED,
      specimenType: 'Blood',
      specimenCollected: expect.any(Date),
      collectedBy: 'nurse-123',
      notes: 'Specimen collected successfully',
      patient: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
    };

    it('should collect sample successfully', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(mockLabTest);
      mockPrismaService.labTest.update.mockResolvedValue(mockUpdatedLabTest);

      const result = await service.collectSample('lab-test-123', {
        specimenType: 'BLOOD',
        collectionMethod: 'VENIPUNCTURE',
        collectedBy: 'nurse-123',
      });

      expect(mockPrismaService.labTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
      });
      expect(mockPrismaService.labTest.update).toHaveBeenCalledWith({
        where: { id: 'lab-test-123' },
        data: {
          status: LabTestStatus.SAMPLE_COLLECTED,
          specimenCollected: expect.any(Date),
          collectedBy: 'nurse-123',
          notes: 'Specimen collected successfully',
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedLabTest);
    });

    it('should throw BadRequestException when trying to collect sample for non-ordered test', async () => {
      const completedTest = { ...mockLabTest, status: LabTestStatus.COMPLETED };
      mockPrismaService.labTest.findUnique.mockResolvedValue(completedTest);

      await expect(
        service.collectSample('lab-test-123', {
          specimenType: 'BLOOD',
          collectionMethod: 'VENIPUNCTURE',
          collectedBy: 'nurse-123',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.labTest.update).not.toHaveBeenCalled();
    });
  });

  describe('enterResults', () => {
    const resultsData = {
      results: { hemoglobin: '14.5', wbc: '7500' },
      referenceRange: 'Hemoglobin: 12-16 g/dL, WBC: 4000-11000 /μL',
      interpretation: 'Normal values',
    };

    const mockLabTest = {
      id: 'lab-test-123',
      status: LabTestStatus.SAMPLE_COLLECTED,
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

    it('should enter results successfully', async () => {
      mockPrismaService.labTest.findUnique.mockResolvedValue(mockLabTest);
      mockPrismaService.labTest.update.mockResolvedValue(mockUpdatedLabTest);

      const result = await service.enterResults(
        'lab-test-123',
        [
          { parameter: 'hemoglobin', value: '14.5' },
          { parameter: 'wbc', value: '7500' },
        ],
        'lab-tech-123',
      );

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

    it('should throw BadRequestException when entering results for invalid status', async () => {
      const orderedTest = { ...mockLabTest, status: LabTestStatus.ORDERED };
      mockPrismaService.labTest.findUnique.mockResolvedValue(orderedTest);

      await expect(
        service.enterResults(
          'lab-test-123',
          [{ parameter: 'hemoglobin', value: '14.5' }],
          'lab-tech-123',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.labTest.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelTestOrder', () => {
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

      const result = await service.cancelTestOrder(
        'lab-test-123',
        'Test cancelled due to patient request',
        'doctor-123',
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

      await expect(service.cancelTestOrder('lab-test-123', 'Reason', 'doctor-123')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.labTest.update).not.toHaveBeenCalled();
    });
  });

  describe('getLabStatistics', () => {
    it('should return comprehensive lab statistics', async () => {
      const mockStats = {
        totalTests: 100,
        pendingTests: 25,
        completedToday: 15,
        urgentTests: 5,
        testsByStatus: [],
        testsByDepartment: [],
        turnaroundTime: 0,
      };

      mockPrismaService.labTest.count
        .mockResolvedValueOnce(100) // totalTests
        .mockResolvedValueOnce(25) // pendingTests
        .mockResolvedValueOnce(15); // completedToday

      const result = await service.getLabStatistics();

      expect(result).toEqual(mockStats);
      expect(mockPrismaService.labTest.count).toHaveBeenCalledTimes(4);
    });
  });

  describe('getTestCatalog', () => {
    it('should return test catalog without filters', async () => {
      const mockCatalog = [
        { id: '1', testName: 'CBC', category: 'HEMATOLOGY', department: 'HEMATOLOGY' },
        { id: '2', testName: 'LFT', category: 'CHEMISTRY', department: 'CHEMISTRY' },
      ];

      mockPrismaService.labTestCatalog.findMany.mockResolvedValue(mockCatalog);

      const result = await service.getTestCatalog();

      expect(result).toEqual(mockCatalog);
      expect(mockPrismaService.labTestCatalog.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should apply category filter', async () => {
      mockPrismaService.labTestCatalog.findMany.mockResolvedValue([]);

      await service.getTestCatalog({ category: 'HEMATOLOGY' });

      expect(mockPrismaService.labTestCatalog.findMany).toHaveBeenCalledWith({
        where: { category: 'HEMATOLOGY', isActive: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow valid status transitions', async () => {
      // Test ORDERED -> SAMPLE_COLLECTED
      await expect(
        (service as any).validateStatusTransition('ORDERED', 'SAMPLE_COLLECTED'),
      ).resolves.not.toThrow();

      // Test SAMPLE_COLLECTED -> RECEIVED
      await expect(
        (service as any).validateStatusTransition('SAMPLE_COLLECTED', 'RECEIVED'),
      ).resolves.not.toThrow();

      // Test RECEIVED -> IN_PROGRESS
      await expect(
        (service as any).validateStatusTransition('RECEIVED', 'IN_PROGRESS'),
      ).resolves.not.toThrow();

      // Test IN_PROGRESS -> COMPLETED
      await expect(
        (service as any).validateStatusTransition('IN_PROGRESS', 'COMPLETED'),
      ).resolves.not.toThrow();
    });

    it('should reject invalid status transitions', async () => {
      // Test ORDERED -> COMPLETED (invalid)
      await expect(
        (service as any).validateStatusTransition('ORDERED', 'COMPLETED'),
      ).rejects.toThrow(BadRequestException);

      // Test COMPLETED -> ORDERED (invalid - terminal state)
      await expect(
        (service as any).validateStatusTransition('COMPLETED', 'ORDERED'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
