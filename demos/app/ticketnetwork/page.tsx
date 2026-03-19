"use client";
import { FormEvent, useState } from "react";
import { CheckoutSummary } from "./payment/CheckoutSummary";
import { stripeOptions } from "../options";
import Script from "next/script";
import { useRouter } from "next/navigation";
import type { AccelerateWindowAPI, AccelerateUser } from "accelerate-js-types";
import Image from "next/image";
import { AccelerateWallet } from "../../components/AccelerateWallet";
import { Loader2, Code2, ChevronDown } from "lucide-react";

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
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

const COUNTRIES = [
  "United States of America", "Canada", "United Kingdom", "Australia",
  "Germany", "France", "Japan", "Mexico",
];

export default function TicketNetworkCheckout() {
  const router = useRouter();

  const [cardholderFirstName, setCardholderFirstName] = useState("");
  const [cardholderLastName, setCardholderLastName] = useState("");
  const [phoneNumber, setPhone] = useState("");
  const [email] = useState("example@example.com");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(239.80);
  const [accelLoaded, setAccelerateLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initCalloutExpanded, setInitCalloutExpanded] = useState(false);
  const [loginCalloutExpanded, setLoginCalloutExpanded] = useState(false);
  const [walletIframeCalloutExpanded, setWalletIframeCalloutExpanded] = useState(false);
  const [braintreeCalloutExpanded, setBraintreeCalloutExpanded] = useState(false);

  const [country, setCountry] = useState("United States of America");
  const [billingAddrLine1, setBillingAddrLine1] = useState("");
  const [billingAddrLine2, setBillingAddrLine2] = useState("");
  const [billingAddrState, setBillingAddrState] = useState("Alabama");
  const [billingAddrCity, setBillingAddrCity] = useState("");
  const [billingAddrZip, setBillingAddrZip] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [ticketProtection, setTicketProtection] = useState("yes");

  const firstName = cardholderFirstName.trim();
  const lastName = cardholderLastName.trim();

  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user?.addresses[0]) {
      setBillingAddrLine1(user.addresses[0].line1 || billingAddrLine1);
      setBillingAddrCity(user.addresses[0].city || billingAddrCity);
      setBillingAddrState(user.addresses[0].state || billingAddrState);
      setBillingAddrZip(user.addresses[0].postalCode || billingAddrZip);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
          `/ticketnetwork/payment/confirmation?` +
            `firstName=${encodeURIComponent(firstName)}&` +
            `lastName=${encodeURIComponent(lastName)}&` +
            `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
            `billingAddress=${encodeURIComponent(billingAddrLine1)}&` +
            `billingCity=${encodeURIComponent(billingAddrCity)}&` +
            `billingState=${encodeURIComponent(billingAddrState)}&` +
            `billingZip=${encodeURIComponent(billingAddrZip)}&` +
            `shippingAddress=${encodeURIComponent(billingAddrLine1)}&` +
            `shippingCity=${encodeURIComponent(billingAddrCity)}&` +
            `shippingState=${encodeURIComponent(billingAddrState)}&` +
            `shippingZip=${encodeURIComponent(billingAddrZip)}&` +
            `shipping=mobileticket&` +
            `cardLast4=${encodeURIComponent(card?.details?.mask || "")}&` +
            `totalPrice=${encodeURIComponent(totalPrice)}`
        );
      } catch (error) {
        console.error("Payment error:", error);
        setIsSubmitting(false);
      }
    }
  };

  const maybeLogin = (phoneValue: string) => {
    if (firstName === "") return;
    if (lastName === "") return;

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

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);

  const formLabelClass =
    "text-[12px] font-bold text-right pr-3 align-middle w-[165px] whitespace-nowrap text-[#333]";
  const inputClass =
    "w-full h-[29px] px-[7px] border border-[#d3d3d3] bg-white text-[12px] text-[#333] focus:outline-none focus:border-[#a8a8a8] shadow-[inset_0_1px_1px_rgba(0,0,0,0.08)]";
  const selectClass =
    "h-[29px] px-[7px] border border-[#d3d3d3] bg-white text-[12px] text-[#333] focus:outline-none focus:border-[#a8a8a8] shadow-[inset_0_1px_1px_rgba(0,0,0,0.08)]";

  return (
    <div
      className="min-h-screen w-screen bg-white ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Header */}
      <header className="w-full" style={{ backgroundColor: "#1a90ff" }}>
        <div className="max-w-[960px] mx-auto px-4 py-[17px] flex justify-between items-center">
          <Image src="/ticketnetwork-logo.png" alt="TicketNetwork" width={195} height={23} className="h-[23px] w-auto" />
          <div className="text-white text-[16px] font-bold flex items-center gap-1.5">
            <span className="text-[15px]">&#9742;</span>
            <span>(860) 533-4080</span>
          </div>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-4 py-5">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left Column */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit}>
              <div className="relative pl-7 pr-1 mb-4">
                {/* Step 1: Delivery */}
                <div className="pb-3 border-b border-[#e5e5e5]">
                  <div className="pt-2 pb-1 flex items-center">
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full border border-[#d6d6d6] text-[#b7b7b7] text-[11px] leading-none">
                        1
                      </span>
                      <span className="text-[30px] text-[#bdbdbd] font-normal leading-none">Delivery</span>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2.5 pr-2">
                      <button
                        type="button"
                        className="text-[10px] text-[#4a8cc9] border border-[#d2d2d2] px-1.5 h-[18px] leading-none bg-[#f8f8f8]"
                      >
                        edit
                      </button>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <circle cx="7" cy="7" r="7" fill="#34a853" />
                        <path d="M3.8 7.1L5.9 9.1L10.1 4.7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="pt-2 pb-1 pl-[26px] flex gap-20 text-[12px] text-[#333]">
                    <div>
                      <span className="text-[11px] text-[#444]">Email:</span>
                      <div className="text-[12px]">{email}</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#444]">Delivery Method:</span>
                      <div className="text-[12px]">Mobile Ticket</div>
                      <div className="text-[11px] text-[#666] mt-0.5">
                        Get it by 4/2/2026{" "}
                        <span className="inline-flex items-center justify-center w-[11px] h-[11px] rounded-full bg-[#6f6f6f] text-[8px] text-white align-middle ml-0.5">
                          ?
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Payment */}
                <div className="pt-4">
                  <div className="pb-2 flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full border border-[#d16a6a] text-[#cc4a4a] text-[11px] leading-none">
                      2
                    </span>
                    <span className="text-[31px] text-black font-normal leading-none">Payment</span>
                  </div>

                  {/* Developer Guide: Init + Autofill */}
                  <div className="pl-[26px] pb-4">
                    <div className="border border-blue-200 bg-blue-50 rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setInitCalloutExpanded(!initCalloutExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-blue-700" />
                          <span className="text-[12px] font-semibold text-blue-900">Developer Guide: Accelerate init + auto-fill</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-blue-700 transition-transform ${initCalloutExpanded ? "rotate-180" : ""}`} />
                      </button>
                      {initCalloutExpanded && (
                        <div className="px-3 py-3 text-[11px] text-blue-900 space-y-2">
                          <p>
                            Initialize Accelerate on checkout load and hydrate billing fields in{" "}
                            <code className="bg-blue-100 px-1 rounded">onLoginSuccess</code>. With{" "}
                            <code className="bg-blue-100 px-1 rounded">universalAuth: true</code>, Accelerate stores a persistent recognition cookie
                            after successful verification so returning users can be recognized automatically and pre-filled. For Braintree flows,
                            set <code className="bg-blue-100 px-1 rounded">checkoutMode: "BraintreeNonce"</code>.
                          </p>
                          <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                            <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`window.accelerate.init({
  amount: stripeOptions.amount,
  merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
  checkoutFlow: "Inline",
  checkoutMode: "BraintreeNonce",
  universalAuth: true, // enables cookie-based returning user recognition
  onLoginSuccess: (user) => {
    if (user.addresses?.[0]) {
      setBillingAddrLine1(user.addresses[0].line1 || "");
      setBillingAddrCity(user.addresses[0].city || "");
      setBillingAddrState(user.addresses[0].state || "Alabama");
      setBillingAddrZip(user.addresses[0].postalCode || "");
    }
    setIsLoggedIn(true);
  },
});`}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pl-[26px] pb-4">
                    <button type="button" className="text-[11px] text-[#2d8fd4] hover:underline flex items-center gap-1">
                      <span className="text-[9px] text-[#cc4a4a]">&#9658;</span>
                      <span>Redeem a Gift Card or Promo Code</span>
                    </button>
                  </div>

                  {/* Billing Address */}
                  <div className="pl-[26px] pb-4">
                    <h3 className="text-[17px] font-bold text-black mb-0.5">Enter Your Billing Address</h3>
                    <p className="text-[10px] text-[#666] mb-4">This should match the address on your credit card statement.</p>

                    <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}>
                      <tbody>
                        <tr>
                          <td className={formLabelClass}>
                            <span className="text-[#d33]">*</span>Cardholder&apos;s Name
                          </td>
                          <td>
                            <div className="flex items-center gap-[6px]">
                              <input
                                type="text"
                                placeholder="First"
                                value={cardholderFirstName}
                                onChange={(e) => setCardholderFirstName(e.target.value)}
                                onBlur={() => maybeLogin(phoneNumber)}
                                data-testid="cardholder-first-name-input"
                                className={`flex-1 ${inputClass}`}
                              />
                              <input
                                type="text"
                                placeholder="Last"
                                value={cardholderLastName}
                                onChange={(e) => setCardholderLastName(e.target.value)}
                                onBlur={() => maybeLogin(phoneNumber)}
                                data-testid="cardholder-last-name-input"
                                className={`flex-1 ${inputClass}`}
                              />
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td className={`${formLabelClass} align-top pt-[6px]`}>
                            <span className="text-[#d33]">*</span>Mobile Phone
                          </td>
                          <td>
                            <div className="flex items-center gap-[4px]">
                              <select className={`w-[58px] ${selectClass}`}>
                                <option value="+1">+1</option>
                              </select>
                              <input
                                type="tel"
                                placeholder="(555) 555-5555"
                                value={phoneNumber}
                                onChange={(e) => {
                                  setPhone(tryFormatPhone(e.target.value));
                                  maybeLogin(e.target.value);
                                }}
                                className={`flex-1 ${inputClass}`}
                              />
                            </div>
                            <div className="mt-1 border border-[#ddd2a0] bg-[#fdf6dc] px-2 py-1.5 flex items-center justify-between">
                              <span className="text-[11px] text-[#5f6545]">Mobile/cell required for mobile ticket delivery</span>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                                <circle cx="7" cy="7" r="7" fill="#37a245" />
                                <path d="M3.9 7L5.8 8.9L10 4.8" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td />
                          <td>
                            <div className="border border-blue-200 bg-blue-50 rounded-md overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setLoginCalloutExpanded(!loginCalloutExpanded)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Code2 className="w-4 h-4 text-blue-700" />
                                  <span className="text-[12px] font-semibold text-blue-900">Developer Guide: smart login trigger</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-blue-700 transition-transform ${loginCalloutExpanded ? "rotate-180" : ""}`} />
                              </button>
                              {loginCalloutExpanded && (
                                <div className="px-3 py-3 text-[11px] text-blue-900 space-y-2">
                                  <p>
                                    Trigger <code className="bg-blue-100 px-1 rounded">accelerate.login()</code> only after basic validation to avoid
                                    sending repeated 2FA challenges while users type.
                                  </p>
                                  <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                                    <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`const maybeLogin = (phoneValue: string) => {
  if (!firstName || !lastName) return;
  const cleanedPhone = phoneValue.replace(/\\D/g, "");
  if (!/^(1\\d{10}|[2-9]\\d{9})$/.test(cleanedPhone)) return;

  window.accelerate.login({
    firstName,
    lastName,
    phoneNumber: cleanedPhone.slice(-10),
    email,
  });
};`}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td className={formLabelClass}>
                            <span className="text-[#d33]">*</span>Country
                          </td>
                          <td>
                            <select value={country} onChange={(e) => setCountry(e.target.value)} className={`w-full ${selectClass}`}>
                              {COUNTRIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>

                        <tr>
                          <td className={`${formLabelClass} align-top pt-[6px]`}>
                            <span className="text-[#d33]">*</span>Address
                          </td>
                          <td className="space-y-[6px]">
                            <input
                              type="text"
                              placeholder="Street Address"
                              value={billingAddrLine1}
                              onChange={(e) => setBillingAddrLine1(e.target.value)}
                              className={inputClass}
                            />
                            <input
                              type="text"
                              placeholder="Apt, Suite or Floor (optional)"
                              value={billingAddrLine2}
                              onChange={(e) => setBillingAddrLine2(e.target.value)}
                              className={inputClass}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className={formLabelClass}>
                            <span className="text-[#d33]">*</span>Zip/Postal Code
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="01234"
                              value={billingAddrZip}
                              onChange={(e) => setBillingAddrZip(e.target.value)}
                              className={`w-[85px] ${inputClass}`}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className={formLabelClass}>
                            <span className="text-[#d33]">*</span>City
                          </td>
                          <td>
                            <input type="text" value={billingAddrCity} onChange={(e) => setBillingAddrCity(e.target.value)} className={inputClass} />
                          </td>
                        </tr>

                        <tr>
                          <td className={formLabelClass}>
                            <span className="text-[#d33]">*</span>State/Province
                          </td>
                          <td>
                            <select value={billingAddrState} onChange={(e) => setBillingAddrState(e.target.value)} className={`w-full ${selectClass}`}>
                              {US_STATES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>

                  {/* Credit Card Information */}
                  <div className="pl-[26px] pb-4">
                    <div className="bg-[#f3f3f3] border border-[#e2e2e2] px-3 py-[6px] flex items-center justify-between mb-2.5">
                      <h3 className="text-[12px] font-bold text-black">Enter Credit Card Information</h3>
                      <div className="flex items-center gap-1 text-[10px] text-[#777]">
                        <svg width="9" height="12" viewBox="0 0 9 12" fill="none">
                          <rect x="0.5" y="4.5" width="8" height="7" rx="1" stroke="#777" fill="none" />
                          <path d="M2.5 4.5V3C2.5 1.62 3.38 0.5 4.5 0.5C5.62 0.5 6.5 1.62 6.5 3V4.5" stroke="#777" fill="none" />
                        </svg>
                        100% SECURE
                      </div>
                    </div>

                    {!(accelLoaded && isLoggedIn) && (
                      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}>
                        <tbody>
                          <tr>
                            <td className={formLabelClass}>
                              <span className="text-[#d33]">*</span>Credit Card Number
                            </td>
                            <td>
                              <div className="relative">
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[#999]">
                                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                                    <rect x="0.5" y="0.5" width="13" height="9" rx="1" stroke="#999" fill="none" />
                                    <rect x="0" y="2.5" width="14" height="2" fill="#bdbdbd" />
                                  </svg>
                                </div>
                                <input
                                  type="text"
                                  placeholder="#### #### #### ####"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value)}
                                  className={`w-full pl-8 pr-24 ${inputClass}`}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  <Image src="/visa.svg" alt="Visa" width={20} height={13} />
                                  <Image src="/mastercard.svg" alt="Mastercard" width={20} height={13} />
                                  <Image src="/amex.svg" alt="Amex" width={20} height={13} />
                                </div>
                              </div>
                            </td>
                          </tr>

                          <tr>
                            <td className={formLabelClass}>
                              <span className="text-[#d33]">*</span>Expiration Date
                            </td>
                            <td>
                              <div className="flex items-center gap-[4px]">
                                <select value={cardExpMonth} onChange={(e) => setCardExpMonth(e.target.value)} className={`w-[78px] ${selectClass}`}>
                                  <option value="">Month</option>
                                  {months.map((m) => (
                                    <option key={m} value={m}>
                                      {m.toString().padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-[#777] text-[14px]">/</span>
                                <select value={cardExpYear} onChange={(e) => setCardExpYear(e.target.value)} className={`w-[70px] ${selectClass}`}>
                                  <option value="">Year</option>
                                  {years.map((y) => (
                                    <option key={y} value={y}>
                                      {y}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          </tr>

                          <tr>
                            <td className={formLabelClass}>
                              <span className="text-[#d33]">*</span>Security Code
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="CVV/CVC"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value)}
                                  className={`w-[82px] ${inputClass}`}
                                />
                                <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
                                  <rect x="0.5" y="0.5" width="29" height="19" rx="1.5" stroke="#c8c8c8" fill="#f6f6f6" />
                                  <rect x="0" y="3" width="30" height="4" fill="#4a4a4a" />
                                  <rect x="3.5" y="10" width="16" height="4" rx="0.5" fill="white" stroke="#c8c8c8" />
                                  <text x="21.8" y="13.1" fontSize="4.5" fill="#444" fontWeight="bold" fontFamily="Arial">
                                    123
                                  </text>
                                </svg>
                                <span className="inline-flex items-center justify-center w-[12px] h-[12px] rounded-full border border-[#9b9b9b] text-[9px] text-[#888]">i</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    {accelLoaded && isLoggedIn && (
                      <div className="pt-1">
                        <AccelerateWallet />
                      </div>
                    )}

                    <div className="mt-3 border border-blue-200 bg-blue-50 rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setWalletIframeCalloutExpanded(!walletIframeCalloutExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-blue-700" />
                          <span className="text-[12px] font-semibold text-blue-900">Developer Guide: display cards via iframe</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-blue-700 transition-transform ${walletIframeCalloutExpanded ? "rotate-180" : ""}`} />
                      </button>
                      {walletIframeCalloutExpanded && (
                        <div className="px-3 py-3 text-[11px] text-blue-900 space-y-2">
                          <p>
                            Render saved cards inside your checkout using the Accelerate wallet iframe container. The iframe is mounted by{" "}
                            <code className="bg-blue-100 px-1 rounded">openWallet()</code> and cleaned up with{" "}
                            <code className="bg-blue-100 px-1 rounded">closeWallet()</code>.
                          </p>
                          <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                            <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`export const AccelerateWallet = ({ defaultCardId }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current?.children?.length === 0) {
      // mounts the wallet iframe into #accelerate-wallet
      window.accelerate.openWallet({ defaultCardId });
    }

    return () => {
      // removes iframe when component unmounts
      window.accelerate.closeWallet();
    };
  }, []);

  return <div ref={containerRef} id="accelerate-wallet" />;
};
`}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 border border-blue-200 bg-blue-50 rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setBraintreeCalloutExpanded(!braintreeCalloutExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-blue-100/60 hover:bg-blue-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-blue-700" />
                          <span className="text-[12px] font-semibold text-blue-900">Developer Guide: Braintree tokenization</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-blue-700 transition-transform ${braintreeCalloutExpanded ? "rotate-180" : ""}`} />
                      </button>
                      {braintreeCalloutExpanded && (
                        <div className="px-3 py-3 text-[11px] text-blue-900 space-y-2">
                          <p>
                            Tokenize the selected wallet card with{" "}
                            <code className="bg-blue-100 px-1 rounded">requestSource(cardId)</code>, then send the returned nonce to your backend for
                            Braintree transaction creation.
                          </p>
                          <div className="bg-[#1e293b] rounded-md p-3 overflow-x-auto">
                            <pre className="text-[11px] leading-relaxed font-mono text-gray-300">
{`const source = await window.accelerate.requestSource(selectedCard);
await fetch("/api/braintree/confirm", {
  method: "POST",
  body: JSON.stringify({
    paymentMethodNonce: source.processorToken,
    cartId: "some-cart",
  }),
});`}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Protect Your Ticket - Separate Card */}
              <div className="bg-white border border-[#ddd] mb-4 p-5 ml-[54px] mr-[4px]">
                <h3 className="text-[13px] font-bold mb-3" style={{ color: "#cc3333" }}>Protect Your Ticket</h3>

                <div className="bg-[#f0f6fa] border border-[#ddd] rounded-sm p-4">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="protection"
                      value="yes"
                      checked={ticketProtection === "yes"}
                      onChange={() => setTicketProtection("yes")}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] text-[#333]">
                          <strong>Yes,</strong> protect my ticket purchase for only $23.00 total.
                        </span>
                        <span className="bg-[#28a745] text-white text-[10px] font-bold px-2 py-[2px] rounded-sm">
                          Highly Recommended
                        </span>
                      </div>
                      <div className="mt-2.5 space-y-2 bg-[#e8f0e8] rounded p-3 -mx-1">
                        <div className="flex items-start gap-1.5 text-[11px] text-[#333] leading-[1.5]">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
                            <circle cx="7" cy="7" r="6.5" fill="#28a745" />
                            <path d="M4 7L6 9.5L10 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                          <span>
                            <strong>Get reimbursed up to 100% of your ticket cost</strong> if you can&apos;t attend the event due to covered reasons, like a covered illness or injury (yourself or a family member), mechanical breakdown, traffic accident, airline delay, and weather emergency
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 text-[11px] text-[#333] leading-[1.5]">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
                            <circle cx="7" cy="7" r="6.5" fill="#28a745" />
                            <path d="M4 7L6 9.5L10 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                          <span>
                            <strong>Receive 24/7 assistance</strong> that can find parking info, book hotels and more
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>

                  <div className="my-3 border-t border-[#ddd]" />

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="protection"
                      value="no"
                      checked={ticketProtection === "no"}
                      onChange={() => setTicketProtection("no")}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <span className="text-[11px] text-[#333] leading-[1.5]">
                      No, don&apos;t protect my <strong>${totalPrice.toFixed(2)}</strong> Ye - Kanye West ticket purchase. I choose not to add the security of event ticket protection for my event.
                    </span>
                  </label>

                  <div className="my-3 border-t border-[#ddd]" />

                  <div className="flex items-center gap-2 text-[11px] text-[#555]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                      <path d="M8 1C6 1 4.5 2 4.5 3.5C4.5 5 6 5.5 8 5.5C10 5.5 11.5 5 11.5 3.5C11.5 2 10 1 8 1Z" fill="#666" />
                      <path d="M4 7C2.5 7 1 8 1 10V14C1 14.5 1.5 15 2 15H14C14.5 15 15 14.5 15 14V10C15 8 13.5 7 12 7H4Z" fill="#666" />
                    </svg>
                    <span>10,484 people protected their tickets in the last 7 days</span>
                  </div>

                  <div className="my-3 border-t border-[#ddd]" />

                  <div className="flex items-start gap-2.5 text-[10px] text-[#888] leading-[1.5]">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" className="flex-shrink-0">
                      <circle cx="13" cy="13" r="12" stroke="#0066cc" strokeWidth="1.5" fill="none" />
                      <path d="M7 13L13 7L19 13L13 19Z" fill="#0066cc" />
                    </svg>
                    <span>
                      Recommended/offered/sold by Allianz Partners. Underwriter: Jefferson Insurance Company. Plan incl. insurance &amp; assistance services. Terms &amp; exclusions (incl. for pre-existing conditions) apply.{" "}
                      <a href="#" className="text-[#0066cc] underline">Plan &amp; Pricing details</a>,{" "}
                      <a href="#" className="text-[#0066cc] underline">disclosures</a>,{" "}
                      <a href="#" className="text-[#0066cc] underline">Coverage Alerts</a>.
                    </span>
                  </div>
                </div>
              </div>

              {/* Disclaimer & Place Order - Standalone */}
              <div className="mb-4 px-2 ml-[54px] mr-[4px]">
                <p className="text-[11px] text-[#555] text-center mb-2 leading-[1.6]">
                  We are a resale marketplace, not the ticket seller. Prices are set by third-party sellers and may be above or below face value.
                </p>
                <p className="text-[11px] text-[#333] text-center mb-1.5">
                  By clicking &quot;Place Order&quot;, you will be charged <strong>${totalPrice.toFixed(2)}</strong>.
                </p>
                <p className="text-[11px] text-[#555] text-center mb-5">
                  By clicking &quot;Place Order&quot;, you are agreeing to TicketNetwork.com&apos;s{" "}
                  <a href="#" className="text-[#0066cc] underline">terms &amp; policies</a>. All sales are final.
                </p>

                <button
                  type="submit"
                  disabled={!selectedCard || isSubmitting}
                  className="w-full max-w-[400px] mx-auto block text-white font-bold py-3.5 text-[16px] rounded-[5px] disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: !selectedCard && !isSubmitting ? "#4db8ff" : "#1a90ff",
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-600 font-medium text-center text-[13px] mb-4">
                  {errorMessage}
                </div>
              )}
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full lg:w-[280px] flex-shrink-0 lg:sticky lg:top-5 h-fit">
            <CheckoutSummary
              onTotalChange={(total: number) => {
                setTotalPrice(total);
                return true;
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#ddd] mt-6">
        <div className="max-w-[960px] mx-auto px-4 py-5">
          {/* Payment Icons */}
          <div className="flex items-center justify-center gap-1.5 mb-4 flex-wrap">
            <Image src="/visa.svg" alt="Visa" width={38} height={24} />
            <Image src="/mastercard.svg" alt="Mastercard" width={38} height={24} />
            <Image src="/amex.svg" alt="Amex" width={38} height={24} />
            <Image src="/discover.svg" alt="Discover" width={38} height={24} />
            <Image src="/jcb.svg" alt="JCB" width={38} height={24} />
            <Image src="/paypal.svg" alt="PayPal" width={38} height={24} />
            {/* Apple Pay */}
            <span className="inline-flex items-center justify-center h-[24px] px-1.5 border border-[#ddd] rounded-[3px] bg-white">
              <svg width="30" height="14" viewBox="0 0 30 14" fill="none">
                <path d="M5.5 3.5C5 2.5 4 1.5 3 1.5C1.5 1.5 0 3 0 5.5C0 8 1.5 11.5 3 11.5C4 11.5 4.5 11 5.5 11C6.5 11 7 11.5 8 11.5C9.5 11.5 11 8 11 5.5" fill="#333" />
                <text x="13" y="10" fontSize="8" fill="#333" fontWeight="600" fontFamily="Arial">Pay</text>
              </svg>
            </span>
            {/* Venmo */}
            <span className="inline-flex items-center justify-center h-[24px] w-[38px] border border-[#ddd] rounded-[3px]" style={{ backgroundColor: "#3d95ce" }}>
              <span className="text-white font-bold text-[14px] italic">V</span>
            </span>
            {/* Generic Card */}
            <span className="inline-flex items-center justify-center h-[24px] w-[38px] border border-[#ddd] rounded-[3px] bg-white">
              <Image src="/creditcard.svg" alt="Card" width={28} height={18} />
            </span>
            {/* Apple Pay (full) */}
            <span className="inline-flex items-center justify-center h-[24px] px-1 border border-[#ddd] rounded-[3px] bg-black">
              <svg width="30" height="14" viewBox="0 0 30 14" fill="none">
                <text x="0" y="11" fontSize="9" fill="white" fontWeight="600" fontFamily="Arial"> Pay</text>
              </svg>
            </span>
            {/* Amazon Pay */}
            <span className="inline-flex items-center justify-center h-[24px] px-1.5 border border-[#ddd] rounded-[3px] bg-white">
              <span className="text-[9px] font-bold text-[#333]" style={{ fontFamily: "Arial" }}>amazon<span className="text-[#ff9900]">pay</span></span>
            </span>
            {/* Affirm */}
            <span className="inline-flex items-center justify-center h-[24px] px-2 border border-[#ddd] rounded-[3px] bg-white">
              <span className="text-[10px] font-bold text-black italic" style={{ fontFamily: "Arial" }}>affirm</span>
            </span>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] text-[#555] mb-2.5">
            <a href="#" className="hover:underline">About Us</a>
            <span className="text-[#ccc]">|</span>
            <a href="#" className="hover:underline">Help</a>
            <span className="text-[#ccc]">|</span>
            <a href="#" className="hover:underline">Terms &amp; Conditions</a>
            <span className="text-[#ccc]">|</span>
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span className="text-[#ccc]">|</span>
            <a href="#" className="hover:underline">Consumer Privacy Rights</a>
            <span className="text-[#ccc]">|</span>
            <a href="#" className="hover:underline">Privacy Preferences</a>
            <span className="text-[#ccc]">|</span>
            <a href="#" className="hover:underline">Do Not Sell or Share My Info</a>
            <span className="text-[#ccc]">|</span>
            <a href="#" className="hover:underline">100% Money-Back Guarantee</a>
          </div>

          <div className="relative">
            <p className="text-[11px] text-[#999] text-center">
              ©2026 TicketNetwork.com All rights reserved.
            </p>
            <div className="absolute right-0 bottom-0 flex items-center gap-0.5 text-[9px] text-[#555]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5.5" stroke="#28a745" strokeWidth="1" fill="none" />
                <path d="M3.5 6L5.5 8L8.5 4" stroke="#28a745" strokeWidth="1.2" fill="none" />
              </svg>
              <span className="font-medium">TrustedSite</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("ticketnetwork.onReady");
          window.accelerate.init({
            amount: stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in", { user });
              maybeUseAccelUser(user);
              setIsLoggedIn(true);
            },
            onCardSelected: (cardId) => {
              setSelectedCard(cardId);
            },
            onPaymentInitiated: async (source) => {
              const confirmIntent = await fetch("/api/stripe/confirm", {
                method: "POST",
                body: JSON.stringify({
                  processorToken: source.processorToken,
                  cartId: "some-cart",
                }),
              });
              const res = (await confirmIntent.json()) as { status: string; message?: string };
              if (res.status === "succeeded") {
                router.push("/completion?status=succeeded");
              } else {
                setErrorMessage(res.message || "Unknown error");
              }
            },
          });
          setAccelerateLoaded(true);
        }}
      />
    </div>
  );
}
