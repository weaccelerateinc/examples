import { NextRequest } from "next/server";
import { Stripe } from "stripe";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const data = (await request.json()) as {
    processorToken: string;
    checkoutId: string;
  };

  // You should validate this intent matches the cart
  // const intent = await stripeClient.paymentIntents.retrieve(data.processorToken);
  // const myCart = get_cart(checkoutId);
  // if (myCard.amount != intent.amount) throw new Error("Problems")
  //

  try {
    const confirmation = await stripeClient.paymentIntents.confirm(data.processorToken);
    return Response.json({ status: confirmation.status });
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Response.json({ status: "failed", message: (error as any)?.raw?.message || "Unknown error" });
  }
}
