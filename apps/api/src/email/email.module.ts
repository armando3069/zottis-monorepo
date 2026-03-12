import { Module, forwardRef } from '@nestjs/common';

import { EmailService } from './email.service';
import { EmailImapService } from './email-imap.service';
import { EmailSmtpService } from './email-smtp.service';
import { EmailController } from './email.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { AiAssistantModule } from '../ai-assistant/ai-assistant.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => ChatModule),
    forwardRef(() => AiAssistantModule),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailImapService, EmailSmtpService],
  exports: [EmailService],
})
export class EmailModule {}
