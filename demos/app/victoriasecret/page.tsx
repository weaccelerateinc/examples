"use client";
import { FormEvent, useState, Suspense } from "react";
import { CheckoutSummary } from "./payment/CheckoutSummary";
import { stripeOptions } from "../options";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import { ChevronDown, Search, Play } from "lucide-react";

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

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phoneNumber, setPhone] = useState(searchParams.get("phone") || "");
  const [firstName, setFirstName] = useState(searchParams.get("firstName") || "");
  const [lastName, setLastName] = useState(searchParams.get("lastName") || "");
  const [addrLine1, setAddrLine1] = useState(searchParams.get("address") || "");
  const [addrLine2, setAddrLine2] = useState(searchParams.get("apartment") || "");
  const [addrState, setAddrState] = useState(searchParams.get("state") || "");
  const [addrCity, setAddrCity] = useState(searchParams.get("city") || "");
  const [addrZip, setAddrZip] = useState(searchParams.get("zip") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [contactPhone, setContactPhone] = useState(searchParams.get("phone") || "");
  const [location, setLocation] = useState("US");
  const [selectedShipping, setSelectedShipping] = useState(searchParams.get("shipping") || "standard");
  const [shippingCost, setShippingCost] = useState(8.0);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState(false);
  const [billingOption, setBillingOption] = useState("same");
  const [createAccount, setCreateAccount] = useState(false);

  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user?.addresses[0]) {
      setAddrLine1(user.addresses[0].line1 || addrLine1);
      setAddrCity(user.addresses[0].city || addrCity);
      setAddrState(user.addresses[0].state || addrState);
      setAddrZip(user.addresses[0].postalCode || addrZip);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams({
      email,
      phone: phoneNumber,
      firstName,
      lastName,
      address: addrLine1,
      city: addrCity,
      state: addrState,
      zip: addrZip,
    });
    router.push(`/victoriasecret/payment?${params.toString()}`);
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
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
    "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
    "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
    "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
    "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
  ];

  const shippingOptions = [
    { value: "standard", label: "Est. Delivery Feb. 23 - Feb. 26", sublabel: "Standard Delivery", price: 8.0 },
    { value: "nextday", label: "Est. Delivery Tomorrow, Feb. 19", sublabel: "Next Business Day Express", price: 26.0 },
    { value: "2ndday", label: "Est. Delivery Friday, Feb. 20", sublabel: "2nd Business Day Express", price: 19.0 },
    { value: "3rdday", label: "Est. Delivery Monday, Feb. 23", sublabel: "3rd Business Day Express", price: 16.0 },
    { value: "saturday", label: "Est. Delivery Saturday, Feb. 21", sublabel: "Saturday Delivery", price: 32.0 },
  ];

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
        <button className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Play">
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
            <div className="flex items-center mb-10 max-w-[520px] mx-auto">
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-sm font-semibold text-[#D5225B]">Shipping</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-6 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#D5225B]"></div>
              </div>
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-sm text-gray-400">Payment</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-6 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              </div>
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-sm text-gray-400">Review</span>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="border-l-4 border-[#C8A951] bg-white py-3 px-4 mb-8">
              <p className="text-sm text-black leading-relaxed">
                To ensure timely and accurate delivery of your order, please verify
                the shipping and billing addresses listed below are correct.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Contact Information Section */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="sm:w-[170px] flex-shrink-0">
                  <h2 className="text-sm font-bold text-black">Contact Information</h2>
                  <button type="button" className="text-xs text-gray-500 mt-1 flex items-center gap-1 hover:text-black">
                    Why do we need this?{" "}
                    <span className="text-gray-400 text-sm">+</span>
                  </button>
                </div>
                <div className="flex-1 space-y-4">
                  {/* First Name / Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      data-testid="first-name-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={() => maybeLogin(contactPhone)}
                      placeholder="First Name *"
                      className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                    />
                    <input
                      data-testid="last-name-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onBlur={() => maybeLogin(contactPhone)}
                      placeholder="Last Name *"
                      className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                  {/* Email Address */}
                  <div className="relative">
                    <label className="absolute top-2.5 left-4 text-[10px] text-gray-500 uppercase tracking-wider">
                      Email Address *
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      className="w-full pt-7 pb-3 px-4 bg-gray-100 rounded-lg text-sm text-black focus:outline-none"
                    />
                  </div>
                  {/* Phone Number */}
                  <input
                    value={contactPhone}
                    onChange={(e) => {
                      const formatted = tryFormatPhone(e.target.value);
                      setContactPhone(formatted);
                      setPhone(formatted);
                      maybeLogin(e?.target.value);
                    }}
                    placeholder="Phone Number *"
                    type="tel"
                    className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shipping Address Section */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="sm:w-[170px] flex-shrink-0">
                  <h2 className="text-sm font-bold text-black">Shipping Address</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    * Required |{" "}
                    <a href="#" className="underline text-gray-500 hover:text-black">
                      Privacy Policy
                    </a>
                  </p>
                </div>
                <div className="flex-1 space-y-4">
                  {/* Location */}
                  <div className="relative">
                    <label className="absolute top-2.5 left-4 text-[10px] text-gray-500 uppercase tracking-wider">
                      Location *
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pt-7 pb-3 px-4 bg-gray-100 rounded-lg text-sm text-black focus:outline-none appearance-none"
                    >
                      <option value="US">United States / U.S. Territory</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* First Name / Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name *"
                      className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                    />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name *"
                      className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                    />
                  </div>

                  {/* Street Address */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={addrLine1}
                      onChange={(e) => setAddrLine1(e.target.value)}
                      placeholder="Street Address or P.O. Box *"
                      className="w-full py-4 pl-12 pr-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                    />
                  </div>

                  {/* Apt */}
                  <input
                    value={addrLine2}
                    onChange={(e) => setAddrLine2(e.target.value)}
                    placeholder="Apt., Suite or Floor"
                    className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                  />

                  {/* City */}
                  <input
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="City *"
                    className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                  />

                  {/* State + Zip */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="absolute top-2.5 left-4 text-[10px] text-gray-500 uppercase tracking-wider">
                        State *
                      </label>
                      <select
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        className="w-full pt-7 pb-3 px-4 bg-gray-100 rounded-lg text-sm text-black focus:outline-none appearance-none"
                      >
                        <option value="">Select</option>
                        {usStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <label className="absolute top-2.5 left-4 text-[10px] text-gray-500 uppercase tracking-wider">
                        Zip Code *
                      </label>
                      <input
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                        className="w-full pt-7 pb-3 px-4 bg-gray-100 rounded-lg text-sm text-black focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhone(tryFormatPhone(e.target.value))}
                    placeholder="Phone Number *"
                    type="tel"
                    className="w-full py-4 px-4 bg-gray-100 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Select Shipping Method */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="sm:w-[170px] flex-shrink-0">
                  <h2 className="text-sm font-bold text-black">Select Shipping Method</h2>
                  <a href="#" className="text-xs text-[#D5225B] underline mt-1 block hover:text-[#B91D4E]">
                    Shipping Rates
                  </a>
                </div>
                <div className="flex-1">
                  {shippingOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-between py-3 px-3 cursor-pointer ${
                        selectedShipping === option.value
                          ? "border border-dashed border-gray-800 -mx-3"
                          : "border-b border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={option.value}
                          checked={selectedShipping === option.value}
                          onChange={() => {
                            setSelectedShipping(option.value);
                            setShippingCost(option.price);
                          }}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedShipping === option.value ? "border-black" : "border-gray-300"
                          }`}
                        >
                          {selectedShipping === option.value && (
                            <div className="w-2 h-2 rounded-full bg-black"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.sublabel}</p>
                        </div>
                      </div>
                      <span className="text-sm text-black flex-shrink-0 ml-4">
                        ${option.price.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Gift Options */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="sm:w-[170px] flex-shrink-0">
                  <h2 className="text-sm font-bold text-black">Gift Options</h2>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftWrap}
                      onChange={(e) => setGiftWrap(e.target.checked)}
                      className="mt-0.5 w-4 h-4 border-gray-300 rounded flex-shrink-0"
                    />
                    <span className="text-sm text-black leading-relaxed">
                      Complete your order in our signature giftwrap and include our personalized card. ($7.00)
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.checked)}
                      className="mt-0.5 w-4 h-4 border-gray-300 rounded flex-shrink-0"
                    />
                    <span className="text-sm text-black leading-relaxed">
                      Include a personalized message on the packaging invoice. (Free)
                    </span>
                  </label>
                </div>
              </div>

              {/* Billing Address */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="sm:w-[170px] flex-shrink-0">
                  <h2 className="text-sm font-bold text-black">Billing Address</h2>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="billing"
                      value="same"
                      checked={billingOption === "same"}
                      onChange={() => setBillingOption("same")}
                      className="w-4 h-4 accent-black"
                    />
                    <span className="text-sm text-black">Use Shipping Address</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="billing"
                      value="new"
                      checked={billingOption === "new"}
                      onChange={() => setBillingOption("new")}
                      className="w-4 h-4 accent-black"
                    />
                    <span className="text-sm text-black">Add New Billing Address</span>
                  </label>
                </div>
              </div>

              {/* VS Rewards Banner */}
              <div className="mb-8">
                <div className="relative rounded-2xl border border-gray-200 overflow-hidden bg-white">
                  {/* Gold accent stripe on right */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-16 rounded-br-2xl"
                    style={{
                      background: "linear-gradient(180deg, #C5956B 0%, #BF9A6B 100%)",
                      clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0% 100%)",
                    }}
                  />
                  <div className="relative py-8 px-8">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-3 mb-1">
                        <span
                          className="text-sm tracking-[0.2em] text-black uppercase"
                          style={{ fontFamily: "Georgia, Times New Roman, serif" }}
                        >
                          Victoria&apos;s Secret
                        </span>
                        <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 tracking-wider">
                          PINK
                        </span>
                      </div>
                      <h3
                        className="text-5xl font-black text-black tracking-wider uppercase"
                        style={{ fontFamily: "Georgia, Times New Roman, serif" }}
                      >
                        REWARDS
                      </h3>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="w-5 h-5 border-gray-300 rounded flex-shrink-0"
                      />
                      <span className="text-sm text-black">
                        Create an account to earn points on this purchase.
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Continue to Payment Button */}
              <button
                type="submit"
                className="w-full max-w-[320px] mx-auto block bg-[#FCE4EC] text-black font-bold py-3.5 text-sm tracking-[0.15em] uppercase hover:bg-[#f8b8cc] transition"
              >
                Continue to Payment
              </button>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-[260px] flex-shrink-0 lg:sticky lg:top-8 h-fit">
            <CheckoutSummary
              shippingCost={shippingCost}
              onTotalChange={(total) => {
                console.log("Total changed:", total);
                return true;
              }}
            />
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
          console.log("p1.onReady");
          window.accelerate.init({
            amount: stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in", { user });
              maybeUseAccelUser(user);
            },
            onCardSelected: (cid) => {
              console.log(cid);
            },
          });
        }}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
