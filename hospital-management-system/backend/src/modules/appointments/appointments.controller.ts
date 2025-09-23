/*[object Object]*/
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

import { AppointmentsService } from './appointments.service';

/**
 *
 */
@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  /**
   *
   */
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   *
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  create(@Body() createAppointmentDto: any, @Request() req) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  /**
   *
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  findAll(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      doctorId,
      patientId,
      ...(date && { date: new Date(date) }),
      status,
      page,
      limit,
    };
    return this.appointmentsService.findAll(filters);
  }

  /**
   *
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get appointment statistics' })
  @ApiResponse({ status: 200, description: 'Appointment statistics' })
  getStats() {
    return this.appointmentsService.getAppointmentStats();
  }

  /**
   *
   */
  @Get('doctor/:doctorId/schedule')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get doctor schedule for a specific date' })
  @ApiResponse({ status: 200, description: 'Doctor schedule' })
  getDoctorSchedule(@Param('doctorId') doctorId: string, @Query('date') date: string) {
    return this.appointmentsService.getDoctorSchedule(doctorId, new Date(date));
  }

  /**
   *
   */
  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get patient appointments' })
  @ApiResponse({ status: 200, description: 'Patient appointments' })
  getPatientAppointments(
    @Param('patientId') patientId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.appointmentsService.getPatientAppointments(patientId, page, limit);
  }

  /**
   *
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  /**
   *
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  update(@Param('id') id: string, @Body() updateAppointmentDto: any) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  /**
   *
   */
  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.appointmentsService.cancel(id, body.reason);
  }

  /**
   *
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
