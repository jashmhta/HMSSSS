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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create a new medical record' })
  @ApiResponse({ status: 201, description: 'Medical record created successfully' })
  create(@Body() createMedicalRecordDto: any) {
    return this.medicalRecordsService.create(createMedicalRecordDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Get all medical records' })
  @ApiResponse({ status: 200, description: 'List of medical records' })
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      patientId,
      doctorId,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      page,
      limit,
    };
    return this.medicalRecordsService.findAll(filters);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get patient medical records' })
  @ApiResponse({ status: 200, description: 'Patient medical records' })
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.medicalRecordsService.findByPatient(patientId, page, limit);
  }

  @Get('patient/:patientId/history')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get patient medical history summary' })
  @ApiResponse({ status: 200, description: 'Patient medical history' })
  getPatientHistory(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getPatientHistory(patientId);
  }

  @Get('doctor/:doctorId/stats')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get doctor medical records statistics' })
  @ApiResponse({ status: 200, description: 'Doctor statistics' })
  getDoctorStats(
    @Param('doctorId') doctorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.medicalRecordsService.getDoctorStats(doctorId, start, end);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get medical record by ID' })
  @ApiResponse({ status: 200, description: 'Medical record details' })
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update medical record' })
  @ApiResponse({ status: 200, description: 'Medical record updated successfully' })
  update(@Param('id') id: string, @Body() updateMedicalRecordDto: any) {
    return this.medicalRecordsService.update(id, updateMedicalRecordDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete medical record' })
  @ApiResponse({ status: 200, description: 'Medical record deleted successfully' })
  remove(@Param('id') id: string) {
    return this.medicalRecordsService.remove(id);
  }
}
