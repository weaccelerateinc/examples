---
icon: credit-card
---

# ACP (mock merchant) integration

This integration is intended for internal payment-system testing in the examples app.

Frontend example pages:

- [ACP inline flow](../../demos/app/test/acp/inline/page.tsx)
- [ACP inline payment flow](../../demos/app/test/acp/inline-payment/page.tsx)

Backend route:

- [ACP confirm API route](../../demos/app/api/acp/confirm/route.ts)

## Assumptions used for this example

1. ACP should be runnable without any external dependencies, so the server route defaults to local mock behavior.
2. The Accelerate checkout mode string for ACP is `ACPToken` (casted in TypeScript where needed).
3. Optional reporting back to Accelerate should follow the same pattern as other handoff processors by calling `/reporting/acp` when `ACCELERATE_SERVER_URL` and `ACCELERATE_WH_KEY` are configured.
4. Teams that want real ACP calls can disable mock mode and pass through to an upstream ACP service.

## Environment variables

- `ACP_MOCK_MODE`: defaults to `true` (any value other than `false` keeps mock mode enabled)
- `ACP_API_URL`: required only when `ACP_MOCK_MODE=false`
- `ACP_API_KEY`: required only when `ACP_MOCK_MODE=false`
- `ACCELERATE_SERVER_URL`: optional for reporting
- `ACCELERATE_WH_KEY`: optional for reporting

## Request contract

`POST /api/acp/confirm`

Body:

```json
{
  "processorToken": "token-from-accelerate",
  "cartId": "some-cart",
  "amount": "65.40",
  "currency": "USD"
}
```

## Mock behavior

- Returns `authorized` by default.
- Returns `declined` when `processorToken` contains `decline`, `fail`, or `insufficient`.

This gives internal teams a deterministic way to test both success and failure handling in checkout flows.
