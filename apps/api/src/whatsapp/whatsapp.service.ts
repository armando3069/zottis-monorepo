import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ConnectWhatsappDto } from './dto/connect-whatsapp.dto';
import { WhatsappReplyDto } from './dto/whatsapp-reply.dto';
import type { messages } from '@prisma/client';

// ── WhatsApp Cloud API payload shapes ─────────────────────────────────────────

interface WhatsAppMessage {
  id: string;
  from: string;
  type: string;
  timestamp: string;
  text?: { body: string };
}

interface WhatsAppContact {
  wa_id: string;
  profile: { name: string };
}

interface WhatsAppChangeValue {
  messaging_product: string;
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{ field: string; value: WhatsAppChangeValue }>;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private readonly apiBase: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {
    this.apiBase =
      config.get<string>('WHATSAPP_API_BASE') ??
      'https://graph.facebook.com/v20.0';
  }

  // ── Raw Graph API call (credentials passed explicitly) ────────────────────

  private async callGraphApi(
    phoneNumberId: string,
    token: string,
    to: string,
    text: string,
  ): Promise<void> {
    const url = `${this.apiBase}/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new BadRequestException(
        `WhatsApp API error: ${JSON.stringify(body)}`,
      );
    }
  }

  // ── Connect — saves user-provided credentials to DB ───────────────────────

  async connect(userId: number, dto: ConnectWhatsappDto): Promise<void> {
    const existing = await this.prisma.platform_accounts.findFirst({
      where: { platform: 'whatsapp', external_app_id: dto.phoneNumberId },
    });

    if (existing) {
      await this.prisma.platform_accounts.update({
        where: { id: existing.id },
        data: { user_id: userId, access_token: dto.accessToken },
      });
    } else {
      await this.prisma.platform_accounts.create({
        data: {
          user_id: userId,
          platform: 'whatsapp',
          access_token: dto.accessToken,
          external_app_id: dto.phoneNumberId,
        },
      });
    }

    this.logger.log(
      `WhatsApp connected for user ${userId} (phone_number_id=${dto.phoneNumberId})`,
    );
  }

  // ── sendTextMessage (uses platform_account from DB) ───────────────────────

  async sendTextMessage(userId: number, to: string, text: string): Promise<void> {
    const account = await this.prisma.platform_accounts.findFirst({
      where: { platform: 'whatsapp', user_id: userId },
    });

    if (!account) {
      throw new NotFoundException(
        'No WhatsApp account connected. Call POST /whatsapp/connect first.',
      );
    }

    await this.callGraphApi(account.external_app_id!, account.access_token, to, text);

    // Save outgoing message if a conversation for this contact already exists
    const conversation = await this.prisma.conversations.findFirst({
      where: { platform_account_id: account.id, external_chat_id: to },
    });

    if (conversation) {
      const msg = await this.prisma.messages.create({
        data: {
          conversation_id: conversation.id,
          sender_type: 'bot',
          text,
          platform: 'whatsapp',
          timestamp: new Date(),
        },
      });
      this.chatGateway.emitNewMessage(userId, msg);
    }
  }

  // ── Reply to an existing conversation ────────────────────────────────────

  async reply(userId: number, dto: WhatsappReplyDto): Promise<messages> {
    const conversation = await this.prisma.conversations.findFirst({
      where: {
        id: dto.conversationId,
        platform_account: { user_id: userId },
      },
      include: { platform_account: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const { access_token, external_app_id } = conversation.platform_account;

    await this.callGraphApi(
      external_app_id!,
      access_token,
      conversation.external_chat_id,
      dto.text,
    );

    const msg = await this.prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_type: 'bot',
        text: dto.text,
        platform: 'whatsapp',
        timestamp: new Date(),
      },
    });

    this.chatGateway.emitNewMessage(userId, msg);
    return msg;
  }

  // ── Handle incoming webhook payload ──────────────────────────────────────

  async handleWebhookPayload(payload: WhatsAppWebhookPayload): Promise<void> {
    this.logger.debug(
      `[WA WEBHOOK] object=${payload.object} entries=${payload.entry?.length}`,
    );

    if (payload.object !== 'whatsapp_business_account') {
      this.logger.warn(`[WA WEBHOOK] unexpected object: ${payload.object}`);
      return;
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        this.logger.debug(`[WA WEBHOOK] field=${change.field}`);
        if (change.field !== 'messages') continue;

        const { value } = change;
        const phoneNumberId = value.metadata?.phone_number_id;
        this.logger.debug(
          `[WA WEBHOOK] phone_number_id=${phoneNumberId} messages=${value.messages?.length ?? 0}`,
        );
        if (!phoneNumberId) continue;

        const platformAccount = await this.prisma.platform_accounts.findFirst({
          where: { platform: 'whatsapp', external_app_id: phoneNumberId },
        });

        if (!platformAccount) {
          this.logger.warn(
            `[WA WEBHOOK] No platform_account for phone_number_id=${phoneNumberId}. ` +
              `Connect the account first via POST /whatsapp/connect.`,
          );
          continue;
        }

        this.logger.debug(
          `[WA WEBHOOK] platform_account id=${platformAccount.id} user=${platformAccount.user_id}`,
        );

        for (const msg of value.messages ?? []) {
          this.logger.debug(`[WA WEBHOOK] msg type=${msg.type} from=${msg.from}`);
          if (msg.type !== 'text' || !msg.text?.body) continue;

          const contact = (value.contacts ?? []).find((c) => c.wa_id === msg.from);
          await this.saveIncomingMessage(
            platformAccount.id,
            platformAccount.user_id,
            msg.from,
            contact?.profile?.name ?? null,
            msg,
          );
        }
      }
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async saveIncomingMessage(
    platformAccountId: number,
    userId: number,
    waId: string,
    contactName: string | null,
    msg: WhatsAppMessage,
  ): Promise<void> {
    let isNew = false;
    let conversation = await this.prisma.conversations.findFirst({
      where: { platform_account_id: platformAccountId, external_chat_id: waId },
    });

    if (!conversation) {
      isNew = true;
      conversation = await this.prisma.conversations.create({
        data: {
          platform_account_id: platformAccountId,
          external_chat_id: waId,
          platform: 'whatsapp',
          contact_name: contactName,
          contact_username: waId,
        },
      });
    }

    const message = await this.prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_type: 'client',
        text: msg.text!.body,
        external_message_id: msg.id,
        platform: 'whatsapp',
        timestamp: new Date(parseInt(msg.timestamp, 10) * 1000),
      },
    });

    this.chatGateway.emitNewMessage(userId, message);
    if (isNew) this.chatGateway.emitNewConversation(userId, conversation);
  }
}
