import type { NextRequest } from "next/server";
import { Stripe } from "stripe";
import { rememberMeProducts } from "../../../pdp2/products";

interface ConfirmRequest {
  processorToken: string;
  checkoutId: string;
}

export async function POST(request: NextRequest) {
  let productId: string | undefined;

  try {
    const data = (await request.json()) as Partial<ConfirmRequest> | null;
    productId = typeof data?.checkoutId === "string" ? data.checkoutId : undefined;

    if (!rememberMeProducts.some((product) => product.id === productId)) {
      return Response.json({
        status: "failed",
        message: "Product is unavailable",
        productId,
      });
    }

    if (typeof data?.processorToken !== "string" || !data.processorToken.trim()) {
      return Response.json({
        status: "failed",
        message: "Payment token is required",
        productId,
      });
    }

    const stripeSecretKey = process.env.PDP_STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return Response.json({
        status: "failed",
        message: "Payment confirmation is not configured",
        productId,
      });
    }

    const stripeClient = new Stripe(stripeSecretKey);
    const intent = await stripeClient.paymentIntents.retrieve(data.processorToken);

    // Preserve the demo's price limits before confirming any payment.
    if (intent.amount < 98) {
      return Response.json({
        status: "failed",
        message: "Price error (too low)",
        productId,
      });
    }
    if (intent.amount > 200) {
      return Response.json({
        status: "failed",
        message: "Price error (too high)",
        productId,
      });
    }

    const confirmation = await stripeClient.paymentIntents.confirm(data.processorToken);

    console.log(`Processed payment for product ${productId}:`, {
      status: confirmation.status,
      paymentIntentId: confirmation.id,
      amount: confirmation.amount,
    });

    if (confirmation.status === "succeeded" && productId === "airpods") {
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (slackWebhookUrl) {
        try {
          const response = await fetch(slackWebhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: "<@U07RLVAE9CG> airpods purchase" }),
          });
          if (response.ok) {
            console.log("Slack notification sent for airpods purchase.");
          } else {
            console.error("Failed to send Slack notification:", response.statusText);
          }
        } catch (error) {
          console.error("Error sending Slack notification:", error);
        }
      } else {
        console.error("Slack webhook URL not configured");
      }
    }

    return Response.json({
      status: confirmation.status,
      productId,
      paymentIntentId: confirmation.id,
    });
  } catch (error) {
    console.error("Payment confirmation failed for product:", productId, error);
    return Response.json({
      status: "failed",
      message: error instanceof Error ? error.message : "Unknown error",
      productId,
    });
  }
}
