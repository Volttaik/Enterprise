---
name: WaAssist auth architecture
description: JWT cookie auth implementation details for this project
---

# WaAssist Auth Architecture

## Stack
- `jose` for JWT sign/verify (HS256, 30-day expiry)
- `bcryptjs` for password hashing (cost factor 12)
- `cookie-parser` Express middleware (required for cookie reading)
- Cookie name: `wa_auth_token`, httpOnly, sameSite=lax, secure in production

## Key files
- `server/_core/auth.ts` — signToken, verifyToken, hashPassword, verifyPassword, setCookie, clearCookie
- `server/_core/context.ts` — reads cookie then Bearer header, resolves User from DB
- `server/routers.ts` — auth.register, auth.login, auth.logout routes

## User schema note
The `users` table has `openId` as notNull unique. Email-registered users get a `crypto.randomUUID()` as their openId. This avoids a schema migration while supporting both OAuth (future) and email auth.

## Frontend
- `client/src/contexts/AuthContext.tsx` — trpc.auth.me query, isLoading/isAuthenticated state
- `ProtectedRoute` in App.tsx — redirects to /login if no user
- `PublicOnlyRoute` in App.tsx — redirects to /dashboard if already logged in

**Why:** The app moved from single-hardcoded-owner to real multi-user auth. SESSION_SECRET (already in Replit secrets) is used as the JWT signing key.
