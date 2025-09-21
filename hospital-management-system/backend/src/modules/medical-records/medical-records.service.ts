import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    patientId: string;
    doctorId: string;
    visitDate: Date;
    chiefComplaint: string;
    historyOfPresentIllness?: string;
    physicalExamination?: any;
    diagnosis: string[];
    treatmentPlan?: string;
    medications?: any;
    followUpDate?: Date;
    notes?: string;
  }) {
    return this.prisma.medicalRecord.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        visitDate: data.visitDate,
        chiefComplaint: data.chiefComplaint,
        historyOfPresentIllness: data.historyOfPresentIllness,
        physicalExamination: data.physicalExamination,
        diagnosis: data.diagnosis,
        treatmentPlan: data.treatmentPlan,
        medications: data.medications,
        followUpDate: data.followUpDate,
        notes: data.notes,
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
        doctor: {
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

  async findAll(filters?: {
    patientId?: string;
    doctorId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, ...whereFilters } = filters || {};
    const skip = (page - 1) * limit;

    const where = {
      ...(whereFilters.patientId && { patientId: whereFilters.patientId }),
      ...(whereFilters.doctorId && { doctorId: whereFilters.doctorId }),
      ...(whereFilters.startDate &&
        whereFilters.endDate && {
          visitDate: {
            gte: whereFilters.startDate,
            lte: whereFilters.endDate,
          },
        }),
    };

    const [records, total] = await Promise.all([
      this.prisma.medicalRecord.findMany({
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
          doctor: {
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
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
      }),
      this.prisma.medicalRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const record = await this.prisma.medicalRecord.findUnique({
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
          },
        },
        doctor: {
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

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    return record;
  }

  async findByPatient(patientId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.medicalRecord.findMany({
        where: { patientId },
        include: {
          doctor: {
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
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
      }),
      this.prisma.medicalRecord.count({ where: { patientId } }),
    ]);

    return {
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    id: string,
    data: Partial<{
      chiefComplaint: string;
      historyOfPresentIllness: string;
      physicalExamination: any;
      diagnosis: string[];
      treatmentPlan: string;
      medications: any;
      followUpDate: Date;
      notes: string;
    }>,
  ) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    return this.prisma.medicalRecord.update({
      where: { id },
      data,
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
        doctor: {
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

  async remove(id: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    return this.prisma.medicalRecord.delete({
      where: { id },
    });
  }

  async getPatientHistory(patientId: string) {
    const records = await this.prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: {
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
      orderBy: { visitDate: 'desc' },
      take: 50, // Last 50 visits
    });

    // Group by diagnosis for summary
    const diagnosisCount = {};
    const recentMedications = new Set();

    records.forEach(record => {
      record.diagnosis.forEach(diag => {
        diagnosisCount[diag] = (diagnosisCount[diag] || 0) + 1;
      });

      if (record.medications) {
        Object.keys(record.medications).forEach(med => {
          recentMedications.add(med);
        });
      }
    });

    return {
      totalVisits: records.length,
      recentVisits: records.slice(0, 10),
      diagnosisSummary: diagnosisCount,
      recentMedications: Array.from(recentMedications),
      lastVisit: records[0] || null,
    };
  }

  async getDoctorStats(doctorId: string, startDate?: Date, endDate?: Date) {
    const where = {
      doctorId,
      ...(startDate &&
        endDate && {
          visitDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const [totalRecords, uniquePatients, avgDiagnosis] = await Promise.all([
      this.prisma.medicalRecord.count({ where }),
      this.prisma.medicalRecord
        .findMany({
          where,
          select: { patientId: true },
          distinct: ['patientId'],
        })
        .then(records => records.length),
      this.prisma.medicalRecord
        .findMany({
          where,
          select: { diagnosis: true },
        })
        .then(records => {
          const totalDiagnosis = records.reduce((sum, record) => sum + record.diagnosis.length, 0);
          return records.length > 0 ? totalDiagnosis / records.length : 0;
        }),
    ]);

    return {
      totalRecords,
      uniquePatients,
      avgDiagnosisPerVisit: Math.round(avgDiagnosis * 100) / 100,
    };
  }
}
