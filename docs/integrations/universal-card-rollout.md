---
description: Separate deployed sandbox form support from provider onboarding, customer final-click rollout, and production qualification.
---

# Universal checkout rollout

`universal_card_v1` has already supported sandbox fills and masked reviews on real merchant checkout documents. It is not restricted to `demos.weaccelerate.com/normal/payment`. The [2 November 2026 sandbox report](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/qualification/REPORT.md) records additional merchant layouts, failures, and incomplete cleanup evidence. It records no submitted real-store order or production payment qualification.

The SDK **0.11.0 customer-final-click contract** remains the purchase baseline. **SDK 0.17.0 is the current release** (published 25 November 2026). It is a breaking release that removes the browser extension. SDK 0.16.0 was also breaking: every checkout attaches the agent's own browser, and only after-fill review remains. SDK 0.16.1 changed only shopper message wording. None of these releases changes the customer final-click contract: the customer's agent makes the final click, and Accelerate never clicks submit. Production customer onboarding, tenant activation, and financial release remain closed. Existing universal fill/review evidence does not qualify every provider, checkout, or real-money purchase. See [Purchase mode](purchase-mode.md) and the [0.16.1 release record](#sdk-0161-release).

SDK 0.17.0 retains Dana's run-browser and WhatsApp journal APIs introduced in 0.12.0. Since 0.13.0, the supported authenticated fill-only run-browser path no longer needs separate merchant opt-ins. The existing claim-ledger migration, matching gateway/reaper, browser ownership, fencing, and cleanup requirements remain. No browser extension is required. See the [run browser guide](browser-use-run-browsers.md) and [WhatsApp private messaging guide](whatsapp-private-messaging.md).

## What admission checks

The private executor inspects the actual existing HTTPS payment document before OTP or CVV. It must find supported, unambiguous card controls and safe review capability. Its admission receipt binds the exact checkout URL, including query and fragment, and the immutable checkout purpose.

Private bindings retain the actual document, field nodes, and permitted payment-frame origins. A changed document, ambiguous controls, unsupported frame, missing review capability, or insufficient lifetime stops admission. The client cannot enable this evidence by sending a public `profile: 'universal_card_v1'` field.

Accelerate's private executor fills the card itself. It types each value into the admitted controls with trusted browser keystrokes and reads it back in the page. Nothing is installed in the agent's browser. SDK 0.16.1 and earlier used a browser extension; SDK 0.17.0 and the current gateway do not. Card filling, review capture, and purchase execution remain separately qualified capabilities.

## Enable the intended destinations

Accelerate operators configure two separate controls:

| Control | Behavior |
| --- | --- |
| `MCP_UNIVERSAL_CARD_FORMS_ENABLED` on the private executor | Universal admission is enabled by default for new attachments with expected URL and purpose. Explicit `false` rejects them; it does not downgrade them to a legacy profile. |
| `ACCELERATE_ALLOWED_CHECKOUT_ORIGINS` on wallet MCP | Empty denies checkout. An exact comma-separated HTTPS origin list permits those origins. Exactly `*` permits arbitrary valid HTTPS checkout origins. Each issued grant still binds one exact origin and transaction. |

Removing a demo origin from a list does not enable another destination. The operator must configure the intended origin policy while preserving tenant authentication, fresh-CVV proof, purpose, document, quote, review, and cleanup checks.

SDK 0.16.0 removed the older Kernel review diagnostic and Accelerate's own browser. Universal admission applies only to the agent's existing browser.

## Browser Use and generic providers

Browser Use has a packaged provider adapter. Accelerate can configure tenant provider credentials, or the client can retain its provider key and supply the authenticated `browser_resource` through the supported client-owned path. Configure that path on both gateway and independent reaper. Do not send provider keys or connection URLs to the model.

A different provider needs both connector layers:

1. The client implements the [SDK browser host](browser-connector-interface.md), including real ownership records, inspection, durable automation restriction, and cleanup confirmation. Purchases using 0.11.0 additionally need its trusted final-click callback.
2. Accelerate registers the [provider connector](provider-connector-contract.md) for the same Merchant ID and connector ID in the gateway and independent reaper. The module must resolve the existing resource, connect without creating another browser, request stop, and independently read back that exact owned resource as stopped.

The current executor uses Playwright-compatible Chromium/CDP. A generic provider also needs Accelerate qualification for `provider: 'connector'` and the intended use. Implementing an interface does not provide that qualification.

Include the reviewed connector module and its dependencies in both deployments. Setting `MCP_CUSTOMER_BROWSER_CONNECTORS_MODULE` does not add an external file to the default worker image. Do not remove a definition or its stop/read capability while it has active leases.

Qualify worker-loss cleanup for the selected credential model. With client-owned Browser Use keys, Accelerate's reaper can acknowledge/close the lease but cannot stop or read the provider browser. The customer's host must independently stop and read back that exact browser, retaining the restriction until provider-stop proof or confirmed provider expiry. Lease closure alone is insufficient. Registered operator provider connectors supply separate provider read/stop capability to the reaper; do not infer that capability for the client-key path.

## Release and environment status

### SDK 0.17.0 release

SDK 0.17.0 is published on npm as `latest`. npm publication time is **25 November 2026, 03:15:57.931 UTC**. Immutable tag `agent-sdk-v0.17.0` points to source [`334381effd8783ac58d5b92ac283a3ea63711f7a`](https://github.com/weaccelerateinc/accelerate/commit/334381effd8783ac58d5b92ac283a3ea63711f7a). The [GitHub release](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.17.0) contains the verified archive. Its SHA-256 is `cec4d2f9875bea076eca94775efc9bc74261881fb49001759a0e23c01c6edf71`.

This is a breaking release. It removes the browser extension:

- `createExistingBrowserConnector` and `createBrowserUseConnector` no longer accept `extensionRelease`. `createBrowserUseHost` no longer accepts `extensionId`, `extensionRelease`, `extensionRuntimeId`, or `additionalExtensions`. A configuration with one of these keys throws `configuration_invalid` and names the key.
- Connector `inspectBrowser` and Browser Use host `inspectDocument` results must not contain `extension`. The Browser Use host `inspectDocument` receives `(context, document, options)`.
- The SDK sends no extension data to Accelerate. The approved-extension module and its release manifests are removed from the package.

The private executor types the card fields with trusted browser keystrokes. Nothing is installed in the agent's browser. The private CVV path, after-fill review, cleanup, shopper messages, and the customer final click are unchanged. Accelerate never clicks submit.

Accelerate deployed the matching changes in this order on **25 November 2026**: the wallet gateway without the extension ([accelerate-wallet-mcp#56](https://github.com/weaccelerateinc/accelerate-wallet-mcp/pull/56), merge `3338b591`), then the managed service ([accelerate#564](https://github.com/weaccelerateinc/accelerate/pull/564), merge `d87a2780`), then SDK publication. The managed service `https://accelerate-agent-sdk.vercel.app` returned HTTP 200 on `/healthz` after the deploy. Upgrade steps for integrators are in [Upgrading from 0.16.1](agentic-platforms.md#upgrading-from-0161).

### SDK 0.16.1 release

SDK 0.16.1 was published on npm and was `latest` until SDK 0.17.0. npm publication time is **17 November 2026, 22:28:45.966 UTC**. Immutable tag `agent-sdk-v0.16.1` points to source [`5c118c70419a827e9ed3c17bc66f66e916012035`](https://github.com/weaccelerateinc/accelerate/commit/5c118c70419a827e9ed3c17bc66f66e916012035). The [GitHub release](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.16.1) is published as a non-draft release. The [qualification run](https://github.com/weaccelerateinc/accelerate/actions/runs/44189268043) and the [publication run](https://github.com/weaccelerateinc/accelerate/actions/runs/44189633009) passed. The public registry archive matches the qualified archive: SHA-256 `408071102d307deffbd058d4576ccaec4354125b6da024c419b66008fb389f79`.

This release changes only the wording and layout of the private shopper messages. Card lists use `Option N:` rows, an `Add New Card:` link, and `Reply with the option #.` instructions. The OTP consent line ends with the policy URL. The card-selected, security-code, card-verified, approved, closed, filled-review, and private-step failure messages are shorter. The filled review shows no deadline. Reply parsing, stages, the five-minute approval window, and agent progress messages are unchanged. See [the exact prompt text](whatsapp-private-messaging.md#private-prompts).

The canonical managed sandbox service `https://accelerate-agent-sdk.vercel.app` returned HTTP 200 on `/healthz` and HTTP 401 on unauthenticated `/v1/connection` on **24 November 2026**. These are read-only deployment checks.

SDK 0.16.1 needed no service deployment or data migration. Hosts that compared message text in their own tests had to update those expectations.

### SDK 0.16.0 release

SDK 0.16.0 was published on npm at **17 November 2026, 00:56:18.824 UTC**. Immutable tag `agent-sdk-v0.16.0` points to source [`7cf71904fb0a7ec2d0c7a383865790057f8c9a62`](https://github.com/weaccelerateinc/accelerate/commit/7cf71904fb0a7ec2d0c7a383865790057f8c9a62). The [qualification run](https://github.com/weaccelerateinc/accelerate/actions/runs/43990825873) and the [publication run](https://github.com/weaccelerateinc/accelerate/actions/runs/43991171671) passed. The public registry archive matches the qualified archive: SHA-256 `8ba48b4469e78d528fb495b5d5939636d1e8a9df1e417207cad86fb05018278e`.

This is a breaking release:

| Change | Effect on integrations |
| --- | --- |
| Accelerate no longer creates or owns a browser | Every checkout attaches the agent's own browser (Browser Use or a registered connector) with `customer_backend_trusted` custody. `browser` is required on `client.checkouts.create` and `POST /v1/checkouts`. `browserMode: 'accelerate_managed'` and the Kernel starter are removed. Registration requires a `browserConnector`, or `browserMode: 'customer_backend_trusted'` with `browser` in the creation scope. |
| Read-only browser tool | `accelerate_checkout_browser` supports only snapshot, text, find, and wait. `browser_act` and `navigate` return `invalid_input`. |
| After-fill review only | The before-fill approval flow is removed. Registration rejects `profile: 'legacy_before_fill_v1'`, `approvalPolicy: 'before_fill'`, and `verificationTiming: 'on_start'`. The managed MCP accepts `managed_review_v1` (default) and `managed_review_v2`. |
| Private chat only | The service requires `interaction_mode: "chat"` and `approval_policy: "after_fill"`. Hosted mode (`/checkout/:id`, `/hosted/*`, bootstrap tickets, `wallet_url`) and `purpose: "sandbox_source_comparison"` are removed. Purposes are `purchase` and `sandbox_fill_only`. |
| Purpose per checkout | The agent can choose `purpose` on `accelerate_checkout_start`. The registration purpose is only the default. A purchase still requires a host that implements `performFinalClick`; the submit setting defaults to that capability. |
| New error code | `browser_ended` (next action `stop`) reports a stopped or expired customer browser. Create a fresh browser and a new checkout. Do not retry the old checkout. |
| USD totals | The Shopify total selector no longer requires the literal `USD`. The gateway reads a bare `$` total as USD. A visible non-USD currency code still rejects the total. |

Accelerate deployed in this order: managed service, then the gateway without the Kernel provider, then SDK publication. A Kernel, before-fill, or hosted checkout created before the service deployment expires on its next use. SDK 0.15.x clients that already use `managed_review_v1` or `managed_review_v2` and send `browser` continue to work. The 0.15.x `connection()` check and its CLI command report `invalid_response` against the current service until the client upgrades; checkouts are not affected.

### SDK 0.15.3 to 0.15.9

| Version | Change |
| --- | --- |
| 0.15.3 | Wallet-unlock OTP wording, WhatsApp policy buttons, and private Add Card / Complete Card actions. |
| 0.15.4 | Unpublished qualification candidate. |
| 0.15.5 | Published 10 November 2026. Confirmed unsupported-checkout diagnostics: the SDK keeps the failed checkout ID and an allowlisted card-form reason on `checkout_unsupported`. |
| 0.15.6, 0.15.7 | Unpublished qualification candidates. |
| 0.15.8 | Published 13 November 2026. A digit run in a checkout URL is refused only when a 13 to 19 digit window passes the Luhn check. URLs with merchant IDs such as eBay's `sessionid` now work. It also adds the combined Privacy & Terms link and accepts card replies by number, name, brand, or last four digits. |
| 0.15.9 | Published 14 November 2026. Saved addresses show the wallet's full label. `postal_code_mask` is no longer returned. |

### SDK 0.15.2 release

**Superseded.** This record is history. Install SDK 0.17.0.

SDK 0.15.2 was published on npm and was `latest` at its verification point. Its [GitHub release](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.15.2) is published and verified. Immutable tag `agent-sdk-v0.15.2` points to reviewed source merge [`e6786b8b460db05425ae43f688f332b64f015280`](https://github.com/weaccelerateinc/accelerate/commit/e6786b8b460db05425ae43f688f332b64f015280), merged through [PR #499](https://github.com/weaccelerateinc/accelerate/pull/499) at **9 November 2026, 23:34:29 UTC**. This final copy patch asks for the verification code sent to the wallet number or a different US number starting with `+1`. It retains the OTP agreement sentence and both policy links. The security-code prompt explains private filling before purchase approval and says the code is not shared with the assistant. Both prompts omit the cancellation sentence; cancellation handling is unchanged. Simpler `Card N` selection instructions from 0.15.1 remain. SDK 0.16.1 replaced this text. See [the current prompt text](whatsapp-private-messaging.md#private-prompts).

| Component | Verified release record |
| --- | --- |
| SDK source and archive | npm `@weaccelerateinc/agent-sdk@0.15.2`, immutable tag `agent-sdk-v0.15.2`, source `e6786b8b460db05425ae43f688f332b64f015280`. Archive `weaccelerateinc-agent-sdk-0.15.2.tgz` is **114,838 bytes**, SHA-256 `708ca9fca7e985f13d0e50b5574f753abca35942e332327be6e15775d933ede6`. Local, dry-run, publish-workflow, public-registry, and GitHub-release archives are byte-identical. Source identity is verified through the workflow's `RELEASE.json` and archive equality; npm metadata does not supply `gitHead`. The standard installed-archive verifier and independent consumers passed. Full checks passed with 850 tests and five skips, type/build checks, 13 starter tests, and both MCP protocol smokes. Independent review reported no findings. |
| npm publication and installation | The [release dry run](https://github.com/weaccelerateinc/accelerate/actions/runs/42721619927) and [publication workflow](https://github.com/weaccelerateinc/accelerate/actions/runs/42722023837) passed; the publish step completed at **9 November 2026, 23:39:56 UTC**. npm publication time is **9 November 2026, 23:41:10.221 UTC**. Public version metadata returned HTTP 200 and the full package metadata reported `latest: 0.15.2` at that time. A fresh credential-free exact npm install verified CLI `0.15.2`, final OTP/CVV text and both URLs, `Card N`, typed-payload rejection, legacy prompts, and multi-address compatibility. |
| GitHub release | The [0.15.2 release](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.15.2) was created at **9 November 2026, 23:42:03 UTC**, as a non-draft, non-prerelease release. Its redownloaded archive matches the public npm archive and all three preparation/publish archives exactly. |
| Managed sandbox service | Canonical `https://accelerate-agent-sdk.vercel.app` automatically redeployed from source `e6786b8b460db05425ae43f688f332b64f015280` as Ready deployment `dpl_8KSH6Y8tRqrP2XRZmZefkuyyiGFA`; the canonical alias matches this deployment. At **9 November 2026, 23:36:15 UTC**, `/healthz` returned HTTP 200 and unauthenticated `/v1/connection` returned HTTP 401. The 0.15.0/0.15.1 protocol is unchanged. No additional backend configuration, gateway, wallet, API, or database rollout is required. These were deployment and read-only boundary checks. |

At that release, 0.15.2 installed the then-final wording in the private host/ingress workers. Existing typed phone-prompt rows render the current fixed template at delivery. Phone validation, reply parsing, the private protocol, storage shape, ownership, and payment approval behavior are unchanged. For migrations from SDK 0.14.1 or earlier, preserve the coordinated private-worker upgrade and rollback restrictions in the 0.15.0 record below. This patch does not qualify a provider, merchant layout, WhatsApp integration, or production payment.

### Intermediate SDK 0.15.1 publication

The immutable `agent-sdk-v0.15.1` tag points to source merge [`bb8a204c8ef58d85bcc9b357b7ee64733fb85b51`](https://github.com/weaccelerateinc/accelerate/commit/bb8a204c8ef58d85bcc9b357b7ee64733fb85b51). Its 114,773-byte archive has SHA-256 `f0f718b4e681e842b78731502457aeb06ebf2a762c9e9e3aa6e5f4819e8ec8c3`; the [publication workflow](https://github.com/weaccelerateinc/accelerate/actions/runs/42720197491) completed successfully. It was published on npm at **9 November 2026, 23:27:50.774 UTC**, verified in a fresh consumer, and its [GitHub release](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.15.1) was created and verified against the immutable tag. This version carries the earlier OTP and security-code wording. Select the verified 0.15.2 release for the final copy; do not move or replace the 0.15.1 tag or archive.

### SDK 0.15.0 release

**Superseded.** This record is history. Install SDK 0.17.0.

SDK 0.15.0 is published on npm and was verified as `latest` at the recorded verification point. Immutable tag `agent-sdk-v0.15.0` points to source merge [`adb11920bf777c1eb04d5f7bf38dccfebf012ed0`](https://github.com/weaccelerateinc/accelerate/commit/adb11920bf777c1eb04d5f7bf38dccfebf012ed0). The [release record](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.15.0) identifies the archive. No new gateway, backend API, SQL migration, provider qualification, or production financial enablement is part of this phone-feature rollout.

| Component | Verified record |
| --- | --- |
| SDK release and archive | npm `@weaccelerateinc/agent-sdk@0.15.0`, published at **9 November 2026, 21:25:05.449 UTC**. Public version metadata, package metadata, and `latest: 0.15.0` were verified at 21:25:59 UTC. The public registry archive is 114,508 bytes, SHA-256 `5e486515ad886634ac1b4e246ccc92a3ffd34e5ad1cefec0388b785ef20cc689`, matching the reviewed local archive and dry-run/publish artifacts exactly. The [publication workflow](https://github.com/weaccelerateinc/accelerate/actions/runs/42701459566) passed on source `adb11920bf777c1eb04d5f7bf38dccfebf012ed0`. |
| Managed sandbox service | Canonical `https://accelerate-agent-sdk.vercel.app`, Ready deployment `dpl_HeiPKcnSLSmZc9ZYVDTHTRMMgpYV` on source `adb11920bf777c1eb04d5f7bf38dccfebf012ed0`. Build and `managed_checkout_migration_complete` succeeded. At **9 November 2026, 21:15:27 UTC**, `/healthz` returned HTTP 200 with `status: "ok"`; unauthenticated `/v1/connection` returned HTTP 401. These were deployment and read-only boundary checks. |

The order is managed service, SDK publication, then customer private-worker upgrade. Pause new private starts while upgrading every private ingress/host worker sharing persistence. Old workers cannot deserialize `private_phone_prompt` outbox items, even after delivery. Existing checkouts that started without wallet-phone negotiation keep their earlier behavior, but that does not make old host readers compatible with new outbox records. Prefer a forward fix after phone-v1 records exist; do not roll back to old readers while affected records remain readable. See [the phone contract and upgrade sequence](agentic-platforms.md#correct-a-wallet-phone-privately).

### Historical SDK 0.12.0 rollout

The following records describe the earlier SDK 0.12.0 and patched sandbox wallet rollout. Their deployment IDs and disabled run-browser merchant flag are historical observations, not current service identity or current admission policy:

| Component | Verified record |
| --- | --- |
| SDK release | npm `@weaccelerateinc/agent-sdk@0.12.0`; [release tag](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.12.0); source merge `12cf65b0a338f845ad9c966e491fc6ae438ec324`; archive SHA-256 `4a74b8532cb4d5055804a39a070783d29e52dff48d76f0d48fa35845268bc0e2`. Clean registry download, consumer imports, and release workflow `41739645592` passed. |
| Managed sandbox service | Vercel deployment `dpl_Bu89UfpQmSJwbupFKpHb5dmfbT4B`, Ready on SDK source `12cf65b0a338f845ad9c966e491fc6ae438ec324`; `/healthz` returned HTTP 200. Run-browser merchant flag is absent. Deployment reports migration `004_browser_run_claims.sql` as skipped; this does not establish the database ledger state. Apply and verify it before any admission. |
| Wallet MCP patched release | Deployment `dpl_EU66XRoDLt35K1iSZ8ECK4ppcEfP`, Ready on source `dfe6564373174e705f50ca2dc5286b625e7b0c56` (merged dependency update PR #22). Dependency audit reported zero findings. The full test run reported 1,136 passed and 258 skipped; the direct Next.js build passed. |
| Sandbox gateway and reaper | Sole active revisions `accelerate-wallet-agent-sbx--ccdfe6564373` and `accelerate-browser-reaper-sbx--ccdfe6564373`, healthy at one replica; image SHA-256 `18200b9598def05b5a4a677c532cc659c6d4acc53ac5beca4ef70df6ea5c218f`; fresh reaper epoch `702e0672-6fdb-4ea8-9425-90159657b0d7`. |
| Synthetic worker-loss retirement probe | In the reaper container, a child was killed with `SIGKILL`. A fresh acknowledgement, provider `404`, and database retirement were confirmed 29,441 ms before the 90-second deadline, without operator fallback. The post-probe check found zero non-closed leases and zero Kernel project browsers. The probe made no wallet, card, token, or payment calls. It did not independently inspect guest-profile removal. Source remains unqualified. |

These were sandbox release and operational observations. They did not establish real-store payment success, provider qualification, merchant form acceptance, WhatsApp provider qualification, or production readiness. No Dana merchant was enabled at that verification point. Production activation and financial release remain closed.

### Earlier customer-final-click deployment

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

The original demo fill/review baseline was narrower. The later sandbox report adds merchant evidence without retroactively qualifying a new provider or production purchase.

## Deploy a matching release

For SDK 0.17.0, Accelerate deployed the wallet gateway without the extension first, then the managed service, then published the SDK; see [the 0.17.0 record](#sdk-0170-release). Integrators only upgrade the package and make the code changes in [Upgrading from 0.16.1](agentic-platforms.md#upgrading-from-0161). Accelerate operators perform coordinated deployment when the service stack changes. For SDK 0.16.0, Accelerate deployed the managed service first, then the gateway without the Kernel provider, then published the SDK; see [the 0.16.0 record](#sdk-0160-release). For an upgrade from SDK 0.14.1 or earlier, also follow the private-worker sequence in [the 0.15.0 record](#sdk-0150-release). The steps below apply when changing the broader browser or customer-final-click stack. Production customer use must still complete approved onboarding and provider/payment acceptance.

1. Select reviewed SDK, managed-service, wallet-MCP, gateway, and reaper revisions. Record commits, image digests, configuration version, and test evidence. Publish the SDK only through its reviewed release process; a source version is not an available npm release.
2. Build the private worker with its pinned `playwright-core@1.62.1`, required native capture dependencies, and reviewed connector modules. Preserve isolated private evaluation; there is no merchant-main-world fallback.
3. Provision the managed service, authenticated MCP/bridge channels, durable stores, intended origin policy, and the same provider definitions in gateway and reaper. Apply required service migrations before traffic. Keep environment credentials in their secret managers.
4. Pause new admission and drain active payment sessions. Independently confirm that existing leases and provider resources are retired before replacing their owners. A gateway restart does not recover retained attempts.
5. Transfer reaper leadership using its controlled runbook. Require a fresh healthy poll and exact lease acknowledgements before reopening admission. Requalify worker-loss retirement; do not weaken freshness or overwrite leadership records to force readiness.
6. Verify exact-document admission, private verification, one fill, masked review delivery, cancellation, and independent cleanup on the actual provider and agreed merchant layouts. Use explicit fill-only purpose for a no-order test.
7. Qualify the new customer-final-click path separately. Before OTP, the service internally requires `customer_final_click_supported: true` for one top-level document with no iframes or shadow roots and card/address controls in that document. Quote inspection requires a simple USD total (a bare `$` reads as USD; a visible non-USD code rejects it); unique exact total/submit selectors are checked before credential fill. Exercise fresh private approval and readiness preflight before arming, one-use preparation, the at-most-10-second gateway window without late provider reads, exactly one customer-backend click, completion, expiry/failure handling, and retained restrictions. Verify that the completion token remains in the SDK orchestrator and never reaches the host. Existing iframe or shadow-root fills do not establish purchase support for those layouts.

For this first purchase flow, programmatic merchant `form.submit()` and `requestSubmit()` flows are unsupported. The gate compares the submit control's identity, tag, type, name, form, and disabled state; bound card/address native values and metadata; submit-form control inventory; exact total text; and URL. Unrelated banner/countdown text and button hover/focus class changes are allowed. Qualify those permitted changes as well as rejection of changed security bindings. The browser-clock probe must have a round trip of at most 500 ms and skew of at most 250 ms.

Initial admission also requires no active or registered origin service workers. CDP service-worker bypass provides an additional browser control. Include blocked non-main-frame/worker requests and new-page closure in acceptance tests. A new page makes the outcome `outcome_unknown`. Do not describe these browser/application controls as a provider firewall or WebRTC protection.

Also verify that arming keeps automatic payment requests blocked until the authorized click is admitted, permitted requests remain within the approved merchant/provider policy afterward, and caller disconnects do not prematurely close a browser under outcome observation. The click deadline must not exceed the original approval. Click-window expiry and private execution expiry are different limits; later observation cannot extend click authority. Early cancellation returns `final_click_in_progress`; keep observing the existing attempt without re-arming or retrying the click.

## Before production purchase use

Dashboard production access does not replace technical acceptance. Agree the provider, merchant layouts, supported payment flows, and success criteria with Accelerate. Verify the selected environment's credential provenance and fresh-CVV behavior, installed artifact bytes, correct field writes, final amount, private review receipt, customer approval, independent cleanup, and failure handling.

Purchase acceptance must also cover the customer-owned final click and an independently verified merchant order result. A click, redirect, `submit_attempted`, or caller assertion is not payment confirmation. Keep uncertain attempts restricted until reconciliation; do not retry a click or start a replacement purchase from an unknown result.

The recorded sandbox report leaves production payment qualification, real-store order completion, and parts of cleanup and installed-byte verification unresolved. A new controlled qualification must resolve the intended release's gaps. Do not infer acceptance from a synthetic smoke, generic connector interface, healthy deployment, or existing merchant screenshot.

Operator source references: [universal configuration and compatibility](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/universal-card-autofill.md#configuration-and-compatibility), [provider rollout](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/customer-browser-connectors.md#qualification-and-rollout), [gateway/reaper runbook](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/kernel-private-gateway.md#operator-configuration-and-hosting), and [managed-service deployment](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/docs/deployment.md). These repository references may require access from Accelerate.
