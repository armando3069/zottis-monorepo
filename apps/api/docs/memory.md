 ---                                                                                                                                                                           
What was built

Architecture overview

Frontend (Next.js)
│  JWT in HTTP header → REST  │  { auth: { token } } → WebSocket
▼                              ▼
TelegramController          ChatGateway
│                              │  joins user:{userId} room on connect
▼                              │  getConversations / getMessages (user-scoped)
TelegramService ──────────────► emitNewMessage(userId, msg)
│ platform_accounts.user_id    emitNewConversation(userId, conv)
▼
PrismaService (PostgreSQL)

Telegram Bot API ──POST /telegram/webhook/:botId──► TelegramService

Files created / rewritten

File: prisma/schema.prisma
What changed: conversations.platform_account_id → non-nullable; unique changed from [chat_id, platform] → [chat_id, platform_account_id]; added @@unique on platform_accounts
────────────────────────────────────────
File: prisma/migrations/20260223…
What changed: Custom SQL handles data cleanup + new constraints
────────────────────────────────────────
File: src/telegram/dto/connect-bot.dto.ts
What changed: New — { botToken: string }
────────────────────────────────────────
File: src/telegram/dto/reply.dto.ts
What changed: New — { conversationId, text }
────────────────────────────────────────
File: src/telegram/telegram.service.ts
What changed: Full rewrite — validateBotToken, setWebhook, connectBot, getConversations, getMessages, reply, handleWebhookUpdate. Uses native fetch.
────────────────────────────────────────
File: src/telegram/telegram.controller.ts
What changed: New — 5 REST endpoints
────────────────────────────────────────
File: src/telegram/telegram.module.ts
What changed: Added controller, dropped AggregatorModule
────────────────────────────────────────
File: src/chat/chat.gateway.ts
What changed: Full rewrite — JWT auth on connect, user:{userId} rooms, user-scoped WS queries, emitNewMessage(userId) / emitNewConversation(userId)
────────────────────────────────────────
File: src/chat/chat.module.ts
What changed: Added JwtModule, removed TelegramModule (circular dep eliminated)
────────────────────────────────────────
File: src/aggregator/aggregator.service.ts
What changed: Marked deprecated, throws if called

Security guarantees

1. No user sees another user's data — every Prisma query filters through platform_account.user_id.
2. access_token (bot token) never leaves the server — stripped before any response.
3. Webhook authenticity — a 32-byte random webhookSecret is stored per bot in settings and verified against X-Telegram-Bot-Api-Secret-Token on every incoming update.
4. Unauthenticated WebSocket connections are immediately disconnected — JWT is verified during handleConnection.

Required env var

Add APP_URL to your .env (e.g. APP_URL=https://your-ngrok-id.ngrok.io in dev):

APP_URL=https://your-domain.com

