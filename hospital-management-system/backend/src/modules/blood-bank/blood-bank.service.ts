import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BloodBankService {
  constructor(private prisma: PrismaService) {}

  async registerDonor(data: any) {
    return this.prisma.bloodDonor.create({ data });
  }

  async getDonors() {
    return this.prisma.bloodDonor.findMany({
      include: { donations: true },
    });
  }

  async getDonorById(id: string) {
    const donor = await this.prisma.bloodDonor.findUnique({
      where: { id },
      include: { donations: true },
    });
    if (!donor) throw new NotFoundException('Donor not found');
    return donor;
  }

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

  async getBloodInventory() {
    return this.prisma.bloodUnit.findMany({
      include: { donation: { include: { donor: true } } },
    });
  }

  async getBloodUnitsByType(bloodType: string) {
    return this.prisma.bloodUnit.findMany({
      where: {
        bloodType,
        status: 'AVAILABLE',
        expiryDate: { gt: new Date() },
      },
      include: { donation: { include: { donor: true } } },
    });
  }

  async requestBloodCrossmatch(data: any) {
    return this.prisma.bloodCrossmatch.create({
      data,
      include: { patient: true, requestedBy: true },
    });
  }

  async performCrossmatch(crossmatchId: string, result: any) {
    return this.prisma.bloodCrossmatch.update({
      where: { id: crossmatchId },
      data: {
        result,
        performedAt: new Date(),
      },
    });
  }

  async issueBloodUnit(unitId: string, patientId: string, issuedBy: string) {
    // Check if unit is available
    const unit = await this.prisma.bloodUnit.findUnique({
      where: { id: unitId },
    });

    if (!unit || unit.status !== 'AVAILABLE') {
      throw new BadRequestException('Blood unit is not available');
    }

    // Check expiry
    if (unit.expiryDate < new Date()) {
      throw new BadRequestException('Blood unit has expired');
    }

    return this.prisma.bloodUnit.update({
      where: { id: unitId },
      data: {
        status: 'ISSUED',
        issuedToPatientId: patientId,
        issuedBy,
        issuedAt: new Date(),
      },
    });
  }

  async getCrossmatchRequests() {
    return this.prisma.bloodCrossmatch.findMany({
      where: { result: null },
      include: { patient: true, requestedBy: true },
    });
  }

  async getLowStockAlerts() {
    // Get blood types with low inventory (< 10 units)
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const alerts = [];

    for (const bloodType of bloodTypes) {
      const count = await this.prisma.bloodUnit.count({
        where: {
          bloodType,
          status: 'AVAILABLE',
          expiryDate: { gt: new Date() },
        },
      });

      if (count < 10) {
        alerts.push({
          bloodType,
          availableUnits: count,
          status: 'LOW_STOCK',
        });
      }
    }

    return alerts;
  }

  async getExpiringUnits(days: number = 7) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return this.prisma.bloodUnit.findMany({
      where: {
        status: 'AVAILABLE',
        expiryDate: { lte: expiryDate },
      },
      include: { donation: { include: { donor: true } } },
    });
  }
}
