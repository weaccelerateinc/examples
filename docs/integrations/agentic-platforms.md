---
description: Add Accelerate as a payment option in your agent platform, using the SDK, HTTP API, or MCP tools.
---

# Agentic platforms

Accelerate agent wallets are pre-filled with up-to-date card details and address information for ~90% of US shoppers. Add Accelerate as a payment option in your agent platform with the Agent SDK, the HTTP API, or MCP tools.

Accelerate connects to the agent framework, browser provider, and customer messaging channel that your platform already uses:

- Your platform creates the browser. The customer's agent shops in it.
- At the payment step, Accelerate attaches to that same browser session. Accelerate does not create, host, or own a browser.
- The customer verifies their wallet, chooses a card, and enters the CVV in a private message channel. The agent never sees these values.
- Accelerate types the card into the payment fields and sends the customer a masked review of the filled form.
- After the customer approves, the customer's agent makes the final payment click through its own browser connection. Accelerate never clicks submit.

Nothing is installed in the browser. Accelerate's private executor types the card values with trusted browser keystrokes.

Your platform is the Accelerate integration customer and receives a **Merchant ID**. Each shopper has a separate wallet. The website where the agent shops is the checkout destination. Use your platform's Merchant ID for all checkout destinations.

**Current release:** Agent SDK **0.17.0**. Sandbox is available after your access request is approved. Production access requires approved onboarding and qualification of your browser provider and checkout flows. See [Test in sandbox](#7-test-in-sandbox) and [Go to production](#8-go-to-production).

## Choose the wallet environment

Sandbox and Production select Accelerate's wallet data, credentials, verification, and fill backend. The merchant's existing payment processor still handles the charge. Choosing an Accelerate environment does not change that processor.

| Environment | Managed checkout service (`ACCELERATE_BASE_URL`) | Wallet MCP and add-card origin |
| --- | --- | --- |
| Sandbox | `https://accelerate-agent-sdk.vercel.app` | `https://accelerate-wallet-mcp.vercel.app` |
| Production | `https://accelerate-agent-sdk-prd.politemushroom-4a4cad1b.eastus2.azurecontainerapps.io` | `https://accelerate-wallet-mcp-prd.politemushroom-4a4cad1b.eastus2.azurecontainerapps.io` |

The SDK default is Sandbox. A Sandbox wallet does not make a live merchant's processor a test processor. A real card submitted to a real merchant can create a real charge. During testing, use sandbox test wallets and checkouts that cannot place an order.

Sandbox and Production use separate Merchant IDs and API keys. Set the production URL explicitly, only after onboarding is approved.

## 1. Set up your agent workspace

Open **Agent payments** in the [Accelerate dashboard](https://dashboard.weaccelerate.com/agent-payments).

1. Select the **Sandbox** or **Production** environment.
2. Request agent-payments access with your platform name. An Accelerate operator reviews the request. After approval, your Merchant ID appears on this page.
3. Copy your **Merchant ID**.
4. Select **Create API key**. Save the key in your backend secret manager. The dashboard shows the full key only once.
5. Copy the **Add-card link** for shoppers who need to add a card.

Use the Merchant ID and API key from the same environment. The Merchant ID identifies your integration. The API key authenticates your backend. When you rotate a key, the old key can continue to work for up to 30 seconds.

The sandbox add-card link has this form:

```text
https://accelerate-wallet-mcp.vercel.app/add-card?m=YOUR_MERCHANT_ID&env=sandbox
```

Card entry stays in Accelerate's secure fields. See [Adding a new card](adding-a-new-card.md) for the shopper steps, embedding, and the link API.

## 2. Choose an integration

| Option | Use it when | Start here |
| --- | --- | --- |
| **Agent SDK** | Your backend uses Node.js. You want packaged browser, ownership, private messaging, and checkout adapters. | [Install the SDK](#3-install-the-sdk). |
| **HTTP API** | Your backend uses another language, or you want to implement the checkout lifecycle yourself. | [HTTP API](#http-api-integrate-without-the-sdk). You must implement the same ownership, private messaging, review, and cleanup contracts. |
| **MCP tools** | Your agent runtime calls tools through MCP. | Register the SDK's checkout tools on your authenticated MCP server. See [MCP tools](#mcp-tools). |

MCP controls how the agent calls checkout actions. It does not replace backend authentication or the private customer channel.

## 3. Install the SDK

Use Node.js 22 or later. The SDK is server-only, includes TypeScript declarations, and has no runtime dependencies.

- **npm package:** [@weaccelerateinc/agent-sdk@0.17.0](https://www.npmjs.com/package/@weaccelerateinc/agent-sdk/v/0.17.0)
- **Type declarations and starter guide:** included in the package. After install, see `node_modules/@weaccelerateinc/agent-sdk/*.d.ts` and `partner-starter/README.md`, or browse the [package files on npm](https://www.npmjs.com/package/@weaccelerateinc/agent-sdk/v/0.17.0?activeTab=code).

Install the SDK and generate the starter project:

```sh
npm install --ignore-scripts --save-exact @weaccelerateinc/agent-sdk@0.17.0
npx --no-install accelerate-agent --version
npx --no-install accelerate-agent init ./accelerate-demo
cd accelerate-demo
npm install --ignore-scripts --save-exact @weaccelerateinc/agent-sdk@0.17.0
npm test
npm run smoke
```

The version command prints `0.17.0`. The starter tests and smoke run use synthetic browser, verification, and messaging fixtures. They do not contact a live service and do not create an order. Commit `package.json` and the lockfile.

## 4. Connect your existing browser

Keep your browser provider and browser creation code. Every checkout uses that browser. The current integration supports Chromium browsers that you can control through CDP. Create the browser with recording disabled.

Choose the path for your provider:

| Provider | What to do |
| --- | --- |
| **Browser Use** | No connector is necessary. Your Browser Use API key stays with you. Use the packaged `createBrowserUseHost` and `createBrowserUseConnector`. See [Browser Use integration](browser-use.md). |
| **Another CDP provider** | Implement the SDK's `BrowserConnectorHost`. Accelerate provisions and registers a matching provider connector for your Merchant ID. See [Browser connector interface](browser-connector-interface.md) and [Provider connector contract](provider-connector-contract.md). |

Your browser host supplies these operations:

| Host method | Your platform supplies |
| --- | --- |
| `resolveOwnedBrowser` | The authenticated customer's browser, exact checkout document, and expiry, from backend records. |
| `inspectBrowser` | The current document, recording state, remaining lifetime, and automation restriction state. |
| `drainAndFence` | A durable block on new ordinary browser actions, after in-flight actions finish. |
| `bindCheckout` | A durable record of the checkout, attempt, browser, document, and restriction. |
| `resolveCheckoutBrowser` | The same record, for later payment checks. |
| `confirmCleanup` | Independent proof that the browser stopped and the payment credentials were cleared. |
| `performFinalClick` | Purchases only: one trusted click on the bound submit control, through your own browser connection. |

Fill-only integrations can omit `performFinalClick`. Purchases require it. See [Purchase mode and checkout support](purchase-mode.md).

For another provider, create the connector in your backend startup code:

```js
import { createExistingBrowserConnector } from '@weaccelerateinc/agent-sdk/browser-connector';

const browserConnector = createExistingBrowserConnector({
  connectorId: platformConfig.accelerateConnectorId, // provisioned by Accelerate
  host: platformBrowserHost,                          // your BrowserConnectorHost
});
```

Browser credentials and CDP URLs stay in trusted backend components. The agent receives only safe checkout state.

## 5. Connect your backend

Set these server values:

```dotenv
ACCELERATE_API_KEY=YOUR_TENANT_API_KEY
ACCELERATE_MERCHANT_ID=YOUR_MERCHANT_UUID
ACCELERATE_BASE_URL=https://accelerate-agent-sdk.vercel.app
```

Check the key and Merchant ID:

```js
import { AccelerateClient } from '@weaccelerateinc/agent-sdk';

const accelerate = AccelerateClient.fromEnv();
const connection = await accelerate.connection.check();
// connection.status === 'connected'
```

You can also run `npx --no-install accelerate-agent doctor`. These checks verify the API credentials only. They do not test the browser, private messaging, or payment.

Compose the partner integration on your authenticated MCP server:

```js
import { AccelerateClient } from '@weaccelerateinc/agent-sdk';
import { AcceleratePrivateChatClient } from '@weaccelerateinc/agent-sdk/private-chat';
import { createPostgresCheckoutPersistence } from '@weaccelerateinc/agent-sdk/postgres-host';
import { registerPartnerCheckoutTools } from '@weaccelerateinc/agent-sdk/partner';

const persistence = createPostgresCheckoutPersistence({
  pool: yourExistingPgPool,
  encryptionKey: yourProtected32ByteHostKey,
});
// Run once during deployment, not per request: await persistence.initialize();

const integration = registerPartnerCheckoutTools(yourAuthenticatedMcpServer, {
  client: AccelerateClient.fromEnv(),
  privateChat: AcceleratePrivateChatClient.fromEnv(),
  persistence,
  browserConnector,
  resolveContext: resolveVerifiedCustomerContext,
  authenticate: verifyPrivateWebhookAndResolveDirectIdentity,
  messaging: yourPrivateMessagingAdapter,
  admitOrdinaryMessage: enqueueAllowlistedOrdinaryMessage,
  dispatchSafeProgress: enqueueDeduplicatedSafeProgress,
  profile: 'managed_review_v2',
  purpose: 'purchase',
  enableSubmit: true,
});
```

Your application supplies each named callback:

- **`resolveContext`**: the authenticated customer, workspace, direct conversation, and phone, from your backend records. Never take identity from model arguments.
- **`persistence`**: durable checkout ownership, operation locks, and event delivery. The Postgres adapter is included. Keep the 32-byte host key stable across replicas.
- **`authenticate`** and **`messaging`**: a verified private webhook and a `PrivateMessagingAdapter` for your customer channel. Packaged adapters exist for Linq (iMessage) and WhatsApp. See [Private messaging](private-messaging.md).
- **`admitOrdinaryMessage`** and **`dispatchSafeProgress`**: your queues for ordinary messages and safe progress events to the agent.

Mount `integration.privateIngress.handle(request, rawBody)` before any body logging, parsing, history, tracing, or AI middleware. It intercepts OTP, card choice, CVV, and approval replies so that they never reach the model.

Always set `profile: 'managed_review_v2'`. In this profile, the backend fills the card immediately after private CVV verification, and the agent has no fill tool. The `managed_review_v1` profile exposes a manual fill tool instead. Do not use it for new integrations.

Set `profile`, `purpose`, and `enableSubmit` explicitly. If you omit them, the defaults are `managed_review_v1`, `sandbox_fill_only`, and `false`. For a no-order test, use `purpose: 'sandbox_fill_only'` with `enableSubmit: false`. The registration purpose is a default. The agent can choose `purchase` or `sandbox_fill_only` for each checkout on `accelerate_checkout_start`. A purchase always requires a browser host that implements `performFinalClick`.

For exact option and callback types, see `partner.d.ts` and `private-ingress.d.ts` in the package. The generated starter's `README.md` (also shipped in the package as `partner-starter/README.md`) walks through a complete server.

## 6. Follow the payment flow

1. **Shop in your existing browser.** Keep the cart, merchant login, and cookies in the same session. Fill the required contact, shipping, and cardholder-name fields. Leave the card number, expiry, and CVV empty. Finish shopping before you start the Accelerate checkout. The Accelerate browser tool can only read the page.
2. **Attach at the payment step.** The agent calls `accelerate_checkout_start`. Your backend resolves the browser from ownership records, then stops and drains ordinary browser automation. Accelerate checks that the payment form is supported before it sends any OTP.
3. **Verify the customer privately.** This step comes before the quote. Accelerate sends the OTP to the wallet phone. The customer replies with the code, then chooses a masked card. A new shopper can be asked for first name, last name, and email first. The customer can choose a card by option number, a word such as `one`, a brand name, or the last four digits. The agent receives only safe checkout status.
4. **Apply the address and confirm the total.** The agent applies the selected address and requests approval of the final amount, including shipping and tax. Accelerate binds the quote to the exact checkout URL, total, currency, revision, and submit control.
5. **Collect the CVV and fill once.** The approval request starts the private CVV step. When the CVV verifies, Accelerate fills the card once in the backend, inside the same private reply. Neither the agent nor your backend calls a fill tool or route.
6. **Send the private review.** The customer receives the masked payment form and the final amount together. The customer has five minutes from the confirmed sent receipt to reply yes or no. A filled form is not an approval.
7. **The customer's agent clicks.** After the customer approves, the agent calls `accelerate_checkout_submit`. The SDK checks readiness, arms the approved revision, calls your `performFinalClick` once, and records the outcome. Fill-only tests cancel after the review. Ordinary browser access stays blocked until cleanup is confirmed.

These steps are the same for the SDK, HTTP API, and MCP tools. For the private steps in detail, see [Private CVV and credential delivery](agentic-platforms-private-payments.md) and [Private messaging](private-messaging.md).

### Wallet phone correction

The OTP prompt shows the wallet number that received the code. Before the customer authenticates, they can reply with a different US number that starts with `+1`. Accelerate then sends a new code to that number. After authentication, the number cannot change.

The wallet number can differ from the chat phone. A correction does not change the message recipient, the checkout owner, or the customer, workspace, and conversation binding.

The SDK handles this automatically. HTTP integrations must send `X-Accelerate-Wallet-Phone: v1` on private start, state, and reply calls. Phone changes and later replies require the provider's authenticated `sent_at` time. Never use webhook receipt time instead. Keep full wallet numbers and OTP replies out of model prompts, safe status, logs, and analytics.

## HTTP API: integrate without the SDK

Call the managed checkout service from your backend. All routes use these headers:

```http
Authorization: Bearer YOUR_TENANT_API_KEY
X-Accelerate-Merchant-Id: YOUR_MERCHANT_UUID
Accept: application/json
Content-Type: application/json
```

`Content-Type` is required for POST bodies. The service rejects browser-origin requests. Derive the customer, workspace, conversation, phone, and browser ownership from authenticated backend records.

Check connectivity:

```sh
curl --fail-with-body "$ACCELERATE_BASE_URL/v1/connection" \
  -H "Authorization: Bearer $ACCELERATE_API_KEY" \
  -H "X-Accelerate-Merchant-Id: $ACCELERATE_MERCHANT_ID" \
  -H "Accept: application/json"
```

### Call order

1. `POST /v1/checkouts` with `fill_after_verification: true`. Require the same flag in the response.
2. `POST /v1/checkouts/{id}/private-chat/start` sends the OTP.
3. `POST /v1/checkouts/{id}/private-chat/reply` with the OTP, then with the card choice.
4. `POST /v1/checkouts/{id}/details` applies the selected address.
5. Read the total with `POST /v1/checkouts/{id}/browser`. Optionally, check it with `POST /v1/checkouts/{id}/verify-quote`.
6. `POST /v1/checkouts/{id}/approval` checks the total again, freezes the quote, arms the fill, and starts the CVV step.
7. `POST /v1/checkouts/{id}/private-chat/reply` with the CVV verifies it and fills the card in the same call.
8. `POST /v1/checkouts/{id}/private-chat/review`, send the image and amount to the customer, then `POST /v1/checkouts/{id}/private-chat/review-delivered`.
9. Fill-only: `POST /v1/checkouts/{id}/cancel` with `{}`. Purchase: after the customer's yes, run [arm, click, and complete](purchase-mode.md#direct-http-final-click-api).

### Checkout routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/v1/connection` | Check the API key and Merchant ID. |
| `POST` | `/v1/checkouts` | Create a checkout on an owned existing browser. |
| `GET` | `/v1/checkouts/{id}` | Read safe status and the current revision. |
| `POST` | `/v1/checkouts/{id}/browser` | Read the checkout page: snapshot, text, find, and wait. The page cannot be changed through this route. |
| `POST` | `/v1/checkouts/{id}/details` | Apply the privately selected address. |
| `POST` | `/v1/checkouts/{id}/verify-quote` | Optional check of the final amount and currency. It stores nothing. |
| `POST` | `/v1/checkouts/{id}/approval` | Call after OTP, card selection, and `/details`. Check the total, freeze the quote, arm the fill, and start private CVV verification. This does not approve a purchase. |
| `POST` | `/v1/checkouts/{id}/final-click/arm` | Backend only: arm the approved revision and receive the short-lived click target. |
| `POST` | `/v1/checkouts/{id}/final-click/complete` | Backend only: record the outcome after your one click. |
| `POST` | `/v1/checkouts/{id}/cancel` | Cancel and start cleanup. Send `{}`. |
| `POST` | `/v1/checkouts/{id}/reconcile` | Record the merchant order result that your backend checked. |

### Create a checkout

The `browser` binding depends on your provider. For a registered connector:

```json
{
  "customer_id": "customer_42",
  "workspace_id": "workspace_42",
  "conversation_id": "conversation_42",
  "phone_number": "+14155550100",
  "start_url": "https://shop.example/checkout/payment",
  "idempotency_key": "checkout_attempt_42",
  "interaction_mode": "chat",
  "purpose": "purchase",
  "final_click_actor": "customer",
  "approval_policy": "after_fill",
  "fill_after_verification": true,
  "browser": {
    "provider": "connector",
    "connector_id": "your_platform_browser",
    "browser_id": "owned_browser_42",
    "custody_mode": "customer_backend_trusted"
  }
}
```

For Browser Use, send no connector. Read `GET https://api.browser-use.com/api/v4/browsers/{id}` with your own key just before you create the checkout. Send the result as `browser_resource`:

```json
{
  "browser": {
    "provider": "browser_use",
    "browser_id": "BROWSER_USE_ID",
    "custody_mode": "customer_backend_trusted"
  },
  "browser_resource": {
    "id": "BROWSER_USE_ID",
    "status": "active",
    "cdpUrl": "wss://….cdp.browser-use.com/…",
    "startedAt": "…",
    "timeoutAt": "…",
    "recordingAvailable": false,
    "metadata": { "accelerate_merchant_id": "…", "accelerate_owner_user_id": "customer_42", "accelerate_workspace_id": "workspace_42", "accelerate_custody_mode": "customer_backend_trusted" }
  }
}
```

The service forwards `browser_resource` to the private executor once and does not store it. Only `*.cdp.browser-use.com` connections are accepted. `browser_resource` is rejected with `provider: "connector"`. Treat `cdpUrl` as a secret: keep it out of model input and logs. See [Browser Use integration](browser-use.md).

Rules for the create request:

- `browser`, `interaction_mode: "chat"`, and `approval_policy: "after_fill"` are required. Purposes are `purchase` and `sandbox_fill_only`.
- A purchase requires `final_click_actor: "customer"`. Require the same value in the response before you send the OTP. For a fill-only test, omit `final_click_actor`.
- `start_url` is the browser's exact current HTTPS checkout URL, including query and fragment. A URL can contain a long merchant ID. A digit run is refused only when it passes the card-number (Luhn) check.
- Use one stable `idempotency_key` for each logical checkout attempt. After a timeout, read the existing attempt before any further payment action.
- Store the returned `id` and revision in your durable ownership record.

If the payment form is not supported, the service returns `checkout_unsupported` before any OTP. The browser stays open. You can start a new checkout with a new idempotency key after you change the page. If the customer's browser has stopped or expired, the service returns `browser_ended`. Create a new browser and a new checkout.

### Confirm the total and start CVV

`POST /v1/checkouts/{id}/verify-quote` is optional:

```json
{
  "revision": 2,
  "checkout_url": "https://shop.example/checkout/payment",
  "expected_amount_cents": 1299,
  "checkout_total_selector": "#checkout-total"
}
```

`POST /v1/checkouts/{id}/approval` starts the CVV step:

```json
{
  "checkout_url": "https://shop.example/checkout/payment",
  "amount_cents": 1299,
  "checkout_total_selector": "#checkout-total",
  "submit_selector": "#place-order",
  "fill_after_verification": true
}
```

Do not send `revision` in the approval body. A successful response carries `fill_after_verification: true`.

| Request | Result |
| --- | --- |
| `/approval` without `fill_after_verification: true` | 409 `fill_continuation_required`. No CVV starts. The checkout stays open. |
| `/approval` with the flag, on a checkout created without it | 403 `capability_disabled`. No CVV starts. The checkout stays open. |
| `/approval` with a missing or unknown field, including `revision` | 400 `invalid_input`. No CVV starts. The checkout stays open. |
| `/approval` before card selection or `/details` | 409 `wallet_required` or `details_required`. The checkout stays open. |
| `/approval` with less than nine minutes of checkout lifetime left | 409 `review_unavailable`. The checkout closes as `failed`. |
| `/approval` or `/verify-quote` with a total that does not match the page | The checkout closes as `failed`. Keep the restriction and confirm cleanup. |
| A CVV reply before `/approval` succeeds | Consumed. Nothing is verified or filled. |
| A CVV that fails verification | The checkout closes as `outcome_unknown`. Do not retry or start a replacement. |

### Currency

Accelerate supports USD. `expected_currency` on `/verify-quote` and `currency` on `/approval` and confirmed `/reconcile` are optional and default to `USD`. Any value other than `USD`, including `null` or an empty string, is rejected.

The default does not prove the page currency. Accelerate still reads the currency on the page and binds it to the quote. A bare `$` total is read as USD. A visible non-USD currency code rejects the total.

### Private verification and review routes

These routes are for your private message handler only. Never expose them as model tools.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/v1/checkouts/{id}/private-chat/start` | Send the OTP. Call this at payment, before `/details` and `/approval`. |
| `POST` | `/v1/checkouts/{id}/private-chat/state` | Read the private prompt state. |
| `POST` | `/v1/checkouts/{id}/private-chat/reply` | Process an authenticated private customer reply. |
| `POST` | `/v1/checkouts/{id}/private-chat/review` | Get the masked PNG and review metadata. |
| `POST` | `/v1/checkouts/{id}/private-chat/review-delivered` | Acknowledge the provider's sent receipt for the review. |
| `POST` | `/v1/checkouts/{id}/private-chat/cancel` | Cancel the private interaction. |

Private calls bind `customer_id`, `workspace_id`, and `conversation_id` to the checkout. Replies also need the verified provider `message_id` and the transient `text`. Purchase approval replies need the provider's verified `sent_at`. Include `reply_to_message_id` when available. On review delivery, `sent_at` must not be earlier than the service's review time. There is no clock tolerance. Do not forward private state or images to the model.

The SDK's `AcceleratePrivateChatClient` sends these requests for you. For exact request and response shapes, see `private-chat.d.ts` in the [package files](https://www.npmjs.com/package/@weaccelerateinc/agent-sdk/v/0.17.0?activeTab=code), or ask Accelerate for the HTTP contract during onboarding.

### Record the merchant's result

`submit_attempted` and `outcome_unknown` do not tell you whether an order exists. After a submit, your backend checks the merchant's order system, then records the result:

```js
await accelerate.checkouts.reconcile(checkoutId, {
  state: 'confirmed', // or 'declined' or 'not_found'
  order_reference: merchantOrderId,
  amount_cents: 1299,
  source: 'merchant_order_api',
});
```

This is `POST /v1/checkouts/{id}/reconcile`. It is a backend call. There is no MCP tool for it. Never take this input from a model.

- `order_reference` and `amount_cents` are required for `confirmed`. A `confirmed` amount must equal the approved quote.
- `source` is always required. Use a short lowercase label. Do not put an order number in it, because status returns it.
- Each checkout holds one result. The same input returns the same result. Different input returns 409 `reconciliation_conflict`. Record a result only when your order system has a settled answer.
- `payment_confirmed` stays `false`. The result is your statement, not Accelerate's proof.
- Checkout records are deleted 24 hours after creation. Keep your own record.

## MCP tools

Use `registerPartnerCheckoutTools` from `@weaccelerateinc/agent-sdk/partner` on your authenticated MCP server, as shown in [Connect your backend](#5-connect-your-backend). The generated starter has a complete example.

The agent sees these tools:

| Tool | Purpose |
| --- | --- |
| `accelerate_checkout_start` | Attach the agent's browser at the payment step. Optional `purpose`: `purchase` or `sandbox_fill_only`. |
| `accelerate_checkout_browser` | Read the checkout page: snapshot, text, find, and wait. It cannot click or navigate. |
| `accelerate_checkout_request_payment` | Start private wallet verification. |
| `accelerate_checkout_apply_details` | Apply the selected address. |
| `accelerate_checkout_request_approval` | Confirm the final total and start the private CVV step. |
| `accelerate_checkout_status` | Read safe status. |
| `accelerate_checkout_submit` | Purchases only, after the customer approves. Input `{ checkout_id, revision }`. |
| `accelerate_checkout_cancel` | Cancel the checkout. |

Identity, browser credentials, OTP, CVV, click targets, and the private review routes never appear in tool inputs, results, or history.

Suggested agent instructions:

```text
Use Accelerate by default for supported payments. Shop in the platform's browser.
Before attachment, complete required contact, shipping and cardholder-name fields.
Leave card number, expiry and CVV empty; never obtain them through ordinary tools.
At the payment step, call accelerate_checkout_start, then request private payment
verification. Wait for the wallet, apply details, and request approval of the actual
final total. The CVV stays private and Accelerate fills the card. Wait for the
customer's decision on the private review. A filled form is not approval. Submit only
after purchase approval. Cancel fill-only tests. Never collect codes, inspect the
filled page, replace an uncertain checkout, or retry fill or submit.
```

Instructions guide the agent. Your backend authorization and durable restrictions enforce the sequence.

The dashboard also shows the wallet MCP endpoint, `https://accelerate-wallet-mcp.vercel.app/api/mcp`. That endpoint is a separate wallet interface. It does not provide the checkout tools above or the final-click flow. Do not use it in place of the partner SDK.

## 7. Test in sandbox

Start with a fill-only test. It cannot place an order.

1. Set `purpose: 'sandbox_fill_only'` and `enableSubmit: false`. In the starter, set `ACCELERATE_STARTER_PURPOSE=sandbox_fill_only` and `ACCELERATE_ENABLE_PURCHASE_SUBMIT=false`.
2. Create a test shopper on the dashboard's [Test wallets](https://dashboard.weaccelerate.com/test-wallets) page. It is sandbox only and accepts test card BINs only. The OTP is always `123123`. A phone number can belong to only one merchant.
3. Open the safe test checkout in your browser: `https://accelerate-agent-sdk.vercel.app/sandbox/checkout`. Its page policy blocks the form post, so it cannot place an order. The total selector is `#checkout-total`. The submit selector is `#place-order`.
4. Run the full flow. Use the CVV that you set on the test card.
5. Cancel after the review is delivered.

Verify same-browser attachment, private verification, the final total, one fill, masked review delivery, cancellation, and cleanup.

## 8. Go to production

1. Select **Request production access** in the dashboard.
2. Agree the browser provider, merchant checkouts, and success criteria with Accelerate. Accelerate qualifies your browser connector and the purchase flow on those checkouts.
3. After approval, use the Production Merchant ID and API key, and set `ACCELERATE_BASE_URL` to the production service.

The current flow supports saved cards and USD. Browser support and merchant checkout support are qualified separately. Installing the SDK does not qualify a checkout. See [Purchase mode and checkout support](purchase-mode.md).

## Outcomes

- `ready_for_submit` does not prove customer approval.
- `submit_attempted` and `outcome_unknown` do not confirm an order. Check the merchant's order status before you report success or start another purchase.
- Never automatically repeat an uncertain fill or submit.

## Related pages

- [Purchase mode and checkout support](purchase-mode.md)
- [Adding a new card](adding-a-new-card.md)
- [Browser connector interface](browser-connector-interface.md)
- [Browser Use integration](browser-use.md)
- [Private messaging](private-messaging.md)
- [Provider connector contract](provider-connector-contract.md)
- [Private CVV and credential delivery](agentic-platforms-private-payments.md)
