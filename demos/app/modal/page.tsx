"use client";
import { FormEvent, useState } from "react"; // React hooks for managing state and handling form events
import { CheckoutSummary } from "../modal/payment/CheckoutSummary"; // Component for displaying checkout summary
import { stripeOptions } from "../options"; // Stripe options for payment processing
import Script from "next/script"; // Next.js component for loading external scripts
import { useRouter } from "next/navigation"; // Hook for programmatic navigation
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types"; // Type definitions for Accelerate API
import Image from "next/image"; // Next.js component for optimized image loading

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
  const [addrLine1, setAddrLine1] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [email, setEmail] = useState("");
  // Function to populate address fields from Accelerate user data
  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user?.addresses[0]) {
      setAddrLine1(user.addresses[0].line1 || addrLine1);
      setAddrCity(user.addresses[0].city || addrCity);
      setAddrState(user.addresses[0].state || addrState);
      setAddrZip(user.addresses[0].postalCode || addrZip);
    }
  };

  // Form submission handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams({
      email: (document.querySelector('input[placeholder="Email"]') as HTMLInputElement)?.value || "",
      phone: phoneNumber,
      firstName,
      lastName,
      address: addrLine1,
      city: addrCity,
      state: addrState,
      zip: addrZip,
    });
    router.push(`/modal/payment?${params.toString()}`); // Navigate to payment page with query parameters
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
      email,
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
              shippingCost={0} // Shipping cost
              onTotalChange={(total) => {
                console.log("Total changed:", total); // Log total change
                return true; // Return true for total change
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
              <h3 className="font-semibold mb-4">Shipping Information</h3>
              <div className="space-y-3.5">
                <input
                  placeholder="Address"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  placeholder="Apartments, suite, etc (optional)"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                  <input
                    placeholder="City"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    placeholder="State"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    placeholder="Zip code"
                    value={addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full h-[56px] text-xl font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-sky-700/50 rounded-md"
              >
                Continue
              </button>
            </div>
          </form>

          <footer className="flex flex-wrap gap-3.5 py-5 mt-8 text-sm text-sky-600 border-t border-neutral-200">
            <a href="#" className="hover:underline">
              Return policy
            </a>{" "}
            {/* Link to return policy */}
            <a href="#" className="hover:underline">
              Privacy policy
            </a>{" "}
            {/* Link to privacy policy */}
            <a href="#" className="hover:underline">
              Terms of service
            </a>{" "}
            {/* Link to terms of service */}
          </footer>
        </section>
      </main>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT} // Load external script for Accelerate
        strategy="afterInteractive" // Load script after the page is interactive
        onReady={() => {
          window.accelerate.init({
            // Initialize Accelerate API
            amount: stripeOptions.amount, // Set payment amount
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!, // Set merchant ID
            checkoutFlow: "Modal", // Set checkout flow
            checkoutMode: "StripeToken", // Set checkout mode
            onLoginSuccess: (user) => {
              // Callback for successful login
              console.log("Accelerate user logged in", { user }); // Log user data
              maybeUseAccelUser(user); // Populate address fields with user data
            },
            onCardSelected: (cid) => {
              // Callback for card selection
              console.log(cid); // Log selected card ID
            },
          });
        }}
      />
    </div>
  );
}
