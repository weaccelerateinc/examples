---
description: Separate deployed sandbox form support from provider onboarding, customer final-click rollout, and production qualification.
---

# Universal checkout rollout

`universal_card_v1` has already supported sandbox fills and masked reviews on real merchant checkout documents. It is not restricted to `demos.weaccelerate.com/normal/payment`. The [2 November 2026 sandbox report](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/qualification/REPORT.md) records additional merchant layouts, failures, and incomplete cleanup evidence. It records no submitted real-store order or production payment qualification.

The **0.11.0 customer-final-click contract is a separate source candidate**. It is not published or deployed. Existing universal fill/review evidence does not qualify that new purchase flow. See [Purchase mode](purchase-mode.md).

## What admission checks

The private executor inspects the actual existing HTTPS payment document before OTP or CVV. It must find supported, unambiguous card controls and safe review capability. Its admission receipt binds the exact checkout URL, including query and fragment, and the immutable checkout purpose.

Private bindings retain the actual document, field nodes, and permitted payment-frame origins. A changed document, ambiguous controls, unsupported frame, missing review capability, or insufficient lifetime stops admission. The client cannot enable this evidence by sending a public `profile: 'universal_card_v1'` field.

The universal path reuses the approved `0.0.0.1` extension. Candidate `0.0.0.2` is not required. Extension filling, review capture, and purchase execution remain separately qualified capabilities.

## Enable the intended destinations

Accelerate operators configure two separate controls:

| Control | Behavior |
| --- | --- |
| `MCP_UNIVERSAL_CARD_FORMS_ENABLED` on the private executor | Universal admission is enabled by default for new attachments with expected URL and purpose. Explicit `false` rejects them; it does not downgrade them to a legacy profile. |
| `ACCELERATE_ALLOWED_CHECKOUT_ORIGINS` on wallet MCP | Empty denies checkout. An exact comma-separated HTTPS origin list permits those origins. Exactly `*` permits arbitrary valid HTTPS checkout origins. Each issued grant still binds one exact origin and transaction. |

Removing a demo origin from a list does not enable another destination. The operator must configure the intended origin policy while preserving tenant authentication, fresh-CVV proof, purpose, document, quote, review, and cleanup checks.

The older Kernel review diagnostic still has an exact demo-page restriction. Its sandbox evidence route is separate from existing-browser universal admission. Expanding that legacy diagnostic is not required to onboard a universal existing-browser connector.

## Browser Use and generic providers

Browser Use has a packaged provider adapter. Accelerate can configure tenant provider credentials, or the client can retain its provider key and supply the authenticated `browser_resource` through the supported client-owned path. That path requires the approved extension metadata on both gateway and independent reaper. Do not send provider keys or connection URLs to the model.

A different provider needs both connector layers:

1. The client implements the [SDK browser host](browser-connector-interface.md), including real ownership records, inspection, durable automation restriction, and cleanup confirmation. Candidate purchases additionally need its trusted final-click callback.
2. Accelerate registers the [provider connector](provider-connector-contract.md) for the same Merchant ID and connector ID in the gateway and independent reaper. The module must resolve the existing resource, connect without creating another browser, request stop, and independently read back that exact owned resource as stopped.

The current executor uses Playwright-compatible Chromium/CDP and a Manifest V3 extension. A generic provider also needs a release manifest approved for `provider: 'connector'` and the intended use. Installing the Browser Use baseline ZIP or implementing an interface does not provide that qualification.

Include the reviewed connector module and its dependencies in both deployments. Setting `MCP_CUSTOMER_BROWSER_CONNECTORS_MODULE` does not add an external file to the default worker image. Do not remove a definition or its stop/read capability while it has active leases.

## Sandbox deployment evidence

Read-only deployment inspection on **3 November 2026 at 19:26 UTC** found:

| Component | Observed metadata |
| --- | --- |
| Sandbox gateway | Revision `managed-1031-472425`, active and Healthy, receiving 100% traffic. |
| Independent sandbox reaper | Revision `managed-1031-472351`, active and Healthy. |
| Shared image | SHA-256 `05d3eb57305c14946f3636fee69ce48a5f263f5ccdc11942d8a16faa0f2410b0`, created 31 October. |
| Managed service and wallet MCP | Vercel aliases reported READY; inspected metadata did not identify their source commits. |

The gateway revision matches the 2 November report. This supports deployed sandbox universal fill/review evidence. It does not prove that current main's later fixes are in the image, that every configured provider works, or that the 0.11.0 final-click contract is deployed. Process health is not payment qualification. No settings or deployments were changed by this inspection.

