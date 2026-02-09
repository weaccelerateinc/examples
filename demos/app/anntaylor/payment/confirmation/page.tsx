"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckoutSummary } from "../CheckoutSummary";
import Image from "next/image";
import { Suspense, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const selectedShipping = searchParams.get("shipping");
  const shippingCost = selectedShipping === "express" ? 9.99 : 0;
  const [isCollapsed, setIsCollapsed] = useState(true);

  const firstName = decodeURIComponent(searchParams.get("firstName") || "");
  const lastName = decodeURIComponent(searchParams.get("lastName") || "");
  const fullName = `${firstName} ${lastName}`;

  const billingAddress = decodeURIComponent(searchParams.get("billingAddress") || "");
  const billingCity = decodeURIComponent(searchParams.get("billingCity") || "");
  const billingState = decodeURIComponent(searchParams.get("billingState") || "");
  const billingZip = decodeURIComponent(searchParams.get("billingZip") || "");

  const shippingAddress = decodeURIComponent(searchParams.get("shippingAddress") || "");
  const shippingCity = decodeURIComponent(searchParams.get("shippingCity") || "");
  const shippingState = decodeURIComponent(searchParams.get("shippingState") || "");
  const shippingZip = decodeURIComponent(searchParams.get("shippingZip") || "");

  const shippingName = decodeURIComponent(searchParams.get("shippingName") || "");

  const getShippingText = () => {
    if (selectedShipping === "express") {
      return "Express Shipping (2-5 business days)";
    }
    return "Standard Shipping (4-10 business days)";
  };

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
          <span className="text-gray-600 text-sm">{`$${Number(totalPrice).toFixed(2)}`}</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-white ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Image src="/logo.svg" alt="Ann Taylor" width={212} height={19} className="h-5" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Summary - Mobile: Top and Collapsible */}
        <div className="lg:hidden mb-8">
          <div className="bg-white border border-gray-200 overflow-hidden">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              <h2 className="text-base font-semibold text-black">Order Summary: 1 Item</h2>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0 overflow-hidden" : "max-h-[2000px]"}`}>
              <div className="p-0">
                <CheckoutSummary
                  shippingCost={shippingCost}
                  onTotalChange={(total) => {
                    console.log("Total changed:", total);
                    return true;
                  }}
                  hideHeading={true}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Success Confirmation */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#cf9489] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600 text-xs mb-1">Order Confirmed</p>
                  <h1 className="text-2xl font-bold text-black">Thank you, {fullName}!</h1>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-3 mb-4">
                <p className="text-xs text-gray-600 mb-1">Confirmation Number</p>
                <p className="text-base font-semibold text-black">DQFDHG5E0</p>
              </div>

              <p className="text-sm text-gray-600">
                We&apos;ve sent a confirmation email to {searchParams.get("email") || "your email"}. You&apos;ll receive an update when your order ships.
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-black mb-4">Order Details</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Contact Information</h3>
                    <p className="text-sm text-black">{fullName}</p>
                    {searchParams.get("email") && (
                      <p className="text-xs text-gray-600 mt-1">{searchParams.get("email")}</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Shipping Address</h3>
                    <p className="text-sm text-black">
                      {shippingName || fullName}
                      <br />
                      {shippingAddress || billingAddress}
                      <br />
                      {shippingCity || billingCity}, {shippingState || billingState} {shippingZip || billingZip}
                      <br />
                      United States
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Shipping Method</h3>
                    <p className="text-sm text-black">{getShippingText()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Payment Method</h3>
                    {getPaymentMethodDisplay() || (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-black">Payment method not available</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Billing Address</h3>
                    <p className="text-sm text-black">
                      {fullName}
                      <br />
                      {billingAddress}
                      <br />
                      {billingCity}, {billingState} {billingZip}
                      <br />
                      United States
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-gray-600">
                Need help?{" "}
                <Link href="/contact" className="text-black hover:underline font-medium">
                  Contact us
                </Link>
              </div>
              <Link 
                href="/" 
                className="px-6 py-3 bg-black text-white font-semibold text-sm hover:bg-gray-800"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Footer */}
            <footer className="flex flex-wrap gap-3 py-4 text-xs text-black">
              <a href="https://www.weaccelerate.com/privacy" className="hover:underline">
                Privacy policy
              </a>
              <span>|</span>
              <a href="https://www.weaccelerate.com/terms" className="hover:underline">
                Terms of service
              </a>
            </footer>
          </div>

          {/* Order Summary - Desktop: Right Side, Always Visible */}
          <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
            <CheckoutSummary
              shippingCost={shippingCost}
              onTotalChange={(total) => {
                console.log("Total changed:", total);
                return true;
              }}
            />
          </div>
        </div>
      </main>
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
