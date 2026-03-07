// ── CORS ──────────────────────────────────────────────────────────────────────
export const CORS_ORIGINS = (process.env.CORS_ORIGINS?.split(',') ?? [
  'http://localhost:3000',
]).map((s) => s.trim());

export const CORS_CONFIG = {
  origin: CORS_ORIGINS,
  methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
};

// ── Frontend ──────────────────────────────────────────────────────────────────
export const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

// ── Platform APIs ─────────────────────────────────────────────────────────────
export const TELEGRAM_API_BASE = 'https://api.telegram.org';

// ── Ollama ────────────────────────────────────────────────────────────────────
export const OLLAMA_DEFAULTS = {
  url: 'http://localhost:11434',
  model: 'qwen2.5:7b',
} as const;

// ── Caching ───────────────────────────────────────────────────────────────────
export const SUGGESTIONS_CACHE_TTL_MS = 30_000;
