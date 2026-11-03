---
description: Separate deployed sandbox form support from provider onboarding, customer final-click rollout, and production qualification.
---

# Universal checkout rollout

`universal_card_v1` has already supported sandbox fills and masked reviews on real merchant checkout documents. It is not restricted to `demos.weaccelerate.com/normal/payment`. The [2 November 2026 sandbox report](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/qualification/REPORT.md) records additional merchant layouts, failures, and incomplete cleanup evidence. It records no submitted real-store order or production payment qualification.

The SDK **0.11.0 customer-final-click contract** remains the published purchase baseline. SDK 0.12.0 is published and its managed sandbox service is healthy on release source `12cf65b0a338f845ad9c966e491fc6ae438ec324`. Run-browser merchant admission is disabled there. Deployment reports migration `004_browser_run_claims.sql` as skipped; this does not establish the database's ledger state. An operator must apply and verify the migration before enabling admission. The patched wallet gateway and reaper deployment passed a synthetic worker-loss retirement probe. These observations do not qualify the source, full adapter, guest profile cleanup, provider, merchant, WhatsApp flow, or purchase. Production customer onboarding, tenant activation, and financial release remain closed. Existing universal fill/review evidence does not qualify every provider, checkout, or real-money purchase. See [Purchase mode](purchase-mode.md).

SDK 0.12.0 includes Dana's run-browser and WhatsApp journal APIs. Their availability in the SDK does not enable merchant admission or establish provider/payment qualification. See the [run browser guide](browser-use-run-browsers.md) and [WhatsApp private messaging guide](whatsapp-private-messaging.md).

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

1. The client implements the [SDK browser host](browser-connector-interface.md), including real ownership records, inspection, durable automation restriction, and cleanup confirmation. Purchases using 0.11.0 additionally need its trusted final-click callback.
2. Accelerate registers the [provider connector](provider-connector-contract.md) for the same Merchant ID and connector ID in the gateway and independent reaper. The module must resolve the existing resource, connect without creating another browser, request stop, and independently read back that exact owned resource as stopped.

The current executor uses Playwright-compatible Chromium/CDP and a Manifest V3 extension. A generic provider also needs a release manifest approved for `provider: 'connector'` and the intended use. Installing the Browser Use baseline ZIP or implementing an interface does not provide that qualification.

Include the reviewed connector module and its dependencies in both deployments. Setting `MCP_CUSTOMER_BROWSER_CONNECTORS_MODULE` does not add an external file to the default worker image. Do not remove a definition or its stop/read capability while it has active leases.

Qualify worker-loss cleanup for the selected credential model. With client-owned Browser Use keys (`MCP_CLIENT_BROWSER_EXTENSION_JSON`), Accelerate's reaper can acknowledge/close the lease but cannot stop or read the provider browser. The customer's host must independently stop and read back that exact browser, retaining the restriction until provider-stop proof or confirmed provider expiry. Lease closure alone is insufficient. Registered operator provider connectors supply separate provider read/stop capability to the reaper; do not infer that capability for the client-key path.

## Release and environment status

The following release and deployment records were verified for SDK 0.12.0 and the patched sandbox wallet rollout:

