import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PriceEstimatorService {
  constructor(private prisma: PrismaService) {}

  async estimatePrice(estimationRequest: any) {
    const { services, patientType, insuranceCoverage, hospitalId } = estimationRequest;

    let totalEstimate = 0;
    const breakdown = [];

    for (const service of services) {
      const estimate = await this.calculateServiceEstimate(service, patientType, hospitalId);
      totalEstimate += estimate.amount;
      breakdown.push(estimate);
    }

    // Apply insurance discount if applicable
    let insuranceDiscount = 0;
    if (insuranceCoverage) {
      insuranceDiscount = this.calculateInsuranceDiscount(totalEstimate, insuranceCoverage);
      totalEstimate -= insuranceDiscount;
    }

    // Add taxes (assuming 18% GST)
    const taxAmount = totalEstimate * 0.18;
    const finalTotal = totalEstimate + taxAmount;

    return {
      patientType,
      services: breakdown,
      subtotal: totalEstimate,
      insuranceDiscount,
      taxAmount,
      totalEstimatedCost: finalTotal,
      currency: 'INR',
      validFor: 7, // days
      disclaimer:
        'This is an estimate only. Actual costs may vary based on specific medical requirements.',
    };
  }

  private async calculateServiceEstimate(service: any, patientType: string, hospitalId: string) {
    const { type, code, quantity = 1, duration } = service;

    let basePrice = 0;
    let description = '';

    switch (type) {
      case 'OPD_CONSULTATION':
        const consultation = await this.prisma.servicePricing.findFirst({
          where: { code: 'OPD_CONSULTATION', hospitalId },
        });
        basePrice = consultation?.price || 500;
        description = 'OPD Consultation';
        break;

      case 'LAB_TEST':
        const labTest = await this.prisma.servicePricing.findFirst({
          where: { code, hospitalId },
        });
        basePrice = labTest?.price || 300;
        description = `Laboratory Test - ${code}`;
        break;

      case 'RADIOLOGY':
        const radiology = await this.prisma.servicePricing.findFirst({
          where: { code, hospitalId },
        });
        basePrice = radiology?.price || 1500;
        description = `Radiology - ${code}`;
        break;

      case 'SURGERY':
        const surgery = await this.prisma.servicePricing.findFirst({
          where: { code, hospitalId },
        });
        basePrice = surgery?.price || 50000;
        description = `Surgical Procedure - ${code}`;
        break;

      case 'ROOM_CHARGES':
        const roomRate = await this.prisma.servicePricing.findFirst({
          where: { code: `ROOM_${patientType}`, hospitalId },
        });
        basePrice = roomRate?.price || (patientType === 'PRIVATE' ? 5000 : 2000);
        if (duration) {
          basePrice *= duration; // per day
        }
        description = `${patientType} Room Charges${duration ? ` (${duration} days)` : ''}`;
        break;

      case 'MEDICINE':
        const medicine = await this.prisma.medicine.findFirst({
          where: { code },
        });
        basePrice = medicine?.price || 100;
        description = `Medicine - ${medicine?.name || code}`;
        break;

      case 'PROCEDURE':
        const procedure = await this.prisma.servicePricing.findFirst({
          where: { code, hospitalId },
        });
        basePrice = procedure?.price || 2000;
        description = `Medical Procedure - ${code}`;
        break;

      default:
        basePrice = 1000; // Default estimate
        description = `Service - ${type}`;
    }

    // Apply patient type multiplier
    const multiplier = this.getPatientTypeMultiplier(patientType);
    const adjustedPrice = basePrice * multiplier;

    return {
      type,
      code,
      description,
      quantity,
      unitPrice: adjustedPrice,
      amount: adjustedPrice * quantity,
    };
  }

  private getPatientTypeMultiplier(patientType: string): number {
    switch (patientType) {
      case 'GENERAL':
        return 1.0;
      case 'SEMI_PRIVATE':
        return 1.3;
      case 'PRIVATE':
        return 1.8;
      case 'VIP':
        return 2.5;
      case 'EMERGENCY':
        return 1.5;
      default:
        return 1.0;
    }
  }

  private calculateInsuranceDiscount(totalAmount: number, insuranceCoverage: any): number {
    const { coveragePercentage, maxCoverageAmount } = insuranceCoverage;

    const coverageAmount = Math.min(
      totalAmount * (coveragePercentage / 100),
      maxCoverageAmount || totalAmount,
    );

    return coverageAmount;
  }

  async getServicePricing(hospitalId: string) {
    return this.prisma.servicePricing.findMany({
      where: { hospitalId },
      orderBy: { category: 'asc' },
    });
  }

  async updateServicePricing(hospitalId: string, pricingData: any) {
    const { code, price, category } = pricingData;

    return this.prisma.servicePricing.upsert({
      where: {
        code_hospitalId: {
          code,
          hospitalId,
        },
      },
      update: { price, category },
      create: {
        code,
        price,
        category,
        hospitalId,
      },
    });
  }

  async getPackageEstimate(packageCode: string, patientType: string, hospitalId: string) {
    const packageData = await this.prisma.servicePackage.findUnique({
      where: { code: packageCode },
      include: { services: true },
    });

    if (!packageData) {
      throw new Error('Package not found');
    }

    const services = packageData.services.map(service => ({
      type: service.type,
      code: service.code,
      quantity: service.quantity,
    }));

    return this.estimatePrice({
      services,
      patientType,
      hospitalId,
    });
  }

  async getPopularPackages() {
    return this.prisma.servicePackage.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: {
        bookings: { _count: 'desc' },
      },
      take: 10,
    });
  }
}
