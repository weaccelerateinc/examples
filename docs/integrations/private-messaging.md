---
description: Connect your customer messaging channel to Accelerate's private verification, CVV, and review flow.
---

# Private messaging

The customer verifies their wallet, chooses a card, enters the CVV, and approves the purchase in a private message channel. Your platform connects its existing channel to the SDK. Sensitive replies are intercepted before your logs, history, tracing, queues, or AI receive them. The agent receives only safe progress.

The SDK includes adapters for two channels:

| Channel | Package | Includes |
| --- | --- | --- |
| iMessage through Linq | `@weaccelerateinc/agent-sdk/linq-messaging` | `createLinqMessagingAdapter` and `createLinqWebhookAuthenticator`. |
| WhatsApp | `@weaccelerateinc/agent-sdk/whatsapp-messaging` | `createWhatsAppMessagingAdapter` and `createWhatsAppWebhookBatchHandler`. |

For another channel, implement `PrivateMessagingAdapter`. The adapter must send the masked review image and the amount together, and record the provider's actual sent receipt.

Your platform always supplies the provider client, the webhook signature verification, the authenticated identity lookup, and the direct-recipient mapping. The adapters do not create unverified conversations or invent webhook authentication.

## Intercept private replies

Mount `integration.privateIngress.handle(request, rawBody)` before any body logging, parsing, history, tracing, or AI middleware. Order matters: a framework callback that runs after the framework caches the message is too late.

The ingress erases the mutable request buffer and the parsed reply after use. Do not make an earlier copy of the body or trace the authentication callback. Only a new, allowlisted ordinary message or a fixed safe progress event can reach the agent. Call `privateIngress.drain(authenticatedContext)` from your durable worker to recover pending safe deliveries.

Do not log or store raw OTP or CVV replies in history, workflow inputs, traces, or the delivery journal. The CVV still passes through the messaging provider and your private handler before it reaches Accelerate. The SDK cannot erase provider or device chat history, or review images in the provider's media store.

## Connect WhatsApp

For inbound webhooks, run `createWhatsAppWebhookBatchHandler` before ordinary message processing. If you already have a signature-verified provider router, call `privateIngress.handleAuthenticated` from it instead.

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

- `resolveAuthenticatedCheckoutIdentity` maps the sender to your authenticated customer, workspace, direct conversation, and verified phone. If WhatsApp's `wa_id` differs from the verified phone, return an explicit, backend-verified `verified_wa_id`. Do not guess from country codes.
- The batch handler processes messages in provider order. It continues after unsupported, unknown-sender, or group messages.
- A webhook retry can repeat earlier messages. Your `onMessage` callback must durably deduplicate provider message IDs. Return the result of `handleAuthenticated` so that the handler can request retries correctly.
- Use the single-event authenticator only for endpoints that always receive one event.

For native buttons, your WhatsApp client must implement `sendInteractive`. Forward the supplied `cta_url` object in one request, pass its abort signal, disable retries, and return the provider message ID. Without `sendInteractive`, the adapter sends text links.

### Choose a delivery journal

The WhatsApp adapter records sends and receipts in a journal.

- **Reference encrypted-namespace journal.** Bounded: up to 1,000 reservations and 3,000 status records per business sender. It fails closed at capacity. Use it only when these limits fit your traffic.
- **Postgres journal.** `createPostgresWhatsAppDeliveryJournal({ pool })` from `@weaccelerateinc/agent-sdk/postgres-whatsapp-journal`. The pool must provide `query` and `connect`. It stores hash-only rows and uses short transactions, so it works with transaction poolers. Run `initialize()` during deployment, not in request handling. Schedule `pruneExpired()` to remove unmatched events after 24 hours.

The journal does not replace the checkout host's persistence. Checkout host transactions need a direct or session-affine database connection for their advisory lock.

## Replies after a checkout ends

The private ingress asks the managed service about each reply. When the checkout has ended, for example after the five-minute approval window, an ordinary reply goes to the assistant. A reply that looks like a code, CVV, card number, expiry date, or `+` phone number is still handled privately and never reaches the assistant.

## Wallet phone correction

The OTP prompt shows the wallet number that received the code. Before authentication, the customer can reply with a different US number that starts with `+1`. The handler also accepts `change`, `change number`, and other valid international `+` numbers. A new number cancels the old code and receives a new one. After authentication, the number cannot change.

The chat sender and recipient do not change. A correction never changes `wa_id`, the direct recipient, or the checkout's ownership.

Forward only the provider's authenticated `sent_at` values. After a number change, later replies must be newer than that message. Webhook receipt time is not a substitute.

