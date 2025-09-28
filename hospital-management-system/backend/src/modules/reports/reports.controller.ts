import { Controller, Get, Post, Body, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/reports.dto';
import { ReportType } from './dto/report.enums';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Generate a comprehensive report
   */
  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  async generateReport(@Body(ValidationPipe) data: GenerateReportDto) {
    return this.reportsService.generateReport(data);
  }

  /**
   * Get patient demographics report
   */
  @Get('patients/demographics')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  async getPatientDemographics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.PATIENT_SUMMARY,
      startDate,
      endDate,
    });
  }

  /**
   * Get appointment analytics
   */
  @Get('appointments/analytics')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.SUPERADMIN)
  async getAppointmentAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('department') department?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.APPOINTMENT_ANALYTICS,
      startDate,
      endDate,
      department,
      doctorId,
    });
  }

  /**
   * Get financial summary report
   */
  @Get('financial/summary')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async getFinancialSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.FINANCIAL_SUMMARY,
      startDate,
      endDate,
    });
  }

  /**
   * Get inventory status report
   */
  @Get('inventory/status')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.SUPERADMIN)
  async getInventoryStatus() {
    return this.reportsService.generateReport({
      reportType: ReportType.INVENTORY_STATUS,
    });
  }

  /**
   * Get staff performance report
   */
  @Get('staff/performance')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async getStaffPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.STAFF_PERFORMANCE,
      startDate,
      endDate,
    });
  }

  /**
   * Get lab results summary
   */
  @Get('laboratory/results')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  async getLabResultsSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.LAB_RESULTS_SUMMARY,
      startDate,
      endDate,
      patientId,
    });
  }

  /**
   * Get radiology reports
   */
  @Get('radiology/reports')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  async getRadiologyReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.RADIOLOGY_REPORTS,
      startDate,
      endDate,
      patientId,
    });
  }

  /**
   * Get pharmacy dispensation report
   */
  @Get('pharmacy/dispensation')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.SUPERADMIN)
  async getPharmacyDispensation(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.PHARMACY_DISPENSATION,
      startDate,
      endDate,
    });
  }

  /**
   * Get emergency response report
   */
  @Get('emergency/response')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  async getEmergencyResponse(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.EMERGENCY_RESPONSE,
      startDate,
      endDate,
    });
  }

  /**
   * Get surgery outcomes report
   */
  @Get('surgery/outcomes')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  async getSurgeryOutcomes(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.SURGERY_OUTCOMES,
      startDate,
      endDate,
      doctorId,
    });
  }

  /**
   * Get IPD admission summary
   */
  @Get('ipd/admissions')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  async getIPDAdmissions(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.IPD_ADMISSION_SUMMARY,
      startDate,
      endDate,
    });
  }

  /**
   * Get blood bank inventory report
   */
  @Get('blood-bank/inventory')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SUPERADMIN)
  async getBloodBankInventory() {
    return this.reportsService.generateReport({
      reportType: ReportType.BLOOD_BANK_INVENTORY,
    });
  }

  /**
   * Get compliance audit report
   */
  @Get('compliance/audit')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async getComplianceAudit(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.generateReport({
      reportType: ReportType.COMPLIANCE_AUDIT,
      startDate,
      endDate,
    });
  }
}
