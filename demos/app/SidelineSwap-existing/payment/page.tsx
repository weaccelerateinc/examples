"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import type { AccelerateWindowAPI } from "accelerate-js-types";
import Image from "next/image";
import Link from "next/link";
import { AccelerateWallet } from "../../../components/AccelerateWallet";
import { Shield, Lock, CheckCircle, Code2, ChevronDown } from "lucide-react";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

const BASE = "/SidelineSwap-existing";
const PRODUCT_TITLE = "Honolulu Company Sword and Shield j2k+Pickleball Paddle (Used)";
const PRICE = 109;

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const email = searchParams.get("email") || "";
  const address = searchParams.get("address") || "";
  const city = searchParams.get("city") || "";
  const state = searchParams.get("state") || "";
  const zip = searchParams.get("zip") || "";
  const defaultCardId = searchParams.get("defaultCardId");
  const productImage = searchParams.get("productImage") || "/shirt.avif";

  const [accelLoaded, setAccelerateLoaded] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [, setCardLast4] = useState("");
  const [, setCardBrand] = useState("");
  const [, setCardArtUrl] = useState("");
  const [worryFreeReturns, setWorryFreeReturns] = useState(true);
  const [billingOption, setBillingOption] = useState("same");
  const [billingCalloutExpanded, setBillingCalloutExpanded] = useState(true);
  const [walletCalloutExpanded, setWalletCalloutExpanded] = useState(true);

  const worryFreeReturnsCost = worryFreeReturns ? 4.91 : 0;
  const shipping = 11.58;
  const salesTax = 10.92;
  const total = PRICE + shipping + salesTax + worryFreeReturnsCost;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    router.back();
  };

  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <div className="min-h-screen bg-white flex flex-col text-[14px]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href={BASE}>
            <Image src="/sidelineswap.svg" alt="SidelineSwap" width={170} height={34} className="h-8 w-auto" priority />
          </Link>
          <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <Lock className="w-3.5 h-3.5" />
            Secure Checkout
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Shipping Summary (read-only) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold text-gray-900">Shipping</h2>
                  <button type="button" onClick={() => router.back()} className="text-sm text-[#2DB87D] hover:underline font-medium">
                    Change
                  </button>
                </div>
                <div className="text-sm text-gray-700 space-y-0.5">
                  <p>Contact: {email}</p>
                  {fullName && <p>{fullName}</p>}
                  {address && <p>{address}</p>}
                  {(city || state || zip) && (
                    <p>{city}{city && state ? ", " : ""}{state}{(city || state) && zip ? ", US " : ""}{zip}</p>
                  )}
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Payment Method */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-5">Payment Method</h2>

                {/* Balance */}
                <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">$0.00</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Apply Balance</span>
                    <div className="w-10 h-5 bg-gray-300 rounded-full relative cursor-not-allowed">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-5 flex justify-between">
                  <span>Remaining Balance:</span>
                  <span>$0.00</span>
                </p>

                {/* Worry-Free Returns */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">Worry-Free Returns</span>
                        <button
                          type="button"
                          onClick={() => setWorryFreeReturns(!worryFreeReturns)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${worryFreeReturns ? "bg-[#2DB87D]" : "bg-gray-300"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all ${worryFreeReturns ? "left-[22px]" : "left-0.5"}`} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">Worry-free returns from any seller within 7-days, for only $4.91</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="text-gray-400">☑</span> Item doesn&apos;t fit</span>
                        <span className="flex items-center gap-1"><span className="text-gray-400">☑</span> Dissatisfied with Items</span>
                        <span className="flex items-center gap-1"><span className="text-gray-400">☑</span> Arrived too late</span>
                        <span className="flex items-center gap-1"><span className="text-gray-400">☑</span> No longer needed</span>
                      </div>
                      <div className="flex justify-end mt-2">
                        <span className="text-xs text-gray-500">Learn More about <span className="font-semibold">seel</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200 mb-5" />

                {/* Pay with card */}
                <label className="flex items-center gap-3 py-3 cursor-pointer border-b border-gray-100">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={selectedPayment === "card"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Pay with card</span>
                </label>
                {selectedPayment === "card" && (
                  <div className="py-3 space-y-4">
                    <div className="flex gap-2">
                      <Image src="/visa.svg" alt="Visa" width={36} height={24} className="h-6 w-auto border border-gray-200 rounded" />
                      <Image src="/mastercard.svg" alt="Mastercard" width={36} height={24} className="h-6 w-auto border border-gray-200 rounded" />
                      <Image src="/amex.svg" alt="Amex" width={36} height={24} className="h-6 w-auto border border-gray-200 rounded" />
                      <Image src="/jcb.svg" alt="JCB" width={36} height={24} className="h-6 w-auto border border-gray-200 rounded" />
                      <Image src="/discover.svg" alt="Discover" width={36} height={24} className="h-6 w-auto border border-gray-200 rounded" />
                    </div>

                    {accelLoaded && (
                      <AccelerateWallet defaultCardId={defaultCardId || undefined} />
                    )}

                    {/* Wallet iframe Integration Callout */}
                    <div className="border border-blue-200 bg-blue-50 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setWalletCalloutExpanded(!walletCalloutExpanded)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-blue-700" />
                          <span className="text-[13px] font-semibold text-blue-900">Accelerate: Wallet Iframe</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${walletCalloutExpanded ? "rotate-180" : ""}`} />
                      </button>
                      {walletCalloutExpanded && (
                        <div className="px-4 py-3 text-[12px] text-blue-900 space-y-2.5">
                          <p>
                            The card selector above is an <strong>Accelerate-hosted iframe</strong> rendered by calling{" "}
                            <code className="bg-blue-100 px-1 rounded text-[11px]">accelerate.openWallet()</code>.
                            It displays the customer&apos;s stored payment methods securely — SidelineSwap never handles or stores any card data.
                          </p>

                          <div className="space-y-1.5">
                            <p className="font-semibold text-blue-800">How it works:</p>
                            <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-800">
                              <li>Add an empty <code className="bg-blue-100 px-1 rounded">{'<div id="accelerate-wallet">'}</code> container where you want the wallet to appear.</li>
                              <li>After <code className="bg-blue-100 px-1 rounded">accelerate.init()</code> completes, call <code className="bg-blue-100 px-1 rounded">accelerate.openWallet()</code> — Accelerate injects a secure iframe into the container.</li>
                              <li>The iframe renders the customer&apos;s saved cards (pulled from their Accelerate profile after 2FA). Card art, last 4 digits, and expiry are shown.</li>
                              <li>When the customer selects a card, the <code className="bg-blue-100 px-1 rounded">onCardSelected(cardId)</code> callback fires with a tokenized card ID — no raw card numbers ever touch your domain.</li>
                              <li>On cleanup (e.g., page navigation), call <code className="bg-blue-100 px-1 rounded">accelerate.closeWallet()</code> to tear down the iframe.</li>
                            </ol>
                          </div>

                          <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                            <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`// 1. Add an empty container in your HTML/JSX
<div id="accelerate-wallet"></div>

// 2. After init(), open the wallet iframe
//    Optionally pass a defaultCardId to pre-select a card
window.accelerate.openWallet({
  defaultCardId: "card_abc123" // optional
});

// 3. The iframe renders inside #accelerate-wallet
//    Customer sees their saved cards and selects one
//    → onCardSelected(cardId) fires with a token

// 4. Use the cardId token to process the payment
//    via your payment processor (Braintree)

// 5. On unmount / navigation, tear down the iframe
window.accelerate.closeWallet();`}
                            </pre>
                          </div>

                          <div className="bg-blue-100/50 rounded p-2.5 text-[11px] text-blue-800 space-y-1">
                            <p><strong>PCI Compliance:</strong> Since the card data lives entirely within the Accelerate iframe, your site stays out of PCI scope. You only receive a tokenized card ID — never raw card numbers, CVVs, or expiry dates.</p>
                            <p><strong>Braintree Compatible:</strong> The returned token is a Braintree nonce you pass directly to <code className="bg-blue-100 px-1 rounded">gateway.transaction.sale()</code>. No changes to your payment processor required.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pay over time with Zip */}
                <label className="flex items-center gap-3 py-3 cursor-pointer border-b border-gray-100">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="zip"
                    checked={selectedPayment === "zip"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                  />
                  <Image src="/zip.svg" alt="Zip" width={36} height={20} className="h-5 w-auto" />
                  <span className="text-sm font-medium text-gray-900">Pay over time with Zip</span>
                </label>

                {/* PayPal */}
                <label className="flex items-center gap-3 py-3 cursor-pointer border-b border-gray-100">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={selectedPayment === "paypal"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                  />
                  <Image src="/paypal.svg" alt="PayPal" width={70} height={20} className="h-5 w-auto" />
                </label>
              </div>

              {/* Billing Address */}
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">Billing address</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="billingAddress"
                      value="same"
                      checked={billingOption === "same"}
                      onChange={() => setBillingOption("same")}
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                    />
                    <span className="text-sm text-gray-900">Same billing address as default address</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="billingAddress"
                      value="different"
                      checked={billingOption === "different"}
                      onChange={() => setBillingOption("different")}
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                    />
                    <span className="text-sm text-gray-900">Use a different billing address</span>
                  </label>
                </div>

                {/* Billing Address Integration Callout */}
                <div className="mt-3 border border-blue-200 bg-blue-50 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setBillingCalloutExpanded(!billingCalloutExpanded)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-700" />
                      <span className="text-[13px] font-semibold text-blue-900">Accelerate: Auto-detect Billing Address</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${billingCalloutExpanded ? "rotate-180" : ""}`} />
                  </button>
                  {billingCalloutExpanded && (
                    <div className="px-4 py-3 text-[12px] text-blue-900 space-y-2">
                      <p>
                        The <code className="bg-blue-100 px-1 rounded text-[11px]">onLoginSuccess</code> callback returns the user&apos;s billing address via{" "}
                        <code className="bg-blue-100 px-1 rounded text-[11px]">user.addresses</code>. If the user selects{" "}
                        <strong>&quot;Use a different billing address&quot;</strong>, you can pre-fill the billing fields with the address from Accelerate.
                      </p>
                      <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                        <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`onLoginSuccess: (user) => {
  // user.addresses contains all stored addresses
  // including billing addresses from past purchases
  const billing = user.addresses?.[0];

  if (billing) {
    // Store the billing address so it's ready if the
    // customer picks "Use a different billing address"
    setBillingLine1(billing.line1);
    setBillingCity(billing.city);
    setBillingState(billing.state);
    setBillingZip(billing.postalCode);
  }
}`}
                        </pre>
                      </div>
                      <p className="text-[11px] text-blue-700">
                        This is only relevant when the customer chooses <strong>&quot;Use a different billing address&quot;</strong> — pre-fill the fields so they don&apos;t have to re-enter their billing info manually.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={selectedPayment === "card" && !selectedCard}
                className="w-full h-[44px] bg-[#2DB87D] hover:bg-[#259968] text-white font-semibold rounded-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                Save
              </button>
            </form>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit order-1 lg:order-2">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-sm text-gray-700">
                  Sold by <span className="font-semibold">ThePlayersCloset</span>
                </p>
              </div>

              <div className="px-4 py-4 flex gap-3 border-b border-gray-200">
                <div className="w-16 h-16 rounded border border-gray-200 flex-shrink-0 overflow-hidden bg-gray-50">
                  <Image src={productImage} alt={PRODUCT_TITLE} width={64} height={64} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-tight">{PRODUCT_TITLE}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">${PRICE.toFixed(2)}</p>
              </div>

              <div className="px-4 py-3 space-y-2 border-b border-gray-200 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Price</span>
                  <span className="text-gray-900">${PRICE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Shipping</span>
                  <span className="text-gray-900">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">CA Sales Tax</span>
                  <span className="text-gray-900">${salesTax.toFixed(2)}</span>
                </div>
                {worryFreeReturnsCost > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Worry-Free Returns</span>
                    <span className="text-gray-900">${worryFreeReturnsCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">${total.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="px-4 py-3 border-b border-gray-200">
                <button
                  type="button"
                  disabled={selectedPayment === "card" && !selectedCard}
                  onClick={() => { const form = document.querySelector("form"); if (form) { form.requestSubmit(); } }}
                  className={`w-full py-3 rounded text-sm font-medium transition ${
                    selectedCard
                      ? "bg-[#1d3d2e] text-white hover:bg-[#162f23]"
                      : "border border-gray-200 text-orange-300 bg-white cursor-not-allowed"
                  }`}
                >
                  Complete Purchase
                </button>
              </div>

              <div className="px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#2DB87D] flex-shrink-0" />
                <p className="text-xs text-gray-600">Shop Safely with SidelineSwap Buyer Protection</p>
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
            amount: PRICE * 100,
            merchantId: process.env.NEXT_PUBLIC_PDP_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            universalAuth: true,
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in", { user });
              if (user.quickCard) {
                setCardLast4(user.quickCard.last4);
                setCardBrand(user.quickCard.cardType);
                setCardArtUrl(user.quickCard.artUrl);
              }
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2DB87D]" /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
