/*[object Object]*/
import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../../shared/decorators/roles.decorator';

import { BloodBankService } from './blood-bank.service';

/**
 *
 */
@Controller('blood-bank')
export class BloodBankController {
  /**
   *
   */
  constructor(private readonly bloodBankService: BloodBankService) {}

  /**
   *
   */
  @Post('donors')
  @Roles(UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async registerDonor(@Body() data: any) {
    return this.bloodBankService.registerDonor(data);
  }

  /**
   *
   */
  @Get('donors')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async getDonors() {
    return this.bloodBankService.getDonors();
  }

  /**
   *
   */
  @Get('donors/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async getDonorById(@Param('id') id: string) {
    return this.bloodBankService.getDonorById(id);
  }

  /**
   *
   */
  @Post('donors/:id/donations')
  @Roles(UserRole.NURSE, UserRole.LAB_TECHNICIAN)
  async recordDonation(@Param('id') id: string, @Body() donationData: any) {
    return this.bloodBankService.recordDonation(id, donationData);
  }

  /**
   *
   */
  @Get('inventory')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async getBloodInventory() {
    return this.bloodBankService.getBloodInventory();
  }

  /**
   *
   */
  @Get('inventory/:bloodType')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async getBloodUnitsByType(@Param('bloodType') bloodType: string) {
    return this.bloodBankService.getBloodUnitsByType(bloodType);
  }

  /**
   *
   */
  @Post('crossmatch')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  async requestBloodCrossmatch(@Body() data: any) {
    return this.bloodBankService.requestBloodCrossmatch(data);
  }

  /**
   *
   */
  @Put('crossmatch/:id')
  @Roles(UserRole.LAB_TECHNICIAN)
  async performCrossmatch(@Param('id') id: string, @Body() result: any) {
    return this.bloodBankService.performCrossmatch(id, result);
  }

  /**
   *
   */
  @Post('units/:id/issue')
  @Roles(UserRole.NURSE, UserRole.LAB_TECHNICIAN)
  async issueBloodUnit(@Param('id') id: string, @Body() body: { patientId: string }) {
    return this.bloodBankService.issueBloodUnit(id, body.patientId, 'current-user-id');
  }

  /**
   *
   */
  @Get('crossmatch/pending')
  @Roles(UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  async getCrossmatchRequests() {
    return this.bloodBankService.getCrossmatchRequests();
  }

  /**
   *
   */
  @Get('alerts/low-stock')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  async getLowStockAlerts() {
    return this.bloodBankService.getLowStockAlerts();
  }

  /**
   *
   */
  @Get('alerts/expiring')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  async getExpiringUnits(@Query('days') days: string = '7') {
    return this.bloodBankService.getExpiringUnits(parseInt(days));
  }
}
