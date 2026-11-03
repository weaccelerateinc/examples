---
description: Connect your platform's authenticated browser ownership and automation controls to the Accelerate SDK.
---

# Browser connector interface

The SDK browser connector attaches the browser your platform already uses for shopping. Your backend implements `BrowserConnectorHost` to resolve ownership, check readiness, pause ordinary automation, and confirm cleanup. It keeps the cart, cookies, login, and payment document in the same browser session.

The customer's agent performs the final payment click through its own browser connection. `BrowserConnectorHost.performFinalClick` is that agent's trusted browser-host callback. Accelerate fills the payment fields; its executor and extension do not send the click. Private verification, delivered review, fresh approval, and the exact document restriction remain required.

This is the client-side backend interface. Accelerate separately registers the [provider connector](provider-connector-contract.md) in its private executor and cleanup service. Both layers must be configured for the same Merchant ID and connector ID.

The six baseline host methods below apply to the published integration. **SDK 0.11.0** adds a customer final-click callback for purchases and is published on npm. An existing host must implement that callback before migrating; an SDK package upgrade does not add it to application code. Sandbox and production infrastructure are deployed, while production onboarding and qualification remain pending; see [Universal checkout rollout](universal-card-rollout.md).

SDK 0.12.0 adds opt-in run-created Browser Use provenance and run-control evidence. The current sandbox has not enabled run-browser merchant admission; see [Browser Use run browser integration](browser-use-run-browsers.md).

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

## Customer final click in SDK 0.11.0

Purchases using 0.11.0 require `BrowserConnectorHost.performFinalClick(context, request, options)`. Fill-only hosts can omit it. The frozen host request contains the flattened `FencedBrowserDocument` fields and exact click target:

| Fields | Meaning |
| --- | --- |
| `owner`, `browser`, `document_id`, `checkout_url`, `expires_at`, `fence_id` | The exact persisted owner, browser, document, original browser expiry, and automation restriction. |
| `checkout_id` | The owned checkout for this action. |
| `armed_expires_at` | The short click deadline, returned through the private backend API. |
| `submit_selector` | The unique bound submit target, supplied by that private arm. |

The host returns `{ dispatched: boolean }`. It sends at most one trusted pointer click through the platform's own browser connection, in the exact browser, document, and URL. It must not read back DOM or credential values, lift the ordinary automation restriction, or retry. A dispatch result is not evidence that an order succeeded. The host never receives `arm_id`; the SDK orchestrator retains that opaque completion token.

If the host supplies `performFinalClick`, both existing-browser connector adapters expose two private operations. Run them inside the same durable owned-checkout lock:

```js
const preparation = await browserConnector.prepareFinalClick(
  context, { checkout_id }, requestOptions,
);

// The SDK orchestrator arms the checkout and retains arm_id privately.
// Its host call receives only the target, deadline, and preparation:
const result = await browserConnector.performFinalClick(context, {
  checkout_id,
  preparation,
  checkout_url: privateArm.target.checkout_url,
  submit_selector: privateArm.target.submit_selector,
  armed_expires_at: privateArm.armed_expires_at,
}, requestOptions);
```

These are the connector method shapes, not a replacement for the complete submit handler. The application supplies the authenticated `context`, owned `checkout_id`, connector, and request options. `privateArm` is the SDK orchestrator's private arm response. The partner SDK also performs completion and handles failures as described below. Keep the preparation, target, arm, and host result outside model inputs, outputs, history, and ordinary logs.

`prepareFinalClick(context, { checkout_id }, options?)` resolves the persisted fenced document and checks the drained restriction, live provider resource, recording policy, and approved extension runtime. It runs before arming and does not apply the attachment's ten-minute headroom requirement. It returns an opaque, frozen `PreparedFinalClick` with no public fields. The preparation belongs to that connector instance, owner, and checkout; it is valid for at most 60 seconds. Do not serialize, reconstruct, or clone it.

`performFinalClick(context, { checkout_id, preparation, checkout_url, submit_selector, armed_expires_at }, options?)` consumes that preparation on its first use, including a failed check. It checks the same owner/checkout, exact prepared URL, deadline, browser expiry, and cancellation. It does not resolve ownership again or perform a provider/extension network read inside the click window. It calls the host once, without the opaque completion token. The gateway's window is at most 10 seconds; the host must finish before the returned deadline.

