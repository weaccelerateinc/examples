---
description: Configure a customer-owned final click and distinguish purchase support from fill-only testing.
---

# Purchase mode and checkout support

The customer's agent performs the final payment click through its own browser connection. Accelerate verifies the shopper, fills the bound payment document, delivers the masked review, and checks fresh private approval. The agent's trusted browser host sends its one authorized click under the existing restriction. Accelerate fills the form; its executor and extension do not click.

**Release status:** **SDK 0.11.0 is published on npm**, with the matching stack deployed for the sandbox wallet environment. The [GitHub release](https://github.com/weaccelerateinc/accelerate/releases/tag/agent-sdk-v0.11.0) records source commit `dc30fdaf`. The separate real-money production stack is being provisioned. Neither a Vercel production deployment slot nor sandbox evidence establishes real-money production payment qualification. Coordinate provider and checkout acceptance with Accelerate before use.

`universal_card_v1` is the private form-admission contract. It has already been exercised in sandbox on real merchant checkout documents. It has no demo-hostname restriction and does not require fill-only purpose. This does not qualify every form for a purchase. See [Universal checkout rollout](universal-card-rollout.md).

## Versions and migration

| Version or integration | Behavior |
| --- | --- |
| Published SDK `0.10.3` | Its purchase switches select the older executor-submit contract. It cannot perform the new customer-final-click handshake. |
| `0.10.4` source change | Changes new existing-browser starter defaults to purchase. It does not add the customer final-click contract. |
| Published SDK `0.11.0` | Adds customer final-click orchestration through the agent's trusted browser host. The matching stack is deployed in sandbox; real-money production provisioning and qualification remain separate. |
| Already generated application | Keeps its copied runtime after an SDK package upgrade. Update its integration and host explicitly. |

In the new contract, the old direct executor-submit path is disabled. Accelerate-managed Kernel purchases are rejected at creation; its fill-only diagnostic remains a separate supported purpose. An old SDK or a new environment flag cannot restore the disabled purchase path. Keep old version documentation as historical behavior, not migration instructions.

## Configure an existing-browser purchase

The 0.11.0 starter uses these server settings:

```dotenv
ACCELERATE_STARTER_MODE=live
ACCELERATE_CHECKOUT_PROFILE=managed_review_v2
ACCELERATE_STARTER_PURPOSE=purchase
ACCELERATE_ENABLE_PURCHASE_SUBMIT=true
ACCELERATE_CONTEXT_MODULE=/absolute/protected/partner-host.mjs
```

`live` selects real backend dependencies. It does not select the production wallet environment. For real-money production, explicitly set `ACCELERATE_BASE_URL` to the validated production managed-service origin supplied by Accelerate, and use the approved Production key and Merchant ID. The canonical Vercel default is sandbox. Use the dashboard-generated add-card URL for that same approved Production environment. The separate production stack is still being provisioned.

The starter does not load `.env` automatically. Export the values through deployment configuration or load the file explicitly, for example with `node --env-file=.env server.mjs`.

Your context module must supply authenticated identity, durable ownership, private messaging, and a [browser connector host](browser-connector-interface.md) that can perform the final click. The purchase must use an owned existing browser with `custody_mode: 'customer_backend_trusted'`, `interaction_mode: 'chat'`, `approval_policy: 'after_fill'`, and `final_click_actor: 'customer'`.

Before OTP, the service internally requires a private gateway admission receipt with `customer_final_click_supported: true`. The initial release requires exactly one top-level document, no iframes, and no shadow roots, with card and address controls in that document. The service's public checkout exposes `final_click_actor: 'customer'`; it does not expose the private receipt. Quote inspection requires a simple total explicitly labelled USD and equal to the approved amount. Unique exact total and submit selectors are checked before credential fill. Existing iframe or shadow-root fill/review support does not qualify those layouts for this purchase flow.

Initial admission also rejects active or registered origin service workers. The gateway requests service-worker bypass through CDP as an additional browser control. During the initial click flow, non-main-frame and worker requests are blocked. A new page is closed and makes the outcome `outcome_unknown`. These controls do not establish a provider firewall or WebRTC protection.

Phase 1 also excludes merchant flows that call `form.submit()` or `requestSubmit()`. Those programmatic submissions are blocked; an observed attempt returns `outcome_unknown`.

The gate rechecks the bound submit control's identity, tag, type, name, form, and disabled state. It also checks native card/address values and metadata, the submit-form control inventory, exact total text, and URL. Unrelated banner or countdown text and button hover/focus class changes are allowed. The initial release also requires a browser-clock probe round trip of at most 500 ms and clock skew of at most 250 ms. These are current compatibility conditions, not broad merchant qualification.

## Approval and the final click

Purchase still requires private shopper verification, an exact quote and revision, fresh CVV verification, one successful bound fill, and delivery of the masked review with its actual provider receipt. The shopper must approve within the five-minute decision window.

The model-facing `accelerate_checkout_submit` tool orchestrates four backend operations inside the same durable owned-checkout lock and automation restriction:

1. Run `browserConnector.prepareFinalClick` to check the owned fenced document, live provider resource, and extension before opening a click window.
2. Arm the approved revision through Accelerate's private final-click API.
3. Consume the one-use preparation and invoke the platform's `BrowserConnectorHost.performFinalClick` implementation once through the platform's own browser connection.
4. Complete that arm through Accelerate and start cleanup.

The private preparation is valid for at most 60 seconds and remains bound to its connector, owner, and checkout. It does not require ten minutes of remaining browser lifetime. After arming, the connector performs local binding/deadline checks and calls the host without another provider or extension network read. The host receives the exact fenced document, target, and deadline; it never receives `arm_id`. Only the SDK orchestrator retains that completion token. See the [browser connector contract](browser-connector-interface.md#customer-final-click-in-sdk-0110).

The callback must preserve the checkout, browser, document, revision, and submit-target binding. It must not read credential fields, enable general browser tools, or retry the click. The gateway's click window is at most 10 seconds and cannot exceed the original approval deadline. Approval alone never sends a click. Arming does not release payment network requests; admission of the one authorized click opens the restricted merchant/provider request policy.

The extension's `automatic_submit: false` capability means that the extension does not click purchase. Under this contract, the Accelerate executor does not click purchase either. The platform's trusted browser backend performs the one authorized action requested by its agent.

## Direct HTTP final-click API

These calls use the same authenticated tenant and Merchant ID headers as the [checkout API](agentic-platforms.md#http-api-integrate-without-the-sdk). Keep their requests and responses in backend handlers. Do not expose an arm or browser target as a model tool result.

```http
POST /v1/checkouts/{id}/final-click/arm
Content-Type: application/json

{"revision": 3}
```

The response supplies an opaque `arm_id`, `armed_expires_at`, and `target: { checkout_url, submit_selector }`, with `retry_safe: false` and `payment_confirmed: false`. The gateway permits at most 10 seconds; always honor the returned expiry. Complete readiness preflight before this call. Pass only the exact document binding, target, and deadline to the trusted click callback. Retain `arm_id` in the orchestrator for completion; do not pass it to the browser host.

```http
POST /v1/checkouts/{id}/final-click/complete
Content-Type: application/json

{"revision": 3, "arm_id": "OPAQUE_ARM_FROM_THE_ARM_RESPONSE"}
```

Completion returns ordinary checkout status, `submit_attempted` or `outcome_unknown`. Only an attested `submit_attempted` result includes `submit_actor: 'customer'`. An armed or unknown checkout makes no such actor claim. The caller does not submit an assertion that a payment succeeded. A click acknowledgement, navigation, `submit_attempted`, or `outcome_unknown` is not an order confirmation. Resolve uncertainty through the merchant's independent order channel before another purchase.

If preparation fails, nothing is armed. An explicit refusal before the arm is consumed returns its ordinary error, such as `approval_required`, `revision_conflict`, or `checkout_expired`. Any ambiguous arm failure, including transport, timeout, schema, or upstream failure, becomes `outcome_unknown`; the host is never called.

After a successful arm, call completion once even if the host reports no dispatch or throws. Completion observes the existing attempt; it does not authorize or send another click. A completion failure also becomes `outcome_unknown`. Retain the restriction and reconcile the existing checkout. Do not automatically re-arm, click again, or create a replacement attempt.

The click window and outcome-observation lifetime are separate. The service sends a private `not_after` bound by the approval, submit, and workflow deadlines. The gateway also returns an authoritative private `execution_expires_at`, at least the click expiry and at most 30 seconds after arming. The service retains that observation deadline and strips it from the five-field SDK arm response.

After the click deadline, only outcome observation remains; it does not extend click or purchase authority. Click-window expiry does not immediately retire the browser. Cancellation during the retained execution period returns HTTP `409` with `final_click_in_progress`; a caller disconnect also does not immediately close it. Keep the restriction and observe the existing arm through completion or safe status. Do not treat cancellation failure or an expired click window as permission for another click.

## Select fill-only for a no-order test

```dotenv
ACCELERATE_STARTER_PURPOSE=sandbox_fill_only
ACCELERATE_ENABLE_PURCHASE_SUBMIT=false
```

Fill-only permanently disables submission for that checkout. It sends an informational review and ends through cancellation and cleanup. An explicit submit `true` with fill-only is rejected. Purchase purpose with explicit submit `false` can withhold the model's submit tool.

Changing configuration cannot convert an existing fill-only checkout into a purchase. Purpose belongs to its original admission and idempotency binding. After confirmed cleanup and resolution of uncertainty, use a separately authorized new purchase with a fresh owned browser and creation key.

See [Universal checkout rollout](universal-card-rollout.md) for sandbox evidence, provider enablement, deployment checks, and production qualification. See [Private CVV and credential delivery](agentic-platforms-private-payments.md) for the data path.
