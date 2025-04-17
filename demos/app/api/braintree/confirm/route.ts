import { NextRequest } from "next/server";
import braintree from "braintree";

// See: https://sbx.api.weaccelerate.com/swagger/reporting/swagger.json for these definitions
type BTTransaction = {
  id: string;
  status: string;
  amount: string;
  processorResponseText: string;
};
type BraintreeReport = {
  accelerateToken: string;
  transaction: BTTransaction;
};

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
    amount: string;
  };

  // VALIDATE CART

  const result = await gateway.transaction.sale({
    amount: data.amount,
    paymentMethodNonce: data.processorToken,
  });

  // Report the result to Accelerate
  const reportBody: BraintreeReport = {
    accelerateToken: data.processorToken,
    transaction: {
      id: result.transaction.id,
      status: result.transaction.status,
      amount: result.transaction.amount,
      processorResponseText: result.transaction.processorResponseText,
    },
  };
  await fetch(`${process.env.ACCELERATE_SERVER_URL}/reporting/braintree`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.ACCELERATE_WH_KEY!,
    },
    body: JSON.stringify(reportBody),
  });

  return Response.json({ status: result.transaction.status, token: result.transaction.id });
}
