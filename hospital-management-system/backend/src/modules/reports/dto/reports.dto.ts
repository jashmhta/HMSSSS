import { IsEnum, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { ReportType, ReportFormat } from './report.enums';

export class GenerateReportDto {
  @IsEnum(ReportType)
  @IsOptional()
  reportType?: ReportType;

  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat = ReportFormat.PDF;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsUUID()
  @IsOptional()
  generatedBy?: string;
}

export class ReportFilterDto {
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class PatientReportDto {
  patientId: string;
  patientName: string;
  dateOfBirth: Date;
  gender: string;
  bloodType: string;
  medicalHistory: any[];
  currentMedications: string[];
  allergies: string[];
  recentVisits: any[];
  labResults: any[];
  radiologyReports: any[];
}

export class DepartmentReportDto {
  department: string;
  totalPatients: number;
  totalAppointments: number;
  totalProcedures: number;
  revenue: number;
  averageWaitTime: number;
  patientSatisfaction: number;
}

export class FinancialReportDto {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  revenueByDepartment: any[];
  expenseBreakdown: any[];
  outstandingInvoices: number;
  paidInvoices: number;
}

export class InventoryReportDto {
  itemName: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  totalValue: number;
  lastRestocked: Date;
  expiryDate?: Date;
  status: string;
}

export class StaffPerformanceReportDto {
  staffId: string;
  staffName: string;
  department: string;
  role: string;
  totalPatients: number;
  averageRating: number;
  completedTasks: number;
  pendingTasks: number;
  workingHours: number;
  efficiency: number;
}
