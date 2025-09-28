import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VentilatorMode {
  AC = 'AC', // Assist Control
  SIMV = 'SIMV', // Synchronized Intermittent Mandatory Ventilation
  PSV = 'PSV', // Pressure Support Ventilation
  CPAP = 'CPAP', // Continuous Positive Airway Pressure
  BiPAP = 'BiPAP', // Bilevel Positive Airway Pressure
}

export enum VentilatorStatus {
  ACTIVE = 'ACTIVE',
  STANDBY = 'STANDBY',
  OFF = 'OFF',
  MALFUNCTION = 'MALFUNCTION',
}

export enum ConsciousnessLevel {
  ALERT = 'ALERT',
  CONFUSED = 'CONFUSED',
  STUPOROUS = 'STUPOROUS',
  COMATOSE = 'COMATOSE',
  SEDATED = 'SEDATED',
}

export enum PainAssessment {
  NONE = 'NONE',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  UNBEARABLE = 'UNBEARABLE',
}

export enum GlasgowComaScale {
  EYE_OPENING_SPONTANEOUS = 4,
  EYE_OPENING_TO_VOICE = 3,
  EYE_OPENING_TO_PAIN = 2,
  EYE_OPENING_NONE = 1,
  VERBAL_ORIENTED = 5,
  VERBAL_CONFUSED = 4,
  VERBAL_INAPPROPRIATE = 3,
  VERBAL_INCOMPREHENSIBLE = 2,
  VERBAL_NONE = 1,
  MOTOR_OBEYS_COMMANDS = 6,
  MOTOR_LOCALIZES_PAIN = 5,
  MOTOR_WITHDRAWS_PAIN = 4,
  MOTOR_ABNORMAL_FLEXION = 3,
  MOTOR_EXTENSOR_RESPONSE = 2,
  MOTOR_NONE = 1,
}

export class VentilatorSettingsDto {
  @ApiProperty({
    description: 'Ventilator mode',
    enum: VentilatorMode,
  })
  @IsEnum(VentilatorMode)
  mode: VentilatorMode;

  @ApiProperty({
    description: 'Tidal volume in mL',
    minimum: 200,
    maximum: 1000,
  })
  @IsNumber()
  @Min(200)
  @Max(1000)
  tidalVolume: number;

  @ApiProperty({
    description: 'Respiratory rate (breaths per minute)',
    minimum: 8,
    maximum: 40,
  })
  @IsNumber()
  @Min(8)
  @Max(40)
  respiratoryRate: number;

  @ApiProperty({
    description: 'FiO2 (fraction of inspired oxygen) as percentage',
    minimum: 21,
    maximum: 100,
  })
  @IsNumber()
  @Min(21)
  @Max(100)
  fio2: number;

  @ApiProperty({
    description: 'PEEP (Positive End-Expiratory Pressure) in cmH2O',
    minimum: 0,
    maximum: 20,
  })
  @IsNumber()
  @Min(0)
  @Max(20)
  peep: number;

