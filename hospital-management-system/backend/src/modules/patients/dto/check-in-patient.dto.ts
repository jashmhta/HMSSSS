import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, Length } from 'class-validator';

export class CheckInPatientDto {
  @ApiProperty({
    description: 'Reason for visit',
    example: 'Annual checkup',
  })
  @IsString()
  @Length(5, 500)
  reasonForVisit: string;

  @ApiProperty({
    description: 'Priority level',
    example: 'ROUTINE',
    enum: ['ROUTINE', 'URGENT', 'EMERGENCY'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ROUTINE', 'URGENT', 'EMERGENCY'])
  priority?: 'ROUTINE' | 'URGENT' | 'EMERGENCY' = 'ROUTINE';

  @ApiProperty({
    description: 'Department to visit',
    example: 'CARDIOLOGY',
    enum: [
      'GENERAL_MEDICINE',
      'CARDIOLOGY',
      'DERMATOLOGY',
      'ORTHOPEDICS',
      'PEDIATRICS',
      'GYNECOLOGY',
      'OPHTHALMOLOGY',
      'ENT',
      'PSYCHIATRY',
      'DENTISTRY',
    ],
  })
  @IsEnum([
    'GENERAL_MEDICINE',
    'CARDIOLOGY',
    'DERMATOLOGY',
    'ORTHOPEDICS',
    'PEDIATRICS',
    'GYNECOLOGY',
    'OPHTHALMOLOGY',
    'ENT',
    'PSYCHIATRY',
    'DENTISTRY',
  ])
  department: string;

  @ApiProperty({
    description: 'Current symptoms',
    example: 'Mild headache and fatigue',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  symptoms?: string;

  @ApiProperty({
    description: 'Pain level (1-10)',
    example: 3,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  painLevel?: number;

  @ApiProperty({
    description: 'Blood pressure (systolic/diastolic)',
    example: '120/80',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 10)
  bloodPressure?: string;

  @ApiProperty({
    description: 'Temperature in Celsius',
    example: 36.5,
    minimum: 30,
    maximum: 45,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @ApiProperty({
    description: 'Heart rate (BPM)',
    example: 72,
    minimum: 40,
    maximum: 200,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(200)
  heartRate?: number;

  @ApiProperty({
    description: 'Weight in kg',
    example: 70.5,
    minimum: 20,
    maximum: 300,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  weight?: number;

  @ApiProperty({
    description: 'Height in cm',
    example: 175,
    minimum: 50,
    maximum: 250,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(250)
  height?: number;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Patient reports recent travel to endemic area',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiProperty({
    description: 'Purpose of visit',
    example: 'CONSULTATION',
    enum: ['CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'EMERGENCY'],
  })
  @IsEnum(['CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'EMERGENCY'])
  purpose: 'CONSULTATION' | 'FOLLOW_UP' | 'PROCEDURE' | 'EMERGENCY';
}
