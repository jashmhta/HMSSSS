/*[object Object]*/
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SurgeryPriority, AnesthesiaType, SurgeryOutcome, SurgeryStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class OTService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   *
   */
  async scheduleSurgery(data: {
    patientId: string;
    surgeonId: string;
    otId: string;
    surgeryNumber: string;
    procedureName: string;
    procedureCode?: string;
    scheduledDate: Date;
    estimatedDuration: number;
    priority?: string;
    anesthesiaType?: string;
    assistants?: string[];
    nurses?: string[];
    equipment?: string[];
    notes?: string;
    createdBy?: string;
  }) {
    // Check if OT is available at the scheduled time
    const startTime = new Date(data.scheduledDate);
    const endTime = new Date(startTime.getTime() + data.estimatedDuration * 60000);

    const conflictingSurgery = await this.prisma.surgery.findFirst({
      where: {
        otId: data.otId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            AND: [
              { scheduledDate: { lte: startTime } },
              {
                scheduledDate: {
                  gte: new Date(startTime.getTime() - data.estimatedDuration * 60000),
                },
              },
            ],
          },
        ],
      },
    });

    if (conflictingSurgery) {
      throw new ConflictException('OT is not available at the scheduled time');
    }

    return this.prisma.surgery.create({
      data: {
        patientId: data.patientId,
        surgeonId: data.surgeonId,
        otId: data.otId,
        surgeryNumber: data.surgeryNumber,
        procedureName: data.procedureName,
        procedureCode: data.procedureCode,
        scheduledDate: data.scheduledDate,
        estimatedDuration: data.estimatedDuration,
        priority: data.priority ? (data.priority as SurgeryPriority) : SurgeryPriority.ELECTIVE,
        anesthesiaType: data.anesthesiaType ? (data.anesthesiaType as AnesthesiaType) : undefined,
        assistants: data.assistants || [],
        nurses: data.nurses || [],
        equipment: data.equipment || [],
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        operatingTheater: true,
      },
    });
  }

  /**
   *
   */
  async getSurgeries(page: number = 1, limit: number = 10, status?: string, date?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (date) {
      const searchDate = new Date(date);
      where.scheduledDate = {
        gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        lt: new Date(searchDate.setHours(23, 59, 59, 999)),
      };
    }

    const [surgeries, total] = await Promise.all([
      this.prisma.surgery.findMany({
        where,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          surgeon: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          operatingTheater: true,
        },
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
      }),
      this.prisma.surgery.count({ where }),
    ]);

    return {
      data: surgeries,
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
  async getSurgeryById(id: string) {
    const surgery = await this.prisma.surgery.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        operatingTheater: true,
      },
    });

    if (!surgery) {
      throw new NotFoundException('Surgery not found');
    }

    return surgery;
  }

  /**
   *
   */
  async updateSurgery(
    id: string,
    data: Partial<{
      procedureName: string;
      procedureCode: string;
      scheduledDate: Date;
      estimatedDuration: number;
      priority: string;
      anesthesiaType: string;
      assistants: string[];
      nurses: string[];
      equipment: string[];
      status: string;
      actualStartTime: Date;
      actualEndTime: Date;
      actualDuration: number;
      complications: string;
      outcome: string;
      notes: string;
      updatedBy?: string;
    }>,
  ) {
    const surgery = await this.prisma.surgery.findUnique({
      where: { id },
    });

    if (!surgery) {
      throw new NotFoundException('Surgery not found');
    }

    // Calculate actual duration if start and end times are provided
    let actualDuration = data.actualDuration;
    if (data.actualStartTime && data.actualEndTime && !actualDuration) {
      actualDuration = Math.round(
        (data.actualEndTime.getTime() - data.actualStartTime.getTime()) / 60000,
      );
    }

    return this.prisma.surgery.update({
      where: { id },
      data: {
        procedureName: data.procedureName,
        procedureCode: data.procedureCode,
        scheduledDate: data.scheduledDate,
        estimatedDuration: data.estimatedDuration,
        priority: data.priority ? (data.priority as SurgeryPriority) : undefined,
        anesthesiaType: data.anesthesiaType ? (data.anesthesiaType as AnesthesiaType) : undefined,
        assistants: data.assistants,
        nurses: data.nurses,
        equipment: data.equipment,
        status: data.status ? (data.status as SurgeryStatus) : undefined,
        actualStartTime: data.actualStartTime,
        actualEndTime: data.actualEndTime,
        actualDuration,
        complications: data.complications,
        outcome: data.outcome ? (data.outcome as SurgeryOutcome) : undefined,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        operatingTheater: true,
      },
    });
  }

  /**
   *
   */
  async cancelSurgery(id: string, cancelledBy: string) {
    const surgery = await this.prisma.surgery.findUnique({
      where: { id },
    });

    if (!surgery) {
      throw new NotFoundException('Surgery not found');
    }

    return this.prisma.surgery.update({
      where: { id },
      data: {
        status: SurgeryStatus.CANCELLED,
        complications: `Cancelled by ${cancelledBy}`,
      },
    });
  }

  /**
   *
   */
  async getOTSchedule(otId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.surgery.findMany({
      where: {
        otId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        surgeon: {
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
      orderBy: { scheduledDate: 'asc' },
    });
  }

  /**
   *
   */
  async getAvailableOTs(startTime: Date, endTime: Date) {
    const occupiedOTs = await this.prisma.surgery.findMany({
      where: {
        scheduledDate: {
          gte: startTime,
          lt: endTime,
        },
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      select: { otId: true },
    });

    const occupiedOTIds = [...new Set(occupiedOTs.map(s => s.otId))];

    return this.prisma.operatingTheater.findMany({
      where: {
        id: { notIn: occupiedOTIds },
        isActive: true,
      },
    });
  }

  /**
   *
   */
  async addPreOpNote(surgeryId: string, note: any, addedBy: string) {
    const surgery = await this.prisma.surgery.findUnique({
      where: { id: surgeryId },
    });

    if (!surgery) {
      throw new NotFoundException('Surgery not found');
    }

    const currentNotes = (surgery.preOpNotes as any[]) || [];
    const newNote = {
      ...note,
      addedBy,
      addedAt: new Date(),
    };

    return this.prisma.surgery.update({
      where: { id: surgeryId },
      data: {
        preOpNotes: [...currentNotes, newNote],
      },
    });
  }

  /**
   *
   */
  async addIntraOpNote(surgeryId: string, note: any, addedBy: string) {
    const surgery = await this.prisma.surgery.findUnique({
      where: { id: surgeryId },
    });

    if (!surgery) {
      throw new NotFoundException('Surgery not found');
    }

    const currentNotes = (surgery.intraOpNotes as any[]) || [];
    const newNote = {
      ...note,
      addedBy,
      addedAt: new Date(),
    };

    return this.prisma.surgery.update({
      where: { id: surgeryId },
      data: {
        intraOpNotes: [...currentNotes, newNote],
      },
    });
  }

  /**
   *
   */
  async addPostOpNote(surgeryId: string, note: any, addedBy: string) {
    const surgery = await this.prisma.surgery.findUnique({
      where: { id: surgeryId },
    });

    if (!surgery) {
      throw new NotFoundException('Surgery not found');
    }

    const currentNotes = (surgery.postOpNotes as any[]) || [];
    const newNote = {
      ...note,
      addedBy,
      addedAt: new Date(),
    };

    return this.prisma.surgery.update({
      where: { id: surgeryId },
      data: {
        postOpNotes: [...currentNotes, newNote],
      },
    });
  }

  /**
   *
   */
  async getOperatingTheaters() {
    return this.prisma.operatingTheater.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   *
   */
  async getOTStats() {
    const [totalSurgeries, todaySurgeries, completedToday, cancelledSurgeries] = await Promise.all([
      this.prisma.surgery.count(),
      this.prisma.surgery.count({
        where: {
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.surgery.count({
        where: {
          status: 'COMPLETED',
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.surgery.count({
        where: { status: 'CANCELLED' },
      }),
    ]);

    return {
      totalSurgeries,
      todaySurgeries,
      completedToday,
      cancelledSurgeries,
      activeOTs: await this.prisma.operatingTheater.count({ where: { isActive: true } }),
    };
  }
}
