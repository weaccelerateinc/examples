"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import Image from "next/image";
import Link from "next/link";
import { CheckoutSummary } from "./CheckoutSummary";
import { Lock, Zap } from "lucide-react";

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

function CheckoutContent() {
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
  const productImageParam = searchParams.get("productImage");
  const productImage = (productImageParam && productImageParam.trim() !== "") ? productImageParam : "/shirt.avif";

  // State variables for form inputs
  const [phoneNumber, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [email, setEmail] = useState("");
  const [defaultCard, setDefaultCard] = useState<{
    artUrl: string;
    cardId: string;
    cardName: string;
    cardType: string;
    last4: string;
  } | null>(null);

  // Function to populate address fields from Accelerate user data
  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user.firstName) {
      setFirstName(user.firstName);
    }
    if (user.lastName) {
      setLastName(user.lastName);
    }
    if (user.phoneNumber) {
      setPhone(user.phoneNumber);
    }
    if (user.emailAddress) {
      setEmail(user.emailAddress);
    }
    if (user?.addresses[0]) {
      setAddrLine1(user.addresses[0].line1 || addrLine1);
      setAddrCity(user.addresses[0].city || addrCity);
      setAddrState(user.addresses[0].state || addrState);
      setAddrZip(user.addresses[0].postalCode || addrZip);
    }
    console.log({ user });
    if (user.quickCard) {
      setDefaultCard(user.quickCard);
    }
  };

  // Form submission handler
  const handleSubmit = async (useDefaultCard?: boolean) => {
    const params = new URLSearchParams({
      email: email || "",
      phone: phoneNumber,
      firstName,
      lastName,
      address: addrLine1,
      city: addrCity,
      state: addrState,
      zip: addrZip,
      defaultCardId: useDefaultCard ? defaultCard?.cardId || "" : "",
      // Product information
      productId,
      productTitle,
      productPrice: productPrice.toString(),
      variantId,
      variantTitle,
      quantity: quantity.toString(),
      productImage,
    });
    router.push(`/pdp2/payment?${params.toString()}`);
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
    <div className="min-h-screen w-screen bg-slate-100 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
          <Link href="/pdp2" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Powered by Accelerate Checkout
              </span>
            </div>
          </Link>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(true);
              }}
              className="space-y-8"
            >
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
                    placeholder="Email"
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

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Billing Address</h2>
                <div className="space-y-4">
                  <input
                    placeholder="Street address"
                    value={addrLine1}
                    onChange={(e) => setAddrLine1(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    placeholder="City"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    placeholder="State"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <input
                    placeholder="ZIP"
                    value={addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {defaultCard ? (
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3"
                  >
                    {defaultCard.artUrl && defaultCard.artUrl.trim() !== "" && (
                      <img src={defaultCard.artUrl} alt={defaultCard.cardName} className="h-8 w-auto rounded" />
                    )}
                    <span className="text-lg font-semibold">
                      Pay now ••••{defaultCard.last4}
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-500/30"
                  >
                    Continue to Payment
                  </button>
                )}
                {defaultCard && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDefaultCard(null);
                      handleSubmit(false);
                    }}
                    className="w-full bg-white text-slate-700 font-semibold py-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                  >
                    Continue with a different card
                  </button>
                )}
              </div>
            </form>

            <footer className="flex flex-wrap gap-3.5 py-5 text-sm text-slate-600">
              <a href="https://www.weaccelerate.com/privacy" className="hover:underline">
                Privacy policy
              </a>
              <a href="https://www.weaccelerate.com/terms" className="hover:underline">
                Terms of service
              </a>
            </footer>
          </div>

          <div className="lg:sticky lg:top-8 h-fit order-1 lg:order-2">
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
        </div>
      </main>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("pdp2-checkout.onReady");
          // Hardcode the amount to $0.99 for testing
          const hardcodedAmount = 0.99;

          window.accelerate.init({
            amount: Math.round(hardcodedAmount * 100), // Convert to cents (99 cents)
            merchantId: process.env.NEXT_PUBLIC_PDP_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            universalAuth: true,
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

export default function PDPCheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
