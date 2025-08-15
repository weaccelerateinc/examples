"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { stripeOptions } from "../../options";
import type { AccelerateWindowAPI } from "accelerate-js-types";
import { CheckoutSummary } from "./CheckoutSummary";
import Image from "next/image";
import { AccelerateWallet } from "../../../components/AccelerateWallet";
import { UnifiedCreditCardSpeech } from "../../components/UnifiedCreditCardSpeech";

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
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCvv, setNewCardCvv] = useState("");

  // Debug logging for state changes
  const handleCardNumberChange = (value: string) => {
    console.log("Payment page - Setting card number:", value);
    setNewCardNumber(value);
  };

  const handleCardExpiryChange = (value: string) => {
    console.log("Payment page - Setting card expiry:", value);
    setNewCardExpiry(value);
    console.log("Payment page - State after setting expiry:", { newCardExpiry: value });
  };

  const handleCardCvvChange = (value: string) => {
    console.log("Payment page - Setting card CVV:", value);
    setNewCardCvv(value);
  };

  console.log({
    selectedPayment,
    accelLoaded,
    newCardNumber,
    newCardExpiry,
    newCardCvv,
  });
  const handleSubmit = async (e: FormEvent) => {
    console.log("EVENT", e);
    e.preventDefault();

    if (selectedPayment === "card" && selectedCard) {
      const card = await window.accelerate.requestSource(selectedCard);
      if ("status" in card) {
        console.log("Error", { card });
        return;
      }
      console.log({ card: JSON.stringify(card) });
      router.push(
        `/integrated2/payment/confirmation?` +
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
    } else if (selectedPayment === "newCard") {
      // Handle new credit card submission
      if (!newCardNumber || !newCardExpiry || !newCardCvv) {
        alert("Please fill in all credit card fields");
        return;
      }

      // Extract last 4 digits for display
      const last4 = newCardNumber.replace(/\D/g, "").slice(-4);

      router.push(
        `/integrated2/payment/confirmation?` +
          `firstName=${encodeURIComponent(firstName)}&` +
          `lastName=${encodeURIComponent(lastName)}&` +
          `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
          `address=${encodeURIComponent(address)}&` +
          `city=${encodeURIComponent(city)}&` +
          `state=${encodeURIComponent(state)}&` +
          `zip=${encodeURIComponent(zip)}&` +
          `shipping=${encodeURIComponent(selectedShipping)}&` +
          `cardLast4=${encodeURIComponent(last4)}&` +
          `totalPrice=${encodeURIComponent(totalPrice)}`
      );
    } else {
      return;
    }
  };

  return (
    <div className="flex overflow-hidden flex-col bg-white">
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex gap-3 items-center">
              <span className="text-3xl font-black text-blue-500">
                <Image src="/baggslogo.svg" alt="Baggs Logo" width={30} height={30} />
              </span>
              <span className="text-2xl font-bold tracking-tighter text-stone-950">Baggs</span>
            </div>
            <Image src="/checkoutbag.svg" alt="Checkout Bag" className="h-6 w-6" width={30} height={30} />
          </div>
        </div>
      </header>

      <main className="flex flex-wrap md:flex-nowrap md:flex-row-reverse justify-center w-full max-w-7xl mx-auto">
        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[520px] md:border-l border-neutral-200">
          <CheckoutSummary
            selectedShipping={selectedShipping === "express"}
            shippingCost={shippingCost}
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
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  placeholder="Apartments, suite, etc (optional)"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <div className="flex flex-wrap gap-3.5">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="Zip code"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-4">Shipping Method</h3>
              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <label className="flex gap-3 p-3.5 border-b border-neutral-200">
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
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-2 ${
                      selectedShipping === "standard" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Standard Shipping</div>
                    <div className="text-sm text-neutral-500">4-10 business days</div>
                  </div>
                  <div className="text-sm">FREE</div>
                </label>

                <label className="flex gap-3 p-3.5">
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
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-2 ${
                      selectedShipping === "express" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Express Shipping</div>
                    <div className="text-sm text-neutral-500">2-5 business days</div>
                  </div>
                  <div className="text-sm">$9.99</div>
                </label>
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
                      <AccelerateWallet />
                    </div>
                  )}
                </div>

                <div className="p-3.5 border-b border-neutral-200">
                  <label className="flex gap-3 items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="newCard"
                      checked={selectedPayment === "newCard"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-[18px] h-[18px] rounded-full border-2 ${
                        selectedPayment === "newCard" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm">New Credit Card</div>
                    </div>
                  </label>
                  {selectedPayment === "newCard" && (
                    <div className="mt-4 space-y-4">
                      {/* Regular input fields */}
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Credit Card Number"
                          value={newCardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Exp"
                            value={newCardExpiry}
                            onChange={(e) => handleCardExpiryChange(e.target.value)}
                            className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                            onFocus={() => console.log("Expiry field focused, current value:", newCardExpiry)}
                          />
                          <input
                            placeholder="CVV"
                            value={newCardCvv}
                            onChange={(e) => handleCardCvvChange(e.target.value)}
                            className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Unified Voice & Camera Input */}
                      <UnifiedCreditCardSpeech
                        onCardNumberChange={handleCardNumberChange}
                        onExpiryChange={handleCardExpiryChange}
                        onCvvChange={handleCardCvvChange}
                      />
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
              disabled={
                (selectedPayment === "card" && !selectedCard) ||
                (selectedPayment === "newCard" && (!newCardNumber || !newCardExpiry || !newCardCvv))
              }
              className="w-full h-[56px] text-xl font-semibold text-white bg-sky-700 disabled:bg-sky-700/50 rounded-md"
            >
              Pay now
            </button>
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
