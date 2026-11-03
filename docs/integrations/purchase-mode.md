---
description: Enable purchase submission and understand how checkout admission differs from fill-only testing.
---

# Purchase mode and checkout support

Accelerate supports both purchase and fill-only checkouts. Purchase mode can fill the card, deliver a masked customer review, obtain private customer approval, and execute a separate explicit final submit. Fill-only is a no-order test purpose that permanently disables submission for that checkout.

`universal_card_v1` is a separate runtime checkout-admission contract. It supports both purposes. It does not impose a fill-only mode or a demo-store hostname restriction.

## Starter defaults and existing integrations

| Integration | Purchase configuration |
| --- | --- |
| Published SDK `0.10.3` existing-browser starter | Set `ACCELERATE_STARTER_PURPOSE=purchase` and `ACCELERATE_ENABLE_PURCHASE_SUBMIT=true`. These settings already exist. |
| SDK `0.10.4` source candidate, after release | Newly generated `init --browser existing` apps default to purchase with the submit tool enabled. Synthetic mode remains the initial transport. |
| Direct SDK registration | Pass `purpose: 'purchase'` and `enableSubmit: true` to `registerPartnerCheckoutTools`. The reusable API keeps its compatibility defaults. |
| Direct HTTP API | Create the checkout with `purpose: 'purchase'` and the chat/after-fill/v2 settings. There is no `enableSubmit` field in the HTTP creation body. |

Version `0.10.4` is not yet published. A source change does not update an installed npm package. The generator copies runtime files into each application, so already generated projects keep their own files after a package upgrade. The original managed-browser starter, selected by omitting `--browser existing`, retains its fill-only default.

## Configure an existing-browser starter

Set these values in the server process alongside your API key and Merchant ID:

```dotenv
ACCELERATE_STARTER_MODE=live
ACCELERATE_CHECKOUT_PROFILE=managed_review_v2
ACCELERATE_STARTER_PURPOSE=purchase
ACCELERATE_ENABLE_PURCHASE_SUBMIT=true
ACCELERATE_CONTEXT_MODULE=/absolute/protected/partner-host.mjs
```

`live` selects real authenticated browser, messaging, and persistence dependencies. It does not select the production wallet environment; the approved key, Merchant ID, and service configuration select that environment. The context module supplies the backend dependencies described in [Connect your backend](agentic-platforms.md#4-connect-your-backend).

The starter does not load `.env` automatically. Export the values through your deployment configuration, or load the file explicitly, for example with `node --env-file=.env server.mjs`.

For direct SDK composition:

```js
import { registerPartnerCheckoutTools } from '@weaccelerateinc/agent-sdk/partner';

const integration = registerPartnerCheckoutTools(authenticatedMcpServer, {
  ...trustedBackendDependencies,
  profile: 'managed_review_v2',
  purpose: 'purchase',
  enableSubmit: true,
});
```

`authenticatedMcpServer` and `trustedBackendDependencies` are supplied by your application. They include verified customer identity, browser controls, durable ownership, private messaging, and pre-model sensitive ingress. Purchase configuration belongs to that trusted backend, not a model tool argument.

## What purchase mode permits

With submission enabled, the MCP registry exposes `accelerate_checkout_submit`. A purchase still requires:

1. Private shopper verification and owned card/address selection.
2. An exact merchant quote and one armed fill for the current revision.
3. Fresh private CVV verification and a successful bound fill.
4. Delivery of the masked review image and final amount, with the actual provider receipt.
5. A fresh private approval within the five-minute decision window.
6. A separate explicit submit for the matching, unexpired revision.

Filling, a ready form, and customer approval do not submit automatically. `submit_attempted` is not an order confirmation. Reconcile uncertain outcomes through the merchant's independent order channel before any replacement purchase.

Changing configuration cannot convert an existing fill-only checkout into a purchase. Its purpose is part of its original admission and idempotency binding. Use a separately authorized new checkout, with a fresh owned browser and creation key after confirmed cleanup and resolution of uncertainty.

## Select fill-only explicitly for a no-order test

```dotenv
ACCELERATE_STARTER_PURPOSE=sandbox_fill_only
ACCELERATE_ENABLE_PURCHASE_SUBMIT=false
```

The new starter also disables submit when fill-only purpose is set and the submit override is absent. If you copied an environment template containing submit `true`, change both lines. Explicit submit `true` with fill-only is rejected. Purchase purpose with explicit submit `false` is supported when an integration wants to withhold the submit tool.

Fill-only sends an informational review and ends through cancellation and cleanup. Its server-side no-submit guard remains in place so an explicitly requested test cannot place an order.

## What `universal_card_v1` means

Before OTP or CVV, Accelerate's private executor inspects the actual existing payment document. It must detect supported, unambiguous card fields and safe review capability. Its private admission receipt binds the exact HTTPS checkout URL and requested purpose, either `purchase` or `sandbox_fill_only`.

The service rechecks that binding before later private steps. An unsupported form, changed document, missing safe review, or incompatible payment frame stops the checkout. The profile is internal evidence; clients do not enable it by adding a public `profile` flag or changing the purpose of an existing checkout.

This path uses the approved `0.0.0.1` extension's existing fill engine. It does not require candidate extension `0.0.0.2`. The extension's `automatic_submit: false` capability means filling does not automatically click purchase; a separately authorized executor submit remains available in purchase mode.

## Runtime support and release qualification

The earlier demo-only wording appears in the [SDK starter README](https://github.com/weaccelerateinc/accelerate/blob/5925b650ecd3a52eda070332da10bd50dfc90614/products/agent-sdk/packages/sdk/partner-starter/README.md#L44). It describes the original published baseline and its recorded extension qualification, not a global prohibition on purchase or a demo-hostname allowlist.

The [2 November 2026 sandbox report](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/qualification/REPORT.md) records fill and masked-review runs on additional merchant checkouts. It also reports failures and incomplete cleanup evidence. It records no submitted real-store order or production payment qualification. Enabling purchase configuration does not replace deployment compatibility or merchant/provider acceptance evidence.

Use [Browser connector interface](browser-connector-interface.md), [Provider connector contract](provider-connector-contract.md), and [Extension contract](extension-contract.md) to configure the matching deployment. See [Private CVV and credential delivery](agentic-platforms-private-payments.md) for the payment data path.
