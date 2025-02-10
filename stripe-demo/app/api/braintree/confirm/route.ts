import { NextRequest } from "next/server";
import braintree from "braintree";

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANTID!,
  publicKey: process.env.BRAINTREE_PUBLICKEY!,
  privateKey: process.env.BRAINTREE_PRIVATEKEY!,
});

export async function POST(request: NextRequest) {
  const data = (await request.json()) as {
    processorToken: string;
    checkoutId: string;
  };

  // VALIDATE CART

  const result = await gateway.transaction.sale({
    amount: "10.00",
    paymentMethodNonce: data.processorToken,
    options: {
      submitForSettlement: true,
    },
  });

  return Response.json({ status: result.transaction.status, token: result.transaction.id });
}
