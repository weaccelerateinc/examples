---
description: Integrate Dana's run-created Browser Use sessions with the published Accelerate SDK.
---

# Reuse a Browser Use run for checkout

This page documents **SDK 0.17.0** (published 25 November 2026). SDK 0.17.0 removes the browser extension: `createBrowserUseHost` no longer accepts `extensionId`, `extensionRelease`, `extensionRuntimeId`, or `additionalExtensions`; your host's `inspectDocument` receives `(context, document, options)` and must not return `extension`; and nothing is installed in the run browser. See [Upgrading from 0.16.1](agentic-platforms.md#upgrading-from-0161) and the [0.17.0 release record](universal-card-rollout.md#sdk-0170-release).

SDK 0.16.0 is a breaking release. Accelerate no longer creates or owns a browser. Every checkout attaches the agent's own browser: a Browser Use browser like this one, or a browser behind a registered connector. `browser` is required on checkout creation. The Kernel starter and `browserMode:'accelerate_managed'` are removed. See the [0.16.0 release record](universal-card-rollout.md#sdk-0160-release).

Authenticated integrations can use run-created browsers without a merchant allowlist (since SDK 0.13.0). Migration `004_browser_run_claims.sql`, a matching wallet gateway/reaper, durable ownership, and cleanup remain required. Nothing is installed in Dana's browser. Provider and merchant qualification remain pending. Production activation and financial release remain closed.

