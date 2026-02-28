import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectWhatsappDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;       // permanent token din Meta Business Suite

  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;     // Phone Number ID din Meta Developer Portal
}
