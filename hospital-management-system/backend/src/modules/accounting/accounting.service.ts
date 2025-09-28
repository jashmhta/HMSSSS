import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  InvoiceStatus,
  ExpenseCategory,
  AssetCategory,
  AssetStatus,
  ReferralStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreateExpenseDto,
  CreateAssetDto,
  UpdateAssetDto,
  CreateReferralIncomeDto,
  AccountingReportDto,
  FinancialSummaryDto,
} from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  /**
   * Create a new invoice
   */
  async createInvoice(data: CreateInvoiceDto) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const dueDate = data.dueDate
      ? new Date(data.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: await this.generateInvoiceNumber(),
        patientId: data.patientId,
        amount: data.amount,
        status: InvoiceStatus.PENDING,
        issuedAt: new Date(),
        dueDate,
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Log compliance event
    await this.complianceService.logAuditEvent({
      userId: data.createdBy,
      action: 'INVOICE_CREATED',
      resource: 'invoices',
      resourceId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        patientId: data.patientId,
        amount: data.amount,
        dueDate: dueDate.toISOString(),
      },
      complianceFlags: ['FINANCIAL', 'PATIENT_DATA'],
    });

    return invoice;
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, data: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
        amount: data.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Log compliance event
    await this.complianceService.logAuditEvent({
      userId: data.updatedBy,
      action: 'INVOICE_UPDATED',
      resource: 'invoices',
      resourceId: id,
      details: {
        oldStatus: invoice.status,
        newStatus: data.status,
        oldAmount: invoice.amount,
        newAmount: data.amount,
      },
      complianceFlags: ['FINANCIAL'],
    });

    return updatedInvoice;
  }

  /**
   * Get invoices with filtering
   */
  async getInvoices(
    status?: InvoiceStatus,
    patientId?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          patient: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Create expense
   */
  async createExpense(data: CreateExpenseDto) {
    const expense = await this.prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        hospitalId: data.hospitalId,
      },
    });

    // Log compliance event
    await this.complianceService.logAuditEvent({
      userId: data.createdBy,
      action: 'EXPENSE_CREATED',
      resource: 'expenses',
      resourceId: expense.id,
      details: {
        description: data.description,
        amount: data.amount,
        category: data.category,
      },
      complianceFlags: ['FINANCIAL'],
    });

    return expense;
  }

  /**
   * Get expenses
   */
  async getExpenses(
    category?: ExpenseCategory,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (category) where.category = category;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create asset
   */
  async createAsset(data: CreateAssetDto) {
    const asset = await this.prisma.asset.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        value: data.value,
        purchaseDate: new Date(data.purchaseDate),
        depreciationRate: data.depreciationRate,
        currentValue: data.value, // Initial current value equals purchase value
        hospitalId: data.hospitalId,
      },
    });

    // Log compliance event
    await this.complianceService.logAuditEvent({
      userId: data.createdBy,
      action: 'ASSET_CREATED',
      resource: 'assets',
      resourceId: asset.id,
      details: {
        name: data.name,
        category: data.category,
        value: data.value,
      },
      complianceFlags: ['FINANCIAL', 'ASSET_MANAGEMENT'],
    });

    return asset;
  }

  /**
   * Update asset
   */
  async updateAsset(id: string, data: UpdateAssetDto) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const updatedAsset = await this.prisma.asset.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        value: data.value,
        depreciationRate: data.depreciationRate,
        status: data.status,
        currentValue: data.value || asset.currentValue,
      },
    });

    // Log compliance event
    await this.complianceService.logAuditEvent({
      userId: data.updatedBy,
      action: 'ASSET_UPDATED',
      resource: 'assets',
      resourceId: id,
      details: {
        name: data.name || asset.name,
        oldValue: asset.value,
        newValue: data.value,
      },
      complianceFlags: ['FINANCIAL', 'ASSET_MANAGEMENT'],
    });

    return updatedAsset;
  }

  /**
   * Get assets
   */
  async getAssets(
    category?: AssetCategory,
    status?: AssetStatus,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: 'desc' },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data: assets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create referral income
   */
  async createReferralIncome(data: CreateReferralIncomeDto) {
    const referralIncome = await this.prisma.referralIncome.create({
      data: {
        source: data.source,
        amount: data.amount,
        referralDate: data.referralDate ? new Date(data.referralDate) : new Date(),
        status: ReferralStatus.PENDING,
        hospitalId: data.hospitalId,
      },
    });

    // Log compliance event
    await this.complianceService.logAuditEvent({
      userId: data.createdBy,
      action: 'REFERRAL_INCOME_CREATED',
      resource: 'referral_incomes',
      resourceId: referralIncome.id,
      details: {
        source: data.source,
        amount: data.amount,
      },
      complianceFlags: ['FINANCIAL'],
    });

    return referralIncome;
  }

  /**
   * Get financial summary report
   */
  async getFinancialSummary(reportData: AccountingReportDto): Promise<FinancialSummaryDto> {
    const startDate = new Date(reportData.startDate);
    const endDate = new Date(reportData.endDate);

    // Get total revenue (invoices + referral income)
    const [invoiceRevenue, referralRevenue] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          issuedAt: { gte: startDate, lte: endDate },
          status: InvoiceStatus.PAID,
        },
        _sum: { amount: true },
      }),
      this.prisma.referralIncome.aggregate({
        where: {
          referralDate: { gte: startDate, lte: endDate },
          status: ReferralStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue =
      Number(invoiceRevenue._sum.amount?.toNumber() || 0) +
      Number(referralRevenue._sum.amount?.toNumber() || 0);

    // Get total expenses
    const expenses = await this.prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const totalExpenses = Number(expenses._sum.amount?.toNumber() || 0);
    const netIncome = totalRevenue - totalExpenses;

    // Get asset total value
    const assets = await this.prisma.asset.aggregate({
      where: {
        status: AssetStatus.ACTIVE,
      },
      _sum: { currentValue: true },
    });

    const totalAssets = Number(assets._sum.currentValue?.toNumber() || 0);

    // Get invoice statistics
    const [totalInvoices, paidInvoices, overdueInvoices] = await Promise.all([
      this.prisma.invoice.count({
        where: { issuedAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.invoice.count({
        where: {
          issuedAt: { gte: startDate, lte: endDate },
          status: InvoiceStatus.PAID,
        },
      }),
      this.prisma.invoice.count({
        where: {
          dueDate: { lt: new Date() },
          status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
        },
      }),
    ]);

    const pendingInvoices = totalInvoices - paidInvoices;

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      totalAssets,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      period: { startDate, endDate },
    };
  }

  /**
   * Get expense breakdown by category
   */
  async getExpenseBreakdown(startDate: Date, endDate: Date) {
    const expenses = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        expenseDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    return expenses.map(expense => ({
      category: expense.category,
      totalAmount: expense._sum.amount || 0,
      transactionCount: expense._count,
    }));
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(startDate: Date, endDate: Date) {
    // Monthly revenue data
    const monthlyRevenue = await this.prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "issuedAt") as month,
        SUM(amount) as revenue
      FROM invoices
      WHERE "issuedAt" >= ${startDate} AND "issuedAt" <= ${endDate} AND status = 'PAID'
      GROUP BY DATE_TRUNC('month', "issuedAt")
      ORDER BY month
    `;

    return monthlyRevenue;
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        issuedAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });

    return `INV${year}${(count + 1).toString().padStart(6, '0')}`;
  }
}
