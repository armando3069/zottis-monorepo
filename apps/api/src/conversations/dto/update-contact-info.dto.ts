import {
  IsString,
  IsOptional,
  IsIn,
  IsEmail,
  Matches,
} from 'class-validator';

const LIFECYCLE_VALUES = [
  'NEW_LEAD',
  'HOT_LEAD',
  'PAYMENT',
  'CUSTOMER',
  'COLD_LEAD',
] as const;

export class UpdateContactInfoDto {
  @IsOptional()
  @IsIn(LIFECYCLE_VALUES)
  lifecycleStatus?: string;

  @IsOptional()
  @IsEmail({}, { message: 'contactEmail must be a valid email address' })
  contactEmail?: string | null;

  @IsOptional()
  @Matches(/^[+\d\s\-(). ]+$/, { message: 'contactPhone must contain only digits and +, -, (, )' })
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  contactCountry?: string | null;

  @IsOptional()
  @IsString()
  contactLanguage?: string | null;
}
