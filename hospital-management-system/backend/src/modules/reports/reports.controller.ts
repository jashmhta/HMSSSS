import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Patient Reports
  @Get('patients/demographics')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get patient demographics report' })
  @ApiResponse({ status: 200, description: 'Patient demographics data' })
  async getPatientDemographics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getPatientDemographics(startDate, endDate);
  }

  @Get('patients/registrations')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get patient registration trends' })
  @ApiResponse({ status: 200, description: 'Patient registration trends' })
  async getPatientRegistrationTrends(
    @Query('period') period: string = 'monthly',
    @Query('year') year?: number,
  ) {
    return this.reportsService.getPatientRegistrationTrends(period, year);
  }

  // Appointment Reports
  @Get('appointments/summary')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get appointment summary report' })
  @ApiResponse({ status: 200, description: 'Appointment summary data' })
  async getAppointmentSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getAppointmentSummary(startDate, endDate);
  }

  @Get('appointments/utilization')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get doctor utilization report' })
  @ApiResponse({ status: 200, description: 'Doctor utilization data' })
  async getDoctorUtilization(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getDoctorUtilization(startDate, endDate);
  }

  // Revenue Reports
  @Get('revenue/summary')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get revenue summary report' })
  @ApiResponse({ status: 200, description: 'Revenue summary data' })
  async getRevenueSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy: string = 'monthly',
  ) {
    return this.reportsService.getRevenueSummary(startDate, endDate, groupBy);
  }

  @Get('revenue/department')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get department-wise revenue report' })
  @ApiResponse({ status: 200, description: 'Department revenue data' })
  async getDepartmentRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getDepartmentRevenue(startDate, endDate);
  }

  @Get('revenue/payment-methods')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get payment methods distribution' })
  @ApiResponse({ status: 200, description: 'Payment methods data' })
  async getPaymentMethodsDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getPaymentMethodsDistribution(startDate, endDate);
  }

  // Laboratory Reports
  @Get('laboratory/tests')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get laboratory test statistics' })
  @ApiResponse({ status: 200, description: 'Lab test statistics' })
  async getLabTestStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getLabTestStatistics(startDate, endDate);
  }

  @Get('laboratory/turnaround-time')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get lab test turnaround time report' })
  @ApiResponse({ status: 200, description: 'Turnaround time data' })
  async getLabTurnaroundTime(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getLabTurnaroundTime(startDate, endDate);
  }

  // Pharmacy Reports
  @Get('pharmacy/dispensing')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get pharmacy dispensing report' })
  @ApiResponse({ status: 200, description: 'Pharmacy dispensing data' })
  async getPharmacyDispensingReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getPharmacyDispensingReport(startDate, endDate);
  }

  // OT/Surgery Reports
  @Get('ot/surgeries')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get surgery statistics report' })
  @ApiResponse({ status: 200, description: 'Surgery statistics' })
  async getSurgeryStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSurgeryStatistics(startDate, endDate);
  }

  @Get('ot/utilization')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get OT utilization report' })
  @ApiResponse({ status: 200, description: 'OT utilization data' })
  async getOTUtilization(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getOTUtilization(startDate, endDate);
  }

  // Emergency Department Reports
  @Get('emergency/triage')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get emergency triage statistics' })
  @ApiResponse({ status: 200, description: 'Triage statistics' })
  async getEmergencyTriageStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getEmergencyTriageStats(startDate, endDate);
  }

  // Inventory Reports
  @Get('inventory/stock-levels')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get inventory stock levels report' })
  @ApiResponse({ status: 200, description: 'Stock levels data' })
  async getInventoryStockLevels() {
    return this.reportsService.getInventoryStockLevels();
  }

  @Get('inventory/expiry-alerts')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get inventory expiry alerts' })
  @ApiResponse({ status: 200, description: 'Expiry alerts data' })
  async getInventoryExpiryAlerts(@Query('days') days: number = 30) {
    return this.reportsService.getInventoryExpiryAlerts(days);
  }

  // Staff Performance Reports
  @Get('staff/performance')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get staff performance report' })
  @ApiResponse({ status: 200, description: 'Staff performance data' })
  async getStaffPerformanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getStaffPerformanceReport(startDate, endDate);
  }

  // Dashboard Summary
  @Get('dashboard/summary')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get dashboard summary data' })
  @ApiResponse({ status: 200, description: 'Dashboard summary' })
  async getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  // Custom Report Generation
  @Get('custom')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Generate custom report' })
  @ApiResponse({ status: 200, description: 'Custom report data' })
  async generateCustomReport(
    @Query('type') type: string,
    @Query('filters') filters: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.reportsService.generateCustomReport(type, parsedFilters, startDate, endDate);
  }
}
