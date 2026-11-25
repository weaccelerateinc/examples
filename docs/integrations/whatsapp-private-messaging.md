---
description: Integrate private WhatsApp replies and review delivery with the published Accelerate SDK.
---

# WhatsApp private messaging

This page documents **SDK 0.17.0** (published 25 November 2026). SDK 0.17.0 removes the browser extension; it does not change the private messages, the WhatsApp adapters or reply parsing. The shopper message wording is the approved copy from SDK 0.16.1. See the [0.17.0 release record](universal-card-rollout.md#sdk-0170-release) and the [0.16.1 release record](universal-card-rollout.md#sdk-0161-release).

SDK 0.16.0 is a breaking release. Every checkout attaches the agent's own browser, and every checkout uses after-fill review. Hosted checkouts and the before-fill approval messages are removed. The WhatsApp adapters, the private wallet-phone correction and the private review flow continue to work. See the [0.16.0 release record](universal-card-rollout.md#sdk-0160-release).

SDK publication does not qualify a WhatsApp provider integration or merchant. Provider and payment qualification remain pending. Production activation and financial release remain closed. See [release and environment status](universal-card-rollout.md#release-and-environment-status).

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

Do not log or store raw OTP/CVV replies in application history, workflow inputs, traces, or the delivery journal. CVV still passes transiently through WhatsApp and Dana's private handler before Accelerate/VGS. The adapter cannot erase provider or device chat history. It also does not delete uploaded review images from the provider's media store; those images remain subject to provider retention. SDK 0.16.0 removed hosted checkouts, so the managed service has no CVV collection path outside private chat.

### Replies after a checkout ends

The private ingress asks the managed service about each reply. If the service reports the checkout as ended (for example, expired after five minutes), a reply that does not look like a credential goes to the assistant. This applies even when the host's saved stage is still pending. A reply that looks like a code, CVV, card number, expiry date or `+` phone number is still consumed privately. Ingress hosts need SDK 0.15.8 or later for this behavior.

## Correct the wallet number before authentication

With the compatible managed service, private start sends the OTP first and shows the destination wallet number. The prompt asks for the code or a replacement US wallet number starting with `+1`. Phone parsing and validation are unchanged: the handler still accepts `change`, `change number`, or another valid international `+` number. A different number invalidates the old challenge and receives a new code. The WhatsApp sender and recipient remain unchanged. Correction stops after wallet authentication.

The private SDK sends `X-Accelerate-Wallet-Phone: v1`; direct private clients must retain that header on negotiated start, state, and reply calls. Existing checkouts that started without it keep the legacy prompts. Forward only authenticated provider `sent_at` values. After replacement, identity answers and OTP replies must be newer than the number-change message; webhook receipt time is not a substitute.

Phone-bearing prompts use the host's typed `private_phone_prompt` outbox kind. They are rendered only for private delivery to the existing authenticated chat context. Keep the full wallet number out of model prompts, safe progress, ordinary status, analytics, and workflow inputs. Custom hosts must preserve the typed shape and encrypted storage boundary; generic prompt filters remain strict.

Install SDK 0.17.0 on every host and private-ingress worker. When migrating from SDK 0.14.1 or earlier, deploy the service first, then upgrade all private ingress/host workers sharing persistence while new private starts are paused. An older worker cannot deserialize a new phone-prompt item, including one already delivered. Do not roll back to pre-phone readers while affected records remain readable; prefer a forward fix. See [the full wallet-phone contract and upgrade sequence](agentic-platforms.md#correct-a-wallet-phone-privately).

### Private prompts

The SDK owns this text. Standard hosts receive it when they upgrade. Do not copy it into agent prompts. Hosts that compare message text in their own tests must update those expectations.

The negotiated OTP message is:

```text
💳 Pay by credit card

Reply with the verification code sent to {wallet_phone_number} to unlock your wallet.

To use a different US number, provide the full number starting with +1.

By entering the code, you agree to our Privacy Policy and Terms of Service:

https://www.weaccelerate.com/privacyandterms
```

WhatsApp clients that implement `sendInteractive` receive the first four paragraphs in one message with a native **Privacy & Terms** URL button that opens `https://www.weaccelerate.com/privacyandterms`. The consent sentence then ends with a period instead of the URL. Linq and WhatsApp clients without `sendInteractive` receive the text above. An uncertain native send never falls back to text or resends automatically.

After the customer replies `change`, the number-entry prompt is:

```text
Reply with the new number starting with +1.

Accelerate will send a new verification code to that number. Reply cancel to stop.
```

The card list for one saved address is:

```text
💳 Choose card to pay with

Option 1: {card name} **** {last4}
Add New Card: {add_card_url}

Saved address: {address label}

Reply with the option #.
```

With several saved addresses, each address is listed as `Address {N}: {label}`. The instruction is then `Reply with the option # and address #, like 1 1.` Without a saved address, the address block is omitted. A card with no last four and no completion action is left off the list. With `sendInteractive`, WhatsApp sends the heading and card rows with a native **Add Card** URL button, then the addresses and instruction. Linq shows the `Add New Card:` link in the text.

With no saved card, the prompt starts `💳 Add Card to pay with`, shows a saved address when one exists, and ends `Added a card? Reply refresh.` An unknown choice returns `That one is not on the list.` A missing address returns `Which address? Reply with the option # and address #, like 1 1.` Both error prompts end `Reply cancel to stop.`

The managed service accepts the ways people answer a card list: `1`, `1.`, `one`, `first card`, `card1`, `card 1`, a brand or card name (`amex`, `visa`, `citi`), or the last four digits. With several addresses, it also accepts `1 2`, `card 1 address 2` and `wallet 1 2`. A brand or name must match exactly one card. A bare number is not a private command, so an ended checkout does not consume a number meant for the assistant.

After the customer picks a card, the SDK sends:

```text
💳 {last4} selected:

Enter your card’s CVV or security code.

This is never shared.
```

The after-fill security-code request is:

```text
Enter the 3–4 digit security code for 💳{brand} •••• {last4}. This is secure: your assistant never sees it.
```

After verification, the SDK sends `Your card is ready for use! Accelerate will fill it, then confirm the final amount for your review. No purchase has been approved.`

The purchase review is one line beside the masked review image:

```text
Filled at {host}: {total} {currency} on {brand} •••• {last4}. Approve? Reply yes or no.
```

The customer has five minutes to decide. After approval, the SDK sends `The agent will now submit the purchase.` The customer's agent then makes the final click through its own browser. A closed checkout sends `Your Accelerate checkout is {status}.`

A fill-only review reads `Card-fill test filled at {host}: {total} {currency} on {brand} •••• {last4}. No order can be placed; this checkout closes after your review.`

If the private ingress cannot complete a private step, it sends `Accelerate could not confirm your reply. Please have your agent try again.`

These wording changes do not alter private reply interception, storage, checkout ownership, review approval, or payment authority.

## Send and reconcile the private review

Review delivery reserves its idempotency key before image upload or send. The key belongs to the review, not to the reply or event that reached it. Both private-ingress paths therefore share the host's delivery deduplication, and the customer receives one review image per review. API acceptance does not start the approval window. Only the exact, authenticated provider `sent` event for the reserved message confirms delivery; do not fabricate a delivered timestamp or treat a generic success response as proof.

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

- [SDK 0.17.0 release](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.17.0)
- [SDK 0.17.0 release record](universal-card-rollout.md#sdk-0170-release)
- [SDK 0.16.1 release record](universal-card-rollout.md#sdk-0161-release)
- [SDK 0.16.0 release record](universal-card-rollout.md#sdk-0160-release)
- [SDK 0.17.0 Dana integration contract](https://github.com/weaccelerateinc/accelerate/blob/agent-sdk-v0.17.0/products/agent-sdk/docs/dana-integration.md)
- [SDK 0.17.0 private chat reference](https://github.com/weaccelerateinc/accelerate/blob/agent-sdk-v0.17.0/products/agent-sdk/docs/private-chat.md)
- [Merged wallet implementation PR #21](https://github.com/weaccelerateinc/accelerate-wallet-mcp/pull/21)
