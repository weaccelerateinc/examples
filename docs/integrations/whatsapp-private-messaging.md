---
description: Integrate private WhatsApp replies and review delivery with the published Accelerate SDK.
---

# WhatsApp private messaging

**SDK 0.15.2 is published on npm as `latest`.** This copy patch retains the 0.15.0 service protocol. Its npm installation, GitHub release archive, immutable source, sandbox deployment, and public compatibility metadata are verified; see the [0.15.2 release record](universal-card-rollout.md#sdk-0152-release) and [0.15.0 deployment evidence](universal-card-rollout.md#sdk-0150-release). It retains the WhatsApp adapters introduced in 0.12.0 and private wallet-phone correction introduced in 0.15.0.

The earlier wallet gateway/reaper worker-loss probe and its limits are recorded in the [historical rollout status](universal-card-rollout.md#historical-sdk-0120-rollout). The phone feature needs the matching managed service and updated private workers; it needs no new wallet gateway, backend API, or SQL deployment. This SDK release does not qualify a WhatsApp provider integration or merchant. Provider and payment qualification remain pending. Production activation and financial release remain closed.

The WhatsApp adapters let a platform connect its native provider client to Accelerate's private checkout flow. They do not replace Dana's general media and onboarding router. Keep that router for ordinary messages, and intercept sensitive checkout replies before history, tracing, queues, or AI admission.

## Connect the provider adapter

The platform supplies the native client, webhook signature verification, authenticated checkout identity resolver, and direct-recipient mapping. For inbound webhooks, use `createWhatsAppWebhookBatchHandler` before ordinary message processing, or call `privateIngress.handleAuthenticated` from Dana's existing signature-verified provider router.

```js
import { createWhatsAppWebhookBatchHandler } from '@weaccelerateinc/agent-sdk/whatsapp-messaging';

const handlePrivateWhatsApp = createWhatsAppWebhookBatchHandler({
  journal: whatsappDeliveryJournal,
  sendingPhoneId: config.whatsappPhoneNumberId,
  verifyWebhook: verifyWhatsAppSignature,
  resolveIdentity: resolveAuthenticatedCheckoutIdentity,
  onMessage: event => privateIngress.handleAuthenticated(event),
});
```

`resolveAuthenticatedCheckoutIdentity` must map the provider sender to Dana's authenticated customer, workspace, direct conversation, and verified account phone. If WhatsApp's canonical `wa_id` differs from the verified phone number, return an explicit backend-verified `verified_wa_id` mapping. Do not infer it from country codes or normalize a number to guess ownership.

That resolver authenticates the chat sender. The wallet number used for OTP can be different. A private wallet-number correction never changes `wa_id`, the direct recipient, or the checkout's original ownership binding.

The batch handler processes messages in provider-array order and continues after unsupported, unknown-sender, or group traffic. Dana's `onMessage` callback must durably deduplicate provider message IDs because a webhook retry can repeat earlier callbacks. Return the result of `handleAuthenticated` from `onMessage`; the batch handler uses it to aggregate retry requests after processing the other events. The single-event authenticator is only for endpoints that guarantee one event and rejects batches.

Do not log or store raw OTP/CVV replies in application history, workflow inputs, traces, or the delivery journal. CVV still passes transiently through WhatsApp and Dana's private handler before Accelerate/VGS. The adapter cannot erase provider or device chat history. It also does not delete uploaded review images from the provider's media store; those images remain subject to provider retention. A strict no-CVV-in-chat requirement needs a separate hosted collection path.

## Correct the wallet number before authentication

With SDK 0.15.2 and the compatible managed service, private start sends OTP first and shows the destination wallet number. The prompt asks for the code or a replacement US wallet number starting with `+1`. Phone parsing and validation are unchanged: the handler still accepts `change`, `change number`, or another valid international `+` number. A different number invalidates the old challenge and receives a new code. The WhatsApp sender and recipient remain unchanged. Correction stops after wallet authentication.

The private SDK sends `X-Accelerate-Wallet-Phone: v1`; direct private clients must retain that header on negotiated start, state, and reply calls. Existing checkouts that started without it keep the legacy prompts. Forward only authenticated provider `sent_at` values. After replacement, identity answers and OTP replies must be newer than the number-change message; webhook receipt time is not a substitute.

Phone-bearing prompts use the host's typed `private_phone_prompt` outbox kind. They are rendered only for private delivery to the existing authenticated chat context. Keep the full wallet number out of model prompts, safe progress, ordinary status, analytics, and workflow inputs. Custom hosts must preserve the typed shape and encrypted storage boundary; generic prompt filters remain strict.

The 0.15.2 patch needs an SDK install in the private host/ingress workers and no new backend rollout. Existing typed phone outbox rows render the current fixed template at delivery. When migrating from SDK 0.14.1 or earlier, deploy the service first, then publish the SDK and upgrade all private ingress/host workers sharing persistence while new private starts are paused. An older worker cannot deserialize a new phone-prompt item, including one already delivered. Do not roll back to pre-phone readers while affected records remain readable; prefer a forward fix. See [the full wallet-phone contract and upgrade sequence](agentic-platforms.md#correct-a-wallet-phone-privately).

### Private prompts in SDK 0.15.2

The negotiated OTP message is:

```text
Reply with the verification code sent to {wallet_phone_number}. To use a different US number, provide the full number starting with +1.

By entering the OTP, you agree to our Privacy Policy (https://www.weaccelerate.com/privacy) and Terms of Service (https://www.weaccelerate.com/terms).
```

WhatsApp and Linq adapters send plain text. The full policy URLs remain clickable; named Markdown hyperlinks are not supported by these adapters. The final OTP and security-code prompts omit the cancellation sentence; cancellation handling is unchanged. The number-change fallback and legacy non-negotiated OTP prompt keep their earlier wording. The agreement sentence is message copy; this patch adds no consent-record or phone-region validation mechanism.

For a single saved address, card selection now says:

```text
Reply Card {choice}, using the number of your chosen card. Your saved address will be used automatically.
```

Without a saved address, the final sentence is `No saved address is available.` Multi-address prompts still request both card and address choices. Existing `Card N` and `Wallet N` reply parsing is unchanged.

The after-fill security-code request is:

```text
We will fill your selected card privately so you can review the checkout before any purchase approval. Reply here with the 3–4 digit security code for {brand} •••• {last4}. This is not shared with your assistant.
```

These wording changes do not alter private reply interception, storage, checkout ownership, review approval, or payment authority.

## Send and reconcile the private review

Review delivery reserves its idempotency key before image upload or send. API acceptance does not start the approval window. Only the exact, authenticated provider `sent` event for the reserved message confirms delivery; do not fabricate a delivered timestamp or treat a generic success response as proof.

If the send acknowledgement is lost, reconcile the existing reservation with `host.reconcilePrivateDelivery(context, key, messaging.findReviewReceipt)`. Reconciliation looks up evidence for the original send; it must not upload or send the review again. If the provider result cannot be matched to that reservation, keep the delivery uncertain for explicit reconciliation.

## Choose a journal

The reference encrypted-namespace journal is bounded. It allows up to 1,000 reservations and 3,000 status records per business sender, and has a separate bound for unmatched events. It fails closed at capacity and does not evict unresolved reservations. Use it only where those limits fit the expected traffic.

For higher volume, `createPostgresWhatsAppDeliveryJournal({ pool })` has been available since SDK 0.12.0 from `@weaccelerateinc/agent-sdk/postgres-whatsapp-journal`. The pool must provide `query` and `connect`. The journal stores normalized hash-only reservation and matched-evidence rows, and uses short `BEGIN`/`COMMIT` transactions with row locks. These transactions work with transaction poolers; they do not need a session-affine connection.

Apply its schema with the operator-only `initialize()` method during deployment, not from request handling. Schedule `pruneExpired()` to remove unmatched pre-bind events after 24 hours. Those unmatched events are capped at 64 per sender/recipient. Reservations and matched evidence remain durable. Configure database encryption, TLS, and retention in the deployment. Unrelated WhatsApp delivery statuses are ignored unless they match a bound message or an outstanding recipient reservation.

The WhatsApp journal does not replace Dana's checkout-host persistence contract. Checkout host transactions still require a direct or session-affine connection for their session advisory lock. Dana can use its existing durable store if each safe intent commits before remote effects. The persistence lock must invoke its callback exactly once per acquisition. An outer workflow step may retry, but it must re-enter the durable host and reload its record. It must not repeat the callback's remote effects directly. Never place sensitive replies, review image bytes, or native provider secrets in workflow state or journal rows.

## Eve workflow integration

Dana reports using Eve. The following guidance assumes [Vercel's eve](https://github.com/vercel/eve/blob/main/docs/tools/workflows.mdx). Confirm Dana's installed version and retry configuration before acceptance. This does not require a change to the shared SDK contract.

Eve replays workflow bodies and can retry steps or dispatch duplicate runs. Put effects in step helpers behind the durable host. Persist one mapping from Eve's authenticated session and call ID to the checkout attempt before starting it. Keep per-effect keys stable across retries and concurrent runs. A completed or cancelled attempt must not become a new checkout when the same call returns. Reconcile uncertain effects before further work. Recheck current ownership, browser readiness and expiry after a durable wait; a recorded earlier check is not current proof.

Step inputs and outputs enter durable history. Keep OTP, CVV, full wallet numbers, phone-bearing prompts, raw webhooks, review image bytes, `browser_resource`, and `cdpUrl` outside that history. Do not collect sensitive replies through `ctx.ask`, workflow hooks, or workflow webhooks. Intercept them before Eve message admission. Pass only safe references and status onward. Keep attachment preparation, service creation and attachment commit inside one step; their in-memory capabilities cannot cross a durable wait.

Ordinary steering messages can abort an `execute` call. Use a task for checkout work that must survive steering, or queue ordinary messages while it runs. This does not permit browser access through another task. Keep private replies on the private ingress.

Cancellation is not browser retirement. Do not depend on the workflow body's `finally` for cleanup. Keep independent cleanup recovery and retain the owner/session fences. Preserve the deployment and workflow entry point until its checkouts and cleanup are terminal. Eve does not replace host locking, the journal, or verified cleanup, and it does not change the database connection requirements.

## Qualification gate

The source tests do not qualify the native WhatsApp client, Meta webhook schema, recipient mapping, or provider retention. Verify those contracts against the actual provider before enabling the adapter. Retain sandbox evidence for signed batches, duplicate and out-of-order statuses, missing or late `sent` events, canonical recipient mapping, lost send acknowledgements, and private reply interception. A missing `sent` event remains pending; `delivered` or `read` timestamps do not establish the original send time.

## References

- [SDK 0.15.2 release](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.15.2)
- [SDK 0.15.2 verification record](universal-card-rollout.md#sdk-0152-release)
- [SDK 0.15.0 baseline release](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.15.0)
- [SDK 0.15.0 baseline Dana integration contract](https://github.com/weaccelerateinc/accelerate/blob/agent-sdk-v0.15.0/products/agent-sdk/docs/dana-integration.md)
- [Merged wallet implementation PR #21](https://github.com/weaccelerateinc/accelerate-wallet-mcp/pull/21)
