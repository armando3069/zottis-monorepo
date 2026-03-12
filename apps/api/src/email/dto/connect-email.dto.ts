import { IsEmail, IsString, IsOptional, IsInt, IsBoolean, IsIn } from 'class-validator';

export class ImapOverrideDto {
  @IsString()
  host: string;

  @IsInt()
  port: number;

  @IsBoolean()
  secure: boolean;
}

export class SmtpOverrideDto {
  @IsString()
  host: string;

  @IsInt()
  port: number;

  @IsBoolean()
  secure: boolean;
}

export class ConnectEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsIn(['gmail', 'outlook', 'custom'])
  provider: 'gmail' | 'outlook' | 'custom';

  @IsOptional()
  imapOverride?: ImapOverrideDto;

  @IsOptional()
  smtpOverride?: SmtpOverrideDto;
}
