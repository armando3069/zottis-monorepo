import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiAssistantService } from './ai-assistant.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { TestReplyDto } from './dto/test-reply.dto';
import { AutoReplyToggleDto } from './dto/auto-reply-toggle.dto';

interface AuthenticatedRequest extends Request {
  user: { id: number; email: string };
}

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  private readonly logger = new Logger(AiAssistantController.name);

  constructor(
    private readonly aiAssistantService: AiAssistantService,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly config: ConfigService,
  ) {}

  // ── POST /ai-assistant/test-reply ─────────────────────────────────────────

  @Post('test-reply')
  @HttpCode(HttpStatus.OK)
  async testReply(@Body() dto: TestReplyDto): Promise<{ reply: string }> {
    try {
      const reply = await this.aiAssistantService.generateSimpleReply(dto.text);
      return { reply };
    } catch (e) {
      this.logger.error('test-reply failed', e);
      throw new InternalServerErrorException('AI service unavailable');
    }
  }

  // ── POST /ai-assistant/auto-reply/enable ──────────────────────────────────

  @Post('auto-reply/enable')
  @HttpCode(HttpStatus.OK)
  enable(@Body() dto: AutoReplyToggleDto): { enabled: boolean } {
    this.aiAssistantService.setAutoReply(dto.enabled);
    return { enabled: dto.enabled };
  }

  // ── GET /ai-assistant/auto-reply/status ───────────────────────────────────

  @Get('auto-reply/status')
  status(): { enabled: boolean } {
    return { enabled: this.aiAssistantService.autoReplyEnabled };
  }

  // ── POST /ai-assistant/conversations/:id/auto-reply ───────────────────────

  /**
   * Manually trigger an AI reply for a specific conversation.
   * Generates the reply, sends it via the right platform, saves to DB, and
   * pushes it to the user's WebSocket room.
   *
   * Avoids circular module deps by making direct HTTP calls to the platform
   * APIs (same logic as WhatsApp/Telegram services, but inline).
   */
  @Post('conversations/:id/auto-reply')
  @HttpCode(HttpStatus.OK)
  async autoReply(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) conversationId: number,
  ): Promise<{ reply: string }> {
    const userId = req.user.id;

    const conversation = await this.prisma.conversations.findFirst({
      where: { id: conversationId, platform_account: { user_id: userId } },
      include: {
        platform_account: true,
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const lastMsg = conversation.messages[0];
    if (!lastMsg?.text) throw new NotFoundException('No messages in this conversation');

    // Generate AI reply
    let reply: string;
    try {
      reply = await this.aiAssistantService.generateReplyFromMessage({
        conversationId,
        latestUserMessage: lastMsg.text,
      });
    } catch (e) {
      this.logger.error(`[AI] auto-reply Ollama failed for conversation ${conversationId}`, e);
      throw new InternalServerErrorException('AI service unavailable');
    }

    const { access_token, external_app_id } = conversation.platform_account;

    // Send via platform
    try {
      if (conversation.platform === 'telegram') {
        await fetch(`https://api.telegram.org/bot${access_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: conversation.external_chat_id, text: reply }),
        });
      } else if (conversation.platform === 'whatsapp') {
        const apiBase =
          this.config.get<string>('WHATSAPP_API_BASE') ?? 'https://graph.facebook.com/v20.0';
        await fetch(`${apiBase}/${external_app_id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: conversation.external_chat_id,
            type: 'text',
            text: { body: reply },
          }),
        });
      }
    } catch (e) {
      this.logger.error(`[AI] Failed to send auto-reply via ${conversation.platform}`, e);
    }

    // Save reply to DB
    const message = await this.prisma.messages.create({
      data: {
        conversation_id: conversationId,
        sender_type: 'bot',
        text: reply,
        platform: conversation.platform,
        timestamp: new Date(),
      },
    });

    this.chatGateway.emitNewMessage(userId, message);

    return { reply };
  }
}
