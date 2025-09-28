import { Injectable, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import { CircuitBreaker } from 'opossum';

import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';

/**
 * Enhanced HL7 Service with robust error handling and external system integration
 */
@Injectable()
export class Hl7Service {
  private readonly logger = new Logger(Hl7Service.name);
  private externalClients: Map<string, AxiosInstance> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {
    this.initializeExternalClients();
  }

  private initializeExternalClients() {
    // Get external HL7 endpoints from database
    this.loadExternalSystems();
  }

  private async loadExternalSystems() {
    try {
      const externalSystems = await this.prisma.externalSystem.findMany({
        where: {
          type: 'HL7_ENDPOINT',
          isActive: true,
        },
      });

      for (const system of externalSystems) {
        const client = axios.create({
          baseURL: system.baseUrl,
          timeout: 30000,
          httpsAgent: new https.Agent({
            rejectUnauthorized: true,
          }),
          headers: {
            'User-Agent': 'HMS-HL7-Client/1.0',
            'Content-Type': 'application/hl7-v2',
            ...(system.apiKey && { 'X-API-Key': system.apiKey }),
          },
        });

        this.externalClients.set(system.id, client);

        // Initialize circuit breaker
        const breaker = new CircuitBreaker(
          async (requestFn: () => Promise<any>) => {
            return await requestFn();
          },
          {
            timeout: 30000,
            errorThresholdPercentage: 50,
            resetTimeout: 60000,
            name: system.name,
          },
        );

        breaker.on('open', () =>
          this.logger.error(`HL7 circuit breaker opened for ${system.name}`),
        );
        breaker.on('close', () => this.logger.log(`HL7 circuit breaker closed for ${system.name}`));

        this.circuitBreakers.set(system.id, breaker);
      }
    } catch (error) {
      this.logger.error('Failed to load external HL7 systems', error);
    }
  }

  /**
   * Parse HL7 message and extract structured data
   */
  async parseHL7Message(rawMessage: string): Promise<any> {
    try {
      // Basic HL7 message validation
      if (!rawMessage.startsWith('MSH|')) {
        throw new BadRequestException('Invalid HL7 message format');
      }

      const segments = rawMessage.split('\r').filter(segment => segment.trim());

      // Parse MSH segment
      const mshSegment = segments[0];
      const mshFields = mshSegment.split('|');

      if (mshFields.length < 12) {
        throw new BadRequestException('Invalid MSH segment');
      }

      const parsedMessage = {
        messageType: mshFields[8]?.split('^')[0], // Message Type
        messageId: mshFields[9], // Message Control ID
        version: mshFields[11], // Version ID
        sendingApplication: mshFields[2],
        sendingFacility: mshFields[3],
        receivingApplication: mshFields[4],
        receivingFacility: mshFields[5],
        timestamp: mshFields[6],
        segments: {},
      };

      // Parse other segments
      for (const segment of segments.slice(1)) {
        const segmentName = segment.slice(0, 3);
        const segmentData = segment.split('|');

        parsedMessage.segments[segmentName] = parsedMessage.segments[segmentName] || [];
        parsedMessage.segments[segmentName].push(this.parseSegment(segmentName, segmentData));
      }

      return parsedMessage;
    } catch (error) {
      this.logger.error(`Failed to parse HL7 message: ${error.message}`, error.stack);
      throw new BadRequestException(`Invalid HL7 message: ${error.message}`);
    }
  }

  /**
   * Generate HL7 message from structured data
   */
  async generateHL7Message(messageType: string, patient: any, data: any): Promise<any> {
    try {
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
      const messageId = `MSG${Date.now()}`;

      let message = '';

      // Generate MSH segment
      message += `MSH|^~\\&|HMS|HOSPITAL|RXTN|RECEIVER|${timestamp}||${messageType}^O01|${messageId}|P|2.5\r`;

      // Generate message-specific segments
      switch (messageType) {
        case 'ADT':
          message += this.generateADTSegments(patient, data);
          break;
        case 'ORU':
          message += this.generateORUSegments(patient, data);
          break;
        case 'ORM':
          message += this.generateORMSegments(patient, data);
          break;
        default:
          throw new BadRequestException(`Unsupported message type: ${messageType}`);
      }

      return {
        messageId,
        version: '2.5',
        rawMessage: message,
      };
    } catch (error) {
      this.logger.error(`Failed to generate HL7 message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Convert parsed HL7 message to FHIR resources
   */
  async convertToFHIR(parsedMessage: any): Promise<any[]> {
    const resources = [];

    try {
      switch (parsedMessage.messageType) {
        case 'ADT':
          resources.push(...this.convertADTToFHIR(parsedMessage));
          break;
        case 'ORU':
          resources.push(...this.convertORUToFHIR(parsedMessage));
          break;
        case 'ORM':
          resources.push(...this.convertORMToFHIR(parsedMessage));
          break;
        default:
          this.logger.warn(
            `No FHIR conversion logic for message type: ${parsedMessage.messageType}`,
          );
      }

      return resources;
    } catch (error) {
      this.logger.error(`Failed to convert HL7 to FHIR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send HL7 message to external system
   */
  async sendHL7ToExternalSystem(systemId: string, hl7Message: string): Promise<any> {
    const client = this.externalClients.get(systemId);
    const breaker = this.circuitBreakers.get(systemId);

    if (!client || !breaker) {
      throw new BadRequestException(`External HL7 system ${systemId} not configured or available`);
    }

    try {
      const response = await breaker.fire(async () => {
        return client.post('/hl7', hl7Message, {
          headers: {
            'Content-Type': 'application/hl7-v2',
          },
        });
      });

      this.logger.log(`Successfully sent HL7 message to ${systemId}`);
      return {
        success: true,
        systemId,
        response: response.data,
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send HL7 message to ${systemId}: ${error.message}`);

      // Log the failure for compliance
      await this.logHL7TransmissionFailure(systemId, hl7Message, error);

      throw new HttpException(
        `Failed to send HL7 message to external system: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Broadcast HL7 message to all active external systems
   */
  async broadcastHL7Message(hl7Message: string, excludeSystemIds: string[] = []): Promise<any[]> {
    const results = [];
    const systems = await this.prisma.externalSystem.findMany({
      where: {
        type: 'HL7_ENDPOINT',
        isActive: true,
        id: { notIn: excludeSystemIds },
      },
    });

    for (const system of systems) {
      try {
        const result = await this.sendHL7ToExternalSystem(system.id, hl7Message);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          systemId: system.id,
          error: error.message,
          failedAt: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Log HL7 transmission failure for compliance
   */
  private async logHL7TransmissionFailure(
    systemId: string,
    message: string,
    error: any,
  ): Promise<void> {
    try {
      await this.complianceService.logAuditEvent({
        userId: null, // System operation
        action: 'HL7_TRANSMISSION_FAILED',
        resource: 'HL7_MESSAGE',
        resourceId: systemId,
        details: {
          systemId,
          error: error.message,
          messagePreview: message.substring(0, 200),
        },
        ipAddress: null,
        userAgent: 'HMS-HL7-Service',
        complianceFlags: ['HL7_TRANSMISSION', 'SYSTEM_INTEGRATION'],
      });
    } catch (logError) {
      this.logger.error('Failed to log HL7 transmission failure', logError);
    }
  }

  /**
   * Parse individual HL7 segment
   */
  private parseSegment(segmentName: string, fields: string[]): any {
    switch (segmentName) {
      case 'PID':
        return this.parsePIDSegment(fields);
      case 'PV1':
        return this.parsePV1Segment(fields);
      case 'OBR':
        return this.parseOBRSegment(fields);
      case 'OBX':
        return this.parseOBXSegment(fields);
      case 'ORC':
        return this.parseORCSegment(fields);
      default:
        return { raw: fields };
    }
  }

  /**
   *
   */
  private parsePIDSegment(fields: string[]): any {
    return {
      patientId: fields[2], // Patient ID
      patientIdentifierList: fields[3],
      alternatePatientId: fields[4],
      patientName: this.parseName(fields[5]),
      mothersMaidenName: this.parseName(fields[6]),
      dateOfBirth: fields[7],
      gender: fields[8],
      patientAlias: fields[9],
      race: fields[10],
      patientAddress: this.parseAddress(fields[11]),
      countyCode: fields[12],
      phoneNumberHome: fields[13],
      phoneNumberBusiness: fields[14],
      primaryLanguage: fields[15],
      maritalStatus: fields[16],
      religion: fields[17],
      patientAccountNumber: fields[18],
      ssnNumber: fields[19],
      driversLicenseNumber: fields[20],
      mothersIdentifier: fields[21],
      ethnicGroup: fields[22],
      birthPlace: fields[23],
      multipleBirthIndicator: fields[24],
      birthOrder: fields[25],
      citizenship: fields[26],
      veteransMilitaryStatus: fields[27],
      nationality: fields[28],
      patientDeathDateAndTime: fields[29],
      patientDeathIndicator: fields[30],
    };
  }

  /**
   *
   */
  private parsePV1Segment(fields: string[]): any {
    return {
      setId: fields[1],
      patientClass: fields[2],
      assignedPatientLocation: fields[3],
      admissionType: fields[4],
      preadmitNumber: fields[5],
      priorPatientLocation: fields[6],
      attendingDoctor: this.parseDoctor(fields[7]),
      referringDoctor: this.parseDoctor(fields[8]),
      consultingDoctor: this.parseDoctor(fields[9]),
      hospitalService: fields[10],
      temporaryLocation: fields[11],
      preadmitTestIndicator: fields[12],
      reAdmissionIndicator: fields[13],
      admitSource: fields[14],
      ambulatoryStatus: fields[15],
      vipIndicator: fields[16],
      admittingDoctor: this.parseDoctor(fields[17]),
      patientType: fields[18],
      visitNumber: fields[19],
      financialClass: fields[20],
      chargePriceIndicator: fields[21],
      courtesyCode: fields[22],
      creditRating: fields[23],
      contractCode: fields[24],
      contractEffectiveDate: fields[25],
      contractAmount: fields[26],
      contractPeriod: fields[27],
      interestCode: fields[28],
      transferToBadDebtCode: fields[29],
      transferToBadDebtDate: fields[30],
      badDebtAgencyCode: fields[31],
      badDebtTransferAmount: fields[32],
      badDebtRecoveryAmount: fields[33],
      deleteAccountIndicator: fields[34],
      deleteAccountDate: fields[35],
      dischargeDisposition: fields[36],
      dischargedToLocation: fields[37],
      dietType: fields[38],
      servicingFacility: fields[39],
      bedStatus: fields[40],
      accountStatus: fields[41],
      pendingLocation: fields[42],
      priorTemporaryLocation: fields[43],
      admitDateTime: fields[44],
      dischargeDateTime: fields[45],
      currentPatientBalance: fields[46],
      totalCharges: fields[47],
      totalAdjustments: fields[48],
      totalPayments: fields[49],
      alternateVisitId: fields[50],
      visitIndicator: fields[51],
      otherHealthcareProvider: fields[52],
    };
  }

  /**
   *
   */
  private parseOBRSegment(fields: string[]): any {
    return {
      setId: fields[1],
      placerOrderNumber: fields[2],
      fillerOrderNumber: fields[3],
      universalServiceId: this.parseCodedElement(fields[4]),
      priority: fields[5],
      requestedDateTime: fields[6],
      observationDateTime: fields[7],
      observationEndDateTime: fields[8],
      collectionVolume: fields[9],
      collectorIdentifier: fields[10],
      specimenActionCode: fields[11],
      dangerCode: fields[12],
      relevantClinicalInfo: fields[13],
      specimenReceivedDateTime: fields[14],
      specimenSource: fields[15],
      orderingProvider: this.parseDoctor(fields[16]),
      orderCallbackPhoneNumber: fields[17],
      placersField1: fields[18],
      placersField2: fields[19],
      fillersField1: fields[20],
      fillersField2: fields[21],
      resultsRptStatusChngDateTime: fields[22],
      chargeToPractice: fields[23],
      diagnosticServSectId: fields[24],
      resultStatus: fields[25],
      parentResult: fields[26],
      quantityTiming: fields[27],
      resultCopiesTo: fields[28],
      parentNumber: fields[29],
      transportationMode: fields[30],
      reasonForStudy: fields[31],
      principalResultInterpreter: fields[32],
      assistantResultInterpreter: fields[33],
      technician: fields[34],
      transcriptionist: fields[35],
      scheduledDateTime: fields[36],
      numberOfSampleContainers: fields[37],
      transportLogisticsOfCollectedSample: fields[38],
      collectorsComment: fields[39],
      transportArrangementResponsibility: fields[40],
      transportArranged: fields[41],
      escortRequired: fields[42],
      plannedPatientTransportComment: fields[43],
    };
  }

  /**
   *
   */
  private parseOBXSegment(fields: string[]): any {
    return {
      setId: fields[1],
      valueType: fields[2],
      observationIdentifier: this.parseCodedElement(fields[3]),
      observationSubId: fields[4],
      observationValue: fields[5],
      units: fields[6],
      referencesRange: fields[7],
      abnormalFlags: fields[8],
      probability: fields[9],
      natureOfAbnormalTest: fields[10],
      observationResultStatus: fields[11],
      effectiveDateOfReferenceRange: fields[12],
      userDefinedAccessChecks: fields[13],
      dateTimeOfTheObservation: fields[14],
      producersId: fields[15],
      responsibleObserver: fields[16],
      observationMethod: fields[17],
    };
  }

  /**
   *
   */
  private parseORCSegment(fields: string[]): any {
    return {
      orderControl: fields[1],
      placerOrderNumber: fields[2],
      fillerOrderNumber: fields[3],
      placerGroupNumber: fields[4],
      orderStatus: fields[5],
      responseFlag: fields[6],
      quantityTiming: fields[7],
      parent: fields[8],
      dateTimeOfTransaction: fields[9],
      enteredBy: fields[10],
      verifiedBy: fields[11],
      orderingProvider: fields[12],
      enterersLocation: fields[13],
      callBackPhoneNumber: fields[14],
      orderEffectiveDateTime: fields[15],
      orderControlCodeReason: fields[16],
      enteringOrganization: fields[17],
      enteringDevice: fields[18],
      actionBy: fields[19],
    };
  }

  // Helper parsing methods
  /**
   *
   */
  private parseName(nameField: string): any {
    if (!nameField) return null;
    const components = nameField.split('^');
    return {
      familyName: components[0],
      givenName: components[1],
      middleName: components[2],
      suffix: components[3],
      prefix: components[4],
      degree: components[5],
    };
  }

  /**
   *
   */
  private parseAddress(addressField: string): any {
    if (!addressField) return null;
    const components = addressField.split('^');
    return {
      streetAddress: components[0],
      otherDesignation: components[1],
      city: components[2],
      stateOrProvince: components[3],
      zipOrPostalCode: components[4],
      country: components[5],
      addressType: components[6],
      otherGeographicDesignation: components[7],
    };
  }

  /**
   *
   */
  private parseDoctor(doctorField: string): any {
    if (!doctorField) return null;
    const components = doctorField.split('^');
    return {
      id: components[0],
      familyName: components[1],
      givenName: components[2],
      middleName: components[3],
      suffix: components[4],
      prefix: components[5],
      degree: components[6],
      sourceTable: components[7],
      assigningAuthority: components[8],
    };
  }

  /**
   *
   */
  private parseCodedElement(codedField: string): any {
    if (!codedField) return null;
    const components = codedField.split('^');
    return {
      identifier: components[0],
      text: components[1],
      nameOfCodingSystem: components[2],
      alternateIdentifier: components[3],
      alternateText: components[4],
      nameOfAlternateCodingSystem: components[5],
    };
  }

  // HL7 Generation Methods
  /**
   *
   */
  private generateADTSegments(patient: any, data: any): string {
    let segments = '';

    // PID segment
    segments += `PID|1|${patient.mrn}||${patient.user.lastName}^${patient.user.firstName}|||${patient.dateOfBirth.toISOString().split('T')[0]}|${patient.gender}|||||||||||||||||||||||\r`;

    // PV1 segment
    segments += `PV1|1|${data.patientClass || 'O'}|${data.location || ''}||||${data.attendingDoctor || ''}|||||||||||${data.admissionType || ''}||||||||||||${data.visitNumber || ''}|||||||||||||||||||\r`;

    return segments;
  }

  /**
   *
   */
  private generateORUSegments(patient: any, data: any): string {
    let segments = '';

    // PID segment
    segments += `PID|1|${patient.mrn}||${patient.user.lastName}^${patient.user.firstName}|||${patient.dateOfBirth.toISOString().split('T')[0]}|${patient.gender}|||||||||||||||||||||||\r`;

    // OBR segment
    segments += `OBR|1|${data.orderNumber}||${data.testCode}^${data.testName}|||||||${data.collectionDate}||||||||||||${data.status}|||||||\r`;

    // OBX segments for results
    if (data.results) {
      data.results.forEach((result, index) => {
        segments += `OBX|${index + 1}|${result.valueType || 'ST'}|${result.testCode}^${result.testName}|||${result.value}|${result.units}|||||${result.status || 'F'}||||${result.performedDate}\r`;
      });
    }

    return segments;
  }

  /**
   *
   */
  private generateORMSegments(patient: any, data: any): string {
    let segments = '';

    // PID segment
    segments += `PID|1|${patient.mrn}||${patient.user.lastName}^${patient.user.firstName}|||${patient.dateOfBirth.toISOString().split('T')[0]}|${patient.gender}|||||||||||||||||||||||\r`;

    // ORC segment
    segments += `ORC|${data.orderControl || 'NW'}|${data.placerOrderNumber}||${data.fillerOrderNumber}|||||||${data.orderedDate}|||${data.orderingProvider}|||||||||\r`;

    // OBR segment
    segments += `OBR|1|${data.placerOrderNumber}||${data.serviceId}^${data.serviceName}|||||||${data.orderedDate}||||||||||||${data.status}|||||||\r`;

    return segments;
  }

  // FHIR Conversion Methods
  /**
   *
   */
  private convertADTToFHIR(parsedMessage: any): any[] {
    const resources = [];

    if (parsedMessage.segments.PID) {
      const pid = parsedMessage.segments.PID[0];
      const patientResource = {
        resourceType: 'Patient',
        resourceId: pid.patientId,
        data: {
          resourceType: 'Patient',
          id: pid.patientId,
          identifier: [
            {
              system: 'urn:oid:2.16.840.1.113883.3.72',
              value: pid.patientId,
            },
          ],
          name: [
            {
              family: pid.patientName.familyName,
              given: [pid.patientName.givenName],
              text: `${pid.patientName.givenName} ${pid.patientName.familyName}`,
            },
          ],
          gender: pid.gender?.toLowerCase(),
          birthDate: pid.dateOfBirth,
          active: true,
        },
        patientId: pid.patientId,
      };
      resources.push(patientResource);
    }

    if (parsedMessage.segments.PV1) {
      const pv1 = parsedMessage.segments.PV1[0];
      const encounterResource = {
        resourceType: 'Encounter',
        resourceId: `enc-${Date.now()}`,
        data: {
          resourceType: 'Encounter',
          status: 'in-progress',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: pv1.patientClass === 'I' ? 'IMP' : 'AMB',
          },
          subject: {
            reference: `Patient/${parsedMessage.segments.PID[0].patientId}`,
          },
          period: {
            start: new Date().toISOString(),
          },
        },
        patientId: parsedMessage.segments.PID[0].patientId,
      };
      resources.push(encounterResource);
    }

    return resources;
  }

  /**
   *
   */
  private convertORUToFHIR(parsedMessage: any): any[] {
    const resources = [];

    if (parsedMessage.segments.OBX) {
      parsedMessage.segments.OBX.forEach(obx => {
        const observationResource = {
          resourceType: 'Observation',
          resourceId: `obs-${Date.now()}-${Math.random()}`,
          data: {
            resourceType: 'Observation',
            status: obx.observationResultStatus === 'F' ? 'final' : 'preliminary',
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
              text: obx.observationIdentifier.text,
            },
            subject: {
              reference: `Patient/${parsedMessage.segments.PID[0].patientId}`,
            },
            effectiveDateTime: obx.dateTimeOfTheObservation,
            valueString: obx.observationValue,
            valueQuantity: obx.units
              ? {
                  value: parseFloat(obx.observationValue),
                  unit: obx.units,
                  system: 'http://unitsofmeasure.org',
                }
              : undefined,
          },
          patientId: parsedMessage.segments.PID[0].patientId,
        };
        resources.push(observationResource);
      });
    }

    return resources;
  }

  /**
   *
   */
  private convertORMToFHIR(parsedMessage: any): any[] {
    const resources = [];

    if (parsedMessage.segments.OBR) {
      const obr = parsedMessage.segments.OBR[0];
      const serviceRequestResource = {
        resourceType: 'ServiceRequest',
        resourceId: `sr-${Date.now()}`,
        data: {
          resourceType: 'ServiceRequest',
          status: 'active',
          intent: 'order',
          code: {
            text: obr.universalServiceId.text,
          },
          subject: {
            reference: `Patient/${parsedMessage.segments.PID[0].patientId}`,
          },
          occurrenceDateTime: obr.requestedDateTime,
        },
        patientId: parsedMessage.segments.PID[0].patientId,
      };
      resources.push(serviceRequestResource);
    }

    return resources;
  }
}
