---
name: Single-user app auth removal
description: What changes and what tradeoff to flag when a user asks to remove login/signup from an app to make it single-user/personal.
---

When a user wants an app converted from multi-tenant (login/signup/JWT
cookies) to single-user/personal use:

- The clean pattern is: an idempotent `getOrCreateOwnerUser()` in the DB
  layer, called from the request-context builder so every request resolves
  to that one row — no cookies, no session, no login page.
- This necessarily means the API layer has **no authentication boundary**:
  anyone who can reach the HTTP/tRPC endpoint acts as the owner/admin. That
  is the correct, intended behavior for this architecture — not a bug to
  patch with partial re-added auth checks — but it must be surfaced to the
  user explicitly as a tradeoff (e.g. "don't expose this publicly without a
  network-level lock, reverse-proxy auth, or VPN" for production/Railway
  deployments).
- Existing `protectedProcedure`/`adminProcedure` middleware can stay as-is;
  it still works because context always attaches the owner user with an
  admin role — no need to strip those checks.

**Why:** a reviewer will correctly flag "any unauthenticated caller is
treated as admin" as a severe finding if you don't already know this is the
deliberate design for a personal single-user tool.

**How to apply:** when doing this refactor, delete the old
oauth/session/cookie files entirely (don't leave dead imports), and add an
explicit note in deployment docs recommending network-level access control
if the app will be reachable on the public internet.
