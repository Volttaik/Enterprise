---
name: Multi-tenant IDOR prevention pattern
description: How to prevent cross-tenant Insecure Direct Object Reference in tRPC routes that accept resource IDs
---

# Multi-tenant IDOR prevention

## The rule
Every tRPC route that accepts a resource ID (whatsappAccountId, contactId, orderId, etc.) MUST validate ownership before reading or mutating the resource.

**Why:** Without this check, any authenticated user can target another tenant's data by guessing or brute-forcing numeric IDs — a classic IDOR / broken access control vulnerability.

## How to apply
Centralise checks into typed helper functions in `server/routers.ts`:

```typescript
async function assertAccountOwnership(userId: number, whatsappAccountId: number) {
  const account = await getWhatsappAccountById(whatsappAccountId);
  if (!account || account.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
  }
  return account;
}
```

Call these at the top of every mutation/query that accepts an external ID, before any service or DB calls.

**Affected route categories in this project:**
- `whatsapp.*` — validate account.userId === ctx.user.id
- `contacts.getContactDetails / updateContactTags` — validate contact.userId
- `orders.createOrder` — validate both contactId and whatsappAccountId
- `payments.recordPayment` — validate via order → whatsappAccount → userId
- `ai.generateResponse` — validate whatsappAccountId
