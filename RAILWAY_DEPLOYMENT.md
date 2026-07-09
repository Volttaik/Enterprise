# Railway Deployment Guide

This guide explains how to deploy the personal AI WhatsApp Assistant to Railway.

This is a **single-user app** — there is no login/signup flow. Every request is
scoped to one auto-created "owner" account, and the app pairs with exactly one
personal WhatsApp number via a QR code (real Baileys WhatsApp Web protocol,
not the Business API).

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with the project code
- A PostgreSQL database (Railway's Postgres plugin, or any external Postgres)

## Step 1: Create a Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account and select this repository
5. Railway will automatically detect the Node.js project

## Step 2: Add a PostgreSQL Database

1. In the Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway sets `DATABASE_URL` on your service automatically — the app reads
   it directly (`server/db.ts` uses `drizzle-orm/node-postgres`)

## Step 3: Configure Environment Variables

In the Railway dashboard, go to **Variables** and add:

### Required
- `JWT_SECRET` (or `SESSION_SECRET`): a random secret string, only used to
  sign internal session state — generate one with `openssl rand -hex 32`
- `NODE_ENV`: `production`

### Optional
- `GROQ_API_KEY` / `GROQ_MODEL`: enables AI-generated replies. Without it,
  the assistant replies with a "not configured" message instead of failing.
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` /
  `AWS_S3_BUCKET`: only needed if you use file/media uploads via S3.

`PORT` is set automatically by Railway — the app binds to it directly.

Redis/BullMQ, Manus OAuth, and MySQL are **not used** by this app; ignore any
older references to them.

## Step 4: WhatsApp Session Persistence (important)

The WhatsApp connection uses `useMultiFileAuthState` from Baileys, which
writes pairing credentials to `.baileys_auth/<accountId>` on disk. Railway's
filesystem is ephemeral across redeploys/restarts by default, which means
**you will need to re-scan the QR code after every redeploy** unless you
attach a persistent volume:

1. In Railway, go to your service → **Volumes** → "Add Volume"
2. Mount it at `/app/.baileys_auth`

With a volume attached, the pairing survives restarts and redeploys.

## Step 5: Deploy

Railway auto-detects the build/start commands from `package.json`
(`pnpm build` / `node dist/index.js`), matching `railway.toml`. Push to your
connected branch or click "Deploy".

## Step 6: Push the Database Schema

After the first deployment, open the Railway Shell tab (or run locally
against the Railway `DATABASE_URL`) and run:

```bash
pnpm db:push
```

## Step 7: Connect WhatsApp

1. Open the deployed app → **WhatsApp** in the sidebar
2. Click "Start pairing" and scan the QR code from WhatsApp on your phone:
   Settings → Linked Devices → Link a Device
3. Once connected, incoming messages are answered automatically (if
   `GROQ_API_KEY` is set) and logged to Contacts/Conversations

## Troubleshooting

### Build fails
- Check that all dependencies are installed: `pnpm install`
- Verify Node.js version compatibility (20+)

### Database connection issues
- Verify `DATABASE_URL` is set (Railway sets this automatically once the
  Postgres plugin is attached)
- Run `pnpm db:push` to sync the schema

### WhatsApp keeps asking to re-scan the QR code
- Attach a persistent volume at `.baileys_auth` (see Step 4) so the paired
  session survives restarts
