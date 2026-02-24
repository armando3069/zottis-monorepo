import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReplyDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  text: string;
}