The initial purchase flow admits only one top-level document with no iframes or shadow roots. Card/address fields, the simple USD-labelled total, and the unique submit target must belong to that document. These restrictions do not describe all layouts supported for separate fill-only review.

The initial release also rejects active or registered origin service workers. CDP service-worker bypass is an additional browser control. Non-main-frame and worker requests are blocked; a new page is closed and yields `outcome_unknown`. This is not a provider firewall or WebRTC protection.

Programmatic merchant `form.submit()` and `requestSubmit()` flows are unsupported. The gate rechecks the submit target's identity and security properties, bound card/address fields, submit-form control inventory, exact total text, and URL. Unrelated banner/countdown text and hover/focus class changes are permitted. Its browser-clock probe requires a round trip of at most 500 ms and skew of at most 250 ms. A rejected or interrupted action is not permission to retry.

`accelerate_checkout_submit` keeps model inputs `{ checkout_id, revision }`. Purchase registration requires both connector methods. Its handler performs readiness preflight → arm → host click → complete, once. A preparation failure leaves nothing armed. An ambiguous arm failure never invokes the host and becomes `outcome_unknown`. After a successful arm, even a host error leads to one completion call. Neither host nor completion failure authorizes another click. See [Purchase mode](purchase-mode.md).

The click deadline is capped by the original approval; arming does not release payment egress. Only admission of the authorized click enables the restricted request policy. Keep the persisted restriction after the click window closes. Later private outcome observation does not extend click authority, and early cancellation can return `final_click_in_progress`. An arm, host dispatch acknowledgement, or unknown outcome does not attest a customer click; only terminal `submit_attempted` carries `submit_actor: 'customer'`.

## Attachment and readiness sequence

The baseline connector exposes four lifecycle methods:

1. `prepareAttachment(context, { attempt_key, checkout_url })` resolves and inspects the browser, drains and fences ordinary automation, then checks readiness again.
2. `commitAttachment(context, { checkout_id, attachment })` persists the created checkout's association with that exact prepared attachment.
3. `assertPaymentReady(context, { checkout_id, checkout_url? })` rechecks the saved browser before private OTP and quote/CVV dispatch.
4. `confirmCleanup(context, { checkout_id })` requires independent provider and local cleanup evidence.

The prepared attachment is private and belongs to the connector instance that created it. Pass the same object into `commitAttachment`. A serialized or reconstructed copy cannot restore it after a restart. Lost acknowledgements require reconciliation while retaining the original restriction.

The SDK requires at least ten minutes of actual remaining browser lifetime during attachment and later readiness checks. `minimumRemainingMs` can increase that requirement. It cannot extend the provider expiry or shorten the customer's approval window.

The partner SDK composes these calls with checkout creation and private messaging. Direct HTTP clients must implement the same ownership, restriction, readiness, and cleanup behavior in their backend.

SDK 0.11.0 adds the two private final-click operations above. They do not release the ordinary browser restriction. Only the platform backend's exact authorized click can run while the document contains payment values.

## Cleanup and scope

After Accelerate reports closure, verify that the exact owned provider browser stopped and payment credentials were cleared. Retain the uncertainty fence. A successful stop request, missing resource, or `404` is not proof of cleanup. Never release a restriction merely to retry an uncertain fill or purchase.

When a Browser Use client keeps its provider key through the `MCP_CLIENT_BROWSER_EXTENSION_JSON` path, Accelerate's reaper can acknowledge and close the lease but cannot stop or read the provider browser after worker loss. A closed lease is not proof that the browser stopped. The customer's trusted host must independently stop and read back that exact browser, retaining the restriction until provider-stop proof or confirmed provider expiry. Registered operator provider connectors supply a separate reaper read/stop capability. Neither cleanup path resolves payment uncertainty by itself.

Browser provider support, extension approval, merchant checkout support, review delivery, and purchase submission require separate qualification. Your backend retains provider-owner access under `customer_backend_trusted`; restricting ordinary agent tools does not revoke that access.

For exact types, see the [SDK interface source](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/packages/sdk/browser-connector.d.ts). Return to [Agentic platforms](agentic-platforms.md) for the full integration flow.
