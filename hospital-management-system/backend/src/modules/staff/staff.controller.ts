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
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // Doctor Management
  @Post('doctors')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new doctor' })
  @ApiResponse({ status: 201, description: 'Doctor created successfully' })
  async createDoctor(@Body() data: any, @Request() req) {
    return this.staffService.createDoctor({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('doctors')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiResponse({ status: 200, description: 'List of doctors' })
  async getDoctors(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('specialization') specialization?: string,
    @Query('department') department?: string,
  ) {
    return this.staffService.getDoctors(page, limit, specialization, department);
  }

  @Get('doctors/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get doctor by ID' })
  @ApiResponse({ status: 200, description: 'Doctor details' })
  async getDoctorById(@Param('id') id: string) {
    return this.staffService.getDoctorById(id);
  }

  @Put('doctors/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update doctor' })
  @ApiResponse({ status: 200, description: 'Doctor updated successfully' })
  async updateDoctor(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.staffService.updateDoctor(id, {
      ...data,
      updatedBy: req.user.id,
    });
  }

  @Delete('doctors/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete doctor' })
  @ApiResponse({ status: 200, description: 'Doctor deleted successfully' })
  async deleteDoctor(@Param('id') id: string) {
    return this.staffService.deleteDoctor(id);
  }

  // Nurse Management
  @Post('nurses')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new nurse' })
  @ApiResponse({ status: 201, description: 'Nurse created successfully' })
  async createNurse(@Body() data: any, @Request() req) {
    return this.staffService.createNurse({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('nurses')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all nurses' })
  @ApiResponse({ status: 200, description: 'List of nurses' })
  async getNurses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('department') department?: string,
    @Query('shift') shift?: string,
  ) {
    return this.staffService.getNurses(page, limit, department, shift);
  }

  @Get('nurses/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get nurse by ID' })
  @ApiResponse({ status: 200, description: 'Nurse details' })
  async getNurseById(@Param('id') id: string) {
    return this.staffService.getNurseById(id);
  }

  @Put('nurses/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update nurse' })
  @ApiResponse({ status: 200, description: 'Nurse updated successfully' })
  async updateNurse(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.staffService.updateNurse(id, {
      ...data,
      updatedBy: req.user.id,
    });
  }

  @Delete('nurses/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete nurse' })
  @ApiResponse({ status: 200, description: 'Nurse deleted successfully' })
  async deleteNurse(@Param('id') id: string) {
    return this.staffService.deleteNurse(id);
  }

  // Receptionist Management
  @Post('receptionists')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new receptionist' })
  @ApiResponse({ status: 201, description: 'Receptionist created successfully' })
  async createReceptionist(@Body() data: any, @Request() req) {
    return this.staffService.createReceptionist({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('receptionists')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all receptionists' })
  @ApiResponse({ status: 200, description: 'List of receptionists' })
  async getReceptionists(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('department') department?: string,
  ) {
    return this.staffService.getReceptionists(page, limit, department);
  }

  @Get('receptionists/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get receptionist by ID' })
  @ApiResponse({ status: 200, description: 'Receptionist details' })
  async getReceptionistById(@Param('id') id: string) {
    return this.staffService.getReceptionistById(id);
  }

  @Put('receptionists/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update receptionist' })
  @ApiResponse({ status: 200, description: 'Receptionist updated successfully' })
  async updateReceptionist(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.staffService.updateReceptionist(id, {
      ...data,
      updatedBy: req.user.id,
    });
  }

  @Delete('receptionists/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete receptionist' })
  @ApiResponse({ status: 200, description: 'Receptionist deleted successfully' })
  async deleteReceptionist(@Param('id') id: string) {
    return this.staffService.deleteReceptionist(id);
  }

  // Lab Technician Management
  @Post('lab-technicians')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new lab technician' })
  @ApiResponse({ status: 201, description: 'Lab technician created successfully' })
  async createLabTechnician(@Body() data: any, @Request() req) {
    return this.staffService.createLabTechnician({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('lab-technicians')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all lab technicians' })
  @ApiResponse({ status: 200, description: 'List of lab technicians' })
  async getLabTechnicians(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.staffService.getLabTechnicians(page, limit);
  }

  @Get('lab-technicians/:id')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get lab technician by ID' })
  @ApiResponse({ status: 200, description: 'Lab technician details' })
  async getLabTechnicianById(@Param('id') id: string) {
    return this.staffService.getLabTechnicianById(id);
  }

  @Put('lab-technicians/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update lab technician' })
  @ApiResponse({ status: 200, description: 'Lab technician updated successfully' })
  async updateLabTechnician(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.staffService.updateLabTechnician(id, {
      ...data,
      updatedBy: req.user.id,
    });
  }

  @Delete('lab-technicians/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete lab technician' })
  @ApiResponse({ status: 200, description: 'Lab technician deleted successfully' })
  async deleteLabTechnician(@Param('id') id: string) {
    return this.staffService.deleteLabTechnician(id);
  }

  // Pharmacist Management
  @Post('pharmacists')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new pharmacist' })
  @ApiResponse({ status: 201, description: 'Pharmacist created successfully' })
  async createPharmacist(@Body() data: any, @Request() req) {
    return this.staffService.createPharmacist({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('pharmacists')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all pharmacists' })
  @ApiResponse({ status: 200, description: 'List of pharmacists' })
  async getPharmacists(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.staffService.getPharmacists(page, limit);
  }

  @Get('pharmacists/:id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get pharmacist by ID' })
  @ApiResponse({ status: 200, description: 'Pharmacist details' })
  async getPharmacistById(@Param('id') id: string) {
    return this.staffService.getPharmacistById(id);
  }

  @Put('pharmacists/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update pharmacist' })
  @ApiResponse({ status: 200, description: 'Pharmacist updated successfully' })
  async updatePharmacist(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.staffService.updatePharmacist(id, {
      ...data,
      updatedBy: req.user.id,
    });
  }

  @Delete('pharmacists/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete pharmacist' })
  @ApiResponse({ status: 200, description: 'Pharmacist deleted successfully' })
  async deletePharmacist(@Param('id') id: string) {
    return this.staffService.deletePharmacist(id);
  }

  // Admin Management
  @Post('admins')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new admin' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  async createAdmin(@Body() data: any, @Request() req) {
    return this.staffService.createAdmin({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('admins')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all admins' })
  @ApiResponse({ status: 200, description: 'List of admins' })
  async getAdmins(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.staffService.getAdmins(page, limit);
  }

  @Get('admins/:id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get admin by ID' })
  @ApiResponse({ status: 200, description: 'Admin details' })
  async getAdminById(@Param('id') id: string) {
    return this.staffService.getAdminById(id);
  }

  @Put('admins/:id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update admin' })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  async updateAdmin(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.staffService.updateAdmin(id, {
      ...data,
      updatedBy: req.user.id,
    });
  }

  @Delete('admins/:id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete admin' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  async deleteAdmin(@Param('id') id: string) {
    return this.staffService.deleteAdmin(id);
  }

  // General Staff Statistics
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get staff statistics' })
  @ApiResponse({ status: 200, description: 'Staff statistics' })
  async getStaffStats() {
    return this.staffService.getStaffStats();
  }

  // Bulk operations
  @Post('bulk-create')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Bulk create staff members' })
  @ApiResponse({ status: 201, description: 'Staff members created successfully' })
  async bulkCreateStaff(@Body() data: { staff: any[] }, @Request() req) {
    return this.staffService.bulkCreateStaff(data.staff, req.user.id);
  }
}
