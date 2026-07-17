---
hidden: true
icon: coin
---

# One-time authorization token

This flow is for processor integrations where it is preferred for payment token or PAN details to be shared server to server as opposed to within the existing payment flow. Instead of returning a clear PAN or network token to the merchant after card selection, Accelerate returns a single-use, short-lived, opaque authorization token. The merchant forwards that token to the processor, and the processor redeems it server-to-server with Accelerate to obtain the clear card details for the authorization.

The merchant's browser and backend only ever hold the opaque token — the clear PAN travels exactly once, from Accelerate to the processor, over an authenticated back channel. This keeps the clear card data out of the merchant's environment and shrinks their PCI scope.

A few properties are worth calling out up front. The token is an opaque string prefixed `atk_live_…` in production or `atk_test_…` in sandbox. It is short-lived (currently a global default of 5 minutes) and can be redeemed exactly once — any further redemption is rejected. It is bound to a specific `{ user, payment source, merchant, currency }`, and the issue response itself contains no card data.

## Flow overview

```
1. Shopper selects a card in the Accelerate wallet
2. Accelerate notifies the merchant and returns the selected CardID
3. Shopper clicks "Pay now"
4. Merchant  → Accelerate:  POST /outbound/issue-authorization-token   → { authorizationToken, expiresAt, ... }
5. Merchant  → Processor:   sends the token as metadata "AccelerateAuthToken"
6. Processor → Accelerate:  POST /processor/redeem-authorization-token  → { pan, cvv, exp, ... }
7. Processor authorizes the card with the returned details
```

## Issuing the token

When the shopper selects a card, Accelerate returns its CardID to the merchant. Do not issue a token at this point. When the shopper clicks "Pay now", the merchant calls this endpoint with that CardID to receive an opaque, single-use token.

This call is authenticated with the end-user bearer token (Firebase JWT), the same as other outbound calls.

```
POST /outbound/issue-authorization-token

{
  "merchantId": "b1a7…",        // Accelerate merchant id
  "paymentSourceId": "9f3c…",   // the CardID returned after card selection
  "currency": "USD"             // ISO currency code, defaults to USD
}
```

The response contains the opaque token and some display-only metadata — but no card data:

```
{
  "authorizationToken": "atk_test_9df1a2…",   // opaque, single-use 256-bit token to hand to the processor
  "expiresAt": "2026-07-10T18:35:00Z",        // UTC time after which the token can no longer be redeemed
  "last4": "4242",                            // card last four, for display only (may be null)
  "brand": "credit"                           // card brand/type, for display only (may be null)
}
```

Issue the token at "Pay now", not at card selection. The token TTL (currently a global default of 15 minutes) is shorter than the shopper session, so issuing it at pay-time avoids the token expiring while the shopper is still deciding.

## Forwarding the token to the processor

The merchant includes the token in the authorization request to the processor as metadata, and sends no card data of its own — only the opaque token:

```
AccelerateAuthToken: atk_test_9df1a2…
```

## Redeeming the token

The processor (Aurus) redeems the token server-to-server to exchange it for the clear card details. This call uses processor authentication (see below); the end-user JWT is not accepted here.

```
POST /processor/redeem-authorization-token

{
  "authorizationToken": "atk_test_9df1a2…",  // the token received from the merchant
  "transactionId": "txn_01J…"                 // optional processor transaction ID for downstream tracing
}
```

Send an idempotency key with every redemption request. Reuse the same key when retrying the same redemption.

A successful redemption returns the clear card details:

```
{
  "pan": "4242424242424242",     // clear card number
  "cvv": "123",                  // card verification value
  "expiryMonth": 12,             // expiry month 1–12; may be null
  "expiryYear": 2030,            // 4-digit expiry year; may be null
  "currency": "USD",             // ISO currency code
  "paymentSourceId": "9f3c…"     // the bound payment source id
}
```

The redeem request and response field format shown here is illustrative for the first integration and is open to change according to the client's requirements. Field names, data types, expiry format, and the overall payload shape can all be aligned to the processor's or client's preferred contract once confirmed.

The redeem call is strict and single-use, so error handling matters. Errors are returned as standard problem responses:

* `401` — processor identity or authentication failed. Check credentials.
* `403` — token revoked, processor↔merchant mismatch, or source IP not on the merchant's allowlist. Do not retry; start a new checkout.
* `404` — unknown token. Do not retry.
* `409` — token already redeemed (single-use). Do not retry; the card was already released once.
* `410` — token expired. Ask the merchant to re-issue a token.

Single-use is strict. Once a token is successfully redeemed, it cannot be redeemed again. A retry using the same idempotency key is handled safely. A new key returns `409`. This ensures the clear PAN is released at most once per token.

## Processor authentication

The `/processor/*` endpoints authenticate the processor's identity, not an end user. Two mechanisms are supported:

* **mTLS client certificate (preferred).** The processor presents a client certificate whose thumbprint is on the allowlist for that processor.
* **HMAC signature (fallback).** The processor sends `X-Processor-Name: Aurus` and `X-Processor-Signature`, a hex HMAC-SHA256 of the raw request body. The shared secret is 256-bit, vault-stored, and rotated quarterly.

In addition, a source IP allowlist is applied per merchant. A processor may only redeem tokens for merchants that are mapped to it.

## CVV handling

Both flows are supported and selectable per merchant in the merchant settings. With CVV, the redeem response includes `cvv` when it is required according to the merchant's specifications. CVV is single-use for authorization only, held as a short-lived VGS alias and never stored after pre-auth.

## Notes

* Expiry is enforced on Accelerate's clock. Processors should not rely on their own clock for the TTL.
* Use the same idempotency key for retries of one redemption. Use a new key only for a new redemption.
* `atk_test_…` tokens are sandbox and `atk_live_…` are production. Test PANs are provided for sandbox testing.
