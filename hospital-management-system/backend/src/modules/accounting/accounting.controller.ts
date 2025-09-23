/*[object Object]*/
import { Controller, Get, Post, Query } from '@nestjs/common';

import { AccountingService } from './accounting.service';

/**
 *
 */
@Controller('accounting')
export class AccountingController {
  /**
   *
   */
  constructor(private readonly accountingService: AccountingService) {}

  /**
   *
   */
  @Get('tally/export')
  async exportToTally(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('hospitalId') hospitalId: string,
  ) {
    return this.accountingService.exportToTally(new Date(startDate), new Date(endDate), hospitalId);
  }

  /**
   *
   */
  @Get('excel/export')
  async exportToExcel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('hospitalId') hospitalId: string,
  ) {
    return this.accountingService.exportToExcel(new Date(startDate), new Date(endDate), hospitalId);
  }

  /**
   *
   */
  @Get('referral-income')
  async getReferralIncome(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountingService.getReferralIncome(new Date(startDate), new Date(endDate));
  }

  /**
   *
   */
  @Get('outsourced-services')
  async getOutsourcedServicesAccounting(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountingService.getOutsourcedServicesAccounting(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   *
   */
  @Get('department-revenue')
  async getDepartmentWiseRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountingService.getDepartmentWiseRevenue(new Date(startDate), new Date(endDate));
  }

  /**
   *
   */
  @Get('break-even')
  async calculateBreakEvenAnalysis(@Query('hospitalId') hospitalId: string) {
    return this.accountingService.calculateBreakEvenAnalysis(hospitalId);
  }

  /**
   *
   */
  @Get('assets')
  async getAssetTracking(@Query('hospitalId') hospitalId: string) {
    return this.accountingService.getAssetTracking(hospitalId);
  }

  /**
   *
   */
  @Get('assets/:id/depreciation')
  async calculateAssetDepreciation(@Query('id') id: string) {
    return this.accountingService.calculateAssetDepreciation(id);
  }

  /**
   *
   */
  @Get('profit-loss')
  async getProfitLossReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('hospitalId') hospitalId: string,
  ) {
    return this.accountingService.getProfitLossReport(
      new Date(startDate),
      new Date(endDate),
      hospitalId,
    );
  }
}
