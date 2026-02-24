import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TelegramService } from './telegram.service';

interface AuthenticatedRequest {
  user: { id: number };
}

/**
 * GET /platform-accounts
 *
 * Returns every platform account (Telegram bot, Slack workspace, …) that the
 * authenticated user has connected, with sensitive fields removed.
 *
 * Frontend use-cases:
 *   • Show a "Connect your first bot" screen when `total === 0`
 *   • List connected bots in a settings/dashboard view
 *   • Decide which platform tab to render first
 *
 * Response shape:
 *   {
 *     total: number,
 *     accounts: [
 *       {
 *         id, platform, external_app_id,
 *         settings: { username, first_name },   // NO webhookSecret
 *         created_at
 *       },
 *       ...
 *     ]
 *   }
 */
@Controller('platform-accounts')
export class PlatformAccountsController {
  constructor(private readonly telegramService: TelegramService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getConnectedAccounts(@Request() req: AuthenticatedRequest) {
    const accounts = await this.telegramService.getConnectedAccounts(req.user.id);
    return { total: accounts.length, accounts };
  }
}
