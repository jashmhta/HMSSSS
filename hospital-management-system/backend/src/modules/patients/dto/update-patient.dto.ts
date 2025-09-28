import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsDateString,
  IsEnum,
  IsPhoneNumber,
  Length,
  Matches,
} from 'class-validator';

export class UpdatePatientDto {
  @ApiPropertyOptional({
    description: 'Patient first name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'First name must contain only letters and spaces' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Patient last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Last name must contain only letters and spaces' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Patient email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Patient phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Patient date of birth',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Patient gender',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiPropertyOptional({
    description: 'Patient address',
    example: '123 Main St, City, State 12345',
  })
  @IsOptional()
  @IsString()
  @Length(10, 200)
  address?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact name',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  emergencyContactName?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact phone',
    example: '+1234567890',
  })
  @IsOptional()
  @IsPhoneNumber()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({
    description: 'Allergies',
    example: ['Penicillin', 'Peanuts'],
  })
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'Chronic conditions',
    example: 'Diabetes, Hypertension',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  chronicConditions?: string;
}
