# Testing

To test the Accelerate integration you will use our sandbox environment. We will provide you with a test phone number to use as part of the modal login flow and the account this resolves to will have cards to test transactions with. Your merchant id will be the same for sandbox and production.

## Changed endpoints

There are a few changes to access our sandbox environment that are needed:

Include the script from our sandbox hosting:

```
<script TODO_HOSTING_URL>
```

Change any API or proxy calls you are making to Accelerate to

```
sbx.api.weaccelerate.com
```

## Test phone numbers

Test phone numbers are coming soon.

## Test card numbers

Test card numbers vary by processor, generally you will use the same card numbers that you would use for directly testing your payment processor.
