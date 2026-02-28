# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev        # Start development server
yarn build      # Production build
yarn start      # Start production server
yarn lint       # Run ESLint
```

No test suite is configured yet.

## Environment Variables

Copy `.env` and set:
- `NEXT_PUBLIC_API_URL` — REST API base URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_WS_URL` — Socket.IO server URL (default: `http://localhost:3000`)

## Architecture Overview

**Zottis** is a multi-platform messaging aggregator (Next.js 16, React 19, Tailwind CSS 4). The backend is a separate service; this repo is frontend-only.

### Data flow

```
Socket.IO (lib/socket.ts)
  └─ services/api/api.ts        ← request/response helpers + realtime subscriptions
       └─ hooks/useConversations.ts  ← fetches + subscribes to new conversations
       └─ hooks/useMessages.ts       ← fetches + subscribes to new messages per conversation
            └─ components/chat/ChatLayout.tsx  ← orchestrates all chat state
```

REST calls (fetch) are used only for auth (`services/auth/auth-service.ts`) and platform management (`services/platforms/platform-service.ts`). All conversation/message data goes through Socket.IO.

### Auth flow

1. JWT stored in `localStorage` via `services/auth/auth-service.ts`.
2. `AuthContext` (`context/AuthContext.tsx`) wraps the entire app, reads the token on mount, and fetches `/auth/me`.
3. `ProtectedRoute` (`components/auth/ProtectedRoute.tsx`) redirects unauthenticated users to `/auth/login`.
4. OAuth (Google, Slack) redirects the user to the backend; the backend lands back at `/auth/callback?token=<JWT>`, which is handled by `features/auth/callback/page.tsx`.

### Onboarding flow

After first login the user is sent to `/connect-platforms` if they have no connected platform accounts. Once at least one platform is connected, they land on `/` (the chat dashboard).

### Key directories

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router pages (`/`, `/auth/*`, `/connect-platforms`) |
| `features/auth/` | Auth pages that are also referenced by `app/auth/` (callback, login, signup) |
| `components/chat/` | All chat UI components (Sidebar, ConversationList, ChatArea, etc.) |
| `components/auth/` | `ProtectedRoute` guard |
| `context/` | `AuthContext` — global auth state |
| `hooks/` | `useConversations`, `useMessages` — Socket.IO-backed data hooks |
| `services/api/` | Socket.IO request/response wrapper + realtime subscription helpers |
| `services/auth/` | REST auth calls + localStorage token management |
| `services/platforms/` | REST calls for platform account management (Telegram connect, etc.) |
| `lib/` | Shared types (`types.ts`), Socket.IO singleton (`socket.ts`), view-model mappers (`chatUtils.ts`) |

### Path aliases

`@/` maps to the project root (configured in `tsconfig.json`).

### Platforms

Only **Telegram** is currently available for connection. Slack, WhatsApp, and Microsoft Teams are stubbed as "coming soon" in `app/connect-platforms/page.tsx`.

### Image domains

Allowed remote image hosts (configured in `next.config.ts`): `lh3.googleusercontent.com`, `avatars.slack-edge.com`, `secure.gravatar.com`.