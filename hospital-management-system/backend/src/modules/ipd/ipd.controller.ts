/*[object Object]*/
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';

import { IPDService } from './ipd.service';
import {
  CreateIPDAdmissionDto,
  ProgressNoteDto,
  VitalSignsDto,
  NursingNoteDto,
  DischargePatientDto,
  TransferPatientDto,
  IPDAdmissionResponse,
  BedInfoDto,
} from './dto/ipd-admission.dto';

/**
 *
 */
@ApiTags('ipd')
@ApiBearerAuth()
@Controller('ipd')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IPDController {
  /**
   *
   */
  constructor(private readonly ipdService: IPDService) {}

  /**
   *
   */
  @Post('admissions')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Admit a patient to IPD' })
  @ApiResponse({ type: IPDAdmissionResponse })
  async admitPatient(@Body(ValidationPipe) data: CreateIPDAdmissionDto, @Request() req) {
    return this.ipdService.admitPatientToIPD({
      ...data,
      admittedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Get('admissions')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all IPD admissions' })
  @ApiResponse({ type: [IPDAdmissionResponse] })
  async getIPDAdmissions() {
    return this.ipdService.getIPDAdmissions();
  }

  /**
   *
   */
  @Get('admissions/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get IPD admission by ID' })
  @ApiResponse({ type: IPDAdmissionResponse })
  async getIPDAdmissionById(@Param('id') id: string) {
    return this.ipdService.getIPDAdmissionById(id);
  }

  /**
   *
   */
  @Put('admissions/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Update IPD admission' })
  @ApiResponse({ type: IPDAdmissionResponse })
  async updateAdmission(@Param('id') id: string, @Body() data: any) {
    return this.ipdService.updateAdmission(id, data);
  }

  /**
   *
   */
  @Post('admissions/:id/discharge')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Discharge patient from IPD' })
  @ApiResponse({ type: IPDAdmissionResponse })
  async dischargePatient(
    @Param('id') id: string,
    @Body(ValidationPipe) dischargeData: DischargePatientDto,
    @Request() req,
  ) {
    return this.ipdService.dischargePatient(id, {
      ...dischargeData,
      dischargedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Get('beds/occupancy')
  @Roles(UserRole.NURSE, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get bed occupancy status' })
  @ApiResponse({ type: [BedInfoDto] })
  async getBedOccupancy() {
    return this.ipdService.getBedOccupancy();
  }

  /**
   *
   */
  @Put('admissions/:admissionId/bed/:bedId')
  @Roles(UserRole.NURSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign bed to patient' })
  async assignBed(@Param('admissionId') admissionId: string, @Param('bedId') bedId: string) {
    return this.ipdService.assignBed(admissionId, bedId);
  }

  /**
   *
   */
  @Post('admit')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Admit patient to IPD (alternative endpoint)' })
  @ApiResponse({ type: IPDAdmissionResponse })
  async admitPatientToIPD(@Body(ValidationPipe) data: CreateIPDAdmissionDto, @Request() req) {
    return this.ipdService.admitPatientToIPD({
      ...data,
      admittedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Post('admissions/:id/transfer')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Transfer patient to different bed/ward' })
  @ApiResponse({ type: IPDAdmissionResponse })
  async transferPatient(
    @Param('id') id: string,
    @Body(ValidationPipe) data: TransferPatientDto,
    @Request() req,
  ) {
    return this.ipdService.transferPatient(id, {
      ...data,
      transferredBy: req.user.id,
    });
  }

  /**
   *
   */
  @Post('admissions/:id/progress-notes')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Add progress note to IPD admission' })
  async addProgressNote(
    @Param('id') id: string,
    @Body(ValidationPipe) data: ProgressNoteDto,
    @Request() req,
  ) {
    return this.ipdService.addProgressNote(id, {
      ...data,
      notedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Post('admissions/:id/vitals')
  @Roles(UserRole.NURSE, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Record vital signs for IPD patient' })
  async recordVitals(
    @Param('id') id: string,
    @Body(ValidationPipe) data: VitalSignsDto,
    @Request() req,
  ) {
    return this.ipdService.recordVitals(id, {
      ...data,
      recordedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Post('admissions/:id/nursing-notes')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Add nursing note to IPD admission' })
  async addNursingNote(
    @Param('id') id: string,
    @Body(ValidationPipe) data: NursingNoteDto,
    @Request() req,
  ) {
    return this.ipdService.addNursingNote(id, {
      ...data,
      notedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Get('beds/availability')
  @Roles(UserRole.NURSE, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get bed availability by ward type' })
  async getBedAvailability() {
    return this.ipdService.getBedAvailability();
  }

  /**
   *
   */
  @Get('performance')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get IPD performance metrics' })
  async getIPDPerformanceMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.ipdService.getIPDPerformanceMetrics(start, end);
  }
}
