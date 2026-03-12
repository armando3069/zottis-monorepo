import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { ImapFlow } from 'imapflow';

import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { EmailImapService, PROVIDER_PRESETS, EmailSettings } from './email-imap.service';
import { EmailSmtpService } from './email-smtp.service';
import { ConnectEmailDto } from './dto/connect-email.dto';
import { ReplyDto } from '../common/dto/reply.dto';
import { updateConversationLastMessage } from '../common/conversation.helper';
import type { platform_accounts } from '@prisma/client';

export type PlatformAccountSafe = Omit<platform_accounts, 'access_token'>;

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imapService: EmailImapService,
    private readonly smtpService: EmailSmtpService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    await this.imapService.resumeAllPolling();
  }

  // ── Provider preset resolution ────────────────────────────────────────────

  private resolveSettings(dto: ConnectEmailDto): EmailSettings {
    const preset = PROVIDER_PRESETS[dto.provider];

    const imap = dto.imapOverride ?? (preset?.imap ?? { host: '', port: 993, secure: true });
    const smtp = dto.smtpOverride ?? (preset?.smtp ?? { host: '', port: 587, secure: false });

    return {
      provider: dto.provider,
      imap,
      smtp,
      lastUid: 0,
    };
  }

  // ── Connect (upsert platform_account) ────────────────────────────────────

  async connect(userId: number, dto: ConnectEmailDto): Promise<PlatformAccountSafe> {
    const settings = this.resolveSettings(dto);

    // Validate IMAP credentials before saving
    const testClient = new ImapFlow({
      host: settings.imap.host,
      port: settings.imap.port,
      secure: settings.imap.secure,
      auth: { user: dto.email, pass: dto.password },
      logger: false,
    });

    try {
      await testClient.connect();
      await testClient.logout();
    } catch (err) {
      throw new BadRequestException(
        `Cannot connect to IMAP server: ${(err as Error).message}`,
      );
    }

    // Upsert platform_account
    const existing = await this.prisma.platform_accounts.findFirst({
      where: { user_id: userId, platform: 'email', external_app_id: dto.email },
    });

    let account: platform_accounts;

    if (existing) {
      // Stop polling for old config before updating
      this.imapService.stopPolling(existing.id);

      account = await this.prisma.platform_accounts.update({
        where: { id: existing.id },
        data: { access_token: dto.password, settings: settings as unknown as object },
      });
    } else {
      account = await this.prisma.platform_accounts.create({
        data: {
          user_id: userId,
          platform: 'email',
          access_token: dto.password,
          external_app_id: dto.email,
          settings: settings as unknown as object,
        },
      });
    }

    // Start polling for new account
    this.imapService.startPolling(account);

    const { access_token: _token, ...safe } = account;
    return safe;
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  async disconnect(userId: number, email: string): Promise<void> {
    const account = await this.prisma.platform_accounts.findFirst({
      where: { user_id: userId, platform: 'email', external_app_id: email },
    });

    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    this.imapService.stopPolling(account.id);

    await this.prisma.platform_accounts.delete({ where: { id: account.id } });
    this.logger.log(`Disconnected email account ${email} for user ${userId}`);
  }

  // ── Test connection ───────────────────────────────────────────────────────

  async testConnection(userId: number, email: string): Promise<{ imap: boolean; smtp: boolean }> {
    const account = await this.prisma.platform_accounts.findFirst({
      where: { user_id: userId, platform: 'email', external_app_id: email },
    });

    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    const settings = account.settings as unknown as EmailSettings;

    let imapOk = false;
    let smtpOk = false;

    try {
      const client = new ImapFlow({
        host: settings.imap.host,
        port: settings.imap.port,
        secure: settings.imap.secure,
        auth: { user: account.external_app_id!, pass: account.access_token },
        logger: false,
      });
      await client.connect();
      await client.logout();
      imapOk = true;
    } catch {
      imapOk = false;
    }

    try {
      await this.smtpService.verifySmtp(settings.smtp, account.external_app_id!, account.access_token);
      smtpOk = true;
    } catch {
      smtpOk = false;
    }

    return { imap: imapOk, smtp: smtpOk };
  }

  // ── Reply (send email + persist message) ─────────────────────────────────

  async reply(userId: number, dto: ReplyDto): Promise<import('@prisma/client').messages> {
    const conversation = await this.prisma.conversations.findFirst({
      where: {
        id: dto.conversationId,
        platform_account: { user_id: userId },
      },
      include: { platform_account: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const account = conversation.platform_account;

    if (account.platform !== 'email') {
      throw new ForbiddenException('Conversation does not belong to an email account');
    }

    const settings = account.settings as unknown as EmailSettings;
    const toAddress = conversation.external_chat_id; // sender email

    // Find the latest inbound message to build Re: subject and threading headers
    const latestInbound = await this.prisma.messages.findFirst({
      where: { conversation_id: conversation.id, sender_type: 'client' },
      orderBy: { timestamp: 'desc' },
    });

    const emailMeta = (latestInbound?.attachments as {
      emailMeta?: { subject?: string; messageId?: string; references?: string };
    } | null)?.emailMeta;
    const subject = emailMeta?.subject
      ? emailMeta.subject.startsWith('Re:')
        ? emailMeta.subject
        : `Re: ${emailMeta.subject}`
      : 'Re: (no subject)';
    const inReplyTo = emailMeta?.messageId ?? null;
    const references = [emailMeta?.references, inReplyTo].filter(Boolean).join(' ') || null;
    const now = new Date();

    await this.smtpService.sendEmail({
      smtpConfig: settings.smtp,
      fromEmail: account.external_app_id!,
      password: account.access_token,
      to: toAddress,
      subject,
      text: dto.text,
      inReplyTo,
      references,
    });

    const message = await this.prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_type: 'bot',
        text: dto.text,
        platform: 'email',
        timestamp: now,
        attachments: {
          emailMeta: {
            subject,
            to: toAddress,
            from: account.external_app_id,
            date: now.toISOString(),
            inReplyTo,
            references,
            html: null,
          },
        },
      },
    });

    await updateConversationLastMessage(this.prisma, message);
    this.chatGateway.emitNewMessage(userId, message);

    return message;
  }

  // ── List connected email accounts (user-scoped) ───────────────────────────

  async getConnectedAccounts(userId: number): Promise<PlatformAccountSafe[]> {
    const accounts = await this.prisma.platform_accounts.findMany({
      where: { user_id: userId, platform: 'email' },
      orderBy: { created_at: 'asc' },
    });

    return accounts.map(({ access_token: _token, ...rest }) => rest);
  }
}
