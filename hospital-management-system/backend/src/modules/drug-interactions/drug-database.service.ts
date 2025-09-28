import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class DrugDatabaseService {
  private readonly logger = new Logger(DrugDatabaseService.name);

  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Get drug database by ID
   */
  async getDrugDatabase(databaseId: string) {
    const database = await this.prisma.drugDatabase.findUnique({
      where: { id: databaseId },
    });

    if (!database) {
      throw new NotFoundException('Drug database not found');
    }

    return database;
  }

  /**
   * Get all drug databases
   */
  async getDrugDatabases(filters?: { provider?: string; isActive?: boolean }) {
    const where: any = {};

    if (filters?.provider) {
      where.provider = filters.provider;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.drugDatabase.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create drug database
   */
  async createDrugDatabase(data: {
    name: string;
    provider: string;
    baseUrl: string;
    apiKey?: string;
    configuration?: any;
  }) {
    return this.prisma.drugDatabase.create({
      data: {
        name: data.name,
        provider: data.provider,
        baseUrl: data.baseUrl,
        apiKey: data.apiKey,
        configuration: data.configuration,
      },
    });
  }

  /**
   * Update drug database
   */
  async updateDrugDatabase(
    databaseId: string,
    data: Partial<{
      name: string;
      provider: string;
      baseUrl: string;
      apiKey: string;
      isActive: boolean;
      configuration: any;
    }>,
  ) {
    const database = await this.getDrugDatabase(databaseId);

    return this.prisma.drugDatabase.update({
      where: { id: databaseId },
      data,
    });
  }

  /**
   * Delete drug database
   */
  async deleteDrugDatabase(databaseId: string) {
    const database = await this.getDrugDatabase(databaseId);

    return this.prisma.drugDatabase.delete({
      where: { id: databaseId },
    });
  }

  /**
   * Test connection to drug database
   */
  async testDatabaseConnection(databaseId: string): Promise<boolean> {
    try {
      const database = await this.getDrugDatabase(databaseId);

      // In a real implementation, you would make an API call to test the connection
      return await this.simulateDatabaseConnectionTest(database);
    } catch (error) {
      this.logger.error(`Database connection test failed for ${databaseId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Sync drug interactions from external database
   */
  async syncFromDatabase(database: any): Promise<any> {
    try {
      this.logger.log(`Syncing drug interactions from ${database.name}`);

      // In a real implementation, you would fetch data from the external API
      const externalInteractions = await this.simulateFetchInteractions(database);

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const extInteraction of externalInteractions) {
        try {
          // Find existing medications
          const drug1 = await this.prisma.medication.findFirst({
            where: {
              OR: [
                { name: { contains: extInteraction.drug1Name, mode: 'insensitive' } },
                { genericName: { contains: extInteraction.drug1Name, mode: 'insensitive' } },
              ],
            },
          });

          const drug2 = await this.prisma.medication.findFirst({
            where: {
              OR: [
                { name: { contains: extInteraction.drug2Name, mode: 'insensitive' } },
                { genericName: { contains: extInteraction.drug2Name, mode: 'insensitive' } },
              ],
            },
          });

          if (!drug1 || !drug2) {
            skipped++;
            continue;
          }

          // Check if interaction already exists
          const existingInteraction = await this.prisma.drugInteraction.findFirst({
            where: {
              OR: [
                { drug1Id: drug1.id, drug2Id: drug2.id },
                { drug1Id: drug2.id, drug2Id: drug1.id },
              ],
            },
          });

          if (existingInteraction) {
            // Update existing interaction
            await this.prisma.drugInteraction.update({
              where: { id: existingInteraction.id },
              data: {
                interactionType: extInteraction.type,
                severity: extInteraction.severity,
                description: extInteraction.description,
                clinicalEffects: extInteraction.clinicalEffects,
                management: extInteraction.management,
                source: database.provider,
                lastUpdated: new Date(),
              },
            });
            updated++;
          } else {
            // Create new interaction
            await this.prisma.drugInteraction.create({
              data: {
                drug1Id: drug1.id,
                drug2Id: drug2.id,
                interactionType: extInteraction.type,
                severity: extInteraction.severity,
                description: extInteraction.description,
                clinicalEffects: extInteraction.clinicalEffects,
                management: extInteraction.management,
                source: database.provider,
              },
            });
            created++;
          }
        } catch (error) {
          this.logger.warn(`Failed to process interaction: ${error.message}`);
          skipped++;
        }
      }

      return {
        databaseId: database.id,
        databaseName: database.name,
        totalProcessed: externalInteractions.length,
        created,
        updated,
        skipped,
        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to sync from database ${database.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Search drug information from external databases
   */
  async searchDrugInfo(drugName: string, databaseId?: string): Promise<any[]> {
    try {
      let databases: any[];

      if (databaseId) {
        const database = await this.getDrugDatabase(databaseId);
        databases = [database];
      } else {
        databases = await this.prisma.drugDatabase.findMany({
          where: { isActive: true },
        });
      }

      const results = [];

      for (const database of databases) {
        try {
          const drugInfo = await this.simulateSearchDrugInfo(database, drugName);
          if (drugInfo) {
            results.push({
              database: database.name,
              provider: database.provider,
              drugInfo,
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to search ${database.name}: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to search drug info for ${drugName}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get drug interaction from external database
   */
  async getDrugInteractionFromExternal(
    drug1Name: string,
    drug2Name: string,
    databaseId?: string,
  ): Promise<any[]> {
    try {
      let databases: any[];

      if (databaseId) {
        const database = await this.getDrugDatabase(databaseId);
        databases = [database];
      } else {
        databases = await this.prisma.drugDatabase.findMany({
          where: { isActive: true },
        });
      }

      const results = [];

      for (const database of databases) {
        try {
          const interactions = await this.simulateGetInteractions(database, drug1Name, drug2Name);
          results.push({
            database: database.name,
            provider: database.provider,
            interactions,
          });
        } catch (error) {
          this.logger.warn(`Failed to get interactions from ${database.name}: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to get drug interactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get database sync status
   */
  async getDatabaseSyncStatus(databaseId: string) {
    const database = await this.getDrugDatabase(databaseId);
    return {
      databaseId,
      databaseName: database.name,
      lastSync: database.lastSync,
      syncStatus: database.syncStatus,
      errorMessage: null, // No errorMessage field in schema
    };
  }

  /**
   * Simulate database connection test
   */
  private async simulateDatabaseConnectionTest(database: any): Promise<boolean> {
    this.logger.log(`Simulating connection test for ${database.name}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate successful connection (95% success rate)
    return Math.random() > 0.05;
  }

  /**
   * Simulate fetching interactions from external database
   */
  private async simulateFetchInteractions(database: any): Promise<any[]> {
    this.logger.log(`Simulating fetch interactions from ${database.name}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock interaction data
    return [
      {
        drug1Name: 'Warfarin',
        drug2Name: 'Aspirin',
        type: 'MAJOR',
        severity: 'MODERATE',
        description: 'Increased risk of bleeding',
        clinicalEffects: 'Enhanced anticoagulant effect',
        management: 'Monitor INR closely, consider dose adjustment',
      },
      {
        drug1Name: 'Simvastatin',
        drug2Name: 'Amiodarone',
        type: 'MAJOR',
        severity: 'MODERATE',
        description: 'Increased risk of myopathy and rhabdomyolysis',
        clinicalEffects: 'Muscle toxicity',
        management: 'Reduce simvastatin dose, monitor CK levels',
      },
      {
        drug1Name: 'Digoxin',
        drug2Name: 'Amiodarone',
        type: 'MAJOR',
        severity: 'MODERATE',
        description: 'Increased digoxin levels',
        clinicalEffects: 'Digoxin toxicity',
        management: 'Reduce digoxin dose, monitor levels',
      },
    ];
  }

  /**
   * Simulate searching drug information
   */
  private async simulateSearchDrugInfo(database: any, drugName: string): Promise<any> {
    this.logger.log(`Simulating drug search for ${drugName} in ${database.name}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return mock drug information
    return {
      name: drugName,
      genericName: drugName.toLowerCase(),
      drugClass: 'Cardiovascular',
      indications: ['Hypertension', 'Heart Failure'],
      contraindications: ['Hypersensitivity'],
      sideEffects: ['Dizziness', 'Headache', 'Fatigue'],
      interactions: ['May interact with NSAIDs', 'Caution with diuretics'],
    };
  }

  /**
   * Simulate getting drug interactions
   */
  private async simulateGetInteractions(
    database: any,
    drug1Name: string,
    drug2Name: string,
  ): Promise<any[]> {
    this.logger.log(
      `Simulating interaction lookup for ${drug1Name} + ${drug2Name} in ${database.name}`,
    );

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    // Return mock interaction data
    return [
      {
        drug1: drug1Name,
        drug2: drug2Name,
        severity: 'MODERATE',
        description: 'Potential interaction detected',
        recommendation: 'Monitor patient closely',
        source: database.provider,
      },
    ];
  }
}
