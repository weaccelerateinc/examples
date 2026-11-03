---
description: Let a shopper add a card through Accelerate's existing hosted wallet, then continue the agent payment flow.
---

# Adding a new card

Use Accelerate's existing hosted add-card page when a shopper wants to add a payment card or the card they want is missing from their wallet. You can send the shopper a link or embed the page in your customer-facing UI. Card entry stays in Accelerate's secure wallet and VGS fields, outside agent tools and ordinary chat.

Prefer completing enrollment before starting the managed checkout's private wallet verification. This lets that verification load the shopper's current card list. Your agent can keep the shopping cart in its existing browser while the shopper adds a card separately.

## Get the add-card link

Open **Agent payments** in the [merchant dashboard](https://merchantdashboard-gamma.vercel.app/agent-payments), select the approved environment, and copy **Add-card link**. This example is for sandbox:

```text
https://accelerate-wallet-mcp.vercel.app/add-card?m=YOUR_MERCHANT_ID&env=sandbox
```

After production onboarding and qualification, obtain the approved Production link on `https://accelerate-wallet-mcp-prd.politemushroom-4a4cad1b.eastus2.azurecontainerapps.io`, with your Production Merchant ID and `env=production`. Use a dashboard-generated link only after Accelerate has configured that dashboard deployment for the production wallet origin. Production infrastructure is deployed, but customer onboarding, tenant activation, and financial release remain closed. The canonical Vercel wallet origin remains sandbox; changing only the environment parameter does not complete production onboarding.

The environment chooses wallet data, credentials, verification, and fill services. It does not select the merchant's payment processor. Use approved sandbox test data and synthetic or no-order checkout tests; submitting a real card to a live merchant can still create a real charge. See [Choose the wallet environment](agentic-platforms.md#choose-the-wallet-environment).

| Parameter | Purpose |
| --- | --- |
| `m` | Your platform's provisioned Merchant ID. The page also accepts `merchantId`. |
| `env` | `sandbox` or `production`. Use the same environment as the customer's wallet and payment integration. |
| `embed` | Optional `1` to render the page inside your UI. |

The link contains the public Merchant ID and presentation/environment settings. It contains no tenant API key, shopper session, card data, or payment approval. The shopper must authenticate on the hosted page.

### Generate the URL through the existing API

Your backend can also request the link from the wallet service. This example uses the sandbox origin and environment; an approved production integration uses the production wallet origin and `env=production`:

```sh
curl --fail-with-body --get \
  "https://accelerate-wallet-mcp.vercel.app/api/add-card-link" \
  --data-urlencode "m=$ACCELERATE_MERCHANT_ID" \
  --data-urlencode "env=sandbox"
```

This public `GET` route accepts the same parameters and returns `{ url, merchantId, environment, embed }`. It validates the Merchant ID format and constructs a URL. It does not authenticate a shopper, provision a merchant, add a card, or create a checkout. Do not send a tenant API key to construct this public link.

## Shopper flow

1. **Open the hosted page.** Show it to the shopper in their own browser or your customer-facing UI. The agent must not operate or inspect the card-entry form.
2. **Verify identity.** The shopper enters their phone number. New shoppers also supply the name and email needed to establish their wallet. A valid existing session may resume; otherwise the shopper completes phone verification.
3. **Enter the OTP on the hosted page.** This enrollment flow collects the code through Accelerate's UI. Do not ask the shopper to paste it into ordinary agent chat.
4. **Choose Add card in the wallet.** The wallet offers card addition according to the merchant's settings. If manual entry is disabled, contact Accelerate to confirm the permitted enrollment flow.
5. **Enter the card in the secure fields.** The shopper supplies the card number, expiry, and CVV, then completes any verification or billing information requested by the wallet. The wallet's VGS collection form submits through `/wallet/vgs-inbound`; your parent page and agent tools do not collect those raw fields.
6. **Complete enrollment and return.** After the hosted wallet confirms a card selection, the wrapper displays **Card added** and directs the shopper back to chat to continue checking out.

The page uses the existing web wallet with `checkoutMode: 'Direct'`, `checkoutFlow: 'Inline'`, and amount zero. It does not request Direct credentials, issue a payment token, or submit the merchant's order as part of this wrapper flow.

## Embed the page

Append `&embed=1` to the dashboard link:

```html
<iframe
  src="https://accelerate-wallet-mcp.vercel.app/add-card?m=YOUR_MERCHANT_ID&amp;env=sandbox&amp;embed=1"
  title="Add a card to your Accelerate wallet"
  style="width: 100%; height: 680px; border: 0;"
></iframe>
```

Use the origin configured for your deployment and ensure its frame-ancestor policy permits your application. Keep the hosted page on Accelerate's origin. Do not replace its secure fields with card inputs on the parent page or read its DOM through agent automation.

The production image currently permits framing only by its own origin and `https://accelerate-agent-sdk-prd.politemushroom-4a4cad1b.eastus2.azurecontainerapps.io`. Adding a customer's embedded parent origin requires an operator allowlist change and image rebuild. Top-level add-card links are separate from iframe permission. The sandbox Vercel framing policy is unchanged.

## Continue checkout after enrollment

The current wrapper displays completion inside the hosted page. It does not send a parent-window `postMessage`, completion webhook, or automatic return redirect. Provide a **Continue checkout** action in your application, or ask the shopper to return to the existing conversation after finishing.

The wrapper's completion screen is driven by the wallet's card-selection callback. Selecting an existing confirmed card can reach the same screen. If your application needs to distinguish a newly created card from an existing selection, reconcile the authenticated wallet state rather than treating that screen as a new-card creation receipt.

When enrollment happens before private checkout verification, continue the normal [agent payment flow](agentic-platforms.md#5-follow-the-payment-flow). Authenticate the same shopper, load their current masked card choices, select the intended card/address privately, verify the final merchant total, and collect fresh CVV for that exact checkout attempt.

Enrollment does not approve a purchase. A CVV entered while adding a card does not authorize a different managed checkout. The checkout must enforce its own verification, masked review, fresh customer approval, and separate final-submit action. See [Private CVV and credential delivery](agentic-platforms-private-payments.md).

## Existing checkout sessions

An already authenticated managed checkout keeps the card list loaded during its own wallet verification. Adding a card in the separate hosted page does not automatically refresh that list, and a safe status read does not reload the wallet.

If the new card is absent from an active checkout's choices, keep that checkout's ownership and uncertainty restrictions intact. Do not substitute a card ID, reuse enrollment verification, or repeat a fill or submit. Follow a controlled cancellation/re-entry flow with confirmed cleanup and resolution of uncertainty before starting another checkout.

Cancellation retires the existing checkout browser. Its cart cannot be resumed in that cancelled browser. A separately authorized new attempt requires a fresh owned browser and a new creation/idempotency key; prepare the merchant checkout again in that browser. Do not promise that closing the add-card page alone resumes an active payment with the new card.

For failures during enrollment, let the shopper review the existing hosted wallet and current card list before another submission. A missing confirmation or error is not permission for the agent to repeat card creation automatically.

Source references: [hosted add-card page](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/app/add-card/page.js), [link API](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/app/api/add-card-link/route.js), and [hosted wallet behavior](https://github.com/weaccelerateinc/accelerate-wallet-mcp/blob/main/docs/sdk-wallet.md).
