import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';

import { FhirHl7Service } from './fhir-hl7.service';
import { FhirService } from './fhir.service';
import { ExternalSystemsService } from './external-systems.service';

/**
 *
 */
@Controller('fhir-hl7')
export class FhirHl7Controller {
  private readonly logger = new Logger(FhirHl7Controller.name);

  /**
   *
   */
  constructor(
    private readonly fhirHl7Service: FhirHl7Service,
    private readonly fhirService: FhirService,
    private readonly externalSystemsService: ExternalSystemsService,
  ) {}

  /**
   * Process incoming HL7 message
   */
  @Post('hl7/process')
  async processHL7Message(@Body() body: { message: string; sourceSystem?: string }) {
    this.logger.log(`Processing HL7 message from ${body.sourceSystem || 'unknown source'}`);
    return this.fhirHl7Service.processHL7Message(body.message, body.sourceSystem);
  }

  /**
   * Generate HL7 message
   */
  @Post('hl7/generate')
  async generateHL7Message(
    @Body() body: { messageType: string; patientId: string; data: any; destinationSystem?: string },
  ) {
    return this.fhirHl7Service.generateHL7Message(
      body.messageType,
      body.patientId,
      body.data,
      body.destinationSystem,
    );
  }

  /**
   * Sync patient data to FHIR server
   */
  @Post('sync/patient/:patientId')
  async syncPatientToFHIR(
    @Param('patientId') patientId: string,
    @Body() body: { externalSystemId: string },
  ) {
    return this.fhirHl7Service.syncPatientToFHIR(patientId, body.externalSystemId);
  }

  /**
   * FHIR Capability Statement
   */
  @Get('fhir/metadata')
  async getCapabilityStatement() {
    return {
      resourceType: 'CapabilityStatement',
      status: 'active',
      date: new Date().toISOString(),
      publisher: 'Ultimate HMS',
      kind: 'instance',
      software: {
        name: 'HMS FHIR Server',
        version: '1.0.0',
      },
      implementation: {
        description: 'HL7 FHIR Server for Hospital Management System',
      },
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [
        {
          mode: 'server',
          resource: [
            {
              type: 'Patient',
              interaction: [
                { code: 'read' },
                { code: 'search-type' },
                { code: 'create' },
                { code: 'update' },
              ],
              searchParam: [
                { name: '_id', type: 'token' },
                { name: 'identifier', type: 'token' },
                { name: 'name', type: 'string' },
                { name: 'birthdate', type: 'date' },
              ],
            },
            {
              type: 'Observation',
              interaction: [
                { code: 'read' },
                { code: 'search-type' },
                { code: 'create' },
                { code: 'update' },
              ],
            },
            {
              type: 'Encounter',
              interaction: [
                { code: 'read' },
                { code: 'search-type' },
                { code: 'create' },
                { code: 'update' },
              ],
            },
            {
              type: 'MedicationRequest',
              interaction: [
                { code: 'read' },
                { code: 'search-type' },
                { code: 'create' },
                { code: 'update' },
              ],
            },
          ],
        },
      ],
    };
  }

  /**
   * FHIR Patient search
   */
  @Get('fhir/Patient')
  async searchPatients(@Query() query: any) {
    return this.fhirHl7Service.searchFHIRResources('Patient', query);
  }

  /**
   * FHIR Patient read
   */
  @Get('fhir/Patient/:id')
  async getPatient(@Param('id') id: string) {
    return this.fhirHl7Service.getFHIRResource('Patient', id);
  }

  /**
   * FHIR Observation search
   */
  @Get('fhir/Observation')
  async searchObservations(@Query() query: any) {
    return this.fhirHl7Service.searchFHIRResources('Observation', query);
  }

  /**
   * FHIR Encounter search
   */
  @Get('fhir/Encounter')
  async searchEncounters(@Query() query: any) {
    return this.fhirHl7Service.searchFHIRResources('Encounter', query);
  }

  /**
   * Get external systems
   */
  @Get('systems')
  async getExternalSystems(@Query() query: { type?: string; isActive?: boolean }) {
    const isActive = query.isActive !== undefined ? query.isActive === true : undefined;
    return this.externalSystemsService.getExternalSystems({
      type: query.type,
      isActive,
    });
  }

  /**
   * Create external system
   */
  @Post('systems')
  async createExternalSystem(
    @Body()
    body: {
      name: string;
      type: string;
      baseUrl: string;
      apiKey?: string;
      username?: string;
      password?: string;
      authType?: string;
      configuration?: any;
    },
  ) {
    return this.externalSystemsService.createExternalSystem(body);
  }

  /**
   * Test connection to external system
   */
  @Post('systems/:id/test')
  async testConnection(@Param('id') systemId: string) {
    const success = await this.externalSystemsService.testConnection(systemId);
    return { systemId, connectionTest: success ? 'SUCCESS' : 'FAILED' };
  }

  /**
   * Get sync status
   */
  @Get('systems/:id/sync-status')
  async getSyncStatus(@Param('id') systemId: string) {
    return this.externalSystemsService.getSyncStatus(systemId);
  }
}
