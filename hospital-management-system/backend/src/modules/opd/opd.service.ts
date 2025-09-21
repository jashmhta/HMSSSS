import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';

@Injectable()
export class OPDService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  async createOPDVisit(data: {
    patientId: string;
    doctorId: string;
    visitNumber: string;
    chiefComplaint: string;
    vitals?: any;
    examination?: any;
    diagnosis?: string[];
    treatment?: string;
    prescriptions?: any;
    followUpDate?: Date;
    notes?: string;
    roomNumber?: string;
    priority?: string;
    createdBy?: string;
  }) {
    return this.prisma.oPDVisit.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        visitNumber: data.visitNumber,
        chiefComplaint: data.chiefComplaint,
        vitals: data.vitals,
        examination: data.examination,
        diagnosis: data.diagnosis || [],
        treatment: data.treatment,
        prescriptions: data.prescriptions,
        followUpDate: data.followUpDate,
        notes: data.notes,
        roomNumber: data.roomNumber,
        priority: data.priority as any,
      },
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
      },
    });
  }

  async getOPDVisits(page: number = 1, limit: number = 10, search?: string, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { patient: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { patient: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { visitNumber: { contains: search } },
        { chiefComplaint: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [visits, total] = await Promise.all([
      this.prisma.oPDVisit.findMany({
        where,
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
        },
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
      }),
      this.prisma.oPDVisit.count({ where }),
    ]);

    return {
      data: visits,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOPDVisitById(id: string) {
    const visit = await this.prisma.oPDVisit.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
            medicalRecords: {
              orderBy: { visitDate: 'desc' },
              take: 3,
            },
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('OPD visit not found');
    }

    return visit;
  }

  async updateOPDVisit(
    id: string,
    data: Partial<{
      chiefComplaint: string;
      vitals: any;
      examination: any;
      diagnosis: string[];
      treatment: string;
      prescriptions: any;
      followUpDate: Date;
      notes: string;
      roomNumber: string;
      priority: string;
      updatedBy?: string;
    }>,
  ) {
    const visit = await this.prisma.oPDVisit.findUnique({
      where: { id },
    });

    if (!visit) {
      throw new NotFoundException('OPD visit not found');
    }

    return this.prisma.oPDVisit.update({
      where: { id },
      data: {
        ...data,
        priority: data.priority as any,
      },
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
      },
    });
  }

  async deleteOPDVisit(id: string) {
    const visit = await this.prisma.oPDVisit.findUnique({
      where: { id },
    });

    if (!visit) {
      throw new NotFoundException('OPD visit not found');
    }

    return this.prisma.oPDVisit.delete({
      where: { id },
    });
  }

  async getOPDQueue() {
    return this.prisma.oPDVisit.findMany({
      where: {
        status: 'WAITING',
      },
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
      },
      orderBy: [
        { priority: 'asc' }, // Emergency first
        { createdAt: 'asc' }, // Then by arrival time
      ],
    });
  }

  async updateVisitStatus(id: string, status: string, updatedBy?: string) {
    const visit = await this.prisma.oPDVisit.findUnique({
      where: { id },
    });

    if (!visit) {
      throw new NotFoundException('OPD visit not found');
    }

    return this.prisma.oPDVisit.update({
      where: { id },
      data: {
        status: status as any,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Schedule an OPD appointment
   */
  async scheduleAppointment(data: {
    patientId: string;
    doctorId: string;
    appointmentDate: Date;
    duration?: number;
    type: 'CONSULTATION' | 'FOLLOW_UP' | 'PROCEDURE' | 'CHECKUP';
    reason?: string;
    priority?: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    scheduledBy: string;
  }) {
    // Check doctor availability
    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
    });

    if (conflictingAppointment) {
      throw new BadRequestException('Doctor has a conflicting appointment at this time');
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        duration: data.duration || 30,
        type: data.type,
        reason: data.reason,
        status: 'SCHEDULED',
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

    // Log audit event
    await this.complianceService.logAuditEvent({
      userId: data.scheduledBy,
      action: 'APPOINTMENT_SCHEDULED',
      resource: 'appointments',
      resourceId: appointment.id,
      details: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        type: data.type,
      },
      complianceFlags: ['HIPAA', 'PATIENT_ACCESS'],
    });

    return appointment;
  }

  /**
   * Start OPD consultation from appointment
   */
  async startConsultation(appointmentId: string, startedBy: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== 'SCHEDULED' && appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Appointment is not in a valid state to start consultation');
    }

    // Generate visit number
    const visitNumber = await this.generateVisitNumber();

    // Create OPD visit
    const opdVisit = await this.prisma.oPDVisit.create({
      data: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        visitNumber,
        chiefComplaint: appointment.reason || 'Consultation',
        status: 'IN_PROGRESS',
        priority: 'NORMAL', // Default priority
        visitDate: new Date(),
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
      },
    });

    // Update appointment status
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'IN_PROGRESS',
      },
    });

    // Log consultation start
    await this.complianceService.logAuditEvent({
      userId: startedBy,
      action: 'OPD_CONSULTATION_STARTED',
      resource: 'opd_visits',
      resourceId: opdVisit.id,
      details: {
        appointmentId,
        visitNumber,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      },
      complianceFlags: ['HIPAA', 'PATIENT_ACCESS'],
    });

    return opdVisit;
  }

  /**
   * Complete OPD consultation with diagnosis and treatment
   */
  async completeConsultation(
    visitId: string,
    consultationData: {
      vitals: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        respiratoryRate?: number;
        oxygenSaturation?: number;
        weight?: number;
        height?: number;
      };
      examination: {
        generalAppearance?: string;
        systemExamination?: Record<string, any>;
        localExamination?: string;
      };
      diagnosis: string[];
      treatment: string;
      prescriptions?: Array<{
        medicationId: string;
        dosage: string;
        frequency: string;
        duration: number;
        instructions?: string;
      }>;
      followUpDate?: Date;
      notes?: string;
      completedBy: string;
    },
  ) {
    const visit = await this.prisma.oPDVisit.findUnique({
      where: { id: visitId },
      include: { patient: true, appointment: true },
    });

    if (!visit) {
      throw new NotFoundException('OPD visit not found');
    }

    if (visit.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Visit is not in progress');
    }

    // Update OPD visit
    const updatedVisit = await this.prisma.oPDVisit.update({
      where: { id: visitId },
      data: {
        vitals: consultationData.vitals,
        examination: consultationData.examination,
        diagnosis: consultationData.diagnosis,
        treatment: consultationData.treatment,
        prescriptions: consultationData.prescriptions,
        followUpDate: consultationData.followUpDate,
        notes: consultationData.notes,
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    // Update appointment status
    if (visit.appointment) {
      await this.prisma.appointment.update({
        where: { id: visit.appointment.id },
        data: {
          status: 'COMPLETED',
        },
      });
    }

    // Create prescriptions if provided
    if (consultationData.prescriptions && consultationData.prescriptions.length > 0) {
      for (const prescription of consultationData.prescriptions) {
        await this.prisma.prescription.create({
          data: {
            patientId: visit.patientId,
            doctorId: visit.doctorId,
            medicationId: prescription.medicationId,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            duration: prescription.duration,
            instructions: prescription.instructions,
            prescribedDate: new Date(),
            status: 'ACTIVE',
          },
        });
      }
    }

    // Create medical record
    await this.prisma.medicalRecord.create({
      data: {
        patientId: visit.patientId,
        doctorId: visit.doctorId,
        visitDate: new Date(),
        chiefComplaint: visit.chiefComplaint,
        physicalExamination: consultationData.examination,
        diagnosis: consultationData.diagnosis,
        treatmentPlan: consultationData.treatment,
        medications: consultationData.prescriptions,
        followUpDate: consultationData.followUpDate,
        notes: consultationData.notes,
      },
    });

    // Log consultation completion
    await this.complianceService.logAuditEvent({
      userId: consultationData.completedBy,
      action: 'OPD_CONSULTATION_COMPLETED',
      resource: 'opd_visits',
      resourceId: visitId,
      details: {
        diagnosis: consultationData.diagnosis,
        prescriptionsCount: consultationData.prescriptions?.length || 0,
        followUpDate: consultationData.followUpDate,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return updatedVisit;
  }

  /**
   * Get doctor's schedule for a specific date
   */
  async getDoctorSchedule(doctorId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
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

    return appointments;
  }

  /**
   * Get OPD queue with estimated wait times
   */
  async getOPDQueueWithWaitTimes() {
    const queue = await this.getOPDQueue();

    // Calculate estimated wait times based on average consultation time
    const avgConsultationTime = 30; // minutes
    let cumulativeWaitTime = 0;

    const queueWithWaitTimes = queue.map((visit, index) => {
      const estimatedWaitTime = index * avgConsultationTime;
      return {
        ...visit,
        estimatedWaitTime,
        estimatedConsultationTime: new Date(Date.now() + estimatedWaitTime * 60 * 1000),
      };
    });

    return queueWithWaitTimes;
  }

  /**
   * Transfer patient to different department/doctor
   */
  async transferPatient(
    visitId: string,
    transferData: {
      newDoctorId?: string;
      department?: string;
      reason: string;
      transferredBy: string;
    },
  ) {
    const visit = await this.prisma.oPDVisit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException('OPD visit not found');
    }

    // Update visit with transfer information
    const updatedVisit = await this.prisma.oPDVisit.update({
      where: { id: visitId },
      data: {
        notes:
          (visit.notes || '') + `\n[TRANSFER ${new Date().toISOString()}]: ${transferData.reason}`,
        updatedAt: new Date(),
      },
    });

    // Create new appointment if transferring to different doctor
    if (transferData.newDoctorId && transferData.newDoctorId !== visit.doctorId) {
      await this.scheduleAppointment({
        patientId: visit.patientId,
        doctorId: transferData.newDoctorId,
        appointmentDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        type: 'CONSULTATION',
        reason: `Transferred from previous consultation: ${transferData.reason}`,
        scheduledBy: transferData.transferredBy,
      });
    }

    // Log transfer
    await this.complianceService.logAuditEvent({
      userId: transferData.transferredBy,
      action: 'PATIENT_TRANSFERRED',
      resource: 'opd_visits',
      resourceId: visitId,
      details: {
        newDoctorId: transferData.newDoctorId,
        department: transferData.department,
        reason: transferData.reason,
      },
      complianceFlags: ['HIPAA', 'PATIENT_ACCESS'],
    });

    return updatedVisit;
  }

  /**
   * Get OPD performance metrics
   */
  async getOPDPerformanceMetrics(startDate: Date, endDate: Date) {
    const visits = await this.prisma.oPDVisit.findMany({
      where: {
        visitDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;
    const avgWaitTime = 0; // TODO: Calculate from actual timestamps
    const patientSatisfaction = 0; // TODO: From feedback system

    // Department-wise breakdown
    const departmentStats = await this.prisma.oPDVisit.groupBy({
      by: ['status'],
      where: {
        visitDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { status: true },
    });

    return {
      period: { startDate, endDate },
      totalVisits,
      completedVisits,
      completionRate: totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0,
      avgWaitTime,
      patientSatisfaction,
      statusBreakdown: departmentStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {}),
    };
  }

  // Helper methods

  private async generateVisitNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const count = await this.prisma.oPDVisit.count({
      where: {
        visitDate: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    return `OPD${dateStr}${(count + 1).toString().padStart(4, '0')}`;
  }

  async getOPDStats() {
    const [totalVisits, todayVisits, waitingPatients, completedToday] = await Promise.all([
      this.prisma.oPDVisit.count(),
      this.prisma.oPDVisit.count({
        where: {
          visitDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.oPDVisit.count({
        where: { status: 'WAITING' },
      }),
      this.prisma.oPDVisit.count({
        where: {
          status: 'COMPLETED',
          visitDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return {
      totalVisits,
      todayVisits,
      waitingPatients,
      completedToday,
      averageWaitTime: 0, // TODO: Calculate from actual data
    };
  }
}
