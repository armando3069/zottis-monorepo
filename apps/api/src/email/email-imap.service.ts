import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';
import { updateConversationLastMessage } from '../common/conversation.helper';
import type { platform_accounts } from '@prisma/client';

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
}

export interface EmailSettings {
  provider: string;
  imap: ImapConfig;
  smtp: { host: string; port: number; secure: boolean };
  lastUid: number;
}

// ── Provider presets ─────────────────────────────────────────────────────────

export const PROVIDER_PRESETS: Record<
  string,
  { imap: ImapConfig; smtp: { host: string; port: number; secure: boolean } }
> = {
  gmail: {
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false },
  },
  outlook: {
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false },
  },
};

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class EmailImapService {
  private readonly logger = new Logger(EmailImapService.name);

  /** accountId → NodeJS.Timeout */
  private pollingTimers = new Map<number, ReturnType<typeof setInterval>>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => AiAssistantService))
    private readonly aiAssistantService: AiAssistantService,
  ) {}

  // ── Start / Stop polling for a single account ────────────────────────────

  startPolling(account: platform_accounts): void {
    if (this.pollingTimers.has(account.id)) return;

    this.logger.log(`Starting IMAP polling for account ${account.id} (${account.external_app_id})`);

    // Poll immediately, then every 60 seconds
    void this.pollAccount(account.id);
    const timer = setInterval(() => void this.pollAccount(account.id), 60_000);
    this.pollingTimers.set(account.id, timer);
  }

  stopPolling(accountId: number): void {
    const timer = this.pollingTimers.get(accountId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(accountId);
      this.logger.log(`Stopped IMAP polling for account ${accountId}`);
    }
  }

  // ── Resume polling for all existing email accounts on startup ─────────────

  async resumeAllPolling(): Promise<void> {
    const accounts = await this.prisma.platform_accounts.findMany({
      where: { platform: 'email' },
    });

    this.logger.log(`Resuming IMAP polling for ${accounts.length} email account(s)`);
    for (const account of accounts) {
      this.startPolling(account);
    }
  }

  // ── Core poll logic ───────────────────────────────────────────────────────

  async pollAccount(accountId: number): Promise<void> {
    const account = await this.prisma.platform_accounts.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      this.stopPolling(accountId);
      return;
    }

    const settings = account.settings as unknown as EmailSettings;
    const lastUid = settings?.lastUid ?? 0;
    const imapConfig = settings?.imap;

    if (!imapConfig) {
      this.logger.warn(`No IMAP config for account ${accountId}`);
      return;
    }

    const client = new ImapFlow({
      host: imapConfig.host,
      port: imapConfig.port,
      secure: imapConfig.secure,
      auth: {
        user: account.external_app_id!,
        pass: account.access_token,
      },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        // Fetch all messages with UID > lastUid
        const searchCriteria =
          lastUid > 0 ? { uid: `${lastUid + 1}:*` } : { seen: false };

        let maxUid = lastUid;

        for await (const msg of client.fetch(searchCriteria, {
          uid: true,
          source: true,
        })) {
          const uid = msg.uid;

          // imapflow may return the last UID even if no new messages exist
          if (uid <= lastUid) continue;
          if (uid > maxUid) maxUid = uid;

          if (!msg.source) continue;

          try {
            const parsed = await simpleParser(msg.source);
            await this.processIncomingEmail(account, parsed, uid);
          } catch (parseErr) {
            this.logger.error(`Failed to parse email uid=${uid}`, parseErr);
          }
        }

        // Persist the new lastUid
        if (maxUid > lastUid) {
          await this.prisma.platform_accounts.update({
            where: { id: accountId },
            data: {
              settings: {
                ...(settings as object),
                lastUid: maxUid,
              },
            },
          });
        }
      } finally {
        lock.release();
      }

      await client.logout();
    } catch (err) {
      this.logger.error(`IMAP poll failed for account ${accountId}`, err);
      // Don't rethrow — polling should continue on next interval
    }
  }

  // ── Process a single incoming email ──────────────────────────────────────

  private async processIncomingEmail(
    account: platform_accounts,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed: any,
    uid: number,
  ): Promise<void> {
    const fromAddress: string =
      parsed.from?.value?.[0]?.address ?? parsed.from?.text ?? 'unknown';

    // Skip emails sent from this account (e.g. sent-folder noise)
    if (fromAddress.toLowerCase() === account.external_app_id?.toLowerCase()) {
      return;
    }

    const contactName: string | null =
      parsed.from?.value?.[0]?.name ?? null;
    const subject: string = parsed.subject ?? '(no subject)';
    const messageId: string | null = parsed.messageId ?? null;
    const inReplyTo: string | null = parsed.inReplyTo ?? null;
    const bodyText: string = parsed.text ?? '';
    const bodyHtml: string | null = parsed.html || null;
    const ccText: string | null = parsed.cc?.text ?? null;
    const emailDate: string | null = parsed.date ? parsed.date.toISOString() : null;
    const references: string | null =
      typeof parsed.references === 'string'
        ? parsed.references
        : Array.isArray(parsed.references)
          ? (parsed.references as string[]).join(' ')
          : null;

    const userId = account.user_id;

    // Find or create conversation (thread by sender email)
    let isNew = false;
    let conversation = await this.prisma.conversations.findFirst({
      where: {
        platform_account_id: account.id,
        external_chat_id: fromAddress,
      },
    });

    if (!conversation) {
      isNew = true;
      conversation = await this.prisma.conversations.create({
        data: {
          platform_account_id: account.id,
          external_chat_id: fromAddress,
          platform: 'email',
          contact_name: contactName,
          contact_email: fromAddress,
        },
      });
    }

    // Deduplicate by external_message_id (messageId header)
    if (messageId) {
      const existing = await this.prisma.messages.findFirst({
        where: { conversation_id: conversation.id, external_message_id: messageId },
      });
      if (existing) return;
    }

    // Persist the message
    const message = await this.prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_type: 'client',
        text: bodyText,
        external_message_id: messageId ?? `uid-${uid}`,
        platform: 'email',
        timestamp: parsed.date ?? new Date(),
        attachments: {
          emailMeta: {
            messageId,
            subject,
            inReplyTo,
            references,
            from: fromAddress,
            to: account.external_app_id,
            cc: ccText,
            date: emailDate,
            html: bodyHtml,
          },
        },
      },
    });

    await updateConversationLastMessage(this.prisma, message);

    // Broadcast to owning user
    this.chatGateway.emitNewMessage(userId, message);
    if (isNew) {
      this.chatGateway.emitNewConversation(userId, conversation);
    }

    this.logger.log(
      `[EMAIL IMAP] New message from ${fromAddress} → conversation ${conversation.id}`,
    );

    // Auto-reply if enabled
    if (this.aiAssistantService.isAutoReplyEnabled(userId)) {
      this.triggerAutoReply(account, conversation, userId, bodyText, subject, fromAddress).catch(
        (e) => this.logger.error(`[EMAIL AUTO-REPLY] failed for conversation ${conversation.id}`, e),
      );
    }
  }

  // ── Auto-reply helper ─────────────────────────────────────────────────────

  private async triggerAutoReply(
    account: platform_accounts,
    conversation: { id: number; external_chat_id: string },
    userId: number,
    userText: string,
    subject: string,
    fromAddress: string,
  ): Promise<void> {
    const { reply, confidence } =
      await this.aiAssistantService.generateReplyFromMessage({
        conversationId: conversation.id,
        latestUserMessage: userText,
        userId,
      });

    const { confidenceThreshold } = this.aiAssistantService.getConfig(userId);

    this.logger.log(
      `[EMAIL AUTO-REPLY] conversation=${conversation.id} confidence=${confidence}% threshold=${confidenceThreshold}%`,
    );

    if (confidence < confidenceThreshold) {
      this.logger.warn(
        `[EMAIL AUTO-REPLY] skipped — confidence ${confidence}% below threshold ${confidenceThreshold}%`,
      );
      return;
    }

    // Import EmailSmtpService lazily to avoid circular imports at module level
    // We'll emit a custom event instead — handled in EmailService
    this.logger.log(
      `[EMAIL AUTO-REPLY] auto-reply requested for conversation ${conversation.id}, reply="${reply.slice(0, 60)}..."`,
    );

    // Emit reply event to be picked up by EmailService
    // Since we can't easily inject EmailSmtpService here (circular), we log and let
    // EmailService handle SMTP sending through the aiAssistantService controller pattern.
    // For MVP we'll just log — the manual reply endpoint works fine.
  }
}
