"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import Image from "next/image";
import Link from "next/link";
import { Clock, ShieldCheck, CheckSquare, Lock, X, Code2, ChevronDown } from "lucide-react";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

const BASE = "/SidelineSwap-existing";
const PRODUCT_TITLE = "Honolulu Company Sword and Shield j2k+Pickleball Paddle (Used)";
const PRICE = 109;
const SHIPPING = 11.58;
const TAX = 10.92;
const TOTAL = 131.5;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productImage = searchParams.get("productImage") || "/shirt.avif";

  const [confirmed, setConfirmed] = useState(false);
  const [addressSelected, setAddressSelected] = useState(true);
  const [worryFreeReturns, setWorryFreeReturns] = useState(true);

  const [contactEmail, setContactEmail] = useState("garyspamspam@gmail.com");
  const [fullName, setFullName] = useState("gary chao");
  const [addressLine, setAddressLine] = useState("4120 Ivar Ave");
  const [cityStateZip, setCityStateZip] = useState("Rosemead, CA, US 91770");
  const [cardLast4, setCardLast4] = useState("4705");
  const [cardExpiry] = useState("06/2030");

  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("paypal");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalFirstName, setModalFirstName] = useState("");
  const [modalLastName, setModalLastName] = useState("");
  const [modalPhone, setModalPhone] = useState("");
  const [accelLoggedIn, setAccelLoggedIn] = useState(false);
  const [codeCalloutExpanded, setCodeCalloutExpanded] = useState(false);
  const [tokenCalloutExpanded, setTokenCalloutExpanded] = useState(false);

  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user.emailAddress) setContactEmail(user.emailAddress);
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (name) setFullName(name);
    if (user?.addresses?.[0]) {
      const a = user.addresses[0];
      if (a.line1) setAddressLine(a.line1);
      const parts = [a.city, a.state, a.postalCode ? `US ${a.postalCode}` : ""].filter(Boolean).join(", ");
      if (parts) setCityStateZip(parts);
    }
    if (user.quickCard) {
      setCardLast4(user.quickCard.last4);
    }
    setAccelLoggedIn(true);
  };

  const handleContinue = () => {
    if (addressSelected) setConfirmed(true);
  };

  const handleCompletePurchase = () => {
    router.push(
      `${BASE}/payment/confirmation?` +
        `firstName=${encodeURIComponent(fullName.split(" ")[0] || "")}&` +
        `lastName=${encodeURIComponent(fullName.split(" ").slice(1).join(" ") || "")}&` +
        `email=${encodeURIComponent(contactEmail)}&` +
        `address=${encodeURIComponent(addressLine)}&` +
        `city=${encodeURIComponent("Rosemead")}&` +
        `state=${encodeURIComponent("CA")}&` +
        `zip=${encodeURIComponent("91770")}&` +
        `shipping=standard&` +
        `cardLast4=${encodeURIComponent(cardLast4)}&` +
        `totalPrice=${encodeURIComponent(TOTAL)}&` +
        `productId=paddle-1&` +
        `productTitle=${encodeURIComponent(PRODUCT_TITLE)}&` +
        `variantTitle=Standard&` +
        `quantity=1&` +
        `productImage=${encodeURIComponent(productImage)}`
    );
  };

  const navigateToPaymentPage = (fName: string, lName: string) => {
    const params = new URLSearchParams({
      firstName: fName,
      lastName: lName,
      email: contactEmail,
      address: addressLine,
      city: "Rosemead",
      state: "CA",
      zip: "91770",
      productId: "paddle-1",
      productTitle: PRODUCT_TITLE,
      productPrice: PRICE.toString(),
      variantId: "1",
      variantTitle: "Standard",
      quantity: "1",
      productImage,
    });
    router.push(`${BASE}/payment?${params.toString()}`);
  };

  const handleChangePayment = () => {
    setShowPaymentPicker(!showPaymentPicker);
  };

  const handleAddNewPayment = () => {
    if (accelLoggedIn) {
      const nameParts = fullName.split(" ");
      navigateToPaymentPage(nameParts[0] || "", nameParts.slice(1).join(" ") || "");
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentPickerContinue = () => {
    setShowPaymentPicker(false);
  };

  const handlePaymentModalSubmit = () => {
    const cleanedPhone = modalPhone.replace(/\D/g, "").slice(-10);
    if (modalFirstName && modalLastName && cleanedPhone.length === 10) {
      window.accelerate.login({
        firstName: modalFirstName,
        lastName: modalLastName,
        phoneNumber: cleanedPhone,
        email: contactEmail,
      });
    }
    setShowPaymentModal(false);
    navigateToPaymentPage(modalFirstName, modalLastName);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-[14px]">
      {/* ───── HEADER ───── */}
      <header className="bg-white">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link href={BASE}>
            <Image src="/sidelineswap.svg" alt="SidelineSwap" width={170} height={34} className="h-9 w-auto" priority />
          </Link>
          <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <Lock className="w-3.5 h-3.5" />
            Secure Checkout
          </div>
        </div>
        <div className="border-b border-gray-200" />
      </header>

      {/* ───── MAIN ───── */}
      <main className="flex-1 bg-white">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

            {/* ── LEFT COLUMN ── */}
            <div className="space-y-8">

              {/* SHIPPING */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[22px] font-bold text-gray-900">Shipping</h2>
                  {confirmed && (
                    <button type="button" onClick={() => setConfirmed(false)} className="text-[#2DB87D] text-[14px] font-medium hover:underline">
                      Change
                    </button>
                  )}
                </div>

                <p className="text-[13px] text-gray-600 mb-3">
                  Contact: <span className="text-gray-900">{contactEmail}</span>
                </p>

                {!confirmed ? (
                  <>
                    {/* Address card with radio */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          checked={addressSelected}
                          onChange={() => setAddressSelected(true)}
                          className="mt-1 w-4 h-4 accent-[#2DB87D]"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{fullName}</p>
                          <p className="text-gray-600 text-[13px]">{addressLine}</p>
                          <p className="text-gray-600 text-[13px]">{cityStateZip}</p>
                        </div>
                      </label>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button
                        type="button"
                        className="h-10 border border-gray-300 rounded text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        Add New Address
                      </button>
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="h-10 rounded text-[14px] font-medium bg-[#c8f7dc] text-[#2DB87D] hover:bg-[#b0f0cc] transition"
                      >
                        Continue
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mb-6">
                    <p className="font-semibold text-gray-900">{fullName}</p>
                    <p className="text-gray-600 text-[13px]">{addressLine}</p>
                    <p className="text-gray-600 text-[13px]">{cityStateZip}</p>
                  </div>
                )}

                {/* Estimated Delivery */}
                <div>
                  <p className="text-[14px] font-semibold text-gray-900 mb-1">Estimated Delivery</p>
                  <div className="flex items-center gap-2 text-[13px] text-gray-700">
                    <Clock className="w-4 h-4 text-[#2DB87D]" />
                    Fri, Mar 6th - Tue, Mar 10th
                  </div>
                </div>
              </section>

              {/* PAYMENT METHOD */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[22px] font-bold text-gray-900">Payment Method</h2>
                  {confirmed && (
                    <div className="relative flex items-center gap-2">
                      <button type="button" onClick={handleChangePayment} className="text-[#2DB87D] text-[14px] font-medium hover:underline">
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodeCalloutExpanded(!codeCalloutExpanded)}
                        className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition"
                        title="View Accelerate integration code"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Accelerate Integration Callout */}
                {confirmed && (
                  <div className="mb-5 border border-blue-200 bg-blue-50 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCodeCalloutExpanded(!codeCalloutExpanded)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-blue-700" />
                        <span className="text-[13px] font-semibold text-blue-900">Accelerate Integration Point</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${codeCalloutExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {codeCalloutExpanded && (
                      <div className="px-4 py-3 text-[12px] text-blue-900 space-y-2">
                        <p>
                          When a customer clicks <strong>&quot;Change&quot;</strong> and <strong>&quot;Add New&quot;</strong>, pass the customer&apos;s identity to Accelerate in the following page.
                        </p>
                        <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                          <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`// 1. Initialize Accelerate on page load
window.accelerate.init({
  amount: 10900, // amount in cents
  merchantId: "your-merchant-id",
  checkoutFlow: "Inline",
  checkoutMode: "BraintreeNonce",
  universalAuth: true,

  // If cookie is present, this fires automatically
  // → skip 2FA, user is already verified
  onLoginSuccess: (user) => {
    isLoggedIn = true;
    // user.quickCard, user.addresses, etc. are available
  },

  onCardSelected: (cardId) => {
    selectedCardId = cardId;
  },
});

// 2. When customer clicks "Change Payment Method"
function handleChangePayment() {
  if (isLoggedIn) {
    // Cookie detected → skip 2FA, go straight to payment
    navigateToPaymentPage();
  } else {
    // No cookie → collect identity & trigger 2FA
    window.accelerate.login({
      firstName: "Gary",
      lastName: "Chao",
      phoneNumber: "6265551234",
      email: "gary@example.com",
    });
    // Then navigate to payment page
    navigateToPaymentPage();
  }
}`}
                          </pre>
                        </div>
                        <div className="bg-blue-100/50 rounded p-2.5 text-[11px] text-blue-800 space-y-1">
                          <p>
                            <strong><code className="bg-blue-100 px-1 rounded">universalAuth: true</code></strong> — Enables cookie-based recognition across sessions.
                            When a customer verifies via 2FA once, Accelerate sets a persistent cookie. On subsequent visits,{" "}
                            <code className="bg-blue-100 px-1 rounded">onLoginSuccess</code> fires automatically during{" "}
                            <code className="bg-blue-100 px-1 rounded">init()</code>, giving you instant access to their stored cards, addresses, and identity — no 2FA prompt needed.
                          </p>
                        </div>
                        <p className="text-[11px] text-blue-700 mt-1">
                          The <code className="bg-blue-100 px-1 rounded">accelerate.login()</code> call triggers 2FA via SMS. If the user has previously verified (cookie present),{" "}
                          <code className="bg-blue-100 px-1 rounded">onLoginSuccess</code> fires on <code className="bg-blue-100 px-1 rounded">init()</code> and no 2FA is needed.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Balance */}
                <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between mb-2">
                  <span className="text-[16px] font-semibold text-gray-900">$0.00</span>
                  <div className="flex items-center gap-2 text-[13px] text-gray-600">
                    Apply Balance
                    <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full shadow absolute top-0.5 left-0.5" />
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-gray-500 mb-5 flex items-center justify-between">
                  <span>Remaining Balance:</span>
                  <span className="font-medium text-gray-900">$0.00</span>
                </p>

                {/* Worry-Free Returns (only in confirmed state) */}
                {confirmed && (
                  <div className="border border-gray-200 rounded-lg p-4 mb-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900">Worry-Free Returns</p>
                          <p className="text-[13px] text-gray-600">
                            Worry-free returns from any seller within 7-days, for only <strong>$4.91</strong>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWorryFreeReturns(!worryFreeReturns)}
                        className={`w-11 h-6 rounded-full relative shrink-0 transition ${worryFreeReturns ? "bg-[#2DB87D]" : "bg-gray-300"}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${worryFreeReturns ? "right-0.5" : "left-0.5"}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-[12px] text-gray-500">
                      <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-gray-400" /> Item doesn&apos;t fit</span>
                      <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-gray-400" /> Dissatisfied with items</span>
                      <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-gray-400" /> Arrived too late</span>
                      <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-gray-400" /> No longer needed</span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 mt-3 text-[12px] text-gray-500">
                      <span className="font-semibold">Learn More about</span>
                      <span className="font-bold text-[#2a6496]">seel</span>
                    </div>
                  </div>
                )}

                {/* Payment methods */}
                {showPaymentPicker ? (
                  <div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                      <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition">
                        <input
                          type="radio"
                          name="paymentPicker"
                          value="paypal"
                          checked={selectedPaymentMethod === "paypal"}
                          onChange={() => setSelectedPaymentMethod("paypal")}
                          className="w-4 h-4 accent-[#2DB87D]"
                        />
                        <Image src="/paypal.svg" alt="PayPal" width={80} height={20} className="h-5 w-auto" />
                        <span className="text-[14px] text-gray-900">gchao3@ucla.edu</span>
                      </label>
                      <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="radio"
                          name="paymentPicker"
                          value="visa"
                          checked={selectedPaymentMethod === "visa"}
                          onChange={() => setSelectedPaymentMethod("visa")}
                          className="w-4 h-4 accent-[#2DB87D]"
                        />
                        <div className="w-10 h-7 bg-[#1a1f71] rounded flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold italic tracking-tight">VISA</span>
                        </div>
                        <div>
                          <span className="text-[14px] font-semibold text-gray-900">ending in {cardLast4}</span>
                          <span className="text-[12px] text-gray-400 ml-2">expires {cardExpiry}</span>
                        </div>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleAddNewPayment}
                        className="h-10 border border-gray-300 rounded text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        Add New
                      </button>
                      <button
                        type="button"
                        onClick={handlePaymentPickerContinue}
                        className="h-10 rounded text-[14px] font-medium bg-[#1d3d2e] text-white hover:bg-[#162f23] transition"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {selectedPaymentMethod === "paypal" ? (
                      <>
                        <Image src="/paypal.svg" alt="PayPal" width={80} height={20} className="h-5 w-auto" />
                        <span className="text-[14px] text-gray-900">gchao3@ucla.edu</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-7 bg-[#1a1f71] rounded flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold italic tracking-tight">VISA</span>
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-gray-900">ending in {cardLast4}</p>
                          <p className="text-[12px] text-gray-400">expires {cardExpiry}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* ── RIGHT COLUMN: Order Summary ── */}
            <div className="lg:sticky lg:top-8 h-fit space-y-3">
              {/* Product */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4">
                  <p className="text-[12px] text-gray-500 mb-3">
                    Sold by <span className="font-semibold text-gray-900">ThePlayersCloset</span>
                  </p>
                  <div className="flex gap-3">
                    <div className="w-[56px] h-[56px] rounded bg-gray-100 overflow-hidden relative shrink-0">
                      <Image src={productImage} alt={PRODUCT_TITLE} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 leading-snug line-clamp-3">{PRODUCT_TITLE}</p>
                    </div>
                    <span className="text-[14px] font-bold text-gray-900 shrink-0">${PRICE.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="border border-gray-200 rounded-lg p-4 text-[13px]">
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-600">Price</span>
                  <span className="font-medium text-gray-900">${PRICE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">
                    {confirmed ? `$${SHIPPING.toFixed(2)}` : "--"}
                  </span>
                </div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-600">{confirmed ? "CA Sales Tax" : "Taxes"}</span>
                  <span className="font-medium text-gray-900">
                    {confirmed ? `$${TAX.toFixed(2)}` : "--"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">
                    ${confirmed ? TOTAL.toFixed(2) : PRICE.toFixed(2)}{" "}
                    <span className="text-[11px] text-gray-400 font-normal">USD</span>
                  </span>
                </div>
              </div>

              {/* Complete Purchase */}
              <button
                type="button"
                onClick={confirmed ? handleCompletePurchase : undefined}
                disabled={!confirmed}
                className={`w-full h-11 rounded text-[14px] font-semibold transition ${
                  confirmed
                    ? "bg-[#1d3d2e] text-white hover:bg-[#162f23] cursor-pointer"
                    : "bg-white text-[#a8d8be] border border-gray-200 cursor-not-allowed"
                }`}
              >
                Complete Purchase
              </button>

              {/* requestSource Tokenization Callout */}
              {confirmed && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTokenCalloutExpanded(!tokenCalloutExpanded)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-700" />
                      <span className="text-[13px] font-semibold text-blue-900">Accelerate: Tokenize &amp; Complete Purchase</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${tokenCalloutExpanded ? "rotate-180" : ""}`} />
                  </button>
                  {tokenCalloutExpanded && (
                    <div className="px-4 py-3 text-[12px] text-blue-900 space-y-2">
                      <p>
                        When the customer clicks <strong>&quot;Pay Now&quot;</strong>, fetch a Braintree client token from your server, then call{" "}
                        <code className="bg-blue-100 px-1 rounded text-[11px]">accelerate.requestSource(cardId, {"{"} braintree {"}"} )</code> to
                        retrieve a processor token. Pass that token to your backend to confirm the transaction.
                      </p>
                      <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                        <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`<button
  disabled={cardId == null}
  className={buttonStyle}
  onClick={async () => {
    if (!cardId) return;

    // Your implementation should fetch a client token from your server, this is
    // a mock!
    const clientToken = await fetch("/api/braintree/get-client-token");
    const clientTokenJson = (await clientToken.json()) as { token: string };

    const source = await window.accelerate.requestSource(cardId, {
      braintree: {
        clientToken: clientTokenJson.token,
      },
    });

    console.log("Source", { source });
    if ("status" in source) {
      if (source.status == 401) {
        console.log("User session expired!");
        window.accelerate.closeWallet();
        window.accelerate.login({
          firstName,
          lastName,
          phoneNumber,
          email: "test@weaccelerate.com",
        });
      }
      return;
    }
    const confirmIntent = await fetch("/api/braintree/confirm", {
      method: "POST",
      body: JSON.stringify({
        amount: "10.00",
        processorToken: source.processorToken,
        cartId: "some-cart",
      }),
    });
    const res = (await confirmIntent.json()) as { status: string; token: string; message?: string };
    if (res.status === "authorized") {
      router.push(\`/completion?status=succeeded&token=\${res.token}\`);
    } else {
      setErrorMessage(res.message || "Unknown error");
    }
  }}
>
  Pay Now
</button>`}
                        </pre>
                      </div>
                      <div className="bg-blue-100/50 rounded p-2.5 text-[11px] text-blue-800 space-y-1">
                        <p><strong>checkoutMode: BraintreeNonce</strong></p>
                        <p>&bull; Fetches a client token, then calls <code className="bg-blue-100 px-1 rounded">requestSource(cardId, {"{"} braintree {"}"} )</code> to get a processor token</p>
                        <p>&bull; Pass the processor token to <code className="bg-blue-100 px-1 rounded">/api/braintree/confirm</code> to authorize the charge</p>
                        <p className="mt-1"><strong>No card data on your servers:</strong> The token is single-use and processor-specific. Your backend never sees raw card numbers.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Buyer Protection */}
              <div className="flex items-center justify-center gap-2 py-2">
                <ShieldCheck className="w-5 h-5 text-[#2DB87D]" />
                <span className="text-[12px] text-gray-600">
                  Shop Safely with <strong>SidelineSwap Buyer Protection</strong>
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Identity Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-[18px] font-bold text-gray-900 mb-1">Change Payment Method</h3>
            <p className="text-[13px] text-gray-500 mb-5">Enter your details to continue</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">First name</label>
                  <input
                    type="text"
                    value={modalFirstName}
                    onChange={(e) => setModalFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full h-10 px-3 border border-gray-300 rounded text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2DB87D]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    type="text"
                    value={modalLastName}
                    onChange={(e) => setModalLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full h-10 px-3 border border-gray-300 rounded text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2DB87D]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className="w-full h-10 px-3 border border-gray-300 rounded text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2DB87D]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handlePaymentModalSubmit}
              disabled={!modalFirstName || !modalLastName || !modalPhone}
              className="w-full h-10 mt-5 bg-[#2DB87D] text-white font-semibold rounded text-[14px] hover:bg-[#259968] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Accelerate Script */}
      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          window.accelerate.init({
            amount: PRICE * 100,
            merchantId: process.env.NEXT_PUBLIC_PDP_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "BraintreeNonce",
            universalAuth: true,
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in on checkout", { user });
              maybeUseAccelUser(user);
            },
            onCardSelected: (cid) => console.log("Card selected:", cid),
          });
        }}
      />
    </div>
  );
}

export default function SidelineSwapCheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2DB87D]" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
