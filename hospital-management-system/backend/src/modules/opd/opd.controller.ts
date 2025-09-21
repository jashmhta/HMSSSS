import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OPDService } from './opd.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('opd')
@ApiBearerAuth()
@Controller('opd')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OPDController {
  constructor(private readonly opdService: OPDService) {}

  @Post('visits')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create a new OPD visit' })
  @ApiResponse({ status: 201, description: 'OPD visit created successfully' })
  async createOPDVisit(@Body() data: any, @Request() req) {
    return this.opdService.createOPDVisit({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('visits')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all OPD visits' })
  @ApiResponse({ status: 200, description: 'List of OPD visits' })
  async getOPDVisits(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.opdService.getOPDVisits(page, limit, search, status);
  }

  @Get('visits/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get OPD visit by ID' })
  @ApiResponse({ status: 200, description: 'OPD visit details' })
  async getOPDVisitById(@Param('id') id: string) {
    return this.opdService.getOPDVisitById(id);
  }

  @Put('visits/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Update OPD visit' })
  @ApiResponse({ status: 200, description: 'OPD visit updated successfully' })
  async updateOPDVisit(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.opdService.updateOPDVisit(id, {
      ...data,
      updatedBy: req.user.id,
    });
  }

  @Delete('visits/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Delete OPD visit' })
  @ApiResponse({ status: 200, description: 'OPD visit deleted successfully' })
  async deleteOPDVisit(@Param('id') id: string) {
    return this.opdService.deleteOPDVisit(id);
  }

  @Get('queue')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get OPD queue' })
  @ApiResponse({ status: 200, description: 'Current OPD queue' })
  async getOPDQueue() {
    return this.opdService.getOPDQueue();
  }

  @Put('visits/:id/status')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Update visit status' })
  @ApiResponse({ status: 200, description: 'Visit status updated successfully' })
  async updateVisitStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req,
  ) {
    return this.opdService.updateVisitStatus(id, body.status, req.user.id);
  }

  @Post('appointments')
  @Roles(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Schedule an OPD appointment' })
  @ApiResponse({ status: 201, description: 'Appointment scheduled successfully' })
  async scheduleAppointment(@Body() data: any, @Request() req) {
    return this.opdService.scheduleAppointment({
      ...data,
      scheduledBy: req.user.id,
    });
  }

  @Post('visits/:appointmentId/start')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Start OPD consultation from appointment' })
  @ApiResponse({ status: 200, description: 'Consultation started successfully' })
  async startConsultation(@Param('appointmentId') appointmentId: string, @Request() req) {
    return this.opdService.startConsultation(appointmentId, req.user.id);
  }

  @Post('visits/:visitId/complete')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Complete OPD consultation' })
  @ApiResponse({ status: 200, description: 'Consultation completed successfully' })
  async completeConsultation(@Param('visitId') visitId: string, @Body() data: any, @Request() req) {
    return this.opdService.completeConsultation(visitId, {
      ...data,
      completedBy: req.user.id,
    });
  }

  @Get('schedule/:doctorId')
  @Roles(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get doctor schedule for a date' })
  @ApiResponse({ status: 200, description: 'Doctor schedule retrieved successfully' })
  async getDoctorSchedule(@Param('doctorId') doctorId: string, @Query('date') date: string) {
    const scheduleDate = date ? new Date(date) : new Date();
    return this.opdService.getDoctorSchedule(doctorId, scheduleDate);
  }

  @Get('queue/wait-times')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get OPD queue with estimated wait times' })
  @ApiResponse({ status: 200, description: 'OPD queue with wait times' })
  async getOPDQueueWithWaitTimes() {
    return this.opdService.getOPDQueueWithWaitTimes();
  }

  @Post('visits/:visitId/transfer')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Transfer patient to different doctor/department' })
  @ApiResponse({ status: 200, description: 'Patient transferred successfully' })
  async transferPatient(@Param('visitId') visitId: string, @Body() data: any, @Request() req) {
    return this.opdService.transferPatient(visitId, {
      ...data,
      transferredBy: req.user.id,
    });
  }

  @Get('performance')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get OPD performance metrics' })
  @ApiResponse({ status: 200, description: 'OPD performance metrics' })
  async getOPDPerformanceMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.opdService.getOPDPerformanceMetrics(start, end);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get OPD statistics' })
  @ApiResponse({ status: 200, description: 'OPD statistics' })
  async getOPDStats() {
    return this.opdService.getOPDStats();
  }
}
