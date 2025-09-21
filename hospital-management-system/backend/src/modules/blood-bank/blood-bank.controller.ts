import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { BloodBankService } from './blood-bank.service';
import { Roles } from '../../shared/decorators/roles.decorator';

@Controller('blood-bank')
export class BloodBankController {
  constructor(private readonly bloodBankService: BloodBankService) {}

  @Post('donors')
  @Roles('nurse', 'lab-technician', 'admin')
  async registerDonor(@Body() data: any) {
    return this.bloodBankService.registerDonor(data);
  }

  @Get('donors')
  @Roles('doctor', 'nurse', 'lab-technician', 'admin')
  async getDonors() {
    return this.bloodBankService.getDonors();
  }

  @Get('donors/:id')
  @Roles('doctor', 'nurse', 'lab-technician', 'admin')
  async getDonorById(@Param('id') id: string) {
    return this.bloodBankService.getDonorById(id);
  }

  @Post('donors/:id/donations')
  @Roles('nurse', 'lab-technician')
  async recordDonation(@Param('id') id: string, @Body() donationData: any) {
    return this.bloodBankService.recordDonation(id, donationData);
  }

  @Get('inventory')
  @Roles('doctor', 'nurse', 'lab-technician', 'admin')
  async getBloodInventory() {
    return this.bloodBankService.getBloodInventory();
  }

  @Get('inventory/:bloodType')
  @Roles('doctor', 'nurse', 'lab-technician', 'admin')
  async getBloodUnitsByType(@Param('bloodType') bloodType: string) {
    return this.bloodBankService.getBloodUnitsByType(bloodType);
  }

  @Post('crossmatch')
  @Roles('doctor', 'nurse')
  async requestBloodCrossmatch(@Body() data: any) {
    return this.bloodBankService.requestBloodCrossmatch(data);
  }

  @Put('crossmatch/:id')
  @Roles('lab-technician')
  async performCrossmatch(@Param('id') id: string, @Body() result: any) {
    return this.bloodBankService.performCrossmatch(id, result);
  }

  @Post('units/:id/issue')
  @Roles('nurse', 'lab-technician')
  async issueBloodUnit(@Param('id') id: string, @Body() body: { patientId: string }) {
    return this.bloodBankService.issueBloodUnit(id, body.patientId, 'current-user-id');
  }

  @Get('crossmatch/pending')
  @Roles('lab-technician', 'admin')
  async getCrossmatchRequests() {
    return this.bloodBankService.getCrossmatchRequests();
  }

  @Get('alerts/low-stock')
  @Roles('admin', 'lab-technician')
  async getLowStockAlerts() {
    return this.bloodBankService.getLowStockAlerts();
  }

  @Get('alerts/expiring')
  @Roles('admin', 'lab-technician')
  async getExpiringUnits(@Query('days') days: string = '7') {
    return this.bloodBankService.getExpiringUnits(parseInt(days));
  }
}