The original approved extension manifest records a narrower demo fill/review baseline. Preserve that history. The later sandbox report adds merchant evidence without retroactively qualifying a new provider, extension artifact, or production purchase.

## Deploy a matching candidate

Accelerate operators perform the coordinated deployment. Customers update their authenticated host integration after the matching release is available.

1. Select reviewed SDK, managed-service, wallet-MCP, gateway, and reaper revisions. Record commits, image digests, extension bytes, configuration version, and test evidence. Publish the SDK only through its reviewed release process; a source version is not an available npm release.
2. Build the private worker with its pinned `playwright-core@1.62.1`, required native capture dependencies, and reviewed connector modules. Verify the extension installation and runtime against its approved manifest. Preserve isolated private evaluation; there is no merchant-main-world fallback.
3. Provision the managed service, authenticated MCP/bridge channels, durable stores, intended origin policy, and the same provider definitions in gateway and reaper. Apply required service migrations before traffic. Keep environment credentials in their secret managers.
4. Pause new admission and drain active payment sessions. Independently confirm that existing leases and provider resources are retired before replacing their owners. A gateway restart does not recover retained attempts.
5. Transfer reaper leadership using its controlled runbook. Require a fresh healthy poll and exact lease acknowledgements before reopening admission. Requalify worker-loss retirement; do not weaken freshness or overwrite leadership records to force readiness.
6. Verify exact-document admission, private verification, one fill, masked review delivery, cancellation, and independent cleanup on the actual provider and agreed merchant layouts. Use explicit fill-only purpose for a no-order test.
7. Qualify the new customer-final-click path separately. Before OTP, the service internally requires `customer_final_click_supported: true` for one top-level document with no iframes or shadow roots and card/address controls in that document. Quote inspection requires an explicit USD-labelled simple total; unique exact total/submit selectors are checked before credential fill. Exercise fresh private approval and readiness preflight before arming, one-use preparation, the at-most-10-second gateway window without late provider reads, exactly one customer-backend click, completion, expiry/failure handling, and retained restrictions. Verify that the completion token remains in the SDK orchestrator and never reaches the host. Existing iframe or shadow-root fills do not establish purchase support for those layouts.

For this first purchase candidate, programmatic merchant `form.submit()` and `requestSubmit()` flows are unsupported. The gate compares the submit control's identity, tag, type, name, form, and disabled state; bound card/address native values and metadata; submit-form control inventory; exact total text; and URL. Unrelated banner/countdown text and button hover/focus class changes are allowed. Qualify those permitted changes as well as rejection of changed security bindings. The browser-clock probe must have a round trip of at most 500 ms and skew of at most 250 ms.

Initial admission also requires no active or registered origin service workers. CDP service-worker bypass provides an additional browser control. Include blocked non-main-frame/worker requests and new-page closure in acceptance tests. A new page makes the outcome `outcome_unknown`. Do not describe these browser/application controls as a provider firewall or WebRTC protection.

Also verify that arming keeps automatic payment requests blocked until the authorized click is admitted, permitted requests remain within the approved merchant/provider policy afterward, and caller disconnects do not prematurely close a browser under outcome observation. The click deadline must not exceed the original approval. Click-window expiry and private execution expiry are different limits; later observation cannot extend click authority. Early cancellation returns `final_click_in_progress`; keep observing the existing attempt without re-arming or retrying the click.

## Before production purchase use

Dashboard production access does not replace technical acceptance. Agree the provider, merchant layouts, supported payment flows, and success criteria with Accelerate. Verify the selected environment's credential provenance and fresh-CVV behavior, installed artifact bytes, correct field writes, final amount, private review receipt, customer approval, independent cleanup, and failure handling.

Purchase acceptance must also cover the customer-owned final click and an independently verified merchant order result. A click, redirect, `submit_attempted`, or caller assertion is not payment confirmation. Keep uncertain attempts restricted until reconciliation; do not retry a click or start a replacement purchase from an unknown result.

The recorded sandbox report leaves production payment qualification, real-store order completion, and parts of cleanup and installed-byte verification unresolved. A new controlled qualification must resolve the intended release's gaps. Do not infer acceptance from a synthetic smoke, generic connector interface, healthy deployment, or existing merchant screenshot.

Operator source references: [universal configuration and compatibility](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/universal-card-autofill.md#configuration-and-compatibility), [provider rollout](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/customer-browser-connectors.md#qualification-and-rollout), [gateway/reaper runbook](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/kernel-private-gateway.md#operator-configuration-and-hosting), and [managed-service deployment](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/docs/deployment.md). These repository references may require access from Accelerate.
