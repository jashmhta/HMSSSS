import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CheckStatus, InteractionType, InteractionSeverity } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { DrugDatabaseService } from './drug-database.service';
import { InteractionCheckerService } from './interaction-checker.service';

/**
 *
 */
@Injectable()
export class DrugInteractionsService {
  private readonly logger = new Logger(DrugInteractionsService.name);

  /**
   *
   */
  constructor(
    private prisma: PrismaService,
    private drugDatabaseService: DrugDatabaseService,
    private interactionCheckerService: InteractionCheckerService,
  ) {}

  /**
   * Check drug interactions for a prescription
   */
  async checkInteractionsForPrescription(prescriptionId: string): Promise<any> {
    try {
      // Get prescription with medication details
      const prescription = await this.prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
          patient: {
            include: {
              prescriptions: {
                where: {
                  status: { in: ['ACTIVE', 'COMPLETED'] },
                  id: { not: prescriptionId }, // Exclude current prescription
                },
                include: {
                  medication: true,
                },
                orderBy: { prescribedDate: 'desc' },
                take: 10, // Check last 10 prescriptions
              },
            },
          },
          medication: true,
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

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      // Get patient's current medications
      const currentMedications = prescription.patient.currentMedications || [];

      // Collect all medications to check
      const medicationsToCheck = [
        prescription.medication,
        ...prescription.patient.prescriptions.map(p => p.medication),
        // In a real implementation, you would also include medications from currentMedications
      ];

      // Remove duplicates
      const uniqueMedications = medicationsToCheck.filter(
        (med, index, self) => index === self.findIndex(m => m.id === med.id),
      );

      // Check for interactions
      const interactions =
        await this.interactionCheckerService.checkInteractions(uniqueMedications);

      // Create interaction check record
      const interactionCheck = await this.prisma.interactionCheck.create({
        data: {
          prescriptionId,
          patientId: prescription.patientId,
          medications: uniqueMedications.map(m => m.id),
          interactions,
          checkedBy: prescription.doctor.user.firstName + ' ' + prescription.doctor.user.lastName,
          status: this.determineCheckStatus(interactions),
          warnings: interactions.filter(i => i.severity === 'MODERATE').map(i => i.description),
          criticalAlerts: interactions
            .filter(i => i.severity === 'SEVERE' || i.severity === 'CONTRAINDICATED')
            .map(i => i.description),
        },
      });

      return {
        prescriptionId,
        patientId: prescription.patientId,
        medications: uniqueMedications,
        interactions,
        status: interactionCheck.status,
        warnings: interactionCheck.warnings,
        criticalAlerts: interactionCheck.criticalAlerts,
        checkedAt: interactionCheck.checkedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check interactions for prescription ${prescriptionId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check interactions for medication list
   */
  async checkInteractionsForMedications(medicationIds: string[]): Promise<any> {
    try {
      // Get medication details
      const medications = await this.prisma.medication.findMany({
        where: {
          id: { in: medicationIds },
          isActive: true,
        },
      });

      if (medications.length !== medicationIds.length) {
        const foundIds = medications.map(m => m.id);
        const missingIds = medicationIds.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Medications not found: ${missingIds.join(', ')}`);
      }

      // Check for interactions
      const interactions = await this.interactionCheckerService.checkInteractions(medications);

      return {
        medications,
        interactions,
        status: this.determineCheckStatus(interactions),
        warnings: interactions.filter(i => i.severity === 'MODERATE').map(i => i.description),
        criticalAlerts: interactions
          .filter(i => i.severity === 'SEVERE' || i.severity === 'CONTRAINDICATED')
          .map(i => i.description),
        checkedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to check interactions for medications: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get drug interaction by ID
   */
  async getDrugInteraction(interactionId: string) {
    const interaction = await this.prisma.drugInteraction.findUnique({
      where: { id: interactionId },
      include: {
        drug1: true,
        drug2: true,
      },
    });

    if (!interaction) {
      throw new NotFoundException('Drug interaction not found');
    }

    return interaction;
  }

  /**
   * Get all drug interactions
   */
  async getDrugInteractions(filters?: {
    drug1Id?: string;
    drug2Id?: string;
    severity?: string;
    interactionType?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, ...whereFilters } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (whereFilters.drug1Id) {
      where.drug1Id = whereFilters.drug1Id;
    }

    if (whereFilters.drug2Id) {
      where.drug2Id = whereFilters.drug2Id;
    }

    if (whereFilters.severity) {
      where.severity = whereFilters.severity;
    }

    if (whereFilters.interactionType) {
      where.interactionType = whereFilters.interactionType;
    }

    const [interactions, total] = await Promise.all([
      this.prisma.drugInteraction.findMany({
        where,
        include: {
          drug1: true,
          drug2: true,
        },
        skip,
        take: limit,
        orderBy: { severity: 'desc' },
      }),
      this.prisma.drugInteraction.count({ where }),
    ]);

    return {
      data: interactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create drug interaction
   */
  async createDrugInteraction(data: {
    drug1Id: string;
    drug2Id: string;
    interactionType: string;
    severity: string;
    description: string;
    clinicalEffects?: string;
    management?: string;
    source?: string;
  }) {
    // Validate that drugs exist
    const [drug1, drug2] = await Promise.all([
      this.prisma.medication.findUnique({ where: { id: data.drug1Id } }),
      this.prisma.medication.findUnique({ where: { id: data.drug2Id } }),
    ]);

    if (!drug1 || !drug2) {
      throw new NotFoundException('One or both medications not found');
    }

    // Check if interaction already exists (in either direction)
    const existingInteraction = await this.prisma.drugInteraction.findFirst({
      where: {
        OR: [
          { drug1Id: data.drug1Id, drug2Id: data.drug2Id },
          { drug1Id: data.drug2Id, drug2Id: data.drug1Id },
        ],
      },
    });

    if (existingInteraction) {
      throw new BadRequestException('Interaction between these drugs already exists');
    }

    return this.prisma.drugInteraction.create({
      data: {
        drug1Id: data.drug1Id,
        drug2Id: data.drug2Id,
        interactionType: data.interactionType as any,
        severity: data.severity as any,
        description: data.description,
        clinicalEffects: data.clinicalEffects,
        management: data.management,
        source: data.source || 'MANUAL',
      },
      include: {
        drug1: true,
        drug2: true,
      },
    });
  }

  /**
   * Update drug interaction
   */
  async updateDrugInteraction(
    interactionId: string,
    data: Partial<{
      interactionType: InteractionType;
      severity: InteractionSeverity;
      description: string;
      clinicalEffects: string;
      management: string;
      source: string;
    }>,
  ) {
    const interaction = await this.getDrugInteraction(interactionId);

    return this.prisma.drugInteraction.update({
      where: { id: interactionId },
      data,
      include: {
        drug1: true,
        drug2: true,
      },
    });
  }

  /**
   * Delete drug interaction
   */
  async deleteDrugInteraction(interactionId: string) {
    const interaction = await this.getDrugInteraction(interactionId);

    return this.prisma.drugInteraction.delete({
      where: { id: interactionId },
    });
  }

  /**
   * Get interaction check history for patient
   */
  async getPatientInteractionChecks(
    patientId: string,
    filters?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const { page = 1, limit = 10, ...whereFilters } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = { patientId };

    if (whereFilters.status) {
      where.status = whereFilters.status;
    }

    if (whereFilters.dateFrom || whereFilters.dateTo) {
      where.checkedAt = {};
      if (whereFilters.dateFrom) {
        where.checkedAt.gte = whereFilters.dateFrom;
      }
      if (whereFilters.dateTo) {
        where.checkedAt.lte = whereFilters.dateTo;
      }
    }

    const [checks, total] = await Promise.all([
      this.prisma.interactionCheck.findMany({
        where,
        include: {
          prescription: {
            include: {
              medication: true,
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
          },
        },
        skip,
        take: limit,
        orderBy: { checkedAt: 'desc' },
      }),
      this.prisma.interactionCheck.count({ where }),
    ]);

    return {
      data: checks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Sync drug interactions from external database
   */
  async syncDrugInteractionsFromDatabase(databaseId: string): Promise<any> {
    try {
      const database = await this.prisma.drugDatabase.findUnique({
        where: { id: databaseId },
      });

      if (!database) {
        throw new NotFoundException('Drug database not found');
      }

      // Update sync status
      await this.prisma.drugDatabase.update({
        where: { id: databaseId },
        data: { syncStatus: 'SYNCING' },
      });

      // Sync interactions from external database
      const syncResult = await this.drugDatabaseService.syncFromDatabase(database);

      // Update sync status
      await this.prisma.drugDatabase.update({
        where: { id: databaseId },
        data: {
          syncStatus: 'SUCCESS',
          lastSync: new Date(),
        },
      });

      return syncResult;
    } catch (error) {
      this.logger.error(
        `Failed to sync drug interactions from database ${databaseId}: ${error.message}`,
        error.stack,
      );

      // Update sync status
      await this.prisma.drugDatabase.update({
        where: { id: databaseId },
        data: {
          syncStatus: 'FAILED',
          lastSync: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Get drug interaction statistics
   */
  async getInteractionStatistics() {
    const [totalInteractions, interactionsBySeverity, interactionsByType, recentChecks] =
      await Promise.all([
        this.prisma.drugInteraction.count(),
        this.prisma.drugInteraction.groupBy({
          by: ['severity'],
          _count: {
            id: true,
          },
        }),
        this.prisma.drugInteraction.groupBy({
          by: ['interactionType'],
          _count: {
            id: true,
          },
        }),
        this.prisma.interactionCheck.findMany({
          where: {
            checkedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          select: {
            status: true,
          },
        }),
      ]);

    const severityStats = interactionsBySeverity.map(item => ({
      severity: item.severity,
      count: item._count.id,
    }));

    const typeStats = interactionsByType.map(item => ({
      type: item.interactionType,
      count: item._count.id,
    }));

    const checkStats = {
      total: recentChecks.length,
      passed: recentChecks.filter(c => c.status === 'PASSED').length,
      warnings: recentChecks.filter(c => c.status === 'WARNINGS').length,
      critical: recentChecks.filter(c => c.status === 'CRITICAL').length,
    };

    return {
      totalInteractions,
      interactionsBySeverity: severityStats,
      interactionsByType: typeStats,
      recentChecks: checkStats,
    };
  }

  /**
   * Determine check status based on interactions
   */
  private determineCheckStatus(interactions: any[]): CheckStatus {
    if (interactions.some(i => i.severity === 'CONTRAINDICATED')) {
      return 'CRITICAL';
    }

    if (interactions.some(i => i.severity === 'SEVERE')) {
      return 'CRITICAL';
    }

    if (interactions.some(i => i.severity === 'MODERATE')) {
      return 'WARNINGS';
    }

    return 'PASSED';
  }
}
