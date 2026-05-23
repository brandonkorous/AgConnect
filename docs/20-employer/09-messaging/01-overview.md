# 09 · Messaging — Overview

Per-employer conversations + messages. Channels: `app` (in-app, free), `sms` (via existing `packages/sms` worker, billed), `whatsapp` (Twilio Conversations, billed — **deferred**), `broadcast` (1-to-many over SMS). EN ⇄ ES auto-translation via `@agconn/llm` when enabled.

> **Inferred:** WhatsApp channel deferred — not in launch scope. The `MessageChannel` Postgres enum and Zod schema preserve the `'whatsapp'` value so re-enable is a UI + copy change, not a migration. Revisit once a real worker/employer base justifies Twilio Conversations / Meta WABA cost.

## Why now

Coordinating the day-of-shift between employer ↔ foreman ↔ workers is the hot loop of the operation. SMS already exists for transactional messages; this adds the user-driven thread.

## Scope (MVP)

- Conversation create/list (1:1 + group)
- Message send (app channel only) + thread participants
- Pin a `Shift` to a conversation as the "what we're talking about" anchor
- SMS / broadcast send paths defer to existing `packages/sms` queue (WhatsApp deferred)

> **Inferred:** All conversations are scoped to a single employer; cross-employer DMs are out of scope.
