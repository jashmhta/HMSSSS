import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import {
  InvoiceStatus,
  ExpenseCategory,
  AssetCategory,
  AssetStatus,
  ReferralStatus,
  CostFrequency,
  VariableCostCategory,
} from '@prisma/client';

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  updatedBy: string;
}

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(ExpenseCategory)
  @IsNotEmpty()
  category: ExpenseCategory;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsUUID()
  @IsNotEmpty()
  createdBy: string;
}

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AssetCategory)
  @IsNotEmpty()
  category: AssetCategory;

  @IsNumber()
  @Min(0.01)
  value: number;

  @IsDateString()
  @IsNotEmpty()
  purchaseDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depreciationRate?: number;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsUUID()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  value?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depreciationRate?: number;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsUUID()
  @IsNotEmpty()
  updatedBy: string;
}

export class CreateReferralIncomeDto {
  @IsString()
  @IsNotEmpty()
  source: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsDateString()
  referralDate?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsUUID()
  @IsNotEmpty()
  createdBy: string;
}

export class AccountingReportDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;
}

export class FinancialSummaryDto {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}
