import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RBACService } from '../auth/rbac.service';
import { ComplianceService } from '../compliance/compliance.service';

export interface BillItem {
  itemType:
    | 'CONSULTATION'
    | 'PROCEDURE'
    | 'LAB_TEST'
    | 'RADIOLOGY_TEST'
    | 'MEDICATION'
    | 'ROOM_CHARGE'
    | 'OTHER';
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  department: string;
}

export interface PackageBill {
  packageName: string;
  packageId: string;
  items: BillItem[];
  totalPackagePrice: number;
  validityDays: number;
}

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private rbacService: RBACService,
    private complianceService: ComplianceService,
  ) {}

  async createInvoice(data: any) {
    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    return this.prisma.invoice.create({
      data: {
        ...data,
        totalAmount,
        status: 'PENDING',
      },
      include: { patient: true, items: true },
    });
  }

  async getInvoices() {
    return this.prisma.invoice.findMany({
      include: { patient: true, items: true, payments: true },
    });
  }

  async getInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: true,
        payments: true,
        insuranceClaims: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async updateInvoice(id: string, data: any) {
    return this.prisma.invoice.update({
      where: { id },
      data,
    });
  }

  async addInvoiceItem(invoiceId: string, item: any) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // Add item and update total
    const newItem = await this.prisma.invoiceItem.create({
      data: {
        invoiceId,
        ...item,
      },
    });

    await this.updateInvoiceTotal(invoiceId);

    return newItem;
  }

  async applyDiscount(invoiceId: string, discountData: any) {
    // Check user permissions (should be admin/manager only)
    const discount =
      discountData.type === 'PERCENTAGE'
        ? (discountData.amount / 100) * (await this.getInvoiceTotal(invoiceId))
        : discountData.amount;

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        discountAmount: discount,
        discountReason: discountData.reason,
      },
    });
  }

  async processPayment(invoiceId: string, paymentData: any) {
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        ...paymentData,
      },
    });

    // Update invoice status
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;
    const status = totalPaid >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
    });

    return payment;
  }

  async getOPDBilling(packageId?: string) {
    const where = packageId ? { packageId } : {};
    return this.prisma.oPDBilling.findMany({
      where,
      include: { patient: true, package: true, items: true },
    });
  }

  async getIPDBilling(admissionId: string) {
    return this.prisma.iPDBilling.findMany({
      where: { admissionId },
      include: { admission: { include: { patient: true } }, items: true },
    });
  }

  async getEmergencyBilling(visitId: string) {
    return this.prisma.emergencyBilling.findMany({
      where: { visitId },
      include: { visit: { include: { patient: true } }, items: true },
    });
  }

  async generateDepartmentReport(department: string, startDate: Date, endDate: Date) {
    return this.prisma.invoiceItem.groupBy({
      by: ['serviceType'],
      where: {
        invoice: {
          department,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        amount: true,
      },
    });
  }

  async getRevenueAnalytics(startDate: Date, endDate: Date) {
    const revenue = await this.prisma.invoice.groupBy({
      by: ['department'],
      where: {
        status: 'PAID',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    return revenue;
  }

  /**
   * Create comprehensive bill with department-wise items
   */
  async createComprehensiveBill(data: {
    patientId: string;
    billType: 'OPD' | 'IPD' | 'EMERGENCY' | 'PACKAGE';
    items: BillItem[];
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      coveragePercent: number;
    };
    createdBy: string;
    dueDate?: Date;
    notes?: string;
  }) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Calculate totals
    const { subtotal, taxAmount, discountAmount, totalAmount } = this.calculateBillTotals(
      data.items,
    );

    // Generate bill number
    const billNumber = await this.generateBillNumber();

    // Create bill
    const bill = await this.prisma.bill.create({
      data: {
        patientId: data.patientId,
        billNumber,
        billDate: new Date(),
        dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'PENDING',
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        balanceAmount: totalAmount,
        notes: data.notes,
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

    // Create bill items
    for (const item of data.items) {
      await this.prisma.billItem.create({
        data: {
          billId: bill.id,
          itemType: item.itemType,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        },
      });
    }

    // Log bill creation
    await this.complianceService.logAuditEvent({
      userId: data.createdBy,
      action: 'BILL_CREATED',
      resource: 'bills',
      resourceId: bill.id,
      details: {
        billNumber,
        patientId: data.patientId,
        billType: data.billType,
        totalAmount,
        itemCount: data.items.length,
      },
      complianceFlags: ['FINANCIAL'],
    });

    return bill;
  }

  /**
   * Create package-based bill
   */
  async createPackageBill(data: {
    patientId: string;
    packageBill: PackageBill;
    createdBy: string;
    insuranceInfo?: any;
  }) {
    const items: BillItem[] = data.packageBill.items.map(item => ({
      ...item,
      department: 'PACKAGE',
    }));

    return this.createComprehensiveBill({
      patientId: data.patientId,
      billType: 'PACKAGE',
      items,
      insuranceInfo: data.insuranceInfo,
      createdBy: data.createdBy,
      notes: `Package: ${data.packageBill.packageName} (${data.packageBill.validityDays} days validity)`,
    });
  }

  /**
   * Apply discount with permission check
   */
  async applyDiscount(
    billId: string,
    discountData: {
      discountPercent?: number;
      discountAmount?: number;
      reason: string;
      approvedBy: string;
    },
  ) {
    // Check permissions for discount application
    const canApplyDiscount = await this.rbacService.hasPermission(
      discountData.approvedBy,
      'bills',
      'discount',
    );
    if (!canApplyDiscount) {
      throw new ForbiddenException('Insufficient permissions to apply discount');
    }

    // Validate business rules
    await this.rbacService.validateBusinessRules(
      discountData.approvedBy,
      'discount',
      'bills',
      discountData,
    );

    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: { items: true },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    if (bill.status !== 'PENDING') {
      throw new BadRequestException('Cannot apply discount to non-pending bill');
    }

    let discountAmount = 0;
    if (discountData.discountPercent) {
      discountAmount = (bill.subtotal * discountData.discountPercent) / 100;
    } else if (discountData.discountAmount) {
      discountAmount = discountData.discountAmount;
    }

    // Update bill with discount
    const updatedBill = await this.prisma.bill.update({
      where: { id: billId },
      data: {
        discountAmount,
        totalAmount: bill.subtotal + bill.taxAmount - discountAmount,
        balanceAmount: bill.subtotal + bill.taxAmount - discountAmount - bill.paidAmount,
        notes:
          (bill.notes || '') + `\nDiscount applied: ${discountAmount} (${discountData.reason})`,
      },
    });

    // Log discount application
    await this.complianceService.logAuditEvent({
      userId: discountData.approvedBy,
      action: 'DISCOUNT_APPLIED',
      resource: 'bills',
      resourceId: billId,
      details: {
        discountAmount,
        discountPercent: discountData.discountPercent,
        reason: discountData.reason,
        billTotal: updatedBill.totalAmount,
      },
      complianceFlags: ['FINANCIAL'],
    });

    return updatedBill;
  }

  /**
   * Process payment with multiple methods
   */
  async processPayment(
    billId: string,
    paymentData: {
      amount: number;
      paymentMethod: 'CASH' | 'CARD' | 'INSURANCE' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
      paymentDate?: Date;
      referenceNumber?: string;
      notes?: string;
      processedBy: string;
    },
  ) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    if (bill.status === 'PAID') {
      throw new BadRequestException('Bill is already fully paid');
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        billId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate || new Date(),
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        processedBy: paymentData.processedBy,
      },
    });

    // Update bill payment status
    const newPaidAmount = bill.paidAmount + paymentData.amount;
    const newBalanceAmount = bill.totalAmount - newPaidAmount;

    let newStatus = bill.status;
    if (newBalanceAmount <= 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    await this.prisma.bill.update({
      where: { id: billId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate || new Date(),
        status: newStatus,
      },
    });

    // Log payment
    await this.complianceService.logAuditEvent({
      userId: paymentData.processedBy,
      action: 'PAYMENT_PROCESSED',
      resource: 'bills',
      resourceId: billId,
      details: {
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        newBalance: newBalanceAmount,
      },
      complianceFlags: ['FINANCIAL'],
    });

    return payment;
  }

  /**
   * Get department-wise billing report
   */
  async getDepartmentBillingReport(department: string, startDate: Date, endDate: Date) {
    const bills = await this.prisma.bill.findMany({
      where: {
        items: {
          some: {
            department,
          },
        },
        billDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          where: { department },
        },
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    const summary = {
      department,
      period: { startDate, endDate },
      totalBills: bills.length,
      totalRevenue: bills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      totalPaid: bills.reduce((sum, bill) => sum + bill.paidAmount, 0),
      outstandingAmount: bills.reduce((sum, bill) => sum + bill.balanceAmount, 0),
      paidBills: bills.filter(b => b.status === 'PAID').length,
      pendingBills: bills.filter(b => b.status === 'PENDING').length,
      partiallyPaidBills: bills.filter(b => b.status === 'PARTIALLY_PAID').length,
    };

    return {
      summary,
      bills,
    };
  }

  /**
   * Get insurance claims and processing
   */
  async processInsuranceClaim(
    billId: string,
    claimData: {
      insuranceProvider: string;
      claimAmount: number;
      approvedAmount?: number;
      claimStatus: 'PENDING' | 'APPROVED' | 'DENIED' | 'PARTIALLY_APPROVED';
      claimNumber: string;
      processedBy: string;
      notes?: string;
    },
  ) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Create insurance claim
    const claim = await this.prisma.insuranceClaim.create({
      data: {
        billId,
        insuranceProvider: claimData.insuranceProvider,
        claimAmount: claimData.claimAmount,
        approvedAmount: claimData.approvedAmount || 0,
        claimStatus: claimData.claimStatus,
        claimNumber: claimData.claimNumber,
        claimDate: new Date(),
        processedBy: claimData.processedBy,
        notes: claimData.notes,
      },
    });

    // Update bill with insurance information
    if (claimData.claimStatus === 'APPROVED' || claimData.claimStatus === 'PARTIALLY_APPROVED') {
      const insuranceCoverage = claimData.approvedAmount || 0;
      await this.prisma.bill.update({
        where: { id: billId },
        data: {
          balanceAmount: bill.balanceAmount - insuranceCoverage,
          notes:
            (bill.notes || '') +
            `\nInsurance claim ${claimData.claimNumber}: ${insuranceCoverage} approved`,
        },
      });
    }

    // Log insurance claim
    await this.complianceService.logAuditEvent({
      userId: claimData.processedBy,
      action: 'INSURANCE_CLAIM_PROCESSED',
      resource: 'bills',
      resourceId: billId,
      details: {
        claimNumber: claimData.claimNumber,
        claimAmount: claimData.claimAmount,
        approvedAmount: claimData.approvedAmount,
        status: claimData.claimStatus,
      },
      complianceFlags: ['FINANCIAL', 'INSURANCE'],
    });

    return claim;
  }

  /**
   * Generate revenue analytics
   */
  async getRevenueAnalytics(startDate: Date, endDate: Date) {
    const bills = await this.prisma.bill.findMany({
      where: {
        billDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'PAID',
      },
      include: {
        items: true,
      },
    });

    // Group by department
    const departmentRevenue = bills.reduce((acc, bill) => {
      bill.items.forEach(item => {
        if (!acc[item.department]) {
          acc[item.department] = {
            totalRevenue: 0,
            billCount: 0,
            itemCount: 0,
          };
        }
        acc[item.department].totalRevenue += item.totalPrice;
        acc[item.department].billCount += 1;
        acc[item.department].itemCount += 1;
      });
      return acc;
    }, {});

    // Payment method breakdown
    const paymentMethods = bills.reduce((acc, bill) => {
      const method = bill.paymentMethod || 'UNKNOWN';
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count += 1;
      acc[method].total += bill.totalAmount;
      return acc;
    }, {});

    return {
      period: { startDate, endDate },
      totalRevenue: bills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      totalBills: bills.length,
      averageBillValue:
        bills.length > 0
          ? bills.reduce((sum, bill) => sum + bill.totalAmount, 0) / bills.length
          : 0,
      departmentBreakdown: departmentRevenue,
      paymentMethodBreakdown: paymentMethods,
    };
  }

  // Helper methods

  private calculateBillTotals(items: BillItem[]) {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (const item of items) {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;

      // Apply discount
      const discountAmount =
        item.discountAmount ||
        (item.discountPercent ? (itemTotal * item.discountPercent) / 100 : 0);
      totalDiscount += discountAmount;

      // Apply tax on discounted amount
      const taxableAmount = itemTotal - discountAmount;
      const taxAmount = item.taxPercent ? (taxableAmount * item.taxPercent) / 100 : 0;
      totalTax += taxAmount;
    }

    return {
      subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      totalAmount: subtotal - totalDiscount + totalTax,
    };
  }

  private async generateBillNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const count = await this.prisma.bill.count({
      where: {
        billDate: {
          gte: new Date(year, new Date().getMonth(), 1),
          lt: new Date(year, new Date().getMonth() + 1, 1),
        },
      },
    });

    return `BILL${year}${month}${(count + 1).toString().padStart(4, '0')}`;
  }

  private async updateInvoiceTotal(invoiceId: string) {
    const items = await this.prisma.invoiceItem.findMany({
      where: { invoiceId },
    });

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { totalAmount: total },
    });
  }

  /**
   * Get all bills with filtering
   */
  async getAllBills(filters: {
    patientId?: string;
    status?: string;
    department?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    if (filters.department) {
      where.items = {
        some: { department: filters.department },
      };
    }
    if (filters.startDate || filters.endDate) {
      where.billDate = {};
      if (filters.startDate) where.billDate.gte = filters.startDate;
      if (filters.endDate) where.billDate.lte = filters.endDate;
    }

    const [bills, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        include: {
          patient: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          items: true,
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { billDate: 'desc' },
      }),
      this.prisma.bill.count({ where }),
    ]);

    return {
      bills,
      total,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    };
  }

  /**
   * Get bill by ID
   */
  async getBillById(billId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
        items: true,
        payments: true,
        insuranceClaims: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return bill;
  }

  /**
   * Get patient bills
   */
  async getPatientBills(patientId: string) {
    return this.getAllBills({ patientId });
  }

  private async getInvoiceTotal(invoiceId: string): Promise<number> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });
    return invoice.totalAmount;
  }
}
