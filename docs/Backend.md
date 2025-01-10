# Backend

## Handoff Flow

The backend integration for Accelerate will depend on the integration method you’ve chosen. For the handoff flow your frontend will have received some type of token for your processor. This token should be passed to your backend to create the payment. Once created successfully a webhook should be sent to Accelerate to confirm with us that it was used and successful.

<TODO handoff diagram>

## Gateway Flow

For the gateway flow your frontend will only receive a payment card id from our iframe. This should be included in the proxy call to your processor to create the payment. You will receive the response from the processor directly. There is no need to send us a webhook for the gateway flow.

<TODO gateway diagram>
