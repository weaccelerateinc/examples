"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { stripeOptions } from "../../options";
import type { AccelerateWindowAPI } from "accelerate-js-types";
import { CheckoutSummary } from "./CheckoutSummary";
import { AccelerateWallet } from "../../../components/AccelerateWallet";
import { Play, Loader2 } from "lucide-react";
import Image from "next/image";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Billing address (from initial form, preserved)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [billingAddress, _setBillingAddress] = useState(searchParams.get("address") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [billingCity, _setBillingCity] = useState(searchParams.get("city") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [billingState, _setBillingState] = useState(searchParams.get("state") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [billingZip, _setBillingZip] = useState(searchParams.get("zip") || "");

  // Shipping address (editable, initialized from billing)
  const [address] = useState(searchParams.get("address") || "");
  const [apartment] = useState("");
  const [city] = useState(searchParams.get("city") || "");
  const [state] = useState(searchParams.get("state") || "");
  const [zip] = useState(searchParams.get("zip") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [firstName, _setFirstName] = useState(searchParams.get("firstName") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastName, _setLastName] = useState(searchParams.get("lastName") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [email, _setEmail] = useState(searchParams.get("email") || "");
  const [phone] = useState(searchParams.get("phone") || "");

  const [accelLoaded, setAccelerateLoaded] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedShipping] = useState("standard");
  const [shippingCost] = useState(8.0);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build a query string with all current data to preserve state when navigating back
  const allParams = new URLSearchParams();
  if (firstName) allParams.set("firstName", firstName);
  if (lastName) allParams.set("lastName", lastName);
  if (email) allParams.set("email", email);
  if (phone) allParams.set("phone", phone);
  if (address) allParams.set("address", address);
  if (city) allParams.set("city", city);
  if (state) allParams.set("state", state);
  if (zip) allParams.set("zip", zip);
  const shippingEditUrl = `/victoriasecret?${allParams.toString()}`;

  // Offer codes
  const [offerCode1, setOfferCode1] = useState("");
  const [offerCode2, setOfferCode2] = useState("");
  const [showOfferCodes, setShowOfferCodes] = useState(true);
  const [showGiftCard, setShowGiftCard] = useState(false);

  useEffect(() => {
    console.log("Payment form data:", { address, city, state, zip });
  }, [address, city, state, zip]);

  console.log({ selectedPayment, accelLoaded });

  const handleSubmit = async (e: FormEvent) => {
    console.log("EVENT", e);
    e.preventDefault();
    if (selectedCard) {
      setIsSubmitting(true);
      try {
        const card = await window.accelerate.requestSource(selectedCard);
        if ("status" in card) {
          console.log("Error", { card });
          setIsSubmitting(false);
          return;
        }
        console.log({ card: JSON.stringify(card) });
        router.push(
          `/victoriasecret/payment/review?` +
            `firstName=${encodeURIComponent(firstName)}&` +
            `lastName=${encodeURIComponent(lastName)}&` +
            `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
            `phone=${encodeURIComponent(phone)}&` +
            `shippingAddress=${encodeURIComponent(address)}&` +
            `${apartment ? `shippingApartment=${encodeURIComponent(apartment)}&` : ""}` +
            `shippingCity=${encodeURIComponent(city)}&` +
            `shippingState=${encodeURIComponent(state)}&` +
            `shippingZip=${encodeURIComponent(zip)}&` +
            `billingAddress=${encodeURIComponent(billingAddress)}&` +
            `billingCity=${encodeURIComponent(billingCity)}&` +
            `billingState=${encodeURIComponent(billingState)}&` +
            `billingZip=${encodeURIComponent(billingZip)}&` +
            `shipping=${encodeURIComponent(selectedShipping)}&` +
            `cardLast4=${encodeURIComponent(card?.details?.mask || "")}&` +
            `totalPrice=${encodeURIComponent(totalPrice)}`
        );
      } catch (error) {
        console.error("Payment error:", error);
        setIsSubmitting(false);
      }
    } else {
      return;
    }
  };

  return (
    <div className="min-h-screen w-screen bg-white ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      {/* Top Promotional Banner */}
      <div className="bg-[#FCE4EC] text-center py-2.5 px-4 text-sm relative">
        <span className="text-black">
          Last Day. App Exclusive: Save $30 When You Spend $150+.{" "}
        </span>
        <a href="#" className="text-black underline font-medium">
          Details
        </a>
        <button className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Pause">
          <Play className="w-3 h-3 text-black fill-black" />
        </button>
      </div>

      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="border-r border-gray-300 pr-3">
              <span
                className="text-[11px] tracking-[0.15em] uppercase leading-tight block text-center text-black"
                style={{ fontFamily: "Georgia, Times New Roman, serif" }}
              >
                <span className="block">VICTORIA&apos;S</span>
                <span className="block">SECRET</span>
              </span>
            </div>
            <span
              className="text-sm font-bold tracking-[0.2em] uppercase text-black"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              PINK
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column - Form */}
          <div className="flex-1 min-w-0">
            {/* Step Indicator */}
            <div className="flex items-center mb-6 max-w-[520px] mx-auto">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-black">Shipping</span>
                  <a href={shippingEditUrl} className="text-xs text-[#D5225B] underline">Edit</a>
                </div>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-6 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-black"></div>
              </div>
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-sm font-semibold text-[#D5225B]">Payment</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-6 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#D5225B]"></div>
              </div>
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-sm text-gray-400">Review</span>
              </div>
            </div>

            {/* Ship to address */}
            {address && (
              <p className="text-xs text-gray-600 mb-8">
                Ship to {address}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              {/* Offer Codes Section */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="sm:w-[170px] flex-shrink-0">
                  <h2 className="text-sm font-bold text-black">Offer Codes</h2>
                  <a href="#" className="text-xs text-[#D5225B] underline mt-1 block">Help</a>
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setShowOfferCodes(!showOfferCodes)}
                    className="text-sm text-black font-medium mb-4"
                  >
                    Apply an Offer Code {showOfferCodes ? "—" : "+"}
                  </button>
                  {showOfferCodes && (
                    <div className="space-y-4">
                      <input
                        value={offerCode1}
                        onChange={(e) => setOfferCode1(e.target.value)}
                        placeholder="Offer Code"
                        className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                      />
                      <input
                        value={offerCode2}
                        onChange={(e) => setOfferCode2(e.target.value)}
                        placeholder="Offer Code"
                        className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        className="w-full max-w-[280px] bg-black text-white font-bold py-3 text-sm tracking-[0.15em] uppercase hover:bg-gray-800 transition"
                      >
                        Apply Offers
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Gift Cards Section */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="sm:w-[170px] flex-shrink-0">
                  <h2 className="text-sm font-bold text-black">Gift Cards</h2>
                  <a href="#" className="text-xs text-[#D5225B] underline mt-1 block">Help</a>
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setShowGiftCard(!showGiftCard)}
                    className="text-sm text-black font-medium"
                  >
                    Use a Gift Card {showGiftCard ? "—" : "+"}
                  </button>
                  {showGiftCard && (
                    <div className="mt-4 space-y-4">
                      <input
                        placeholder="Gift Card Number"
                        className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                      />
                      <input
                        placeholder="PIN"
                        className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        className="bg-black text-white font-bold py-3 px-8 text-sm tracking-[0.15em] uppercase hover:bg-gray-800 transition"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Select Payment Method */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="sm:w-[170px] flex-shrink-0">
                  <h2 className="text-sm font-bold text-black">Select Payment Method</h2>
                </div>
                <div className="flex-1 space-y-0">
                  {/* Pay with Credit or Debit Card */}
                  <div className="pb-6 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={selectedPayment === "card"}
                        onChange={() => setSelectedPayment("card")}
                        className="w-4 h-4 accent-black"
                      />
                      <Image src="/creditcard.svg" alt="Credit Card" width={32} height={20} />
                      <span className="text-sm text-black">Pay with Credit or Debit Card</span>
                    </label>

                    {selectedPayment === "card" && (
                      <div className="mt-4 ml-7">
                        {/* Card Brand Icons */}
                        <div className="flex items-center gap-1.5 mb-4">
                          <Image src="/0f3907e7eb45fe29912151eb57b8697b.png" alt="VS Card" width={39} height={25} />
                          <Image src="/visa.svg" alt="Visa" width={39} height={25} />
                          <Image src="/mastercard.svg" alt="Mastercard" width={39} height={25} />
                          <Image src="/amex.svg" alt="American Express" width={39} height={25} />
                          <Image src="/discover.svg" alt="Discover" width={39} height={25} />
                          <Image src="/unionpay.svg" alt="UnionPay" width={39} height={25} />
                          <Image src="/jcb.svg" alt="JCB" width={39} height={25} />
                        </div>

                        {/* Accelerate Wallet */}
                        {accelLoaded && (
                          <div className="mb-4">
                            <AccelerateWallet />
                          </div>
                        )}

                        {/* Fallback card fields (shown when Accelerate is not loaded) */}
                        {!accelLoaded && (
                          <div className="space-y-3 mb-4">
                            <input
                              placeholder="Card Number *"
                              className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                              disabled
                            />
                            <div className="grid grid-cols-5 gap-3">
                              <input
                                placeholder="Expiration Date *"
                                className="col-span-3 py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                                disabled
                              />
                              <input
                                placeholder="Security Code *"
                                className="col-span-2 py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                                disabled
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-4">
                          <p className="text-sm text-black">
                            Forgot your Victoria&apos;s Secret credit card details?
                          </p>
                          <a href="#" className="text-sm text-black font-bold underline">Look up your account</a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pay with Victoria's Secret Card */}
                  <div className="pb-6 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="vscard"
                        checked={selectedPayment === "vscard"}
                        onChange={() => setSelectedPayment("vscard")}
                        className="w-4 h-4 accent-black"
                      />
                      <Image src="/0f3907e7eb45fe29912151eb57b8697b.png" alt="VS Card" width={39} height={25} />
                      <span className="text-sm text-black">Pay with Victoria&apos;s Secret Card</span>
                    </label>
                    <div className="mt-3 ml-7">
                      <p className="text-sm text-black">
                        No credit card yet?{" "}
                        <a href="#" className="text-black font-bold underline">Apply Now</a>
                        {" "}and receive a $25 discount upon approval.
                      </p>
                      <a href="#" className="text-sm text-[#D5225B] underline">Details</a>*
                    </div>
                  </div>

                  {/* Pay with PayPal */}
                  <div className="pb-6 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={selectedPayment === "paypal"}
                        onChange={() => setSelectedPayment("paypal")}
                        className="w-4 h-4 accent-black"
                      />
                      <Image src="/paypal.svg" alt="PayPal" width={39} height={25} />
                      <span className="text-sm text-black">Pay with Paypal</span>
                    </label>
                  </div>

                  {/* 4 interest-free payments with Klarna */}
                  <div className="pb-6 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="klarna"
                        checked={selectedPayment === "klarna"}
                        onChange={() => setSelectedPayment("klarna")}
                        className="w-4 h-4 accent-black"
                      />
                      <Image src="/klarna.svg" alt="Klarna" width={39} height={25} />
                      <span className="text-sm text-black">4 interest-free payments with Klarna</span>
                    </label>
                  </div>

                  {/* 4 interest-free payments with Afterpay */}
                  <div className="pb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="afterpay"
                        checked={selectedPayment === "afterpay"}
                        onChange={() => setSelectedPayment("afterpay")}
                        className="w-4 h-4 accent-black"
                      />
                      <Image src="/afterpay.svg" alt="Afterpay" width={39} height={25} />
                      <span className="text-sm text-black">4 interest-free payments with Afterpay</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="sm:w-[170px] flex-shrink-0">
                  <h2 className="text-sm font-bold text-black">Billing Address</h2>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-black space-y-0.5">
                      <p>{firstName} {lastName}</p>
                      <p>{billingAddress || address}</p>
                      <p>
                        {billingCity || city}
                        {(billingState || state) && `, ${billingState || state}`}
                        {" "}
                        {billingZip || zip}
                      </p>
                      {phone && <p>{phone}</p>}
                    </div>
                    <a href={shippingEditUrl} className="text-xs text-[#D5225B] underline flex-shrink-0 ml-4">
                      Change
                    </a>
                  </div>
                </div>
              </div>

              {/* Continue to Order Review Button */}
              <div className="text-center mb-8">
                <button
                  type="submit"
                  disabled={!selectedCard || isSubmitting}
                  className="w-full max-w-[320px] mx-auto block bg-[#D5225B] text-white font-bold py-3.5 text-sm tracking-[0.15em] uppercase hover:bg-[#B91D4E] transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue to Order Review"
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-3">(Your card will not be charged)</p>
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-[260px] flex-shrink-0 lg:sticky lg:top-8 h-fit">
            <CheckoutSummary
              shippingCost={shippingCost}
              onTotalChange={(total: number) => {
                setTotalPrice(total);
                return true;
              }}
            />

            {/* VS Credit Card Promo */}
            <div className="mt-6 border border-gray-200 rounded-sm p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Image src="/0f3907e7eb45fe29912151eb57b8697b.png" alt="VS Credit Card" width={60} height={38} />
                </div>
                <div>
                  <p className="text-xs text-black leading-relaxed">
                    Pay{" "}
                    <span className="line-through text-gray-400">
                      ${totalPrice > 0 ? totalPrice.toFixed(2) : "107.50"}
                    </span>{" "}
                    <strong>${totalPrice > 0 ? (totalPrice * 0.77).toFixed(2) : "82.50"}</strong>{" "}
                    for this order* upon approval for the Victoria&apos;s Secret Credit Card, and earn{" "}
                    <strong>2x rewards</strong> faster<sup>†</sup>.{" "}
                    <a href="#" className="text-[#D5225B] underline">Details</a>.
                  </p>
                  <button
                    type="button"
                    className="mt-2 border border-black text-black font-bold text-xs py-1.5 px-4 tracking-wider uppercase hover:bg-gray-50 transition"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 bg-white">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-5">
            <p className="text-xs font-bold text-black uppercase tracking-wider mb-1">
              Need Help?
            </p>
            <p className="text-xs text-gray-600">
              1.800.411.5116
              <span className="text-gray-300 mx-2">|</span>
              <a href="#" className="text-gray-600 hover:underline">
                Live Chat
              </a>
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            © 2026 Victoria&apos;s Secret. All Rights Reserved.
          </p>
          <div className="flex flex-wrap gap-x-1 gap-y-0.5 text-[11px] text-gray-500">
            <a href="#" className="hover:underline">Terms of Use</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Privacy &amp; Security</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Report a Vulnerability</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">California Privacy Rights</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Do Not Sell or Share My Personal Information</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Modern Slavery Transparency Statement</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Ad Preferences</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Careers</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Product Catalog</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:underline">Site Map</a>
          </div>
        </div>
      </footer>

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
