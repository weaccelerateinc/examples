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

// Floating Label Input Component
interface FloatingLabelInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  "data-testid"?: string;
  className?: string;
}

function FloatingLabelInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  required = false,
  "data-testid": dataTestId,
  className = "",
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = hasValue || isFocused;

  return (
    <div className="relative">
      <input
        id={id}
        data-testid={dataTestId}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        className={`w-full px-3 pt-5 pb-3 border border-black text-sm focus:outline-none focus:border-black ${className}`}
      />
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          shouldFloat
            ? "top-1.5 text-xs text-gray-600"
            : "top-3.5 text-sm text-gray-400"
        }`}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}

// Floating Label Select Component
interface FloatingLabelSelectProps {
  id?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

function FloatingLabelSelect({
  id,
  label,
  value,
  onChange,
  required = false,
  className = "",
  children,
}: FloatingLabelSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = hasValue || isFocused;

  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        className={`w-full px-3 pt-5 pb-3 border border-black text-sm focus:outline-none focus:border-black bg-white appearance-none ${className}`}
        style={{
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
        }}
      >
        {children}
      </select>
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          shouldFloat
            ? "top-1.5 text-xs text-gray-600"
            : "top-3.5 text-sm text-gray-400"
        }`}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
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
  const [billingAddrLine2, setBillingAddrLine2] = useState("");
  const [billingAddrState, setBillingAddrState] = useState("");
  const [billingAddrCity, setBillingAddrCity] = useState("");
  const [billingAddrZip, setBillingAddrZip] = useState("");
  
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [giftCardNumber, setGiftCardNumber] = useState("");
  const [giftCardPin, setGiftCardPin] = useState("");

  const [shippingAddrLine1, setShippingAddrLine1] = useState("");
  const [shippingAddrLine2, setShippingAddrLine2] = useState("");
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
      <header className="w-full bg-white border-b border-black">
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
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="space-y-6 lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Shipping Section */}
              <div className="bg-white border border-black">
                <div className="bg-[#757575] px-4 py-2 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-white">1. Shipping</h2>
                </div>
                <div className="p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-black">Ship To:</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FloatingLabelInput
                        id="first-name"
                        label="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => {
                          maybeLogin(phoneNumber);
                        }}
                        required
                        data-testid="first-name-input"
                      />
                    </div>
                    <div>
                      <FloatingLabelInput
                        id="last-name"
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => {
                          maybeLogin(phoneNumber);
                        }}
                        required
                        data-testid="last-name-input"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <FloatingLabelInput
                      id="phone-number"
                      label="Phone Number"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhone(tryFormatPhone(e.target.value));
                        maybeLogin(e?.target.value);
                      }}
                      type="tel"
                      required
                      className="pr-8"
                    />
                    <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <FloatingLabelInput
                        id="address-1"
                        label="Address 1"
                        value={shippingAddrLine1}
                        onChange={(e) => setShippingAddrLine1(e.target.value)}
                        required
                      />
                    </div>
                    <label className="flex items-center gap-1 text-xs text-black cursor-pointer mt-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={poBox}
                        onChange={(e) => setPoBox(e.target.checked)}
                        className="w-3 h-3"
                      />
                      PO Box
                    </label>
                  </div>

                  <div>
                    <FloatingLabelInput
                      id="address-2"
                      label="Address 2"
                      value={shippingAddrLine2}
                      onChange={(e) => setShippingAddrLine2(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <FloatingLabelInput
                        id="city"
                        label="City"
                        value={shippingAddrCity}
                        onChange={(e) => setShippingAddrCity(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <FloatingLabelSelect
                        id="state"
                        label="State"
                        value={shippingAddrState}
                        onChange={(e) => setShippingAddrState(e.target.value)}
                        required
                      >
                        <option value="">Select</option>
                        {usStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </FloatingLabelSelect>
                    </div>
                  </div>

                  <div>
                    <FloatingLabelInput
                      id="zip-code"
                      label="Zip Code"
                      value={shippingAddrZip}
                      onChange={(e) => setShippingAddrZip(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Capital One Shopping Promotion */}
              <div className="bg-white border border-black p-4">
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
                  className="w-full bg-black text-white py-2 px-4 text-sm font-semibold hover:bg-gray-800 mb-2 rounded-sm"
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
              <div className="bg-white border border-black">
                <div className="bg-[#757575] px-4 py-2 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-white">2. Payment</h2>
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
                      <div className="mt-2 p-3 bg-gray-50 border border-black space-y-4">
                        <FloatingLabelInput
                          id="gift-card-number"
                          label="Gift card number"
                          value={giftCardNumber}
                          onChange={(e) => setGiftCardNumber(e.target.value)}
                        />
                        <FloatingLabelInput
                          id="gift-card-pin"
                          label="PIN"
                          value={giftCardPin}
                          onChange={(e) => setGiftCardPin(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-black">Payment Method:</h3>

                  {/* Credit Card Form - Hide when Accelerate wallet is loaded */}
                  {!(accelLoaded && isLoggedIn) && (
                    <div className="space-y-4">
                      <div>
                        <FloatingLabelInput
                          id="card-number"
                          label="Card Number"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs text-black mb-1 font-semibold">
                            Exp. Date<span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <select 
                              value={cardExpMonth}
                              onChange={(e) => setCardExpMonth(e.target.value)}
                              className="w-full px-3 py-3 border border-black text-sm focus:outline-none focus:border-black bg-white appearance-none"
                              style={{
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                appearance: 'none',
                              }}
                            >
                              <option value="">Month</option>
                              {months.map((month) => (
                                <option key={month} value={month}>
                                  {month.toString().padStart(2, "0")}
                                </option>
                              ))}
                            </select>
                            <select 
                              value={cardExpYear}
                              onChange={(e) => setCardExpYear(e.target.value)}
                              className="w-full px-3 py-3 border border-black text-sm focus:outline-none focus:border-black bg-white appearance-none"
                              style={{
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                appearance: 'none',
                              }}
                            >
                              <option value="">Year</option>
                              {years.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="relative">
                          <label className="block text-xs text-black mb-1 flex items-center font-semibold">
                            CVV<span className="text-red-500">*</span>
                            <Info className="ml-1 w-3 h-3 text-gray-400" />
                          </label>
                          <input
                            id="cvv"
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full px-3 py-3 border border-black text-sm focus:outline-none focus:border-black pr-8"
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
                      <FloatingLabelInput
                        id="billing-address-1"
                        label="Street address"
                        value={billingAddrLine1}
                        onChange={(e) => setBillingAddrLine1(e.target.value)}
                      />
                      <FloatingLabelInput
                        id="billing-address-2"
                        label="Apartment, suite, etc. (optional)"
                        value={billingAddrLine2}
                        onChange={(e) => setBillingAddrLine2(e.target.value)}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <FloatingLabelInput
                            id="billing-city"
                            label="City"
                            value={billingAddrCity}
                            onChange={(e) => setBillingAddrCity(e.target.value)}
                          />
                        </div>
                        <div>
                          <FloatingLabelSelect
                            id="billing-state"
                            label="State"
                            value={billingAddrState}
                            onChange={(e) => setBillingAddrState(e.target.value)}
                          >
                            <option value="">State</option>
                            {usStates.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </FloatingLabelSelect>
                        </div>
                      </div>
                      <FloatingLabelInput
                        id="billing-zip"
                        label="ZIP"
                        value={billingAddrZip}
                        onChange={(e) => setBillingAddrZip(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Payment Options */}
                  <div className="pt-4">
                    {/* Account Lookup */}
                    <div className="flex items-center gap-4 py-3 border-t border-b border-black">
                      <button
                        type="button"
                        className="border border-black h-10 px-4 text-xs font-semibold text-black hover:bg-gray-50 flex items-center justify-center gap-2 flex-shrink-0 rounded-sm w-32 whitespace-nowrap"
                      >
                        Account Lookup
                      </button>
                      <p className="text-xs text-black">
                        Have an Ann Taylor/LOFT credit card? Look for your account
                      </p>
                    </div>

                    {/* PayPal */}
                    <div className="flex items-center gap-4 py-3 border-b border-black">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment("paypal")}
                        className="border border-black h-10 px-4 hover:bg-gray-50 flex items-center justify-center flex-shrink-0 rounded-sm w-32"
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
                    <div className="flex items-center gap-4 py-3 border-b border-black">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment("klarna")}
                        className="border border-black h-10 px-4 hover:bg-gray-50 flex items-center justify-center flex-shrink-0 rounded-sm w-32"
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
                    <div className="flex items-center gap-4 py-3 border-b border-black">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment("applepay")}
                        className="border border-black h-10 px-4 hover:bg-gray-50 flex items-center justify-center flex-shrink-0 rounded-sm w-32"
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
                  <p className="text-xs text-black text-center pt-4 border-t border-gray-200">
                    By placing your order, you agree to our{" "}
                    <a href="#" className="underline">Privacy Policy</a> and{" "}
                    <a href="#" className="underline">Terms of Use</a>.
                  </p>

                  {/* Place Order Button */}
                  <button
                    type="submit"
                    disabled={!selectedCard || isSubmitting}
                    className="w-full bg-black text-white font-semibold py-4 text-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-sm"
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

                  <p className="text-xs text-black text-center">
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
          <div className="lg:sticky lg:top-8 h-fit lg:col-span-2">
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
