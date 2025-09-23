/*[object Object]*/
import { Injectable, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../database/prisma.service';

interface LISConfig {
  systemName: string;
  endpoint: string;
  apiKey: string;
  timeout: number;
}

interface LISOrderRequest {
  orderNumber: string;
  patientId: string;
  patientInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    mrn: string;
  };
  tests: Array<{
    testCode: string;
    testName: string;
    priority: string;
    clinicalInfo?: string;
  }>;
  orderedBy: string;
  orderedDate: string;
  urgent: boolean;
}

interface LISResultResponse {
  orderNumber: string;
  results: Array<{
    testCode: string;
    parameter: string;
    value: string;
    units?: string;
    referenceRange?: string;
    flag?: string;
    status: string;
    performedDate: string;
    instrument?: string;
  }>;
  status: string;
}

/**
 *
 */
@Injectable()
export class LISIntegrationService {
  private readonly logger = new Logger(LISIntegrationService.name);

  /**
   *
   */
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Send lab order to LIS system
   */
  async sendOrderToLIS(orderId: string): Promise<void> {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id: orderId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        testCatalog: true,
      },
    });

    if (!labTest) {
      throw new BadRequestException('Lab test not found');
    }

    const lisConfig = await this.getActiveLISConfig();
    if (!lisConfig) {
      this.logger.warn('No active LIS integration configured');
      return;
    }

    const orderRequest: LISOrderRequest = {
      orderNumber: labTest.orderNumber,
      patientId: labTest.patientId,
      patientInfo: {
        firstName: labTest.patient.user.firstName,
        lastName: labTest.patient.user.lastName,
        dateOfBirth: labTest.patient.dateOfBirth.toISOString().split('T')[0],
        gender: labTest.patient.gender,
        mrn: labTest.patient.mrn,
      },
      tests: [
        {
          testCode: labTest.testCatalog.testCode,
          testName: labTest.testCatalog.testName,
          priority: labTest.priority,
          clinicalInfo: labTest.clinicalInfo,
        },
      ],
      orderedBy: labTest.orderedBy,
      orderedDate: labTest.orderedDate.toISOString(),
      urgent: labTest.urgent,
    };

    try {
      await this.sendToLIS(lisConfig, '/orders', orderRequest);

      // Update LIS integration status
      await this.updateLISStatus(lisConfig.id, 'SUCCESS');

      this.logger.log(`Successfully sent order ${labTest.orderNumber} to LIS`);
    } catch (error) {
      await this.updateLISStatus(lisConfig.id, 'FAILED', error.message);
      this.logger.error(`Failed to send order ${labTest.orderNumber} to LIS:`, error);
      throw new BadRequestException('Failed to send order to LIS system');
    }
  }

  /**
   * Receive results from LIS system
   */
  async receiveResultsFromLIS(orderNumber: string, results: LISResultResponse): Promise<void> {
    const labTest = await this.prisma.labTest.findUnique({
      where: { orderNumber },
      include: {
        samples: true,
        testCatalog: true,
      },
    });

    if (!labTest) {
      throw new BadRequestException(`Lab test with order number ${orderNumber} not found`);
    }

    // Update test status
    await this.prisma.labTest.update({
      where: { id: labTest.id },
      data: {
        status: results.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
      },
    });

    // Process each result
    for (const result of results.results) {
      // Find or create sample if not exists
      let sample = labTest.samples[0]; // Assuming single sample per test for now
      if (!sample) {
        sample = await this.prisma.labSample.create({
          data: {
            labTestId: labTest.id,
            sampleId: `${orderNumber}-S1`,
            specimenType: labTest.testCatalog.specimenType,
            collectionMethod: 'VENIPUNCTURE', // Default
            collectionDate: new Date(),
            collectedBy: 'LIS_SYSTEM',
          },
        });
      }

      // Create or update result
      await this.prisma.labResult.upsert({
        where: {
          id: `${labTest.id}-${result.parameter}`, // Use a composite ID approach
        },
        update: {
          value: result.value,
          units: result.units,
          referenceRange: result.referenceRange,
          flag: result.flag as any,
          status: result.status as any,
          performedDate: new Date(result.performedDate),
          instrument: result.instrument,
          labSampleId: sample.id,
        },
        create: {
          labTestId: labTest.id,
          labSampleId: sample.id,
          parameter: result.parameter,
          value: result.value,
          units: result.units,
          referenceRange: result.referenceRange,
          flag: result.flag as any,
          status: result.status as any,
          performedBy: 'LIS_SYSTEM',
          performedDate: new Date(result.performedDate),
          instrument: result.instrument,
        },
      });
    }

    this.logger.log(
      `Successfully processed ${results.results.length} results for order ${orderNumber}`,
    );
  }

  /**
   * Sync test catalog from LIS
   */
  async syncTestCatalog(): Promise<void> {
    const lisConfig = await this.getActiveLISConfig();
    if (!lisConfig) {
      throw new BadRequestException('No active LIS integration configured');
    }

    try {
      const response = await this.sendToLIS(lisConfig, '/catalog/tests', {});
      const tests = response.data;

      for (const test of tests) {
        await this.prisma.labTestCatalog.upsert({
          where: { testCode: test.testCode },
          update: {
            testName: test.testName,
            category: test.category,
            department: test.department,
            specimenType: test.specimenType,
            containerType: test.containerType,
            volumeRequired: test.volumeRequired,
            turnaroundTime: test.turnaroundTime,
            referenceRange: test.referenceRange,
            units: test.units,
            method: test.method,
            cost: test.cost,
            isActive: test.isActive,
          },
          create: {
            testCode: test.testCode,
            testName: test.testName,
            category: test.category,
            department: test.department,
            specimenType: test.specimenType,
            containerType: test.containerType,
            volumeRequired: test.volumeRequired,
            turnaroundTime: test.turnaroundTime,
            referenceRange: test.referenceRange,
            units: test.units,
            method: test.method,
            cost: test.cost,
            isActive: test.isActive,
          },
        });
      }

      await this.updateLISStatus(lisConfig.id, 'SUCCESS');
      this.logger.log(`Successfully synced ${tests.length} tests from LIS catalog`);
    } catch (error) {
      await this.updateLISStatus(lisConfig.id, 'FAILED', error.message);
      this.logger.error('Failed to sync test catalog from LIS:', error);
      throw new BadRequestException('Failed to sync test catalog from LIS');
    }
  }

  /**
   * Query LIS for order status
   */
  async queryOrderStatus(orderNumber: string): Promise<any> {
    const lisConfig = await this.getActiveLISConfig();
    if (!lisConfig) {
      throw new BadRequestException('No active LIS integration configured');
    }

    try {
      const response = await this.sendToLIS(lisConfig, `/orders/${orderNumber}/status`, {});
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to query order status for ${orderNumber}:`, error);
      throw new BadRequestException('Failed to query order status from LIS');
    }
  }

  /**
   * Send QC results to LIS
   */
  async sendQCResults(qcId: string): Promise<void> {
    const qc = await this.prisma.labQualityControl.findUnique({
      where: { id: qcId },
    });

    if (!qc) {
      throw new BadRequestException('QC record not found');
    }

    const lisConfig = await this.getActiveLISConfig();
    if (!lisConfig) {
      this.logger.warn('No active LIS integration configured');
      return;
    }

    const qcData = {
      testParameter: qc.testParameter,
      controlLot: qc.controlLot,
      controlLevel: qc.controlLevel,
      expectedValue: qc.expectedValue,
      expectedRange: qc.expectedRange,
      actualValue: qc.actualValue,
      performedDate: qc.performedDate.toISOString(),
      instrument: qc.instrument,
      status: qc.status,
      notes: qc.notes,
    };

    try {
      await this.sendToLIS(lisConfig, '/qc/results', qcData);
      await this.updateLISStatus(lisConfig.id, 'SUCCESS');
      this.logger.log(`Successfully sent QC results for ${qc.testParameter}`);
    } catch (error) {
      await this.updateLISStatus(lisConfig.id, 'FAILED', error.message);
      this.logger.error(`Failed to send QC results for ${qc.testParameter}:`, error);
    }
  }

  /**
   *
   */
  private async getActiveLISConfig(): Promise<any> {
    return this.prisma.lISIntegration.findFirst({
      where: { isActive: true },
    });
  }

  /**
   *
   */
  private async sendToLIS(config: any, endpoint: string, data: any): Promise<any> {
    const url = `${config.endpoint}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'X-System-Name': config.systemName,
    };

    try {
      return await firstValueFrom(
        this.httpService.post(url, data, { headers }).pipe(
          timeout(config.timeout || 30000),
          catchError(error => {
            throw new HttpException(
              `LIS request failed: ${error.message}`,
              error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   */
  private async updateLISStatus(
    integrationId: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.lISIntegration.update({
      where: { id: integrationId },
      data: {
        lastSync: new Date(),
        syncStatus: status as any,
        errorMessage,
      },
    });
  }

  /**
   * Configure LIS integration
   */
  async configureLIS(config: {
    systemName: string;
    systemVersion?: string;
    endpoint: string;
    apiKey: string;
  }): Promise<void> {
    // Deactivate existing configurations
    await this.prisma.lISIntegration.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new configuration
    await this.prisma.lISIntegration.create({
      data: {
        systemName: config.systemName,
        systemVersion: config.systemVersion,
        endpoint: config.endpoint,
        apiKey: config.apiKey, // In production, this should be encrypted
        isActive: true,
      },
    });

    this.logger.log(`LIS integration configured for ${config.systemName}`);
  }

  /**
   * Test LIS connection
   */
  async testLISConnection(): Promise<{ success: boolean; message: string }> {
    const lisConfig = await this.getActiveLISConfig();
    if (!lisConfig) {
      return { success: false, message: 'No active LIS integration configured' };
    }

    try {
      await this.sendToLIS(lisConfig, '/health', {});
      return { success: true, message: 'LIS connection successful' };
    } catch (error) {
      return { success: false, message: `LIS connection failed: ${error.message}` };
    }
  }
}
