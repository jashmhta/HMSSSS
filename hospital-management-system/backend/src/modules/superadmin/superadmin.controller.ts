/*[object Object]*/
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { SuperadminService } from './superadmin.service';

/**
 *
 */
@Controller('superadmin')
export class SuperadminController {
  /**
   *
   */
  constructor(private readonly superadminService: SuperadminService) {}

  /**
   *
   */
  @Get('hospitals')
  async getAllHospitals() {
    return this.superadminService.getAllHospitals();
  }

  /**
   *
   */
  @Post('hospitals')
  async createHospital(@Body() data: any) {
    return this.superadminService.createHospital(data);
  }

  /**
   *
   */
  @Put('hospitals/:id')
  async updateHospital(@Param('id') id: string, @Body() data: any) {
    return this.superadminService.updateHospital(id, data);
  }

  /**
   *
   */
  @Delete('hospitals/:id')
  async deactivateHospital(@Param('id') id: string) {
    return this.superadminService.deactivateHospital(id);
  }

  /**
   *
   */
  @Get('users')
  async getHospitalUsers() {
    return this.superadminService.getHospitalUsers();
  }

  /**
   *
   */
  @Post('users')
  async createHospitalUser(@Body() userData: any) {
    return this.superadminService.createHospitalUser(userData);
  }

  /**
   *
   */
  @Put('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() roleData: { role: string }) {
    // Validate and convert string role to UserRole enum
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(roleData.role as UserRole)) {
      throw new BadRequestException(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
    }

    return this.superadminService.updateUserRole(id, roleData.role as UserRole);
  }

  /**
   *
   */
  @Post('users/:id/reset-password')
  async resetUserPassword(@Param('id') id: string) {
    return this.superadminService.resetUserPassword(id);
  }

  /**
   *
   */
  @Get('analytics')
  async getSystemAnalytics() {
    return this.superadminService.getSystemAnalytics();
  }

  /**
   *
   */
  @Post('hospitals/:id/modules/:module/enable')
  async enableModuleForHospital(@Param('id') id: string, @Param('module') module: string) {
    return this.superadminService.enableModuleForHospital(id, module);
  }

  /**
   *
   */
  @Post('hospitals/:id/modules/:module/disable')
  async disableModuleForHospital(@Param('id') id: string, @Param('module') module: string) {
    return this.superadminService.disableModuleForHospital(id, module);
  }

  /**
   *
   */
  @Get('hospitals/:id/subscription')
  async getHospitalSubscription(@Param('id') id: string) {
    return this.superadminService.getHospitalSubscription(id);
  }

  /**
   *
   */
  @Put('hospitals/:id/subscription')
  async updateHospitalSubscription(@Param('id') id: string, @Body() subscriptionData: any) {
    return this.superadminService.updateHospitalSubscription(id, subscriptionData);
  }

  /**
   *
   */
  @Get('audit-logs')
  async getAuditLogs(@Query() filters: any) {
    return this.superadminService.getAuditLogs(filters);
  }

  /**
   *
   */
  @Get('reports/system')
  async generateSystemReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.superadminService.generateSystemReport(new Date(startDate), new Date(endDate));
  }
}
