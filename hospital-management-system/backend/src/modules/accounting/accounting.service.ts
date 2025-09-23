/*[object Object]*/
import * as fs from 'fs';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   *
   */
  async exportToTally(startDate: Date, endDate: Date, hospitalId: string) {
    // Get all financial transactions for the period
    const transactions = await this.getTransactionsForPeriod(startDate, endDate, hospitalId);

    // Generate Tally XML format
    const tallyXML = this.generateTallyXML(transactions, hospitalId);

    // Save to file
    const filename = `tally_export_${hospitalId}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.xml`;
    const filepath = path.join(process.cwd(), 'exports', filename);

    // Ensure exports directory exists
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }

    fs.writeFileSync(filepath, tallyXML);

    return {
      filename,
      filepath,
      transactionCount: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    };
  }

  /**
   *
   */
  async exportToExcel(startDate: Date, endDate: Date, hospitalId: string) {
    // Get financial data
    const data = await this.getFinancialReport(startDate, endDate, hospitalId);

    // Generate Excel format (simplified - in real implementation use exceljs or similar)
    const excelData = this.generateExcelData(data);

    const filename = `financial_report_${hospitalId}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.xlsx`;
    const filepath = path.join(process.cwd(), 'exports', filename);

    // In a real implementation, you'd use a library like exceljs to create the actual Excel file
    // For now, we'll just return the data structure

    return {
      filename,
      data: excelData,
      filepath,
    };
  }

  /**
   *
   */
  async getReferralIncome(startDate: Date, endDate: Date) {
    return this.prisma.referralIncome.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   *
   */
  async getOutsourcedServicesAccounting(startDate: Date, endDate: Date) {
    return this.prisma.outsourcedService.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   *
   */
  async getDepartmentWiseRevenue(startDate: Date, endDate: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: 'PAID',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // For now, return total revenue without department breakdown
    const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);

    return [
      {
        department: 'ALL',
        revenue: totalRevenue,
      },
    ];
  }

  /**
   *
   */
  async calculateBreakEvenAnalysis(hospitalId: string) {
    // Get fixed costs
    const fixedCosts = await this.prisma.fixedCost.findMany({
      where: { hospitalId },
    });

    // Get variable costs and revenue data
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const revenueData = await this.prisma.invoice.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: lastYear },
      },
      select: { amount: true, createdAt: true },
    });

    const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);
    const totalRevenue = revenueData.reduce((sum, invoice) => sum + Number(invoice.amount), 0);

    // Calculate break-even point
    const averageRevenuePerMonth = totalRevenue / 12;
    const breakEvenMonths = totalFixedCosts / averageRevenuePerMonth;

    return {
      totalFixedCosts,
      averageMonthlyRevenue: averageRevenuePerMonth,
      breakEvenPointMonths: breakEvenMonths,
      breakEvenAchieved: breakEvenMonths <= 12,
    };
  }

  /**
   *
   */
  async getAssetTracking(hospitalId: string) {
    return this.prisma.asset.findMany({
      where: { hospitalId },
    });
  }

  /**
   *
   */
  async calculateAssetDepreciation(assetId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) throw new Error('Asset not found');

    const currentDate = new Date();
    const purchaseDate = asset.purchaseDate;
    const usefulLife = 10; // Default useful life in years

    // Calculate straight-line depreciation
    const totalDepreciation = Number(asset.value) - 0; // Use asset value as purchase cost
    const annualDepreciation = totalDepreciation / usefulLife;

    const yearsElapsed =
      (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const accumulatedDepreciation = Math.min(annualDepreciation * yearsElapsed, totalDepreciation);
    const currentValue = Number(asset.value) - accumulatedDepreciation;

    return {
      assetId,
      originalCost: Number(asset.value),
      accumulatedDepreciation,
      currentValue,
      annualDepreciation,
      depreciationMethod: 'Straight Line',
    };
  }

  /**
   *
   */
  async getProfitLossReport(startDate: Date, endDate: Date, hospitalId: string) {
    const [revenue, expenses, fixedCosts, variableCosts] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.fixedCost.findMany({ where: { isActive: true } }),
      this.prisma.variableCost.findMany(),
    ]);

    const totalRevenue = revenue._sum.amount ? Number(revenue._sum.amount) : 0;
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);
    const totalVariableCosts = variableCosts.reduce((sum, cost) => sum + Number(cost.unitCost), 0);

    const grossProfit = totalRevenue - totalVariableCosts;
    const netProfit = grossProfit - totalFixedCosts;

    return {
      period: { startDate, endDate },
      revenue: totalRevenue,
      expenses: {
        fixed: totalFixedCosts,
        variable: totalVariableCosts,
        total: totalExpenses,
      },
      grossProfit,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    };
  }

  /**
   *
   */
  private async getTransactionsForPeriod(startDate: Date, endDate: Date, hospitalId: string) {
    const transactions = await this.prisma.invoice.findMany({
      where: {
        status: 'PAID',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return transactions.map(invoice => ({
      date: invoice.createdAt,
      voucherType: 'Sales',
      voucherNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      partyName: 'Patient', // Simplified since we don't have patient relation loaded
      narration: `Payment for services`,
    }));
  }

  /**
   *
   */
  private generateTallyXML(transactions: any[], hospitalId: string): string {
    const voucherXML = transactions
      .map(
        transaction => `
      <VOUCHER>
        <DATE>${transaction.date.toISOString().split('T')[0]}</DATE>
        <VOUCHERTYPE>${transaction.voucherType}</VOUCHERTYPE>
        <VOUCHERNUMBER>${transaction.voucherNumber}</VOUCHERNUMBER>
        <PARTYNAME>${transaction.partyName}</PARTYNAME>
        <AMOUNT>${transaction.amount}</AMOUNT>
        <NARRATION>${transaction.narration}</NARRATION>
      </VOUCHER>
    `,
      )
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <VOUCHER>
    <VOUCHERTYPE>Sales</VOUCHERTYPE>
    <VOUCHERNUMBER>001</VOUCHERNUMBER>
    <DATE>${new Date().toISOString().split('T')[0]}</DATE>
    <NARRATION>Hospital Management System Export</NARRATION>
    ${voucherXML}
  </VOUCHER>
</TALLYMESSAGE>`;
  }

  /**
   *
   */
  private async getFinancialReport(startDate: Date, endDate: Date, hospitalId: string) {
    const [invoices, expenses, assets] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        include: { patient: true },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.asset.findMany({ where: { hospitalId } }),
    ]);

    return {
      invoices,
      expenses,
      assets,
      period: { startDate, endDate },
    };
  }

  /**
   *
   */
  private generateExcelData(data: any) {
    // Simplified Excel data structure
    return {
      sheets: [
        {
          name: 'Invoices',
          data: data.invoices.map(inv => [
            inv.id,
            inv.patient.name,
            inv.totalAmount,
            inv.status,
            inv.createdAt,
          ]),
        },
        {
          name: 'Expenses',
          data: data.expenses.map(exp => [
            exp.id,
            exp.description,
            exp.amount,
            exp.category,
            exp.date,
          ]),
        },
        {
          name: 'Assets',
          data: data.assets.map(asset => [
            asset.id,
            asset.name,
            asset.purchaseCost,
            asset.currentValue,
            asset.purchaseDate,
          ]),
        },
      ],
    };
  }
}
