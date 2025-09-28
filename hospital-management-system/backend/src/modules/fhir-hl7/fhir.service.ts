import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);

  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Store FHIR resource in database
   */
  async storeFHIRResource(
    resourceType: string,
    resourceId: string,
    data: any,
    patientId?: string,
    source?: string,
  ) {
    try {
      // Check if resource already exists
      const existingResource = await this.prisma.fHIRResource.findFirst({
        where: {
          resourceType,
          resourceId,
        },
      });

      if (existingResource) {
        // Update existing resource
        return this.prisma.fHIRResource.update({
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
        return this.prisma.fHIRResource.create({
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
    } catch (error) {
      this.logger.error(`Failed to store FHIR resource: ${error.message}`, error.stack);
      throw error;
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
