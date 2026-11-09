---
description: Integrate Dana's run-created Browser Use sessions with the published Accelerate SDK.
---

# Reuse a Browser Use run for checkout

**SDK 0.15.2 is published on npm as `latest`.** This private-message copy patch uses the existing managed sandbox service and retains the 0.15.0 protocol. Its npm installation, GitHub release archive, immutable source, sandbox deployment, and public compatibility metadata are verified. No new backend configuration or gateway rollout is required. See the [0.15.2 release record](universal-card-rollout.md#sdk-0152-release) and the preserved [0.15.0 deployment evidence](universal-card-rollout.md#sdk-0150-release).

SDK 0.15.0 retains the run-browser simplification introduced in 0.13.0. Authenticated integrations can use the supported fill-only path without a separate merchant allowlist or an inventory of their other extensions. Migration `004_browser_run_claims.sql`, a matching wallet gateway/reaper, the pinned Accelerate extension, durable ownership, and cleanup remain required. The [0.12.0 rollout record](universal-card-rollout.md#historical-sdk-0120-rollout) describes an earlier disabled merchant flag; it does not describe the current admission contract. Provider and merchant qualification remain pending. Production activation and financial release remain closed.

This flow reuses Dana's run-created shopping browser. The cart, cookies, login, and merchant page stay in that browser. It does not create a payment browser or move a cart. This path is fill-only and does not submit an order.

## Configure the SDK host

Use Dana's existing authenticated session store and browser-control service to implement the host callbacks. Pin the approved Accelerate extension runtime in durable backend configuration. The pin must be the same on every replica. Run mode requires `extensionRuntimeId`; an in-memory pin is not sufficient.

```js
import { createBrowserUseHost } from '@weaccelerateinc/agent-sdk/browser-use-host';

const browserUseHost = createBrowserUseHost({
  apiKey: process.env.BROWSER_USE_API_KEY,
  merchantId: config.accelerateMerchantId,
  extensionId: config.accelerateExtensionId,
  extensionRuntimeId: danaConfig.accelerateExtensionRuntimeId,
  extensionRelease: approvedExtensionRelease,
  host: danaBrowserUseHost,
});
```

`danaBrowserUseHost` implements the platform host methods. It must resolve the authenticated owner and immutable session/run reservation from Dana's backend. It must inspect the actual extension runtime and document, stop ordinary tasks, persist the scheduling fence, and confirm cleanup. Do not accept owner, run, session, browser, or provenance fields from model arguments. Do not return provider task text, run output, viewer links, or unknown provider fields in checkout resource records.

Configure the checkout explicitly for this no-order flow:

```js
const checkoutOptions = {
  profile: 'managed_review_v2',
  purpose: 'sandbox_fill_only',
  enableSubmit: false,
};
```

SDK 0.13.0 and later do not require the three merchant opt-ins from 0.12.0. The deprecated SDK `allowRunCreatedBrowsers` and `additionalExtensions` options are accepted but ignored. The matching managed service ignores `ACCELERATE_MANAGED_RUN_BROWSER_MERCHANT_IDS`; the matching wallet gateway does not require a separate run-browser merchant allowlist. Older deployments and SDK 0.12.0 keep their earlier restrictions until upgraded.

The service still authenticates static and provisioned tenants. The wallet still verifies provider evidence and binds browser ownership to the lease. Install the matching service/gateway/reaper and verify migration 004 before using this path.

Both service and wallet reject run provenance for `purchase`. Only `sandbox_fill_only` is admitted for this path. Existing purchase integrations keep their separate customer-final-click contract.

Key-bearing wallet tenants read Browser Use independently. When Dana retains the provider key, the wallet checks Dana's authenticated resource projection. This remains the `customer_backend_trusted` trust model; it is not an independent provider read.

## Preload the extension before the first run

Dana must upload and verify the approved extension, then add its Browser Use upload ID to the first `runs.create` call in `browserSettings.extensionIds`. Keep recording disabled. Follow-up runs must retain the same extension set. Existing sessions that started without Accelerate's extension cannot be upgraded in place; start a new session before checkout.

Persist the upload ID, runtime ID, version, and artifact checksum in Dana's installation configuration. Download the [approved 0.0.0.1 artifact](https://github.com/weaccelerateinc/accelerate-extension-downloads/releases/tag/extension-v0.0.0.1) and verify it with `verifyApprovedExtensionArtifact` before upload. Use SDK 0.15.2's bundled `approved-extension-releases/0.0.0.1.json` or its verified public [compatibility manifest](https://github.com/weaccelerateinc/accelerate-extension-downloads/releases/download/extension-v0.0.0.1/accelerate-extension-0.0.0.1.sdk-0.15.2.release.json) and [checksums](https://github.com/weaccelerateinc/accelerate-extension-downloads/releases/download/extension-v0.0.0.1/accelerate-extension-0.0.0.1.sdk-0.15.2.SHA256SUMS). The approved extension ZIP bytes are unchanged; its SHA-256 is `65574cbb27ab344687963f72a136f2653551b57458b284e486946b27699099c8`.

Accelerate validates its own extension's installation ID, approved version, and configured runtime ID. SDK 0.14.1 and later accept Browser Use reports with `runtime_id` or `runtimeId`; conflicting aliases and duplicate runtime IDs are rejected. The SDK projects only the configured Accelerate extension. Dana manages other extensions, including 1Password; Accelerate does not inventory them or claim that filled card data is isolated from extensions with page access.

## Reserve and fence the run

Derive provenance from Dana's immutable, authenticated checkout reservation. The SDK host checks the browser, original run, session's latest run, and empty queue. Dana must also commit a durable checkout reservation and scheduling fence before attachment. Reject new tasks, follow-up runs, queued work, browser reuse, and human takeover while the checkout is active or uncertain.

After fencing, document inspection must include this observed backend state:

```js
run_control: {
  checkout_reserved: true,
  session_scheduling_fenced: true,
  live_view_blocked: true,
}
```

These values are evidence from Dana's backend. Do not manufacture them from requested state or authorization checks. The SDK checks that all are `true`; inspection can detect a broken fence, but cannot stop a race with a provider operation.

Dana must prevent direct viewer/CDP URL issuance for payment-capable sessions, or use a verified revocable viewer path and revoke access before attachment. Block existing viewer sessions and human takeover too. Hiding a UI button or asserting `live_view_blocked` does not revoke an already issued provider URL.

## Preserve browser ownership and lifetime

Use the provider's actual `timeoutAt` value for expiry. Idle `keepAlive` settings do not establish the browser deadline. The SDK requires at least ten minutes remaining at attachment; the wallet run-created path requires more than ten minutes at its fresh provider read. Check the real expiry before private verification and refuse a session without enough headroom. Do not create a replacement browser or move the cart to extend the deadline.

At closure, stop the exact original browser and read it again. Retain the reservation and restriction after a timeout, crash, lost acknowledgement, or uncertain fill until cleanup is independently confirmed. In client-key mode, the wallet reaper cannot stop or read the provider browser. Dana's backend must independently stop and inspect it; lease closure alone is not cleanup proof.

Run/session tombstones are hash-only and survive normal encrypted checkout deletion. Apply migration `004_browser_run_claims.sql` before admitting run-browser checkouts. The service role needs `SELECT` and `INSERT` on the claim ledger. Keep the ledger through normal retention and do not grant the runtime role `DELETE` or `TRUNCATE` access.

## Deploy and roll back safely

The wallet's run ownership uses encrypted lease payload v3 and privacy breach v4. Older wallet readers cannot parse those payloads. Keep the matching gateway and reaper deployed until every lease created in the new mode is retired, including uncertain leases. To stop new starts, block checkout creation in your authenticated backend; retired merchant flags do not disable the updated service. Stopping new starts does not remove the cleanup requirement for existing leases.

Keep migration 004's hash-only claim ledger through checkout purge and rollback. Do not drop or truncate consumed claims. An old SDK cannot recover or safely resume an active provenance attempt. Keep Dana's copied runtime configuration explicitly fill-only during rollback; do not switch an active run-created attempt to a legacy SDK path.

The SDK source also requires the actual provider expiry and has bounded create/fill HTTP waits. Those timeout caps are maximum waits, not reserved execution time. Budget private verification, fill, review delivery, and cleanup within the original browser lifetime.

When upgrading from SDK 0.14.1 or earlier to 0.15.2, coordinate every private ingress/host worker that shares persistence before enabling [wallet-phone correction](agentic-platforms.md#correct-a-wallet-phone-privately). Older workers cannot read the new typed phone-prompt outbox item, even after delivery. Keep the authenticated chat identity and original browser ownership binding unchanged when a customer corrects the wallet number.

SDK 0.15.2 changes only OTP, card-selection, and after-fill security-code wording. It adds policy links and US `+1` guidance without changing phone validation, ownership, reply parsing, the private protocol, or stored data. Install it in the private SDK workers to use the new prompts; the 0.15.0 managed-service protocol remains compatible, and the current release-source sandbox deployment is recorded in the [release record](universal-card-rollout.md#sdk-0152-release). See [the exact private prompt text](whatsapp-private-messaging.md#private-prompts-in-sdk-0152).

## Qualification and scope

Use the released SDK with the matching wallet gateway/reaper and service, and verify the existing claim-ledger migration. Qualify the actual Browser Use project and merchant form. Verify cart continuity, original expiry, extension bytes and installed IDs, scheduler/viewer fencing, private masked review, one fill, and independent cleanup. Test crashes, duplicate and late webhooks, queued follow-up work, viewer access, failed creation, and already stopped browsers. Do not submit an order.

The prior published purchase rules and qualification status remain in force. SDK publication and sandbox service health do not activate a tenant, enable financial release, qualify production, qualify a co-extension, or qualify a merchant. Dana's supplied repository audit and required file changes are recorded in the preserved [SDK 0.15.0 baseline integration contract](https://github.com/weaccelerateinc/accelerate/blob/agent-sdk-v0.15.0/products/agent-sdk/docs/dana-integration.md).

## Compatibility with other providers

| Integration | SDK 0.15.2 behavior |
| --- | --- |
| Browser Use standalone metadata browsers | Existing ownership, metadata, and configured Accelerate extension checks remain. |
| Browser Use run-created browsers | Authenticated fill-only integration. Requires Dana's durable owner, scheduler and viewer controls, pinned Accelerate runtime, and claim ledger. |
| Registered browser connectors | Existing provider contract remains. Browser Use run provenance is not accepted on generic bindings. |
| Managed Kernel browsers | Existing managed custody and purpose rules remain. Run-browser support adds no Kernel purchase capability. |
| Linq private messaging | Existing adapter and receipt contract remain. WhatsApp is a separate opt-in adapter. |
| Agent models and workflow engines | No model vendor is selected by this change. Hosts must preserve the same ownership, idempotency and private-ingress contract. See [Eve guidance](whatsapp-private-messaging.md#eve-workflow-integration). |

These statements describe source and contract compatibility. They do not qualify an untested browser provider, model integration, or workflow deployment. Keep the original runtime and extension configuration available until active or uncertain leases close; changing the pins can block cleanup proof even after the browser stops.
