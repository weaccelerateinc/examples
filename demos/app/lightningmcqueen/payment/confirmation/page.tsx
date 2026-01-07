"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckoutSummary } from "../CheckoutSummary";
import Image from "next/image";
import { Suspense } from "react";
import { Lock, CheckCircle2 } from "lucide-react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const selectedShipping = searchParams.get("shipping");
  const shippingCost = selectedShipping === "express" ? 9.99 : 0;

  const getShippingText = () => {
    if (selectedShipping === "express") {
      return "Express Shipping (2-5 business days)";
    }
    return "Standard Shipping (4-10 business days)";
  };

  const fullName = `${searchParams.get("firstName")} ${searchParams.get("lastName")}`;
  const totalPrice = searchParams.get("totalPrice");

  const getPaymentMethodDisplay = () => {
    //const cardBrand = searchParams.get("cardBrand");
    const cardLast4 = searchParams.get("cardLast4");

    if (!cardLast4) {
      return <span className="text-slate-900">Payment method not available</span>;
    }

    //const brandImage = cardBrand
    //? {
    //    visa: "/visa.svg",
    //    mastercard: "/mastercard.svg",
    //    amex: "/amex.svg",
    //  }[cardBrand.toLowerCase()]
    //  : "/generic-card.svg";

    return (
      <div className="flex items-center gap-2">
        {/* <Image src={brandImage!} alt={cardBrand || "Card Brand"} className="h-5" width={20} height={20} /> */}      
        <span className="text-slate-900 font-medium">{`•••• ${cardLast4}`}</span>
        {totalPrice && (
          <span className="text-slate-500 text-sm">{`$${Number(totalPrice).toFixed(2)}`}</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]">
      <header className="w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
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
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">Accelerate</span>
          </div>
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            {/* Success Confirmation */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">Order Confirmed</p>
                  <h1 className="text-3xl font-bold text-slate-900">Thank you, {fullName}!</h1>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-600 mb-1">Confirmation Number</p>
                <p className="text-lg font-semibold text-slate-900">DQFDHG5E0</p>
              </div>

              <p className="text-slate-600">
                We&apos;ve sent a confirmation email to {searchParams.get("email") || "your email"}. You&apos;ll receive an update when your order ships.
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Order Details</h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Contact Information</h3>
                    <p className="text-slate-900">{fullName}</p>
                    {searchParams.get("email") && (
                      <p className="text-slate-600 text-sm mt-1">{searchParams.get("email")}</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Shipping Address</h3>
                    <p className="text-slate-900">
                      {fullName}
                      <br />
                      {searchParams.get("address")}
                      <br />
                      {searchParams.get("city")}, {searchParams.get("state")} {searchParams.get("zip")}
                      <br />
                      United States
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Shipping Method</h3>
                    <p className="text-slate-900">{getShippingText()}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Payment Method</h3>
                    {getPaymentMethodDisplay() || (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900">Payment method not available</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Billing Address</h3>
                    <p className="text-slate-900">
                      {fullName}
                      <br />
                      {searchParams.get("address")}
                      <br />
                      {searchParams.get("city")}, {searchParams.get("state")} {searchParams.get("zip")}
                      <br />
                      United States
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-sm text-slate-600">
                Need help?{" "}
                <Link href="/contact" className="text-blue-600 hover:underline font-medium">
                  Contact us
                </Link>
              </div>
              <Link 
                href="/" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-500/30"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Footer */}
            <footer className="flex flex-wrap gap-3.5 py-5 text-sm text-slate-600">
              <a href="https://www.weaccelerate.com/privacy" className="hover:underline">
                Privacy policy
              </a>
              <a href="https://www.weaccelerate.com/terms" className="hover:underline">
                Terms of service
              </a>
            </footer>
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <CheckoutSummary
              selectedShipping={selectedShipping === "express"}
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

