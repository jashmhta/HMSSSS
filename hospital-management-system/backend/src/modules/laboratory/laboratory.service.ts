/*[object Object]*/
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { LISIntegrationService } from './lis-integration.service';
import { BarcodeService } from './barcode.service';

/**
 *
 */
@Injectable()
export class LaboratoryService {
  /**
   *
   */
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LISIntegrationService))
    private lisIntegration: LISIntegrationService,
    private barcodeService: BarcodeService,
  ) {}

  /**
   * Create new lab test order
   */
  async createTestOrder(data: {
    patientId: string;
    testCatalogId: string;
    orderedBy: string;
    clinicalInfo?: string;
    diagnosis?: string;
    priority?: 'ROUTINE' | 'URGENT' | 'STAT';
    urgent?: boolean;
  }) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Verify test catalog exists
    const testCatalog = await this.prisma.labTestCatalog.findUnique({
      where: { id: data.testCatalogId },
    });

    if (!testCatalog) {
      throw new NotFoundException('Test catalog not found');
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    const labTest = await this.prisma.labTest.create({
      data: {
        patientId: data.patientId,
        testCatalogId: data.testCatalogId,
        orderNumber,
        priority: data.priority || 'ROUTINE',
        orderedBy: data.orderedBy,
        clinicalInfo: data.clinicalInfo,
        diagnosis: data.diagnosis,
        urgent: data.urgent || data.priority === 'STAT',
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

    // Send to LIS if configured
    try {
      await this.lisIntegration.sendOrderToLIS(labTest.id);
    } catch (error) {
      // Log error but don't fail the order creation
      console.error('Failed to send order to LIS:', error);
    }

    return labTest;
  }

  /**
   * Create multiple test orders in batch
   */
  async createBatchOrders(data: {
    patientId: string;
    testCatalogIds: string[];
    orderedBy: string;
    clinicalInfo?: string;
    diagnosis?: string;
    priority?: 'ROUTINE' | 'URGENT' | 'STAT';
    urgent?: boolean;
  }) {
    const orders = [];

    for (const testCatalogId of data.testCatalogIds) {
      const order = await this.createTestOrder({
        patientId: data.patientId,
        testCatalogId,
        orderedBy: data.orderedBy,
        clinicalInfo: data.clinicalInfo,
        diagnosis: data.diagnosis,
        priority: data.priority,
        urgent: data.urgent,
      });
      orders.push(order);
    }

    return orders;
  }

  /**
   * Accept/reject test order (lab technician action)
   */
  async processOrder(
    orderId: string,
    action: 'ACCEPT' | 'REJECT',
    technicianId: string,
    notes?: string,
  ) {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id: orderId },
      include: { testCatalog: true },
    });

    if (!labTest) {
      throw new NotFoundException('Lab test not found');
    }

    if (labTest.status !== 'ORDERED') {
      throw new BadRequestException('Order can only be processed when in ORDERED status');
    }

    if (action === 'ACCEPT') {
      // Create sample with barcode
      const barcode = await this.barcodeService.generateSampleBarcode(orderId);

      await this.prisma.labSample.create({
        data: {
          labTestId: orderId,
          sampleId: barcode,
          specimenType: labTest.testCatalog.specimenType,
          collectionMethod: 'VENIPUNCTURE', // Default, can be updated later
          collectedBy: technicianId,
        },
      });

      await this.prisma.labTest.update({
        where: { id: orderId },
        data: {
          status: 'SAMPLE_COLLECTED',
        },
      });
    } else {
      await this.prisma.labTest.update({
        where: { id: orderId },
        data: {
          status: 'REJECTED',
        },
      });
    }

    return { success: true, action, notes };
  }

  /**
   * Get test orders with comprehensive filtering
   */
  async getTestOrders(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: string[];
      patientId?: string;
      testCatalogId?: string;
      department?: string;
      priority?: string[];
      urgent?: boolean;
      orderedBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
      specimenType?: string;
    },
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status?.length) {
      where.status = { in: filters.status };
    }
    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }
    if (filters?.testCatalogId) {
      where.testCatalogId = filters.testCatalogId;
    }
    if (filters?.department) {
      where.testCatalog = {
        department: filters.department as any,
      };
    }
    if (filters?.priority?.length) {
      where.priority = { in: filters.priority };
    }
    if (filters?.urgent !== undefined) {
      where.urgent = filters.urgent;
    }
    if (filters?.orderedBy) {
      where.orderedBy = filters.orderedBy;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.orderedDate = {};
      if (filters.dateFrom) {
        where.orderedDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.orderedDate.lte = filters.dateTo;
      }
    }
    if (filters?.specimenType) {
      where.testCatalog = {
        specimenType: filters.specimenType as any,
      };
    }

    const [labTests, total] = await Promise.all([
      this.prisma.labTest.findMany({
        where,
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
          samples: {
            include: {
              _count: {
                select: { results: true },
              },
            },
          },
          results: {
            orderBy: { performedDate: 'desc' },
            take: 1, // Latest result
          },
        },
        skip,
        take: limit,
        orderBy: [{ urgent: 'desc' }, { priority: 'desc' }, { orderedDate: 'desc' }],
      }),
      this.prisma.labTest.count({ where }),
    ]);

    return {
      data: labTests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get pending orders for lab dashboard
   */
  async getPendingOrders(department?: string) {
    const where: any = {
      status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'RECEIVED'] },
    };

    if (department) {
      where.testCatalog = {
        department: department as any,
      };
    }

    return this.prisma.labTest.findMany({
      where,
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
      orderBy: [{ urgent: 'desc' }, { priority: 'desc' }, { orderedDate: 'asc' }],
    });
  }

  /**
   * Get detailed test order information
   */
  async getTestOrder(id: string) {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        testCatalog: true,
        samples: {
          include: {
            results: {
              orderBy: { performedDate: 'desc' },
            },
          },
        },
        results: {
          orderBy: { performedDate: 'desc' },
        },
      },
    });

    if (!labTest) {
      throw new NotFoundException('Lab test not found');
    }

    return labTest;
  }

  /**
   * Collect sample for test order
   */
  async collectSample(
    orderId: string,
    data: {
      specimenType:
        | 'BLOOD'
        | 'URINE'
        | 'STOOL'
        | 'SPUTUM'
        | 'CSF'
        | 'SYNOVIAL_FLUID'
        | 'PLEURAL_FLUID'
        | 'SWAB'
        | 'TISSUE'
        | 'OTHER';
      collectionMethod:
        | 'VENIPUNCTURE'
        | 'FINGERSTICK'
        | 'HEELSTICK'
        | 'URINE_COLLECTION'
        | 'STOOL_COLLECTION'
        | 'SWAB'
        | 'ASPIRATION'
        | 'BIOPSY';
      collectionSite?: string;
      volume?: string;
      condition?:
        | 'GOOD'
        | 'HEMOLYZED'
        | 'CLOTTED'
        | 'INSUFFICIENT'
        | 'CONTAMINATED'
        | 'LIPIDIC'
        | 'ICTERIC';
      collectedBy: string;
      storageLocation?: string;
      storageTemp?: string;
      notes?: string;
    },
  ) {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id: orderId },
      include: { samples: true },
    });

    if (!labTest) {
      throw new NotFoundException('Lab test not found');
    }

    if (labTest.status !== 'ORDERED' && labTest.status !== 'SAMPLE_COLLECTED') {
      throw new BadRequestException('Sample can only be collected for ordered tests');
    }

    // Check if sample already exists
    if (labTest.samples.length > 0) {
      // Update existing sample
      await this.prisma.labSample.update({
        where: { id: labTest.samples[0].id },
        data: {
          specimenType: data.specimenType,
          collectionMethod: data.collectionMethod,
          collectionSite: data.collectionSite,
          volume: data.volume,
          condition: data.condition || 'GOOD',
          storageLocation: data.storageLocation,
          storageTemp: data.storageTemp,
          notes: data.notes,
          collectedBy: data.collectedBy,
          collectionDate: new Date(),
        },
      });
    } else {
      // Create new sample with barcode
      const barcode = await this.barcodeService.generateSampleBarcode(orderId);

      await this.prisma.labSample.create({
        data: {
          labTestId: orderId,
          sampleId: barcode,
          specimenType: data.specimenType,
          collectionMethod: data.collectionMethod,
          collectionSite: data.collectionSite,
          volume: data.volume,
          condition: data.condition || 'GOOD',
          collectedBy: data.collectedBy,
          storageLocation: data.storageLocation,
          storageTemp: data.storageTemp,
          notes: data.notes,
        },
      });
    }

    // Update test status
    await this.prisma.labTest.update({
      where: { id: orderId },
      data: {
        status: 'SAMPLE_COLLECTED',
      },
    });

    return { success: true, message: 'Sample collected successfully' };
  }

  /**
   * Receive sample in lab (technician action)
   */
  async receiveSample(orderId: string, technicianId: string, notes?: string) {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id: orderId },
    });

    if (!labTest) {
      throw new NotFoundException('Lab test not found');
    }

    if (labTest.status !== 'SAMPLE_COLLECTED') {
      throw new BadRequestException('Sample must be collected before receiving');
    }

    await this.prisma.labTest.update({
      where: { id: orderId },
      data: {
        status: 'RECEIVED',
      },
    });

    return { success: true, message: 'Sample received in lab' };
  }

  /**
   * Enter test results
   */
  async enterResults(
    orderId: string,
    results: Array<{
      parameter: string;
      value: string;
      units?: string;
      referenceRange?: string;
      flag?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL_HIGH' | 'CRITICAL_LOW' | 'ABNORMAL';
      status?: 'PRELIMINARY' | 'FINAL' | 'AMENDED' | 'CORRECTED';
      instrument?: string;
      notes?: string;
    }>,
    performedBy: string,
  ) {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id: orderId },
      include: { samples: true },
    });

    if (!labTest) {
      throw new NotFoundException('Lab test not found');
    }

    if (labTest.status !== 'RECEIVED' && labTest.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Results can only be entered for received or in-progress tests',
      );
    }

    // Get the sample (assuming single sample per test)
    const sample = labTest.samples[0];
    if (!sample) {
      throw new BadRequestException('No sample found for this test');
    }

    // Create results
    for (const result of results) {
      await this.prisma.labResult.create({
        data: {
          labTestId: orderId,
          labSampleId: sample.id,
          parameter: result.parameter,
          value: result.value,
          units: result.units,
          referenceRange: result.referenceRange,
          flag: result.flag,
          status: result.status || 'PRELIMINARY',
          performedBy,
          instrument: result.instrument,
          notes: result.notes,
        },
      });
    }

    // Update test status
    const hasFinalResults = results.some(r => r.status === 'FINAL');
    await this.prisma.labTest.update({
      where: { id: orderId },
      data: {
        status: hasFinalResults ? 'COMPLETED' : 'IN_PROGRESS',
      },
    });

    return { success: true, message: 'Results entered successfully' };
  }

  /**
   * Update test order status
   */
  async updateTestStatus(id: string, status: string, updatedBy: string, notes?: string) {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id },
    });

    if (!labTest) {
      throw new NotFoundException('Lab test not found');
    }

    // Validate status transition
    await this.validateStatusTransition(labTest.status, status);

    return this.prisma.labTest.update({
      where: { id },
      data: {
        status: status as any,
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
  }

  /**
   * Cancel test order
   */
  async cancelTestOrder(id: string, reason: string, cancelledBy: string) {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id },
    });

    if (!labTest) {
      throw new NotFoundException('Lab test not found');
    }

    if (labTest.status === 'COMPLETED' || labTest.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel completed or already cancelled tests');
    }

    return this.prisma.labTest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Get test catalog
   */
  async getTestCatalog(filters?: { category?: string; department?: string; isActive?: boolean }) {
    const where: any = {};

    if (filters?.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }
    if (filters?.department) {
      where.department = filters.department;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.labTestCatalog.findMany({
      where,
      orderBy: [{ department: 'asc' }, { category: 'asc' }, { testName: 'asc' }],
    });
  }

  /**
   * Get comprehensive lab statistics
   */
  async getLabStatistics(dateRange?: { from: Date; to: Date }) {
    const dateFilter = dateRange
      ? {
          orderedDate: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }
      : {};

    const [
      totalTests,
      pendingTests,
      inProgressTests,
      completedTests,
      cancelledTests,
      urgentTests,
      completedToday,
      avgTurnaroundTime,
      testsByDepartment,
      testsByStatus,
    ] = await Promise.all([
      this.prisma.labTest.count({ where: dateFilter }),
      this.prisma.labTest.count({
        where: { ...dateFilter, status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'RECEIVED'] } },
      }),
      this.prisma.labTest.count({
        where: { ...dateFilter, status: 'IN_PROGRESS' },
      }),
      this.prisma.labTest.count({
        where: { ...dateFilter, status: 'COMPLETED' },
      }),
      this.prisma.labTest.count({
        where: { ...dateFilter, status: 'CANCELLED' },
      }),
      this.prisma.labTest.count({
        where: { ...dateFilter, urgent: true },
      }),
      this.prisma.labTest.count({
        where: {
          status: 'COMPLETED',
          orderedDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.calculateAverageTurnaroundTime(dateRange),
      this.getTestsByDepartment(dateRange),
      this.getTestsByStatus(dateRange),
    ]);

    return {
      overview: {
        totalTests,
        pendingTests,
        inProgressTests,
        completedTests,
        cancelledTests,
        urgentTests,
        completedToday,
        avgTurnaroundTime: Math.round(avgTurnaroundTime),
      },
      breakdown: {
        byDepartment: testsByDepartment,
        byStatus: testsByStatus,
      },
    };
  }

  /**
   * Get tests grouped by department
   */
  private async getTestsByDepartment(dateRange?: { from: Date; to: Date }) {
    const dateFilter = dateRange
      ? {
          labTests: {
            some: {
              orderedDate: {
                gte: dateRange.from,
                lte: dateRange.to,
              },
            },
          },
        }
      : {};

    const departments = await this.prisma.labTestCatalog.groupBy({
      by: ['department'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return departments.map(dept => ({
      department: dept.department,
      count: dept._count.id,
    }));
  }

  /**
   * Get tests grouped by status
   */
  private async getTestsByStatus(dateRange?: { from: Date; to: Date }) {
    const dateFilter = dateRange
      ? {
          orderedDate: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }
      : {};

    const statuses = await this.prisma.labTest.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: {
        id: true,
      },
    });

    return statuses.map(status => ({
      status: status.status,
      count: status._count.id,
    }));
  }

  /**
   * Calculate average turnaround time
   */
  private async calculateAverageTurnaroundTime(dateRange?: {
    from: Date;
    to: Date;
  }): Promise<number> {
    const dateFilter = dateRange
      ? {
          orderedDate: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }
      : {};

    const completedTests = await this.prisma.labTest.findMany({
      where: {
        ...dateFilter,
        status: 'COMPLETED',
        results: {
          some: {}, // Has results
        },
      },
      include: {
        results: {
          orderBy: { performedDate: 'desc' },
          take: 1,
        },
      },
    });

    if (completedTests.length === 0) return 0;

    const totalHours = completedTests.reduce((sum, test) => {
      if (test.results.length > 0) {
        const turnaroundMs = test.results[0].performedDate.getTime() - test.orderedDate.getTime();
        return sum + turnaroundMs / (1000 * 60 * 60); // Convert to hours
      }
      return sum;
    }, 0);

    return totalHours / completedTests.length;
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = await this.getNextSequence(dateStr);

    return `L${dateStr}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Get next sequence number for the day
   */
  private async getNextSequence(dateStr: string): Promise<number> {
    // This is a simplified implementation. In production, you'd want to use a proper sequence table
    const todayOrders = await this.prisma.labTest.count({
      where: {
        orderNumber: {
          startsWith: `L${dateStr}`,
        },
      },
    });

    return todayOrders + 1;
  }

  /**
   * Validate status transitions
   */
  private async validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: Record<string, string[]> = {
      ORDERED: ['SAMPLE_COLLECTED', 'CANCELLED', 'REJECTED'],
      SAMPLE_COLLECTED: ['RECEIVED', 'CANCELLED', 'REJECTED'],
      RECEIVED: ['IN_PROGRESS', 'CANCELLED', 'REJECTED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [], // Terminal state
      CANCELLED: [], // Terminal state
      REJECTED: [], // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
