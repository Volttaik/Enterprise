# Personal AI WhatsApp Assistant

Imported from GitHub, then converted into a **single-user personal assistant**:
there is no login/signup — the app auto-provisions one "owner" account and
everything (contacts, orders, WhatsApp account, etc.) belongs to it.

## Stack

- **Backend:** Node.js + TypeScript, Express, tRPC, Drizzle ORM, PostgreSQL
- **Frontend:** React 19, Tailwind CSS, shadcn/ui, Wouter (routing)
- **AI:** GROQ API (optional — the assistant falls back to a "not configured"
  message without it)
- **WhatsApp integration:** real Baileys (`@whiskeysockets/baileys`) WhatsApp
  Web pairing in `server/services/whatsapp.ts` — scan a QR code from the
  `/whatsapp` page in the dashboard to connect your personal WhatsApp number.
  Session credentials persist to `.baileys_auth/<accountId>/` on disk.

## Running on Replit

- Dev server: `pnpm run dev` (bound to the `Start application` workflow),
  serves on port 5000.
- Database: uses Replit's built-in PostgreSQL. `DATABASE_URL` is provided
  automatically. Schema lives in `drizzle/schema.ts`; apply changes with
  `pnpm db:push`.
- `JWT_SECRET` env var (falls back to the `SESSION_SECRET` Replit secret if
  unset — see `server/_core/env.ts`) is still used internally for signing,
  even though there's no login flow.
- Redis/BullMQ are listed as dependencies but are not imported/used anywhere
  in the server code — not required to run the app.

## Architecture notes (single-user / no auth)

- `server/db.ts` → `getOrCreateOwnerUser()` ensures exactly one user row
  exists (`openId: "owner"`) and `server/_core/context.ts` attaches it to
  every tRPC request — there is no cookie/session/JWT login flow anymore.
- All the old OAuth/login/signup code (`server/_core/oauth.ts`,
  `server/_core/sdk.ts`, `server/_core/cookies.ts`, `client/src/pages/Login.tsx`)
  was removed. `client/src/_core/hooks/useAuth.ts` just reads `auth.me`.
- All dashboard routes in `client/src/App.tsx` render unconditionally (no
  auth gate).
- WhatsApp pairing: `whatsapp.connect` (tRPC) starts a Baileys socket and
  streams QR/connection state via `whatsapp.getStatus` (polled from the
  `/whatsapp` page). Incoming 1:1 messages are auto-answered through
  `generateAIResponse` (if `GROQ_API_KEY` is set) and logged as
  contacts/conversations/messages.

## Deploying to Railway

See `RAILWAY_DEPLOYMENT.md`. Key points: attach a Postgres plugin (not
MySQL, despite older docs/plugin config) and mount a persistent volume at
`.baileys_auth` so WhatsApp pairing survives redeploys — see `Dockerfile`'s
`VOLUME` declaration and `railway.toml`.

## Setup notes

- The repo originally targeted MySQL + Redis for a Railway/Docker deployment;
  the actual `server/db.ts` and `drizzle.config.ts` already use
  `drizzle-orm/node-postgres`, so it maps cleanly onto Replit's Postgres —
  no DB migration was needed.
- Added a pnpm `overrides` entry pinning `fast-xml-parser` to `5.9.3`
  (transitive dep of `@aws-sdk/client-s3`) because the older version pulled
  in by default was blocked by Replit's package firewall.
- GROQ_API_KEY is optional; without it, AI responses return a
  "not configured" message instead of failing.

## User preferences

None recorded yet.
