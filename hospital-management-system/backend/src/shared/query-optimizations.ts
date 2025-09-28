import { PrismaClient } from '@prisma/client';

export class QueryOptimizations {
  constructor(private prisma: PrismaClient) {}

  /**
   * Tenant-aware query wrapper
   */
  private withTenant<T extends Record<string, any>>(query: T, tenantId: string): T {
    return {
      ...query,
      where: {
        ...query.where,
        tenantId,
      },
    };
  }

  /**
   * Optimized dashboard statistics with caching
   */
  async getDashboardStats(tenantId: string) {
    const [patientCount, appointmentCount, revenue] = await Promise.all([
      this.prisma.patient.count({
        where: { tenantId, isArchived: false },
      }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          appointmentDate: {
            gte: new Date(),
          },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      this.prisma.bill.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      patients: patientCount,
      appointments: appointmentCount,
      monthlyRevenue: revenue._sum.totalAmount || 0,
    };
  }

  /**
   * Paginated patient search with optimized queries
   */
  async searchPatients(tenantId: string, searchTerm: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where: {
          tenantId,
          isArchived: false,
          OR: [
            { mrn: { contains: searchTerm, mode: 'insensitive' } },
            {
              user: {
                OR: [
                  { firstName: { contains: searchTerm, mode: 'insensitive' } },
                  { lastName: { contains: searchTerm, mode: 'insensitive' } },
                  { email: { contains: searchTerm, mode: 'insensitive' } },
                ],
              },
            },
          ],
        },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.patient.count({
        where: {
          tenantId,
          isArchived: false,
          OR: [
            { mrn: { contains: searchTerm, mode: 'insensitive' } },
            {
              user: {
                OR: [
                  { firstName: { contains: searchTerm, mode: 'insensitive' } },
                  { lastName: { contains: searchTerm, mode: 'insensitive' } },
                  { email: { contains: searchTerm, mode: 'insensitive' } },
                ],
              },
            },
          ],
        },
      }),
    ]);

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Batch operations for audit logs
   */
  async createAuditLogs(
    logs: Array<{
      tenantId: string;
      userId: string;
      action: string;
      resource: string;
      resourceId: string;
      details?: any;
      complianceFlags?: string[];
    }>,
  ) {
    // Use transaction for batch insert
    await this.prisma.$transaction(
      logs.map(log =>
        this.prisma.auditLog.create({
          data: {
            ...log,
            timestamp: new Date(),
          },
        }),
      ),
    );
  }

  /**
   * Optimized medical record retrieval with pagination
   */
  async getPatientMedicalRecords(tenantId: string, patientId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.medicalRecord.findMany({
        where: {
          tenantId,
          patientId,
          isArchived: false,
        },
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
        skip,
        take: limit,
      }),
      this.prisma.medicalRecord.count({
        where: {
          tenantId,
          patientId,
          isArchived: false,
        },
      }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Compliance reporting with optimized queries
   */
  async getComplianceReport(tenantId: string, startDate: Date, endDate: Date) {
    const [phiAccess, failedLogins, dataExports] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          tenantId,
          timestamp: { gte: startDate, lte: endDate },
          complianceFlags: { has: 'PHI_ACCESS' },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          tenantId,
          timestamp: { gte: startDate, lte: endDate },
          action: 'FAILED_LOGIN',
        },
      }),
      this.prisma.auditLog.count({
        where: {
          tenantId,
          timestamp: { gte: startDate, lte: endDate },
          action: 'DATA_EXPORT',
        },
      }),
    ]);

    return {
      period: { startDate, endDate },
      metrics: {
        phiAccessCount: phiAccess,
        failedLoginAttempts: failedLogins,
        dataExports,
      },
    };
  }

  /**
   * Revenue analytics with time-series optimization
   */
  async getRevenueAnalytics(tenantId: string, startDate: Date, endDate: Date) {
    const revenue = await this.prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        SUM("totalAmount") as revenue,
        COUNT(*) as transactions
      FROM bills
      WHERE "tenantId" = ${tenantId}
        AND "status" = 'PAID'
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `;

    return revenue;
  }
}
