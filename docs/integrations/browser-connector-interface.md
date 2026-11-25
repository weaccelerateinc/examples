---
description: Connect your platform's authenticated browser ownership and automation controls to the Accelerate SDK.
---

# Browser connector interface

The SDK browser connector attaches the browser that your platform already uses for shopping. Your backend implements `BrowserConnectorHost`. The host resolves ownership, checks readiness, pauses ordinary automation, and confirms cleanup. The cart, cookies, login, and payment page stay in the same browser session.

Accelerate's private executor types the card values into the payment fields with trusted browser keystrokes. Nothing is installed in the browser. The executor never sends the final click. For a purchase, your `performFinalClick` callback sends that click through your own browser connection.

This page describes the client side. Accelerate separately registers a [provider connector](provider-connector-contract.md) in its private executor and cleanup service. Both sides use the same Merchant ID and connector ID.

If your platform uses Browser Use, use the packaged adapter instead. See [Browser Use integration](browser-use.md).

## Create the connector

```js
import { createExistingBrowserConnector } from '@weaccelerateinc/agent-sdk/browser-connector';

const browserConnector = createExistingBrowserConnector({
  connectorId: platformConfig.accelerateConnectorId,
  host: platformBrowserHost,
  minimumRemainingMs: 600000,
});
```

