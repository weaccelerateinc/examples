# One-Time Authorization Token (DirectAuthToken)

The one-time authorization token is a checkout mode (`DirectAuthToken`) for merchants whose processor integrates directly with Accelerate — the first such processor is **Aurus**. Instead of handing your frontend a processor token (Stripe, Braintree, etc.) or raw card credentials (Direct mode), Accelerate hands you a **single-use, short-lived, opaque token**. You forward that token to your processor in place of card data, and the processor redeems it **server-to-server** with Accelerate to receive the actual card details for the authorization.

The result: your browser and your backend only ever hold the opaque token. The clear PAN travels exactly once — **Accelerate → processor** — over an authenticated back channel, keeping card data out of your environment entirely and shrinking your PCI scope.

This page covers both halves of the integration:

* Merchant integration — AccelerateJS setup, receiving tokens, passing them to your processor
* Processor integration — authentication, the redeem API, error semantics
* Testing in sandbox — test wallets and self-serve token issuance

### Key properties

| Property                   | Value                                                                                                                                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token format               | Opaque string: `atk_test_…` (sandbox) or `atk_live_…` (production) followed by 256 bits of URL-safe random. Treat it as opaque — do not parse it or assume a length.                                                                      |
| Lifetime                   | **15 minutes** from issuance (global default; any per-merchant override is capped at 15 minutes). Expiry is enforced on Accelerate's clock.                                                                                               |
| Uses                       | **Exactly one** successful redemption. Every subsequent attempt fails with `409`.                                                                                                                                                         |
| Binding                    | Bound at issuance to `{ user, payment source, merchant, currency }`. The **amount is not bound** — the token behaves like a one-time card reference, and the processor may report the authorized amount at redemption for reconciliation. |
| Storage                    | Accelerate persists only a SHA-256 hash of the token. The plaintext is returned to your frontend exactly once and cannot be recovered.                                                                                                    |
| Sensitive data at issuance | None. The issue response contains no card data — only the token and display fields (`last4`, `brand`).                                                                                                                                    |

### How the flow fits together

```
Shopper            Merchant site                Accelerate                  Processor
   |                     |                           |                          |
   | 1. selects a card   |                           |                          |
   |   in the wallet     |                           |                          |
   |-------------------->|                           |                          |
   |                     | 2. wallet iframe issues a token                      |
   |                     |    POST /outbound/issue-authorization-token          |
   |                     |-------------------------->|                          |
   |                     |<--------------------------|                          |
   |                     |    onCardSelected(cardId, { authorizationToken })    |
   |                     |                           |                          |
   | 3. clicks Pay now   |                           |                          |
   |-------------------->| 4. authorization request with the token              |
   |                     |    (metadata "AccelerateAuthToken", no card data)    |
   |                     |------------------------------------------------------>
   |                     |                           | 5. redeem, server-to-server
   |                     |                           |<-------------------------|
   |                     |                           |  POST /processor/redeem-authorization-token
   |                     |                           |------------------------->|
   |                     |                           |    clear card details    |
   |                     |                           | 6. processor authorizes  |
   |                     |<------------------------------------------------------
   |<--------------------|         authorization result                         |
```

1. The shopper logs in and selects a card in the Accelerate wallet (see the Authentication Guide — login, 2FA, and sessions are unchanged in this mode).
2. As soon as a **verified** card is selected, the wallet automatically issues a one-time token and hands it to your page through the `onCardSelected` callback. No card data is released at this point.
3. At **Pay now**, your frontend sends the token to your backend, and your backend includes it in the authorization request to your processor — in the field your processor designates for it (for Aurus, the `AccelerateAuthToken` metadata field). You send **no card data of your own**.
4. The processor redeems the token with Accelerate over an authenticated server-to-server channel and receives the card details.
5. The processor runs the authorization as normal and returns its result up the chain to your backend.

***

### Merchant integration (frontend)

#### Initialization

Initialize AccelerateJS exactly as in the other modes, with `checkoutMode: "DirectAuthToken"`:

