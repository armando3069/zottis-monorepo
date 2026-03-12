import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailService } from './email.service';
import { ConnectEmailDto } from './dto/connect-email.dto';
import { ReplyDto } from '../common/dto/reply.dto';
import type { AuthenticatedRequest } from '../common/types';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // ── Connect email account ─────────────────────────────────────────────────

  /**
   * POST /email/connect
   * Validates IMAP credentials, persists a platform_accounts row, and starts polling.
   */
  @UseGuards(JwtAuthGuard)
  @Post('connect')
  async connect(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ConnectEmailDto,
  ) {
    return this.emailService.connect(req.user.id, dto);
  }

  // ── Disconnect email account ──────────────────────────────────────────────

  /**
   * DELETE /email/disconnect/:email
   * Stops polling and removes the platform_account row.
   */
  @UseGuards(JwtAuthGuard)
  @Delete('disconnect/:email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(
    @Request() req: AuthenticatedRequest,
    @Param('email') email: string,
  ) {
    await this.emailService.disconnect(req.user.id, email);
  }

  // ── Test connection ───────────────────────────────────────────────────────

  /**
   * GET /email/test/:email
   * Verifies IMAP + SMTP connectivity for a connected account.
   */
  @UseGuards(JwtAuthGuard)
  @Get('test/:email')
  async test(
    @Request() req: AuthenticatedRequest,
    @Param('email') email: string,
  ) {
    return this.emailService.testConnection(req.user.id, email);
  }

  // ── Reply ─────────────────────────────────────────────────────────────────

  /**
   * POST /email/reply
   * Sends an email reply via SMTP and persists it as a "bot" message.
   */
  @UseGuards(JwtAuthGuard)
  @Post('reply')
  async reply(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ReplyDto,
  ) {
    return this.emailService.reply(req.user.id, dto);
  }

  // ── List connected email accounts ─────────────────────────────────────────

  /**
   * GET /email/accounts
   * Returns all connected email accounts for the authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('accounts')
  async getAccounts(@Request() req: AuthenticatedRequest) {
    return this.emailService.getConnectedAccounts(req.user.id);
  }
}
