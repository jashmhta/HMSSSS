// Query Optimizations for Hospital Management System

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Optimized queries with tenant isolation and performance

export class QueryOptimizations {
  // Multi-tenant patient search with pagination
  static async searchPatients(tenantId: string, searchTerm: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return prisma.patient.findMany({
      where: {
        tenantId,
        OR: [
          { mrn: { contains: searchTerm, mode: 'insensitive' } },
          { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
          { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
        ],
        isArchived: false,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  // Optimized appointment queries with read replica preference
  static async getUpcomingAppointments(tenantId: string, doctorId?: string, date?: Date) {
    const startDate = date || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // Next 7 days

    return prisma.appointment.findMany({
      where: {
        tenantId,
        appointmentDate: { gte: startDate, lte: endDate },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        ...(doctorId && { doctorId }),
        isArchived: false,
      },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { appointmentDate: 'asc' },
    });
  }

  // Batch insert for audit logs (performance optimization)
  static async createAuditLogs(
    logs: Array<{
      tenantId: string;
      userId: string;
      action: string;
      resource: string;
      resourceId: string;
      details?: any;
    }>,
  ) {
    return prisma.auditLog.createMany({
      data: logs.map(log => ({
        ...log,
        timestamp: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  // Optimized medical records query with pagination
  static async getPatientMedicalRecords(tenantId: string, patientId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return prisma.medicalRecord.findMany({
      where: {
        tenantId,
        patientId,
        isArchived: false,
      },
      include: {
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { visitDate: 'desc' },
      skip,
      take: limit,
    });
  }

  // Dashboard statistics with read replica
  static async getDashboardStats(tenantId: string) {
    const [totalPatients, totalAppointments, totalDoctors, recentAppointments] = await Promise.all([
      prisma.patient.count({ where: { tenantId, isArchived: false } }),
      prisma.appointment.count({
        where: {
          tenantId,
          appointmentDate: { gte: new Date() },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          isArchived: false,
        },
      }),
      prisma.doctor.count({ where: { tenantId, isArchived: false } }),
      prisma.appointment.findMany({
        where: {
          tenantId,
          appointmentDate: { gte: new Date(), lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          isArchived: false,
        },
        take: 5,
        orderBy: { appointmentDate: 'asc' },
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
    ]);

    return {
      totalPatients,
      totalAppointments,
      totalDoctors,
      recentAppointments,
    };
  }

  // Bulk update for archiving
  static async archiveOldRecords(tenantId: string, olderThanDays: number = 365 * 5) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Use transaction for consistency
    return prisma.$transaction(async tx => {
      // Archive patients
      await tx.patient.updateMany({
        where: {
          tenantId,
          createdAt: { lt: cutoffDate },
          isArchived: false,
        },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });

      // Archive other records similarly
      // ... (add for other tables)
    });
  }

  // Optimized lab test results query
  static async getLabTestResults(tenantId: string, testId: string) {
    return prisma.labResult.findMany({
      where: {
        labTest: {
          tenantId,
          id: testId,
        },
      },
      include: {
        labTest: {
          include: {
            patient: { include: { user: { select: { firstName: true, lastName: true } } } },
            testCatalog: { select: { testName: true, units: true } },
          },
        },
      },
      orderBy: { performedDate: 'desc' },
    });
  }
}

// Middleware for automatic tenant filtering
export function createTenantMiddleware(tenantId: string) {
  return async (params: any, next: any) => {
    if (
      params.model &&
      [
        'User',
        'Patient',
        'Doctor',
        'Appointment',
        'MedicalRecord',
        'Prescription',
        'LabTest',
        'RadiologyTest',
        'Bill',
        'EmergencyVisit',
        'OPDVisit',
        'IPDAdmission',
        'AuditLog',
        'Notification',
      ].includes(params.model)
    ) {
      if (!params.args.where) params.args.where = {};
      params.args.where.tenantId = tenantId;
    }
    return next(params);
  };
}

// Usage example:
// prisma.$use(createTenantMiddleware('hospital-123'));
