/*[object Object]*/
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class InventoryService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  // Medication Management
  /**
   *
   */
  async createMedication(data: {
    name: string;
    genericName?: string;
    brandName?: string;
    dosageForm: string;
    strength: string;
    manufacturer?: string;
    batchNumber?: string;
    expiryDate?: Date;
    stockQuantity?: number;
    reorderLevel?: number;
    unitPrice: number;
    category?: string;
    requiresPrescription?: boolean;
    createdBy?: string;
  }) {
    return this.prisma.medication.create({
      data: {
        name: data.name,
        genericName: data.genericName,
        brandName: data.brandName,
        dosageForm: data.dosageForm as any,
        strength: data.strength,
        manufacturer: data.manufacturer,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
        stockQuantity: data.stockQuantity || 0,
        reorderLevel: data.reorderLevel || 10,
        unitPrice: data.unitPrice,
        category: data.category,
        requiresPrescription:
          data.requiresPrescription !== undefined ? data.requiresPrescription : true,
        isActive: true,
      },
    });
  }

  /**
   *
   */
  async getMedications(
    page: number = 1,
    limit: number = 10,
    search?: string,
    category?: string,
    lowStock?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { brandName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (lowStock) {
      where.stockQuantity = {
        lte: this.prisma.medication.fields.reorderLevel,
      };
    }

    const [medications, total] = await Promise.all([
      this.prisma.medication.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.medication.count({ where }),
    ]);

    return {
      data: medications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   *
   */
  async getMedicationById(id: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
      include: {
        prescriptions: {
          orderBy: { prescribedDate: 'desc' },
          take: 5,
        },
        inventoryLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    return medication;
  }

  /**
   *
   */
  async updateMedication(
    id: string,
    data: Partial<{
      name: string;
      genericName: string;
      brandName: string;
      dosageForm: string;
      strength: string;
      manufacturer: string;
      batchNumber: string;
      expiryDate: Date;
      reorderLevel: number;
      unitPrice: number;
      category: string;
      requiresPrescription: boolean;
      isActive: boolean;
      updatedBy?: string;
    }>,
  ) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    return this.prisma.medication.update({
      where: { id },
      data: {
        ...data,
        dosageForm: data.dosageForm as any,
      },
    });
  }

  /**
   *
   */
  async deleteMedication(id: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    // Check if medication has active prescriptions (simplified for schema compatibility)
    const hasActivePrescriptions = await this.prisma.prescription.count({
      where: {
        medicationId: id,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    });

    if (hasActivePrescriptions > 0) {
      throw new BadRequestException('Cannot delete medication with active prescriptions');
    }

    // Soft delete by setting isActive to false
    return this.prisma.medication.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Stock Management
  /**
   *
   */
  async addStock(
    medicationId: string,
    data: {
      quantity: number;
      batchNumber?: string;
      expiryDate?: Date;
      costPrice?: number;
    },
    performedBy: string,
  ) {
    const medication = await this.prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    const previousStock = medication.stockQuantity;
    const newStock = previousStock + data.quantity;

    // Update medication stock
    await this.prisma.medication.update({
      where: { id: medicationId },
      data: {
        stockQuantity: newStock,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
      },
    });

    // Create inventory log
    return this.prisma.inventoryLog.create({
      data: {
        medicationId,
        action: 'RECEIVED',
        quantity: data.quantity,
        previousStock,
        newStock,
        reason: 'Stock addition',
        performedBy,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
        costPrice: data.costPrice,
      },
    });
  }

  /**
   *
   */
  async issueStock(
    medicationId: string,
    data: {
      quantity: number;
      reason: string;
      issuedTo?: string;
    },
    performedBy: string,
  ) {
    const medication = await this.prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    if (medication.stockQuantity < data.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const previousStock = medication.stockQuantity;
    const newStock = previousStock - data.quantity;

    // Update medication stock
    await this.prisma.medication.update({
      where: { id: medicationId },
      data: { stockQuantity: newStock },
    });

    // Create inventory log
    return this.prisma.inventoryLog.create({
      data: {
        medicationId,
        action: 'ISSUED',
        quantity: data.quantity,
        previousStock,
        newStock,
        reason: data.reason,
        performedBy,
        batchNumber: medication.batchNumber,
        expiryDate: medication.expiryDate,
      },
    });
  }

  /**
   *
   */
  async adjustStock(
    medicationId: string,
    data: {
      quantity: number;
      reason: string;
    },
    performedBy: string,
  ) {
    const medication = await this.prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    const previousStock = medication.stockQuantity;
    const newStock = data.quantity;

    // Update medication stock
    await this.prisma.medication.update({
      where: { id: medicationId },
      data: { stockQuantity: newStock },
    });

    // Create inventory log
    return this.prisma.inventoryLog.create({
      data: {
        medicationId,
        action: 'ADJUSTED',
        quantity: Math.abs(newStock - previousStock),
        previousStock,
        newStock,
        reason: data.reason,
        performedBy,
      },
    });
  }

  // Inventory Logs
  /**
   *
   */
  async getInventoryLogs(
    page: number = 1,
    limit: number = 10,
    medicationId?: string,
    action?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (medicationId) {
      where.medicationId = medicationId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        include: {
          medication: {
            select: {
              name: true,
              genericName: true,
              strength: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Reports
  /**
   *
   */
  async getLowStockReport() {
    return this.prisma.medication.findMany({
      where: {
        isActive: true,
        stockQuantity: {
          lte: this.prisma.medication.fields.reorderLevel,
        },
      },
      orderBy: { stockQuantity: 'asc' },
    });
  }

  /**
   *
   */
  async getExpiringSoonReport(days: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return this.prisma.medication.findMany({
      where: {
        isActive: true,
        expiryDate: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  /**
   *
   */
  async getStockMovementReport(startDate: string, endDate: string) {
    const logs = await this.prisma.inventoryLog.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        medication: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by medication and action
    const report = logs.reduce((acc, log) => {
      const key = `${log.medicationId}-${log.action}`;
      if (!acc[key]) {
        acc[key] = {
          medicationId: log.medicationId,
          medicationName: log.medication.name,
          category: log.medication.category,
          action: log.action,
          totalQuantity: 0,
          transactions: 0,
        };
      }
      acc[key].totalQuantity += log.quantity;
      acc[key].transactions += 1;
      return acc;
    }, {});

    return Object.values(report);
  }

  // Statistics
  /**
   *
   */
  async getInventoryStats() {
    const [totalMedications, lowStockMedications, outOfStockMedications, expiringSoon, totalValue] =
      await Promise.all([
        this.prisma.medication.count({ where: { isActive: true } }),
        this.prisma.medication.count({
          where: {
            isActive: true,
            stockQuantity: {
              lte: this.prisma.medication.fields.reorderLevel,
              gt: 0,
            },
          },
        }),
        this.prisma.medication.count({
          where: {
            isActive: true,
            stockQuantity: 0,
          },
        }),
        this.prisma.medication.count({
          where: {
            isActive: true,
            expiryDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              gte: new Date(),
            },
          },
        }),
        this.prisma.medication.aggregate({
          where: { isActive: true },
          _sum: {
            unitPrice: true,
          },
        }),
      ]);

    return {
      totalMedications,
      lowStockMedications,
      outOfStockMedications,
      expiringSoon,
      totalValue: totalValue._sum.unitPrice || 0,
    };
  }

  // Bulk operations
  /**
   *
   */
  async bulkImportMedications(medications: any[], createdBy: string) {
    const results = [];
    const errors = [];

    for (const medication of medications) {
      try {
        const result = await this.createMedication({
          ...medication,
          createdBy,
        });
        results.push(result);
      } catch (error) {
        errors.push({
          medication,
          error: error.message,
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
}
