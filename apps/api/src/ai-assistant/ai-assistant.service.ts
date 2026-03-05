import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { ResponseTone, UpdateConfigDto } from './dto/update-config.dto';

// ── Tone-specific system prompts ──────────────────────────────────────────────

const TONE_PROMPTS: Record<ResponseTone, string> = {
  professional: 'You are a professional business assistant. Be clear, concise, and formal.',
  friendly:     'You are a friendly customer support assistant. Be warm and helpful.',
  casual:       'You are relaxed and conversational but still helpful.',
  strict:       'You are concise, direct, and minimal. Avoid unnecessary text.',
};

// ── Per-user config ───────────────────────────────────────────────────────────

export interface AiAssistantConfig {
  userId: number;
  autoReplyEnabled: boolean;
  responseTone: ResponseTone;
  confidenceThreshold: number; // 0–100
}

const DEFAULT_CONFIG: Omit<AiAssistantConfig, 'userId'> = {
  autoReplyEnabled: false,
  responseTone: 'professional',
  confidenceThreshold: 70,
};

// ── Ollama shapes ─────────────────────────────────────────────────────────────

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  message?: { content?: string };
  response?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  /** Per-user configuration. Resets on restart (in-memory only). */
  private readonly configs = new Map<number, AiAssistantConfig>();

  /** Suggested-replies cache: invalidated when the latest message changes or after 30 s. */
  private readonly suggestionsCache = new Map<
    number,
    { suggestions: string[]; expiresAt: number; lastMessageId: number }
  >();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly knowledgeBase: KnowledgeBaseService,
  ) {}

  // ── Config management ──────────────────────────────────────────────────────

  getConfig(userId: number): AiAssistantConfig {
    return this.configs.get(userId) ?? { userId, ...DEFAULT_CONFIG };
  }

  updateConfig(userId: number, dto: UpdateConfigDto): AiAssistantConfig {
    const current = this.getConfig(userId);
    const updated: AiAssistantConfig = {
      ...current,
      ...(dto.responseTone       !== undefined && { responseTone:       dto.responseTone }),
      ...(dto.confidenceThreshold !== undefined && { confidenceThreshold: dto.confidenceThreshold }),
      ...(dto.autoReplyEnabled    !== undefined && { autoReplyEnabled:    dto.autoReplyEnabled }),
    };
    this.configs.set(userId, updated);
    this.logger.log(
      `[AI Config] user=${userId} tone=${updated.responseTone} ` +
      `threshold=${updated.confidenceThreshold} autoReply=${updated.autoReplyEnabled}`,
    );
    return updated;
  }

  // ── Legacy global accessors (kept for backward-compat with platform services) ─

  /** True if auto-reply is enabled for the given user. */
  isAutoReplyEnabled(userId: number): boolean {
    return this.getConfig(userId).autoReplyEnabled;
  }

  // ── Ollama HTTP helper ─────────────────────────────────────────────────────

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

  // ── Confidence estimation ──────────────────────────────────────────────────

  /**
   * Asks Ollama to rate (0–100) how well the given answer is supported by the
   * provided context chunks. Falls back to 50 on any error.
   */
  private async estimateConfidence(
    question: string,
    answer: string,
    contextChunks: string[],
  ): Promise<number> {
    const contextText = contextChunks.slice(0, 3).join('\n\n---\n\n');
    const prompt =
      `Context:\n${contextText}\n\n` +
      `Question: "${question}"\n\n` +
      `Answer: "${answer}"\n\n` +
      'Rate from 0 to 100 how confident you are that this answer is directly supported ' +
      'by the context above. Reply ONLY with a single integer number between 0 and 100.';

    try {
      const raw = await this.callOllama([{ role: 'user', content: prompt }]);
      const match = raw.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num >= 0 && num <= 100) return num;
      }
    } catch (e) {
      this.logger.warn('[AI] Confidence estimation failed', e);
    }
    return 50; // neutral fallback
  }

  // ── Public: suggested replies ─────────────────────────────────────────────

  /**
   * Returns 4 short suggested replies for the given conversation.
   * Results are cached for 30 s per conversation, and invalidated automatically
   * when the latest message changes.
   */
  async getSuggestedReplies(conversationId: number): Promise<string[]> {
    const now = Date.now();

    // Fetch last 6 messages (desc = newest first)
    const rows = await this.prisma.messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { timestamp: 'desc' },
      take: 6,
    });

    if (rows.length === 0) return this.defaultSuggestions();

    const latestId = rows[0].id;

    // Return cached result if still fresh AND last message hasn't changed
    const hit = this.suggestionsCache.get(conversationId);
    if (hit && hit.expiresAt > now && hit.lastMessageId === latestId) {
      return hit.suggestions;
    }

    // Build transcript (chronological order)
    const lines = [...rows]
      .reverse()
      .filter((m) => m.text)
      .map((m) => `${m.sender_type === 'client' ? 'Customer' : 'Agent'}: ${m.text}`);

    const transcript = lines.join('\n');

    const systemPrompt =
      'You are a customer support assistant. Based on the conversation context, generate 4 short professional reply suggestions the agent could send next. Replies must be concise, natural, and in Romanian.';

    const userPrompt =
      `Transcript:\n${transcript}\n\n` +
      'Return ONLY valid JSON with no extra text:\n' +
      '{"suggestions": ["text", "text", "text", "text"]}';

    try {
      const raw = await this.callOllama([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const jsonMatch = raw.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { suggestions?: unknown };
        if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
          const suggestions = (parsed.suggestions as string[]).slice(0, 4);
          this.suggestionsCache.set(conversationId, {
            suggestions,
            expiresAt: now + 30_000,
            lastMessageId: latestId,
          });
          this.logger.log(`[AI] suggested-replies generated for conversation=${conversationId}`);
          return suggestions;
        }
      }
    } catch (e) {
      this.logger.warn('[AI] getSuggestedReplies Ollama call failed', e);
    }

    return this.defaultSuggestions();
  }

  private defaultSuggestions(): string[] {
    return [
      'Mulțumesc pentru mesaj. Verific imediat.',
      'Am primit solicitarea și revin în câteva minute.',
      'Înțeleg situația și mă ocup de rezolvare.',
      'Mulțumesc pentru informații. Revin cu un update.',
    ];
  }

  // ── Public: simple one-shot reply (test endpoint) ─────────────────────────

  async generateSimpleReply(text: string, userId?: number): Promise<string> {
    const tone = userId !== undefined ? this.getConfig(userId).responseTone : 'professional';
    return this.callOllama([
      { role: 'system', content: TONE_PROMPTS[tone] },
      { role: 'user', content: text },
    ]);
  }

  // ── Public: reply with conversation history (+ optional KB RAG) ──────────

  /**
   * Generates a reply and an estimated confidence score (0–100).
   *
   * Priority:
   *  1. KB RAG — if the user has indexed PDFs, use RAG + confidence estimation
   *  2. Plain Ollama chat — fallback with conversation history; confidence = 80
   */
  async generateReplyFromMessage(input: {
    conversationId: number;
    latestUserMessage: string;
    userId?: number;
  }): Promise<{ reply: string; confidence: number }> {
    const { userId, latestUserMessage, conversationId } = input;
    const tone = userId !== undefined ? this.getConfig(userId).responseTone : 'professional';

    // ── Path 1: KB RAG ────────────────────────────────────────────────────────
    if (userId !== undefined) {
      const files = this.knowledgeBase.getFilesForUser(userId);
      if (files.length > 0) {
        try {
          const { answer, usedChunks } = await this.knowledgeBase.answerQuestionForUser(
            userId,
            latestUserMessage,
          );
          const confidence = await this.estimateConfidence(
            latestUserMessage,
            answer,
            usedChunks,
          );
          this.logger.log(
            `[AI] RAG | user=${userId} conversation=${conversationId} ` +
            `confidence=${confidence}% tone=${tone}`,
          );
          return { reply: answer, confidence };
        } catch (e) {
          this.logger.warn('[AI] KB RAG failed, falling back to plain chat', e);
        }
      }
    }

    // ── Path 2: Plain chat with history ───────────────────────────────────────
    const history = await this.prisma.messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { timestamp: 'asc' },
      take: 10,
    });

    const messages: OllamaMessage[] = [
      { role: 'system', content: TONE_PROMPTS[tone] },
    ];

    for (const msg of history) {
      if (!msg.text) continue;
      messages.push({
        role: msg.sender_type === 'client' ? 'user' : 'assistant',
        content: msg.text,
      });
    }

    const lastMsg = history[history.length - 1];
    const alreadyAtEnd =
      lastMsg?.sender_type === 'client' && lastMsg?.text === latestUserMessage;

    if (!alreadyAtEnd) {
      messages.push({ role: 'user', content: latestUserMessage });
    }

    const reply = await this.callOllama(messages);
    // No document context → assume reasonable confidence
    return { reply, confidence: 80 };
  }
}
