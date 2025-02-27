"use client";
import { FormEvent, useState } from "react"; // React hooks for managing state and handling form events
import { CheckoutSummary } from "../full/payment/CheckoutSummary"; // Component for displaying checkout summary
import { stripeOptions } from "../options"; // Stripe options for payment processing
import Script from "next/script"; // Next.js component for loading external scripts
import { useRouter } from "next/navigation"; // Hook for programmatic navigation
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types"; // Type definitions for Accelerate API
import Image from "next/image"; // Next.js component for optimized image loading
import { AccelerateWallet } from "../../components/AccelerateWallet"; // Component for Accelerate Wallet

// Declare global types for the window object
declare global {
  interface Window {
    accelerate: AccelerateWindowAPI; // Extend the Window interface to include Accelerate API
  }
}

// Function to format phone numbers
function tryFormatPhone(pn: string): string {
  // First, clean the input by removing all non-digit characters
  const cleanedNumber = pn.replace(/\D/g, "");

  // Check if we have a valid number (either 10 digits or 11 digits starting with 1)
  if (!cleanedNumber.match(/^(1?\d{10})$/)) {
    return pn; // Return original if invalid
  }

  // Get the last 10 digits regardless of format
  const last10 = cleanedNumber.slice(-10);

  // Format as XXX-XXX-XXXX
  return `${last10.slice(0, 3)}-${last10.slice(3, 6)}-${last10.slice(6)}`;
}

