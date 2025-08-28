"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import Image from "next/image";
import Link from "next/link";
import { CheckoutSummary } from "./CheckoutSummary";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

// Function to format phone numbers
function tryFormatPhone(pn: string): string {
  const cleanedNumber = pn.replace(/\D/g, "");
  if (!cleanedNumber.match(/^(1?\d{10})$/)) {
    return pn;
  }
  const last10 = cleanedNumber.slice(-10);
  return `${last10.slice(0, 3)}-${last10.slice(3, 6)}-${last10.slice(6)}`;
}

export default function PDPCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get product information from URL params
  const productId = searchParams.get("productId") || "";
  const productTitle = searchParams.get("productTitle") || "";
  // Hardcode product price to $0.99
  const productPrice = 0.99;
  const variantId = searchParams.get("variantId") || "1";
  const variantTitle = searchParams.get("variantTitle") || "Standard";
  const quantity = parseInt(searchParams.get("quantity") || "1");
  const productImage = searchParams.get("productImage") || "/shirt.avif";

  // State variables for form inputs
  const [phoneNumber, setPhone] = useState("");
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
      // Product information
      productId,
      productTitle,
      productPrice: productPrice.toString(),
      variantId,
      variantTitle,
      quantity: quantity.toString(),
      productImage,
    });
    router.push(`/pdp/payment?${params.toString()}`);
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

  return (
    <div className="flex overflow-hidden flex-col bg-white">
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <Link href="/pdp" className="flex gap-3 items-center hover:opacity-80 transition-opacity">
              <span className="text-3xl font-black text-blue-500">
                <Image src="/baggslogo.svg" alt="Accelerate Swag Store Logo" width={30} height={30} />
              </span>
              <span className="text-2xl font-bold tracking-tighter text-stone-950">Accelerate Swag Store</span>
            </Link>
            <Image src="/checkoutbag.svg" alt="Checkout Bag" width={30} height={30} className="h-6 w-6" />
          </div>
        </div>
      </header>

      <main className="flex flex-wrap md:flex-nowrap md:flex-row-reverse justify-center w-full max-w-7xl mx-auto">
        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[520px] md:border-l border-neutral-200">
          <div className="max-w-[444px] w-full mx-auto">
            <CheckoutSummary
              productImage={productImage}
              productTitle={productTitle}
              variantTitle={variantTitle}
              productPrice={productPrice}
              quantity={quantity}
              onTotalChange={(total) => {
                console.log("Total changed:", total);
                return true;
              }}
            />
          </div>
        </section>

        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[659px]">
          <form onSubmit={handleSubmit} className="space-y-8">
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
              <Link
                href="/pdp"
                className="w-full h-[56px] text-xl font-semibold text-sky-700 bg-white border-2 border-sky-700 hover:bg-sky-50 rounded-md flex items-center justify-center transition-colors"
              >
                Back to Products
              </Link>
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
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("pdp-checkout.onReady");
          // Hardcode the amount to $0.99 for testing
          const hardcodedAmount = 0.99;
          
          window.accelerate.init({
            amount: Math.round(hardcodedAmount * 100), // Convert to cents (99 cents)
            merchantId: process.env.NEXT_PUBLIC_PDP_MERCHANT_ID!,
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