| Component | Verified record |
| --- | --- |
| SDK release | npm `@weaccelerateinc/agent-sdk@0.12.0`; [release tag](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.12.0); source merge `12cf65b0a338f845ad9c966e491fc6ae438ec324`; archive SHA-256 `4a74b8532cb4d5055804a39a070783d29e52dff48d76f0d48fa35845268bc0e2`. Clean registry download, consumer imports, and release workflow `41739645592` passed. |
| Managed sandbox service | Vercel deployment `dpl_Bu89UfpQmSJwbupFKpHb5dmfbT4B`, Ready on SDK source `12cf65b0a338f845ad9c966e491fc6ae438ec324`; `/healthz` returned HTTP 200. Run-browser merchant flag is absent. Deployment reports migration `004_browser_run_claims.sql` as skipped; this does not establish the database ledger state. Apply and verify it before any admission. |
| Wallet MCP patched release | Deployment `dpl_EU66XRoDLt35K1iSZ8ECK4ppcEfP`, Ready on source `dfe6564373174e705f50ca2dc5286b625e7b0c56` (merged dependency update PR #22). Dependency audit reported zero findings. The full test run reported 1,136 passed and 258 skipped; the direct Next.js build passed. |
| Sandbox gateway and reaper | Sole active revisions `accelerate-wallet-agent-sbx--ccdfe6564373` and `accelerate-browser-reaper-sbx--ccdfe6564373`, healthy at one replica; image SHA-256 `18200b9598def05b5a4a677c532cc659c6d4acc53ac5beca4ef70df6ea5c218f`; fresh reaper epoch `702e0672-6fdb-4ea8-9425-90159657b0d7`. |
| Synthetic worker-loss retirement probe | In the reaper container, a child was killed with `SIGKILL`. A fresh acknowledgement, provider `404`, and database retirement were confirmed 29,441 ms before the 90-second deadline, without operator fallback. The post-probe check found zero non-closed leases and zero Kernel project browsers. The probe made no wallet, card, token, or payment calls. It did not independently inspect guest-profile removal. Source and the full extension adapter remain unqualified. |
| Extension release compatibility | Public [compatibility update PR #1](https://github.com/weaccelerateinc/accelerate-extension-downloads/pull/1), merged at `a738d6288d9a10a0dab5b78ae20d1cea73602490`. Manifest SHA-256 `8a7d81138f371159e8cac60514ad9f5e495f28ca259afbe49c3d51dc8749b371`. The ZIP bytes are unchanged. New assets are `accelerate-extension-0.0.0.1.sdk-0.12.0.release.json` and `.SHA256SUMS`. This metadata supports SDK 0.12.0; it does not qualify a new extension or provider. |

These are sandbox release and operational observations. They do not establish real-store payment success, provider qualification, merchant form acceptance, WhatsApp provider qualification, or production readiness. No Dana merchant is enabled. Keep production activation and financial release closed.

At the **3 November 2026, 20:21 UTC** verification point, SDK 0.11.0 was published as npm's `latest` version. The [0.11.0 release tag](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.11.0) identifies source commit `dc30fdaf`. The release deployment and read-only sandbox metadata checked at that time are:

| Component | Observed metadata |
| --- | --- |
| SDK | npm `@weaccelerateinc/agent-sdk@0.11.0`; release source `dc30fdaf`. |
| Managed service | Canonical `https://accelerate-agent-sdk.vercel.app`, healthy release source `dc30fdaf`, sandbox wallet environment. |
| Wallet MCP | Canonical `https://accelerate-wallet-mcp.vercel.app`, healthy release source `5cb0a049`, sandbox wallet environment. |
| Sandbox gateway | Ready revision `accelerate-wallet-agent-sbx--cc5cb0a049`; 100% traffic on the latest revision. |
| Independent sandbox reaper | Ready revision `accelerate-browser-reaper-sbx--cc5cb0a049`. |
| Gateway/reaper image | SHA-256 `fb8f1655871f66b58fabf5b24b862c8d7ad05bc2569f299b192d16e7458aa1e6`. |

The Vercel aliases use Vercel's production deployment slot, but their wallet environment is **sandbox**. That slot name does not indicate real-money production payments. Health and source/image identity verify deployment; they do not establish payment qualification. The older 2 November merchant fill/review evidence applies to its recorded deployment and is not a new 0.11.0 real-money purchase test.

**Separate production infrastructure is deployed.** The Azure stack includes the managed service, wallet MCP, internal gateway, and independent reaper. Operator infrastructure verification is complete. No production tenants are active, all financial release flags remain closed, and customer onboarding and provider/payment qualification are pending. This deployment does not enable customer charges or establish production payment qualification.

| Production service | Origin |
| --- | --- |
| Managed checkout service | `https://accelerate-agent-sdk-prd.politemushroom-4a4cad1b.eastus2.azurecontainerapps.io` |
| Wallet MCP and add-card | `https://accelerate-wallet-mcp-prd.politemushroom-4a4cad1b.eastus2.azurecontainerapps.io` |

For approved production use, explicitly set `ACCELERATE_BASE_URL` to the production managed-service origin above. The SDK's canonical Vercel default remains sandbox. Use the separate Production key and Merchant ID, and the approved add-card URL supplied during onboarding. A dashboard-generated link requires the dashboard deployment to be configured for the production wallet origin. A sandbox add-card example or an environment query parameter alone is not production onboarding approval. See [Choose the wallet environment](agentic-platforms.md#choose-the-wallet-environment).

The original approved extension manifest records a narrower demo fill/review baseline. Preserve that history. The later sandbox report adds merchant evidence without retroactively qualifying a new provider, extension artifact, or production purchase.

## Deploy a matching release

Accelerate operators perform the coordinated deployment. Customers can install SDK 0.11.0 now and update their authenticated host integration. Production customer use must still complete approved onboarding and provider/payment acceptance.

1. Select reviewed SDK, managed-service, wallet-MCP, gateway, and reaper revisions. Record commits, image digests, extension bytes, configuration version, and test evidence. Publish the SDK only through its reviewed release process; a source version is not an available npm release.
2. Build the private worker with its pinned `playwright-core@1.62.1`, required native capture dependencies, and reviewed connector modules. Verify the extension installation and runtime against its approved manifest. Preserve isolated private evaluation; there is no merchant-main-world fallback.
3. Provision the managed service, authenticated MCP/bridge channels, durable stores, intended origin policy, and the same provider definitions in gateway and reaper. Apply required service migrations before traffic. Keep environment credentials in their secret managers.
4. Pause new admission and drain active payment sessions. Independently confirm that existing leases and provider resources are retired before replacing their owners. A gateway restart does not recover retained attempts.
5. Transfer reaper leadership using its controlled runbook. Require a fresh healthy poll and exact lease acknowledgements before reopening admission. Requalify worker-loss retirement; do not weaken freshness or overwrite leadership records to force readiness.
6. Verify exact-document admission, private verification, one fill, masked review delivery, cancellation, and independent cleanup on the actual provider and agreed merchant layouts. Use explicit fill-only purpose for a no-order test.
7. Qualify the new customer-final-click path separately. Before OTP, the service internally requires `customer_final_click_supported: true` for one top-level document with no iframes or shadow roots and card/address controls in that document. Quote inspection requires an explicit USD-labelled simple total; unique exact total/submit selectors are checked before credential fill. Exercise fresh private approval and readiness preflight before arming, one-use preparation, the at-most-10-second gateway window without late provider reads, exactly one customer-backend click, completion, expiry/failure handling, and retained restrictions. Verify that the completion token remains in the SDK orchestrator and never reaches the host. Existing iframe or shadow-root fills do not establish purchase support for those layouts.

For this first purchase flow, programmatic merchant `form.submit()` and `requestSubmit()` flows are unsupported. The gate compares the submit control's identity, tag, type, name, form, and disabled state; bound card/address native values and metadata; submit-form control inventory; exact total text; and URL. Unrelated banner/countdown text and button hover/focus class changes are allowed. Qualify those permitted changes as well as rejection of changed security bindings. The browser-clock probe must have a round trip of at most 500 ms and skew of at most 250 ms.

Initial admission also requires no active or registered origin service workers. CDP service-worker bypass provides an additional browser control. Include blocked non-main-frame/worker requests and new-page closure in acceptance tests. A new page makes the outcome `outcome_unknown`. Do not describe these browser/application controls as a provider firewall or WebRTC protection.

Also verify that arming keeps automatic payment requests blocked until the authorized click is admitted, permitted requests remain within the approved merchant/provider policy afterward, and caller disconnects do not prematurely close a browser under outcome observation. The click deadline must not exceed the original approval. Click-window expiry and private execution expiry are different limits; later observation cannot extend click authority. Early cancellation returns `final_click_in_progress`; keep observing the existing attempt without re-arming or retrying the click.

## Before production purchase use

Dashboard production access does not replace technical acceptance. Agree the provider, merchant layouts, supported payment flows, and success criteria with Accelerate. Verify the selected environment's credential provenance and fresh-CVV behavior, installed artifact bytes, correct field writes, final amount, private review receipt, customer approval, independent cleanup, and failure handling.

Purchase acceptance must also cover the customer-owned final click and an independently verified merchant order result. A click, redirect, `submit_attempted`, or caller assertion is not payment confirmation. Keep uncertain attempts restricted until reconciliation; do not retry a click or start a replacement purchase from an unknown result.

The recorded sandbox report leaves production payment qualification, real-store order completion, and parts of cleanup and installed-byte verification unresolved. A new controlled qualification must resolve the intended release's gaps. Do not infer acceptance from a synthetic smoke, generic connector interface, healthy deployment, or existing merchant screenshot.

Operator source references: [universal configuration and compatibility](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/universal-card-autofill.md#configuration-and-compatibility), [provider rollout](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/customer-browser-connectors.md#qualification-and-rollout), [gateway/reaper runbook](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/kernel-private-gateway.md#operator-configuration-and-hosting), and [managed-service deployment](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/docs/deployment.md). These repository references may require access from Accelerate.
