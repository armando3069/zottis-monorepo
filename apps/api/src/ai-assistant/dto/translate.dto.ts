import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TranslateDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @IsString()
  @IsOptional()
  sourceLanguage?: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  messageId?: string;
}
