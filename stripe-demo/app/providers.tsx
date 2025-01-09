"use client";
import { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

export const stripeOptions = {
  // passing the client secret obtained from the server
  // clientSecret: "{{CLIENT_SECRET}}",
  mode: "payment" as const,
  amount: 999,
  currency: "usd",
};

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      {children}
    </Elements>
  );
}
