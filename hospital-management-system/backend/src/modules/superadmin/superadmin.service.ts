/*[object Object]*/
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class SuperadminService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   *
   */
  async getAllHospitals() {
    return this.prisma.hospital.findMany({
      include: {
        _count: {
          select: {
            patients: true,
          },
        },
      },
    });
  }

  /**
   *
   */
  async createHospital(data: any) {
    return this.prisma.hospital.create({
      data: {
        ...data,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
    });
  }

  /**
   *
   */
  async updateHospital(hospitalId: string, data: any) {
    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data,
    });
  }

  /**
   *
   */
  async deactivateHospital(hospitalId: string) {
    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data: { status: 'INACTIVE' },
    });
  }

  /**
   *
   */
  async getHospitalUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  /**
   *
   */
  async createHospitalUser(userData: any) {
    return this.prisma.user.create({
      data: {
        ...userData,
        isActive: true,
        createdAt: new Date(),
      },
    });
  }

  /**
   *
   */
  async updateUserRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  /**
   *
   */
  async resetUserPassword(userId: string) {
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);

    // Update user password in database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: tempPassword,
        passwordChangedAt: new Date(),
      },
    });

    // In production, send email with reset link
    // For now, return the temp password (not secure, just for demo)

    return {
      userId,
      tempPassword,
      message: 'Temporary password generated. User should change it on first login.',
    };
  }

  /**
   *
   */
  async getSystemAnalytics() {
    const [totalHospitals, activeHospitals, totalUsers, totalPatients, totalRevenue] =
      await Promise.all([
        this.prisma.hospital.count(),
        this.prisma.hospital.count({ where: { status: 'ACTIVE' } }),
        this.prisma.user.count(),
        this.prisma.patient.count(),
        this.prisma.invoice.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalHospitals,
      activeHospitals,
      totalUsers,
      totalPatients,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }

  /**
   *
   */
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

  /**
   *
   */
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

  /**
   *
   */
  async getHospitalSubscription(hospitalId: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
      // subscription is a JSON field, not a relation
    });

    if (!hospital) throw new NotFoundException('Hospital not found');

    const subscription = (hospital.subscription as any) || {};
    return {
      hospital: hospital.name,
      plan: subscription.plan || 'FREE',
      maxUsers: hospital.maxUsers,
      enabledModules: subscription.enabledModules || [],
      expiresAt: subscription.expiresAt,
    };
  }

  /**
   *
   */
  async updateHospitalSubscription(hospitalId: string, subscriptionData: any) {
    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        maxUsers: subscriptionData.maxUsers,
        subscription: subscriptionData,
      },
    });
  }

  /**
   *
   */
  async getAuditLogs(filters: any = {}) {
    return this.prisma.auditLog.findMany({
      where: filters,
      include: { user: true },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });
  }

  /**
   *
   */
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
        _sum: { amount: true },
      }),
      this.prisma.hospital.findMany({
        take: 10,
        include: {
          patients: true,
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
      totalRevenue: revenue._sum.amount ? Number(revenue._sum.amount) : 0,
      topHospitals: topHospitals.map(h => ({
        name: h.name,
        patientCount: h.patients?.length || 0,
      })),
    };
  }
}
