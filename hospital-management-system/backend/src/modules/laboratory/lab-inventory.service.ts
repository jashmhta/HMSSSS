import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface ReagentStockUpdate {
  reagentId: string;
  quantity: number;
  action: 'RECEIVED' | 'ISSUED' | 'ADJUSTED' | 'EXPIRED' | 'DAMAGED';
  reason?: string;
  performedBy: string;
  batchNumber?: string;
  expiryDate?: Date;
  costPrice?: number;
}

@Injectable()
export class LabInventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add new reagent to inventory
   */
  async addReagent(data: {
    name: string;
    catalogNumber?: string;
    manufacturer: string;
    lotNumber: string;
    expiryDate: Date;
    receivedDate?: Date;
    quantity: number;
    unit: string;
    storageCondition?: string;
    cost: number;
    supplier?: string;
    minStockLevel?: number;
  }): Promise<string> {
    // Check if reagent with same lot number already exists
    const existingReagent = await this.prisma.labReagent.findFirst({
      where: {
        name: data.name,
        lotNumber: data.lotNumber,
      },
    });

    if (existingReagent) {
      throw new BadRequestException('Reagent with this lot number already exists');
    }

    const reagent = await this.prisma.labReagent.create({
      data: {
        name: data.name,
        catalogNumber: data.catalogNumber,
        manufacturer: data.manufacturer,
        lotNumber: data.lotNumber,
        expiryDate: data.expiryDate,
        receivedDate: data.receivedDate || new Date(),
        quantity: data.quantity,
        unit: data.unit,
        storageCondition: data.storageCondition,
        cost: data.cost,
        supplier: data.supplier,
        minStockLevel: data.minStockLevel || 1,
        status: 'ACTIVE',
      },
    });

    return reagent.id;
  }

  /**
   * Update reagent stock
   */
  async updateReagentStock(update: ReagentStockUpdate): Promise<void> {
    const reagent = await this.prisma.labReagent.findUnique({
      where: { id: update.reagentId },
    });

    if (!reagent) {
      throw new NotFoundException('Reagent not found');
    }

    // Calculate new stock level
    let newStock: number;
    switch (update.action) {
      case 'RECEIVED':
        newStock = reagent.quantity + update.quantity;
        break;
      case 'ISSUED':
      case 'EXPIRED':
      case 'DAMAGED':
        newStock = reagent.quantity - update.quantity;
        if (newStock < 0) {
          throw new BadRequestException('Insufficient stock');
        }
        break;
      case 'ADJUSTED':
        newStock = update.quantity; // Absolute adjustment
        break;
      default:
        newStock = reagent.quantity;
    }

    // Update reagent stock
    await this.prisma.labReagent.update({
      where: { id: update.reagentId },
      data: {
        quantity: newStock,
        updatedAt: new Date(),
      },
    });

    // Create inventory log
    await this.prisma.inventoryLog.create({
      data: {
        medicationId: update.reagentId, // Using existing inventory log table
        action: update.action,
        quantity: update.quantity,
        previousStock: reagent.quantity,
        newStock,
        reason: update.reason,
        performedBy: update.performedBy,
        batchNumber: update.batchNumber || reagent.lotNumber,
        expiryDate: update.expiryDate || reagent.expiryDate,
        costPrice: update.costPrice,
      },
    });

    // Check for low stock alerts
    if (newStock <= reagent.minStockLevel && newStock > 0) {
      await this.createLowStockAlert(update.reagentId);
    }

    // Auto-deactivate if stock is zero
    if (newStock <= 0) {
      await this.prisma.labReagent.update({
        where: { id: update.reagentId },
        data: { status: 'DEPLETED' },
      });
    }
  }

  /**
   * Get reagent inventory
   */
  async getReagentInventory(filters?: {
    status?: string[];
    category?: string;
    expiringWithin?: number; // days
    lowStock?: boolean;
  }) {
    const where: any = {};

    if (filters?.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters?.expiringWithin) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + filters.expiringWithin);
      where.expiryDate = {
        lte: expiryDate,
      };
    }

    if (filters?.lowStock) {
      // This would require a more complex query to compare quantity with minStockLevel
      // For now, we'll filter reagents with quantity <= 5
      where.quantity = {
        lte: 5,
      };
    }

    return this.prisma.labReagent.findMany({
      where,
      orderBy: [{ expiryDate: 'asc' }, { quantity: 'asc' }],
    });
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(): Promise<any[]> {
    const lowStockReagents = await this.prisma.labReagent.findMany({
      where: {
        status: 'ACTIVE',
        quantity: {
          lte: this.prisma.labReagent.fields.minStockLevel,
        },
      },
    });

    return lowStockReagents.map(reagent => ({
      reagentId: reagent.id,
      name: reagent.name,
      lotNumber: reagent.lotNumber,
      currentStock: reagent.quantity,
      minStockLevel: reagent.minStockLevel,
      supplier: reagent.supplier,
      urgency: reagent.quantity === 0 ? 'CRITICAL' : 'WARNING',
    }));
  }

  /**
   * Get expiring reagents
   */
  async getExpiringReagents(daysAhead: number = 30): Promise<any[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    return this.prisma.labReagent.findMany({
      where: {
        expiryDate: {
          lte: expiryDate,
          gt: new Date(),
        },
        status: 'ACTIVE',
        quantity: {
          gt: 0,
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }

  /**
   * Get expired reagents
   */
  async getExpiredReagents(): Promise<any[]> {
    return this.prisma.labReagent.findMany({
      where: {
        expiryDate: {
          lt: new Date(),
        },
        status: 'ACTIVE',
        quantity: {
          gt: 0,
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }

  /**
   * Process expired reagents
   */
  async processExpiredReagents(reagentIds: string[], performedBy: string): Promise<void> {
    for (const reagentId of reagentIds) {
      const reagent = await this.prisma.labReagent.findUnique({
        where: { id: reagentId },
      });

      if (!reagent) continue;

      // Update stock to zero and mark as expired
      await this.updateReagentStock({
        reagentId,
        quantity: reagent.quantity,
        action: 'EXPIRED',
        reason: 'Expired reagent disposal',
        performedBy,
      });

      await this.prisma.labReagent.update({
        where: { id: reagentId },
        data: { status: 'EXPIRED' },
      });
    }
  }

  /**
   * Get reagent usage statistics
   */
  async getReagentUsageStats(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usageLogs = await this.prisma.inventoryLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        action: 'ISSUED',
      },
      include: {
        medication: true,
      },
    });

    const stats = {
      period: `${days} days`,
      totalIssued: usageLogs.reduce((sum, log) => sum + log.quantity, 0),
      byReagent: {} as Record<string, any>,
    };

    // Group by reagent
    usageLogs.forEach(log => {
      const reagentName = log.medication.name;
      if (!stats.byReagent[reagentName]) {
        stats.byReagent[reagentName] = {
          totalIssued: 0,
          transactions: 0,
          averagePerTransaction: 0,
        };
      }

      stats.byReagent[reagentName].totalIssued += log.quantity;
      stats.byReagent[reagentName].transactions += 1;
    });

    // Calculate averages
    Object.keys(stats.byReagent).forEach(reagentName => {
      const reagentStats = stats.byReagent[reagentName];
      reagentStats.averagePerTransaction = reagentStats.totalIssued / reagentStats.transactions;
    });

    return stats;
  }

  /**
   * Generate inventory report
   */
  async generateInventoryReport(): Promise<any> {
    const [
      totalReagents,
      activeReagents,
      lowStockReagents,
      expiringReagents,
      expiredReagents,
      usageStats,
    ] = await Promise.all([
      this.prisma.labReagent.count(),
      this.prisma.labReagent.count({ where: { status: 'ACTIVE' } }),
      this.prisma.labReagent.count({
        where: {
          status: 'ACTIVE',
          quantity: {
            lte: this.prisma.labReagent.fields.minStockLevel,
          },
        },
      }),
      this.prisma.labReagent.count({
        where: {
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            gt: new Date(),
          },
          status: 'ACTIVE',
        },
      }),
      this.prisma.labReagent.count({
        where: {
          expiryDate: {
            lt: new Date(),
          },
          status: 'ACTIVE',
        },
      }),
      this.getReagentUsageStats(30),
    ]);

    return {
      summary: {
        totalReagents,
        activeReagents,
        lowStockAlerts: lowStockReagents,
        expiringWithin30Days: expiringReagents,
        expiredReagents,
      },
      usage: usageStats,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Bulk import reagents
   */
  async bulkImportReagents(
    reagents: Array<{
      name: string;
      catalogNumber?: string;
      manufacturer: string;
      lotNumber: string;
      expiryDate: string;
      quantity: number;
      unit: string;
      cost: number;
      supplier?: string;
    }>,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const reagentData of reagents) {
      try {
        await this.addReagent({
          ...reagentData,
          expiryDate: new Date(reagentData.expiryDate),
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(
          `Failed to import ${reagentData.name} (${reagentData.lotNumber}): ${error.message}`,
        );
      }
    }

    return { success, failed, errors };
  }

  /**
   * Create low stock alert
   */
  private async createLowStockAlert(reagentId: string): Promise<void> {
    // This could integrate with a notification system
    // For now, we'll just log it or could create an alert record
    console.log(`Low stock alert for reagent ${reagentId}`);

    // Could also send notifications to lab manager
    // await this.notificationService.sendLowStockAlert(reagentId);
  }

  /**
   * Get reagent by barcode
   */
  async getReagentByBarcode(barcode: string): Promise<any> {
    // This assumes we add barcode field to LabReagent model
    // For now, we'll search by lot number or name
    return this.prisma.labReagent.findFirst({
      where: {
        OR: [{ lotNumber: barcode }, { name: { contains: barcode, mode: 'insensitive' } }],
      },
    });
  }

  /**
   * Transfer reagent between locations
   */
  async transferReagent(
    reagentId: string,
    fromLocation: string,
    toLocation: string,
    quantity: number,
    performedBy: string,
  ): Promise<void> {
    // This could be extended to track reagent locations
    // For now, we'll just log the transfer
    await this.updateReagentStock({
      reagentId,
      quantity,
      action: 'ADJUSTED',
      reason: `Transferred from ${fromLocation} to ${toLocation}`,
      performedBy,
    });
  }
}
