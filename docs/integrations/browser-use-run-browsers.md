---
description: Preview integration notes for Dana's run-created Browser Use sessions.
---

# Reuse a Browser Use run for checkout

**Unreleased preview.** This guide describes source changes in the [SDK draft PR #482](https://github.com/weaccelerateinc/accelerate/pull/482) and [wallet draft PR #21](https://github.com/weaccelerateinc/accelerate-wallet-mcp/pull/21). They are not published in npm `0.11.0` or any other released package. Use them only with the matching tested SDK archive after its release is available. Do not copy these new fields into an integration that uses the published package.

This flow reuses Dana's run-created shopping browser. The cart, cookies, login, and merchant page stay in that browser. It does not create a payment browser or move a cart. The preview is fill-only and does not submit an order.

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
  allowRunCreatedBrowsers: true,
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

Run-created browser support has three separate merchant opt-ins. Each must remain disabled by default. Enable only the sandbox merchant after the paired changes and Dana's controls are ready:

1. SDK host: `allowRunCreatedBrowsers: true`.
2. Managed service: include the merchant UUID in `ACCELERATE_MANAGED_RUN_BROWSER_MERCHANT_IDS` (a JSON array).
3. Wallet executor: set `allow_run_created_browsers: true` in the merchant's `MCP_BROWSER_USE_TENANTS_JSON` entry for key-bearing mode. For client-key mode, list the merchant UUID in `run_browser_merchant_ids` inside `MCP_CLIENT_BROWSER_EXTENSION_JSON`.

The service checks both static and provisioned tenant authorization. The wallet independently checks its merchant configuration and provider evidence. One opt-in does not enable the other layers.

Both service and wallet reject run provenance for `purchase`. Only `sandbox_fill_only` is admitted in this preview. Existing purchase integrations keep their separate customer-final-click contract.

Key-bearing wallet tenants read Browser Use independently. When Dana retains the provider key, the wallet checks Dana's authenticated resource projection. This remains the `customer_backend_trusted` trust model; it is not an independent provider read.

## Preload the extension before the first run

Dana must upload and verify the approved extension, then add its Browser Use upload ID to the first `runs.create` call in `browserSettings.extensionIds`. Keep recording disabled. Follow-up runs must retain the same extension set. Existing sessions that started without Accelerate's extension cannot be upgraded in place; start a new session before checkout.

Persist the upload ID, runtime ID, version, and artifact checksum in Dana's installation configuration. Download the [approved 0.0.0.1 artifact](https://github.com/weaccelerateinc/accelerate-extension-downloads/releases/tag/extension-v0.0.0.1) and verify it with `verifyApprovedExtensionArtifact` before upload. Begin with the Accelerate extension only. Adding 1Password or another extension requires qualification of the complete extension set. An allowlist does not prove that another extension is qualified.

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

Run/session tombstones are hash-only and survive normal encrypted checkout deletion. Apply migration `004_browser_run_claims.sql` before enabling a run-browser merchant. The service role needs `SELECT` and `INSERT` on the claim ledger. Keep the ledger through normal retention and do not grant the runtime role `DELETE` or `TRUNCATE` access.

## Deploy and roll back safely

The wallet's run ownership uses encrypted lease payload v3 and privacy breach v4. Older wallet readers cannot parse those payloads. Keep the matching new gateway and reaper deployed until every lease created in the new mode is retired, including uncertain leases. Turning off run-browser admission stops new checkouts; it does not remove the gateway/reaper cleanup requirement for existing leases.

Keep migration 004's hash-only claim ledger through checkout purge and rollback. Do not drop or truncate consumed claims. An old SDK cannot recover or safely resume an active provenance attempt. Keep Dana's copied runtime configuration explicitly fill-only during rollback; do not switch an active run-created attempt to a legacy SDK path.

The SDK source also requires the actual provider expiry and has bounded create/fill HTTP waits. Those timeout caps are maximum waits, not reserved execution time. Budget private verification, fill, review delivery, and cleanup within the original browser lifetime.

## Qualification and scope

Use the paired PRs and matching tested archive. Keep the three merchant opt-ins off until the wallet/reaper and service are deployed with the required migration. Then qualify the actual Browser Use project and merchant form. Verify cart continuity, original expiry, extension bytes and installed IDs, scheduler/viewer fencing, private masked review, one fill, and independent cleanup. Test crashes, duplicate and late webhooks, queued follow-up work, viewer access, failed creation, and already stopped browsers. Do not submit an order.

The prior published purchase rules and qualification status remain in force. This preview does not activate a tenant, enable financial release, qualify production, qualify a co-extension, or add final-click support. Dana's supplied repository audit and required file changes are recorded in the [SDK integration preview](https://github.com/weaccelerateinc/accelerate/blob/2cea64d1/products/agent-sdk/docs/dana-integration.md).

## Compatibility with other providers

| Integration | Effect of this preview |
| --- | --- |
| Browser Use standalone metadata browsers | Existing metadata and single-extension defaults remain. Additional extensions require an exact operator policy and qualification. |
| Browser Use run-created browsers | New merchant opt-in for fill-only. Requires Dana's durable owner, scheduler and viewer controls. |
| Registered browser connectors | Existing provider contract remains. Browser Use run provenance is not accepted on generic bindings. |
| Managed Kernel browsers | Existing managed custody and purpose rules remain. This preview adds no Kernel purchase capability. |
| Linq private messaging | Existing adapter and receipt contract remain. WhatsApp is a separate opt-in adapter. |
| Agent models and workflow engines | No model vendor is selected by this change. Hosts must preserve the same ownership, idempotency and private-ingress contract. See [Eve guidance](whatsapp-private-messaging.md#eve-workflow-integration). |

These statements describe source and contract compatibility. They do not qualify an untested browser provider, model integration, or workflow deployment. Keep the original runtime and extension configuration available until active or uncertain leases close; changing the pins can block cleanup proof even after the browser stops.
