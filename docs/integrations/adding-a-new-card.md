---
description: Let a shopper add a card through Accelerate's hosted wallet page, then continue the agent payment flow.
---

# Adding a new card

Use Accelerate's hosted add-card page when a shopper wants to add a payment card, or when the card they want is not in their wallet. You can send the shopper a link or embed the page in your customer-facing UI. Card entry stays in Accelerate's secure wallet fields, outside agent tools and ordinary chat.

Where possible, let the shopper add the card before the checkout starts private wallet verification. The verification then loads the shopper's current card list. The agent keeps the cart in its browser while the shopper adds the card.

The private card list also includes an **Add New Card** link. A shopper can add a card from there, then reply `refresh` to reload the list. See [Private messaging](private-messaging.md#private-prompts).

## Get the add-card link

Open **Agent payments** in the [Accelerate dashboard](https://dashboard.weaccelerate.com/agent-payments), select the environment, and copy **Add-card link**. The sandbox link has this form:

```text
https://accelerate-wallet-mcp.vercel.app/add-card?m=YOUR_MERCHANT_ID&env=sandbox
```

The production link uses the production wallet origin, `https://accelerate-wallet-mcp-prd.politemushroom-4a4cad1b.eastus2.azurecontainerapps.io`, your Production Merchant ID, and `env=production`. Accelerate supplies it during production onboarding.

| Parameter | Purpose |
| --- | --- |
| `m` | Your platform's Merchant ID. The page also accepts `merchantId`. |
| `env` | `sandbox` or `production`. Use the same environment as your payment integration. |
| `embed` | Optional. Set to `1` to render the page inside your UI. |

The link contains only the public Merchant ID and display settings. It contains no API key, shopper session, card data, or payment approval. The shopper authenticates on the hosted page.

### Generate the link through the API

Your backend can also request the link:

```sh
curl --fail-with-body --get \
  "https://accelerate-wallet-mcp.vercel.app/api/add-card-link" \
  --data-urlencode "m=$ACCELERATE_MERCHANT_ID" \
  --data-urlencode "env=sandbox"
```

This public `GET` route returns `{ url, merchantId, environment, embed }`. It validates the Merchant ID format and builds the URL. It does not authenticate a shopper, add a card, or create a checkout. Do not send your API key to this route.

## Shopper flow

1. **Open the hosted page.** Show it to the shopper in their own browser or in your UI. The agent must not operate or inspect the card-entry form.
2. **Verify identity.** The shopper enters their phone number. A new shopper also enters the name and email for their wallet. A valid existing session can resume. Otherwise, the shopper completes phone verification.
3. **Enter the OTP on the hosted page.** Do not ask the shopper to paste the code into agent chat.
4. **Select Add card.** If manual card entry is disabled for your Merchant ID, contact Accelerate.
5. **Enter the card in the secure fields.** The shopper enters the card number, expiry, and CVV, and any billing details that the wallet requests. Your page and agent tools never collect these values.
6. **Return to the conversation.** When the wallet confirms the card, the page shows **Card added** and tells the shopper to return to chat.

The add-card page does not charge the card, issue a payment token, or submit a merchant order.

## Embed the page

Append `&embed=1` to the link:

```html
<iframe
  src="https://accelerate-wallet-mcp.vercel.app/add-card?m=YOUR_MERCHANT_ID&amp;env=sandbox&amp;embed=1"
  title="Add a card to your Accelerate wallet"
  style="width: 100%; height: 680px; border: 0;"
></iframe>
```

The hosted page's framing policy must permit your application's origin. For production, ask Accelerate to add your origin to the allowed parent origins during onboarding. Keep the page on Accelerate's origin. Do not replace its secure fields with card inputs on your page, and do not read its DOM through agent automation.

## Continue the checkout

The page shows completion inside the hosted page. It does not send a `postMessage`, a webhook, or a redirect. Give the shopper a **Continue checkout** action in your application, or ask them to return to the conversation.

The completion screen follows the wallet's card selection. A shopper who selects an existing card can also reach it. If you need to know that a new card was created, check the authenticated wallet state.

Then continue the normal [payment flow](agentic-platforms.md#6-follow-the-payment-flow). The checkout verifies the shopper, loads the current masked cards, and collects a fresh CVV for that checkout.

Adding a card does not approve a purchase. A CVV entered on the add-card page does not authorize a checkout. Each checkout requires its own verification, masked review, customer approval, and final click.

## Active checkouts

A checkout that is already authenticated keeps the card list that it loaded. Adding a card on the hosted page does not change that list. A status read does not reload it.

If the shopper adds a card from the **Add New Card** link in the private card list, they reply `refresh` to reload the list in the same checkout.

In other cases, if the new card is not in the active checkout's choices, cancel that checkout and confirm cleanup. Then start a new checkout with a new idempotency key. Cancellation retires the checkout browser, so prepare the merchant checkout again in a fresh browser. Do not substitute a card ID or repeat a fill or submit.

If enrollment fails, let the shopper check their wallet and card list before they try again. Do not let the agent repeat card creation automatically.
