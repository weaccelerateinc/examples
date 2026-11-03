---
description: Define how Accelerate's private executor connects to and retires your existing browser provider resources.
---

# Provider connector contract

The provider connector lets Accelerate's private executor attach the existing browser your platform owns. It reads the provider's current resource, connects to that exact browser, and stops it during cleanup. It does not create a new browser, context, page, or shopping cart.

Your platform implements the separate [SDK browser host](browser-connector-interface.md). Accelerate registers the private provider implementation for your Merchant ID and connector ID in both the gateway and independent cleanup service. Coordinate this registration during onboarding.

For **source candidate 0.11.0**, purchases also require the platform's SDK host to perform the final physical click through its own connection. The SDK connector checks live readiness before arming and consumes a private one-use preparation for the click, without another provider read inside the short window. The host receives the exact document, target, and deadline, but no completion token. The provider connector continues to support Accelerate's admission, private fill/review, and cleanup. It does not add an Accelerate executor click. The candidate is not published or deployed; see [Purchase mode](purchase-mode.md).

The current executor requires a qualified Playwright-compatible Chromium/CDP browser with the approved Manifest V3 extension. An SDK adapter alone does not establish provider or merchant support.

## Provider implementation

The registered definition has these fields and callbacks:

| Field | Contract |
| --- | --- |
| `merchant_id` | Provisioned merchant UUID. |
| `connector_id` | Lowercase letter followed by up to 63 lowercase letters, digits, `_`, or `-`. |
| `extension_id` | Provider installation/package reference for the approved extension. |
| `extension_sha256` | Exact approved ZIP SHA-256, as 64 lowercase hexadecimal characters. |
| `extension_version` | Exact installed manifest version. |
| `provider_origins` | Optional list of up to eight exact HTTPS origins for supported hosted payment frames. No wildcards. |
| `readBrowser(id, options)` | Return fresh normalized observations of this existing resource. Do not create or navigate. |
| `stopBrowser(id, options)` | Request an idempotent stop of the exact resource. Its return value alone does not prove cleanup. |
| `connectBrowser(resource, options)` | Return a compatible browser-control connection to that same resource. Do not create a replacement browser, context, or page. |

Callbacks receive an `AbortSignal` and timeout and must honor both. Keep private connection credentials within the reviewed provider implementation. The agent and HTTP caller cannot select a provider endpoint, module path, executable code, or secret.

## Resource observations

`readBrowser` must normalize the provider resource into these fields:

| Field | Observation |
| --- | --- |
| `id` | Exact requested provider browser ID. |
| `status` | Authoritative `active` or `stopped` status. |
| `startedAt` / `timeoutAt` | Actual ISO timestamps, required for attachment. |
| `recordingAvailable` | Must be `false`. No recording URL may be present. |
| `metadata` | Verified merchant, connector, owner, workspace, custody, extension checksum, and extension version bindings below. |
| `extensions` | One approved installation with `id`, `version`, and the actual Chrome `runtimeId`. |

The required metadata keys are:

```text
accelerate_merchant_id
accelerate_connector_id
accelerate_owner_user_id
accelerate_workspace_id
accelerate_custody_mode
accelerate_extension_sha256
accelerate_extension_version
```

The custody value is `customer_backend_trusted`. Bind metadata to real provider observations and authenticated ownership/installation records. Do not manufacture evidence from caller-supplied claims. The provider installation ID and Chrome's 32-character extension runtime ID are separate identifiers.

The current adapter requires one browser context, one payment page, and one approved extension. Attachment checks the live extension worker, initialized engine, disabled autosave, bounded retention, and the same existing document. Preserve enough actual browser lifetime for verification, review, and cleanup. See the [extension contract](extension-contract.md).

Private provider fields needed to establish the connection may accompany this resource inside the executor. Do not return that full resource through the SDK host projection or model tools.

## Accelerate-side registration

Accelerate deploys a reviewed module exporting `createCustomerBrowserConnectors({ env })`. It returns the merchant-scoped definitions above. The operator-owned `MCP_CUSTOMER_BROWSER_CONNECTORS_MODULE` setting selects that module in both the gateway and the independent reaper.

The module and its dependencies must be available in both deployments. Initialization must not create or connect to browsers or perform payments. The reaper uses the same definition to read and stop resources without opening a browser-control connection.

This is Accelerate's executor configuration. A client does not enable it by setting a module path in its agent application or inventing a `connector_id` in an API request.

## Backend checkout binding

After registration, your authenticated backend supplies this binding when it creates the checkout:

```json
{
  "provider": "connector",
  "connector_id": "your_platform_browser",
  "browser_id": "owned_browser_42",
  "custody_mode": "customer_backend_trusted"
}
```

The managed service asks the private executor to attach that resource. The executor selects the registered merchant/connector definition and checks ownership, extension, exact document, purpose, and cleanup capability. A mismatched binding fails; it does not trigger a new browser or a cart transfer.

Candidate purchases declare `final_click_actor: 'customer'`. Before OTP, the service internally requires `customer_final_click_supported: true` from the gateway's private admission. The candidate requires one top-level document with no iframes or shadow roots, containing its card and address controls. Quote inspection requires an explicit USD-labelled simple total. Unique exact total and submit selectors are checked before credential fill. Do not infer purchase support from existing iframe or shadow-root fills. The customer host's one click remains subject to the gateway's at-most-10-second window, exact target, and merchant/provider network policy; general browser access stays restricted.

Initial admission rejects active or registered origin service workers. The gateway requests CDP service-worker bypass as an additional control and blocks non-main-frame and worker requests. It closes new pages and reports `outcome_unknown`. These are browser/application controls; they do not establish a provider firewall or WebRTC protection.

The initial gate excludes merchant `form.submit()` and `requestSubmit()` flows. It checks submit-target identity and security properties, bound card/address native values and metadata, submit-form control inventory, exact total text, and URL. Unrelated banners, countdowns, and hover/focus class changes are permitted. The browser-clock probe requires a round trip of at most 500 ms and skew of at most 250 ms.

The click deadline cannot exceed the original approval. Approved-origin network policy applies only after click admission; arming does not allow automatic payment requests before that admission. Outcome observation can outlast the click window or caller connection, but it cannot extend click authority. Do not stop the browser merely because the request disconnected.

## Independent cleanup

Cleanup requires two steps: request stop, then independently read back the exact owned resource as `stopped`. A successful callback, raw `404`, missing resource, changed owner, or provider error is insufficient. If the provider cannot give trustworthy stopped-resource evidence, it is not ready for this contract.

The gateway bounds read/stop callbacks at eight seconds and connect at ten seconds. The independent reaper bounds read/stop at three seconds and does not connect. Failed or uncertain cleanup remains pending for reconciliation. Cleanup does not release an uncertain-payment fence or retry payment.

Keep the connector definition and stop/read capability available while it has active leases. Qualify the extension runtime, document preservation, recording controls, lifetime, durable automation restriction, independent cleanup, and supported checkout layouts before use. Native customer review and purchase submission have their own acceptance requirements.

Universal sandbox fills have already run on additional merchant documents; that evidence is separate from a new provider's acceptance or candidate customer-click purchases. See [Universal checkout rollout](universal-card-rollout.md) for current gates, dated deployment evidence, and the coordinated gateway/reaper rollout.

For the operator implementation specification, see the [provider connector source reference](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/customer-browser-connectors.md). See [Private CVV and credential delivery](agentic-platforms-private-payments.md) for the payment data path.
