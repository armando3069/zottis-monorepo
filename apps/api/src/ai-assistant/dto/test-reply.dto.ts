import { IsString, IsNotEmpty } from 'class-validator';

export class TestReplyDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
