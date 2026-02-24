import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService, TelegramUpdate } from './telegram.service';

const POLL_INTERVAL_MS = 2_000; // 2 seconds between polls
const TELEGRAM_API = 'https://api.telegram.org';

@Injectable()
export class TelegramPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramPollingService.name);

  /** Last processed update_id per bot token (offset = last_id + 1) */
  private readonly offsets = new Map<string, number>();

  private timer: NodeJS.Timeout | null = null;
  private active = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    if (this.config.get<string>('SKIP_WEBHOOK_REGISTRATION') === 'true') {
      this.logger.log(
        'SKIP_WEBHOOK_REGISTRATION=true — starting long-polling mode',
      );
      this.active = true;
      this.schedulePoll();
    }
  }

  onModuleDestroy() {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // ── Scheduling ─────────────────────────────────────────────────────────────

  private schedulePoll() {
    if (!this.active) return;
    this.timer = setTimeout(() => this.runPoll(), POLL_INTERVAL_MS);
  }

  private async runPoll() {
    try {
      await this.pollAll();
    } catch (err) {
      this.logger.error('Polling cycle error:', (err as Error).message);
    } finally {
      this.schedulePoll();
    }
  }

  // ── Core poll ──────────────────────────────────────────────────────────────

  private async pollAll() {
    const accounts = await this.prisma.platform_accounts.findMany({
      where: { platform: 'telegram' },
    });

    await Promise.all(
      accounts.map((account) => this.pollBot(account)),
    );
  }

  private async pollBot(account: {
    id: number;
    access_token: string;
    external_app_id: string | null;
    settings: unknown;
  }) {
    const botToken = account.access_token;
    const botId = account.external_app_id ?? '';
    const offset = this.offsets.get(botToken) ?? 0;

    let updates: TelegramUpdate[];
    try {
      updates = await this.fetchUpdates(botToken, offset);
    } catch (err) {
      this.logger.warn(
        `Failed to fetch updates for bot ${botId}: ${(err as Error).message}`,
      );
      return;
    }

    if (updates.length === 0) return;

    // Grab the webhookSecret so handleWebhookUpdate passes its security check
    const settings = account.settings as Record<string, string> | null;
    const secret = settings?.webhookSecret ?? '';

    for (const update of updates) {
      try {
        await this.telegramService.handleWebhookUpdate(botId, update, secret);
      } catch (err) {
        this.logger.error(
          `Error processing update ${update.update_id} for bot ${botId}:`,
          (err as Error).message,
        );
      }
      // Advance offset past this update regardless of errors
      this.offsets.set(botToken, update.update_id + 1);
    }
  }

  // ── Telegram getUpdates ────────────────────────────────────────────────────

  private async fetchUpdates(
    token: string,
    offset: number,
  ): Promise<TelegramUpdate[]> {
    const url =
      `${TELEGRAM_API}/bot${token}/getUpdates` +
      `?timeout=1&limit=100` +
      (offset > 0 ? `&offset=${offset}` : '');

    const res = await fetch(url);
    const data = (await res.json()) as {
      ok: boolean;
      result?: TelegramUpdate[];
      description?: string;
    };

    if (!data.ok) {
      throw new Error(data.description ?? 'getUpdates failed');
    }

    return data.result ?? [];
  }
}