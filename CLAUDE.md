# Project Overview

This is a Turborepo monorepo project.

## Monorepo Structure

Root:
- package.json (workspace + turbo config)
- turbo.json (turborepo tasks configuration)

Apps:

- apps/web → Frontend (Next.js 16, React, TypeScript)
- apps/api → Backend (NestJS, TypeScript)

---

## Frontend (apps/web)

Framework: Next.js
Port: 3000 (dev)

Important folders:
- src/
- public/

The frontend communicates with the backend via HTTP API and WebSocket.

API base URL (dev):
http://localhost:3001

---

## Backend (apps/api)

Framework: NestJS
Port: 3001 (dev)

Environment variables:
Located in:
apps/api/.env
