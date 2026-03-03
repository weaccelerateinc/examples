"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { Suspense, useState } from "react";
import { Shield, Loader2, Clock, CheckCircle, Code2, ChevronDown } from "lucide-react";
import { stripeOptions } from "../../../options";
import type { AccelerateWindowAPI } from "accelerate-js-types";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const email = searchParams.get("email") || "";
  const shippingAddress = searchParams.get("shippingAddress") || "";
  const shippingAddress2 = searchParams.get("shippingAddress2") || "";
  const shippingCity = searchParams.get("shippingCity") || "";
  const shippingState = searchParams.get("shippingState") || "";
  const shippingZip = searchParams.get("shippingZip") || "";
  const selectedCardId = searchParams.get("selectedCardId") || "";
  const cardLast4 = searchParams.get("cardLast4") || "";
  const cardBrand = searchParams.get("cardBrand") || "";
  const cardArtUrl = searchParams.get("cardArtUrl") || "";
  const worryFreeReturnsEnabled = searchParams.get("worryFreeReturns") === "1";

  const fullName = `${firstName} ${lastName}`.trim();
  const worryFreeReturnsCost = worryFreeReturnsEnabled ? 6.75 : 0;

  const shippingCost = 11.58;
  const salesTax = 10.92;
  const price = 150.0;
  const total = price + shippingCost + salesTax + worryFreeReturnsCost;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accelLoaded, setAccelerateLoaded] = useState(false);
  const [tokenCalloutExpanded, setTokenCalloutExpanded] = useState(true);

  const handleCompletePurchase = async () => {
    if (!selectedCardId) return;
    setIsSubmitting(true);
    try {
      const card = await window.accelerate.requestSource(selectedCardId);
      if ("status" in card) {
        setIsSubmitting(false);
        return;
      }
      router.push(
        `/SidelineSwap?purchased=true&` +
          `cardLast4=${encodeURIComponent(card?.details?.mask || "")}&` +
          `totalPrice=${encodeURIComponent(total)}`
      );
    } catch (error) {
      console.error("Payment error:", error);
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const deliveryStart = new Date(today);
  deliveryStart.setDate(today.getDate() + 4);
  const deliveryEnd = new Date(today);
  deliveryEnd.setDate(today.getDate() + 8);
  const formatDate = (d: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}${d.getDate() === 1 ? "st" : d.getDate() === 2 ? "nd" : d.getDate() === 3 ? "rd" : "th"}`;
  };

  return (
    <div className="min-h-screen w-screen bg-white ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Image
            src="/sidelineswap.svg"
            alt="SidelineSwap"
            width={180}
            height={40}
            className="h-8 w-auto"
          />
          <span className="text-sm text-gray-600 font-medium">Secure Checkout</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="order-2 lg:order-1 space-y-8">
            {/* Shipping Summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-900">Shipping</h2>
                <button
                  onClick={() => router.push("/SidelineSwap")}
                  className="text-sm text-[#2DB87D] hover:underline font-medium"
                >
                  Change
                </button>
              </div>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p>Contact: {email}</p>
                {fullName && <p>{fullName}</p>}
                {shippingAddress && <p>{shippingAddress}{shippingAddress2 ? ` ${shippingAddress2}` : ""}</p>}
                {(shippingCity || shippingState || shippingZip) && (
                  <p>{shippingCity}{shippingCity && shippingState ? ", " : ""}{shippingState}{(shippingCity || shippingState) && shippingZip ? ", US " : ""}{shippingZip}</p>
                )}
              </div>

              {/* Estimated Delivery */}
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">Estimated Delivery</p>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(deliveryStart)} - {formatDate(deliveryEnd)}</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Payment Method */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
                <button
                  onClick={() => router.back()}
                  className="text-sm text-[#2DB87D] hover:underline font-medium"
                >
                  Change
                </button>
              </div>

              {/* Balance */}
              <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">$0.00</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Apply Balance</span>
                  <div className="w-10 h-5 bg-gray-300 rounded-full relative cursor-not-allowed">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-5 flex justify-between">
                <span>Remaining Balance:</span>
                <span>$0.00</span>
              </p>

              {/* Worry-Free Returns */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">Worry-Free Returns</span>
                      <div className={`w-10 h-5 rounded-full relative ${worryFreeReturnsEnabled ? "bg-[#2DB87D]" : "bg-gray-300"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow ${worryFreeReturnsEnabled ? "left-[22px]" : "left-0.5"}`}></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">Worry-free returns from any seller within 7-days, for only ${worryFreeReturnsCost > 0 ? worryFreeReturnsCost.toFixed(2) : "4.91"}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="text-gray-400">☑</span> Item doesn&apos;t fit</span>
                      <span className="flex items-center gap-1"><span className="text-gray-400">☑</span> Dissatisfied with Items</span>
                      <span className="flex items-center gap-1"><span className="text-gray-400">☑</span> Arrived too late</span>
                      <span className="flex items-center gap-1"><span className="text-gray-400">☑</span> No longer needed</span>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="text-xs text-gray-500">Learn More about <span className="font-semibold">seel</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Card Display */}
              {selectedCardId && (
                <div className="flex items-center gap-3 py-3">
                  {cardArtUrl ? (
                    <img src={cardArtUrl} alt={cardBrand || "Card"} className="h-7 w-auto rounded" />
                  ) : (
                    <Image src="/visa.svg" alt="Visa" width={36} height={24} className="h-6 w-auto border border-gray-200 rounded" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {cardBrand ? `${cardBrand} ` : ""}ending in ••••{cardLast4}
                    </p>
                  </div>
                </div>
              )}

              {/* requestSource Tokenization Callout */}
              <div className="mt-4 border border-blue-200 bg-blue-50 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTokenCalloutExpanded(!tokenCalloutExpanded)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-700" />
                    <span className="text-[13px] font-semibold text-blue-900">Accelerate: Tokenize &amp; Complete Purchase</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${tokenCalloutExpanded ? "rotate-180" : ""}`} />
                </button>
                {tokenCalloutExpanded && (
                  <div className="px-4 py-3 text-[12px] text-blue-900 space-y-2">
                    <p>
                      When the customer clicks <strong>&quot;Complete Purchase&quot;</strong>, call{" "}
                      <code className="bg-blue-100 px-1 rounded text-[11px]">accelerate.requestSource(cardId)</code> with the tokenized card ID
                      from the wallet selection. Accelerate returns a Braintree nonce that you pass
                      to your payment processor to charge the card.
                    </p>
                    <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                      <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`async function handleCompletePurchase() {
  setIsSubmitting(true);
  try {
    // Request a payment source from Accelerate
    const card = await window.accelerate
      .requestSource(selectedCardId);

    // Check for errors (e.g. card declined, 3DS failure)
    if ("status" in card) {
      // Handle error — show message to customer
      setIsSubmitting(false);
      return;
    }

    // card.details contains:
    //   .mask  — last 4 digits (e.g. "4705")
    //   .token — Braintree nonce

    // Pass the token to your backend to process payment
    // await chargeCard(card.details.token, totalAmount);

    // Navigate to success page
    router.push("/success?totalPrice=" + total);
  } catch (error) {
    console.error("Payment error:", error);
    setIsSubmitting(false);
  }
}`}
                      </pre>
                    </div>
                    <div className="bg-blue-100/50 rounded p-2.5 text-[11px] text-blue-800 space-y-1">
                      <p><strong>checkoutMode: BraintreeNonce</strong></p>
                      <p>&bull; Returns a nonce you pass to <code className="bg-blue-100 px-1 rounded">gateway.transaction.sale()</code></p>
                      <p className="mt-1"><strong>No card data on your servers:</strong> The token is single-use and processor-specific. Your backend never sees raw card numbers.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit order-1 lg:order-2">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Seller */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-sm text-gray-700">
                  Sold by <span className="font-semibold">ThePlayersCloset</span>
                </p>
              </div>

              {/* Product */}
              <div className="px-4 py-4 flex gap-3 border-b border-gray-200">
                <div className="w-16 h-16 rounded border border-gray-200 flex-shrink-0 overflow-hidden bg-gray-50">
                  <Image
                    src="/jordan-1-low-fragment-design-x-travis-scott-1.jpg"
                    alt="Product"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-tight">
                    Selkirk Luxx Control Air Epic - 1st generation - Ultimate Control & Spin
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">${price.toFixed(2)}</p>
              </div>

              {/* Price Breakdown */}
              <div className="px-4 py-3 space-y-2 border-b border-gray-200 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Price</span>
                  <span className="text-gray-900">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Shipping</span>
                  <span className="text-gray-900">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">CA Sales Tax</span>
                  <span className="text-gray-900">${salesTax.toFixed(2)}</span>
                </div>
                {worryFreeReturnsCost > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Worry-Free Returns</span>
                    <span className="text-gray-900">${worryFreeReturnsCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">${total.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Complete Purchase Button */}
              <div className="px-4 py-3 border-b border-gray-200">
                <button
                  onClick={handleCompletePurchase}
                  disabled={isSubmitting || !accelLoaded}
                  className="w-full py-3 rounded text-sm font-semibold text-white bg-gray-800 hover:bg-gray-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Complete Purchase"
                  )}
                </button>
              </div>

              {/* Buyer Protection */}
              <div className="px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#2DB87D] flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Shop Safely with SidelineSwap Buyer Protection
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          window.accelerate.init({
            amount: stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            universalAuth: true,
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in", { user });
            },
            onCardSelected: () => {},
          });
          setAccelerateLoaded(true);
        }}
      />
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
