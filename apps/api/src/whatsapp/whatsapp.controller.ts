import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WhatsappService } from './whatsapp.service';
import type { WhatsAppWebhookPayload } from './whatsapp.service';
import { ConnectWhatsappDto } from './dto/connect-whatsapp.dto';
import { WhatsappReplyDto } from './dto/whatsapp-reply.dto';
import { TestSendDto } from './dto/test-send.dto';

interface AuthenticatedRequest {
  user: { id: number; email: string; name: string | null; avatar: string | null };
}

@Controller()
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  // ── Meta webhook verification ─────────────────────────────────────────────

  @Get('webhooks/whatsapp')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    throw new ForbiddenException('Webhook verification failed');
  }

  // ── Incoming events from Meta ─────────────────────────────────────────────

  @Post('webhooks/whatsapp')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: WhatsAppWebhookPayload) {
    await this.whatsappService.handleWebhookPayload(payload);
    return { status: 'ok' };
  }

  // ── Connect — user provides their own credentials ────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('whatsapp/connect')
  async connect(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ConnectWhatsappDto,
  ) {
    await this.whatsappService.connect(req.user.id, dto);
    return { connected: true };
  }

  // ── Reply to an existing conversation ────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('whatsapp/reply')
  async reply(
    @Request() req: AuthenticatedRequest,
    @Body() dto: WhatsappReplyDto,
  ) {
    return this.whatsappService.reply(req.user.id, dto);
  }

  // ── Test send ─────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('whatsapp/test-send')
  async testSend(
    @Request() req: AuthenticatedRequest,
    @Body() dto: TestSendDto,
  ) {
    await this.whatsappService.sendTextMessage(req.user.id, dto.to, dto.text);
    return { sent: true };
  }
}
