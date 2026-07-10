---
name: WhatsApp account upsert tenancy
description: Why upsertWhatsappAccount must scope its lookup by userId, not just phoneNumber
---

`upsertWhatsappAccount` (server/db.ts) looks up an existing row before deciding insert vs update.
It must filter by `(phoneNumber, userId)` together, never `phoneNumber` alone.

**Why:** phoneNumber is not tenant-scoped. A lookup by phoneNumber only would let one user's
connect/pair flow silently overwrite another user's WhatsApp account row (cross-tenant mutation).//
Caught in code review after adding "connect another number" support.

**How to apply:** any future upsert-by-natural-key pattern in this app (accounts, contacts, etc.)
must include the owning userId in the WHERE clause, matching the `assert*Ownership` pattern already
used in routers.ts for reads/writes.
