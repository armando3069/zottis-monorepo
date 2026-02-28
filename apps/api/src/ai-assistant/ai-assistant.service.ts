import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

// ── Ollama shapes ─────────────────────────────────────────────────────────────

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  message?: { content?: string };
  response?: string;
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  'You are an AI support assistant. Answer in Romanian, concise and helpful. ' +
  'You are integrated into a multi-platform message hub (WhatsApp, Telegram, etc.).';

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  /** In-memory flag — resets to false on restart. */
  private _autoReplyEnabled = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Auto-reply flag ───────────────────────────────────────────────────────

  get autoReplyEnabled(): boolean {
    return this._autoReplyEnabled;
  }

  setAutoReply(enabled: boolean): void {
    this._autoReplyEnabled = enabled;
    this.logger.log(`Auto-reply ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  // ── Ollama HTTP call ──────────────────────────────────────────────────────

  private async callOllama(messages: OllamaMessage[]): Promise<string> {
    const ollamaUrl = this.config.get<string>('OLLAMA_URL') ?? 'http://localhost:11434';
    const model = this.config.get<string>('OLLAMA_MODEL') ?? 'qwen2.5:7b';

    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as OllamaResponse;
    return (data.message?.content ?? data.response ?? '').trim();
  }

  // ── Public: simple one-shot reply (no conversation history) ──────────────

  async generateSimpleReply(text: string): Promise<string> {
    return this.callOllama([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ]);
  }

  // ── Public: reply with conversation history ───────────────────────────────

  async generateReplyFromMessage(input: {
    conversationId: number;
    latestUserMessage: string;
  }): Promise<string> {
    // Load the last 10 messages to build context
    const history = await this.prisma.messages.findMany({
      where: { conversation_id: input.conversationId },
      orderBy: { timestamp: 'asc' },
      take: 10,
    });

    const messages: OllamaMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    for (const msg of history) {
      if (!msg.text) continue;
      messages.push({
        role: msg.sender_type === 'client' ? 'user' : 'assistant',
        content: msg.text,
      });
    }

    // Ensure the latest user message is at the end
    const lastMsg = history[history.length - 1];
    const alreadyAtEnd =
      lastMsg?.sender_type === 'client' &&
      lastMsg?.text === input.latestUserMessage;

    if (!alreadyAtEnd) {
      messages.push({ role: 'user', content: input.latestUserMessage });
    }

    return this.callOllama(messages);
  }
}
