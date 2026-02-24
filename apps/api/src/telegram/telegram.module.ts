import { Module, forwardRef } from '@nestjs/common';

import { TelegramService } from './telegram.service';
import { TelegramPollingService } from './telegram.polling.service';
import { TelegramController } from './telegram.controller';
import { PlatformAccountsController } from './platform-accounts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [TelegramController, PlatformAccountsController],
  providers: [TelegramService, TelegramPollingService],
  exports: [TelegramService],
})
export class TelegramModule {}
