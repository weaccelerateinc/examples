---
icon: vial-virus
---

# Testing

Test your integration in the Accelerate sandbox before you go live. Sandbox wallets hold test cards only, and logging in with a sandbox test phone number uses a fixed code instead of an SMS.

## Sandbox endpoints

Load the sandbox script instead of the production one:

```html
<script src="https://sbx.js.weaccelerate.com/accelerate.js" crossorigin="anonymous" type="module"></script>
```

Send any API or proxy calls you make to Accelerate to the sandbox API:

```
https://sbx.api.weaccelerate.com
```

## Test shoppers

Create a test shopper with cards already in their wallet. In the merchant dashboard, use the sandbox **Test wallets** page, or call `POST /sandbox/test-wallets` as the merchant dashboard admin. See [Testing in sandbox](../integrations/one-time-authorization-token.md#testing-in-sandbox) for the request and response.

Log in to the sandbox wallet with the test shopper's phone number. The verification code is always `123123`, and no SMS is sent.

## Test card numbers

Use your payment processor's test card numbers. They are the same numbers that you would use to test the processor directly. The sandbox test wallet accepts test card numbers only.