  @ApiPropertyOptional({
    description: 'Peak inspiratory pressure in cmH2O',
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(60)
  peakPressure?: number;

  @ApiPropertyOptional({
    description: 'Pressure support in cmH2O',
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(30)
  pressureSupport?: number;
}

export class VentilatorReadingDto {
  @ApiProperty({
    description: 'Ventilator status',
    enum: VentilatorStatus,
  })
  @IsEnum(VentilatorStatus)
  status: VentilatorStatus;

  @ApiProperty({
    description: 'Current ventilator settings',
  })
  @ValidateNested()
  @Type(() => VentilatorSettingsDto)
  settings: VentilatorSettingsDto;

  @ApiProperty({
    description: 'Measured tidal volume in mL',
  })
  @IsNumber()
  @Min(0)
  measuredTidalVolume: number;

  @ApiProperty({
    description: 'Measured respiratory rate',
  })
  @IsNumber()
  @Min(0)
  measuredRespiratoryRate: number;

  @ApiProperty({
    description: 'Plateau pressure in cmH2O',
  })
  @IsNumber()
  @Min(0)
  plateauPressure: number;

  @ApiProperty({
    description: 'Airway resistance in cmH2O/L/sec',
  })
  @IsNumber()
  @Min(0)
  airwayResistance: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GlasgowComaScaleDto {
  @ApiProperty({
    description: 'Eye opening response',
    enum: GlasgowComaScale,
    enumName: 'GlasgowComaScale',
  })
  @IsEnum(GlasgowComaScale)
  eyeOpening: GlasgowComaScale;

  @ApiProperty({
    description: 'Verbal response',
    enum: GlasgowComaScale,
  })
  @IsEnum(GlasgowComaScale)
  verbal: GlasgowComaScale;

  @ApiProperty({
    description: 'Motor response',
    enum: GlasgowComaScale,
  })
  @IsEnum(GlasgowComaScale)
  motor: GlasgowComaScale;

  @ApiProperty({
    description: 'Total GCS score (calculated)',
  })
  @IsNumber()
  @Min(3)
  @Max(15)
  totalScore: number;
}

export class ICUAssessmentDto {
  @ApiProperty({
    description: 'Level of consciousness',
    enum: ConsciousnessLevel,
  })
  @IsEnum(ConsciousnessLevel)
  consciousness: ConsciousnessLevel;

  @ApiPropertyOptional({
    description: 'Glasgow Coma Scale assessment',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GlasgowComaScaleDto)
  gcs?: GlasgowComaScaleDto;

  @ApiProperty({
    description: 'Pain assessment',
    enum: PainAssessment,
  })
  @IsEnum(PainAssessment)
  painLevel: PainAssessment;

  @ApiPropertyOptional({
    description: 'Pain score (0-10)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  painScore?: number;

  @ApiProperty({
    description: 'Sedation status',
  })
  @IsBoolean()
  isSedated: boolean;

  @ApiPropertyOptional({
    description: 'Sedation medication and dosage',
  })
  @IsOptional()
  @IsString()
  sedationDetails?: string;

  @ApiProperty({
    description: 'Mechanical ventilation status',
  })
  @IsBoolean()
  onVentilator: boolean;

  @ApiPropertyOptional({
    description: 'Ventilator readings',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VentilatorReadingDto)
  ventilatorReading?: VentilatorReadingDto;

  @ApiProperty({
    description: 'Urine output in mL for last hour',
  })
  @IsNumber()
  @Min(0)
  urineOutput: number;

  @ApiPropertyOptional({
    description: 'Fluid balance in mL (positive = intake > output)',
  })
  @IsOptional()
  @IsNumber()
  fluidBalance?: number;

  @ApiPropertyOptional({
    description: 'Active drips/medications',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activeDrips?: string[];

  @ApiPropertyOptional({
    description: 'Neurological assessment notes',
  })
  @IsOptional()
  @IsString()
  neurologicalNotes?: string;

  @ApiPropertyOptional({
    description: 'Cardiovascular assessment notes',
  })
  @IsOptional()
  @IsString()
  cardiovascularNotes?: string;

  @ApiPropertyOptional({
    description: 'Respiratory assessment notes',
  })
  @IsOptional()
  @IsString()
  respiratoryNotes?: string;

  @ApiPropertyOptional({
    description: 'Additional assessment notes',
  })
  @IsOptional()
  @IsString()
  assessmentNotes?: string;
}

export class ICUTransferDto {
  @ApiProperty({
    description: 'Reason for ICU admission',
  })
  @IsString()
  admissionReason: string;

  @ApiProperty({
    description: 'Expected ICU length of stay in days',
  })
  @IsNumber()
  @Min(1)
  expectedLosDays: number;

  @ApiProperty({
    description: 'APACHE II score',
  })
  @IsNumber()
  @Min(0)
  @Max(71)
  apacheIIScore: number;

  @ApiProperty({
    description: 'SOFA score',
  })
  @IsNumber()
  @Min(0)
  @Max(24)
  sofaScore: number;

  @ApiPropertyOptional({
    description: 'Ventilator settings if patient requires ventilation',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VentilatorSettingsDto)
  initialVentilatorSettings?: VentilatorSettingsDto;

  @ApiPropertyOptional({
    description: 'Critical care requirements',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  criticalCareRequirements?: string[];
}

export class ICUProgressNoteDto {
  @ApiProperty({
    description: 'Daily progress summary',
  })
  @IsString()
  dailySummary: string;

  @ApiProperty({
    description: 'Current ICU assessment',
  })
  @ValidateNested()
  @Type(() => ICUAssessmentDto)
  assessment: ICUAssessmentDto;

  @ApiProperty({
    description: 'Plan for next 24 hours',
  })
  @IsString()
  carePlan: string;

  @ApiPropertyOptional({
    description: 'Consultations requested',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  consultations?: string[];

  @ApiPropertyOptional({
    description: 'Family communication notes',
  })
  @IsOptional()
  @IsString()
  familyCommunication?: string;
}

export class ICUDischargeReadinessDto {
  @ApiProperty({
    description: 'Patient ready for ICU discharge',
  })
  @IsBoolean()
  readyForDischarge: boolean;

  @ApiPropertyOptional({
    description: 'Reason not ready for discharge',
  })
  @IsOptional()
  @IsString()
  dischargeDelayReason?: string;

  @ApiPropertyOptional({
    description: 'Discharge destination',
    enum: ['WARD', 'HOME', 'ANOTHER_FACILITY', 'HOSPICE'],
  })
  @IsOptional()
  @IsEnum(['WARD', 'HOME', 'ANOTHER_FACILITY', 'HOSPICE'])
  dischargeDestination?: string;

  @ApiPropertyOptional({
    description: 'Discharge criteria met',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dischargeCriteria?: string[];
}
