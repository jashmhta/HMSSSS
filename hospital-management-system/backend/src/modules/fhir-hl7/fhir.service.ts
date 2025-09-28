import { Injectable, Logger, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import { CircuitBreaker } from 'opossum';

import { PrismaService } from '../../database/prisma.service';

/**
 * Enhanced FHIR Service with real server integration
 */
@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);
  private fhirClient: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: { requests: number[]; limit: number; period: number };

  constructor(private prisma: PrismaService) {
    this.initializeFHIRClient();
  }

  private initializeFHIRClient() {
    // Configure FHIR server connection
    const fhirServerUrl = process.env.FHIR_SERVER_URL || 'https://hapi.fhir.org/baseR4';
    const apiKey = process.env.FHIR_API_KEY;

    this.fhirClient = axios.create({
      baseURL: fhirServerUrl,
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: true,
      }),
      headers: {
        'User-Agent': 'HMS-FHIR-Client/1.0',
        Accept: 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(
      async (requestFn: () => Promise<any>) => {
        return await requestFn();
      },
      {
        timeout: 30000,
        errorThresholdPercentage: 50,
        resetTimeout: 60000,
        name: 'FHIR_SERVER',
      },
    );

    this.circuitBreaker.on('open', () => this.logger.error('FHIR server circuit breaker opened'));
    this.circuitBreaker.on('halfOpen', () =>
      this.logger.log('FHIR server circuit breaker half-open'),
    );
    this.circuitBreaker.on('close', () => this.logger.log('FHIR server circuit breaker closed'));

    // Initialize rate limiter (100 requests per minute)
    this.rateLimiter = {
      requests: [],
      limit: 100,
      period: 60000,
    };
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      time => now - time < this.rateLimiter.period,
    );

    if (this.rateLimiter.requests.length >= this.rateLimiter.limit) {
      const oldestRequest = Math.min(...this.rateLimiter.requests);
      const waitTime = this.rateLimiter.period - (now - oldestRequest);
      throw new HttpException(
        `FHIR API rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.rateLimiter.requests.push(now);
  }

  private async makeFHIRRequest(requestFn: () => Promise<any>, retries: number = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.checkRateLimit();
        const response = await this.circuitBreaker.fire(requestFn);
        return response;
      } catch (error) {
        this.logger.warn(`FHIR request attempt ${attempt} failed: ${error.message}`);

        if (attempt === retries) {
          throw new HttpException(
            `FHIR server error after ${retries} attempts: ${error.message}`,
            HttpStatus.BAD_GATEWAY,
          );
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Store FHIR resource in database and sync to FHIR server
   */
  async storeFHIRResource(
    resourceType: string,
    resourceId: string,
    data: any,
    patientId?: string,
    source?: string,
  ) {
    try {
      // Validate FHIR resource
      if (!this.validateFHIRResource(data)) {
        throw new HttpException('Invalid FHIR resource structure', HttpStatus.BAD_REQUEST);
      }

      // Check if resource already exists
      const existingResource = await this.prisma.fHIRResource.findFirst({
        where: {
          resourceType,
          resourceId,
        },
      });

      let storedResource;
      if (existingResource) {
        // Update existing resource
        storedResource = await this.prisma.fHIRResource.update({
          where: { id: existingResource.id },
          data: {
            lastUpdated: new Date(),
            data,
            patientId,
            source,
            status: 'ACTIVE',
          },
        });
      } else {
        // Create new resource
        storedResource = await this.prisma.fHIRResource.create({
          data: {
            resourceType,
            resourceId,
            data,
            patientId,
            source,
            status: 'ACTIVE',
          },
        });
      }

      // Sync to FHIR server if configured
      try {
        await this.syncResourceToFHIRServer(storedResource);
      } catch (syncError) {
        this.logger.warn(`Failed to sync resource to FHIR server: ${syncError.message}`);
        // Don't fail the operation, just log the warning
      }

      return storedResource;
    } catch (error) {
      this.logger.error(`Failed to store FHIR resource: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sync resource to FHIR server
   */
  private async syncResourceToFHIRServer(resource: any): Promise<void> {
    const { resourceType, resourceId, data } = resource;

    await this.makeFHIRRequest(async () => {
      const response = await this.fhirClient.put(`/${resourceType}/${resourceId}`, data);
      this.logger.log(`Synced ${resourceType}/${resourceId} to FHIR server`);
      return response.data;
    });
  }

  /**
   * Get FHIR resource from server or local cache
   */
  async getFHIRResourceFromServer(resourceType: string, resourceId: string) {
    try {
      // Try to get from FHIR server first
      const response = await this.makeFHIRRequest(async () => {
        return this.fhirClient.get(`/${resourceType}/${resourceId}`);
      });

      // Update local cache
      await this.storeFHIRResource(resourceType, resourceId, response.data, null, 'FHIR_SERVER');

      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to get from FHIR server, falling back to local: ${error.message}`);

      // Fallback to local cache
      return this.getFHIRResource(resourceType, resourceId);
    }
  }

  /**
   * Search FHIR resources on server
   */
  async searchFHIRResourcesOnServer(resourceType: string, searchParams: any) {
    try {
      const params = new URLSearchParams();

      // Convert search params to FHIR search syntax
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] !== undefined && searchParams[key] !== null) {
          params.append(key, searchParams[key]);
        }
      });

      const response = await this.makeFHIRRequest(async () => {
        return this.fhirClient.get(`/${resourceType}?${params.toString()}`);
      });

      // Cache results locally
      if (response.data.entry) {
        for (const entry of response.data.entry) {
          const resource = entry.resource;
          await this.storeFHIRResource(
            resource.resourceType,
            resource.id,
            resource,
            resource.subject?.reference?.split('/')[1],
            'FHIR_SERVER',
          );
        }
      }

      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to search on FHIR server, falling back to local: ${error.message}`);

      // Fallback to local search
      return this.searchFHIRResources(resourceType, searchParams);
    }
  }

  /**
   * Get FHIR resource by type and ID
   */
  async getFHIRResource(resourceType: string, resourceId: string) {
    const resource = await this.prisma.fHIRResource.findFirst({
      where: {
        resourceType,
        resourceId,
        status: 'ACTIVE',
      },
    });

    if (!resource) {
      throw new NotFoundException(`FHIR resource ${resourceType}/${resourceId} not found`);
    }

    return resource;
  }

  /**
   * Search FHIR resources
   */
  async searchFHIRResources(resourceType: string, searchParams: any) {
    const where: any = {
      resourceType,
      status: 'ACTIVE',
    };

    // Add search filters
    if (searchParams.patient) {
      where.patientId = searchParams.patient;
    }

    if (searchParams._lastUpdated) {
      where.lastUpdated = { gte: new Date(searchParams._lastUpdated) };
    }

    const [resources, total] = await Promise.all([
      this.prisma.fHIRResource.findMany({
        where,
        skip: searchParams._offset ? parseInt(searchParams._offset) : 0,
        take: searchParams._count ? parseInt(searchParams._count) : 20,
        orderBy: { lastUpdated: 'desc' },
      }),
      this.prisma.fHIRResource.count({ where }),
    ]);

    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total,
      entry: resources.map(resource => ({
        resource: resource.data,
      })),
    };
  }

  /**
   * Convert internal Patient model to FHIR Patient resource
   */
  convertPatientToFHIR(patient: any): any {
    return {
      resourceType: 'Patient',
      id: patient.id,
      identifier: [
        {
          system: 'urn:oid:2.16.840.1.113883.3.72',
          value: patient.mrn,
        },
      ],
      name: [
        {
          family: patient.user.lastName,
          given: [patient.user.firstName],
          text: `${patient.user.firstName} ${patient.user.lastName}`,
        },
      ],
      gender: patient.gender.toLowerCase(),
      birthDate: patient.dateOfBirth.toISOString().split('T')[0],
      active: patient.user.isActive,
      address: patient.address ? [patient.address] : undefined,
      telecom: [
        {
          system: 'phone',
          value: patient.user.phone,
          use: 'mobile',
        },
        {
          system: 'email',
          value: patient.user.email,
        },
      ],
    };
  }

  /**
   * Convert internal MedicalRecord to FHIR Encounter resource
   */
  convertMedicalRecordToFHIREncounter(medicalRecord: any): any {
    return {
      resourceType: 'Encounter',
      id: medicalRecord.id,
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
      },
      subject: {
        reference: `Patient/${medicalRecord.patientId}`,
      },
      participant: [
        {
          individual: {
            reference: `Practitioner/${medicalRecord.doctorId}`,
          },
        },
      ],
      period: {
        start: medicalRecord.visitDate.toISOString(),
      },
      reasonCode: medicalRecord.diagnosis?.map(diagnosis => ({
        text: diagnosis,
      })),
      serviceProvider: {
        reference: 'Organization/hms',
      },
    };
  }

  /**
   * Convert internal LabTest to FHIR Observation resource
   */
  convertLabTestToFHIRObservation(labTest: any, labResult: any): any {
    return {
      resourceType: 'Observation',
      id: labResult.id,
      status: labResult.status.toLowerCase(),
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
            },
          ],
        },
      ],
      code: {
        text: labResult.parameter,
      },
      subject: {
        reference: `Patient/${labTest.patientId}`,
      },
      effectiveDateTime: labResult.performedDate?.toISOString(),
      valueQuantity:
        labResult.value && labResult.units
          ? {
              value: parseFloat(labResult.value),
              unit: labResult.units,
              system: 'http://unitsofmeasure.org',
            }
          : undefined,
      valueString: !labResult.units ? labResult.value : undefined,
      referenceRange: labResult.referenceRange
        ? [
            {
              text: labResult.referenceRange,
            },
          ]
        : undefined,
      interpretation: labResult.flag
        ? [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: this.mapResultFlagToFHIR(labResult.flag),
                },
              ],
            },
          ]
        : undefined,
    };
  }

  /**
   * Convert internal Prescription to FHIR MedicationRequest resource
   */
  convertPrescriptionToFHIRMedicationRequest(prescription: any): any {
    return {
      resourceType: 'MedicationRequest',
      id: prescription.id,
      status: prescription.status.toLowerCase(),
      intent: 'order',
      medicationCodeableConcept: {
        text: prescription.medication.name,
      },
      subject: {
        reference: `Patient/${prescription.patientId}`,
      },
      requester: {
        reference: `Practitioner/${prescription.doctorId}`,
      },
      dosageInstruction: [
        {
          text: `${prescription.dosage}, ${prescription.frequency}`,
          timing: {
            repeat: {
              duration: prescription.duration,
              durationUnit: 'days',
            },
          },
        },
      ],
      dispenseRequest: {
        quantity: {
          value: prescription.quantity,
        },
      },
    };
  }

  /**
   * Map internal result flag to FHIR interpretation code
   */
  private mapResultFlagToFHIR(flag: string): string {
    const flagMapping = {
      NORMAL: 'N',
      HIGH: 'H',
      LOW: 'L',
      CRITICAL_HIGH: 'HH',
      CRITICAL_LOW: 'LL',
      ABNORMAL: 'A',
    };
    return flagMapping[flag] || 'A';
  }

  /**
   * Validate FHIR resource against basic structure
   */
  validateFHIRResource(resource: any): boolean {
    if (!resource.resourceType) {
      return false;
    }

    // Basic validation - could be enhanced with FHIR schema validation
    const requiredFields = ['resourceType'];
    return requiredFields.every(field => resource.hasOwnProperty(field));
  }
}
