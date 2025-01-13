# Frontend

Accelerate will act as JavaScript added to your checkout pages and if you are using an inline flow, we will also display the list of payment cards in an iframe at a location of your choosing.

Our JavaScript will give you several callback points to get data from Accelerate and attach a few useful functions to the window object if you need imperative access.

A script tag can be used to include our JavaScript:

In NextJS:

```jsx
<Script type="module" src={"https://js.weaccelerate.com/accelerate.js"} strategy="afterInteractive" />
```

In plain HTML:

```jsx
<script src="https://js.weaccelerate.com/accelerate.js" crossorigin="anonymous" type="module" />
```

## Initializing Accelerate

To initialize the Accelerate flow, a call must be made to the object our script attaches to the global window:

```
window.accelerate.init({
            merchantId: <<your merchant id>>,
            amount: <<amount in the cart in pennies USD>>,
            ...options
});
```

This function may be called again - only the last set of options it was called with will be used.

## Starting the login

After init is called we can then listen for various user inputs and decide when to start the Accelerate login flow. This is completely up to the checkout page to decide. In general, your page should wait for the user to finish entering details into the phone number, email, first name, and last name fields and then call login:

```
window.accelerate.login({
      firstName,
      lastName,
      email
      phoneNumber,
});
```

This will cause the Accelerate login modal to appear and the user will go through the Accelerate flow. The Accelerate engineering team can help implement this correctly if it is not clear where this should occur.

## Handling the callbacks

Once the Accelerate flow has started all state updates will be passed out in the form of callbacks. These are registered during the call to `init` above. Not all of them will be needed depending on how Accelerate has been integrated.

### onLoginSuccess

This callback is called when the user has finished going through the Accelerate login flow and either has an existing account or has created a new one with us. We will emit as many details about the user's account as we have -- these may be useful for autofilling in parts of the page that are still empty. The Stripe example repo shows how this can be used to autofill the address fields.

### onPaymentInitiated

This callback is called when the user has made a final selection for the Accelerate card they have decided to use. This is useful during inline flows where the payment flow should begin as soon as the user is done selecting their card.

### onCardSelected

This callback is called whenever the user has selected a new payment instrument. This is only called for cards that have been confirmed through the Accelerate flow. This is useful during flows where `onPaymentInitiated` may not be called and the only piece of information your integration needs is the card id.

## Other options in the init call

`checkoutMode` and `checkoutFlow` should both be provided - see [Modes](./Modes.md)

## Adding the Wallet iframe element

div handle

## Typescript

For TypeScript users, we publish a type definition to npm as part of the TODO_NPM_PACKAGE package. Simply install this at the version of the script you are including and use the included types as needed. It is recommended to attach the window API to the global via:

```jsx
declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}
```
