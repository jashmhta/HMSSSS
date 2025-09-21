import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PharmacyService {
  constructor(private prisma: PrismaService) {}

  // Medication Management
  async createMedication(data: {
    name: string;
    genericName?: string;
    brandName?: string;
    dosageForm: string;
    strength: string;
    manufacturer?: string;
    batchNumber?: string;
    expiryDate?: Date;
    stockQuantity: number;
    reorderLevel: number;
    unitPrice: number;
    category?: string;
    requiresPrescription?: boolean;
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
        stockQuantity: data.stockQuantity,
        reorderLevel: data.reorderLevel,
        unitPrice: data.unitPrice,
        category: data.category,
        requiresPrescription: data.requiresPrescription ?? true,
      },
    });
  }

  async findAllMedications(filters?: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, ...whereFilters } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (whereFilters.search) {
      where.OR = [
        { name: { contains: whereFilters.search, mode: 'insensitive' } },
        { genericName: { contains: whereFilters.search, mode: 'insensitive' } },
        { brandName: { contains: whereFilters.search, mode: 'insensitive' } },
      ];
    }

    if (whereFilters.category) {
      where.category = whereFilters.category;
    }

    if (whereFilters.lowStock) {
      where.stockQuantity = { lte: { reorderLevel: true } };
    }

    if (whereFilters.expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiryDate = { lte: thirtyDaysFromNow };
    }

    const [medications, total] = await Promise.all([
      this.prisma.medication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
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

  async findMedicationById(id: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
      include: {
        prescriptions: {
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            doctor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { prescribedDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    return medication;
  }

  async updateMedication(
    id: string,
    data: Partial<{
      name: string;
      genericName: string;
      brandName: string;
      strength: string;
      manufacturer: string;
      batchNumber: string;
      expiryDate: Date;
      stockQuantity: number;
      reorderLevel: number;
      unitPrice: number;
      category: string;
      requiresPrescription: boolean;
      isActive: boolean;
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
      data,
    });
  }

  async deleteMedication(id: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    return this.prisma.medication.delete({
      where: { id },
    });
  }

  // Inventory Management
  async updateStock(
    id: string,
    quantity: number,
    action: 'add' | 'subtract',
    reason?: string,
    performedBy?: string,
  ) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    let newStock: number;
    if (action === 'add') {
      newStock = medication.stockQuantity + quantity;
    } else {
      if (medication.stockQuantity < quantity) {
        throw new BadRequestException('Insufficient stock');
      }
      newStock = medication.stockQuantity - quantity;
    }

    // Update medication stock
    await this.prisma.medication.update({
      where: { id },
      data: { stockQuantity: newStock },
    });

    // Log inventory change
    return this.prisma.inventoryLog.create({
      data: {
        medicationId: id,
        action: action === 'add' ? 'RECEIVED' : 'ISSUED',
        quantity: Math.abs(quantity),
        previousStock: medication.stockQuantity,
        newStock,
        reason,
        performedBy,
      },
    });
  }

  async getLowStockMedications() {
    return this.prisma.medication.findMany({
      where: {
        stockQuantity: {
          lte: this.prisma.medication.fields.reorderLevel,
        },
        isActive: true,
      },
      orderBy: { stockQuantity: 'asc' },
    });
  }

  async getExpiringMedications(days: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return this.prisma.medication.findMany({
      where: {
        expiryDate: {
          lte: expiryDate,
          gte: new Date(),
        },
        isActive: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // Prescription Management
  async createPrescription(data: {
    patientId: string;
    doctorId: string;
    medicationId: string;
    dosage: string;
    frequency: string;
    duration: number;
    quantity: number;
    instructions?: string;
  }) {
    // Check if medication exists and has sufficient stock
    const medication = await this.prisma.medication.findUnique({
      where: { id: data.medicationId },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    if (medication.stockQuantity < data.quantity) {
      throw new BadRequestException('Insufficient medication stock');
    }

    return this.prisma.prescription.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        medicationId: data.medicationId,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: data.duration,
        quantity: data.quantity,
        instructions: data.instructions,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        medication: true,
      },
    });
  }

  async dispensePrescription(id: string, pharmacistId: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { medication: true },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.status !== 'ACTIVE') {
      throw new BadRequestException('Prescription is not active');
    }

    if (prescription.medication.stockQuantity < prescription.quantity) {
      throw new BadRequestException('Insufficient medication stock');
    }

    // Update prescription status
    await this.prisma.prescription.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        dispensedDate: new Date(),
        dispensedBy: pharmacistId,
      },
    });

    // Update medication stock
    await this.updateStock(
      prescription.medicationId,
      prescription.quantity,
      'subtract',
      `Dispensed prescription ${id}`,
      pharmacistId,
    );

    return { message: 'Prescription dispensed successfully' };
  }

  async getPrescriptionById(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        medication: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  async getPatientPrescriptions(patientId: string, status?: string) {
    const where: any = { patientId };
    if (status) {
      where.status = status;
    }

    return this.prisma.prescription.findMany({
      where,
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        medication: true,
      },
      orderBy: { prescribedDate: 'desc' },
    });
  }

  // Analytics and Reporting
  async getPharmacyStats() {
    const [totalMedications, lowStockCount, expiringCount, totalPrescriptions] = await Promise.all([
      this.prisma.medication.count({ where: { isActive: true } }),
      this.prisma.medication.count({
        where: {
          stockQuantity: { lte: this.prisma.medication.fields.reorderLevel },
          isActive: true,
        },
      }),
      this.prisma.medication.count({
        where: {
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          isActive: true,
        },
      }),
      this.prisma.prescription.count({
        where: {
          prescribedDate: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
    ]);

    return {
      totalMedications,
      lowStockCount,
      expiringCount,
      totalPrescriptions,
    };
  }
}
