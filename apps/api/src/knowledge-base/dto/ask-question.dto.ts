import { IsString, IsNotEmpty } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;
}
