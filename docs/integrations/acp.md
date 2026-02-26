---
icon: credit-card
---

# ACP integration (Stripe-aligned)

This demo now aligns to the Agentic Commerce Protocol checkout model from the ACP spec repo, using the `2026-01-30` protocol version.

Canonical endpoints in this project:

- `POST /api/acp/checkout_sessions`
- `GET /api/acp/checkout_sessions/{checkout_session_id}`
- `POST /api/acp/checkout_sessions/{checkout_session_id}`
- `POST /api/acp/checkout_sessions/{checkout_session_id}/complete`
- `POST /api/acp/checkout_sessions/{checkout_session_id}/cancel`

Compatibility aliases are also available under `/api/acp/checkouts/...`.

## Implementation files

- [ACP store and schema-aligned model](../../demos/app/api/acp/_lib/store.ts)
- [Create session route](../../demos/app/api/acp/checkout_sessions/route.ts)
- [Get/Update session route](../../demos/app/api/acp/checkout_sessions/[id]/route.ts)
- [Complete session route](../../demos/app/api/acp/checkout_sessions/[id]/complete/route.ts)
- [Cancel session route](../../demos/app/api/acp/checkout_sessions/[id]/cancel/route.ts)

## Required request headers

- `API-Version: 2026-01-30`
- `Authorization: Bearer <token>` when `ACP_BEARER_TOKEN` is configured

## Supported ACP semantics in this demo

1. Checkout session lifecycle: create, retrieve, update, complete, cancel.
2. `payment_data` on complete with Stripe-style tokenized instrument (`credential.type: spt`, token value in `credential.token`).
3. `authentication_result` handling for mock 3DS-required flows.
4. Optional `intent_trace` body accepted on cancel.
5. Idempotency replay support via `Idempotency-Key` for create/update/complete.

## Mock behavior for testing

- Complete request returns `400` with `requires_3ds` when token contains `requires3ds` or `3ds_required` and no `authentication_result` is provided.
- Complete request returns `400` with `payment_declined` when token contains `decline`, `fail`, or `insufficient`.
- Otherwise completion succeeds and returns a `completed` checkout session with an attached order object.

## Legacy ACP confirm route

A legacy helper route remains available for existing demo flows:

- [Legacy confirm route](../../demos/app/api/acp/confirm/route.ts)

This route is not the canonical ACP checkout-session API and exists only for backward compatibility with earlier demo pages.
