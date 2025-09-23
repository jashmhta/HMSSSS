/*[object Object]*/
import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';

import { EmergencyService } from './emergency.service';

/**
 *
 */
@Controller('emergency')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmergencyController {
  /**
   *
   */
  constructor(private readonly emergencyService: EmergencyService) {}

  /**
   *
   */
  @Post('visits')
  @Roles(UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN)
  async registerEmergencyPatient(@Body() data: any) {
    return this.emergencyService.registerEmergencyPatient(data);
  }

  /**
   *
   */
  @Get('visits')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  async getEmergencyVisits() {
    return this.emergencyService.getEmergencyVisits();
  }

  /**
   *
   */
  @Get('visits/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  async getEmergencyVisitById(@Param('id') id: string) {
    return this.emergencyService.getEmergencyVisitById(id);
  }

  /**
   *
   */
  @Put('visits/:id/triage')
  @Roles(UserRole.NURSE, UserRole.DOCTOR)
  async updateTriage(@Param('id') id: string, @Body() triageData: any) {
    return this.emergencyService.updateTriage(id, triageData);
  }

  /**
   *
   */
  @Put('visits/:id/assign-doctor')
  @Roles(UserRole.NURSE, UserRole.ADMIN)
  async assignDoctor(@Param('id') id: string, @Body() body: { doctorId: string }) {
    return this.emergencyService.assignDoctor(id, body.doctorId);
  }

  /**
   *
   */
  @Put('visits/:id/status')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  async updateVisitStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.emergencyService.updateVisitStatus(id, body.status);
  }

  /**
   *
   */
  @Post('visits/:id/vitals')
  @Roles(UserRole.NURSE, UserRole.DOCTOR)
  async addVitals(@Param('id') id: string, @Body() vitals: any) {
    return this.emergencyService.addVitals(id, vitals);
  }

  /**
   *
   */
  @Post('visits/:id/medications')
  @Roles(UserRole.DOCTOR)
  async addMedication(@Param('id') id: string, @Body() medication: any) {
    return this.emergencyService.addMedication(id, medication);
  }

  /**
   *
   */
  @Post('visits/:id/procedures')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  async addProcedure(@Param('id') id: string, @Body() procedure: any) {
    return this.emergencyService.addProcedure(id, procedure);
  }

  /**
   *
   */
  @Get('queue')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  async getWaitingQueue() {
    return this.emergencyService.getWaitingQueue();
  }
}
