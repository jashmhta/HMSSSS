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
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';

import { BillingService } from './billing.service';

/**
 *
 */
@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  /**
   *
   */
  constructor(private readonly billingService: BillingService) {}

  /**
   *
   */
  @Post('invoices')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async createInvoice(@Body() data: any) {
    return this.billingService.createInvoice(data);
  }

  /**
   *
   */
  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async getInvoices(@Query() query: any) {
    return this.billingService.getInvoices();
  }

  /**
   *
   */
  @Get('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  async getInvoiceById(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  /**
   *
   */
  @Put('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async updateInvoice(@Param('id') id: string, @Body() data: any) {
    return this.billingService.updateInvoice(id, data);
  }

  /**
   *
   */
  @Post('invoices/:id/items')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async addInvoiceItem(@Param('id') id: string, @Body() item: any) {
    return this.billingService.addInvoiceItem(id, item);
  }

  /**
   *
   */
  @Post('invoices/:id/discount')
  @Roles(UserRole.ADMIN)
  async applyInvoiceDiscount(@Param('id') id: string, @Body() discountData: any) {
    return this.billingService.applyDiscountToBill(id, {
      ...discountData,
      approvedBy: 'admin', // This should come from req.user.id in production
    });
  }

  /**
   *
   */
  @Post('invoices/:id/payments')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async processInvoicePayment(@Param('id') id: string, @Body() paymentData: any) {
    return this.billingService.processPaymentForBill(id, {
      ...paymentData,
      processedBy: 'receptionist', // This should come from req.user.id in production
    });
  }

  /**
   *
   */
  @Get('opd')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async getOPDBilling(@Query('packageId') packageId?: string) {
    return this.billingService.getOPDBilling(packageId);
  }

  /**
   *
   */
  @Get('ipd/:admissionId')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async getIPDBilling(@Param('admissionId') admissionId: string) {
    return this.billingService.getIPDBilling(admissionId);
  }

  /**
   *
   */
  @Get('emergency/:visitId')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async getEmergencyBilling(@Param('visitId') visitId: string) {
    return this.billingService.getEmergencyBilling(visitId);
  }

  /**
   *
   */
  @Get('reports/department/:department')
  @Roles(UserRole.ADMIN)
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

  /**
   *
   */
  @Post('bills')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  async createComprehensiveBill(@Body() data: any, @Request() req) {
    return this.billingService.createComprehensiveBill({
      ...data,
      createdBy: req.user.id,
    });
  }

  /**
   *
   */
  @Post('bills/package')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async createPackageBill(@Body() data: any, @Request() req) {
    return this.billingService.createPackageBill({
      ...data,
      createdBy: req.user.id,
    });
  }

  /**
   *
   */
  @Post('bills/:id/discount')
  @Roles(UserRole.ADMIN)
  async applyDiscount(@Param('id') id: string, @Body() discountData: any, @Request() req) {
    return this.billingService.applyDiscountToBill(id, {
      ...discountData,
      approvedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Post('bills/:id/payments')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async processPayment(@Param('id') id: string, @Body() paymentData: any, @Request() req) {
    return this.billingService.processPaymentForBill(id, {
      ...paymentData,
      processedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Post('bills/:id/insurance-claims')
  @Roles(UserRole.ADMIN)
  async processInsuranceClaim(@Param('id') id: string, @Body() claimData: any, @Request() req) {
    return this.billingService.processInsuranceClaim(id, {
      ...claimData,
      processedBy: req.user.id,
    });
  }

  /**
   *
   */
  @Get('bills')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  async getBills(@Query() query: any, @Request() req) {
    // If patient, only return their bills
    if (req.user.role === UserRole.PATIENT) {
      return await this.billingService.getPatientBills(req.user.patientId);
    }
    return this.billingService.getAllBills(query);
  }

  /**
   *
   */
  @Get('bills/:id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  async getBillById(@Param('id') id: string, @Request() req) {
    const bill = await this.billingService.getBillById(id);

    // Check if patient can access this bill
    if (req.user.role === UserRole.PATIENT && bill.patientId !== req.user.patientId) {
      throw new ForbiddenException('Access denied');
    }

    return bill;
  }

  /**
   *
   */
  @Get('reports/department-billing/:department')
  @Roles(UserRole.ADMIN)
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

  /**
   *
   */
  @Get('analytics/revenue')
  @Roles(UserRole.ADMIN)
  async getRevenueAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.billingService.getRevenueAnalytics(new Date(startDate), new Date(endDate));
  }
}
