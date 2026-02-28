import { IsNotEmpty, IsString } from 'class-validator';

export class TestSendDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
