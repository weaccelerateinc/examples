---
description: Attach a Browser Use browser, including a browser created by an agent run, to the Accelerate checkout.
---

# Browser Use integration

Browser Use has a packaged adapter in the SDK. No provider connector is necessary, and your Browser Use API key stays with your backend. The cart, cookies, login, and merchant page stay in your browser. Accelerate attaches to that browser at payment and types the card values with trusted browser keystrokes. Nothing is installed in the browser.

## Create the browser

Create the browser with your own key. Turn recording off and resizing on. Set the ownership metadata:

```js
await browserUse.create({
  timeout: 15,
  enableRecording: false,
  allowResizing: true,
  metadata: {
    accelerate_merchant_id: merchantId,
    accelerate_owner_user_id: trusted.customerId,
    accelerate_workspace_id: trusted.workspaceId,
    accelerate_custody_mode: 'customer_backend_trusted',
  },
});
```

`accelerate_owner_user_id` and `accelerate_workspace_id` must equal the `customer_id` and `workspace_id` of the checkout. Take them from your authenticated records.

## Configure the SDK host

```js
import { createBrowserUseHost } from '@weaccelerateinc/agent-sdk/browser-use-host';
import { createBrowserUseConnector } from '@weaccelerateinc/agent-sdk/browser-connector';

const browserConnector = createBrowserUseConnector({
  host: createBrowserUseHost({
    apiKey: process.env.BROWSER_USE_API_KEY,
    merchantId: config.accelerateMerchantId,
    host: platformBrowserUseHost,
  }),
});
```

Pass `browserConnector` to `registerPartnerCheckoutTools`. See [Connect your backend](agentic-platforms.md#5-connect-your-backend).

`createBrowserUseHost` reads the Browser Use v4 API with your key. It checks ownership metadata, recording, and the actual browser lifetime. Before each checkout, it reads the browser and sends the result to Accelerate as `browser_resource`. It never creates, navigates, or replaces a browser.

Your `platformBrowserUseHost` implements these methods with your existing session store and browser control:

| Method | Your platform supplies |
| --- | --- |
| `resolveOwnedBrowser` | The authenticated owner, browser binding, document ID, and checkout URL from your records. The SDK reads the actual expiry from Browser Use. |
| `inspectDocument(context, document, options)` | The current document ID, checkout URL, and `automation` state, through your existing server browser control. Do not create or navigate a page. |
| `drainAndFence` | A durable block on new ordinary browser actions, after in-flight actions finish. |
| `bindCheckout` | A durable record of the checkout, attempt, browser, document, and restriction. |
| `resolveCheckoutBrowser` | The same record, for later payment checks. |
| `confirmLocalCleanup` | Proof that the page credentials were cleared. Return `{ credentials_cleared: true, fence_retained: true }`. |
| `performFinalClick` | Purchases only: one trusted click on the bound submit control. See [Customer final click](browser-connector-interface.md#customer-final-click). |

Keep the host configuration in durable backend storage. It must be the same on every replica. Do not take owner, run, session, or browser fields from model arguments. Do not return provider task text, run output, viewer links, or unknown provider fields.

`createBrowserUseConnector` exposes the purchase operations only when your host implements `performFinalClick`. Without it, register fill-only checkouts only.

## HTTP integrations

Without the SDK, read `GET https://api.browser-use.com/api/v4/browsers/{id}` with your own key just before you create the checkout. Send the `id`, `status`, `cdpUrl`, `startedAt`, `timeoutAt`, `recordingAvailable`, and `metadata` fields as `browser_resource`, with `browser.provider: "browser_use"`. See [Create a checkout](agentic-platforms.md#create-a-checkout).

The service forwards `browser_resource` to the private executor once and does not store it. `id` must equal `browser_id`. Only `*.cdp.browser-use.com` connections are accepted. Treat `cdpUrl` as a secret. Keep it out of logs and away from the model.

## How Accelerate fills the card

- Accelerate's private executor attaches to the browser session and types each card value into the payment fields.
- It finds card controls only in the admitted checkout document and in permitted payment-provider frames. If it finds two controls for the same value, it types nothing and returns `checkout_unsupported` with reason `card_form_ambiguous`.
- It reads each value back in the page. If a value does not read back, it empties the card fields and stops. Card values are never logged, returned to the agent, or put in an error.
- An in-page timer clears the card fields at a deadline, even if the connection drops. Cleanup empties every card control and confirms that they are empty.
- The executor never presses Enter and never clicks submit.

Other software in the browser, such as a password manager, can have page access. Accelerate does not inventory it.

## Browser lifetime and cleanup

Accelerate uses the actual Browser Use `timeoutAt` value as the browser expiry. Idle keep-alive settings do not extend it. The SDK requires at least ten minutes of remaining lifetime at attachment. Do not create a replacement browser or move the cart to extend the deadline.

If Browser Use reports that the browser stopped or expired, the SDK returns `browser_ended` with next action `stop`. Do not retry that checkout. Create a new browser and a new checkout.

Because your backend keeps the Browser Use key, Accelerate's cleanup service cannot stop or read your browser after a worker failure. It can only close its own lease. Your backend must stop the exact browser and read it back as stopped. Keep the restriction until you have that proof or the provider expiry has passed. A closed lease is not proof that the browser stopped.

## Reuse the browser of an agent run

Your agent can shop in a browser that a Browser Use agent run created. Accelerate attaches to that same browser. No merchant allowlist is required. These checkouts can be fill-only, or purchases with the customer's final click.

A run-created browser needs more controls, because Browser Use can schedule more work in the same session:

1. **Reserve the session.** Before attachment, commit a durable checkout reservation and a scheduling fence. While the checkout is active or uncertain, reject new tasks, follow-up runs, queued work, browser reuse, and human takeover.
2. **Block live view.** Do not issue viewer or CDP URLs for payment-capable sessions. Or use a revocable viewer and revoke it before attachment. Hiding a UI button does not revoke a URL that was already issued.
3. **Report run control.** After fencing, `inspectDocument` must include the state that your backend observes:

   ```js
   run_control: {
     checkout_reserved: true,
     session_scheduling_fenced: true,
     live_view_blocked: true,
   }
   ```

   The SDK checks that all three values are `true`. It also checks the original run, the session's latest run, and an empty queue. Report what you observe. Do not build these values from requested state.

Derive the run and session from your authenticated checkout reservation. Never take them from model arguments.

Accelerate records each claimed run and session as a hash, so the same run cannot be claimed twice. These records are kept after normal checkout deletion.

Before you use run-created browsers, test crashes, duplicate and late webhooks, queued follow-up work, viewer access, failed creation, and browsers that already stopped. Start with `sandbox_fill_only`. A purchase places a real order.

## Durable workflow engines

If your agent runs inside a durable workflow engine, follow these rules:

- Put each payment effect behind the durable SDK host. Before you start a checkout, persist one mapping from the workflow call to the checkout attempt. A retried or repeated call must not create a new checkout.
- Keep OTP, CVV, full wallet numbers, raw webhooks, review images, `browser_resource`, and `cdpUrl` out of workflow inputs, outputs, and history. Intercept private replies before the workflow receives messages.
- Keep attachment preparation, checkout creation, and attachment commit in one step. Their in-memory objects cannot cross a durable wait.
- After a durable wait, check ownership, browser readiness, and expiry again.
- Workflow cancellation does not retire the browser. Keep independent cleanup and the restrictions.