```jsx
window.accelerate.init({
  merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
  amount: 1299,                       // cart total in minor units (display/session use)
  checkoutFlow: "Inline",
  checkoutMode: "DirectAuthToken",
  universalAuth: true,
  onLoginSuccess: (user) => { /* ... */ },
  onCardSelected: (cardId, details) => {
    if (cardId && details.authorizationToken) {
      // Store the token for the Pay now click and enable the Pay button.
      setAuthToken(details.authorizationToken);
      setTokenExpiry(details.expiresAt);
    } else {
      // No verified card selected (or the token expired) — disable Pay now.
      setAuthToken(null);
    }
  },
});
```

#### Receiving the token: `onCardSelected`

In `DirectAuthToken` mode, the `onCardSelected` callback carries two extra fields in its `details` argument whenever a verified card is selected:

| Field                | Type                     | Description                                           |
| -------------------- | ------------------------ | ----------------------------------------------------- |
| `authorizationToken` | `string`                 | The one-time token to hand to your processor.         |
| `expiresAt`          | `string` (ISO-8601, UTC) | Time after which the token can no longer be redeemed. |

Behavior to build against:

* **A fresh token is issued on every card selection.** Treat the token like you would treat a CardID in the other modes — the latest one wins.
* **When a token expires before it is used, the wallet deselects the card** and calls `onCardSelected(null, …)`. Disable your Pay button in that case; when the shopper re-selects a card, a fresh token is issued and `onCardSelected` fires again.
* **Unverified cards never produce a token.** `onCardSelected` is called with `null` until the card passes verification, exactly as in the other modes.

#### Issuing on demand: `accelerate.requestAuthorizationToken`

If you prefer to fetch a token at a specific moment (for example, immediately before submitting the payment), you can request one for the currently selected card:

```jsx
const result = await accelerate.requestAuthorizationToken(cardId, amount);
if ("authorizationToken" in result) {
  // { authorizationToken, expiresAt, last4, brand }
} else {
  // { status, message } — e.g. status 401 means the Accelerate session expired;
  // call accelerate.login again (see the Authentication Guide).
}
```

* `cardId` must be the currently selected card (from `onCardSelected`).
* Each call issues a **new** token; previously issued tokens remain valid until they expire or are redeemed.
* The `amount` parameter is accepted for forward compatibility; tokens are not bound to an amount.

#### The REST call behind it

Your frontend normally never calls this directly — the wallet does — but for completeness, issuance is a plain HTTPS call (no VGS proxying is involved, because nothing sensitive is in the request or response):

```
POST /outbound/issue-authorization-token
Authorization: Bearer <end-user token>
Content-Type: application/json

{
  "merchantId": "b1a7…",         // your Accelerate merchant id
  "paymentSourceId": "9f3c…",    // the selected card
  "currency": "USD"              // optional, ISO code; defaults to USD
}
```

Response `200`:

```json
{
  "authorizationToken": "atk_test_Zx8vQ1…",
  "expiresAt": "2026-08-04T21:15:00+00:00",
  "last4": "4242",
  "brand": "credit_card"
}
```

| Field                | Type             | Description                                                                           |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `authorizationToken` | `string`         | The opaque single-use token. Returned exactly once — Accelerate stores only its hash. |
| `expiresAt`          | `string`         | UTC expiry timestamp.                                                                 |
| `last4`              | `string \| null` | Card last four, display only.                                                         |
| `brand`              | `string \| null` | Card brand/type, display only.                                                        |

Issuance failures return `401` (no/expired end-user session) or `403` as a problem response with a `title` explaining the reason:

