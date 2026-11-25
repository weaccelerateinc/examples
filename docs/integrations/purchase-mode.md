---
description: Configure the customer's final click, test without an order, and understand which checkout pages Accelerate supports.
---

# Purchase mode and checkout support

The customer's agent makes the final payment click through its own browser connection. Accelerate verifies the shopper, fills the payment form, sends the masked review, and checks the customer's approval. Your trusted browser host then sends one authorized click. Accelerate never clicks submit and never presses Enter.

Each checkout has one of two purposes:

| Purpose | Behavior |
| --- | --- |
| `purchase` | After the customer approves, the customer's agent clicks the order button. This can place a real order. |
| `sandbox_fill_only` | Accelerate fills the form and sends an informational review. Submission is disabled. The checkout ends with cancellation and cleanup. |

## Configure a purchase

Purchase registration requires:

- `profile: 'managed_review_v2'`
- `purpose: 'purchase'` and `enableSubmit: true`
- A browser host that implements `performFinalClick`. See [Browser connector interface](browser-connector-interface.md#customer-final-click).

Every purchase uses an owned existing browser with `custody_mode: 'customer_backend_trusted'`, `interaction_mode: 'chat'`, `approval_policy: 'after_fill'`, and `final_click_actor: 'customer'`.

The generated starter reads these server settings:

```dotenv
ACCELERATE_STARTER_MODE=live
ACCELERATE_CHECKOUT_PROFILE=managed_review_v2
ACCELERATE_STARTER_PURPOSE=purchase
ACCELERATE_ENABLE_PURCHASE_SUBMIT=true
ACCELERATE_CONTEXT_MODULE=/absolute/protected/partner-host.mjs
```

`live` selects real backend dependencies. It does not select the production wallet. The starter does not load `.env` automatically. Export the values through your deployment configuration, or load the file explicitly, for example `node --env-file=.env server.mjs`.

The registration purpose is a default. The agent can pass `purpose` on `accelerate_checkout_start` for each checkout. `registerPartnerCheckoutTools` defaults to `purpose: 'sandbox_fill_only'` and `enableSubmit: false`. Set both values explicitly. Without `enableSubmit: true`, the agent has no submit tool. A purchase always requires `performFinalClick`.

## Approval and the final click

A purchase requires all of these, in order:

1. Private shopper verification.
2. An exact quote and revision.
3. Fresh CVV verification and one successful fill.
4. Delivery of the masked review, with the provider's sent receipt.
5. The customer's yes, within five minutes of that receipt.

Then the agent calls `accelerate_checkout_submit` with `{ checkout_id, revision }`. Inside the durable owned-checkout lock, the SDK runs these steps once:

1. **Prepare.** `browserConnector.prepareFinalClick` checks the fenced document and the live browser before anything is armed. It returns a one-use preparation that is valid for at most 60 seconds. If preparation fails, nothing is armed.
2. **Arm.** The SDK arms the approved revision through Accelerate's private final-click API. The response contains an opaque `arm_id` and the click target.
3. **Click.** The SDK consumes the preparation and calls your `performFinalClick` once, with the exact document, submit selector, and deadline. Your host never receives `arm_id`.
4. **Complete.** The SDK completes the arm and Accelerate starts cleanup.

The click window is at most 10 seconds and never extends past the original approval. Arming does not release payment network requests. Only the one authorized click opens the restricted merchant and payment-provider requests.

Your `performFinalClick` must:

- Send one trusted pointer click on the bound submit control, in the exact browser, document, and URL.
- Finish before the returned deadline.
- Not read credential fields, lift the ordinary automation restriction, or retry the click.

## Direct HTTP final-click API

HTTP integrations run the same steps in backend handlers. The calls use the same headers as the [checkout API](agentic-platforms.md#http-api-integrate-without-the-sdk). Never expose an arm or a click target to the model.

```http
POST /v1/checkouts/{id}/final-click/arm
Content-Type: application/json

{"revision": 3}
```

The response contains `arm_id`, `armed_expires_at`, and `target: { checkout_url, submit_selector }`, with `retry_safe: false` and `payment_confirmed: false`. Always honor the returned expiry. Check browser readiness before this call. Pass only the target and deadline to your click code. Keep `arm_id` for completion.

```http
POST /v1/checkouts/{id}/final-click/complete
Content-Type: application/json

{"revision": 3, "arm_id": "OPAQUE_ARM_FROM_THE_ARM_RESPONSE"}
```

Completion returns the checkout status: `submit_attempted` or `outcome_unknown`. Only `submit_attempted` includes `submit_actor: 'customer'`. Neither status confirms an order. Check the merchant's order system and [record the result](agentic-platforms.md#record-the-merchants-result).

Failure handling:

- An explicit refusal before the arm, such as `approval_required`, `revision_conflict`, or `checkout_expired`, returns that error. Nothing is armed.
- Any unclear arm failure (transport error, timeout, or unexpected response) becomes `outcome_unknown`. Do not click.
- After a successful arm, call completion once, even if your click code failed or did not click. Completion only observes. It does not authorize another click.
- If completion fails, treat the attempt as `outcome_unknown`. Keep the restriction. Do not re-arm, click again, or start a replacement checkout.
- Cancellation during the click window or the observation period after it returns 409 `final_click_in_progress`. Keep observing through completion or status.

`POST /v1/checkouts/{id}/submit` is closed. It returns 403 `customer_click_required`.

## Test without an order

```dotenv
ACCELERATE_STARTER_PURPOSE=sandbox_fill_only
ACCELERATE_ENABLE_PURCHASE_SUBMIT=false
```

Fill-only permanently disables submission for that checkout. It sends an informational review and ends through cancellation and cleanup. An explicit `enableSubmit: true` with fill-only is rejected. The agent can also select `purpose: 'sandbox_fill_only'` for one checkout.

You cannot change a fill-only checkout into a purchase. For a purchase, start a new checkout after cleanup is confirmed.

See [Test in sandbox](agentic-platforms.md#7-test-in-sandbox) for test wallets and the safe test checkout page.

## Supported checkout pages

Accelerate inspects the actual HTTPS payment page before it sends any OTP. There is no merchant allowlist. A page is admitted when Accelerate finds one unambiguous set of card controls and can produce a safe masked review. If the page is not supported, the checkout returns `checkout_unsupported` before any private step.

Admission binds the exact checkout URL, including query and fragment, and the checkout purpose. A changed document, ambiguous controls, an unsupported frame, a missing review capability, or too little browser lifetime stops admission.

### Fill support

Accelerate fills card controls in the checkout document and in permitted payment-provider frames. If it finds two controls for the same value, it types nothing and returns `checkout_unsupported` with reason `card_form_ambiguous`.

### Purchase support

A purchase has stricter page requirements than a fill-only test. Accelerate checks them before any OTP:

- One top-level document, with no iframes or shadow roots. Card and address controls are in that document.
- A simple total in USD that equals the approved amount. A bare `$` total is read as USD. A visible non-USD currency code rejects the total.
- Unique, exact total and submit selectors.
- No active or registered service worker for the page's origin.
- A normal submit button. Merchant flows that submit through `form.submit()` or `requestSubmit()` are not supported.
- A browser-clock round trip of at most 500 ms and clock skew of at most 250 ms.

Between approval and the click, Accelerate checks that the submit control, the filled card and address values, the form's controls, the total text, and the URL did not change. Unrelated banner or countdown text and hover or focus style changes are allowed.

During the click, requests from other frames and workers are blocked. A new page is closed and the outcome becomes `outcome_unknown`. These are browser controls. They are not a network firewall or WebRTC protection.

These are the current purchase requirements. Fill support for iframe or shadow-root layouts does not qualify those layouts for a purchase.

## Before production purchases

Agree the browser provider, merchant checkouts, payment flows, and success criteria with Accelerate. Qualification covers:

- Correct field writes, the final amount, the private review receipt, and customer approval.
- The customer's final click and an independently verified merchant order.
- Independent cleanup and failure handling.

A click, a redirect, `submit_attempted`, or your own assertion is not payment confirmation. Keep uncertain attempts restricted until you reconcile them. Do not retry a click or start a replacement purchase after an unknown result.

See [Private CVV and credential delivery](agentic-platforms-private-payments.md) for the data path.
