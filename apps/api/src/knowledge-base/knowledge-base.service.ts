import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// pdf-parse v1 exports the parse function directly via module.exports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const parsePdf: (buf: Buffer) => Promise<{ text: string; numpages: number }> =
  require('pdf-parse');

// ── Types ─────────────────────────────────────────────────────────────────────

type EmbeddingVector = number[];

interface KnowledgeChunk {
  id: string;
  text: string;
  embedding: EmbeddingVector;
  sourceFile: string;
}

interface UserKnowledge {
  userId: number;
  chunks: KnowledgeChunk[];
  files: IndexedFile[];
}

export interface IndexedFile {
  name: string;
  chunks: number;
  uploadedAt: string;
}

// ── Ollama response shapes ─────────────────────────────────────────────────────

interface OllamaEmbeddingResponse {
  embedding?: number[];
  embeddings?: number[][];
}

interface OllamaChatResponse {
  message?: { content?: string };
  response?: string;
}

// ── RAG system prompt ─────────────────────────────────────────────────────────

const RAG_SYSTEM_PROMPT =
  "You are an assistant that answers ONLY based on the context from the user's knowledge base (PDF documents). " +
  'The user is asking about that knowledge. Answer in Romanian. ' +
  'If the answer is not clearly in the provided context, reply exactly: "Nu știu, nu este în document." ' +
  'Do not invent anything.';

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  /**
   * In-memory cache. Populated lazily from disk on first access so it
   * survives hot-reloads and server restarts.
   */
  private readonly knowledgeByUser = new Map<number, UserKnowledge>();

  constructor(private readonly config: ConfigService) {}

  // ── Disk persistence ──────────────────────────────────────────────────────

  private indexPath(userId: number): string {
    return join(process.cwd(), 'uploads', String(userId), 'kb-index.json');
  }

  private saveIndex(knowledge: UserKnowledge): void {
    try {
      const path = this.indexPath(knowledge.userId);
      writeFileSync(path, JSON.stringify(knowledge), 'utf-8');
    } catch (e) {
      this.logger.warn(`[KB] Could not persist index for user ${knowledge.userId}`, e);
    }
  }

  private loadIndex(userId: number): UserKnowledge | null {
    const path = this.indexPath(userId);
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as UserKnowledge;
    } catch (e) {
      this.logger.warn(`[KB] Could not read index for user ${userId}`, e);
      return null;
    }
  }

  /** Returns the in-memory entry, loading from disk if needed. */
  private getOrLoad(userId: number): UserKnowledge | null {
    if (this.knowledgeByUser.has(userId)) {
      return this.knowledgeByUser.get(userId)!;
    }
    const fromDisk = this.loadIndex(userId);
    if (fromDisk) {
      this.knowledgeByUser.set(userId, fromDisk);
      this.logger.log(
        `[KB] Restored ${fromDisk.chunks.length} chunks for user ${userId} from disk`,
      );
      return fromDisk;
    }
    return null;
  }

  // ── Text chunking ─────────────────────────────────────────────────────────

  private chunkText(text: string, size = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      const chunk = text.slice(i, i + size).trim();
      if (chunk.length > 0) chunks.push(chunk);
      i += size - overlap;
    }
    return chunks;
  }

  // ── Ollama embeddings ─────────────────────────────────────────────────────

  private async embedText(text: string): Promise<EmbeddingVector> {
    const ollamaUrl = this.config.get<string>('OLLAMA_URL') ?? 'http://localhost:11434';
    const embedModel =
      this.config.get<string>('OLLAMA_EMBED_MODEL') ?? 'nomic-embed-text';

    const res = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: embedModel, prompt: text }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama embedding error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as OllamaEmbeddingResponse;

    if (Array.isArray(data.embedding) && data.embedding.length > 0)
      return data.embedding;
    if (Array.isArray(data.embeddings?.[0]) && data.embeddings![0].length > 0)
      return data.embeddings![0];

    throw new Error('Ollama returned no embedding vector');
  }

  // ── Cosine similarity ─────────────────────────────────────────────────────

  private cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  // ── Index PDF for a user ──────────────────────────────────────────────────

  async indexPdfForUser(
    userId: number,
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<{ chunks: number; storedAs: string }> {
    // 1. Persist file to disk
    const userDir = join(process.cwd(), 'uploads', String(userId));
    mkdirSync(userDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    writeFileSync(join(userDir, safeName), fileBuffer);
    this.logger.log(`[KB] Saved PDF for user ${userId}: ${safeName}`);

    // 2. Parse PDF text
    let fullText: string;
    try {
      const data = await parsePdf(fileBuffer);
      fullText = data.text;
    } catch (e) {
      this.logger.error('[KB] PDF parsing failed', e);
      throw new Error('Failed to parse PDF');
    }

    if (!fullText.trim()) {
      throw new BadRequestException('PDF has no extractable text');
    }

    // 3. Chunk
    const rawChunks = this.chunkText(fullText);
    this.logger.log(`[KB] ${rawChunks.length} raw chunks for user ${userId}`);

    // 4. Embed — fail loudly if the embedding model is unreachable
    const newChunks: KnowledgeChunk[] = [];
    let firstEmbedError: unknown = null;

    for (let i = 0; i < rawChunks.length; i++) {
      try {
        const embedding = await this.embedText(rawChunks[i]);
        newChunks.push({ id: `${timestamp}-${i}`, text: rawChunks[i], embedding, sourceFile: safeName });
      } catch (e) {
        if (firstEmbedError === null) firstEmbedError = e;
        this.logger.warn(`[KB] Embedding failed for chunk ${i}, skipping`, e);
      }
    }

    if (newChunks.length === 0) {
      const hint = firstEmbedError instanceof Error ? firstEmbedError.message : String(firstEmbedError);
      throw new Error(
        `Failed to create embeddings for the PDF. ` +
        `Make sure Ollama is running and the model "${this.config.get('OLLAMA_EMBED_MODEL') ?? 'nomic-embed-text'}" is pulled.\n${hint}`,
      );
    }

    // 5. Merge with existing knowledge (reload from disk first in case of hot-reload)
    const existing = this.getOrLoad(userId) ?? { userId, chunks: [], files: [] };
    existing.chunks.push(...newChunks);
    existing.files.push({ name: originalName, chunks: newChunks.length, uploadedAt: new Date().toISOString().slice(0, 10) });
    this.knowledgeByUser.set(userId, existing);

    // 6. Persist to disk so restarts don't lose the index
    this.saveIndex(existing);

    this.logger.log(
      `[KB] Indexed ${newChunks.length} chunks for user ${userId} (total: ${existing.chunks.length})`,
    );

    return { chunks: newChunks.length, storedAs: safeName };
  }

  // ── RAG answer ────────────────────────────────────────────────────────────

  async answerQuestionForUser(
    userId: number,
    question: string,
  ): Promise<{ answer: string; usedChunks: string[] }> {
    // Restore from disk if the in-memory cache was wiped (restart / hot-reload)
    const userKB = this.getOrLoad(userId);

    if (!userKB || userKB.chunks.length === 0) {
      throw new BadRequestException(
        'No knowledge base found for this user. Please upload a PDF first.',
      );
    }

    // 1. Embed the question
    const questionEmbedding = await this.embedText(question);

    // 2. Top-5 chunks by cosine similarity
    const topChunks = userKB.chunks
      .map((chunk) => ({ chunk, score: this.cosineSimilarity(questionEmbedding, chunk.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.chunk);

    const contextText = topChunks.map((c) => c.text).join('\n\n---\n\n');
    const userMessage = `Context:\n${contextText}\n\nÎntrebare: "${question}"`;

    // 3. Generate answer
    const ollamaUrl = this.config.get<string>('OLLAMA_URL') ?? 'http://localhost:11434';
    const model = this.config.get<string>('OLLAMA_MODEL') ?? 'qwen2.5:7b';

    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: RAG_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        stream: false,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama chat error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as OllamaChatResponse;
    const answer = (data.message?.content ?? data.response ?? '').trim();

    return { answer, usedChunks: topChunks.map((c) => c.text) };
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  getFilesForUser(userId: number): IndexedFile[] {
    return (this.getOrLoad(userId))?.files ?? [];
  }

  clearUserKnowledge(userId: number): void {
    this.knowledgeByUser.delete(userId);
    // Remove the persisted index too
    const path = this.indexPath(userId);
    if (existsSync(path)) {
      try {
        const { unlinkSync } = require('fs') as typeof import('fs');
        unlinkSync(path);
      } catch { /* ignore */ }
    }
    this.logger.log(`[KB] Cleared knowledge base for user ${userId}`);
  }
}
