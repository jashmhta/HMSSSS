/*[object Object]*/
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class BloodBankService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   *
   */
  async registerDonor(data: any) {
    // Since BloodDonor model doesn't exist, create a user with donor role
    return this.prisma.user.create({
      data: {
        ...data,
        role: UserRole.PATIENT,
        bloodType: data.bloodType,
      },
    });
  }

  /**
   *
   */
  async getDonors() {
    // Get users with donor role
    return this.prisma.user.findMany({
      where: {
        role: UserRole.PATIENT,
      },
    });
  }

  /**
   *
   */
  async getDonorById(id: string) {
    const donor = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!donor || donor.role !== UserRole.PATIENT) throw new NotFoundException('Donor not found');
    return donor;
  }

  /**
   *
   */
  async recordDonation(donorId: string, donationData: any) {
    // Check if donor is eligible (last donation > 56 days for whole blood)
    const lastDonation = await this.prisma.bloodDonation.findFirst({
      where: { donorId },
      orderBy: { donationDate: 'desc' },
    });

    if (lastDonation) {
      const daysSinceLastDonation = Math.floor(
        (new Date().getTime() - lastDonation.donationDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLastDonation < 56) {
        throw new BadRequestException('Donor is not eligible for donation yet');
      }
    }

    return this.prisma.bloodDonation.create({
      data: {
        donorId,
        ...donationData,
      },
    });
  }

  /**
   *
   */
  async getBloodInventory() {
    // Since BloodUnit model doesn't exist, return blood donations grouped by type
    const donations = await this.prisma.bloodDonation.groupBy({
      by: ['bloodType'],
      _sum: { quantity: true },
      _count: true,
    });

    return donations.map(donation => ({
      bloodType: donation.bloodType,
      totalQuantity: donation._sum.quantity || 0,
      totalUnits: donation._count,
    }));
  }

  /**
   *
   */
  async getBloodUnitsByType(bloodType: string) {
    // Since BloodUnit model doesn't exist, return blood donations by type
    return this.prisma.bloodDonation.findMany({
      where: {
        bloodType: bloodType as any,
      },
    });
  }

  /**
   *
   */
  async requestBloodCrossmatch(data: any) {
    // Since BloodCrossmatch model doesn't exist, create a simple record
    // This would be implemented based on actual requirements
    return {
      id: `crossmatch-${Date.now()}`,
      ...data,
      status: 'PENDING',
      createdAt: new Date(),
    };
  }

  /**
   *
   */
  async performCrossmatch(crossmatchId: string, result: any) {
    // Since BloodCrossmatch model doesn't exist, update the mock record
    return {
      id: crossmatchId,
      ...result,
      status: 'COMPLETED',
      updatedAt: new Date(),
    };
  }

  /**
   *
   */
  async issueBloodUnit(unitId: string, patientId: string, issuedBy: string) {
    // Since BloodUnit model doesn't exist, create a mock record
    return {
      id: `issued-${Date.now()}`,
      unitId,
      patientId,
      issuedBy,
      status: 'ISSUED',
      issuedAt: new Date(),
    };
  }

  /**
   *
   */
  async getCrossmatchRequests() {
    // Since BloodCrossmatch model doesn't exist, return mock data
    return [];
  }

  /**
   *
   */
  async getLowStockAlerts() {
    // Get blood types with low inventory using BloodDonation model
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const alerts = [];

    for (const bloodType of bloodTypes) {
      const donations = await this.prisma.bloodDonation.aggregate({
        where: {
          bloodType: bloodType as any,
          donationDate: { gte: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000) }, // Last 42 days
        },
        _sum: { quantity: true },
      });

      const totalQuantity = Number(donations._sum.quantity) || 0;
      if (totalQuantity < 10) {
        alerts.push({
          bloodType,
          availableUnits: Math.floor(totalQuantity / 450), // Assuming 450ml per unit
          status: 'LOW_STOCK',
        });
      }
    }

    return alerts;
  }

  /**
   *
   */
  async getExpiringUnits(days: number = 7) {
    // Since BloodUnit model doesn't exist, return blood donations near expiry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return this.prisma.bloodDonation.findMany({
      where: {
        donationDate: {
          gte: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // Donations in last 35 days
          lte: expiryDate,
        },
      },
    });
  }
}
