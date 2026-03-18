"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckoutSummary } from "../CheckoutSummary";
import Image from "next/image";
import { Suspense, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const firstName = decodeURIComponent(searchParams.get("firstName") || "");
  const lastName = decodeURIComponent(searchParams.get("lastName") || "");
  const fullName = `${firstName} ${lastName}`;

  const billingAddress = decodeURIComponent(searchParams.get("billingAddress") || "");
  const billingCity = decodeURIComponent(searchParams.get("billingCity") || "");
  const billingState = decodeURIComponent(searchParams.get("billingState") || "");
  const billingZip = decodeURIComponent(searchParams.get("billingZip") || "");

  const totalPrice = searchParams.get("totalPrice");

  const getPaymentMethodDisplay = () => {
    const cardLast4 = searchParams.get("cardLast4");
    if (!cardLast4) {
      return <span className="text-black">Payment method not available</span>;
    }
    return (
      <div className="flex items-center gap-2">
        <span className="text-black font-medium">{`•••• ${cardLast4}`}</span>
        {totalPrice && (
          <span className="text-[#666] text-[12px]">{`$${Number(totalPrice).toFixed(2)}`}</span>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen w-screen bg-white ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Header */}
      <header className="w-full" style={{ backgroundColor: "#1a90ff" }}>
        <div className="max-w-[960px] mx-auto px-4 py-3.5 flex justify-between items-center">
          <Image src="/ticketnetwork-logo.png" alt="TicketNetwork" width={195} height={23} className="h-[23px] w-auto" />
          <div className="text-white text-[16px] font-bold flex items-center gap-1.5">
            <span className="text-[15px]">&#9742;</span>
            <span>(860) 533-4080</span>
          </div>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-4 py-5">
        {/* Mobile Order Summary */}
        <div className="lg:hidden mb-5">
          <div className="bg-white border border-[#ddd] overflow-hidden">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-[13px] font-bold text-black">Order Summary</h2>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-[#666]" />
              ) : (
                <ChevronUp className="w-4 h-4 text-[#666]" />
              )}
            </button>
            <div className={`transition-all duration-300 ${isCollapsed ? "max-h-0 overflow-hidden" : "max-h-[2000px]"}`}>
              <CheckoutSummary
                onTotalChange={() => true}
                hideHeading={true}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 space-y-4">
            {/* Success */}
            <div className="bg-white border border-[#ddd] p-5">
              <div className="flex items-center gap-3 mb-4">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#28a745" />
                  <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <div>
                  <p className="text-[11px] text-[#666] mb-0.5">Order Confirmed</p>
                  <h1 className="text-[20px] font-bold text-black">Thank you, {fullName}!</h1>
                </div>
              </div>

              <div className="bg-[#f7f7f7] border border-[#ddd] p-3 mb-3">
                <p className="text-[11px] text-[#666] mb-0.5">Confirmation Number</p>
                <p className="text-[14px] font-bold text-black">TN-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
              </div>

              <p className="text-[12px] text-[#666] leading-[1.6]">
                We&apos;ve sent a confirmation email to {searchParams.get("email") || "your email"}. Your mobile tickets will be delivered shortly.
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-white border border-[#ddd] p-5">
              <h2 className="text-[14px] font-bold text-black mb-4">Order Details</h2>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[11px] text-[#666] font-medium mb-1">Contact Information</h3>
                    <p className="text-[13px] text-black">{fullName}</p>
                    {searchParams.get("email") && (
                      <p className="text-[11px] text-[#666] mt-0.5">{searchParams.get("email")}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[11px] text-[#666] font-medium mb-1">Delivery Method</h3>
                    <p className="text-[13px] text-black">Mobile Ticket</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-[11px] text-[#666] font-medium mb-1">Payment Method</h3>
                    {getPaymentMethodDisplay()}
                  </div>
                  <div>
                    <h3 className="text-[11px] text-[#666] font-medium mb-1">Billing Address</h3>
                    <p className="text-[13px] text-black leading-[1.6]">
                      {fullName}<br />
                      {billingAddress}<br />
                      {billingCity}, {billingState} {billingZip}<br />
                      United States
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-[11px] text-[#666]">
                Need help?{" "}
                <a href="#" className="text-[#0066cc] hover:underline font-medium">Contact us</a>
              </div>
              <Link
                href="/"
                className="px-5 py-2.5 text-white font-bold text-[13px] rounded-[4px]"
                style={{ backgroundColor: "#1a90ff" }}
              >
                Continue Browsing
              </Link>
            </div>

            {/* Footer Links */}
            <footer className="flex flex-wrap gap-2.5 py-3 text-[11px] text-[#555]">
              <a href="https://www.weaccelerate.com/privacy" className="hover:underline">Privacy policy</a>
              <span className="text-[#ccc]">|</span>
              <a href="https://www.weaccelerate.com/terms" className="hover:underline">Terms of service</a>
            </footer>
          </div>

          {/* Desktop Order Summary */}
          <div className="hidden lg:block w-[280px] flex-shrink-0 lg:sticky lg:top-5 h-fit">
            <CheckoutSummary onTotalChange={() => true} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#ddd] mt-6">
        <div className="max-w-[960px] mx-auto px-4 py-5">
          <div className="flex items-center justify-center gap-1.5 mb-4 flex-wrap">
            <Image src="/visa.svg" alt="Visa" width={38} height={24} />
            <Image src="/mastercard.svg" alt="Mastercard" width={38} height={24} />
            <Image src="/amex.svg" alt="Amex" width={38} height={24} />
            <Image src="/discover.svg" alt="Discover" width={38} height={24} />
            <Image src="/jcb.svg" alt="JCB" width={38} height={24} />
            <Image src="/paypal.svg" alt="PayPal" width={38} height={24} />
          </div>
          <p className="text-[11px] text-[#999] text-center">
            ©2026 TicketNetwork.com All rights reserved.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
