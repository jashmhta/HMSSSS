/*[object Object]*/
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class PriceEstimatorService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   *
   */
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

  /**
   *
   */
  private async calculateServiceEstimate(service: any, patientType: string, hospitalId: string) {
    const { type, code, quantity = 1, duration } = service;

    let basePrice = 0;
    let description = '';

    switch (type) {
      case 'OPD_CONSULTATION':
        const consultation = await this.prisma.servicePricing.findFirst({
          where: { serviceCode: 'OPD_CONSULTATION' },
        });
        basePrice = consultation?.basePrice?.toNumber() || 500;
        description = 'OPD Consultation';
        break;

      case 'LAB_TEST':
        const labTest = await this.prisma.servicePricing.findFirst({
          where: { serviceCode: code },
        });
        basePrice = labTest?.basePrice?.toNumber() || 300;
        description = `Laboratory Test - ${code}`;
        break;

      case 'RADIOLOGY':
        const radiology = await this.prisma.servicePricing.findFirst({
          where: { serviceCode: code },
        });
        basePrice = radiology?.basePrice?.toNumber() || 1500;
        description = `Radiology - ${code}`;
        break;

      case 'SURGERY':
        const surgery = await this.prisma.servicePricing.findFirst({
          where: { serviceCode: code },
        });
        basePrice = surgery?.basePrice?.toNumber() || 50000;
        description = `Surgical Procedure - ${code}`;
        break;

      case 'ROOM_CHARGES':
        const roomRate = await this.prisma.servicePricing.findFirst({
          where: { serviceCode: `ROOM_${patientType}` },
        });
        basePrice = roomRate?.basePrice?.toNumber() || (patientType === 'PRIVATE' ? 5000 : 2000);
        if (duration) {
          basePrice *= duration; // per day
        }
        description = `${patientType} Room Charges${duration ? ` (${duration} days)` : ''}`;
        break;

      case 'MEDICINE':
        const medicine = await this.prisma.medicine.findFirst({
          where: { id: code },
        });
        basePrice = medicine?.unitPrice?.toNumber() || 100;
        description = `Medicine - ${medicine?.name || code}`;
        break;

      case 'PROCEDURE':
        const procedure = await this.prisma.servicePricing.findFirst({
          where: { serviceCode: code },
        });
        basePrice = procedure?.basePrice?.toNumber() || 2000;
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

  /**
   *
   */
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

  /**
   *
   */
  private calculateInsuranceDiscount(totalAmount: number, insuranceCoverage: any): number {
    const { coveragePercentage, maxCoverageAmount } = insuranceCoverage;

    return Math.min(totalAmount * (coveragePercentage / 100), maxCoverageAmount || totalAmount);
  }

  /**
   *
   */
  async getServicePricing() {
    return this.prisma.servicePricing.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
    });
  }

  /**
   *
   */
  async updateServicePricing(pricingData: any) {
    const { serviceCode, basePrice, category, serviceType, serviceName } = pricingData;

    return this.prisma.servicePricing.upsert({
      where: { serviceCode },
      update: { basePrice, category, serviceType, serviceName },
      create: {
        serviceCode,
        basePrice,
        category,
        serviceType,
        serviceName,
      },
    });
  }

  /**
   *
   */
  async getPackageEstimate(packageCode: string, patientType: string) {
    const packageData = await this.prisma.servicePackage.findUnique({
      where: { packageCode },
    });

    if (!packageData) {
      throw new Error('Package not found');
    }

    const services = JSON.parse(packageData.services.toString()).map(service => ({
      type: service.type,
      code: service.code,
      quantity: service.quantity,
    }));

    return this.estimatePrice({
      services,
      patientType,
    });
  }

  /**
   *
   */
  async getPopularPackages() {
    return this.prisma.servicePackage.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      take: 10,
    });
  }
}
