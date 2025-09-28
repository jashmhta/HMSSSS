/*[object Object]*/
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDate,
  IsArray,
  IsObject,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum AdmissionType {
  EMERGENCY = 'EMERGENCY',
  ELECTIVE = 'ELECTIVE',
  TRANSFER = 'TRANSFER',
}

export enum AdmissionPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum WardType {
  GENERAL = 'GENERAL',
  PRIVATE = 'PRIVATE',
  ICU = 'ICU',
  CCU = 'CCU',
  NICU = 'NICU',
  PICU = 'PICU',
}

export enum DischargeType {
  REGULAR = 'REGULAR',
  AGAINST_MEDICAL_ADVICE = 'AGAINST_MEDICAL_ADVICE',
  TRANSFER = 'TRANSFER',
  EXPIRED = 'EXPIRED',
}

export enum NoteType {
  DAILY = 'DAILY',
  SPECIALIST_CONSULTATION = 'SPECIALIST_CONSULTATION',
  PROCEDURE = 'PROCEDURE',
  COMPLICATION = 'COMPLICATION',
  IMPROVEMENT = 'IMPROVEMENT',
}

export enum ShiftType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

export class InsuranceInfoDto {
  @IsString()
  provider: string;

  @IsString()
  policyNumber: string;

  @IsEnum(['PENDING', 'APPROVED', 'DENIED'])
  approvalStatus: 'PENDING' | 'APPROVED' | 'DENIED';

  @IsOptional()
  @IsString()
  preAuthNumber?: string;
}

export class CreateIPDAdmissionDto {
  @IsString()
  patientId: string;

  @IsString()
  admittingDoctorId: string;

  @IsString()
  primaryDiagnosis: string;

  @IsEnum(AdmissionType)
  admissionType: AdmissionType;

  @IsEnum(AdmissionPriority)
  priority: AdmissionPriority;

  @IsOptional()
  @IsNumber()
  expectedStayDays?: number;

  @IsString()
  admittingDepartment: string;

  @IsEnum(WardType)
  wardType: WardType;

  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceInfoDto)
  insuranceInfo?: InsuranceInfoDto;

  @IsOptional()
  @IsString()
  admittingNotes?: string;
}

export class BedAssignmentDto {
  @IsString()
  bedId: string;

  @IsString()
  roomNumber: string;

  @IsString()
  wardType: WardType;
}

export class ProgressNoteDto {
  @IsEnum(NoteType)
  noteType: NoteType;

  @IsString()
  subjective: string;

  @IsString()
  objective: string;

  @IsString()
  assessment: string;

  @IsString()
  plan: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orders?: string[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  followUpDate?: Date;

  @IsOptional()
  @IsBoolean()
  private?: boolean;
}

export class VitalSignsDto {
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  painScore?: number;

  @IsOptional()
  @IsEnum(['ALERT', 'CONFUSED', 'STUPOROUS', 'COMATOSE'])
  consciousness?: 'ALERT' | 'CONFUSED' | 'STUPOROUS' | 'COMATOSE';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class NursingNoteDto {
  @IsEnum(ShiftType)
  shift: ShiftType;

  @IsArray()
  @IsString({ each: true })
  activities: string[];

  @IsString()
  observations: string;

  @IsArray()
  @IsString({ each: true })
  interventions: string[];

  @IsString()
  patientResponse: string;

  @IsOptional()
  @IsString()
  handoffNotes?: string;
}

export class DischargeMedicationDto {
  @IsString()
  medicationId: string;

  @IsString()
  dosage: string;

  @IsString()
  frequency: string;

  @IsNumber()
  duration: number;
}

export class DischargeSummaryDto {
  @IsArray()
  @IsString({ each: true })
  finalDiagnosis: string[];

  @IsString()
  treatmentGiven: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  complications?: string[];

  @IsEnum(['CURED', 'IMPROVED', 'UNCHANGED', 'WORSENED'])
  outcome: 'CURED' | 'IMPROVED' | 'UNCHANGED' | 'WORSENED';

  @IsString()
  followUpInstructions: string;

  @IsArray()
  @ValidateNested()
  @Type(() => DischargeMedicationDto)
  medicationsOnDischarge: DischargeMedicationDto[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  followUpDate?: Date;
}

export class DischargePatientDto {
  @IsEnum(DischargeType)
  dischargeType: DischargeType;

  @ValidateNested()
  @Type(() => DischargeSummaryDto)
  dischargeSummary: DischargeSummaryDto;

  @IsOptional()
  @IsString()
  dischargeNotes?: string;
}

export class UpdateIPDAdmissionDto {
  @IsOptional()
  @IsString()
  primaryDiagnosis?: string;

  @IsOptional()
  @IsEnum(AdmissionPriority)
  priority?: AdmissionPriority;

  @IsOptional()
  @IsNumber()
  expectedStayDays?: number;

  @IsOptional()
  @IsString()
  admittingDepartment?: string;

  @IsOptional()
  @IsEnum(WardType)
  wardType?: WardType;

  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceInfoDto)
  insuranceInfo?: InsuranceInfoDto;

  @IsOptional()
  @IsString()
  admittingNotes?: string;
}

export class TransferPatientDto {
  @IsOptional()
  @IsString()
  newBedId?: string;

  @IsOptional()
  @IsEnum(WardType)
  newWardType?: WardType;

  @IsString()
  transferReason: string;
}

export class BedInfoDto {
  @IsString()
  id: string;

  @IsString()
  bedNumber: string;

  @IsString()
  roomNumber: string;

  @IsEnum(WardType)
  wardType: WardType;

  @IsEnum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'])
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

  @IsOptional()
  @IsObject()
  currentPatient?: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
  };
}

export class IPDAdmissionResponse {
  @IsString()
  id: string;

  @IsString()
  admissionNumber: string;

  @IsObject()
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
    dateOfBirth: Date;
    gender: string;
  };

  @IsObject()
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };

  @IsObject()
  bedAssignment: BedInfoDto;

  @IsString()
  primaryDiagnosis: string;

  @IsEnum(AdmissionType)
  admissionType: AdmissionType;

  @IsEnum(AdmissionPriority)
  priority: AdmissionPriority;

  @IsEnum(WardType)
  wardType: WardType;

  @IsString()
  department: string;

  @IsDate()
  admissionDate: Date;

  @IsOptional()
  @IsDate()
  dischargeDate?: Date;

  @IsOptional()
  @IsNumber()
  lengthOfStay?: number;

  @IsEnum(['ADMITTED', 'DISCHARGED', 'TRANSFERRED'])
  status: 'ADMITTED' | 'DISCHARGED' | 'TRANSFERRED';

  @IsOptional()
  @IsObject()
  insuranceInfo?: InsuranceInfoDto;

  @IsOptional()
  @IsString()
  admittingNotes?: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
