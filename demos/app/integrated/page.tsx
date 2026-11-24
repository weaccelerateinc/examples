"use client";
import { FormEvent, useState } from "react"; // React hooks for managing state and handling form events
import { CheckoutSummary } from "./payment/CheckoutSummary"; // Component for displaying checkout summary
import { stripeOptions } from "../options"; // Stripe options for payment processing
import Script from "next/script"; // Next.js component for loading external scripts
import { useRouter } from "next/navigation"; // Hook for programmatic navigation
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types"; // Type definitions for Accelerate API
import { ArrowRight, Sparkles } from "lucide-react"; // Icons
import { Field, Shell } from "./_brand/Shell"; // Accelerate-branded page chrome and fields

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
  const [phoneNumber, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [email, setEmail] = useState("");
  // True once Accelerate has filled in the address, to show where the data came from
  const [accelFilled, setAccelFilled] = useState(false);

  // Function to populate address fields from Accelerate user data
  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user?.addresses[0]) {
      setAddrLine1(user.addresses[0].line1 || addrLine1);
      setAddrCity(user.addresses[0].city || addrCity);
      setAddrState(user.addresses[0].state || addrState);
      setAddrZip(user.addresses[0].postalCode || addrZip);
      setAccelFilled(true);
    }
  };

  // Form submission handler
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
    router.push(`/integrated/payment?${params.toString()}`); // Navigate to payment page with query parameters
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
    <>
      <Shell
        step={1}
        title="Checkout"
        lead="Start with your name and mobile number. Accelerate fills in your shipping and payment details, even on your first visit."
      >
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
          <form onSubmit={handleSubmit} className="space-y-6 acc-reveal acc-reveal-2">
            <section className="acc-card" aria-labelledby="contact-heading">
              <div className="acc-card-head">
                <h2 id="contact-heading" className="acc-h4">
                  Contact
                </h2>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="First name"
                    data-testid="first-name-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => {
                      maybeLogin(phoneNumber);
                    }}
                    autoComplete="given-name"
                  />
                  <Field
                    label="Last name"
                    data-testid="last-name-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => {
                      maybeLogin(phoneNumber);
                    }}
                    autoComplete="family-name"
                  />
                </div>
                <Field
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                />
                <div>
                  <Field
                    label="Mobile number"
                    prefix="+1"
                    mono
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhone(tryFormatPhone(e.target.value));
                      maybeLogin(e?.target.value);
                    }}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                  />
                  <p className="flex items-start gap-2 acc-caption mt-2.5">
                    <Sparkles size={14} strokeWidth={2} className="mt-[1px] flex-none text-[var(--pine-3)]" aria-hidden />
                    <span>Accelerate uses your mobile number to find your saved address and cards.</span>
                  </p>
                </div>
              </div>
            </section>

            <section className={`acc-card ${accelFilled ? "acc-sheen" : ""}`} aria-labelledby="billing-heading">
              <div className="acc-card-head">
                <h2 id="billing-heading" className="acc-h4">
                  Billing address
                </h2>
              </div>
              {accelFilled && (
                <div className="mb-5 acc-reveal">
                  <div className="acc-seam acc-seam-liquid mb-3" aria-hidden />
                  <p className="flex items-center gap-2 text-[14px] font-medium text-[var(--pine-5)]">
                    <Sparkles size={15} strokeWidth={2} aria-hidden />
                    Filled in by Accelerate
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <Field
                  label="Street address"
                  value={addrLine1}
                  filled={accelFilled && !!addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  autoComplete="billing address-line1"
                />
                <Field
                  label="City"
                  value={addrCity}
                  filled={accelFilled && !!addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  autoComplete="billing address-level2"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="State"
                    value={addrState}
                    filled={accelFilled && !!addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    autoComplete="billing address-level1"
                  />
                  <Field
                    label="ZIP"
                    value={addrZip}
                    filled={accelFilled && !!addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    autoComplete="billing postal-code"
                    inputMode="numeric"
                    mono
                  />
                </div>
              </div>
            </section>

            <div>
              <button type="submit" className="acc-btn acc-btn-primary w-full">
                Continue to payment
                <ArrowRight size={18} strokeWidth={2.25} className="acc-btn-arrow" aria-hidden />
              </button>
              <p className="acc-caption text-center mt-3">This is a demo store. You will never be charged.</p>
            </div>
          </form>

          <aside className="space-y-6 lg:sticky lg:top-[104px] acc-reveal acc-reveal-3">
            <CheckoutSummary
              shippingCost={0} // Shipping cost
              onTotalChange={(total) => {
                console.log("Total changed:", total); // Log total change
                return true; // Return true for total change
              }}
            />
          </aside>
        </div>
      </Shell>

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
            },
            onCardSelected: (cid) => {
              // Callback for card selection
              console.log(cid); // Log selected card ID
            },
          });
        }}
      />
    </>
  );
}
