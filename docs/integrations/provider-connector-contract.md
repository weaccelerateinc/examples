---
description: How Accelerate's private executor connects to, and retires, a browser from a provider other than Browser Use.
---

# Provider connector contract

Use this contract when your browser provider is not Browser Use. The provider connector lets Accelerate's private executor attach to the browser that your platform owns. It reads the provider's current resource, connects to that exact browser, and stops it during cleanup. It never creates a browser, context, page, or cart.

There are two parts:

- **Your side:** the [SDK browser host](browser-connector-interface.md), in your backend.
- **Accelerate's side:** a provider connector that Accelerate registers for your Merchant ID and connector ID, in both its private executor and its independent cleanup service.

Coordinate the provider connector with Accelerate during onboarding. You cannot enable it by setting a module path in your application or by inventing a `connector_id`.

The executor requires a Chromium browser that it can control through CDP (Playwright-compatible). Nothing is installed in the browser. The executor types card values with trusted browser keystrokes. It never clicks submit. For a purchase, your browser host sends the final click.

## Provider definition

Accelerate registers a definition with these fields and callbacks:

| Field | Contract |
| --- | --- |
| `merchant_id` | Your Merchant ID. |
| `connector_id` | A lowercase letter followed by up to 63 lowercase letters, digits, `_`, or `-`. |
| `provider_origins` | Optional. Up to eight exact HTTPS origins for hosted payment frames. No wildcards. |
| `readBrowser(id, options)` | Return a fresh observation of the existing resource. Do not create or navigate. |
| `stopBrowser(id, options)` | Request an idempotent stop of the exact resource. The return value alone does not prove cleanup. |
| `connectBrowser(resource, options)` | Return a browser-control connection to that same resource. Do not create a browser, context, or page. |

Callbacks receive an `AbortSignal` and a timeout and must honor both. Connection credentials stay inside the provider implementation. The agent and HTTP callers cannot select a provider endpoint, module, code, or secret.

## Resource observations

`readBrowser` returns these fields:

| Field | Observation |
| --- | --- |
| `id` | The exact requested provider browser ID. |
| `status` | `active` or `stopped`, from the provider. |
| `startedAt` / `timeoutAt` | Actual ISO timestamps. Required for attachment. |
| `recordingAvailable` | Must be `false`. No recording URL can be present. |
| `metadata` | The ownership bindings below. |

Required metadata keys:

```text
accelerate_merchant_id
accelerate_connector_id
accelerate_owner_user_id
accelerate_workspace_id
accelerate_custody_mode
```

The custody value is `customer_backend_trusted`. Set the metadata from your authenticated ownership records when you create the browser.

The executor requires one browser context and one payment page. Keep enough browser lifetime for verification, review, and cleanup.

## Checkout binding

Your backend sends this binding when it creates the checkout:

```json
{
  "provider": "connector",
  "connector_id": "your_platform_browser",
  "browser_id": "owned_browser_42",
  "custody_mode": "customer_backend_trusted"
}
```

The executor selects the registered definition for your Merchant ID and connector ID. It checks ownership, the exact document, the purpose, and cleanup capability. A mismatched binding fails. It never triggers a new browser or a cart transfer.

## During the fill

The executor:

- Finds card controls only in the admitted checkout document and in permitted payment-provider frames. If it finds two controls for the same value, it types nothing and returns `checkout_unsupported` with reason `card_form_ambiguous`.
- Reads each value back in the page. If a value does not read back, it empties the card fields and stops. Card values are never logged, returned to the agent, or put in an error.
- Sets an in-page timer that clears the card fields at a deadline, even if the connection drops.
- Empties every card control during cleanup and confirms that they are empty.
- Never presses Enter and never clicks submit.

For a purchase, the page must also meet the [purchase requirements](purchase-mode.md#purchase-support).

## Independent cleanup

Cleanup has two steps: request stop, then read the exact resource back as `stopped`. A successful callback, a `404`, a missing resource, a changed owner, or a provider error is not enough. If your provider cannot give trustworthy proof of a stopped resource, it cannot use this contract.

The executor limits read and stop calls to eight seconds and connect calls to ten seconds. The independent cleanup service limits read and stop calls to three seconds and never connects. Failed or uncertain cleanup stays pending for reconciliation. Cleanup does not release an uncertain payment or retry a payment.

## Qualification

Accelerate qualifies each new provider before use. Qualification covers the card fill, document preservation, recording controls, lifetime, the durable automation restriction, independent cleanup, and your checkout layouts. The review and the purchase click have their own acceptance tests. Implementing the interface alone does not qualify a provider.

See [Private CVV and credential delivery](agentic-platforms-private-payments.md) for the payment data path.
