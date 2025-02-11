import { NextRequest } from "next/server";

const secret = process.env.CHECKOUTDOTCOM_SECRET_KEY;

export async function POST(request: NextRequest) {
  const data = (await request.json()) as {
    processorToken: string;
    checkoutId: string;
  };

  // VALIDATE CART

  const res = await fetch("https://api.sandbox.checkout.com/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Cko-Idempotency-Key": "somevalue",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: {
        type: "token",
        token: data.processorToken,
      },
      processing_channel_id: "pc_77ajf2d465iedaihzr246qi4t4",
      amount: 6540,
      currency: "USD",
    }),
  });
  const json = (await res.json()) as { id: string };
  console.log(json);
  return Response.json({ status: "succeeded", token: json.id });
}
