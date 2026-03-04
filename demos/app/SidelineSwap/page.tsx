/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { stripeOptions } from "../options";
import Script from "next/script";
import { useRouter } from "next/navigation";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import Image from "next/image";
import { CheckCircle, Code2, ChevronDown } from "lucide-react";

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

const US_STATES = [
  "", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export default function SidelineSwapCheckout() {
  const router = useRouter();

  const [phoneNumber, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [email] = useState("gryboysheep@gmail.com");
  const [country] = useState("United States");
  const [defaultCard, setDefaultCard] = useState<{
    artUrl: string;
    cardId: string;
    cardName: string;
    cardType: string;
    last4: string;
  } | null>(null);

  const [initCalloutExpanded, setInitCalloutExpanded] = useState(true);
  const [loginCalloutExpanded, setLoginCalloutExpanded] = useState(true);
  const [quickCardCalloutExpanded, setQuickCardCalloutExpanded] = useState(true);

  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user.firstName) setFirstName(user.firstName);
    if (user.lastName) setLastName(user.lastName);
    if (user.phoneNumber) setPhone(user.phoneNumber);
    if (user?.addresses[0]) {
      setAddrLine1(user.addresses[0].line1 || addrLine1);
      setAddrCity(user.addresses[0].city || addrCity);
      setAddrState(user.addresses[0].state || addrState);
      setAddrZip(user.addresses[0].postalCode || addrZip);
    }
    if (user.quickCard) setDefaultCard(user.quickCard);
  };

  const handleSubmit = async (useDefaultCard?: boolean) => {
    const params = new URLSearchParams({
      email,
      phone: phoneNumber,
      firstName,
      lastName,
      address: addrLine1,
      address2: addrLine2,
      city: addrCity,
      state: addrState,
      zip: addrZip,
      country,
      defaultCardId: useDefaultCard ? defaultCard?.cardId || "" : "",
    });
    router.push(`/SidelineSwap/payment?${params.toString()}`);
  };

  const maybeLogin = async (phoneValue: string) => {
    const isLoggedIn = await window.accelerate.isLoggedIn({
      firstName,
      lastName,
      phoneNumber: phoneValue,
      email: email || "test.demo@weaccelerate.com",
    });
    if (isLoggedIn) return;

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
    <div className="min-h-screen w-screen bg-white ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Image
            src="/sidelineswap.svg"
            alt="SidelineSwap"
            width={180}
            height={40}
            className="h-8 w-auto"
          />
          <span className="text-sm text-gray-600 font-medium">Secure Checkout</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Left: Shipping Form */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Shipping</h1>

            {/* Accelerate Init & Auto-fill Callout */}
            <div className="border border-blue-200 bg-blue-50 rounded-lg overflow-hidden mb-6">
              <button
                type="button"
                onClick={() => setInitCalloutExpanded(!initCalloutExpanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-700" />
                  <span className="text-[13px] font-semibold text-blue-900">Accelerate: Init & Auto-fill Shipping</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${initCalloutExpanded ? "rotate-180" : ""}`} />
              </button>
              {initCalloutExpanded && (
                <div className="px-4 py-3 text-[12px] text-blue-900 space-y-2">
                  <p>
                    Call <code className="bg-blue-100 px-1 rounded text-[11px]">accelerate.init()</code> on page load with{" "}
                    <code className="bg-blue-100 px-1 rounded text-[11px]">universalAuth: true</code>.
                    If the customer has verified before, a persistent cookie allows{" "}
                    <code className="bg-blue-100 px-1 rounded text-[11px]">onLoginSuccess</code> to fire automatically — no user interaction needed.
                    Use the returned user data to <strong>pre-fill name, phone, and address fields</strong> instantly.
                  </p>
                  <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                    <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`window.accelerate.init({
  amount: 15000,       // amount in cents
  merchantId: "your-merchant-id",
  checkoutFlow: "Inline",
  checkoutMode: "BraintreeNonce",
  universalAuth: true, // enables cookie-based recognition

  onLoginSuccess: (user) => {
    // Auto-fill form fields with user data
    if (user.firstName) setFirstName(user.firstName);
    if (user.lastName)  setLastName(user.lastName);
    if (user.phoneNumber) setPhone(user.phoneNumber);

    // Auto-fill address from stored addresses
    if (user.addresses?.[0]) {
      setAddrLine1(user.addresses[0].line1);
      setAddrCity(user.addresses[0].city);
      setAddrState(user.addresses[0].state);
      setAddrZip(user.addresses[0].postalCode);
    }

    // If user has a quick card, enable one-click pay
    if (user.quickCard) setDefaultCard(user.quickCard);
  },
});`}
                    </pre>
                  </div>
                  <div className="bg-blue-100/50 rounded p-2.5 text-[11px] text-blue-800">
                    <p>
                      <strong><code className="bg-blue-100 px-1 rounded">universalAuth: true</code></strong> — Enables cookie-based recognition across sessions.
                      Once a customer verifies via 2FA, Accelerate sets a persistent cookie. On return visits,{" "}
                      <code className="bg-blue-100 px-1 rounded">onLoginSuccess</code> fires automatically during{" "}
                      <code className="bg-blue-100 px-1 rounded">init()</code>, giving instant access to their stored cards, addresses, and identity — no 2FA needed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(!!defaultCard);
              }}
              className="space-y-5"
            >
              {/* Contact Information Section */}
              <div className="border border-gray-200 rounded-lg p-5 space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Contact Information</h2>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Contact:</span> {email}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      data-testid="first-name-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={() => maybeLogin(phoneNumber)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-sm text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      data-testid="last-name-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onBlur={() => maybeLogin(phoneNumber)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-sm text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhone(tryFormatPhone(e.target.value));
                      maybeLogin(e.target.value);
                    }}
                    type="tel"
                    placeholder="(555) 555-5555"
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-sm text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>

                {/* Smart Login Trigger Callout */}
                <div className="border border-blue-200 bg-blue-50 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLoginCalloutExpanded(!loginCalloutExpanded)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-700" />
                      <span className="text-[13px] font-semibold text-blue-900">Accelerate: Smart Login Trigger</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${loginCalloutExpanded ? "rotate-180" : ""}`} />
                  </button>
                  {loginCalloutExpanded && (
                    <div className="px-4 py-3 text-[12px] text-blue-900 space-y-2">
                      <p>
                        Once the customer has entered their name and phone number, you can call{" "}
                        <code className="bg-blue-100 px-1 rounded text-[11px]">accelerate.isLoggedIn()</code> to check if they&apos;re already recognized.
                        If not, call <code className="bg-blue-100 px-1 rounded text-[11px]">accelerate.login()</code> to trigger 2FA via SMS.
                        In this example, we&apos;ve wired it to <strong>field blur</strong> and <strong>phone input change</strong> so the login
                        triggers automatically — but you can call these methods at whatever point in your flow makes sense (e.g., on a button click, on form submit, etc.).
                      </p>
                      <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                        <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`async function maybeLogin(phoneValue: string) {
  // Check if already logged in — avoids duplicate 2FA
  const isLoggedIn = await window.accelerate.isLoggedIn({
    firstName, lastName,
    phoneNumber: phoneValue,
    email,
  });
  if (isLoggedIn) return;

  // Validate inputs before triggering 2FA
  if (!firstName || !lastName) return;
  const cleaned = phoneValue.replace(/\\D/g, "");
  if (!/^(1\\d{10}|[2-9]\\d{9})$/.test(cleaned)) return;

  // Trigger 2FA — customer receives an SMS code
  window.accelerate.login({
    firstName, lastName,
    phoneNumber: cleaned.slice(-10),
    email,
  });
}

// When to call maybeLogin() is up to you:
// Option A: on field blur / phone change (as shown here)
// <input onBlur={() => maybeLogin(phoneNumber)} />
// <input onChange={(e) => maybeLogin(e.target.value)} />
//
// Option B: on a button click or form submit
// <button onClick={() => maybeLogin(phoneNumber)}>
//   Verify Identity
// </button>`}
                        </pre>
                      </div>
                      <p className="text-[11px] text-blue-700">
                        By calling <code className="bg-blue-100 px-1 rounded">isLoggedIn()</code> first, you avoid triggering duplicate 2FA for customers who are already verified.
                        The login happens inline — no redirects or popups. You decide when in your checkout flow to call these methods.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={country}
                  disabled
                  className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded-sm text-sm text-gray-900 outline-none"
                >
                  <option>United States</option>
                </select>
              </div>

              {/* Address 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address 1</label>
                <input
                  placeholder="Enter a location"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-sm text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Address 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address 2 (optional)</label>
                <input
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-sm text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* City / State / Zip */}
              <div className="grid grid-cols-[1fr_1fr_120px] gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded-sm text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded-sm text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Select a state</option>
                    {US_STATES.filter(Boolean).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input
                    value={addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    className="w-full h-[42px] px-3 bg-white border border-gray-300 rounded-sm text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-1">
                {defaultCard ? (
                  <div className="flex flex-col w-full gap-4">
                    <button
                      type="submit"
                      className="h-[52px] px-6 text-white bg-[#1d3d2e] hover:bg-[#162f23] rounded-lg flex items-center justify-center gap-3 transition-all font-semibold text-[15px] shadow-md hover:shadow-lg"
                    >
                      {defaultCard.artUrl && (
                        <img src={defaultCard.artUrl} alt={defaultCard.cardName} className="h-8 w-auto rounded-md shadow-sm" />
                      )}
                      <span>Pay now ••••{defaultCard.last4}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDefaultCard(null);
                        handleSubmit(false);
                      }}
                      className="h-[44px] border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg transition font-medium text-sm hover:border-gray-300"
                    >
                      Use a different payment method
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="flex-1 h-[44px] border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 rounded-sm transition font-medium text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-[44px] bg-[#2DB87D] hover:bg-[#259968] text-white rounded-sm transition font-semibold text-sm"
                    >
                      Continue
                    </button>
                  </>
                )}
              </div>

              {/* Quick Card / One-Click Pay Callout */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuickCardCalloutExpanded(!quickCardCalloutExpanded)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-700" />
                    <span className="text-[13px] font-semibold text-blue-900">Accelerate: Quick Card &mdash; One-Click Pay</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${quickCardCalloutExpanded ? "rotate-180" : ""}`} />
                </button>
                {quickCardCalloutExpanded && (
                  <div className="px-4 py-3 text-[12px] text-blue-900 space-y-2">
                    <p>
                      When <code className="bg-blue-100 px-1 rounded text-[11px]">onLoginSuccess</code> returns a{" "}
                      <code className="bg-blue-100 px-1 rounded text-[11px]">user.quickCard</code>, the customer has a saved default card.
                      You can render a <strong>&quot;Pay now&quot;</strong> button showing the card art and last 4 digits — letting the customer
                      skip the payment page entirely and check out in one click.
                    </p>
                    <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                      <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`onLoginSuccess: (user) => {
  // user.quickCard is available if the customer
  // has a saved default card
  if (user.quickCard) {
    setDefaultCard(user.quickCard);
    // quickCard contains:
    //   artUrl   – card art image URL
    //   cardId   – tokenized card identifier
    //   cardName – e.g. "Visa Signature"
    //   cardType – e.g. "visa"
    //   last4    – last 4 digits
  }
};

// In JSX — show one-click pay when quickCard exists:
{defaultCard && (
  <button type="submit">
    <img src={defaultCard.artUrl} />
    Pay now ····{defaultCard.last4}
  </button>
)}

// The cardId is passed to the payment page,
// where it can be used with accelerate.requestSource()
// to tokenize and process the payment.`}
                      </pre>
                    </div>
                    <div className="bg-blue-100/50 rounded p-2.5 text-[11px] text-blue-800 space-y-1">
                      <p><strong>Conversion Boost:</strong> Quick Card lets returning customers pay in one click without navigating to a separate payment page, significantly reducing checkout abandonment.</p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Seller Info */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-sm text-gray-700">
                  Sold by <span className="font-semibold">mrose84</span>
                </p>
              </div>

              {/* Product */}
              <div className="px-4 py-4 flex gap-3 border-b border-gray-200">
                <div className="w-16 h-16 rounded border border-gray-200 flex-shrink-0 overflow-hidden bg-gray-50">
                  <Image
                    src="/jordan-1-low-fragment-design-x-travis-scott-1.jpg"
                    alt="Selkirk Luxx Control Air Epic"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-tight">
                    Selkirk Luxx Control Air Epic - 1st generation - Ultimate Control & Spin
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">$150.00</p>
              </div>

              {/* Price Breakdown */}
              <div className="px-4 py-3 space-y-2 border-b border-gray-200 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Price</span>
                  <span className="text-gray-900">$150.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Shipping</span>
                  <span className="text-gray-500">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Taxes</span>
                  <span className="text-gray-500">--</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">$150.00 USD</span>
                </div>
              </div>

              {/* Complete Purchase Button */}
              <div className="px-4 py-3 border-b border-gray-200">
                <button
                  disabled
                  className="w-full py-3 border border-gray-200 rounded text-sm text-orange-300 font-medium bg-white cursor-not-allowed"
                >
                  Complete Purchase
                </button>
              </div>

              {/* Buyer Protection */}
              <div className="px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#2DB87D] flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Shop Safely with SidelineSwap Buyer Protection
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          window.accelerate.init({
            amount: stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
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
