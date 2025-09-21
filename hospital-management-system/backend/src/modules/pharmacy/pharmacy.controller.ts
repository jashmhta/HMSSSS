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
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('pharmacy')
@ApiBearerAuth()
@Controller('pharmacy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  // Medication Management
  @Post('medications')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Create a new medication' })
  @ApiResponse({ status: 201, description: 'Medication created successfully' })
  createMedication(@Body() createMedicationDto: any) {
    return this.pharmacyService.createMedication(createMedicationDto);
  }

  @Get('medications')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.NURSE)
  @ApiOperation({ summary: 'Get all medications' })
  @ApiResponse({ status: 200, description: 'List of medications' })
  findAllMedications(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: boolean,
    @Query('expiringSoon') expiringSoon?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      search,
      category,
      lowStock: lowStock === true,
      expiringSoon: expiringSoon === true,
      page,
      limit,
    };
    return this.pharmacyService.findAllMedications(filters);
  }

  @Get('medications/low-stock')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Get low stock medications' })
  @ApiResponse({ status: 200, description: 'Low stock medications' })
  getLowStockMedications() {
    return this.pharmacyService.getLowStockMedications();
  }

  @Get('medications/expiring')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Get expiring medications' })
  @ApiResponse({ status: 200, description: 'Expiring medications' })
  getExpiringMedications(@Query('days') days?: number) {
    return this.pharmacyService.getExpiringMedications(days);
  }

  @Get('medications/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.NURSE)
  @ApiOperation({ summary: 'Get medication by ID' })
  @ApiResponse({ status: 200, description: 'Medication details' })
  findMedicationById(@Param('id') id: string) {
    return this.pharmacyService.findMedicationById(id);
  }

  @Patch('medications/:id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Update medication' })
  @ApiResponse({ status: 200, description: 'Medication updated successfully' })
  updateMedication(@Param('id') id: string, @Body() updateMedicationDto: any) {
    return this.pharmacyService.updateMedication(id, updateMedicationDto);
  }

  @Delete('medications/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete medication' })
  @ApiResponse({ status: 200, description: 'Medication deleted successfully' })
  deleteMedication(@Param('id') id: string) {
    return this.pharmacyService.deleteMedication(id);
  }

  @Post('medications/:id/stock')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Update medication stock' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  updateStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; action: 'add' | 'subtract'; reason?: string },
    @Request() req,
  ) {
    return this.pharmacyService.updateStock(
      id,
      body.quantity,
      body.action,
      body.reason,
      req.user.id,
    );
  }

  // Prescription Management
  @Post('prescriptions')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create a new prescription' })
  @ApiResponse({ status: 201, description: 'Prescription created successfully' })
  createPrescription(@Body() createPrescriptionDto: any) {
    return this.pharmacyService.createPrescription(createPrescriptionDto);
  }

  @Post('prescriptions/:id/dispense')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Dispense prescription' })
  @ApiResponse({ status: 200, description: 'Prescription dispensed successfully' })
  dispensePrescription(@Param('id') id: string, @Request() req) {
    return this.pharmacyService.dispensePrescription(id, req.user.id);
  }

  @Get('prescriptions/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get prescription by ID' })
  @ApiResponse({ status: 200, description: 'Prescription details' })
  getPrescriptionById(@Param('id') id: string) {
    return this.pharmacyService.getPrescriptionById(id);
  }

  @Get('patients/:patientId/prescriptions')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get patient prescriptions' })
  @ApiResponse({ status: 200, description: 'Patient prescriptions' })
  getPatientPrescriptions(@Param('patientId') patientId: string, @Query('status') status?: string) {
    return this.pharmacyService.getPatientPrescriptions(patientId, status);
  }

  // Analytics
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  @ApiOperation({ summary: 'Get pharmacy statistics' })
  @ApiResponse({ status: 200, description: 'Pharmacy statistics' })
  getPharmacyStats() {
    return this.pharmacyService.getPharmacyStats();
  }
}
