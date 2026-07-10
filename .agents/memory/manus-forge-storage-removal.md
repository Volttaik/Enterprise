---
name: Manus Forge storage/API removal
description: This project originally depended on a Manus-specific "Forge" proxy service (S3 storage, LLM proxy, maps, voice, image gen). That service doesn't exist on Replit.
---

`server/storage.ts` and `server/_core/storageProxy.ts` were rewritten to use local disk (`server/uploads/`, served at `/manus-storage/*`) instead of `BUILT_IN_FORGE_API_URL`/`BUILT_IN_FORGE_API_KEY` presigned S3 uploads.

**Why:** Forge was a Manus-only internal proxy; on Replit those env vars are never set, so any upload/download silently failed with "Storage config missing".

**How to apply:** Other Forge-dependent files (`server/_core/llm.ts`, `imageGeneration.ts`, `voiceTranscription.ts`, `map.ts`, `notification.ts`, `dataApi.ts`, `heartbeat.ts`) still reference Forge and are NOT yet migrated — they'll throw/no-op until replaced with real integrations (Replit AI integration for LLM, a maps API key, etc.) or removed. Check before assuming those features work.
