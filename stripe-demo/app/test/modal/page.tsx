"use client";
import { FormEvent, useState } from "react";
import { stripeOptions } from "../../options";
import Script from "next/script";
import { useRouter } from "next/navigation";
import type { AccelerateWindowAPI, AccelerateUser, PaymentSource } from "accelerate-js-types";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

function tryFormatPhone(pn: string): string {
  if (pn.match(/\+1[0-9]{10}/)) {
    return pn.slice(2, 5) + "-" + pn.slice(5, 8) + "-" + pn.slice(8);
  }
  if (pn.match(/[0-9]{10}/)) {
    return pn.slice(0, 3) + "-" + pn.slice(3, 6) + "-" + pn.slice(6);
  }
  return pn;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [phoneNumber, setPhone] = useState(
    typeof window !== "undefined" && window.location.protocol === "http:" ? "512-123-1111" : ""
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [card, setCard] = useState<null | PaymentSource>(null);
  const [addrLine1, setAddrLine1] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrZip, setAddrZip] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const maybeUseAccelUser = (user: AccelerateUser) => {
    // Use the Accelerate user details to auto-fill your checkout
    if (user?.addresses[0]) {
      if (addrLine1 == "") {
        setAddrLine1(user.addresses[0].line1);
      }
      if (addrCity == "") {
        setAddrCity(user.addresses[0].city);
      }
      if (addrState == "") {
        setAddrState(user.addresses[0].state);
      }
      if (addrZip == "") {
        setAddrZip(user.addresses[0].postalCode);
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <pre>{JSON.stringify(stripeOptions, null, 2)}</pre>
      <div style={{ border: "green 2px solid", width: "100%" }}>
        {/* Show any error or success messages */}
        <div className="items-center gap-1 p-1">
          <div>Required Fields (existing need only Phone Number)</div>
          <div className="flex flex-row gap-1">
            <input
              data-testid="first-name-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
            />
            <input
              data-testid="last-name-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
            />
          </div>
          <div className="flex flex-row gap-1">
            <input
              value={phoneNumber}
              onChange={(e) => {
                setPhone(tryFormatPhone(e.target.value));
                window.accelerate.checkPhone(tryFormatPhone(e.target.value));
              }}
              placeholder="Phone Number"
              type="tel"
            />
          </div>
          <div>Optional</div>
          <input placeholder="Email" />
          <input placeholder="Address Line 1" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} />
          <div className="flex flex-row gap-1">
            <input placeholder="Address Line 2" />
            <input placeholder="City" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
          </div>
          <div className="flex flex-row gap-1">
            <input placeholder="State" value={addrState} onChange={(e) => setAddrState(e.target.value)} />
            <input placeholder="Zip" value={addrZip} onChange={(e) => setAddrZip(e.target.value)} />
          </div>
        </div>
      </div>
      <div id="payment-message" className="font-bold text-red-600">
        {errorMessage}
      </div>
      <pre>{JSON.stringify(card, null, 2)}</pre>
      <button
        onClick={() => {
          window.accelerate.login({
            firstName,
            lastName,
            phoneNumber,
          });
        }}
      >
        Force Accelerate Start
      </button>
      <button
        id="pay-now-btn"
        className="btn btn-blue"
        disabled={card === null}
        onClick={async () => {
          if (!card) return;
          const confirmIntent = await fetch("/api/confirm", {
            method: "POST",
            body: JSON.stringify({
              paymentIntentId: card.stripeTokenId,
              cartId: "some-cart",
            }),
          });
          const res = (await confirmIntent.json()) as { status: string; message?: string };
          if (res.status === "succeeded") {
            router.push("/completion?status=succeeded");
          } else {
            setErrorMessage(res.message || "Unknown error");
          }
        }}
      >
        Pay Now
      </button>
      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          window.accelerate.init({
            amount: stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
            checkoutFlow: "Modal",
            checkoutMode: "StripeToken",
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in", { user });
              maybeUseAccelUser(user);
            },
            onPaymentInitiated: async (source) => {
              setCard(source);
            },
          });
        }}
      />
    </form>
  );
}
