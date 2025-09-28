import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { BloodType, DonationType, DonationStatus, ScreeningResult } from '@prisma/client';

export class CreateBloodDonationDto {
  @IsUUID()
  @IsNotEmpty()
  donorId: string;

  @IsEnum(BloodType)
  @IsNotEmpty()
  bloodType: BloodType;

  @IsNumber()
  @Min(100)
  @Max(500)
  quantity: number; // in ml

  @IsEnum(DonationType)
  @IsNotEmpty()
  donationType: DonationType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateBloodDonationDto {
  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus;

  @IsOptional()
  @IsEnum(ScreeningResult)
  screeningResult?: ScreeningResult;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  @IsNotEmpty()
  updatedBy: string;
}

export class BloodDonationFilterDto {
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus;

  @IsOptional()
  @IsEnum(DonationType)
  donationType?: DonationType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class BloodInventoryDto {
  @IsEnum(BloodType)
  @IsNotEmpty()
  bloodType: BloodType;

  @IsNumber()
  @Min(0)
  availableUnits: number;

  @IsNumber()
  @Min(0)
  totalVolume: number; // in ml

  @IsNumber()
  @Min(0)
  quarantinedUnits: number;

  @IsNumber()
  @Min(0)
  expiredUnits: number;
}

export class BloodRequestDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsEnum(BloodType)
  @IsNotEmpty()
  bloodType: BloodType;

  @IsNumber()
  @Min(1)
  unitsRequired: number;

  @IsString()
  @IsNotEmpty()
  urgency: string; // EMERGENCY, URGENT, ROUTINE

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  @IsNotEmpty()
  requestedBy: string;

  @IsOptional()
  @IsDateString()
  requiredBy?: string;
}

export class BloodTransfusionDto {
  @IsUUID()
  @IsNotEmpty()
  donationId: string;

  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsNumber()
  @Min(50)
  @Max(500)
  volumeTransfused: number; // in ml

  @IsString()
  @IsNotEmpty()
  transfusionReaction: string; // NONE, MILD, SEVERE

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  @IsNotEmpty()
  performedBy: string;
}
