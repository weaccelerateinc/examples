# Braintree

## Handoff Flow

The handoff flow is the most common integration flow with Accelerate and will likely be the most convenient. When initializing the frontend library for Accelerate, use:

```
checkoutMode: "BraintreeNonce"
```

Our service utilizes Braintree's payment method nonce values to pass as tokens to be authorized. We create these using your api keys so they may be used directly. See the [Transaction.sale docs](https://developer.paypal.com/braintree/docs/reference/request/transaction/sale) for more information on using them.

![Braintree handoff diagram](../braintree_handoff.png)

[Braintree basic example frontend code](../../demos/app/test/braintree/inline-payment/page.tsx)\
[Braintree basic example backend code](../../demos/app/api/braintree/confirm/route.ts)

During the backend call to confirm you should perform all of the normal cart and stock verification that you would do — none of this will have happened yet. The call to transact using the nonce is also when the user’s instrument will be charged so failure cases will need to be handled appropriately by your services.

Upon successful charging of the user’s card a webhook should be emitted to Accelerate to provide us direct first hand feedback that the transaction was successful.

## Gateway Flow

Gateway flow for Braintree is not yet available. If this is required for an integration please contact our sales team.
