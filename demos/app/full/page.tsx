"use client";
import { FormEvent, useState } from "react"; // React hooks for managing state and handling form events
import { CheckoutSummary } from "../full/payment/CheckoutSummary"; // Component for displaying checkout summary
import { stripeOptions } from "../options"; // Stripe options for payment processing
import Script from "next/script"; // Next.js component for loading external scripts
import { useRouter } from "next/navigation"; // Hook for programmatic navigation
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types"; // Type definitions for Accelerate API
import Image from "next/image"; // Next.js component for optimized image loading
import { AccelerateWallet } from "../../components/AccelerateWallet"; // Component for Accelerate Wallet
import { Lock, Truck, Zap, CreditCard, Loader2 } from "lucide-react"; // Icons

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
  // Add state for different shipping address
  const [useDifferentShipping, setUseDifferentShipping] = useState(false);
  // Add state for submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">Accelerate Store</span>
              <span className="text-xs text-slate-500">Powered by Accelerate Checkout</span>
            </div>
          </div>
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Checkout</h1>
          <p className="text-slate-600">Complete your purchase securely</p>
        </div>
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12">
          <div className="space-y-8 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      data-testid="first-name-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={() => {
                        maybeLogin(phoneNumber);
                      }}
                      placeholder="First name"
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      data-testid="last-name-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onBlur={() => {
                        maybeLogin(phoneNumber);
                      }}
                      placeholder="Last name"
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    type="email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhone(tryFormatPhone(e.target.value));
                      maybeLogin(e?.target.value);
                    }}
                    placeholder="Phone number"
                    type="tel"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Billing Information */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Billing Address</h2>
                <div className="space-y-4">
                  <input
                    placeholder="Street address"
                    value={billingAddrLine1}
                    onChange={(e) => setBillingAddrLine1(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    placeholder="Apartment, suite, etc. (optional)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    placeholder="City"
                    value={billingAddrCity}
                    onChange={(e) => setBillingAddrCity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    placeholder="State"
                    value={billingAddrState}
                    onChange={(e) => setBillingAddrState(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    placeholder="ZIP"
                    value={billingAddrZip}
                    onChange={(e) => setBillingAddrZip(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
                
                <div className="mt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDifferentShipping}
                      onChange={(e) => setUseDifferentShipping(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Use a different shipping address</span>
                  </label>
                </div>
              </div>

              {/* Shipping Information (conditional) */}
              {useDifferentShipping && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">Shipping Address</h2>
                  <div className="space-y-4">
                    <input
                      placeholder="Name (optional)"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      placeholder="Street address"
                      value={shippingAddrLine1}
                      onChange={(e) => setShippingAddrLine1(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      placeholder="Apartment, suite, etc. (optional)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      placeholder="City"
                      value={shippingAddrCity}
                      onChange={(e) => setShippingAddrCity(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      placeholder="State"
                      value={shippingAddrState}
                      onChange={(e) => setShippingAddrState(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      placeholder="ZIP"
                      value={shippingAddrZip}
                      onChange={(e) => setShippingAddrZip(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              )}

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

                  {selectedPayment === "card" && accelLoaded && isLoggedIn && (
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

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-medium text-center">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedCard || isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-500/30 disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay now {totalPrice > 0 && `• $${totalPrice.toFixed(2)}`}</>
                )}
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
            <CheckoutSummary
              selectedShipping={selectedShipping === "express"}
              shippingCost={shippingCost}
              onTotalChange={(total: number) => {
                setTotalPrice(total);
                return true;
              }}
            />
          </div>
        </div>
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
