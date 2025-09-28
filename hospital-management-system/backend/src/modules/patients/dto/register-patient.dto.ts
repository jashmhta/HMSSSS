import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsPhoneNumber,
  Length,
  Matches,
} from 'class-validator';

export class RegisterPatientDto {
  @ApiProperty({
    description: 'Patient first name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'First name must contain only letters and spaces' })
  firstName: string;

  @ApiProperty({
    description: 'Patient last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Last name must contain only letters and spaces' })
  lastName: string;

  @ApiProperty({
    description: 'Patient email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Patient phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({
    description: 'Patient date of birth',
    example: '1990-01-01',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Patient gender',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiProperty({
    description: 'Patient address',
    example: '123 Main St, City, State 12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(10, 200)
  address?: string;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'Jane Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  emergencyContactName?: string;

  @ApiProperty({
    description: 'Emergency contact phone',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  emergencyContactPhone?: string;

  @ApiProperty({
    description: 'Blood type',
    example: 'O_POSITIVE',
    enum: [
      'A_POSITIVE',
      'A_NEGATIVE',
      'B_POSITIVE',
      'B_NEGATIVE',
      'AB_POSITIVE',
      'AB_NEGATIVE',
      'O_POSITIVE',
      'O_NEGATIVE',
    ],
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'A_POSITIVE',
    'A_NEGATIVE',
    'B_POSITIVE',
    'B_NEGATIVE',
    'AB_POSITIVE',
    'AB_NEGATIVE',
    'O_POSITIVE',
    'O_NEGATIVE',
  ])
  bloodType?:
    | 'A_POSITIVE'
    | 'A_NEGATIVE'
    | 'B_POSITIVE'
    | 'B_NEGATIVE'
    | 'AB_POSITIVE'
    | 'AB_NEGATIVE'
    | 'O_POSITIVE'
    | 'O_NEGATIVE';

  @ApiProperty({
    description: 'Allergies',
    example: ['Penicillin', 'Peanuts'],
    required: false,
  })
  @IsOptional()
  allergies?: string[];

  @ApiProperty({
    description: 'Chronic conditions',
    example: 'Diabetes, Hypertension',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  chronicConditions?: string;

  @ApiProperty({
    description: 'Insurance provider',
    example: 'Blue Cross Blue Shield',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  insuranceProvider?: string;

  @ApiProperty({
    description: 'Insurance policy number',
    example: 'POL123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 50)
  insurancePolicyNumber?: string;

  @ApiProperty({
    description: 'Preferred language',
    example: 'English',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  preferredLanguage?: string;

  @ApiProperty({
    description: 'Occupation',
    example: 'Software Engineer',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  occupation?: string;

  @ApiProperty({
    description: 'Registration type',
    example: 'STAFF',
    enum: ['SELF', 'STAFF', 'EMERGENCY'],
  })
  @IsEnum(['SELF', 'STAFF', 'EMERGENCY'])
  registrationType: 'SELF' | 'STAFF' | 'EMERGENCY';
}
