import { NextRequest } from "next/server";
import { Stripe } from "stripe";

const stripeClient = new Stripe(process.env.STRIPE_PRIVATE_KEY!, {
  // Proxy to Accelerate here
  protocol: "http",
  host: "localhost",
  port: 5180,
});

export async function POST(request: NextRequest) {
  // Your POST payload goes here, can be anything as long as the card id is present
  const data = (await request.json()) as {
    currency: "usd";
    amount: number;
    acceleratePaymentSourceId: string;
  };

  console.log({ data });

  //
  // Your cart logic goes here
  //

  const confirmation = await stripeClient.paymentIntents.create({
    currency: "usd",
    amount: 100,
    // Configuration for the proxied payment intent:
    confirm: true,
    payment_method_types: ["card"],
    automatic_payment_methods: {
      enabled: false,
    },
    // This payload will be replaced at proxy-time by Accelerate:
    payment_method_data: {
      type: "card",
      card: {
        number: data.acceleratePaymentSourceId, // Accelerate payment source id
        exp_month: 12, // Any month
        exp_year: 28, // Any year in the future
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, // The Stripe libraries do not include these parameters unfortunately
    //
  });
  return Response.json({ status: confirmation.status, id: confirmation.id });
}
