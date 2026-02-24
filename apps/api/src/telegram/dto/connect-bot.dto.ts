import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectBotDto {
  @IsString()
  @IsNotEmpty()
  botToken: string;
}
