"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import type { AccelerateWindowAPI } from "accelerate-js-types";
import { CheckoutSummary } from "../checkout/CheckoutSummary";
import Image from "next/image";
import Link from "next/link";
import { AccelerateWallet } from "../../../components/AccelerateWallet";
import { Lock, Truck, Zap, CreditCard, ChevronDown, ChevronUp } from "lucide-react";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get user information from URL params
  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const email = searchParams.get("email") || "";

  // Billing address (from original checkout form, preserved and not editable)
  const billingAddress = searchParams.get("address") || "";
  const billingCity = searchParams.get("city") || "";
  const billingState = searchParams.get("state") || "";
  const billingZip = searchParams.get("zip") || "";

  // Shipping address (editable, initialized from URL params)
  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [zip, setZip] = useState(searchParams.get("zip") || "");

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
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(true);

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
          `/pdp/payment/confirmation?` +
            `firstName=${encodeURIComponent(firstName)}&` +
            `lastName=${encodeURIComponent(lastName)}&` +
            `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
            `shippingAddress=${encodeURIComponent(address)}&` +
            `${apartment ? `shippingApartment=${encodeURIComponent(apartment)}&` : ""}` +
            `shippingCity=${encodeURIComponent(city)}&` +
            `shippingState=${encodeURIComponent(state)}&` +
            `shippingZip=${encodeURIComponent(zip)}&` +
            `billingAddress=${encodeURIComponent(billingAddress)}&` +
            `billingCity=${encodeURIComponent(billingCity)}&` +
            `billingState=${encodeURIComponent(billingState)}&` +
            `billingZip=${encodeURIComponent(billingZip)}&` +
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
    <div className="min-h-screen w-screen bg-slate-100 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
          <Link href="/pdp" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative bg-white rounded-xl p-1.5 sm:p-2 shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <Image 
                  src="/avatar-black.png" 
                  alt="Accelerate Logo" 
                  width={40} 
                  height={40} 
                  className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">Accelerate Store</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Powered by Accelerate Checkout
              </span>
            </div>
          </Link>
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment</h1>
          <p className="text-slate-600">Complete your secure checkout</p>
        </div>
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12">
          <div className="space-y-8 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Shipping Information */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Shipping Address</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Street address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    type="text"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Shipping Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition border-2 border-blue-500 bg-blue-50">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard"
                      defaultChecked
                      className="sr-only"
                    />
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-slate-200">
                      <Truck className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">Standard Shipping</div>
                      <div className="text-sm text-slate-500">4-10 business days</div>
                    </div>
                    <div className="font-semibold text-green-600">FREE</div>
                  </label>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Payment Method</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Lock className="w-3 h-3" />
                    <span>Encrypted & Secure</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={selectedPayment === "card"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-slate-200">
                      <CreditCard className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 font-medium text-slate-900">Credit Card</div>
                    <div className="flex gap-2">
                      <Image src="/visa.svg" alt="Visa" className="h-[21px]" width={31} height={31} />
                      <Image src="/mastercard.svg" alt="Mastercard" className="h-[21px]" width={31} height={31} />
                      <Image src="/amex.svg" alt="Amex" className="h-[21px]" width={31} height={31} />
                    </div>
                  </label>

                  {selectedPayment === "card" && accelLoaded && (
                    <div className="pt-4 border-t border-slate-200">
                      <AccelerateWallet />
                    </div>
                  )}

                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={selectedPayment === "paypal"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-slate-200">
                      <div className="text-lg font-bold text-blue-600">P</div>
                    </div>
                    <div className="flex-1 font-medium text-slate-900">PayPal</div>
                    <Image src="/paypal.svg" alt="PayPal" className="h-[21px]" width={51} height={51} />
                  </label>

                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="zip"
                      checked={selectedPayment === "zip"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-slate-200">
                      <div className="text-lg font-bold text-slate-600">Z</div>
                    </div>
                    <div className="flex-1 font-medium text-slate-900">Zip - Pay in 4 installments</div>
                    <Image src="/zip.svg" alt="Zip" className="h-[21px]" width={51} height={51} />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedCard}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-500/30 disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none"
              >
                Complete Payment {totalPrice > 0 && `• $${totalPrice.toFixed(2)}`}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500">
              By completing this purchase you agree to our{" "}
              <a href="https://www.weaccelerate.com/terms" className="text-blue-600 hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="https://www.weaccelerate.com/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>
          </div>

          <div className="lg:sticky lg:top-8 h-fit order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => setIsOrderSummaryExpanded(!isOrderSummaryExpanded)}
                className="w-full px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
                {isOrderSummaryExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                )}
              </button>
              {isOrderSummaryExpanded && (
                <div className="px-8 pb-8 [&>div>h2]:hidden [&>div]:bg-transparent [&>div]:p-0 [&>div]:shadow-none [&>div]:border-0 [&>div]:rounded-none">
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
                </div>
              )}
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
          console.log("pdp-payment.onReady");
          // Hardcode the amount to $0.99 for testing
          const hardcodedAmount = 0.99;
          
          window.accelerate.init({
            amount: Math.round(hardcodedAmount * 100), // Convert to cents (99 cents)
            merchantId: process.env.NEXT_PUBLIC_PDP_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
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
