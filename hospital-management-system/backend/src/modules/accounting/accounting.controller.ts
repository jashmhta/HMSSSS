import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { InvoiceStatus, ExpenseCategory, AssetCategory, AssetStatus } from '@prisma/client';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { AccountingService } from './accounting.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreateExpenseDto,
  CreateAssetDto,
  UpdateAssetDto,
  CreateReferralIncomeDto,
  AccountingReportDto,
} from './dto/accounting.dto';

@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // Invoice Management
  @Post('invoices')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  async createInvoice(@Body(ValidationPipe) data: CreateInvoiceDto) {
    return this.accountingService.createInvoice(data);
  }

  @Put('invoices/:id')
  @Roles(UserRole.ADMIN)
  async updateInvoice(@Param('id') id: string, @Body(ValidationPipe) data: UpdateInvoiceDto) {
    return this.accountingService.updateInvoice(id, data);
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  async getInvoices(
    @Query('status') status?: InvoiceStatus,
    @Query('patientId') patientId?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.accountingService.getInvoices(status, patientId, page, limit);
  }

  @Get('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  async getInvoiceById(@Param('id') id: string) {
    return this.accountingService.getInvoiceById(id);
  }

  // Expense Management
  @Post('expenses')
  @Roles(UserRole.ADMIN)
  async createExpense(@Body(ValidationPipe) data: CreateExpenseDto) {
    return this.accountingService.createExpense(data);
  }

  @Get('expenses')
  @Roles(UserRole.ADMIN)
  async getExpenses(
    @Query('category') category?: ExpenseCategory,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.accountingService.getExpenses(
      category,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      page,
      limit,
    );
  }

  // Asset Management
  @Post('assets')
  @Roles(UserRole.ADMIN)
  async createAsset(@Body(ValidationPipe) data: CreateAssetDto) {
    return this.accountingService.createAsset(data);
  }

  @Put('assets/:id')
  @Roles(UserRole.ADMIN)
  async updateAsset(@Param('id') id: string, @Body(ValidationPipe) data: UpdateAssetDto) {
    return this.accountingService.updateAsset(id, data);
  }

  @Get('assets')
  @Roles(UserRole.ADMIN)
  async getAssets(
    @Query('category') category?: AssetCategory,
    @Query('status') status?: AssetStatus,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.accountingService.getAssets(category, status, page, limit);
  }

  // Referral Income
  @Post('referral-income')
  @Roles(UserRole.ADMIN)
  async createReferralIncome(@Body(ValidationPipe) data: CreateReferralIncomeDto) {
    return this.accountingService.createReferralIncome(data);
  }

  // Reports
  @Post('reports/financial-summary')
  @Roles(UserRole.ADMIN)
  async getFinancialSummary(@Body(ValidationPipe) data: AccountingReportDto) {
    return this.accountingService.getFinancialSummary(data);
  }

  @Get('reports/expense-breakdown')
  @Roles(UserRole.ADMIN)
  async getExpenseBreakdown(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountingService.getExpenseBreakdown(new Date(startDate), new Date(endDate));
  }

  @Get('reports/revenue-trends')
  @Roles(UserRole.ADMIN)
  async getRevenueTrends(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.accountingService.getRevenueTrends(new Date(startDate), new Date(endDate));
  }
}
