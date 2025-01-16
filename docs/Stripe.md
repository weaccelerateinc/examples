# Stripe

## Handoff Flow

The handoff flow is the most common integration flow with Accelerate and will likely be the most convenient. If you are using Stripe Elements or some stripe-js that is creating a payment intent then Accelerate should plug into your system very easily.

For the Stripe handoff flow we are integrated into the payment intent api service. Our frontend will create an unconfirmed payment intent and pass the id of this object out to your frontend. Your frontend will then submit that payment intent id to your server to confirm. This is very similar to how Stripe Elements operates.

During the backend call to confirm you should perform all of the normal cart and stock verification that you would do — none of this will have happened yet. The confirmation of the intent is also when the user’s instrument will be charged so failure cases will need to be handled appropriately by your services.

Upon successful charging of the user’s card a webhook should be emitted to Accelerate to provide us direct first hand feedback that the transaction was successful.

## Gateway Flow

For the Stripe gateway flow we are also integrated on the payment intent api service. Your service will call the Stripe API proxied through our server:

```jsx
https://api.stripe.com/v1/payment_intents
becomes
https://prd.api.weaccelerate.com/v1/payment_intents
```

The payload will be exactly as you would have sent to Stripe except you will add the field:

```jsx
payment_method_data[card][number] = <payment card id your received from AccelerateJS>
```

The Stripe API libraries largely support proxy calls — their JavaScript client for example can execute proxied calls as such:

```jsx
const stripeClient = new Stripe("sk_YourStripeKey", {
  protocol: "https",
  host: "prd.api.weaccelerate.com",
});
```