This flow reuses Dana's run-created shopping browser. The cart, cookies, login, and merchant page stay in that browser. It does not create a payment browser or move a cart. Accelerate's private executor attaches to that browser session and types the card values into the payment fields itself. See [How Accelerate fills the card](#how-accelerate-fills-the-card). A fill-only checkout does not submit an order. A purchase uses the customer's final click; see [Purchase checkouts](#purchase-checkouts).

## Configure the SDK host

Use Dana's existing authenticated session store and browser-control service to implement the host callbacks. Keep the host configuration in durable backend storage. It must be the same on every replica.

```js
import { createBrowserUseHost } from '@weaccelerateinc/agent-sdk/browser-use-host';

const browserUseHost = createBrowserUseHost({
  apiKey: process.env.BROWSER_USE_API_KEY,
  merchantId: config.accelerateMerchantId,
  host: danaBrowserUseHost,
});
```

`danaBrowserUseHost` implements the platform host methods. It must resolve the authenticated owner and immutable session/run reservation from Dana's backend. It must inspect the actual document, stop ordinary tasks, persist the scheduling fence, and confirm cleanup. Do not accept owner, run, session, browser, or provenance fields from model arguments. Do not return provider task text, run output, viewer links, or unknown provider fields in checkout resource records.

Configure the default checkout for the no-order flow:

```js
const checkoutOptions = {
  profile: 'managed_review_v2',
  purpose: 'sandbox_fill_only',
  enableSubmit: false,
};
```

The registration `purpose` is only the default. Since SDK 0.16.0, the agent can choose `purchase` or `sandbox_fill_only` for each checkout through `accelerate_checkout_start`.

SDK 0.13.0 and later do not require the three merchant opt-ins from 0.12.0. The deprecated SDK `allowRunCreatedBrowsers` option is accepted but ignored. The matching managed service ignores `ACCELERATE_MANAGED_RUN_BROWSER_MERCHANT_IDS`; the matching wallet gateway does not require a separate run-browser merchant allowlist. Older deployments and SDK 0.12.0 keep their earlier restrictions until upgraded.

The service still authenticates static and provisioned tenants. The wallet still verifies provider evidence and binds browser ownership to the lease. Install the matching service/gateway/reaper and verify migration 004 before using this path.

### Purchase checkouts

The service and wallet admit run provenance for `sandbox_fill_only`. They also admit it for `purchase` when the customer performs the final click (`final_click_actor: 'customer'`). Accelerate never sends the payment click. Any other purchase is refused before a browser is attached.

`createBrowserUseHost` exposes `performFinalClick` only when `danaBrowserUseHost` implements it. Without that method, register fill-only checkouts only. With it, the customer's agent makes one trusted click through its own browser connection after private approval. See [Customer final click](browser-connector-interface.md#customer-final-click-in-sdk-0110) and [Purchase mode](purchase-mode.md). The gateway's page checks for a customer final click still apply.

Key-bearing wallet tenants read Browser Use independently. When Dana retains the provider key, the wallet checks Dana's authenticated resource projection. This remains the `customer_backend_trusted` trust model; it is not an independent provider read.

## How Accelerate fills the card

Dana does not install anything in the browser for Accelerate. Keep recording disabled.

- Accelerate's private executor attaches to the existing browser session. It types each card value into the payment fields with trusted browser keystrokes.
- It finds card controls only in the admitted checkout document and permitted payment-provider frames. If it finds two controls of one kind, it types nothing. The checkout returns `checkout_unsupported` with reason `card_form_ambiguous`. Accelerate checks this when the checkout attaches and again before it uses the card credential.
- It reads each value back in the page. Card values are never logged, returned to the agent, or put in an error. If a value does not read back, the gateway empties the card fields and reports that it could not confirm the fill. This is not an SDK error code.
- An in-page retention timer clears the card fields at the deadline, even if the connection drops. Cleanup empties every card control and must confirm that they are empty.
- The executor never presses Enter and never clicks submit.

Other software that Dana runs in the browser, such as a password manager, can have page access. Accelerate does not inventory it or claim that filled card data is isolated from it.

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

If Browser Use reports that the browser stopped or expired, the SDK returns `browser_ended` with next action `stop`. Do not retry that checkout. Create a fresh browser and a new checkout.

Use the provider's actual `timeoutAt` value for expiry. Idle `keepAlive` settings do not establish the browser deadline. The SDK requires at least ten minutes remaining at attachment; the wallet run-created path requires more than ten minutes at its fresh provider read. Check the real expiry before private verification and refuse a session without enough headroom. Do not create a replacement browser or move the cart to extend the deadline.

At closure, stop the exact original browser and read it again. Retain the reservation and restriction after a timeout, crash, lost acknowledgement, or uncertain fill until cleanup is independently confirmed. In client-key mode, the wallet reaper cannot stop or read the provider browser. Dana's backend must independently stop and inspect it; lease closure alone is not cleanup proof.

Run/session tombstones are hash-only and survive normal encrypted checkout deletion. Apply migration `004_browser_run_claims.sql` before admitting run-browser checkouts. The service role needs `SELECT` and `INSERT` on the claim ledger. Keep the ledger through normal retention and do not grant the runtime role `DELETE` or `TRUNCATE` access.

## Deploy and roll back safely

The wallet's run ownership uses encrypted lease payload v3 and privacy breach v4. Older wallet readers cannot parse those payloads. Keep the matching gateway and reaper deployed until every lease created in the new mode is retired, including uncertain leases. To stop new starts, block checkout creation in your authenticated backend; retired merchant flags do not disable the updated service. Stopping new starts does not remove the cleanup requirement for existing leases.

Keep migration 004's hash-only claim ledger through checkout purge and rollback. Do not drop or truncate consumed claims. An old SDK cannot recover or safely resume an active provenance attempt. Keep Dana's copied runtime configuration explicitly fill-only during rollback; do not switch an active run-created attempt to a legacy SDK path.

The SDK source also requires the actual provider expiry and has bounded create/fill HTTP waits. Those timeout caps are maximum waits, not reserved execution time. Budget private verification, fill, review delivery, and cleanup within the original browser lifetime.

When upgrading from SDK 0.14.1 or earlier, coordinate every private ingress/host worker that shares persistence before enabling [wallet-phone correction](agentic-platforms.md#correct-a-wallet-phone-privately). Older workers cannot read the new typed phone-prompt outbox item, even after delivery. Keep the authenticated chat identity and original browser ownership binding unchanged when a customer corrects the wallet number.

SDK 0.17.0 does not change ownership, reply parsing, the private protocol, or stored data. Install it on every host and private-ingress worker, and remove the extension settings in the same deploy. No data migration is needed. See [the exact private prompt text](whatsapp-private-messaging.md#private-prompts).

## Qualification and scope

Use the released SDK with the matching wallet gateway/reaper and service, and verify the existing claim-ledger migration. Qualify the actual Browser Use project and merchant form. Verify cart continuity, original expiry, scheduler/viewer fencing, private masked review, one fill, and independent cleanup. Test crashes, duplicate and late webhooks, queued follow-up work, viewer access, failed creation, and already stopped browsers. Qualify with `sandbox_fill_only` first. A purchase checkout places a real order.

The prior published purchase rules and qualification status remain in force. SDK publication and sandbox service health do not activate a tenant, enable financial release, qualify production, or qualify a merchant. Dana's required integration changes are recorded in the [SDK 0.17.0 Dana integration contract](https://github.com/weaccelerateinc/accelerate/blob/agent-sdk-v0.17.0/products/agent-sdk/docs/dana-integration.md).

## Compatibility with other providers

| Integration | SDK 0.17.0 behavior |
| --- | --- |
| Browser Use standalone metadata browsers | Existing ownership and metadata checks remain. |
| Browser Use run-created browsers | Authenticated integration. Fill-only, or purchase with the customer's final click. Requires Dana's durable owner, scheduler and viewer controls, and claim ledger. |
| Registered browser connectors | Existing provider contract remains. Browser Use run provenance is not accepted on generic bindings. |
| Accelerate-managed (Kernel) browsers | Removed in SDK 0.16.0. Accelerate creates no browser. |
| Linq private messaging | Existing adapter and receipt contract remain. WhatsApp is a separate opt-in adapter. |
| Agent models and workflow engines | No model vendor is selected by this change. Hosts must preserve the same ownership, idempotency and private-ingress contract. See [Eve guidance](whatsapp-private-messaging.md#eve-workflow-integration). |

These statements describe source and contract compatibility. They do not qualify an untested browser provider, model integration, or workflow deployment. Keep the original host configuration available until active or uncertain leases close; changing it can block cleanup proof even after the browser stops.
