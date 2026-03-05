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
import type { AiAssistantConfig } from './ai-assistant.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { TestReplyDto } from './dto/test-reply.dto';
import { AutoReplyToggleDto } from './dto/auto-reply-toggle.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

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

  // ── GET /ai-assistant/config ───────────────────────────────────────────────

  @Get('config')
  getConfig(@Request() req: AuthenticatedRequest): AiAssistantConfig {
    return this.aiAssistantService.getConfig(req.user.id);
  }

  // ── POST /ai-assistant/config ──────────────────────────────────────────────

  @Post('config')
  @HttpCode(HttpStatus.OK)
  updateConfig(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateConfigDto,
  ): AiAssistantConfig {
    return this.aiAssistantService.updateConfig(req.user.id, dto);
  }

  // ── POST /ai-assistant/test-reply ─────────────────────────────────────────

  @Post('test-reply')
  @HttpCode(HttpStatus.OK)
  async testReply(
    @Request() req: AuthenticatedRequest,
    @Body() dto: TestReplyDto,
  ): Promise<{ reply: string }> {
    try {
      const reply = await this.aiAssistantService.generateSimpleReply(dto.text, req.user.id);
      return { reply };
    } catch (e) {
      this.logger.error('test-reply failed', e);
      throw new InternalServerErrorException('AI service unavailable');
    }
  }

  // ── POST /ai-assistant/auto-reply/enable ─────────────────────────────────
  // Kept for backward compatibility — delegates to updateConfig.

  @Post('auto-reply/enable')
  @HttpCode(HttpStatus.OK)
  enableAutoReply(
    @Request() req: AuthenticatedRequest,
    @Body() dto: AutoReplyToggleDto,
  ): { enabled: boolean } {
    this.aiAssistantService.updateConfig(req.user.id, { autoReplyEnabled: dto.enabled });
    return { enabled: dto.enabled };
  }

  // ── GET /ai-assistant/auto-reply/status ──────────────────────────────────

  @Get('auto-reply/status')
  autoReplyStatus(@Request() req: AuthenticatedRequest): { enabled: boolean } {
    return { enabled: this.aiAssistantService.getConfig(req.user.id).autoReplyEnabled };
  }

  // ── GET /ai-assistant/conversations/:id/suggested-replies ─────────────────

  @Get('conversations/:id/suggested-replies')
  async getSuggestedReplies(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) conversationId: number,
  ): Promise<{ suggestions: string[] }> {
    const userId = req.user.id;

    const conv = await this.prisma.conversations.findFirst({
      where: { id: conversationId, platform_account: { user_id: userId } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    try {
      const suggestions = await this.aiAssistantService.getSuggestedReplies(conversationId);
      return { suggestions };
    } catch (e) {
      this.logger.error(`[AI] suggested-replies failed for conversation ${conversationId}`, e);
      throw new InternalServerErrorException('AI service unavailable');
    }
  }

  // ── POST /ai-assistant/conversations/:id/auto-reply ───────────────────────

  @Post('conversations/:id/auto-reply')
  @HttpCode(HttpStatus.OK)
  async autoReply(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) conversationId: number,
  ): Promise<{ reply: string; confidence: number }> {
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

    // Generate AI reply + confidence
    let reply: string;
    let confidence: number;
    try {
      ({ reply, confidence } = await this.aiAssistantService.generateReplyFromMessage({
        conversationId,
        latestUserMessage: lastMsg.text,
        userId,
      }));
    } catch (e) {
      this.logger.error(`[AI] auto-reply Ollama failed for conversation ${conversationId}`, e);
      throw new InternalServerErrorException('AI service unavailable');
    }

    this.logger.log(
      `[AI] manual auto-reply conversation=${conversationId} confidence=${confidence}%`,
    );

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

    // Persist to DB
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

    return { reply, confidence };
  }
}
