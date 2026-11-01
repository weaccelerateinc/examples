---
description: Connect your platform's authenticated browser ownership and automation controls to the Accelerate SDK.
---

# Browser connector interface

The SDK browser connector attaches the browser your platform already uses for shopping. Your backend implements `BrowserConnectorHost` to resolve ownership, check readiness, pause ordinary automation, and confirm cleanup. It keeps the cart, cookies, login, and payment document in the same browser session.

This is the client-side backend interface. Accelerate separately registers the [provider connector](provider-connector-contract.md) in its private executor and cleanup service. Both layers must be configured for the same Merchant ID and connector ID.

## Create the connector

```js
import { createExistingBrowserConnector } from '@weaccelerateinc/agent-sdk/browser-connector';

const browserConnector = createExistingBrowserConnector({
  connectorId: platformConfig.accelerateConnectorId,
  extensionRelease: approvedExtensionRelease,
  host: platformBrowserHost,
  minimumRemainingMs: 600000,
});
```

Your application supplies `platformConfig`, the approved release manifest, and the host implementation. Use the connector ID provisioned by Accelerate. The manifest must qualify `provider: 'connector'` and your intended checkout use. The packaged Browser Use baseline manifest does not qualify a generic connector. See the [extension contract](extension-contract.md).

Pass the resulting `browserConnector` into your partner SDK integration. The connector does not create browsers, upload extensions, register a provider, or move a cart. Browser Use has a separate optional `createBrowserUseConnector` adapter for platforms already using that provider.

## Authenticated host records

Every host call receives the verified checkout context. Resolve it from your authenticated application session and durable ownership records. Model arguments must not supply customer identity, a provider connection, or ownership claims.

`OwnedBrowserDocument` contains exactly these fields:

| Field | Required value |
| --- | --- |
| `owner` | Verified `customer_id`, `workspace_id`, `conversation_id`, and E.164 `phone_number`. |
| `browser` | The registered browser binding shown below. |
| `document_id` | Stable identifier for the actual checkout document. |
| `checkout_url` | Exact current HTTPS checkout URL, preserving query and fragment. |
| `expires_at` | The browser's original UTC expiry as an ISO timestamp. |

The registered browser binding is:

```json
{
  "provider": "connector",
  "connector_id": "your_platform_browser",
  "browser_id": "owned_browser_42",
  "custody_mode": "customer_backend_trusted"
}
```

Replace these example IDs with the provisioned connector and the browser owned by the authenticated customer/workspace. SDK host records use strict field sets. Return the required projection rather than the full provider response. Keep connection URLs, provider keys, and unrelated metadata outside these records and model results.

## Implement the six host methods

| Method | Inputs after `context` | Required result and behavior |
| --- | --- | --- |
| `resolveOwnedBrowser` | `{ attempt_key, checkout_url }`, request options | Return `OwnedBrowserDocument` from real ownership records. Resolve the existing browser and exact document. |
| `inspectBrowser` | Owned browser document, request options | Return the same document fields plus `recording_disabled: true`, the observed extension runtime, and current `automation` state. |
| `drainAndFence` | Owned browser document, `{ attempt_key }`, request options | Persist the restriction, reject new ordinary automation, wait for in-flight work, then return `{ fence_id, ordinary_operations_drained: true, agent_access_fenced: true }`. |
| `bindCheckout` | Fenced document plus `checkout_id` and `attempt_key`, request options | Persist the exact checkout/attempt/browser/document/fence association. Return no value. A lost acknowledgement must leave the restriction in place. |
| `resolveCheckoutBrowser` | `{ checkout_id }`, request options | Return that same persisted `FencedBrowserDocument`, including its `fence_id`. |
| `confirmCleanup` | Fenced document, `{ checkout_id }`, request options | Independently confirm cleanup, then return `{ provider_browser_stopped: true, credentials_cleared: true, fence_retained: true }`. |

`inspectBrowser` returns `automation: { ordinary_operations_drained, agent_access_fenced, fence_id }`. Before fencing, these observations may show that automation is still active. After fencing, both flags must be true and the fence ID must match. Its `extension` field contains actual runtime observations validated against the approved artifact and installation record.

Every inspection must preserve the same owner, browser binding, document ID, URL, and expiry. Do not construct readiness evidence by copying requested values into a response. A process-local mutex or instruction to the model does not enforce a durable restriction across workers.

## Attachment and readiness sequence

The SDK connector exposes four lifecycle methods:

1. `prepareAttachment(context, { attempt_key, checkout_url })` resolves and inspects the browser, drains and fences ordinary automation, then checks readiness again.
2. `commitAttachment(context, { checkout_id, attachment })` persists the created checkout's association with that exact prepared attachment.
3. `assertPaymentReady(context, { checkout_id, checkout_url? })` rechecks the saved browser before private OTP and quote/CVV dispatch.
4. `confirmCleanup(context, { checkout_id })` requires independent provider and local cleanup evidence.

The prepared attachment is private and belongs to the connector instance that created it. Pass the same object into `commitAttachment`. A serialized or reconstructed copy cannot restore it after a restart. Lost acknowledgements require reconciliation while retaining the original restriction.

The SDK requires at least ten minutes of actual remaining browser lifetime during attachment and later readiness checks. `minimumRemainingMs` can increase that requirement. It cannot extend the provider expiry or shorten the customer's approval window.

The partner SDK composes these calls with checkout creation and private messaging. Direct HTTP clients must implement the same ownership, restriction, readiness, and cleanup behavior in their backend.

## Cleanup and scope

After Accelerate reports closure, verify that the exact owned provider browser stopped and payment credentials were cleared. Retain the uncertainty fence. A successful stop request, missing resource, or `404` is not proof of cleanup. Never release a restriction merely to retry an uncertain fill or purchase.

Browser provider support, extension approval, merchant checkout support, review delivery, and purchase submission require separate qualification. Your backend retains provider-owner access under `customer_backend_trusted`; restricting ordinary agent tools does not revoke that access.

For exact types, see the [SDK interface source](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/packages/sdk/browser-connector.d.ts). Return to [Agentic platforms](agentic-platforms.md) for the full integration flow.
