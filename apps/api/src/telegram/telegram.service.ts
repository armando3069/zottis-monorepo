import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';
import { ConnectBotDto } from './dto/connect-bot.dto';
import { ReplyDto } from './dto/reply.dto';
import type { Prisma, conversations, messages, platform_accounts } from '@prisma/client';

// ── Telegram API shapes ───────────────────────────────────────────────────────

interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: { id: number; type: string };
  date: number;
  text?: string;
}

// ── Public type returned from connectBot (no access_token) ───────────────────

export type PlatformAccountSafe = Omit<platform_accounts, 'access_token'>;

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly TELEGRAM_API = 'https://api.telegram.org';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => AiAssistantService))
    private readonly aiAssistantService: AiAssistantService,
  ) {}

  // ── Low-level Telegram HTTP helper ────────────────────────────────────────

  private async telegramApi<T>(
    token: string,
    method: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.TELEGRAM_API}/bot${token}/${method}`;
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await res.json()) as {
      ok: boolean;
      result?: T;
      description?: string;
    };

    if (!data.ok) {
      throw new BadRequestException(
        `Telegram API error: ${data.description ?? 'unknown error'}`,
      );
    }

    return data.result as T;
  }

  // ── Bot token validation ──────────────────────────────────────────────────

  async validateBotToken(token: string): Promise<TelegramBotInfo> {
    return this.telegramApi<TelegramBotInfo>(token, 'getMe');
  }

  // ── Send a message via a specific bot ────────────────────────────────────

  async sendMessage(botToken: string, chatId: string, text: string): Promise<void> {
    await this.telegramApi(botToken, 'sendMessage', {
      chat_id: chatId,
      text,
    });
  }

  // ── Register Telegram webhook for a bot ──────────────────────────────────

  private async setWebhook(
    token: string,
    botId: number,
    secret: string,
  ): Promise<void> {
    const appUrl = this.config.getOrThrow<string>('APP_URL');
    const webhookUrl = `${appUrl}/telegram/webhook/${botId}`;

    await this.telegramApi(token, 'setWebhook', {
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ['message'],
    });

    this.logger.log(`Webhook registered for bot ${botId}: ${webhookUrl}`);
  }

  // ── Platform account management ───────────────────────────────────────────

  /**
   * Validates the bot token, registers a webhook, then upserts a
   * platform_accounts row. Returns the record without access_token.
   */
  async connectBot(userId: number, dto: ConnectBotDto): Promise<PlatformAccountSafe> {
    const botInfo = await this.validateBotToken(dto.botToken);
    const webhookSecret = randomBytes(32).toString('hex');

    if (this.config.get<string>('SKIP_WEBHOOK_REGISTRATION') !== 'true') {
      await this.setWebhook(dto.botToken, botInfo.id, webhookSecret);
    } else {
      this.logger.warn(
        `SKIP_WEBHOOK_REGISTRATION=true — skipping setWebhook for bot ${botInfo.id}`,
      );
    }

    const botIdStr = botInfo.id.toString();

    // Find existing account for this user+bot combination
    const existing = await this.prisma.platform_accounts.findFirst({
      where: { user_id: userId, platform: 'telegram', external_app_id: botIdStr },
    });

    let account: platform_accounts;
    const settings = {
      username: botInfo.username,
      first_name: botInfo.first_name,
      webhookSecret,
    };

    if (existing) {
      account = await this.prisma.platform_accounts.update({
        where: { id: existing.id },
        data: { access_token: dto.botToken, settings },
      });
    } else {
      account = await this.prisma.platform_accounts.create({
        data: {
          user_id: userId,
          platform: 'telegram',
          access_token: dto.botToken,
          external_app_id: botIdStr,
          settings,
        },
      });
    }

    // Never expose the bot token to the client
    const { access_token: _token, ...safe } = account;
    return safe;
  }

  // ── All connected platform accounts (user-scoped) ────────────────────────

  /**
   * Returns every platform_account owned by `userId`, with sensitive fields
   * removed:
   *   - access_token  (bot token / OAuth token — never sent to the client)
   *   - settings.webhookSecret  (internal — Telegram uses it to verify updates)
   *
   * The `settings` object keeps the safe display fields (username, first_name).
   */
  async getConnectedAccounts(userId: number): Promise<PlatformAccountSafe[]> {
    const accounts = await this.prisma.platform_accounts.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    });

    return accounts.map(({ access_token: _token, settings, ...rest }) => ({
      ...rest,
      // Strip webhookSecret; keep username / first_name / any future display fields
      settings: settings
        ? (({ webhookSecret: _s, ...safe }) =>
            safe as unknown as Prisma.JsonValue)(
            settings as Record<string, unknown>,
          )
        : null,
    }));
  }

  // ── Conversations (user-scoped) ───────────────────────────────────────────

  async getConversations(userId: number): Promise<conversations[]> {
    return this.prisma.conversations.findMany({
      where: {
        platform: 'telegram',
        platform_account: { user_id: userId },
      },
      orderBy: { id: 'desc' },
    });
  }

  // ── Messages (user-scoped + ownership check) ──────────────────────────────

  async getMessages(userId: number, conversationId: number): Promise<messages[]> {
    const conversation = await this.prisma.conversations.findFirst({
      where: {
        id: conversationId,
        platform_account: { user_id: userId },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { timestamp: 'asc' },
    });
  }

  // ── Reply (user-scoped + ownership check) ────────────────────────────────

  async reply(userId: number, dto: ReplyDto): Promise<messages> {
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

    if (account.platform !== 'telegram') {
      throw new ForbiddenException('Conversation does not belong to a Telegram account');
    }

    await this.sendMessage(
      account.access_token,
      conversation.external_chat_id,
      dto.text,
    );

    const message = await this.prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_type: 'bot',
        text: dto.text,
        platform: 'telegram',
        timestamp: new Date(),
      },
    });

    // Push to the owning user's WebSocket room
    this.chatGateway.emitNewMessage(userId, message);

    return message;
  }

  // ── Incoming webhook handler ──────────────────────────────────────────────

  /**
   * Called by TelegramController for every POST /telegram/webhook/:botId.
   * Verifies the shared secret, finds the owning platform_account, persists
   * the conversation + message, and broadcasts to the user's WS room.
   */
  async handleWebhookUpdate(
    botId: string,
    update: TelegramUpdate,
    incomingSecret: string | undefined,
  ): Promise<void> {
    // 1. Look up the platform account by bot ID
    const platformAccount = await this.prisma.platform_accounts.findFirst({
      where: { platform: 'telegram', external_app_id: botId },
    });

    if (!platformAccount) {
      this.logger.warn(`Webhook received for unknown bot ${botId}`);
      return;
    }

    // 2. Verify the shared secret Telegram includes in every request
    const settings = platformAccount.settings as Record<string, string> | null;
    if (settings?.webhookSecret && incomingSecret !== settings.webhookSecret) {
      this.logger.warn(`Invalid webhook secret for bot ${botId}`);
      return;
    }

    const msg = update.message;
    if (!msg?.text) return; // Ignore non-text messages for now

    const chatId = msg.chat.id.toString();
    const contactName =
      [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || null;
    const contactUsername = msg.from?.username ?? null;

    // 3. Find or create the conversation
    let isNew = false;
    let conversation = await this.prisma.conversations.findFirst({
      where: {
        platform_account_id: platformAccount.id,
        external_chat_id: chatId,
      },
    });

    if (!conversation) {
      isNew = true;
      conversation = await this.prisma.conversations.create({
        data: {
          platform_account_id: platformAccount.id,
          external_chat_id: chatId,
          platform: 'telegram',
          contact_name: contactName,
          contact_username: contactUsername,
        },
      });
    }

    // 4. Persist the inbound message
    const message = await this.prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_type: 'client',
        text: msg.text,
        external_message_id: msg.message_id.toString(),
        platform: 'telegram',
        timestamp: new Date(msg.date * 1000),
      },
    });

    // 5. Broadcast to the owning user's WebSocket room
    const userId = platformAccount.user_id;
    this.chatGateway.emitNewMessage(userId, message);

    if (isNew) {
      this.chatGateway.emitNewConversation(userId, conversation);
    }

    // 6. Auto-reply if enabled
    if (this.aiAssistantService.autoReplyEnabled && msg.text) {
      this.triggerAutoReply(platformAccount, conversation, userId, msg.text).catch((e) =>
        this.logger.error(`[TG AUTO-REPLY] failed for conversation ${conversation.id}`, e),
      );
    }
  }

  // ── Auto-reply helper ─────────────────────────────────────────────────────

  private async triggerAutoReply(
    platformAccount: platform_accounts,
    conversation: conversations,
    userId: number,
    userText: string,
  ): Promise<void> {
    const reply = await this.aiAssistantService.generateReplyFromMessage({
      conversationId: conversation.id,
      latestUserMessage: userText,
    });

    await this.sendMessage(
      platformAccount.access_token,
      conversation.external_chat_id,
      reply,
    );

    const message = await this.prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_type: 'bot',
        text: reply,
        platform: 'telegram',
        timestamp: new Date(),
      },
    });

    this.chatGateway.emitNewMessage(userId, message);
    this.logger.log(
      `[TG AUTO-REPLY] sent reply to conversation ${conversation.id}`,
    );
  }
}
