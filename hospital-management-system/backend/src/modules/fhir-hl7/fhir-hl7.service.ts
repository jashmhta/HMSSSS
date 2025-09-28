import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { FhirService } from './fhir.service';
import { Hl7Service } from './hl7.service';
import { ExternalSystemsService } from './external-systems.service';

/**
 *
 */
@Injectable()
export class FhirHl7Service {
  private readonly logger = new Logger(FhirHl7Service.name);

  /**
   *
   */
  constructor(
    private prisma: PrismaService,
    private fhirService: FhirService,
    private hl7Service: Hl7Service,
    private externalSystemsService: ExternalSystemsService,
  ) {}

  /**
   * Process incoming HL7 message and convert to FHIR resources
   */
  async processHL7Message(rawMessage: string, sourceSystem?: string) {
    try {
      this.logger.log(`Processing HL7 message from ${sourceSystem || 'unknown source'}`);

      // Parse and validate HL7 message
      const parsedMessage = await this.hl7Service.parseHL7Message(rawMessage);

      // Store HL7 message
      const hl7Message = await this.prisma.hL7Message.create({
        data: {
          messageType: parsedMessage.messageType,
          messageId: parsedMessage.messageId,
          version: parsedMessage.version,
          rawMessage,
          parsedData: parsedMessage,
          direction: 'INBOUND',
          sourceSystem,
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      // Convert to FHIR resources based on message type
      const fhirResources = await this.hl7Service.convertToFHIR(parsedMessage);

      // Store FHIR resources
      const storedResources = [];
      for (const resource of fhirResources) {
        const storedResource = await this.fhirService.storeFHIRResource(
          resource.resourceType,
          resource.resourceId,
          resource.data,
          resource.patientId,
          sourceSystem,
        );
        storedResources.push(storedResource);
      }

      // Update internal records if applicable
      await this.updateInternalRecords(parsedMessage, storedResources);

      this.logger.log(
        `Successfully processed HL7 message ${hl7Message.id} with ${storedResources.length} FHIR resources`,
      );

      return {
        hl7MessageId: hl7Message.id,
        fhirResources: storedResources,
        processed: true,
      };
    } catch (error) {
      this.logger.error(`Failed to process HL7 message: ${error.message}`, error.stack);

      // Store failed message
      await this.prisma.hL7Message.create({
        data: {
          messageType: 'UNKNOWN',
          messageId: `failed-${Date.now()}`,
          rawMessage,
          direction: 'INBOUND',
          sourceSystem,
          status: 'FAILED',
          processingErrors: [error.message],
        },
      });

      throw new BadRequestException(`Failed to process HL7 message: ${error.message}`);
    }
  }

  /**
   * Generate HL7 message from internal data
   */
  async generateHL7Message(
    messageType: string,
    patientId: string,
    data: any,
    destinationSystem?: string,
  ) {
    try {
      this.logger.log(`Generating HL7 ${messageType} message for patient ${patientId}`);

      // Get patient data
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      // Generate HL7 message
      const hl7Message = await this.hl7Service.generateHL7Message(messageType, patient, data);

      // Store outbound message
      const storedMessage = await this.prisma.hL7Message.create({
        data: {
          messageType,
          messageId: hl7Message.messageId,
          version: hl7Message.version,
          rawMessage: hl7Message.rawMessage,
          parsedData: data,
          direction: 'OUTBOUND',
          sourceSystem: destinationSystem,
          status: 'PROCESSED',
          processedAt: new Date(),
          patientId,
        },
      });

      this.logger.log(`Successfully generated HL7 message ${storedMessage.id}`);

      return {
        hl7MessageId: storedMessage.id,
        rawMessage: hl7Message.rawMessage,
        generated: true,
      };
    } catch (error) {
      this.logger.error(`Failed to generate HL7 message: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate HL7 message: ${error.message}`);
    }
  }

  /**
   * Sync patient data with external FHIR server
   */
  async syncPatientToFHIR(patientId: string, externalSystemId: string) {
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true, medicalRecords: true, prescriptions: true },
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      const externalSystem = await this.externalSystemsService.getExternalSystem(externalSystemId);
      if (!externalSystem || externalSystem.type !== 'FHIR_SERVER') {
        throw new NotFoundException('External FHIR system not found');
      }

      // Convert patient to FHIR Patient resource
      const fhirPatient = this.fhirService.convertPatientToFHIR(patient);

      // Send to external system
      const result = await this.externalSystemsService.sendToExternalSystem(
        externalSystemId,
        'POST',
        '/Patient',
        fhirPatient,
      );

      // Store FHIR resource locally
      await this.fhirService.storeFHIRResource(
        'Patient',
        result.id || patientId,
        result,
        patientId,
        externalSystem.name,
      );

      return { synced: true, externalId: result.id };
    } catch (error) {
      this.logger.error(`Failed to sync patient to FHIR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get FHIR resource by ID
   */
  async getFHIRResource(resourceType: string, resourceId: string) {
    return this.fhirService.getFHIRResource(resourceType, resourceId);
  }

  /**
   * Search FHIR resources
   */
  async searchFHIRResources(resourceType: string, searchParams: any) {
    return this.fhirService.searchFHIRResources(resourceType, searchParams);
  }

  /**
   * Update internal records based on processed HL7/FHIR data
   */
  private async updateInternalRecords(parsedMessage: any, fhirResources: any[]) {
    // Implementation depends on message type
    // This would update patients, appointments, observations, etc.
    // based on the incoming HL7 messages

    switch (parsedMessage.messageType) {
      case 'ADT':
        await this.updatePatientFromADT(parsedMessage, fhirResources);
        break;
      case 'ORU':
        await this.updateObservationsFromORU(parsedMessage, fhirResources);
        break;
      case 'ORM':
        await this.updateOrdersFromORM(parsedMessage, fhirResources);
        break;
      default:
        this.logger.log(`No specific update logic for message type: ${parsedMessage.messageType}`);
    }
  }

  /**
   *
   */
  private async updatePatientFromADT(parsedMessage: any, fhirResources: any[]) {
    // Update patient information from ADT messages
    const patientResource = fhirResources.find(r => r.resourceType === 'Patient');
    if (patientResource) {
      // Update patient record with new information
      // Implementation would depend on specific ADT message content
    }
  }

  /**
   *
   */
  private async updateObservationsFromORU(parsedMessage: any, fhirResources: any[]) {
    // Update lab results from ORU messages
    const observationResources = fhirResources.filter(r => r.resourceType === 'Observation');
    for (const obs of observationResources) {
      // Update lab results in internal system
      // Implementation would depend on specific ORU message content
    }
  }

  /**
   *
   */
  private async updateOrdersFromORM(parsedMessage: any, fhirResources: any[]) {
    // Update orders from ORM messages
    // Implementation would depend on specific ORM message content
  }
}
