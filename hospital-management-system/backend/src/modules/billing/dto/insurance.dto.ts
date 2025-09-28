import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PreAuthStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  EXPIRED = 'EXPIRED',
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

export enum InsuranceType {
  HEALTH = 'HEALTH',
  MEDICARE = 'MEDICARE',
  MEDICAID = 'MEDICAID',
  PRIVATE = 'PRIVATE',
  WORKERS_COMP = 'WORKERS_COMP',
  AUTO_INSURANCE = 'AUTO_INSURANCE',
}

export enum DenialReason {
  MEDICAL_NECESSITY = 'MEDICAL_NECESSITY',
  NOT_COVERED = 'NOT_COVERED',
  PRE_EXISTING_CONDITION = 'PRE_EXISTING_CONDITION',
  OUT_OF_NETWORK = 'OUT_OF_NETWORK',
  DOCUMENTATION_INSUFFICIENT = 'DOCUMENTATION_INSUFFICIENT',
  DUPLICATE_CLAIM = 'DUPLICATE_CLAIM',
  TIMELY_FILING = 'TIMELY_FILING',
  OTHER = 'OTHER',
}

export class InsuranceProviderDto {
  @ApiProperty({
    description: 'Insurance provider name',
    example: 'Blue Cross Blue Shield',
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    description: 'Insurance provider code/ID',
    example: 'BCBS',
  })
  @IsString()
  @Length(2, 20)
  code: string;

  @ApiProperty({
    description: 'Insurance type',
    enum: InsuranceType,
  })
  @IsEnum(InsuranceType)
  type: InsuranceType;

  @ApiPropertyOptional({
    description: 'Provider contact information',
  })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiPropertyOptional({
    description: 'Provider address',
  })
  @IsOptional()
  @IsString()
  address?: string;
}

export class PreAuthorizationRequestDto {
  @ApiProperty({
    description: 'Patient ID',
  })
  @IsString()
  patientId: string;

  @ApiProperty({
    description: 'Admission/Encounter ID',
  })
  @IsString()
  encounterId: string;

  @ApiProperty({
    description: 'Insurance provider information',
  })
  @ValidateNested()
  @Type(() => InsuranceProviderDto)
  insuranceProvider: InsuranceProviderDto;

  @ApiProperty({
    description: 'Policy number',
  })
  @IsString()
  @Length(5, 50)
  policyNumber: string;

  @ApiProperty({
    description: 'Member ID',
  })
  @IsString()
  @Length(5, 50)
  memberId: string;

  @ApiProperty({
    description: 'Requested services/procedures',
  })
  @IsArray()
  @IsString({ each: true })
  requestedServices: string[];

  @ApiProperty({
    description: 'Estimated cost for requested services',
  })
  @IsNumber()
  @Min(0)
  estimatedCost: number;

  @ApiProperty({
    description: 'Diagnosis codes (ICD-10)',
  })
  @IsArray()
  @IsString({ each: true })
  diagnosisCodes: string[];

  @ApiProperty({
    description: 'Procedure codes (CPT/HCPCS)',
  })
  @IsArray()
  @IsString({ each: true })
  procedureCodes: string[];

  @ApiProperty({
    description: 'Expected admission date',
  })
  @IsDateString()
  expectedAdmissionDate: string;

