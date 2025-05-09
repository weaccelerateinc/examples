import braintree from "braintree";

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANTID!,
  publicKey: process.env.BRAINTREE_PUBLICKEY!,
  privateKey: process.env.BRAINTREE_PRIVATEKEY!,
});

/**
 * Mock API route to get a client token; normally the integrating Merchant would be handling this
 * themselves
 */
export async function GET() {
  const result = await gateway.clientToken.generate({});

  return Response.json({ token: result.clientToken });
}
