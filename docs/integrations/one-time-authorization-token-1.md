---
icon: cookie
---

# One-time authorization token

## One-time authorization token

This flow is for processor integrations where it is preferred for payment token or PAN details to be shared server to server as opposed to within the existing payment flow. Instead of returning a clear PAN or network token to the merchant after card selection, Accelerate returns a single-use, short-lived, opaque authorization token. The merchant forwards that token to the processor when the shopper clicks "Pay now", and the processor redeems it server-to-server with Accelerate to obtain the clear card details for the authorization.

The merchant's browser and backend only ever hold the opaque token — the clear PAN travels exactly once, from Accelerate to the processor, over an authenticated back channel. This keeps the clear card data out of the merchant's environment.

A few properties are worth calling out up front. The token is an opaque string prefixed `atk_live_…` in production or `atk_test_…` in sandbox. Its TTL is currently a global default of 1 hour, and it can be redeemed exactly once — any further redemption is rejected. It is bound to the selected payment method, user, and merchant, as well as the amount and currency when the merchant supplies them. The issue response itself contains no card data.

### Flow overview

```
1. Shopper selects a card in the Accelerate iframe
2. Accelerate iframe → Merchant: returns { authorizationToken, expiresAt, ... }
3. Shopper clicks "Pay now"
4. Merchant  → Processor:   sends the token as metadata "AccelerateAuthToken"
5. Processor → Accelerate:  POST /processor/redeem-authorization-token  → { pan, cvv, exp, ... }
6. Processor authorizes the card with the returned details
```

### Issuing the token

Accelerate issues the token when the shopper selects a card in the Accelerate iframe. The iframe returns the opaque token to the merchant.

The token TTL is currently a global default of 1 hour. If it expires before payment, the Accelerate iframe automatically deselects the selected card and requires the shopper to select a card again. Selecting a card issues a fresh token.

### Forwarding the token to the processor

When the shopper clicks "Pay now", the merchant includes the token in the authorization request to the processor as metadata and sends no card data of its own — only the opaque token:

```
AccelerateAuthToken: atk_test_9df1a2…
```

### Redeeming the token

The processor (Aurus) redeems the token server-to-server to exchange it for the clear card details. This call uses processor authentication (see below); the end-user JWT is not accepted here.

```
POST /processor/redeem-authorization-token

{
  "authorizationToken": "atk_test_9df1a2…",   // the token received from the merchant
  "amount": 1299                              // optional
}
```

A successful redemption returns the clear card details:

```
{
  "pan": "4242424242424242",     // clear card number
  "cvv": "123",                  // card verification value when available; may be null (see CVV handling)
  "expiryMonth": 12,             // expiry month 1–12; may be null
  "expiryYear": 2030,            // 4-digit expiry year; may be null
  "amountCents": 1299,           // bound amount in minor units; null when no amount was supplied
  "currency": "USD"              // ISO currency code
}
```

The redeem request and response field format shown here is illustrative for the first integration and is open to change according to the client's requirements. Field names, data types, expiry format, and the overall payload shape can all be aligned to the processor's or client's preferred contract once confirmed.

The redeem call is strict and single-use, so error handling matters. Errors are returned as standard problem responses:

* `401` — processor identity or authentication failed. Check the processor credentials.
* `403` — token revoked, processor↔merchant mismatch, or a per-merchant source IP allowlist mismatch. Processor authentication may have succeeded even though the merchant-specific IP check failed. Do not retry; start a new checkout.
* `404` — unknown token. Do not retry.
* `409` — token already redeemed (single-use). Do not retry; the card was already released once.
* `410` — token expired. The Accelerate iframe deselects the card so the shopper can select one again and receive a fresh token.

Single-use is strict. Once a token is successfully redeemed it cannot be redeemed again — a second attempt returns `409`. If a redemption succeeds but the response is lost in transit, the merchant must issue a new token (a new checkout). This is intentional: the clear PAN is released at most once per token.

### Processor authentication

The `/processor/*` endpoints authenticate the processor's identity, not an end user. Two mechanisms are supported:

* **mTLS client certificate (preferred).** The processor presents a client certificate whose thumbprint is on the allowlist for that processor.
* **HMAC signature (fallback).** The processor sends `X-Processor-Name: Aurus` and `X-Processor-Signature`, a hex HMAC-SHA256 of the raw request body keyed with the shared secret.

In addition, a source IP allowlist is applied per merchant. A processor may only redeem tokens for merchants that are mapped to it.

### CVV handling

Both flows are supported and selectable per merchant in the merchant settings. With CVV, the redeem response includes `cvv` when it is available. Without CVV, the merchant can be configured to authorize without a CVV, in which case `cvv` may be `null`. The processor should be prepared to handle a `null` `cvv` for merchants configured for the CVV-less flow.

### Notes

* Expiry is enforced on Accelerate's clock. Processors should not rely on their own clock for the TTL.
* v1 idempotency is strict (no idempotency window). If retry semantics are needed on redeem timeout, they can be added after measuring failure rates in the pilot.
* `atk_test_…` tokens are sandbox and `atk_live_…` are production. Test PANs are provided for sandbox testing.
