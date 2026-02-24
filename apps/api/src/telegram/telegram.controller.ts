import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TelegramService } from './telegram.service';
import type { TelegramUpdate } from './telegram.service';
import { ConnectBotDto } from './dto/connect-bot.dto';
import { ReplyDto } from './dto/reply.dto';

// Shape injected by JwtStrategy.validate()
interface AuthenticatedRequest {
  user: { id: number; email: string; name: string | null; avatar: string | null };
}

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  // ── Bot connection ────────────────────────────────────────────────────────

  /**
   * POST /telegram/connect
   * Validates the bot token with Telegram, registers a webhook, and persists a
   * platform_accounts row owned by the authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Post('connect')
  async connectBot(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ConnectBotDto,
  ) {
    return this.telegramService.connectBot(req.user.id, dto);
  }

  // ── Conversations ────────────────────────────────────────────────────────

  /**
   * GET /telegram/conversations
   * Returns all Telegram conversations belonging to the authenticated user,
   * across all their connected bots.
   */
  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  async getConversations(@Request() req: AuthenticatedRequest) {
    return this.telegramService.getConversations(req.user.id);
  }

  /**
   * GET /telegram/conversations/:id/messages
   * Returns messages for a conversation after verifying ownership.
   * Returns 404 if the conversation doesn't exist or belongs to another user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('conversations/:id/messages')
  async getMessages(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.telegramService.getMessages(req.user.id, conversationId);
  }

  // ── Reply ─────────────────────────────────────────────────────────────────

  /**
   * POST /telegram/reply
   * Sends an outbound message via the user's own bot, saves it to the DB,
   * and pushes a real-time event to the user's WebSocket room.
   */
  @UseGuards(JwtAuthGuard)
  @Post('reply')
  async reply(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ReplyDto,
  ) {
    return this.telegramService.reply(req.user.id, dto);
  }

  // ── Webhook ───────────────────────────────────────────────────────────────

  /**
   * POST /telegram/webhook/:botId
   * Telegram sends all bot updates to this endpoint.
   * The :botId path param is the numeric bot ID (external_app_id), which lets
   * us look up the correct platform_accounts row without exposing the token in
   * the URL.  The X-Telegram-Bot-Api-Secret-Token header is verified inside
   * TelegramService as an extra guard against spoofed calls.
   *
   * This endpoint is intentionally NOT protected by JwtAuthGuard — it is
   * called by Telegram's servers, not the end-user frontend.
   */
  @Post('webhook/:botId')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('botId') botId: string,
    @Body() update: object,
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
  ) {
    await this.telegramService.handleWebhookUpdate(
      botId,
      update as TelegramUpdate,
      secret,
    );
    return { ok: true };
  }

  // ── Slack placeholder ─────────────────────────────────────────────────────
  // TODO: POST /slack/connect  → SlackService.connectWorkspace(userId, dto)
}