// Main CheckoutPage component
export default function CheckoutPage() {
  const router = useRouter(); // Initialize router for navigation

  // State variables for form inputs
  const [phoneNumber, setPhone] = useState(
    ""
    //typeof window !== "undefined" && window.location.protocol === "http:" ? "512-123-1111" : "", // Default phone number for HTTP
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // Add new payment-related state
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [accelLoaded, setAccelerateLoaded] = useState(false);
  // Add new state for tracking login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Separate billing and shipping address states
  const [billingAddrLine1, setBillingAddrLine1] = useState("");
  const [billingAddrState, setBillingAddrState] = useState("");
  const [billingAddrCity, setBillingAddrCity] = useState("");
  const [billingAddrZip, setBillingAddrZip] = useState("");

  const [shippingAddrLine1, setShippingAddrLine1] = useState("");
  const [shippingAddrState, setShippingAddrState] = useState("");
  const [shippingAddrCity, setShippingAddrCity] = useState("");
  const [shippingAddrZip, setShippingAddrZip] = useState("");

  // Add new state for shipping name
  const [shippingName, setShippingName] = useState("");

  // Function to populate address fields from Accelerate user data
  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user?.addresses[0]) {
      // Prefill billing address
      setBillingAddrLine1(user.addresses[0].line1 || billingAddrLine1);
      setBillingAddrCity(user.addresses[0].city || billingAddrCity);
      setBillingAddrState(user.addresses[0].state || billingAddrState);
      setBillingAddrZip(user.addresses[0].postalCode || billingAddrZip);

      // Prefill shipping address with the same information
      setShippingAddrLine1(user.addresses[0].line1 || shippingAddrLine1);
      setShippingAddrCity(user.addresses[0].city || shippingAddrCity);
      setShippingAddrState(user.addresses[0].state || shippingAddrState);
      setShippingAddrZip(user.addresses[0].postalCode || shippingAddrZip);
    }
  };

  // Update handleSubmit to handle payment processing
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    console.log("EVENT", e);
    e.preventDefault();
    if (selectedCard) {
      const card = await window.accelerate.requestSource(selectedCard);
      console.log({ card: JSON.stringify(card) });
      router.push(
        `/full/payment/confirmation?` +
          `firstName=${encodeURIComponent(firstName)}&` +
          `lastName=${encodeURIComponent(lastName)}&` +
          `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
          // Billing address parameters
          `billingAddress=${encodeURIComponent(billingAddrLine1)}&` +
          `billingCity=${encodeURIComponent(billingAddrCity)}&` +
          `billingState=${encodeURIComponent(billingAddrState)}&` +
          `billingZip=${encodeURIComponent(billingAddrZip)}&` +
          // Shipping address parameters
          `shippingName=${encodeURIComponent(shippingName)}&` +
          `shippingAddress=${encodeURIComponent(shippingAddrLine1)}&` +
          `shippingCity=${encodeURIComponent(shippingAddrCity)}&` +
          `shippingState=${encodeURIComponent(shippingAddrState)}&` +
          `shippingZip=${encodeURIComponent(shippingAddrZip)}&` +
          // Other parameters
          `shipping=${encodeURIComponent(selectedShipping)}&` +
          `cardLast4=${encodeURIComponent(card?.details?.mask || "")}&` +
          `totalPrice=${encodeURIComponent(totalPrice)}`
      );
    } else {
      return;
    }
  };

  const maybeLogin = (phoneValue: string) => {
    console.log({ firstName, lastName, phoneValue });

    if (firstName == "") return;
    if (lastName == "") return;

    // Remove all non-digit characters to normalize the input
    const cleanedPhone = phoneValue.replace(/\D/g, "");

    // Check if the number matches one of these formats:
    // 1. Exactly 10 digits (standard US number without country code)
    // 2. 11 digits starting with 1 (US number with country code)
    const phoneRegex = /^(1\d{10}|[2-9]\d{9})$/;

    if (!phoneRegex.test(cleanedPhone)) return;

    // Always ensure exactly 10 digits by removing leading 1 if present
    const finalPhone = cleanedPhone.slice(-10);
    window.accelerate.login({
      firstName,
      lastName,
      phoneNumber: finalPhone,
      email: email || "test.demo@weaccelerate.com",
    });
  };

  // Render the component
  return (
    <div className="flex overflow-hidden flex-col bg-white">
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex gap-3 items-center">
              <span className="text-3xl font-black text-blue-500">
                <Image src="/baggslogo.svg" alt="Baggs Logo" width={30} height={30} /> {/* Logo */}
              </span>
              <span className="text-2xl font-bold tracking-tighter text-stone-950">Baggs</span> {/* Brand name */}
            </div>
            <Image src="/checkoutbag.svg" alt="Checkout Bag" width={30} height={30} className="h-6 w-6" />{" "}
            {/* Checkout bag icon */}
          </div>
        </div>
      </header>

      <main className="flex flex-wrap md:flex-nowrap md:flex-row-reverse justify-center w-full max-w-7xl mx-auto">
        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[520px] md:border-l border-neutral-200">
          <div className="max-w-[444px] w-full mx-auto">
            <CheckoutSummary
              selectedShipping={selectedShipping === "express"}
              shippingCost={shippingCost}
              onTotalChange={(total: number) => {
                setTotalPrice(total);
                return true;
              }}
            />
          </div>
        </section>

        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[659px]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {" "}
            {/* Form for user input */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row gap-3.5">
                  <input
                    data-testid="first-name-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => {
                      maybeLogin(phoneNumber);
                    }}
                    placeholder="First name"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    data-testid="last-name-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => {
                      maybeLogin(phoneNumber);
                    }}
                    placeholder="Last name"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhone(tryFormatPhone(e.target.value));
                    maybeLogin(e?.target.value);
                  }}
                  placeholder="Phone number"
                  type="tel"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Billing Information</h3>
              <div className="space-y-3.5">
                <input
                  placeholder="Address"
                  value={billingAddrLine1}
                  onChange={(e) => setBillingAddrLine1(e.target.value)}
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  placeholder="Apartments, suite, etc (optional)"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                  <input
                    placeholder="City"
                    value={billingAddrCity}
                    onChange={(e) => setBillingAddrCity(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    placeholder="State"
                    value={billingAddrState}
                    onChange={(e) => setBillingAddrState(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    placeholder="Zip code"
                    value={billingAddrZip}
                    onChange={(e) => setBillingAddrZip(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Shipping Information</h3>
              <div className="space-y-3.5">
                <input
                  placeholder="Name (optional)"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  placeholder="Address"
                  value={shippingAddrLine1}
                  onChange={(e) => setShippingAddrLine1(e.target.value)}
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  placeholder="Apartments, suite, etc (optional)"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                  <input
                    placeholder="City"
                    value={shippingAddrCity}
                    onChange={(e) => setShippingAddrCity(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    placeholder="State"
                    value={shippingAddrState}
                    onChange={(e) => setShippingAddrState(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    placeholder="Zip code"
                    value={shippingAddrZip}
                    onChange={(e) => setShippingAddrZip(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
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
                  {selectedPayment === "card" && accelLoaded && isLoggedIn && (
                    <div className="mt-4 w-full">
                      <AccelerateWallet />
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
            {errorMessage && <div className="text-red-600 font-medium text-center mb-4">{errorMessage}</div>}{" "}
            {/* Display error message if exists */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={!selectedCard}
                className="w-full h-[56px] text-xl font-semibold text-white bg-sky-700 disabled:bg-sky-700/50 rounded-md"
              >
                Pay now
              </button>
            </div>
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
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT} // Load external script for Accelerate
        strategy="afterInteractive" // Load script after the page is interactive
        onReady={() => {
          console.log("p1.onReady");
          window.accelerate.init({
            // Initialize Accelerate API
            amount: stripeOptions.amount, // Set payment amount
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!, // Set merchant ID
            checkoutFlow: "Inline", // Set checkout flow
            checkoutMode: "StripeToken", // Set checkout mode
            onLoginSuccess: (user) => {
              // Callback for successful login
              console.log("Accelerate user logged in", { user }); // Log user data
              maybeUseAccelUser(user); // Populate address fields with user data
              setIsLoggedIn(true); // Set login status to true
            },
            onCardSelected: (cardId) => {
              setSelectedCard(cardId);
            },
            onPaymentInitiated: async (source) => {
              // Callback for payment initiation
              const confirmIntent = await fetch("/api/stripe/confirm", {
                // Send payment intent to server
                method: "POST",
                body: JSON.stringify({
                  processorToken: source.processorToken, // Payment intent ID
                  cartId: "some-cart", // Cart ID
                }),
              });
              const res = (await confirmIntent.json()) as { status: string; message?: string }; // Parse response
              if (res.status === "succeeded") {
                router.push("/completion?status=succeeded"); // Navigate to completion page on success
              } else {
                setErrorMessage(res.message || "Unknown error"); // Set error message on failure
              }
            },
          });
          setAccelerateLoaded(true);
        }}
      />
    </div>
  );
}
