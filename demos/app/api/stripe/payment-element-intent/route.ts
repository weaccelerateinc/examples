import { NextRequest } from "next/server";
import { Stripe } from "stripe";
import { stripeOptions } from "../../../options";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return Response.json(
      {
        status: "failed",
        message: "Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY or STRIPE_PUBLISHABLE_KEY to mount the Stripe Payment Element.",
      },
      { status: 500 }
    );
  }

  const data = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };

  try {
    const intent = await stripeClient.paymentIntents.create({
      amount: stripeOptions.amount,
      currency: stripeOptions.currency,
      payment_method_types: ["card", "link"],
      receipt_email: data.email || undefined,
      metadata: {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
      },
    });

    return Response.json({
      status: "created",
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      publishableKey,
    });
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    return Response.json(
      {
        status: "failed",
        message: error instanceof Error ? error.message : "Unable to create PaymentIntent",
      },
      { status: 500 }
    );
  }
}
