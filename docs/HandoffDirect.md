# Handoff flow for direct processing

If you are already PCI compliant and are able to accept raw credentials, Accelerate can offer you direct credentials as part of the handoff. This will mean that after a user selects their payment device you will be passed the full account number or a network token if we have one on file. When initializing the frontend library for Accelerate, use:

```
checkoutMode: "Direct"
```

![Direct handoff diagram](handoff_direct.png)

Accelerate will vault all user card credentials for further use and create network tokens with the appropriate network processors when available.

The downstream use of the credentials are completely up to your service to handle -- authorization, capture, and reporting. Upon successful charging of the user’s card a webhook must be emitted to Accelerate to provide us direct first hand feedback that the transaction was successful.
