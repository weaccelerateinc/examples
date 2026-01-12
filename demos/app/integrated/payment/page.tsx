"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { stripeOptions } from "../../options";
import type { AccelerateWindowAPI } from "accelerate-js-types";
import { CheckoutSummary } from "./CheckoutSummary";
import Image from "next/image";
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

  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [zip, setZip] = useState(searchParams.get("zip") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [firstName, _setFirstName] = useState(searchParams.get("firstName") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastName, _setLastName] = useState(searchParams.get("lastName") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [email, _setEmail] = useState(searchParams.get("email") || "");

  const [accelLoaded, setAccelerateLoaded] = useState(false);

  useEffect(() => {
    console.log("Form data updated:", {
      address,
      city,
      state,
      zip,
    });
  }, [address, city, state, zip]);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(true);

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
      router.push(
        `/integrated/payment/confirmation?` +
          `firstName=${encodeURIComponent(firstName)}&` +
          `lastName=${encodeURIComponent(lastName)}&` +
          `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
          `address=${encodeURIComponent(address)}&` +
          `city=${encodeURIComponent(city)}&` +
          `state=${encodeURIComponent(state)}&` +
          `zip=${encodeURIComponent(zip)}&` +
          `shipping=${encodeURIComponent(selectedShipping)}&` +
          //`cardBrand=${encodeURIComponent(card?.details?.cardIssuer || "")}&` +
          `cardLast4=${encodeURIComponent(card?.details?.mask || "")}&` +
          `totalPrice=${encodeURIComponent(totalPrice)}`
      );
    } else {
      return;
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      <header className="w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
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
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">Accelerate</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-xs sm:text-sm">
            <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium hidden sm:inline">Secure Checkout</span>
          </div>
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
                    placeholder="Street address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    placeholder="Apartment, suite, etc. (optional)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      placeholder="ZIP"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Shipping Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard"
                      checked={selectedShipping === "standard"}
                      onChange={(e) => {
                        setSelectedShipping(e.target.value);
                        setShippingCost(0);
                      }}
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

                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="express"
                      checked={selectedShipping === "express"}
                      onChange={(e) => {
                        setSelectedShipping(e.target.value);
                        setShippingCost(9.99);
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-slate-200">
                      <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">Express Shipping</div>
                      <div className="text-sm text-slate-500">2-5 business days</div>
                    </div>
                    <div className="font-semibold text-slate-900">$9.99</div>
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
                    selectedShipping={selectedShipping === "express"}
                    shippingCost={shippingCost}
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
          console.log("p2.onReady");
          window.accelerate.init({
            amount: stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
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