Phone prompts use the host's typed `private_phone_prompt` outbox item. Card prompts use `private_card_prompt`. They are rendered only at private delivery. Keep full wallet numbers out of model prompts, safe progress, status, analytics, and workflow inputs. Custom hosts must keep these typed shapes and the encrypted storage.

## Private prompts

The SDK owns this text. Do not copy it into agent prompts or application strings. Custom hosts can render it with `renderPrivateChatState(state, { messageId })`.

The OTP message:

```text
💳 Pay by credit card

Reply with the verification code sent to {wallet_phone_number} to unlock your wallet.

To use a different US number, provide the full number starting with +1.

By entering the code, you agree to our Privacy Policy and Terms of Service:

https://www.weaccelerate.com/privacyandterms
```

With `sendInteractive`, WhatsApp sends the first four paragraphs in one message with a **Privacy & Terms** button. The consent sentence then ends with a period. Other channels receive the text above.

After the customer replies `change`:

```text
Reply with the new number starting with +1.

Accelerate will send a new verification code to that number. Reply cancel to stop.
```

The card list with one saved address:

```text
💳 Choose card to pay with

Option 1: {card name} **** {last4}
Add New Card: {add_card_url}

Saved address: {address label}

Reply with the option #.
```

With several saved addresses, each is listed as `Address {N}: {label}`, and the instruction is `Reply with the option # and address #, like 1 1.` Without a saved address, the address block is omitted. With `sendInteractive`, WhatsApp sends the card rows with an **Add Card** button, then the addresses and instruction. iMessage shows the `Add New Card:` link in the text.

The customer can answer with `1`, `1.`, `one`, `first card`, `card1`, `card 1`, a brand or card name (`amex`, `visa`, `citi`), or the last four digits. With several addresses, `1 2`, `card 1 address 2`, and `wallet 1 2` also work. A brand or name must match exactly one card. After adding a card, the customer can reply `refresh` to reload the list.

With no saved card, the prompt starts `💳 Add Card to pay with` and ends `Added a card? Reply refresh.` An unknown choice returns `That one is not on the list.` A missing address returns `Which address? Reply with the option # and address #, like 1 1.`

If a saved card needs its number completed, selecting it returns a **Complete Card** link. The customer enters the card details in the secure wallet, then replies `refresh`.

After the customer chooses a card:

```text
💳 {last4} selected:

Enter your card’s CVV or security code.

This is never shared.
```

The security-code request:

```text
Enter the 3–4 digit security code for 💳{brand} •••• {last4}. This is secure: your assistant never sees it.
```

After verification: `Your card is ready for use! Accelerate will fill it, then confirm the final amount for your review. No purchase has been approved.`

The purchase review is one line beside the masked review image:

```text
Filled at {host}: {total} {currency} on {brand} •••• {last4}. Approve? Reply yes or no.
```

The customer has five minutes to decide. After approval, the SDK sends `The agent will now submit the purchase.` A closed checkout sends `Your Accelerate checkout is {status}.`

A fill-only review reads `Card-fill test filled at {host}: {total} {currency} on {brand} •••• {last4}. No order can be placed; this checkout closes after your review.`

If the ingress cannot complete a private step, it sends `Accelerate could not confirm your reply. Please have your agent try again.`

## Send and reconcile the review

Review delivery reserves its idempotency key before the image upload or send. The key belongs to the review, so the customer receives one review image for each review. API acceptance does not start the approval window. Only the authenticated provider `sent` event for the reserved message confirms delivery. Do not create a delivered timestamp or treat a generic success response as proof.

If the send acknowledgement is lost, reconcile the existing reservation with `host.reconcilePrivateDelivery(context, key, messaging.findReviewReceipt)`. Reconciliation looks for the original send. It never sends the review again. If the provider result cannot be matched, keep the delivery uncertain.

## Test before you go live

The SDK tests use synthetic providers. Test your actual messaging provider before you enable the adapter:

- Signed batches, and duplicate and out-of-order statuses.
- Missing or late `sent` events. A missing `sent` event stays pending. `delivered` or `read` times do not establish the send time.
- Canonical recipient mapping.
- Lost send acknowledgements.
- Interception of every private reply before your logs, history, and AI.

For exact types, see `private-chat.d.ts`, `private-ingress.d.ts`, `linq-messaging.d.ts`, and `whatsapp-messaging.d.ts` in the [package files](https://www.npmjs.com/package/@weaccelerateinc/agent-sdk/v/0.17.0?activeTab=code).