* Direct authorization tokens are not enabled for this merchant (you haven't been opted in — talk to your integration contact).
* Payment source not found for the current user.
* Card verification required before an authorization token can be issued.
* This merchant requires a CVV, but none is on file for the selected card (see CVV handling).

#### Handling the token on your side

* **Send the token to your processor, nothing else.** Include it in your authorization request where your processor expects it — for Aurus this is the `AccelerateAuthToken` field. Do not send any card data of your own.
* **Treat it as a credential.** The token is the only thing standing between its holder and a one-time release of card details to your processor. Pass it through your backend, but don't log it, persist it, or put it in URLs or analytics.
* **Don't cache it across checkouts.** It is single-use and expires in 15 minutes. If an authorization attempt fails before the processor redeemed the token, you can retry with the same token; once the processor has redeemed it, a retry needs a fresh token (re-select the card or call `requestAuthorizationToken`).

***

### Processor integration (redeeming the token)

This section is for the processor (e.g. Aurus) implementing the server-to-server redemption.

#### Environments

| Environment | Base URL                           | Token prefix |
| ----------- | ---------------------------------- | ------------ |
| Sandbox     | `https://sbx.api.weaccelerate.com` | `atk_test_…` |
| Production  | `https://prd.api.weaccelerate.com` | `atk_live_…` |

Your integration contact will confirm the exact hostname to call for redemption and register your credentials during onboarding.

#### Authentication

The `/processor/*` endpoints authenticate the **processor's identity** — not an end user. End-user bearer tokens are not accepted here, and processor credentials grant no access to any other Accelerate endpoint. Two mechanisms are supported:

1. **mTLS client certificate (preferred).** You present a client certificate during the TLS handshake; its thumbprint must be on the allowlist Accelerate holds for your processor. Certificate exchange and rotation are coordinated with your integration contact.
2.  **HMAC request signature (fallback).** You send two headers on every request:

    * `X-Processor-Name` — your processor name as registered with Accelerate (e.g. `Aurus`)
    * `X-Processor-Signature` — hex-encoded HMAC-SHA256 of the **raw request body**, keyed with your shared secret (hex case-insensitive; comparison is constant-time)

    Sign the exact bytes you transmit — any re-serialization of the JSON after signing (key reordering, whitespace changes) will invalidate the signature.

```bash
BODY='{"accelerateAuthToken":"atk_test_Zx8vQ1…","amountCents":1299,"transactionId":"aurus-txn-8817"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SHARED_SECRET" -hex | awk '{print $NF}')

curl -sS https://sbx.api.weaccelerate.com/processor/redeem-authorization-token \
  -H "Content-Type: application/json" \
  -H "X-Processor-Name: Aurus" \
  -H "X-Processor-Signature: $SIG" \
  --data-raw "$BODY"
```

Two IP allowlists may additionally apply on top of identity (they are filters, never identity by themselves):

* **Per-processor** — an allowlist of your egress IPs registered with Accelerate.
* **Per-merchant** — each merchant can restrict which source IPs may redeem _their_ tokens (configured in the merchant dashboard). A redemption from outside a merchant's allowlist fails with `403` even though your identity is valid.

Both lists are exact-IP match in v1 (no CIDR ranges); an empty list means no IP restriction.

Finally, a processor can only redeem tokens for **merchants mapped to it**. Redeeming another processor's token — or a token for a merchant not configured for this flow — fails with `403`.

#### `POST /processor/redeem-authorization-token`

```
POST /processor/redeem-authorization-token
Content-Type: application/json
X-Processor-Name: Aurus
X-Processor-Signature: 3f9a…

{
  "accelerateAuthToken": "atk_test_Zx8vQ1…",
  "amountCents": 1299,
  "transactionId": "aurus-txn-8817"
}
```

| Field                 | Type                           | Description                                                                                                                                                      |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accelerateAuthToken` | `string` (required)            | The token received from the merchant.                                                                                                                            |
| `amountCents`         | `integer \| null`              | Authorized amount in minor units. **Reporting only** — it is recorded against the token for reconciliation and echoed back; it is never used to gate redemption. |
| `transactionId`       | `string \| null` (≤ 128 chars) | Your transaction id. Recorded for reconciliation and echoed back in the response.                                                                                |

Response `200`:

```json
{
  "pan": "4242424242424242",
  "cvv": "123",
  "expiryMonth": 12,
  "expiryYear": 2030,
  "amountCents": 1299,
  "transactionId": "aurus-txn-8817",
  "currency": "USD",
  "paymentSourceId": "9f3cf8a2-…"
}
```

| Field             | Type              | Description                                                                                                    |
| ----------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `pan`             | `string`          | Clear card number.                                                                                             |
| `cvv`             | `string \| null`  | Card verification value when available — always handle `null` (see CVV handling).                              |
| `expiryMonth`     | `integer \| null` | Expiry month, 1–12.                                                                                            |
| `expiryYear`      | `integer \| null` | Expiry year, 4 digits.                                                                                         |
| `amountCents`     | `integer \| null` | Echo of the amount you supplied (null if you sent none).                                                       |
| `transactionId`   | `string \| null`  | Echo of the transaction id you supplied.                                                                       |
| `currency`        | `string`          | ISO currency code the token was issued with.                                                                   |
| `paymentSourceId` | `string` (uuid)   | Accelerate's id for the underlying card. Stable across tokens for the same card — usable as a correlation key. |

#### Error responses

Errors are standard problem responses (`application/problem+json`) with the reason in `title` (`401` and `429` return an empty body):

```json
{ "title": "Authorization token has already been redeemed.", "status": 409 }
```

| Status | Meaning                                                                                                                                                                  | Your action                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `401`  | Processor authentication failed (certificate, signature, name, or processor-level IP). No body is returned.                                                              | Fix credentials; verify you signed the exact raw body.                     |
| `403`  | Token is revoked, the merchant is not enabled for this flow, the token belongs to a different processor's merchant, or the source IP is not on the merchant's allowlist. | Do not retry. Surface a decline; the merchant starts a new checkout.       |
| `404`  | Unknown token.                                                                                                                                                           | Do not retry.                                                              |
| `409`  | Token already redeemed — **single use is strict**.                                                                                                                       | Do not retry with this token; card details were already released once.     |
| `410`  | Token expired (15-minute TTL, Accelerate's clock).                                                                                                                       | Fail the authorization; the merchant re-issues by re-selecting the card.   |
| `429`  | Rate limited: max **60 redemption requests per minute** per processor (fixed one-minute window).                                                                         | Back off and retry after the window; investigate what is hammering redeem. |

**Single-use is strict.** Exactly one redemption can ever succeed per token, including under concurrent attempts — the claim is atomic, so parallel redemptions produce one `200` and one `409`. If a redemption succeeds but you lose the response in transit, the token cannot be replayed; the merchant must issue a new token. This is intentional: the card details are released at most once per token.

**Timeouts:** v1 has no idempotency window on redeem. Treat a timeout as unknown-outcome: a retry will either succeed (the first attempt never landed) or return `409` (it did land, and the card was already released to you once).

***

### Merchant configuration

The flow is **opt-in per merchant**. Your Accelerate integration contact enables and configures it; the relevant settings are:

| Setting                 | Effect                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DirectAuthToken enabled | Master switch. When off, issuance and redemption for this merchant both fail with `403`, and nothing about the merchant's existing integration changes. |
| Processor               | The processor allowed to redeem this merchant's tokens (e.g. `Aurus`). Redemption by any other processor fails with `403`.                              |
| Requires CVV            | Whether a CVV must be on file before a token can be issued (see below).                                                                                 |
| Allowed redemption IPs  | Optional comma-separated list of source IPs allowed to redeem this merchant's tokens. Empty = no IP restriction.                                        |

### CVV handling

Both CVV flows are supported, selected per merchant:

* **CVV required** — a token is only issued when a CVV is on file for the selected card; issuance fails with `403` otherwise (the wallet will prompt the shopper for the CVV as part of card verification).
* **CVV-less** — the merchant authorizes without CVV; tokens are issued regardless, and `cvv` may be `null` at redemption.

Processors should treat `cvv` as nullable in **all** cases and be prepared to authorize without it for merchants configured for the CVV-less flow.

### Token lifecycle

A token moves through exactly one of these paths:

```
Issued ──(processor redeems within TTL)──▶ Redeemed     (terminal; card details released once)
Issued ──(15 minutes pass)──────────────▶ Expired       (terminal; redeem returns 410)
Issued ──(revoked by Accelerate)────────▶ Revoked       (terminal; redeem returns 403)
```

Every successful redemption also emits an Accelerate outbound receipt at the moment of credential release, recording the merchant, customer, card, processor, and amount; the `transactionId` you supplied is stored against the token. Together these are the reconciliation records tying your authorization back to the token.

***

### Testing in sandbox

Sandbox issues `atk_test_…` tokens against `https://sbx.api.weaccelerate.com`. Two sandbox-only endpoints let a merchant admin exercise the full loop without building a storefront first. Both are authenticated as the **merchant dashboard admin** (not an end user) and return `404` in production.

#### 1. Create a test wallet

`POST /sandbox/test-wallets` creates (or reuses) a test customer with cards preloaded into their wallet:

```json
{
  "firstName": "Ada",
  "lastName": "Test",
  "phoneNumber": "3231231234",
  "cards": [
    { "pan": "4242424242424242", "expiryMonth": 12, "expiryYear": 2030, "cvv": "123" }
  ]
}
```

Response:

```json
{
  "userId": "…",
  "phoneNumber": "+13231231234",
  "otp": "123123",
  "cards": [
    { "paymentSourceId": "9f3cf8a2-…", "last4": "4242", "expiryMonth": 12, "expiryYear": 2030 }
  ]
}
```

The phone number is registered as a test number: logging in with it in the sandbox wallet always uses the static OTP **`123123`**, and no SMS is sent. Use this customer to drive the real end-to-end flow through your storefront's Accelerate wallet.

#### 2. Mint a token directly

`POST /sandbox/issue-token` issues a token for a test-wallet card without going through the wallet UI (it skips the end-user session and card-verification gates — sandbox only):

```json
{ "paymentSourceId": "9f3cf8a2-…" }
```

```json
{ "authorizationToken": "atk_test_Zx8vQ1…", "expiresAt": "2026-08-04T21:15:00+00:00", "last4": "4242" }
```

Hand the resulting `atk_test_…` token to your processor's sandbox (or curl the redeem endpoint yourself, as in the authentication example) to exercise redemption, the single-use `409`, expiry `410`, and the error table above.

#### Suggested test matrix

| Case                     | How                                             | Expect                  |
| ------------------------ | ----------------------------------------------- | ----------------------- |
| Happy path               | Issue → redeem once                             | `200` with card details |
| Replay                   | Redeem the same token again                     | `409`                   |
| Expiry                   | Issue → wait 15+ minutes → redeem               | `410`                   |
| Unknown token            | Redeem a made-up `atk_test_…` value             | `404`                   |
| Bad signature            | Tamper with the body after signing              | `401`                   |
| Wrong processor/merchant | Redeem a token for a merchant not mapped to you | `403`                   |
| Rate limit               | 61+ redeems in one minute                       | `429`                   |

***

### Security model overview

* **One-time release.** Card details leave Accelerate at most once per token, enforced atomically — concurrent redemptions cannot double-release.
* **Nothing to steal at rest.** Only a SHA-256 hash of each token is stored; a database leak yields no redeemable tokens. Tokens carry 256 bits of entropy, so guessing is not feasible.
* **Short exposure window.** 15-minute TTL, enforced server-side on Accelerate's clock.
* **Disjoint auth planes.** End-user credentials cannot redeem; processor credentials cannot issue or touch any other endpoint.
* **Defense in depth on redeem.** Processor identity (mTLS or HMAC with constant-time comparison) + processor↔merchant mapping + optional processor-level and merchant-level IP allowlists + per-processor rate limiting (60/min).
* **Merchant PCI scope.** The merchant handles only the opaque token — no PAN, no CVV, no expiry — in the browser or on the server.

### Notes

* Amounts are always **minor units** (cents).
* `currency` defaults to `USD` at issuance; it is informational for the processor at redemption.
* Expiry is enforced on **Accelerate's clock** — don't gate on your own clock; handle `410` instead.
* The redeem contract's field names were agreed for the first integration and can be adapted per processor — coordinate with your integration contact before depending on additional fields.