Use the connector ID that Accelerate provisions for your Merchant ID. Pass `browserConnector` to `registerPartnerCheckoutTools`. See [Connect your backend](agentic-platforms.md#5-connect-your-backend).

The connector does not create browsers, install anything in the browser, register a provider, or move a cart.

## Authenticated host records

Every host call receives the verified checkout context. Resolve it from your authenticated application session and durable ownership records. Model arguments must never supply customer identity, a provider connection, or ownership claims.

`OwnedBrowserDocument` has exactly these fields:

| Field | Required value |
| --- | --- |
| `owner` | Verified `customer_id`, `workspace_id`, `conversation_id`, and E.164 `phone_number`. |
| `browser` | The registered browser binding below. |
| `document_id` | A stable identifier for the actual checkout document. |
| `checkout_url` | The exact current HTTPS checkout URL, including query and fragment. |
| `expires_at` | The browser's original UTC expiry, as an ISO timestamp. |

The browser binding is:

```json
{
  "provider": "connector",
  "connector_id": "your_platform_browser",
  "browser_id": "owned_browser_42",
  "custody_mode": "customer_backend_trusted"
}
```

Host records use strict field sets. Return only these fields, not the full provider response. Keep connection URLs, provider keys, and other metadata out of these records and out of model results.

## Implement the host methods

| Method | Inputs after `context` | Result and behavior |
| --- | --- | --- |
| `resolveOwnedBrowser` | `{ attempt_key, checkout_url }`, options | Return `OwnedBrowserDocument` from your ownership records. |
| `inspectBrowser` | Owned browser document, options | Return the same document fields plus `recording_disabled: true` and the current `automation` state. |
| `drainAndFence` | Owned browser document, `{ attempt_key }`, options | Persist the restriction, reject new ordinary automation, and wait for in-flight work. Return `{ fence_id, ordinary_operations_drained: true, agent_access_fenced: true }`. |
| `bindCheckout` | Fenced document plus `checkout_id` and `attempt_key`, options | Persist the checkout, attempt, browser, document, and fence together. Return nothing. If the acknowledgement is lost, keep the restriction. |
| `resolveCheckoutBrowser` | `{ checkout_id }`, options | Return the same persisted `FencedBrowserDocument`, including `fence_id`. |
| `confirmCleanup` | Fenced document, `{ checkout_id }`, options | Confirm cleanup independently. Return `{ provider_browser_stopped: true, credentials_cleared: true, fence_retained: true }`. |
| `performFinalClick` | Click request, options | Purchases only. See [Customer final click](#customer-final-click). |

`inspectBrowser` returns `automation: { ordinary_operations_drained, agent_access_fenced, fence_id }`. Before fencing, these values can show active automation. After fencing, both flags must be `true` and the fence ID must match.

Every inspection must return the same owner, browser binding, document ID, URL, and expiry. Report what you observe. Do not copy requested values into a response. A process-local mutex or an instruction to the model is not a durable restriction across workers.

## Attachment and readiness

The connector exposes four lifecycle methods. The partner SDK calls them for you:

1. `prepareAttachment(context, { attempt_key, checkout_url })` resolves and inspects the browser, drains and fences automation, then checks readiness again.
2. `commitAttachment(context, { checkout_id, attachment })` persists the checkout's association with that prepared attachment.
3. `assertPaymentReady(context, { checkout_id, checkout_url? })` checks the saved browser again before the OTP and before the quote and CVV.
4. `confirmCleanup(context, { checkout_id })` requires independent provider and local cleanup proof.

The prepared attachment belongs to the connector instance that created it. Pass the same object to `commitAttachment`. A serialized copy cannot restore it after a restart.

The SDK requires at least ten minutes of remaining browser lifetime at attachment and at each readiness check. `minimumRemainingMs` can increase this value. It cannot extend the provider expiry.

HTTP integrations without the SDK must implement the same ownership, restriction, readiness, and cleanup behavior.

## Customer final click

Purchases require `performFinalClick(context, request, options)`. Fill-only hosts can omit it. The request contains:

| Fields | Meaning |
| --- | --- |
| `owner`, `browser`, `document_id`, `checkout_url`, `expires_at`, `fence_id` | The persisted owner, browser, document, browser expiry, and restriction. |
| `checkout_id` | The owned checkout. |
| `armed_expires_at` | The click deadline. |
| `submit_selector` | The unique, bound submit control. |

Return `{ dispatched: boolean }`. Your host must:

- Send at most one trusted pointer click on `submit_selector`, in the exact browser, document, and URL, through your own browser connection.
- Finish before `armed_expires_at`.
- Not read DOM or credential values beyond locating the selector.
- Not lift the ordinary automation restriction or retry the click.

Return `{ dispatched: false }` or throw if you did not click. A dispatch result does not show that an order succeeded. Your host never receives `arm_id`.

When the host implements `performFinalClick`, the connector exposes two private operations. The SDK runs them inside the durable owned-checkout lock:

- `prepareFinalClick(context, { checkout_id }, options?)` runs before arming. It checks the fenced document, the drained restriction, the live provider browser, and the recording policy. It returns an opaque, one-use preparation that is valid for at most 60 seconds. Do not serialize or copy it.
- `performFinalClick(context, { checkout_id, preparation, checkout_url, submit_selector, armed_expires_at }, options?)` consumes the preparation on first use, even if a check fails. It checks the owner, checkout, URL, deadline, browser expiry, and cancellation, without another provider network call. Then it calls your host once.

The `accelerate_checkout_submit` tool runs prepare → arm → click → complete, once. See [Purchase mode and checkout support](purchase-mode.md) for the failure rules and the page requirements for a purchase.

## Cleanup

After Accelerate reports closure, verify that the exact provider browser stopped and that the payment credentials were cleared. Keep the restriction for any uncertain attempt. A successful stop request, a missing resource, or a `404` response is not proof of cleanup. Never release a restriction to retry an uncertain fill or purchase.

If the provider reports that the browser stopped or expired, the SDK returns `browser_ended` with next action `stop`. Do not retry that checkout. Create a new browser and a new checkout.

Under `customer_backend_trusted` custody, your backend keeps provider-owner access to the browser. Blocking ordinary agent tools does not revoke that access.

For exact types, see the [SDK interface source](https://github.com/weaccelerateinc/accelerate/blob/agent-sdk-v0.17.0/products/agent-sdk/packages/sdk/browser-connector.d.ts).
