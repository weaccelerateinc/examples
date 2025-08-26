import { NextRequest } from "next/server";
import { Stripe } from "stripe";

const stripeClient = new Stripe(process.env.PDP_STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const data = (await request.json()) as {
    processorToken: string;
    checkoutId: string;
  };

  console.log("Processing checkout for product:", data.checkoutId);

  // You should validate this intent matches the cart/product
  // const intent = await stripeClient.paymentIntents.retrieve(data.processorToken);
  // const product = await getProduct(data.checkoutId);
  // if (product.price != intent.amount) throw new Error("Price mismatch")
  //

  try {
    const confirmation = await stripeClient.paymentIntents.confirm(data.processorToken);

    // Log successful purchase for the specific product
    console.log(`Successfully processed payment for product ${data.checkoutId}:`, {
      status: confirmation.status,
      paymentIntentId: confirmation.id,
      amount: confirmation.amount,
    });

    return Response.json({
      status: confirmation.status,
      productId: data.checkoutId,
      paymentIntentId: confirmation.id,
    });
  } catch (error) {
    console.log("Payment confirmation failed for product:", data.checkoutId);
    console.log(JSON.stringify(error, null, 2));
    return Response.json({
      status: "failed",
      message: error instanceof Error ? error.message : "Unknown error",
      productId: data.checkoutId,
    });
  }
}
