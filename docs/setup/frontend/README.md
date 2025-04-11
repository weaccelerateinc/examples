---
icon: coin-front
---

# Frontend

Accelerate will act as JavaScript added to your checkout pages and if you are using an inline flow, we will also display the list of payment cards in an iframe at a location of your choosing.

Our JavaScript will give you several callback points to get data from Accelerate and attach a few useful functions to the window object if you need imperative access.

A script tag can be used to include our JavaScript:

In NextJS:

```jsx
<Script type="module" src={"https://sbx.js.weaccelerate.com/accelerate.js"} strategy="afterInteractive" />
```

In plain HTML:

```jsx
<script src="https://sbx.js.weaccelerate.com/accelerate.js" crossorigin="anonymous" type="module" />
```

In production, use `https://js.weaccelerate.com/accelerate.js` for the script.

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

Example of calling accelerate.login on input blur event to ensure that the 2FA pop-up is displayed based on the user's input status.

```
                  <input
                    data-testid="first-name-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => {
                      maybeLogin(phoneNumber);
                    }}
                    placeholder="First name"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    data-testid="last-name-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => {
                      maybeLogin(phoneNumber);
                    }}
                    placeholder="Last name"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhone(tryFormatPhone(e.target.value));
                    maybeLogin(e?.target.value);
                  }}
                  placeholder="Phone number"
                  type="tel"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
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

`checkoutMode` and `checkoutFlow` should both be provided - see [Modes](../modes.md)

## Adding the Wallet iframe element

The Accelerate wallet will render as an iframe on your page if you have chosen an inline flow. To control where Accelerate renders simply add a div to your layout at the appropriate place:

```
<div id="accelerate-wallet"/>
```

The iframe will render as a child to this div.

## Typescript

For TypeScript users, we publish a type definition to npm as part of the `accelerate-js-types` package. Simply install this and use the included types as needed. It is recommended to attach the Accelerate API handle to the global window type via:

```jsx
import type { AccelerateWindowAPI } from "accelerate-js-types";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}
```
