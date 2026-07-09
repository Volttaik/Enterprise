---
name: Baileys reconnect guard trap
description: A subtle self-deadlock in WhatsApp (Baileys) reconnect logic when an "already connecting" guard checks stale state.
---

Pattern: a `connect()` function early-returns if the session record says
`status === "connecting"` (to avoid duplicate sockets). The `connection.close`
handler, on a recoverable disconnect, sets `status = "connecting"` and then
calls `connect()` again to reconnect.

Bug: since the handler set `status` to `"connecting"` *before* calling
`connect()`, the guard sees `"connecting"` and returns immediately without
creating a new socket — the account is stuck disconnected forever with no
error surfaced.

**Why:** the guard's purpose (avoid duplicate live sockets) and the retry
handler's own state update collide because they share the same status field
as both a "duplicate-call guard" and a "reconnect-in-progress" marker.

**How to apply:** before invoking a reconnect from inside a disconnect
handler, clear the dead socket reference (e.g. `session.socket = null`) so
the guard's condition (which should check for a *live* socket, not just a
status string) no longer blocks the retry.
