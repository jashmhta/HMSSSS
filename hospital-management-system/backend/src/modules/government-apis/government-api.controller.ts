import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { GovernmentAPIService } from './government-api.service';

@Controller('government-apis')
export class GovernmentAPIController {
  private readonly logger = new Logger(GovernmentAPIController.name);

  constructor(private readonly governmentAPIService: GovernmentAPIService) {}

  @Get('cms/patient/:patientId')
  async getPatientDataFromCMS(
    @Param('patientId') patientId: string,
    @Query('beneficiaryId') beneficiaryId?: string,
  ) {
    this.logger.log(`Fetching patient data from CMS for patient ${patientId}`);
    return this.governmentAPIService.getPatientDataFromCMS(patientId, beneficiaryId);
  }

  @Get('cms/coverage/:patientId')
  async getCoverageFromCMS(@Param('patientId') patientId: string) {
    this.logger.log(`Fetching coverage data from CMS for patient ${patientId}`);
    return this.governmentAPIService.getCoverageFromCMS(patientId);
  }

  @Get('fda/drug')
  async getDrugInfoFromFDA(@Query('name') drugName: string) {
    this.logger.log(`Fetching drug info from FDA for ${drugName}`);
    return this.governmentAPIService.getDrugInfoFromFDA(drugName);
  }

  @Get('fda/adverse-events')
  async getAdverseEventsFromFDA(@Query('drug') drugName: string, @Query('limit') limit?: number) {
    this.logger.log(`Fetching adverse events from FDA for ${drugName}`);
    return this.governmentAPIService.getAdverseEventsFromFDA(drugName, limit);
  }

  @Get('cdc/health-stats')
  async getHealthStatsFromCDC(@Query() query: any) {
    this.logger.log('Fetching health statistics from CDC');
    return this.governmentAPIService.getHealthStatsFromCDC(query);
  }

  @Get('nih/clinical-trials')
  async searchClinicalTrials(
    @Query('condition') condition: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(`Searching clinical trials for condition: ${condition}`);
    return this.governmentAPIService.searchClinicalTrials(condition, limit);
  }

  @Get('synthea/patients')
  async getSyntheticPatientData(@Query('count') count?: number) {
    this.logger.log(`Generating ${count || 1} synthetic patients`);
    return this.governmentAPIService.getSyntheticPatientData(count);
  }

  @Get('health')
  async getAPIHealthStatus() {
    this.logger.log('Checking government API health status');
    return this.governmentAPIService.getAPIHealthStatus();
  }

  @Get('compliance')
  async validateAPICompliance() {
    this.logger.log('Validating government API compliance');
    return this.governmentAPIService.validateAPICompliance();
  }
}
