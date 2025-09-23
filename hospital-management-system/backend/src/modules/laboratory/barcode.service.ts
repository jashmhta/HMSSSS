/*[object Object]*/
import * as crypto from 'crypto';

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class BarcodeService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique barcode for lab sample
   */
  async generateSampleBarcode(labTestId: string): Promise<string> {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id: labTestId },
      include: { testCatalog: true },
    });

    if (!labTest) {
      throw new NotFoundException('Lab test not found');
    }

    // Generate unique barcode using timestamp, test code, and random component
    const timestamp = Date.now().toString(36);
    const testCode = labTest.testCatalog.testCode.replace(/[^A-Z0-9]/gi, '').slice(0, 4);
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();

    const barcode = `L${timestamp}${testCode}${random}`;

    // Ensure uniqueness
    const existingSample = await this.prisma.labSample.findUnique({
      where: { sampleId: barcode },
    });

    if (existingSample) {
      // Recursively generate new barcode if collision occurs
      return this.generateSampleBarcode(labTestId);
    }

    return barcode;
  }

  /**
   * Generate barcode for reagent/consumable
   */
  async generateReagentBarcode(reagentId: string): Promise<string> {
    const reagent = await this.prisma.labReagent.findUnique({
      where: { id: reagentId },
    });

    if (!reagent) {
      throw new NotFoundException('Reagent not found');
    }

    const timestamp = Date.now().toString(36);
    const lotShort = reagent.lotNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 4);
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();

    return `R${timestamp}${lotShort}${random}`;
  }

  /**
   * Generate barcode for equipment
   */
  async generateEquipmentBarcode(equipmentId: string): Promise<string> {
    const equipment = await this.prisma.labEquipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    const timestamp = Date.now().toString(36);
    const serialShort = equipment.serialNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 4);
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();

    return `E${timestamp}${serialShort}${random}`;
  }

  /**
   * Validate barcode format
   */
  validateBarcode(barcode: string): boolean {
    // Basic validation for our barcode format
    const barcodeRegex = /^[LRE][A-Z0-9]{10,20}$/;
    return barcodeRegex.test(barcode);
  }

  /**
   * Get barcode type and associated entity
   */
  async getBarcodeInfo(barcode: string): Promise<{
    type: 'sample' | 'reagent' | 'equipment';
    entity: any;
  }> {
    if (!this.validateBarcode(barcode)) {
      throw new BadRequestException('Invalid barcode format');
    }

    const type = barcode.startsWith('L')
      ? 'sample'
      : barcode.startsWith('R')
        ? 'reagent'
        : 'equipment';

    let entity;
    switch (type) {
      case 'sample':
        entity = await this.prisma.labSample.findUnique({
          where: { sampleId: barcode },
          include: {
            labTest: {
              include: {
                patient: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true },
                    },
                  },
                },
                testCatalog: true,
              },
            },
          },
        });
        break;
      case 'reagent':
        entity = await this.prisma.labReagent.findFirst({
          where: {
            /* We might need to add barcode field to reagent model */
          },
        });
        break;
      case 'equipment':
        entity = await this.prisma.labEquipment.findFirst({
          where: {
            /* We might need to add barcode field to equipment model */
          },
        });
        break;
    }

    if (!entity) {
      throw new NotFoundException(`${type} not found for barcode ${barcode}`);
    }

    return { type, entity };
  }

  /**
   * Generate batch barcodes for multiple samples
   */
  async generateBatchBarcodes(
    labTestIds: string[],
  ): Promise<Array<{ labTestId: string; barcode: string }>> {
    const results = [];

    for (const labTestId of labTestIds) {
      const barcode = await this.generateSampleBarcode(labTestId);
      results.push({ labTestId, barcode });
    }

    return results;
  }

  /**
   * Print barcode labels (returns data for printing)
   */
  async generateBarcodeLabels(barcodes: string[]): Promise<
    Array<{
      barcode: string;
      type: string;
      label: string;
      patientInfo?: string;
      testInfo?: string;
    }>
  > {
    const labels = [];

    for (const barcode of barcodes) {
      try {
        const { type, entity } = await this.getBarcodeInfo(barcode);

        let label = '';
        let patientInfo = '';
        let testInfo = '';

        switch (type) {
          case 'sample':
            const sample = entity;
            patientInfo = `${sample.labTest.patient.user.firstName} ${sample.labTest.patient.user.lastName}`;
            testInfo = `${sample.labTest.testCatalog.testName} (${sample.labTest.testCatalog.testCode})`;
            label = `${barcode}\n${patientInfo}\n${testInfo}\n${sample.collectionDate?.toISOString().split('T')[0]}`;
            break;
          case 'reagent':
            const reagent = entity;
            label = `${barcode}\n${reagent.name}\nLot: ${reagent.lotNumber}`;
            break;
          case 'equipment':
            const equipment = entity;
            label = `${barcode}\n${equipment.name}\nSN: ${equipment.serialNumber}`;
            break;
        }

        labels.push({
          barcode,
          type,
          label,
          patientInfo,
          testInfo,
        });
      } catch (error) {
        // Skip invalid barcodes
        continue;
      }
    }

    return labels;
  }

  /**
   * Track barcode scan events
   */
  async trackBarcodeScan(barcode: string, scannedBy: string, location?: string): Promise<void> {
    // This could be extended to store scan history in a separate table
    // For now, we'll just validate the barcode exists
    await this.getBarcodeInfo(barcode);

    // Could add audit logging here
    // await this.auditService.logBarcodeScan(barcode, scannedBy, location);
  }

  /**
   * Generate QR code data for mobile access
   */
  generateQRCodeData(barcode: string): string {
    // Return JSON data that can be encoded in QR code
    return JSON.stringify({
      barcode,
      timestamp: new Date().toISOString(),
      type: 'lab-barcode',
    });
  }

  /**
   * Validate QR code data
   */
  validateQRCodeData(qrData: string): { barcode: string; valid: boolean } {
    try {
      const data = JSON.parse(qrData);
      const isValid =
        data.type === 'lab-barcode' &&
        this.validateBarcode(data.barcode) &&
        Date.now() - new Date(data.timestamp).getTime() < 24 * 60 * 60 * 1000; // 24 hours validity

      return { barcode: data.barcode, valid: isValid };
    } catch {
      return { barcode: '', valid: false };
    }
  }
}
