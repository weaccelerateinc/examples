"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import type { AccelerateWindowAPI } from "accelerate-js-types";
import { CheckoutSummary } from "../checkout/CheckoutSummary";
import Image from "next/image";
import Link from "next/link";
import { AccelerateWallet } from "../../../components/AccelerateWallet";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get user information from URL params
  const address = searchParams.get("address") || "";
  const city = searchParams.get("city") || "";
  const state = searchParams.get("state") || "";
  const zip = searchParams.get("zip") || "";
  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const email = searchParams.get("email") || "";

  const defaultCardId = searchParams.get("defaultCardId");

  // Get product information from URL params
  const productId = searchParams.get("productId") || "";
  const productTitle = searchParams.get("productTitle") || "";
  // Hardcode product price to $0.99
  const productPrice = 0.99;
  const variantId = searchParams.get("variantId") || "1";
  const variantTitle = searchParams.get("variantTitle") || "Standard";
  const quantity = parseInt(searchParams.get("quantity") || "1");
  const productImage = searchParams.get("productImage") || "/shirt.avif";

  const [accelLoaded, setAccelerateLoaded] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [accelerateInitialized, setAccelerateInitialized] = useState(false);

  useEffect(() => {
    console.log("Form data updated:", {
      address,
      city,
      state,
      zip,
    });
  }, [address, city, state, zip]);

  // Reinitialize Accelerate when needed
  useEffect(() => {
    if (accelLoaded && accelerateInitialized && typeof window.accelerate !== "undefined") {
      // Hardcode the amount to $0.99 for testing
      const hardcodedAmount = 0.99;

      console.log("Reinitializing Accelerate with hardcoded amount:", hardcodedAmount);
      window.accelerate.init({
        amount: Math.round(hardcodedAmount * 100), // Convert to cents (99 cents)
        merchantId: process.env.NEXT_PUBLIC_PDP_MERCHANT_ID!,
        checkoutFlow: "Inline",
        checkoutMode: "StripeToken",
        universalAuth: true,
        onLoginSuccess: (user) => {
          console.log("Accelerate user logged in", { user });
        },
        onCardSelected: (cardId) => {
          setSelectedCard(cardId);
        },
      });
    }
  }, [accelLoaded, accelerateInitialized, productPrice, quantity]);

  console.log({
    selectedPayment,
    accelLoaded,
  });

  const handleSubmit = async (e: FormEvent) => {
    console.log("EVENT", e);
    e.preventDefault();
    if (selectedCard) {
      const card = await window.accelerate.requestSource(selectedCard);
      if ("status" in card) {
        console.log("Error", { card });
        return;
      }
      console.log({ card: JSON.stringify(card) });

      // Call the PDP confirm API
      const confirmIntent = await fetch("/api/pdp/confirm", {
        method: "POST",
        body: JSON.stringify({
          processorToken: card.processorToken,
          checkoutId: productId,
          line_item: {
            product_id: productId,
            variant_id: variantId,
          },
          customer: {
            firstName,
            lastName,
            email,
            phone: searchParams.get("phone") || "",
          },
          shipTo: {
            name: `${firstName} ${lastName}`,
            address: {
              line1: address,
              city: city,
              state: state,
              postal_code: zip,
            },
          },
        }),
      });

      const res = (await confirmIntent.json()) as { status: string; message?: string };
      if (res.status === "succeeded") {
        router.push(
          `/pdp2/payment/confirmation?` +
            `firstName=${encodeURIComponent(firstName)}&` +
            `lastName=${encodeURIComponent(lastName)}&` +
            `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
            `address=${encodeURIComponent(address)}&` +
            `city=${encodeURIComponent(city)}&` +
            `state=${encodeURIComponent(state)}&` +
            `zip=${encodeURIComponent(zip)}&` +
            `shipping=standard&` +
            `cardLast4=${encodeURIComponent(card?.details?.mask || "")}&` +
            `totalPrice=${encodeURIComponent(totalPrice)}&` +
            `productId=${encodeURIComponent(productId)}&` +
            `productTitle=${encodeURIComponent(productTitle)}&` +
            `variantTitle=${encodeURIComponent(variantTitle)}&` +
            `quantity=${encodeURIComponent(quantity)}&` +
            `productImage=${encodeURIComponent(productImage)}`
        );
      } else {
        console.error(res.message || "Unknown error");
      }
    } else {
      return;
    }
  };

  return (
    <div className="flex overflow-hidden flex-col bg-white">
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <Link href="/pdp2" className="flex gap-3 items-center hover:opacity-80 transition-opacity">
              <span className="text-3xl font-black text-blue-500">
                <Image src="/baggslogo.svg" alt="Accelerate Swag Store Logo" width={30} height={30} />
              </span>
              <span className="text-2xl font-bold tracking-tighter text-stone-950">Accelerate Swag Store</span>
            </Link>
            <Image src="/checkoutbag.svg" alt="Checkout Bag" className="h-6 w-6" width={30} height={30} />
          </div>
        </div>
      </header>

      <main className="flex flex-wrap md:flex-nowrap md:flex-row-reverse justify-center w-full max-w-7xl mx-auto">
        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[520px] md:border-l border-neutral-200">
          <CheckoutSummary
            productImage={productImage}
            productTitle={productTitle}
            variantTitle={variantTitle}
            productPrice={productPrice}
            quantity={quantity}
            onTotalChange={(total: number) => {
              setTotalPrice(total);
              return true;
            }}
          />
        </section>

        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[659px]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Shipping Information</h3>
              <div className="space-y-3.5">
                <input
                  value={address}
                  placeholder="Address"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  readOnly
                />
                <input
                  placeholder="Apartments, suite, etc (optional)"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <div className="flex flex-wrap gap-3.5">
                  <input
                    value={city}
                    placeholder="City"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                    readOnly
                  />
                  <input
                    value={state}
                    placeholder="State"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                    readOnly
                  />
                  <input
                    value={zip}
                    placeholder="Zip code"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-4">Shipping Method</h3>
              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <div className="flex gap-3 p-3.5">
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-sky-700 bg-sky-700"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Standard Shipping</div>
                    <div className="text-sm text-neutral-500">4-10 business days</div>
                  </div>
                  <div className="text-sm">FREE</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-1.5">Payment</h3>
              <p className="text-sm text-neutral-500 mb-3.5">All transactions are secure and encrypted</p>

              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <div className="p-3.5 border-b border-neutral-200">
                  <label className="flex gap-3 items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={selectedPayment === "card"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-[18px] h-[18px] rounded-full border-2 ${
                        selectedPayment === "card" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm">Credit card</div>
                    </div>
                    <div className="flex gap-2">
                      <Image src="/visa.svg" alt="Visa" className="h-[21px]" width={31} height={31} />
                      <Image src="/mastercard.svg" alt="Mastercard" className="h-[21px]" width={31} height={31} />
                      <Image src="/amex.svg" alt="Amex" className="h-[21px]" width={31} height={31} />
                    </div>
                  </label>
                  {selectedPayment === "card" && accelLoaded && (
                    <div className="mt-4 w-full">
                      <AccelerateWallet defaultCardId={defaultCardId || undefined} />
                    </div>
                  )}
                </div>

                <label className="flex gap-3 p-3.5 border-b border-neutral-200">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={selectedPayment === "paypal"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-2 ${
                      selectedPayment === "paypal" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm">PayPal</div>
                  </div>
                  <Image src="/paypal.svg" alt="PayPal" className="h-[21px]" width={51} height={51} />
                </label>

                <label className="flex gap-3 p-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="zip"
                    checked={selectedPayment === "zip"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-2 ${
                      selectedPayment === "zip" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm">Zip - Pay in 4 installments</div>
                  </div>
                  <Image src="/zip.svg" alt="Zip" className="h-[21px]" width={51} height={51} />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedCard}
              className="w-full h-[56px] text-xl font-semibold text-white bg-sky-700 disabled:bg-sky-700/50 rounded-md"
            >
              Pay now
            </button>
            <Link
              href="/pdp2"
              className="w-full h-[56px] text-xl font-semibold text-sky-700 bg-white border-2 border-sky-700 hover:bg-sky-50 rounded-md flex items-center justify-center transition-colors"
            >
              Back to Products
            </Link>
          </form>

          <footer className="flex flex-wrap gap-3.5 py-5 mt-8 text-sm text-sky-600 border-t border-neutral-200">
            <a href="https://www.weaccelerate.com/privacy" className="hover:underline">
              Privacy policy
            </a>
            <a href="https://www.weaccelerate.com/terms" className="hover:underline">
              Terms of service
            </a>
          </footer>
        </section>
      </main>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("pdp2-payment.onReady");
          // Hardcode the amount to $0.99 for testing
          const hardcodedAmount = 0.99;

          window.accelerate.init({
            amount: Math.round(hardcodedAmount * 100), // Convert to cents (99 cents)
            merchantId: process.env.NEXT_PUBLIC_PDP_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            universalAuth: true,
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in", { user });
            },
            onCardSelected: (cardId) => {
              setSelectedCard(cardId);
            },
          });
          setAccelerateLoaded(true);
          setAccelerateInitialized(true);
        }}
      />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
