# Checkout.com

## Handoff Flow

The handoff flow is the most common integration flow with Accelerate and will likely be the most convenient. When initializing the frontend library for Accelerate, use:

```
checkoutMode: "CheckoutDotComToken"
```

Our service utilizes Checkout.coms's payment method tokens as vehicles for sensitive information. We create these using your api keys so they may be used directly. See the [Payment request documentation](https://api-reference.checkout.com/#operation/requestAPaymentOrPayout) for more information on using them.

![Checkout.com handoff diagram](../checkoutdotcom_handoff.png)

[Checkout.com basic example frontend code](../../demos/app/test/checkoutdotcom/inline-payment/page.tsx)\
[Checkout.com basic example backend code](../../demos/app/api/checkoutdotcom/confirm/route.ts)

During the backend call to confirm you should perform all of the normal cart and stock verification that you would do — none of this will have happened yet. The call to transact using the token is also when the user’s instrument will be charged so failure cases will need to be handled appropriately by your services.

Upon successful charging of the user’s card a webhook should be emitted to Accelerate to provide us direct first hand feedback that the transaction was successful.

## Gateway Flow

Gateway flow for Checkout.com is not yet available. If this is required for an integration please contact our sales team.
