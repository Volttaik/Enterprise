# Enterprise AI WhatsApp Business Assistant

Imported from GitHub. AI-powered WhatsApp business assistant with CRM, order
management, and an admin dashboard.

## Stack

- **Backend:** Node.js + TypeScript, Express, tRPC, Drizzle ORM, PostgreSQL
- **Frontend:** React 19, Tailwind CSS, shadcn/ui, Wouter (routing)
- **AI:** GROQ API (optional — the assistant falls back to a "not configured"
  message without it)
- **WhatsApp integration:** stubbed in `server/services/whatsapp.ts` (no real
  Baileys/WhatsApp session wiring yet)

## Running on Replit

- Dev server: `pnpm run dev` (bound to the `Start application` workflow),
  serves on port 5000.
- Database: uses Replit's built-in PostgreSQL. `DATABASE_URL` is provided
  automatically. Schema lives in `drizzle/schema.ts`; apply changes with
  `pnpm db:push`.
- Auth cookie secret: `JWT_SECRET` env var, falls back to the `SESSION_SECRET`
  Replit secret if unset (see `server/_core/env.ts`).
- Redis/BullMQ are listed as dependencies but are not imported/used anywhere
  in the server code — not required to run the app.

## Setup notes

- The repo originally targeted MySQL + Redis for a Railway/Docker deployment
  (see `RAILWAY_DEPLOYMENT.md`, `Dockerfile`); the actual `server/db.ts` and
  `drizzle.config.ts` already use `drizzle-orm/node-postgres`, so it maps
  cleanly onto Replit's Postgres — no DB migration was needed.
- Added a pnpm `overrides` entry pinning `fast-xml-parser` to `5.9.3`
  (transitive dep of `@aws-sdk/client-s3`) because the older version pulled
  in by default was blocked by Replit's package firewall.
- The homepage (`/`) currently renders template placeholder content
  ("Example Page") from `client/src/pages/Home.tsx` — this is from the
  original import, not something broken by setup.
- GROQ_API_KEY is optional; without it, AI responses return a
  "not configured" message instead of failing.

## User preferences

None recorded yet.
