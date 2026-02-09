"use client";
import { FormEvent, useState } from "react";
import { CheckoutSummary } from "./payment/CheckoutSummary";
import { stripeOptions } from "../options";
import Script from "next/script";
import { useRouter } from "next/navigation";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import Image from "next/image";
import { AccelerateWallet } from "../../components/AccelerateWallet";
import { Info, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

function tryFormatPhone(pn: string): string {
  const cleanedNumber = pn.replace(/\D/g, "");
  if (!cleanedNumber.match(/^(1?\d{10})$/)) {
    return pn;
  }
  const last10 = cleanedNumber.slice(-10);
  return `${last10.slice(0, 3)}-${last10.slice(3, 6)}-${last10.slice(6)}`;
}

export default function CheckoutPage() {
  const router = useRouter();

  const [phoneNumber, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedShipping] = useState("standard");
  const [shippingCost] = useState(0);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [accelLoaded, setAccelerateLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [useDifferentShipping, setUseDifferentShipping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGiftCard, setShowGiftCard] = useState(false);
  const [poBox, setPoBox] = useState(false);

  const [billingAddrLine1, setBillingAddrLine1] = useState("");
  const [billingAddrState, setBillingAddrState] = useState("");
  const [billingAddrCity, setBillingAddrCity] = useState("");
  const [billingAddrZip, setBillingAddrZip] = useState("");

  const [shippingAddrLine1, setShippingAddrLine1] = useState("");
  const [shippingAddrState, setShippingAddrState] = useState("");
  const [shippingAddrCity, setShippingAddrCity] = useState("");
  const [shippingAddrZip, setShippingAddrZip] = useState("");

  const [shippingName] = useState("");

  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user?.addresses[0]) {
      setBillingAddrLine1(user.addresses[0].line1 || billingAddrLine1);
      setBillingAddrCity(user.addresses[0].city || billingAddrCity);
      setBillingAddrState(user.addresses[0].state || billingAddrState);
      setBillingAddrZip(user.addresses[0].postalCode || billingAddrZip);

      setShippingAddrLine1(user.addresses[0].line1 || shippingAddrLine1);
      setShippingAddrCity(user.addresses[0].city || shippingAddrCity);
      setShippingAddrState(user.addresses[0].state || shippingAddrState);
      setShippingAddrZip(user.addresses[0].postalCode || shippingAddrZip);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
          `/anntaylor/payment/confirmation?` +
            `firstName=${encodeURIComponent(firstName)}&` +
            `lastName=${encodeURIComponent(lastName)}&` +
            `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
            `billingAddress=${encodeURIComponent(billingAddrLine1)}&` +
            `billingCity=${encodeURIComponent(billingAddrCity)}&` +
            `billingState=${encodeURIComponent(billingAddrState)}&` +
            `billingZip=${encodeURIComponent(billingAddrZip)}&` +
            `shippingName=${encodeURIComponent(shippingName)}&` +
            `shippingAddress=${encodeURIComponent(shippingAddrLine1)}&` +
            `shippingCity=${encodeURIComponent(shippingAddrCity)}&` +
            `shippingState=${encodeURIComponent(shippingAddrState)}&` +
            `shippingZip=${encodeURIComponent(shippingAddrZip)}&` +
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

  const maybeLogin = (phoneValue: string) => {
    console.log({ firstName, lastName, phoneValue });

    if (firstName == "") return;
    if (lastName == "") return;

    const cleanedPhone = phoneValue.replace(/\D/g, "");
    const phoneRegex = /^(1\d{10}|[2-9]\d{9})$/;

    if (!phoneRegex.test(cleanedPhone)) return;

    const finalPhone = cleanedPhone.slice(-10);
    window.accelerate.login({
      firstName,
      lastName,
      phoneNumber: finalPhone,
      email: email || "test.demo@weaccelerate.com",
    });
  };

  const usStates = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen w-screen bg-white ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Image src="/logo.svg" alt="Ann Taylor" width={212} height={19} className="h-5" />
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs text-black">1</span>
              </div>
            </div>
            <a href="#" className="text-sm text-black underline">Return to Bag</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Shipping Section */}
              <div className="bg-white border border-gray-200">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-black">1. Shipping</h2>
                </div>
                <div className="p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-black">Ship To:</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-black mb-1">
                        First Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        data-testid="first-name-input"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => {
                          maybeLogin(phoneNumber);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-black mb-1">
                        Last Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        data-testid="last-name-input"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => {
                          maybeLogin(phoneNumber);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-black mb-1 flex items-center gap-1">
                      Phone Number<span className="text-red-500">*</span>
                      <Info className="w-3 h-3 text-gray-400" />
                    </label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhone(tryFormatPhone(e.target.value));
                        maybeLogin(e?.target.value);
                      }}
                      placeholder="Phone number"
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-xs text-black">
                        Address 1<span className="text-red-500">*</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs text-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={poBox}
                          onChange={(e) => setPoBox(e.target.checked)}
                          className="w-3 h-3"
                        />
                        PO Box
                      </label>
                    </div>
                    <input
                      placeholder="Street address"
                      value={shippingAddrLine1}
                      onChange={(e) => setShippingAddrLine1(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-black mb-1">Address 2</label>
                    <input
                      placeholder="Apartment, suite, etc. (optional)"
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-black mb-1">
                        City<span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="City"
                        value={shippingAddrCity}
                        onChange={(e) => setShippingAddrCity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-black mb-1">
                        State<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={shippingAddrState}
                        onChange={(e) => setShippingAddrState(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white"
                      >
                        <option value="">Select</option>
                        {usStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-black mb-1">
                      Zip Code<span className="text-red-500">*</span>
                    </label>
                    <input
                      placeholder="Zip Code"
                      value={shippingAddrZip}
                      onChange={(e) => setShippingAddrZip(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* Capital One Shopping Promotion */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-black mb-2">
                  Get coupon codes instantly added to future orders.
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Add Capital One Shopping to your browser and get coupon codes automatically applied at checkout.
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-xs font-semibold text-black">Capital One Shopping</div>
                </div>
                <button
                  type="button"
                  className="w-full bg-black text-white py-2 px-4 text-sm font-semibold hover:bg-gray-800 mb-2"
                >
                  Redeem $15 Bonus
                </button>
                <div className="text-xs text-gray-600">
                  <a href="#" className="underline">Terms & Conditions</a>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Powered by Rokt - <a href="#" className="underline">Privacy Policy</a>.
                </div>
              </div>

              {/* 2. Payment Section */}
              <div className="bg-white border border-gray-200">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-black">2. Payment</h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Gift Card Section */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowGiftCard(!showGiftCard)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-sm font-semibold text-black flex items-center gap-1">
                        Add a Gift Card
                        <Info className="w-3 h-3 text-gray-400" />
                      </h3>
                      {showGiftCard ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    {showGiftCard && (
                      <div className="mt-2 p-3 bg-gray-50 border border-gray-200">
                        <input
                          type="text"
                          placeholder="Gift card number"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black mb-2"
                        />
                        <input
                          type="text"
                          placeholder="PIN"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                        />
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-black">Payment Method:</h3>

                  {/* Credit Card Form - Hide when Accelerate wallet is loaded */}
                  {!(accelLoaded && isLoggedIn) && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-black mb-1">
                          Card Number<span className="text-red-500">*</span>
                        </label>
                        <input
                          placeholder="Card number"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs text-black mb-1">
                            Exp. Date<span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <select className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white">
                              <option>Month</option>
                              {months.map((month) => (
                                <option key={month} value={month}>
                                  {month.toString().padStart(2, "0")}
                                </option>
                              ))}
                            </select>
                            <select className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white">
                              <option>Year</option>
                              {years.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-black mb-1 flex items-center gap-1">
                            CVV<span className="text-red-500">*</span>
                            <Info className="w-3 h-3 text-gray-400" />
                          </label>
                          <input
                            placeholder="CVV"
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPayment === "card" && accelLoaded && isLoggedIn && (
                    <div className="pt-1">
                      <AccelerateWallet />
                    </div>
                  )}

                  <h3 className="text-sm font-semibold text-black">Bill To:</h3>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!useDifferentShipping}
                      onChange={(e) => setUseDifferentShipping(!e.target.checked)}
                      className="w-4 h-4 border-gray-300"
                    />
                    <span className="text-xs text-black">My Billing and Shipping addresses are the same</span>
                  </label>

                  {useDifferentShipping && (
                    <div className="space-y-4 pt-2 border-t border-gray-200">
                      <input
                        placeholder="Street address"
                        value={billingAddrLine1}
                        onChange={(e) => setBillingAddrLine1(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                      />
                      <input
                        placeholder="Apartment, suite, etc. (optional)"
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <input
                            placeholder="City"
                            value={billingAddrCity}
                            onChange={(e) => setBillingAddrCity(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          />
                        </div>
                        <div>
                          <select
                            value={billingAddrState}
                            onChange={(e) => setBillingAddrState(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white"
                          >
                            <option value="">State</option>
                            {usStates.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <input
                        placeholder="ZIP"
                        value={billingAddrZip}
                        onChange={(e) => setBillingAddrZip(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  )}

                  {/* Payment Options */}
                  <div className="pt-4">
                    {/* Account Lookup */}
                    <div className="flex items-center gap-4 py-3 border-t border-b border-gray-200">
                      <button
                        type="button"
                        className="bg-pink-100 border border-gray-300 py-2 px-4 text-sm text-black hover:bg-pink-200 flex items-center gap-2 flex-shrink-0"
                      >
                        <Image src="/avatar-black.png" alt="Ann Taylor" width={16} height={16} />
                        Account Lookup
                      </button>
                      <p className="text-xs text-black">
                        Have an Ann Taylor/LOFT credit card? Look for your account
                      </p>
                    </div>

                    {/* PayPal */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment("paypal")}
                        className="border border-gray-300 py-2 px-4 hover:bg-gray-50 flex items-center justify-center flex-shrink-0"
                      >
                        <Image src="/paypal.svg" alt="PayPal" width={80} height={20} />
                      </button>
                      <p className="text-xs text-black">
                        Pay in 4 interest-free payments of $32.25 with{" "}
                        <Image src="/paypal.svg" alt="PayPal" width={50} height={12} className="inline-block align-middle mx-1" />
                        <a href="#" className="underline">Learn more</a>
                      </p>
                    </div>

                    {/* Klarna */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment("klarna")}
                        className="border border-gray-300 py-2 px-4 hover:bg-gray-50 flex items-center justify-center flex-shrink-0"
                      >
                        <span className="text-sm font-semibold text-black">Klarna</span>
                      </button>
                      <p className="text-xs text-black">
                        Pay in 4 interest-free payments of $32.25 with{" "}
                        <span className="font-semibold">Klarna</span>{" "}
                        <a href="#" className="underline">Learn more</a>
                      </p>
                    </div>

                    {/* Apple Pay */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment("applepay")}
                        className="border border-gray-300 py-2 px-4 hover:bg-gray-50 flex items-center justify-center flex-shrink-0"
                      >
                        <span className="text-sm font-semibold text-black">Apple Pay</span>
                      </button>
                      <p className="text-xs text-black flex items-center gap-1">
                        Ann Taylor Mastercard perks when using Apple Pay
                        <Info className="w-3 h-3 text-gray-400" />
                      </p>
                    </div>
                  </div>

                  {/* Order Agreement */}
                  <p className="text-xs text-gray-600 text-center pt-4 border-t border-gray-200">
                    By placing your order, you agree to our{" "}
                    <a href="#" className="underline">Privacy Policy</a> and{" "}
                    <a href="#" className="underline">Terms of Use</a>.
                  </p>

                  {/* Place Order Button */}
                  <button
                    type="submit"
                    disabled={!selectedCard || isSubmitting}
                    className="w-full bg-black text-white font-semibold py-4 text-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Place Order | ${totalPrice > 0 ? totalPrice.toFixed(2) : "129.00"}</>
                    )}
                  </button>

                  <p className="text-xs text-gray-600 text-center">
                    Please make sure all details are correct before submitting order. Each time Place Order is clicked, your credit card will be authorized. Orders cannot be modified once placed and submitted for processing.
                  </p>

                  <a href="#" className="text-xs text-black underline text-center block">
                    Click here for Return & Exchange Policy.
                  </a>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-600 font-medium text-center text-sm">
                  {errorMessage}
                </div>
              )}
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <CheckoutSummary
              shippingCost={shippingCost}
              onTotalChange={(total: number) => {
                setTotalPrice(total);
                return true;
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 text-xs text-black justify-center mb-4">
            <a href="#" className="hover:underline">PRIVACY POLICY</a>
            <span>|</span>
            <a href="#" className="hover:underline">TERMS OF USE</a>
            <span>|</span>
            <a href="#" className="hover:underline">CALIFORNIA TRANSPARENCY</a>
            <span>|</span>
            <a href="#" className="hover:underline">ACCESSIBILITY STATEMENT</a>
            <span>|</span>
            <a href="#" className="hover:underline">SITE MAP</a>
            <span>|</span>
            <a href="#" className="hover:underline">INVESTORS</a>
            <span>|</span>
            <a href="#" className="hover:underline">T&C ORDER ALERTS</a>
            <span>|</span>
            <a href="#" className="hover:underline">YOUR PRIVACY CHOICES</a>
          </div>
          <p className="text-xs text-gray-600 text-center">
            ©2026 PREMIUM BRANDS OPCO LLC ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("p1.onReady");
          window.accelerate.init({
            amount: stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in", { user });
              maybeUseAccelUser(user);
              setIsLoggedIn(true);
            },
            onCardSelected: (cardId) => {
              setSelectedCard(cardId);
            },
            onPaymentInitiated: async (source) => {
              const confirmIntent = await fetch("/api/stripe/confirm", {
                method: "POST",
                body: JSON.stringify({
                  processorToken: source.processorToken,
                  cartId: "some-cart",
                }),
              });
              const res = (await confirmIntent.json()) as { status: string; message?: string };
              if (res.status === "succeeded") {
                router.push("/completion?status=succeeded");
              } else {
                setErrorMessage(res.message || "Unknown error");
              }
            },
          });
          setAccelerateLoaded(true);
        }}
      />
    </div>
  );
}
