import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface QCResult {
  testParameter: string;
  controlLot: string;
  controlLevel: QCLevel;
  expectedValue: string;
  expectedRange: string;
  actualValue: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INVALID';
  notes?: string;
  correctiveAction?: string;
}

type QCLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

@Injectable()
export class QualityControlService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record QC result
   */
  async recordQCResult(data: {
    testParameter: string;
    controlLot: string;
    controlLevel: QCLevel;
    expectedValue: string;
    expectedRange: string;
    actualValue: string;
    performedBy: string;
    instrument: string;
    notes?: string;
  }): Promise<string> {
    // Validate reagent exists and is active
    const reagent = await this.prisma.labReagent.findFirst({
      where: {
        name: {
          contains: data.controlLot,
          mode: 'insensitive',
        },
        status: 'ACTIVE',
      },
    });

    if (!reagent) {
      throw new BadRequestException(`Control material ${data.controlLot} not found or inactive`);
    }

    // Check if expired
    if (reagent.expiryDate < new Date()) {
      throw new BadRequestException(`Control material ${data.controlLot} has expired`);
    }

    // Determine QC status
    const status = this.evaluateQCResult(data.expectedRange, data.actualValue);

    const qcResult = await this.prisma.labQualityControl.create({
      data: {
        testParameter: data.testParameter,
        controlLot: data.controlLot,
        controlLevel: data.controlLevel,
        expectedValue: data.expectedValue,
        expectedRange: data.expectedRange,
        actualValue: data.actualValue,
        performedBy: data.performedBy,
        performedDate: new Date(),
        instrument: data.instrument,
        status,
        notes: data.notes,
      },
    });

    // If QC fails, create corrective action alert
    if (status === 'FAIL') {
      await this.createCorrectiveAction(qcResult.id, data.testParameter, data.instrument);
    }

    return qcResult.id;
  }

  /**
   * Get QC results for a parameter
   */
  async getQCResults(testParameter: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.labQualityControl.findMany({
      where: {
        testParameter,
        performedDate: {
          gte: startDate,
        },
      },
      orderBy: {
        performedDate: 'desc',
      },
      include: {
        _count: false,
      },
    });
  }

  /**
   * Get QC statistics
   */
  async getQCStatistics(testParameter?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      performedDate: {
        gte: startDate,
      },
    };

    if (testParameter) {
      where.testParameter = testParameter;
    }

    const qcResults = await this.prisma.labQualityControl.findMany({
      where,
      select: {
        status: true,
        testParameter: true,
        performedDate: true,
      },
    });

    const stats = {
      total: qcResults.length,
      pass: qcResults.filter(r => r.status === 'PASS').length,
      fail: qcResults.filter(r => r.status === 'FAIL').length,
      warning: qcResults.filter(r => r.status === 'WARNING').length,
      invalid: qcResults.filter(r => r.status === 'INVALID').length,
      passRate: 0,
      byParameter: {} as Record<string, any>,
    };

    if (stats.total > 0) {
      stats.passRate = Math.round((stats.pass / stats.total) * 100);
    }

    // Group by parameter
    const parameterStats = qcResults.reduce(
      (acc, result) => {
        if (!acc[result.testParameter]) {
          acc[result.testParameter] = {
            total: 0,
            pass: 0,
            fail: 0,
            warning: 0,
            invalid: 0,
            passRate: 0,
          };
        }

        acc[result.testParameter].total++;
        acc[result.testParameter][result.status.toLowerCase()]++;

        return acc;
      },
      {} as Record<string, any>,
    );

    // Calculate pass rates
    Object.keys(parameterStats).forEach(param => {
      const paramStats = parameterStats[param];
      paramStats.passRate =
        paramStats.total > 0 ? Math.round((paramStats.pass / paramStats.total) * 100) : 0;
    });

    stats.byParameter = parameterStats;

    return stats;
  }

  /**
   * Schedule calibration for equipment
   */
  async scheduleCalibration(
    equipmentId: string,
    scheduledDate: Date,
    technicianId: string,
  ): Promise<void> {
    const equipment = await this.prisma.labEquipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    await this.prisma.labEquipment.update({
      where: { id: equipmentId },
      data: {
        nextCalibration: scheduledDate,
      },
    });

    // Could also create a maintenance record or notification here
  }

  /**
   * Record calibration
   */
  async recordCalibration(data: {
    equipmentId: string;
    performedBy: string;
    calibrationDate: Date;
    nextCalibrationDate: Date;
    results: string;
    status: 'PASS' | 'FAIL' | 'REQUIRES_ADJUSTMENT';
    notes?: string;
  }): Promise<void> {
    const equipment = await this.prisma.labEquipment.findUnique({
      where: { id: data.equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    await this.prisma.labEquipment.update({
      where: { id: data.equipmentId },
      data: {
        lastCalibration: data.calibrationDate,
        nextCalibration: data.nextCalibrationDate,
      },
    });

    // Could create a calibration log record here
    // This would require adding a calibration log table to the schema
  }

  /**
   * Get equipment due for calibration
   */
  async getEquipmentDueForCalibration(daysAhead: number = 30): Promise<any[]> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysAhead);

    return this.prisma.labEquipment.findMany({
      where: {
        nextCalibration: {
          lte: dueDate,
        },
        status: 'ACTIVE',
      },
      orderBy: {
        nextCalibration: 'asc',
      },
    });
  }

  /**
   * Get equipment due for maintenance
   */
  async getEquipmentDueForMaintenance(daysAhead: number = 30): Promise<any[]> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysAhead);

    return this.prisma.labEquipment.findMany({
      where: {
        nextMaintenance: {
          lte: dueDate,
        },
        status: 'ACTIVE',
      },
      orderBy: {
        nextMaintenance: 'asc',
      },
    });
  }

  /**
   * Create reagent QC lot
   */
  async createQCLot(data: {
    name: string;
    lotNumber: string;
    expiryDate: Date;
    targetValues: Record<string, { mean: string; sd: string; range: string }>;
    assignedTo: string[]; // Test parameters
  }): Promise<string> {
    const reagent = await this.prisma.labReagent.create({
      data: {
        name: data.name,
        lotNumber: data.lotNumber,
        expiryDate: data.expiryDate,
        quantity: 100, // Default quantity for QC material
        unit: 'vials',
        cost: 0, // QC materials might be free or have different costing
        status: 'ACTIVE',
      },
    });

    return reagent.id;
  }

  /**
   * Get QC dashboard data
   */
  async getQCDashboard(): Promise<{
    qcStats: any;
    failingTests: string[];
    equipmentDueCalibration: any[];
    equipmentDueMaintenance: any[];
    expiringReagents: any[];
  }> {
    const [qcStats, failingTests, equipmentCalibration, equipmentMaintenance, expiringReagents] =
      await Promise.all([
        this.getQCStatistics(undefined, 7), // Last 7 days
        this.getFailingQCParameters(7),
        this.getEquipmentDueForCalibration(7),
        this.getEquipmentDueForMaintenance(7),
        this.getExpiringReagents(30),
      ]);

    return {
      qcStats,
      failingTests,
      equipmentDueCalibration,
      equipmentDueMaintenance,
      expiringReagents,
    };
  }

  /**
   * Get parameters with failing QC
   */
  private async getFailingQCParameters(days: number): Promise<string[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const failingResults = await this.prisma.labQualityControl.findMany({
      where: {
        status: 'FAIL',
        performedDate: {
          gte: startDate,
        },
      },
      select: {
        testParameter: true,
      },
      distinct: ['testParameter'],
    });

    return failingResults.map(r => r.testParameter);
  }

  /**
   * Get expiring reagents
   */
  private async getExpiringReagents(daysAhead: number): Promise<any[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    return this.prisma.labReagent.findMany({
      where: {
        expiryDate: {
          lte: expiryDate,
        },
        status: 'ACTIVE',
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }

  /**
   * Evaluate QC result against expected range
   */
  private evaluateQCResult(
    expectedRange: string,
    actualValue: string,
  ): 'PASS' | 'FAIL' | 'WARNING' | 'INVALID' {
    try {
      const actual = parseFloat(actualValue);
      if (isNaN(actual)) {
        return 'INVALID';
      }

      // Parse expected range (e.g., "3.5-4.5" or "3.5 ± 0.5")
      const rangeMatch = expectedRange.match(/(\d+(?:\.\d+)?)\s*[-±]\s*(\d+(?:\.\d+)?)/);
      if (!rangeMatch) {
        return 'INVALID';
      }

      const center = parseFloat(rangeMatch[1]);
      const tolerance = parseFloat(rangeMatch[2]);

      const lowerBound = center - tolerance;
      const upperBound = center + tolerance;

      if (actual >= lowerBound && actual <= upperBound) {
        return 'PASS';
      } else if (actual >= lowerBound * 0.9 && actual <= upperBound * 1.1) {
        return 'WARNING';
      } else {
        return 'FAIL';
      }
    } catch {
      return 'INVALID';
    }
  }

  /**
   * Create corrective action for failed QC
   */
  private async createCorrectiveAction(
    qcId: string,
    testParameter: string,
    instrument: string,
  ): Promise<void> {
    // This could integrate with a notification system or incident management
    // For now, we'll just log it in the QC record
    await this.prisma.labQualityControl.update({
      where: { id: qcId },
      data: {
        correctiveAction: `Failed QC for ${testParameter} on ${instrument}. Requires investigation and potential recalibration.`,
      },
    });

    // Could also send notifications to lab manager/technician
    // await this.notificationService.sendQCAlert(qcId, testParameter, instrument);
  }

  /**
   * Generate QC trend analysis
   */
  async generateQCTrends(testParameter: string, days: number = 90): Promise<any> {
    const results = await this.getQCResults(testParameter, days);

    const trends = {
      parameter: testParameter,
      period: `${days} days`,
      totalResults: results.length,
      passRate: (results.filter(r => r.status === 'PASS').length / results.length) * 100,
      dataPoints: results.map(r => ({
        date: r.performedDate.toISOString().split('T')[0],
        value: parseFloat(r.actualValue) || 0,
        status: r.status,
        expectedRange: r.expectedRange,
      })),
      alerts: results.filter(r => r.status === 'FAIL').length,
    };

    return trends;
  }
}
