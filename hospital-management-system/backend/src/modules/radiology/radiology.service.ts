/*[object Object]*/
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class RadiologyService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   *
   */
  async create(data: {
    patientId: string;
    testName: string;
    testCode: string;
    modality: string;
    orderedBy: string;
    scheduledDate?: Date;
    clinicalInfo?: string;
    diagnosis?: string;
    urgent?: boolean;
  }) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.radiologyTest.create({
      data: {
        patientId: data.patientId,
        testName: data.testName,
        testCode: data.testCode,
        modality: data.modality as any,
        orderedBy: data.orderedBy,
        scheduledDate: data.scheduledDate,
        urgent: data.urgent,
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
        radiologist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   *
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: string;
      patientId?: string;
      modality?: string;
      urgent?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }
    if (filters?.modality) {
      where.modality = filters.modality;
    }
    if (filters?.urgent !== undefined) {
      where.urgent = filters.urgent;
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

    const [radiologyTests, total] = await Promise.all([
      this.prisma.radiologyTest.findMany({
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
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.radiologyTest.count({ where }),
    ]);

    return {
      data: radiologyTests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async findOne(id: string) {
    const radiologyTest = await this.prisma.radiologyTest.findUnique({
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
      },
    });

    if (!radiologyTest) {
      throw new NotFoundException('Radiology test not found');
    }

    return radiologyTest;
  }

  /**
   *
   */
  async update(
    id: string,
    data: Partial<{
      status: string;
      scheduledDate: Date;
      performedDate: Date;
      performedBy: string;
      reportDate: Date;
      findings: string;
      impression: string;
      recommendations: string;
      images: string[];
    }>,
  ) {
    const radiologyTest = await this.prisma.radiologyTest.findUnique({
      where: { id },
    });

    if (!radiologyTest) {
      throw new NotFoundException('Radiology test not found');
    }

    // Validate status transitions
    if (data.status) {
      await this.validateStatusTransition(radiologyTest.status, data.status);
    }

    return this.prisma.radiologyTest.update({
      where: { id },
      data: {
        ...data,
        status: data.status as any,
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
  }

  /**
   *
   */
  async scheduleTest(
    id: string,
    data: {
      scheduledDate: Date;
    },
  ) {
    const radiologyTest = await this.prisma.radiologyTest.findUnique({
      where: { id },
    });

    if (!radiologyTest) {
      throw new NotFoundException('Radiology test not found');
    }

    if (radiologyTest.status !== 'ORDERED') {
      throw new BadRequestException('Test can only be scheduled when in ORDERED status');
    }

    return this.prisma.radiologyTest.update({
      where: { id },
      data: {
        status: 'SCHEDULED' as any,
        scheduledDate: data.scheduledDate,
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
  }

  /**
   *
   */
  async startTest(id: string, performedBy: string) {
    const radiologyTest = await this.prisma.radiologyTest.findUnique({
      where: { id },
    });

    if (!radiologyTest) {
      throw new NotFoundException('Radiology test not found');
    }

    if (radiologyTest.status !== 'SCHEDULED') {
      throw new BadRequestException('Test can only be started when scheduled');
    }

    return this.prisma.radiologyTest.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        performedDate: new Date(),
        radiologistId: performedBy,
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
  }

  /**
   *
   */
  async completeTest(
    id: string,
    data: {
      findings: string;
      impression: string;
      recommendations?: string;
      images?: string[];
      performedBy: string;
    },
  ) {
    const radiologyTest = await this.prisma.radiologyTest.findUnique({
      where: { id },
    });

    if (!radiologyTest) {
      throw new NotFoundException('Radiology test not found');
    }

    if (radiologyTest.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Test can only be completed when in progress');
    }

    return this.prisma.radiologyTest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        reportDate: new Date(),
        findings: data.findings,
        impression: data.impression,
        recommendations: data.recommendations,
        images: data.images || [],
        radiologistId: data.performedBy,
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
  }

  /**
   *
   */
  async cancelTest(id: string, reason: string) {
    const radiologyTest = await this.prisma.radiologyTest.findUnique({
      where: { id },
    });

    if (!radiologyTest) {
      throw new NotFoundException('Radiology test not found');
    }

    if (radiologyTest.status === 'COMPLETED' || radiologyTest.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel completed or already cancelled tests');
    }

    return this.prisma.radiologyTest.update({
      where: { id },
      data: {
        status: 'CANCELLED' as any,
      },
    });
  }

  /**
   *
   */
  async getRadiologyStats() {
    const [totalTests, pendingTests, completedToday, urgentTests] = await Promise.all([
      this.prisma.radiologyTest.count(),
      this.prisma.radiologyTest.count({
        where: {
          status: { in: ['ORDERED', 'SCHEDULED', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.radiologyTest.count({
        where: {
          status: 'COMPLETED',
          reportDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.radiologyTest.count({
        where: {
          urgent: true,
          status: { in: ['ORDERED', 'SCHEDULED', 'IN_PROGRESS'] },
        },
      }),
    ]);

    return {
      totalTests,
      pendingTests,
      completedToday,
      urgentTests,
    };
  }

  /**
   *
   */
  async getTestsByModality() {
    const modalities = await this.prisma.radiologyTest.groupBy({
      by: ['modality'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return modalities.map(mod => ({
      modality: mod.modality,
      count: mod._count.id,
    }));
  }

  /**
   *
   */
  async getScheduledTests(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.radiologyTest.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'SCHEDULED',
      },
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
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  /**
   *
   */
  private async validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions = {
      ORDERED: ['SCHEDULED', 'CANCELLED'],
      SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [], // Terminal state
      CANCELLED: [], // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