  @ApiPropertyOptional({
    description: 'Expected length of stay in days',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expectedLengthOfStay?: number;

  @ApiPropertyOptional({
    description: 'Clinical notes supporting medical necessity',
  })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @ApiPropertyOptional({
    description: 'Urgency level',
    enum: ['ELECTIVE', 'URGENT', 'EMERGENCY'],
  })
  @IsOptional()
  @IsEnum(['ELECTIVE', 'URGENT', 'EMERGENCY'])
  urgencyLevel?: 'ELECTIVE' | 'URGENT' | 'EMERGENCY';

  @ApiPropertyOptional({
    description: 'Additional documentation required',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocumentation?: string[];
}

export class PreAuthorizationResponseDto {
  @ApiProperty({
    description: 'Pre-authorization request ID',
  })
  @IsString()
  requestId: string;

  @ApiProperty({
    description: 'Pre-authorization status',
    enum: PreAuthStatus,
  })
  @IsEnum(PreAuthStatus)
  status: PreAuthStatus;

  @ApiProperty({
    description: 'Pre-authorization number (if approved)',
  })
  @IsOptional()
  @IsString()
  preAuthNumber?: string;

  @ApiProperty({
    description: 'Approved amount',
  })
  @IsNumber()
  @Min(0)
  approvedAmount: number;

  @ApiPropertyOptional({
    description: 'Approved services/procedures',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approvedServices?: string[];

  @ApiPropertyOptional({
    description: 'Denied services/procedures',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deniedServices?: string[];

  @ApiPropertyOptional({
    description: 'Denial reason',
    enum: DenialReason,
  })
  @IsOptional()
  @IsEnum(DenialReason)
  denialReason?: DenialReason;

  @ApiPropertyOptional({
    description: 'Denial details',
  })
  @IsOptional()
  @IsString()
  denialDetails?: string;

  @ApiPropertyOptional({
    description: 'Approval expiration date',
  })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Special conditions or limitations',
  })
  @IsOptional()
  @IsString()
  conditions?: string;

  @ApiProperty({
    description: 'Response date',
  })
  @IsDateString()
  responseDate: string;

  @ApiPropertyOptional({
    description: 'Insurance reviewer notes',
  })
  @IsOptional()
  @IsString()
  reviewerNotes?: string;
}

export class InsuranceClaimDto {
  @ApiProperty({
    description: 'Patient ID',
  })
  @IsString()
  patientId: string;

  @ApiProperty({
    description: 'Bill/Invoice ID',
  })
  @IsString()
  billId: string;

  @ApiProperty({
    description: 'Pre-authorization number (if applicable)',
  })
  @IsOptional()
  @IsString()
  preAuthNumber?: string;

  @ApiProperty({
    description: 'Insurance provider information',
  })
  @ValidateNested()
  @Type(() => InsuranceProviderDto)
  insuranceProvider: InsuranceProviderDto;

  @ApiProperty({
    description: 'Policy number',
  })
  @IsString()
  @Length(5, 50)
  policyNumber: string;

  @ApiProperty({
    description: 'Member ID',
  })
  @IsString()
  @Length(5, 50)
  memberId: string;

  @ApiProperty({
    description: 'Claim amount',
  })
  @IsNumber()
  @Min(0)
  claimAmount: number;

  @ApiProperty({
    description: 'Diagnosis codes (ICD-10)',
  })
  @IsArray()
  @IsString({ each: true })
  diagnosisCodes: string[];

  @ApiProperty({
    description: 'Procedure codes (CPT/HCPCS)',
  })
  @IsArray()
  @IsString({ each: true })
  procedureCodes: string[];

  @ApiProperty({
    description: 'Service dates',
  })
  @IsArray()
  @IsDateString({}, { each: true })
  serviceDates: string[];

  @ApiPropertyOptional({
    description: 'Place of service code',
  })
  @IsOptional()
  @IsString()
  placeOfService?: string;

  @ApiPropertyOptional({
    description: 'Referring physician NPI',
  })
  @IsOptional()
  @IsString()
  referringPhysicianNPI?: string;

  @ApiPropertyOptional({
    description: 'Attending physician NPI',
  })
  @IsOptional()
  @IsString()
  attendingPhysicianNPI?: string;

  @ApiPropertyOptional({
    description: 'Clinical notes',
  })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @ApiPropertyOptional({
    description: 'Supporting documentation',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingDocuments?: string[];
}

export class ClaimSubmissionDto {
  @ApiProperty({
    description: 'Claim data',
  })
  @ValidateNested()
  @Type(() => InsuranceClaimDto)
  claimData: InsuranceClaimDto;

  @ApiProperty({
    description: 'Submission method',
    enum: ['ELECTRONIC', 'PAPER', 'WEB_PORTAL'],
  })
  @IsEnum(['ELECTRONIC', 'PAPER', 'WEB_PORTAL'])
  submissionMethod: 'ELECTRONIC' | 'PAPER' | 'WEB_PORTAL';

  @ApiPropertyOptional({
    description: 'Priority submission',
  })
  @IsOptional()
  @IsBoolean()
  prioritySubmission?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ClaimResponseDto {
  @ApiProperty({
    description: 'Claim ID',
  })
  @IsString()
  claimId: string;

  @ApiProperty({
    description: 'Claim status',
    enum: ClaimStatus,
  })
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  @ApiProperty({
    description: 'Claim number assigned by insurance',
  })
  @IsString()
  claimNumber: string;

  @ApiProperty({
    description: 'Submitted amount',
  })
  @IsNumber()
  @Min(0)
  submittedAmount: number;

  @ApiProperty({
    description: 'Approved amount',
  })
  @IsNumber()
  @Min(0)
  approvedAmount: number;

  @ApiProperty({
    description: 'Denied amount',
  })
  @IsNumber()
  @Min(0)
  deniedAmount: number;

  @ApiPropertyOptional({
    description: 'Denial reason',
    enum: DenialReason,
  })
  @IsOptional()
  @IsEnum(DenialReason)
  denialReason?: DenialReason;

  @ApiPropertyOptional({
    description: 'Denial details',
  })
  @IsOptional()
  @IsString()
  denialDetails?: string;

  @ApiPropertyOptional({
    description: 'Processing date',
  })
  @IsOptional()
  @IsDateString()
  processingDate?: string;

  @ApiPropertyOptional({
    description: 'Payment date',
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Explanation of benefits',
  })
  @IsOptional()
  @IsString()
  explanationOfBenefits?: string;

  @ApiPropertyOptional({
    description: 'Insurance reviewer notes',
  })
  @IsOptional()
  @IsString()
  reviewerNotes?: string;
}

export class AppealRequestDto {
  @ApiProperty({
    description: 'Original claim ID',
  })
  @IsString()
  originalClaimId: string;

  @ApiProperty({
    description: 'Appeal reason',
  })
  @IsString()
  @Length(10, 1000)
  appealReason: string;

  @ApiProperty({
    description: 'Additional documentation provided',
  })
  @IsArray()
  @IsString({ each: true })
  additionalDocumentation: string[];

  @ApiPropertyOptional({
    description: 'Medical necessity justification',
  })
  @IsOptional()
  @IsString()
  medicalNecessityJustification?: string;

  @ApiPropertyOptional({
    description: 'Clinical evidence',
  })
  @IsOptional()
  @IsString()
  clinicalEvidence?: string;

  @ApiProperty({
    description: 'Appeal level',
    enum: ['FIRST_LEVEL', 'SECOND_LEVEL', 'EXTERNAL_REVIEW'],
  })
  @IsEnum(['FIRST_LEVEL', 'SECOND_LEVEL', 'EXTERNAL_REVIEW'])
  appealLevel: 'FIRST_LEVEL' | 'SECOND_LEVEL' | 'EXTERNAL_REVIEW';
}
