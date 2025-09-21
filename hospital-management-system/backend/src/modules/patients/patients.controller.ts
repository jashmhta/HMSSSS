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
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('register')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Register a new patient with comprehensive validation' })
  @ApiResponse({ status: 201, description: 'Patient registered successfully' })
  async registerNewPatient(@Body() registrationData: any, @Request() req) {
    return this.patientsService.registerNewPatient({
      ...registrationData,
      registeredBy: req.user.id,
    });
  }

  @Post('check-in/:mrn')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Check in a returning patient' })
  @ApiResponse({ status: 200, description: 'Patient checked in successfully' })
  async checkInReturningPatient(
    @Param('mrn') mrn: string,
    @Body() checkInData: any,
    @Request() req,
  ) {
    return this.patientsService.checkInReturningPatient(mrn, {
      ...checkInData,
      checkedInBy: req.user.id,
    });
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create a new patient (legacy)' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  create(@Body() createPatientDto: any, @Request() req) {
    return this.patientsService.create({
      ...createPatientDto,
      userId: req.user.id,
    });
  }

  @Get('search')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PHARMACIST,
    UserRole.LAB_TECHNICIAN,
  )
  @ApiOperation({ summary: 'Search patients with advanced filtering' })
  @ApiResponse({ status: 200, description: 'Patient search results' })
  async searchPatients(@Query() searchCriteria: any) {
    return this.patientsService.searchPatients(searchCriteria);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PHARMACIST,
    UserRole.LAB_TECHNICIAN,
  )
  @ApiOperation({ summary: 'Get all patients' })
  @ApiResponse({ status: 200, description: 'List of patients' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.patientsService.findAll(page, limit, search);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get patient statistics' })
  @ApiResponse({ status: 200, description: 'Patient statistics' })
  getStats() {
    return this.patientsService.getPatientStats();
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PHARMACIST,
    UserRole.LAB_TECHNICIAN,
  )
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiResponse({ status: 200, description: 'Patient details' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get(':id/medical-summary')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Get patient medical history summary' })
  @ApiResponse({ status: 200, description: 'Patient medical summary' })
  async getMedicalSummary(@Param('id') id: string) {
    return this.patientsService.getPatientMedicalSummary(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update patient information' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  async updatePatientInfo(@Param('id') id: string, @Body() updateData: any, @Request() req) {
    return this.patientsService.updatePatientInfo(id, updateData, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update patient (legacy)' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  update(@Param('id') id: string, @Body() updatePatientDto: any) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete patient' })
  @ApiResponse({ status: 200, description: 'Patient deleted successfully' })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
