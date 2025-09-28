/*[object Object]*/
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class AppointmentsService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   *
   */
  async create(data: {
    patientId: string;
    doctorId: string;
    appointmentDate: Date;
    duration?: number;
    type?: string;
    reason?: string;
    notes?: string;
    tenantId: string;
  }) {
    // Verify patient and doctor exist
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId, tenantId: data.tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: data.doctorId, tenantId: data.tenantId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check for scheduling conflicts
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });

    if (conflict) {
      throw new BadRequestException('Doctor has a scheduling conflict at this time');
    }

    return this.prisma.appointment.create({
      data: {
        tenantId: data.tenantId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        duration: data.duration || 30,
        type: (data.type as any) || 'CONSULTATION',
        reason: data.reason,
        notes: data.notes,
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  /**
   *
   */
  async findAll(filters?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const where: any = {};

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }
    if (filters?.doctorId) {
      where.doctorId = filters.doctorId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.appointmentDate = {};
      if (filters.dateFrom) {
        where.appointmentDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.appointmentDate.lte = filters.dateTo;
      }
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });
  }

  /**
   *
   */
  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  /**
   *
   */
  async update(
    id: string,
    data: Partial<{
      appointmentDate: Date;
      duration: number;
      type: string;
      status: string;
      reason: string;
      notes: string;
    }>,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        type: data.type ? (data.type as any) : undefined,
        status: data.status ? (data.status as any) : undefined,
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  /**
   *
   */
  async remove(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  /**
   *
   */
  async getDoctorSchedule(doctorId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });
  }

  /**
   *
   */
  async getPatientAppointments(patientId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId },
        include: {
          doctor: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { appointmentDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.appointment.count({ where: { patientId } }),
    ]);

    return {
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async getAppointmentStats() {
    const [total, scheduled, completed, cancelled] = await Promise.all([
      this.prisma.appointment.count(),
      this.prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.appointment.count({ where: { status: 'CANCELLED' } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await this.prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return {
      total,
      scheduled,
      completed,
      cancelled,
      todayAppointments,
    };
  }

  /**
   *
   */
  async cancel(id: string, reason: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason,
        updatedAt: new Date(),
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }
}
