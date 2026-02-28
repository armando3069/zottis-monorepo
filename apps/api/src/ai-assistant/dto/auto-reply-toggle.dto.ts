import { IsBoolean } from 'class-validator';

export class AutoReplyToggleDto {
  @IsBoolean()
  enabled: boolean;
}
