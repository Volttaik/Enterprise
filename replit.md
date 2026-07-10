# WaAssist — Enterprise AI WhatsApp Business Assistant

## Overview
A multi-tenant SaaS platform that lets businesses automate WhatsApp customer conversations with AI. Each user has their own isolated workspace (contacts, orders, messages, products, WhatsApp accounts) and logs in through a shared auth system.

## Stack
- **Backend**: Node.js + Express + tRPC (type-safe API) + TypeScript
- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4
- **Database**: PostgreSQL via Drizzle ORM (`drizzle/schema.ts`)
- **Auth**: JWT via `jose` + bcrypt passwords, httpOnly cookie session
- **AI**: GROQ API (LLM) + Baileys (WhatsApp Web protocol)
- **Job queue**: BullMQ + Redis (optional)
- **Storage**: Local disk (migrated off Manus Forge)

## Running locally
```bash
pnpm install
pnpm db:push      # push schema to PostgreSQL (first time)
pnpm run dev      # starts server on PORT (default 5000)
```

## Required secrets
- `SESSION_SECRET` — JWT signing secret (already set in Replit secrets)
- `DATABASE_URL` — auto-provided by Replit PostgreSQL (runtime-managed)
- `GROQ_API_KEY` — for AI responses (optional; AI features degrade gracefully)

## Optional secrets
- `REDIS_URL` — enables BullMQ background jobs
- `AWS_*` — S3 file storage (app falls back to local disk without it)

## Architecture
```
client/src/
  pages/         — React pages (Login, Register, Dashboard, etc.)
  components/    — Shared UI (AdminLayout, ErrorBoundary, etc.)
  contexts/      — AuthContext (JWT user state)
  lib/trpc.ts    — tRPC client

server/
  _core/
    index.ts     — Express server entry point
    auth.ts      — JWT sign/verify, cookie helpers
    context.ts   — tRPC context (reads JWT from cookie/header)
    trpc.ts      — publicProcedure / protectedProcedure / adminProcedure
    env.ts       — ENV config
  routers.ts     — All tRPC routes (auth, whatsapp, contacts, orders, etc.)
  db.ts          — Drizzle DB helpers
  services/
    whatsapp.ts  — Baileys session management + phone pairing
    ai.ts        — GROQ AI response generation

drizzle/
  schema.ts      — 16 tables; all tenant-scoped via userId FK
```

## Auth flow
1. User registers/logs in via `/register` or `/login`
2. Server sets httpOnly cookie `wa_auth_token` containing a signed JWT
3. Every tRPC request reads the cookie, verifies the JWT, resolves the User row
4. `protectedProcedure` throws UNAUTHORIZED if no valid token
5. Ownership helpers in `routers.ts` prevent cross-tenant IDOR on every route

## WhatsApp pairing
- **QR code**: Generate → poll `whatsapp.getStatus` → scan in WhatsApp app
- **Phone number**: Enter phone → `whatsapp.requestPhoneCode` returns an 8-char code → enter in WhatsApp → Linked Devices → Link with phone number

## Design system
- Soft neumorphic white aesthetic (light-mode only)
- Primary: violet `hsl(258,84%,62%)` + coral `hsl(22,90%,62%)` gradient
- Fonts: Outfit (display) + Plus Jakarta Sans (body)
- Neumorphic shadows on white cards, inset on inputs
- 5px bold left border on active nav items

## User preferences
- Professional, non-techy look — light and easy for non-technical business owners
- Soft neumorphic UI — white/off-white with depth via shadows, not dark chrome
- Multi-tenant: each user sees only their own data, no data leaks between accounts
