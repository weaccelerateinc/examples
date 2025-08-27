import { NextRequest } from "next/server";
import { Stripe } from "stripe";

const stripeClient = new Stripe(process.env.PDP_STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const data = (await request.json()) as {
    processorToken: string;
    checkoutId: string;
    line_item: {
      product_id: string;
      variant_id: string;
    };
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    shipTo: {
      name: string;
      address: {
        line1: string;
        city: string;
        state: string;
        postal_code: string;
      };
    };
  };

  console.log("Processing checkout for product:", data.checkoutId);

  // Some validation of the intent to make sure we dont accidentally charge
  // something crazy on our merch demo
  const intent = await stripeClient.paymentIntents.retrieve(data.processorToken);
  if (intent.amount < 98) {
    return Response.json({
      status: "failed",
      message: "Price error (too low)",
      productId: data.checkoutId,
    });
  }
  if (intent.amount > 200) {
    return Response.json({
      status: "failed",
      message: "Price error (too high)",
      productId: data.checkoutId,
    });
  }

  try {
    const confirmation = await stripeClient.paymentIntents.confirm(data.processorToken);

    // Log successful purchase for the specific product
    console.log(`Processed payment for product ${data.checkoutId}:`, {
      status: confirmation.status,
      paymentIntentId: confirmation.id,
      amount: confirmation.amount,
    });

    if (confirmation.status === "succeeded") {
      // Create Printify order
      const printifyApiToken = process.env.PDP_PRINTIFY_TOKEN;
      const shopId = 23936709;

      if (printifyApiToken) {
        try {
          const orderData = {
            external_id: confirmation.id, // Use Stripe payment intent ID as external reference
            label: `Order for ${data.shipTo.name}`,
            line_items: [
              {
                product_id: data.line_item.product_id,
                variant_id: parseInt(data.line_item.variant_id),
                quantity: 1,
              },
            ],
            shipping_method: 1, // Standard shipping
            is_printify_express: false,
            send_shipping_notification: true,
            address_to: {
              first_name: data.customer.firstName,
              last_name: data.customer.lastName,
              email: data.customer.email,
              phone: data.customer.phone,
              country: "US",
              region: data.shipTo.address.state,
              address1: data.shipTo.address.line1,
              city: data.shipTo.address.city,
              zip: data.shipTo.address.postal_code,
            },
          };

          console.log("Creating Printify order for product:", data.checkoutId);
          const printifyOrder = await fetch(`https://api.printify.com/v1/shops/${shopId}/orders.json`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${printifyApiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
          });

          if (printifyOrder.ok) {
            console.log("Printify order created successfully:", printifyOrder);
          } else {
            const errorText = await printifyOrder.text();
            console.error("Failed to create Printify order:", errorText);
          }
        } catch (printifyError) {
          console.error("Error creating Printify order:", printifyError);
        }
      } else {
        console.error("Printify API token not configured");
      }
    }
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
