# Integration Modes

## Choosing a payment model

Accelerate offers two modes to execute payments: the handoff mode and the gateway mode. For the handoff mode, our frontend will pass a token or instrument credentials to your frontend. In gateway mode, your backend will call our backend as a proxy to your payment processor.

Handoff mode is the preferred and most common mode of integration with Accelerate. If you are unsure which mode is the best fit please reach out to your account manager to help decide.

### Handoff Mode

The Accelerate script will call `onPaymentInitiated` with the credentials you need to begin a payment flow. Your frontend will then use the result of that to create a payment -- typically this will be by passing the token or credentials to your backend to execute against your payment processor.

If you are already using Stripe Elements or an "iframe" integration from some other provider, this may be a very good fit for you since the token that these emit to your server will likely be the same token that we will emit. This means your backend integration will be almost identical to your standard flow.

### Gateway Mode

In the gateway mode Accelerate acts as a proxy between you and the processor for transactions that involve an Accelerate provided payment instrument. The call you make to us will be identical to the call you would have made to the processor except with our payment instrument id inserted where appropriate (the integration guides will go over this specifically for each processor).

Accelerate will use that identifier to inject the real card information during the execution of the call to the processor. This means your transaction may be executed using a network token or a full account number as appropriate.

The response you get will be the untampered response from the processor. You will then be responsible for handling the success/failure of the transaction. This mode is intended largely for merchants who were already handling raw card details on their server to execute transactions or who are using processors that don't provide convenient tokenization systems to limit card information to their iframes.

However, if done using Accelerate you will _not_ be subjected to any information within PCI scope -- you will only reference the cards by their Accelerate identifiers and never be exposed to the raw details.

## Choosing a frontend style

Choosing a frontend style for the Accelerate integration is a bit simpler: you simply will choose the mode you think fits better in your site's user experience. This is controlled by the `checkoutFlow` parameter to the `init` call of the Accelerate script.

### Inline

See [Example](https://github.com/weaccelerateinc/examples/blob/main/demos/app/integrated/page.tsx)

The inline flow will involve starting the AccelerateJS system to log the user in and then showing their wallet of cards within the elements of your existing checkout page. On the technical side, this is done by adding a div:

```
<div id="accelerate-wallet"/>
```

Once the user has logged in their wallet will be shown in an iframe on this div. For React users, please see AccelerateWallet.tsx in our React samples at: [Examples Repo](https://github.com/weaccelerateinc/examples).

This mode makes the user experience as seamless as possible while still providing all of the benefits of Accelerate. The callback `onPaymentInitiated` will be called with the credentials you need to begin checkout -- typically this is a payment processor token.

Your UI is responsible for the final "Pay Now" button presentation and handling.

### InlinePayment

See [Example](https://github.com/weaccelerateinc/examples/blob/main/demos/app/test/inline-payment/page.tsx)

This mode is similar to `Inline` mode except our UI will present a "Pay Now" button and allow the user to click it. The checkout page must then handle `onPaymentInitiated` as if it was the final step of the checkout and begin processing the payment.

### Modal

See [Example](https://github.com/weaccelerateinc/examples/blob/main/demos/app/modal/page.tsx)

The modal integration is for sites that don't wish to add any elements to their existing content to support the Accelerate wallet flow. The entire user experience will exist as an iframe that appears above your content until the user has selected a card. If they need to choose a new one, the modal will need to re-appear.

In handoff mode the call to `onPaymentInitiated` will be made when the modal is closed (user is done selecting a card) and this will include presentational details as well if you wish to show them a preview of the card they have selected. Alternatively, you may use the Accelerate wallet to show their selected card.
