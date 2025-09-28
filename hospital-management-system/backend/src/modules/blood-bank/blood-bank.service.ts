import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BloodType, DonationType, DonationStatus, ScreeningResult } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import {
  CreateBloodDonationDto,
  UpdateBloodDonationDto,
  BloodDonationFilterDto,
  BloodInventoryDto,
  BloodRequestDto,
  BloodTransfusionDto,
} from './dto/blood-donation.dto';

@Injectable()
export class BloodBankService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  /**
   * Create a new blood donation
   */
  async createDonation(data: CreateBloodDonationDto) {
    // Validate donor exists
    const donor = await this.prisma.patient.findUnique({
      where: { id: data.donorId },
    });

    if (!donor) {
      throw new NotFoundException('Donor not found');
    }

    // Check if donor's blood type matches
    if (donor.bloodType !== data.bloodType) {
      throw new BadRequestException('Blood type mismatch with donor record');
    }

    // Check for recent donations (minimum 56 days between whole blood donations)
    if (data.donationType === DonationType.WHOLE_BLOOD) {
      const recentDonation = await this.prisma.bloodDonation.findFirst({
        where: {
          donorId: data.donorId,
          donationType: DonationType.WHOLE_BLOOD,
          donationDate: {
            gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), // 56 days ago
          },
        },
      });

      if (recentDonation) {
        throw new ConflictException(
          'Donor cannot donate whole blood within 56 days of last donation',
        );
      }
    }

    // Calculate expiry date based on donation type
    const expiryDate = this.calculateExpiryDate(data.donationType);

    const donation = await this.prisma.bloodDonation.create({
      data: {
        donorId: data.donorId,
        donationDate: new Date(),
        bloodType: data.bloodType,
        quantity: data.quantity,
        donationType: data.donationType,
        status: DonationStatus.COLLECTED,
        expiryDate,
        notes: data.notes,
      },
    });

    // Log compliance event
    await this.complianceService.logAuditEvent({
      userId: data.createdBy,
      action: 'BLOOD_DONATION_CREATED',
      resource: 'blood_donations',
      resourceId: donation.id,
      details: {
        donorId: data.donorId,
        bloodType: data.bloodType,
        donationType: data.donationType,
        quantity: data.quantity,
      },
      complianceFlags: ['PATIENT_DATA', 'BLOOD_BANK_SAFETY'],
    });

    return donation;
  }

  /**
   * Update blood donation status and screening results
   */
  async updateDonation(id: string, data: UpdateBloodDonationDto) {
    const donation = await this.prisma.bloodDonation.findUnique({
      where: { id },
    });

    if (!donation) {
      throw new NotFoundException('Blood donation not found');
    }

    // Business logic validations
    if (
      data.status === DonationStatus.RELEASED &&
      donation.screeningResult !== ScreeningResult.SAFE
    ) {
      throw new BadRequestException('Cannot release blood that failed screening');
    }

    if (data.status === DonationStatus.DISCARDED && donation.status === DonationStatus.RELEASED) {
      throw new BadRequestException('Cannot discard already released blood');
    }

    const updatedDonation = await this.prisma.bloodDonation.update({
      where: { id },
      data: {
        status: data.status,
        screeningResult: data.screeningResult,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        notes: data.notes,
      },
    });

    // Log compliance event
    await this.complianceService.logAuditEvent({
      userId: data.updatedBy,
      action: 'BLOOD_DONATION_UPDATED',
      resource: 'blood_donations',
      resourceId: id,
      details: {
        oldStatus: donation.status,
        newStatus: data.status,
        screeningResult: data.screeningResult,
      },
      complianceFlags: ['BLOOD_BANK_SAFETY', 'PATIENT_DATA'],
    });

    return updatedDonation;
  }

  /**
   * Get blood donations with filtering
   */
  async getDonations(filters: BloodDonationFilterDto, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.bloodType) where.bloodType = filters.bloodType;
    if (filters.status) where.status = filters.status;
    if (filters.donationType) where.donationType = filters.donationType;

    if (filters.startDate || filters.endDate) {
      where.donationDate = {};
      if (filters.startDate) where.donationDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.donationDate.lte = new Date(filters.endDate);
    }

    const [donations, total] = await Promise.all([
      this.prisma.bloodDonation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { donationDate: 'desc' },
      }),
      this.prisma.bloodDonation.count({ where }),
    ]);

    return {
      data: donations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get blood donation by ID
   */
  async getDonationById(id: string) {
    const donation = await this.prisma.bloodDonation.findUnique({
      where: { id },
    });

    if (!donation) {
      throw new NotFoundException('Blood donation not found');
    }

    return donation;
  }

  /**
   * Get blood inventory by blood type
   */
  async getBloodInventory(): Promise<BloodInventoryDto[]> {
    const inventory = await this.prisma.bloodDonation.groupBy({
      by: ['bloodType', 'status'],
      _count: { id: true },
      _sum: { quantity: true },
      where: {
        status: { in: [DonationStatus.RELEASED, DonationStatus.QUARANTINED] },
        expiryDate: { gt: new Date() },
      },
    });

    const bloodTypes = Object.values(BloodType);
    const inventoryMap = new Map<BloodType, BloodInventoryDto>();

    // Initialize all blood types
    bloodTypes.forEach(bloodType => {
      inventoryMap.set(bloodType, {
        bloodType,
        availableUnits: 0,
        totalVolume: 0,
        quarantinedUnits: 0,
        expiredUnits: 0,
      });
    });

    // Populate with actual data
    inventory.forEach(item => {
      const existing = inventoryMap.get(item.bloodType)!;
      const units = item._count.id;
      const volume = item._sum.quantity?.toNumber() || 0;

      if (item.status === DonationStatus.RELEASED) {
        existing.availableUnits = units;
        existing.totalVolume = volume;
      } else if (item.status === DonationStatus.QUARANTINED) {
        existing.quarantinedUnits = units;
      }
    });

    // Calculate expired units
    const expired = await this.prisma.bloodDonation.groupBy({
      by: ['bloodType'],
      _count: { id: true },
      where: {
        expiryDate: { lte: new Date() },
        status: DonationStatus.RELEASED,
      },
    });

    expired.forEach(item => {
      const existing = inventoryMap.get(item.bloodType)!;
      existing.expiredUnits = item._count.id;
    });

    return Array.from(inventoryMap.values());
  }

  /**
   * Check blood availability for a specific type
   */
  async checkBloodAvailability(bloodType: BloodType, unitsRequired: number): Promise<boolean> {
    const available = await this.prisma.bloodDonation.count({
      where: {
        bloodType,
        status: DonationStatus.RELEASED,
        expiryDate: { gt: new Date() },
      },
    });

    return available >= unitsRequired;
  }

  /**
   * Create blood request
   */
  async createBloodRequest(data: BloodRequestDto) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Check blood availability
    const isAvailable = await this.checkBloodAvailability(data.bloodType, data.unitsRequired);
    if (!isAvailable && data.urgency === 'EMERGENCY') {
      // For emergencies, still create request but flag as critical
      await this.triggerEmergencyBloodAlert(data);
    }

    // Store request (using a simple approach - could be a separate table)
    const request = {
      id: `blood-request-${Date.now()}`,
      ...data,
      status: isAvailable ? 'APPROVED' : 'PENDING',
      createdAt: new Date(),
    };

    // Log compliance event
    await this.complianceService.logAuditEvent({
      userId: data.requestedBy,
      action: 'BLOOD_REQUEST_CREATED',
      resource: 'blood_requests',
      resourceId: request.id,
      details: {
        patientId: data.patientId,
        bloodType: data.bloodType,
        unitsRequired: data.unitsRequired,
        urgency: data.urgency,
        available: isAvailable,
      },
      complianceFlags: ['PATIENT_DATA', 'BLOOD_BANK_SAFETY'],
    });

    return request;
  }

  /**
   * Record blood transfusion
   */
  async recordTransfusion(data: BloodTransfusionDto) {
    // Validate donation exists and is available
    const donation = await this.prisma.bloodDonation.findUnique({
      where: { id: data.donationId },
    });

    if (!donation) {
      throw new NotFoundException('Blood donation not found');
    }

    if (donation.status !== DonationStatus.RELEASED) {
      throw new BadRequestException('Blood unit is not available for transfusion');
    }

    if (donation.expiryDate && donation.expiryDate <= new Date()) {
      throw new BadRequestException('Blood unit has expired');
    }

    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Check blood type compatibility
    if (!this.isBloodCompatible(donation.bloodType, patient.bloodType)) {
      throw new BadRequestException('Blood type incompatible with patient');
    }

    // Update donation status if fully used
    const newQuantity = donation.quantity.toNumber() - data.volumeTransfused;
    const newStatus = newQuantity <= 0 ? DonationStatus.DISCARDED : DonationStatus.RELEASED;

    await this.prisma.bloodDonation.update({
      where: { id: data.donationId },
      data: {
        quantity: Math.max(0, newQuantity),
        status: newStatus,
        notes:
          `${donation.notes || ''}\nTransfused ${data.volumeTransfused}ml to patient ${data.patientId}`.trim(),
      },
    });

    // Log transfusion
    await this.complianceService.logAuditEvent({
      userId: data.performedBy,
      action: 'BLOOD_TRANSFUSION_RECORDED',
      resource: 'blood_transfusions',
      resourceId: `${data.donationId}-${data.patientId}-${Date.now()}`,
      details: {
        donationId: data.donationId,
        patientId: data.patientId,
        volumeTransfused: data.volumeTransfused,
        transfusionReaction: data.transfusionReaction,
      },
      complianceFlags: ['PATIENT_DATA', 'BLOOD_BANK_SAFETY', 'CRITICAL_PROCEDURE'],
    });

    return {
      donationId: data.donationId,
      patientId: data.patientId,
      volumeTransfused: data.volumeTransfused,
      transfusionReaction: data.transfusionReaction,
      performedBy: data.performedBy,
      performedAt: new Date(),
      notes: data.notes,
    };
  }

  /**
   * Get blood bank statistics
   */
  async getBloodBankStats() {
    const [totalDonations, activeDonations, expiredDonations, transfusionsToday] =
      await Promise.all([
        this.prisma.bloodDonation.count(),
        this.prisma.bloodDonation.count({
          where: {
            status: DonationStatus.RELEASED,
            expiryDate: { gt: new Date() },
          },
        }),
        this.prisma.bloodDonation.count({
          where: {
            expiryDate: { lte: new Date() },
            status: DonationStatus.RELEASED,
          },
        }),
        // This would need a transfusion log table in real implementation
        Promise.resolve(0), // Placeholder
      ]);

    return {
      totalDonations,
      activeUnits: activeDonations,
      expiredUnits: expiredDonations,
      transfusionsToday,
      bloodTypeDistribution: await this.getBloodTypeDistribution(),
    };
  }

  /**
   * Helper method to calculate expiry date based on donation type
   */
  private calculateExpiryDate(donationType: DonationType): Date {
    const now = new Date();
    switch (donationType) {
      case DonationType.WHOLE_BLOOD:
        return new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000); // 35 days
      case DonationType.PLATELETS:
        return new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days
      case DonationType.PLASMA:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      case DonationType.DOUBLE_RED_CELLS:
        return new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000); // 35 days
      default:
        return new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Check blood type compatibility
   */
  private isBloodCompatible(donorType: BloodType, recipientType: BloodType | null): boolean {
    if (!recipientType) return true; // Assume compatible if no recipient type known

    const compatibilityMatrix: Record<BloodType, BloodType[]> = {
      [BloodType.O_NEGATIVE]: [BloodType.O_NEGATIVE],
      [BloodType.O_POSITIVE]: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE],
      [BloodType.A_NEGATIVE]: [BloodType.O_NEGATIVE, BloodType.A_NEGATIVE],
      [BloodType.A_POSITIVE]: [
        BloodType.O_NEGATIVE,
        BloodType.O_POSITIVE,
        BloodType.A_NEGATIVE,
        BloodType.A_POSITIVE,
      ],
      [BloodType.B_NEGATIVE]: [BloodType.O_NEGATIVE, BloodType.B_NEGATIVE],
      [BloodType.B_POSITIVE]: [
        BloodType.O_NEGATIVE,
        BloodType.O_POSITIVE,
        BloodType.B_NEGATIVE,
        BloodType.B_POSITIVE,
      ],
      [BloodType.AB_NEGATIVE]: [
        BloodType.O_NEGATIVE,
        BloodType.A_NEGATIVE,
        BloodType.B_NEGATIVE,
        BloodType.AB_NEGATIVE,
      ],
      [BloodType.AB_POSITIVE]: Object.values(BloodType), // Universal recipient
    };

    return compatibilityMatrix[donorType]?.includes(recipientType) || false;
  }

  /**
   * Trigger emergency blood alert
   */
  private async triggerEmergencyBloodAlert(request: BloodRequestDto) {
    // In a real implementation, this would send notifications to blood bank staff
    await this.complianceService.logAuditEvent({
      userId: request.requestedBy,
      action: 'EMERGENCY_BLOOD_ALERT',
      resource: 'blood_requests',
      resourceId: `emergency-${Date.now()}`,
      details: {
        patientId: request.patientId,
        bloodType: request.bloodType,
        unitsRequired: request.unitsRequired,
        urgency: request.urgency,
      },
      complianceFlags: ['CRITICAL_PATIENT_DATA', 'EMERGENCY_RESPONSE'],
    });
  }

  /**
   * Get blood type distribution
   */
  private async getBloodTypeDistribution() {
    const distribution = await this.prisma.bloodDonation.groupBy({
      by: ['bloodType'],
      _count: { id: true },
      where: {
        status: DonationStatus.RELEASED,
        expiryDate: { gt: new Date() },
      },
    });

    return distribution.reduce(
      (acc, item) => {
        acc[item.bloodType] = item._count.id;
        return acc;
      },
      {} as Record<BloodType, number>,
    );
  }
}
