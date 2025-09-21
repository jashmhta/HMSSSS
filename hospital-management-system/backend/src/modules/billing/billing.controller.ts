import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Request,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { UserRole } from '../../database/schema.prisma';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @Roles('admin', 'receptionist')
  async createInvoice(@Body() data: any) {
    return this.billingService.createInvoice(data);
  }

  @Get('invoices')
  @Roles('admin', 'receptionist', 'accountant')
  async getInvoices(@Query() query: any) {
    return this.billingService.getInvoices();
  }

  @Get('invoices/:id')
  @Roles('admin', 'receptionist', 'accountant', 'patient')
  async getInvoiceById(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Put('invoices/:id')
  @Roles('admin', 'receptionist')
  async updateInvoice(@Param('id') id: string, @Body() data: any) {
    return this.billingService.updateInvoice(id, data);
  }

  @Post('invoices/:id/items')
  @Roles('admin', 'receptionist')
  async addInvoiceItem(@Param('id') id: string, @Body() item: any) {
    return this.billingService.addInvoiceItem(id, item);
  }

  @Post('invoices/:id/discount')
  @Roles('admin', 'manager')
  async applyDiscount(@Param('id') id: string, @Body() discountData: any) {
    return this.billingService.applyDiscount(id, discountData);
  }

  @Post('invoices/:id/payments')
  @Roles('admin', 'receptionist', 'accountant')
  async processPayment(@Param('id') id: string, @Body() paymentData: any) {
    return this.billingService.processPayment(id, paymentData);
  }

  @Get('opd')
  @Roles('admin', 'receptionist', 'accountant')
  async getOPDBilling(@Query('packageId') packageId?: string) {
    return this.billingService.getOPDBilling(packageId);
  }

  @Get('ipd/:admissionId')
  @Roles('admin', 'receptionist', 'accountant')
  async getIPDBilling(@Param('admissionId') admissionId: string) {
    return this.billingService.getIPDBilling(admissionId);
  }

  @Get('emergency/:visitId')
  @Roles('admin', 'receptionist', 'accountant')
  async getEmergencyBilling(@Param('visitId') visitId: string) {
    return this.billingService.getEmergencyBilling(visitId);
  }

  @Get('reports/department/:department')
  @Roles('admin', 'manager', 'accountant')
  async getDepartmentReport(
    @Param('department') department: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.billingService.generateDepartmentReport(
      department,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('bills')
  @Roles('admin', 'receptionist', 'doctor')
  async createComprehensiveBill(@Body() data: any, @Request() req) {
    return this.billingService.createComprehensiveBill({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Post('bills/package')
  @Roles('admin', 'receptionist')
  async createPackageBill(@Body() data: any, @Request() req) {
    return this.billingService.createPackageBill({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Post('bills/:id/discount')
  @Roles('admin')
  async applyDiscount(@Param('id') id: string, @Body() discountData: any, @Request() req) {
    return this.billingService.applyDiscount(id, {
      ...discountData,
      approvedBy: req.user.id,
    });
  }

  @Post('bills/:id/payments')
  @Roles('admin', 'receptionist', 'accountant')
  async processPayment(@Param('id') id: string, @Body() paymentData: any, @Request() req) {
    return this.billingService.processPayment(id, {
      ...paymentData,
      processedBy: req.user.id,
    });
  }

  @Post('bills/:id/insurance-claims')
  @Roles('admin', 'accountant')
  async processInsuranceClaim(@Param('id') id: string, @Body() claimData: any, @Request() req) {
    return this.billingService.processInsuranceClaim(id, {
      ...claimData,
      processedBy: req.user.id,
    });
  }

  @Get('bills')
  @Roles('admin', 'receptionist', 'accountant', 'patient')
  async getBills(@Query() query: any, @Request() req) {
    // If patient, only return their bills
    if (req.user.role === 'patient') {
      const patient = await this.billingService.getPatientBills(req.user.patientId);
      return patient;
    }
    return this.billingService.getAllBills(query);
  }

  @Get('bills/:id')
  @Roles('admin', 'receptionist', 'accountant', 'patient')
  async getBillById(@Param('id') id: string, @Request() req) {
    const bill = await this.billingService.getBillById(id);

    // Check if patient can access this bill
    if (req.user.role === 'patient' && bill.patientId !== req.user.patientId) {
      throw new ForbiddenException('Access denied');
    }

    return bill;
  }

  @Get('reports/department-billing/:department')
  @Roles('admin', 'manager', 'accountant')
  async getDepartmentBillingReport(
    @Param('department') department: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.billingService.getDepartmentBillingReport(
      department,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('analytics/revenue')
  @Roles('admin', 'manager', 'accountant')
  async getRevenueAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.billingService.getRevenueAnalytics(new Date(startDate), new Date(endDate));
  }
}
