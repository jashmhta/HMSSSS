import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InteractionType, InteractionSeverity } from '@prisma/client';

import { DrugInteractionsService } from './drug-interactions.service';
import { DrugDatabaseService } from './drug-database.service';

/**
 *
 */
@Controller('drug-interactions')
export class DrugInteractionsController {
  /**
   *
   */
  constructor(
    private readonly drugInteractionsService: DrugInteractionsService,
    private readonly drugDatabaseService: DrugDatabaseService,
  ) {}

  /**
   * Check interactions for a prescription
   */
  @Post('check/prescription/:prescriptionId')
  async checkInteractionsForPrescription(@Param('prescriptionId') prescriptionId: string) {
    return this.drugInteractionsService.checkInteractionsForPrescription(prescriptionId);
  }

  /**
   * Check interactions for medication list
   */
  @Post('check/medications')
  async checkInteractionsForMedications(@Body() body: { medicationIds: string[] }) {
    return this.drugInteractionsService.checkInteractionsForMedications(body.medicationIds);
  }

  /**
   * Get drug interaction by ID
   */
  @Get('interactions/:interactionId')
  async getDrugInteraction(@Param('interactionId') interactionId: string) {
    return this.drugInteractionsService.getDrugInteraction(interactionId);
  }

  /**
   * Get all drug interactions
   */
  @Get('interactions')
  async getDrugInteractions(
    @Query()
    query: {
      drug1Id?: string;
      drug2Id?: string;
      severity?: string;
      interactionType?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return this.drugInteractionsService.getDrugInteractions(query);
  }

  /**
   * Create drug interaction
   */
  @Post('interactions')
  async createDrugInteraction(
    @Body()
    body: {
      drug1Id: string;
      drug2Id: string;
      interactionType: string;
      severity: string;
      description: string;
      clinicalEffects?: string;
      management?: string;
      source?: string;
    },
  ) {
    return this.drugInteractionsService.createDrugInteraction(body);
  }

  /**
   * Update drug interaction
   */
  @Put('interactions/:interactionId')
  async updateDrugInteraction(
    @Param('interactionId') interactionId: string,
    @Body()
    body: Partial<{
      interactionType: InteractionType;
      severity: InteractionSeverity;
      description: string;
      clinicalEffects: string;
      management: string;
      source: string;
    }>,
  ) {
    return this.drugInteractionsService.updateDrugInteraction(interactionId, body);
  }

  /**
   * Delete drug interaction
   */
  @Delete('interactions/:interactionId')
  async deleteDrugInteraction(@Param('interactionId') interactionId: string) {
    return this.drugInteractionsService.deleteDrugInteraction(interactionId);
  }

  /**
   * Get patient interaction check history
   */
  @Get('patients/:patientId/checks')
  async getPatientInteractionChecks(
    @Param('patientId') patientId: string,
    @Query()
    query: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    return this.drugInteractionsService.getPatientInteractionChecks(patientId, query);
  }

  /**
   * Sync drug interactions from external database
   */
  @Post('sync/database/:databaseId')
  async syncDrugInteractionsFromDatabase(@Param('databaseId') databaseId: string) {
    return this.drugInteractionsService.syncDrugInteractionsFromDatabase(databaseId);
  }

  /**
   * Get drug interaction statistics
   */
  @Get('statistics')
  async getInteractionStatistics() {
    return this.drugInteractionsService.getInteractionStatistics();
  }

  /**
   * Get drug databases
   */
  @Get('databases')
  async getDrugDatabases(@Query() query: { provider?: string; isActive?: boolean }) {
    const isActive = query.isActive !== undefined ? query.isActive === true : undefined;
    return this.drugDatabaseService.getDrugDatabases({
      provider: query.provider,
      isActive,
    });
  }

  /**
   * Create drug database
   */
  @Post('databases')
  async createDrugDatabase(
    @Body()
    body: {
      name: string;
      provider: string;
      baseUrl: string;
      apiKey?: string;
      configuration?: any;
    },
  ) {
    return this.drugDatabaseService.createDrugDatabase(body);
  }

  /**
   * Update drug database
   */
  @Put('databases/:databaseId')
  async updateDrugDatabase(
    @Param('databaseId') databaseId: string,
    @Body()
    body: Partial<{
      name: string;
      provider: string;
      baseUrl: string;
      apiKey: string;
      isActive: boolean;
      configuration: any;
    }>,
  ) {
    return this.drugDatabaseService.updateDrugDatabase(databaseId, body);
  }

  /**
   * Delete drug database
   */
  @Delete('databases/:databaseId')
  async deleteDrugDatabase(@Param('databaseId') databaseId: string) {
    return this.drugDatabaseService.deleteDrugDatabase(databaseId);
  }

  /**
   * Test database connection
   */
  @Post('databases/:databaseId/test')
  async testDatabaseConnection(@Param('databaseId') databaseId: string) {
    const success = await this.drugDatabaseService.testDatabaseConnection(databaseId);
    return { databaseId, connectionTest: success ? 'SUCCESS' : 'FAILED' };
  }

  /**
   * Search drug information
   */
  @Get('search/drug')
  async searchDrugInfo(@Query('name') drugName: string, @Query('databaseId') databaseId?: string) {
    return this.drugDatabaseService.searchDrugInfo(drugName, databaseId);
  }

  /**
   * Get drug interaction from external database
   */
  @Get('search/interaction')
  async getDrugInteractionFromExternal(
    @Query('drug1') drug1Name: string,
    @Query('drug2') drug2Name: string,
    @Query('databaseId') databaseId?: string,
  ) {
    return this.drugDatabaseService.getDrugInteractionFromExternal(
      drug1Name,
      drug2Name,
      databaseId,
    );
  }

  /**
   * Get database sync status
   */
  @Get('databases/:databaseId/sync-status')
  async getDatabaseSyncStatus(@Param('databaseId') databaseId: string) {
    return this.drugDatabaseService.getDatabaseSyncStatus(databaseId);
  }
}
