import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SuperadminService {
  constructor(private prisma: PrismaService) {}

  async getAllHospitals() {
    return this.prisma.hospital.findMany({
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            appointments: true,
          },
        },
      },
    });
  }

  async createHospital(data: any) {
    return this.prisma.hospital.create({
      data: {
        ...data,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
    });
  }

  async updateHospital(hospitalId: string, data: any) {
    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data,
    });
  }

  async deactivateHospital(hospitalId: string) {
    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data: { status: 'INACTIVE' },
    });
  }

  async getHospitalUsers(hospitalId: string) {
    return this.prisma.user.findMany({
      where: { hospitalId },
      include: { role: true },
    });
  }

  async createHospitalUser(hospitalId: string, userData: any) {
    // Check user limit for the hospital's plan
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    const userCount = await this.prisma.user.count({
      where: { hospitalId },
    });

    if (userCount >= hospital.maxUsers) {
      throw new ForbiddenException('User limit exceeded for this hospital plan');
    }

    return this.prisma.user.create({
      data: {
        ...userData,
        hospitalId,
        isActive: true,
      },
    });
  }

  async updateUserPermissions(userId: string, permissions: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { permissions },
    });
  }

  async resetUserPassword(userId: string) {
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);

    // In production, send email with reset link
    // For now, return the temp password (not secure, just for demo)

    return {
      userId,
      tempPassword,
      message: 'Temporary password generated. User should change it on first login.',
    };
  }

  async getSystemAnalytics() {
    const [totalHospitals, activeHospitals, totalUsers, totalPatients, totalRevenue] =
      await Promise.all([
        this.prisma.hospital.count(),
        this.prisma.hospital.count({ where: { status: 'ACTIVE' } }),
        this.prisma.user.count(),
        this.prisma.patient.count(),
        this.prisma.invoice.aggregate({
          where: { status: 'PAID' },
          _sum: { totalAmount: true },
        }),
      ]);

    return {
      totalHospitals,
      activeHospitals,
      totalUsers,
      totalPatients,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }

  async enableModuleForHospital(hospitalId: string, moduleName: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) throw new NotFoundException('Hospital not found');

    const enabledModules = hospital.enabledModules || [];
    if (!enabledModules.includes(moduleName)) {
      enabledModules.push(moduleName);
    }

    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data: { enabledModules },
    });
  }

  async disableModuleForHospital(hospitalId: string, moduleName: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) throw new NotFoundException('Hospital not found');

    const enabledModules = hospital.enabledModules || [];
    const updatedModules = enabledModules.filter(m => m !== moduleName);

    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data: { enabledModules: updatedModules },
    });
  }

  async getHospitalSubscription(hospitalId: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: { subscription: true },
    });

    if (!hospital) throw new NotFoundException('Hospital not found');

    return {
      hospital: hospital.name,
      plan: hospital.subscription?.plan || 'FREE',
      maxUsers: hospital.maxUsers,
      enabledModules: hospital.enabledModules,
      expiresAt: hospital.subscription?.expiresAt,
    };
  }

  async updateHospitalSubscription(hospitalId: string, subscriptionData: any) {
    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        maxUsers: subscriptionData.maxUsers,
        enabledModules: subscriptionData.enabledModules,
        subscription: {
          upsert: {
            create: subscriptionData,
            update: subscriptionData,
          },
        },
      },
    });
  }

  async getAuditLogs(filters: any = {}) {
    return this.prisma.auditLog.findMany({
      where: filters,
      include: { user: true, hospital: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async generateSystemReport(startDate: Date, endDate: Date) {
    const [newHospitals, newUsers, revenue, topHospitals] = await Promise.all([
      this.prisma.hospital.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.hospital.findMany({
        take: 10,
        include: {
          _count: {
            select: { patients: true },
          },
        },
        orderBy: {
          patients: { _count: 'desc' },
        },
      }),
    ]);

    return {
      period: { startDate, endDate },
      newHospitals,
      newUsers,
      totalRevenue: revenue._sum.totalAmount || 0,
      topHospitals: topHospitals.map(h => ({
        name: h.name,
        patientCount: h._count.patients,
      })),
    };
  }
}
