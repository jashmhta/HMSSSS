import { Controller, Get, Post, Put, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IPDService } from './ipd.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('ipd')
@ApiBearerAuth()
@Controller('ipd')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ipd')
export class IPDController {
  constructor(private readonly ipdService: IPDService) {}

  @Post('admissions')
  @Roles('doctor', 'admin')
  async admitPatient(@Body() data: any) {
    return this.ipdService.admitPatient(data);
  }

  @Get('admissions')
  @Roles('doctor', 'nurse', 'admin')
  async getIPDAdmissions() {
    return this.ipdService.getIPDAdmissions();
  }

  @Get('admissions/:id')
  @Roles('doctor', 'nurse', 'admin')
  async getIPDAdmissionById(@Param('id') id: string) {
    return this.ipdService.getIPDAdmissionById(id);
  }

  @Put('admissions/:id')
  @Roles('doctor', 'nurse')
  async updateAdmission(@Param('id') id: string, @Body() data: any) {
    return this.ipdService.updateAdmission(id, data);
  }

  @Post('admissions/:id/discharge')
  @Roles('doctor')
  async dischargePatient(@Param('id') id: string, @Body() dischargeData: any) {
    return this.ipdService.dischargePatient(id, dischargeData);
  }

  @Get('beds/occupancy')
  @Roles('nurse', 'admin', 'receptionist')
  async getBedOccupancy() {
    return this.ipdService.getBedOccupancy();
  }

  @Put('admissions/:admissionId/bed/:bedId')
  @Roles('nurse', 'admin')
  async assignBed(@Param('admissionId') admissionId: string, @Param('bedId') bedId: string) {
    return this.ipdService.assignBed(admissionId, bedId);
  }

  @Post('admissions/:id/progress-notes')
  @Roles('doctor')
  async addProgressNote(@Param('id') id: string, @Body() note: any) {
    return this.ipdService.addProgressNote(id, note);
  }

  @Post('admissions/:id/nursing-notes')
  @Roles('nurse')
  async addNursingNote(@Param('id') id: string, @Body() note: any) {
    return this.ipdService.addNursingNote(id, note);
  }

  @Post('admit')
  @Roles('doctor', 'admin')
  async admitPatientToIPD(@Body() data: any, @Request() req) {
    return this.ipdService.admitPatientToIPD({
      ...data,
      admittedBy: req.user.id,
    });
  }

  @Post('admissions/:id/transfer')
  @Roles('doctor', 'admin')
  async transferPatient(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.ipdService.transferPatient(id, {
      ...data,
      transferredBy: req.user.id,
    });
  }

  @Post('admissions/:id/progress-notes')
  @Roles('doctor')
  async addProgressNote(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.ipdService.addProgressNote(id, {
      ...data,
      notedBy: req.user.id,
    });
  }

  @Post('admissions/:id/vitals')
  @Roles('nurse', 'doctor')
  async recordVitals(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.ipdService.recordVitals(id, {
      ...data,
      recordedBy: req.user.id,
    });
  }

  @Post('admissions/:id/nursing-notes')
  @Roles('nurse')
  async addNursingNote(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.ipdService.addNursingNote(id, {
      ...data,
      notedBy: req.user.id,
    });
  }

  @Post('admissions/:id/discharge')
  @Roles('doctor')
  async dischargePatient(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.ipdService.dischargePatient(id, {
      ...data,
      dischargedBy: req.user.id,
    });
  }

  @Get('beds/availability')
  @Roles('nurse', 'admin', 'receptionist')
  async getBedAvailability() {
    return this.ipdService.getBedAvailability();
  }

  @Get('performance')
  @Roles('admin', 'doctor')
  async getIPDPerformanceMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.ipdService.getIPDPerformanceMetrics(start, end);
  }
}
