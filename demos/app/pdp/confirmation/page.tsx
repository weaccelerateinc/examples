"use client";

import { useCheckout } from '../context/CheckoutContext';
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function ConfirmationContent() {
  const { checkoutData } = useCheckout();
  
  if (!checkoutData) {
    return <div>No checkout data available</div>;
  }

  const shippingCost = checkoutData.shipping === "priority" ? 9.99 : 0;
  const total = checkoutData.subtotal + shippingCost;

  const getShippingText = () => {
    if (checkoutData.shipping === "priority") {
      return "Priority Shipping (2-3 business days)";
    }
    return "Standard Shipping (4-10 business days)";
  };

  const fullName = `${checkoutData.firstName} ${checkoutData.lastName}`;

  const getPaymentMethodDisplay = () => {
    return (
      <div className="flex items-center gap-2">
        <span>{`•••• ${checkoutData.cardLast4} - $${total.toFixed(2)}`}</span>
      </div>
    );
  };

  return (
    <div className="flex overflow-hidden flex-col bg-white">
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex gap-3 items-center">
              <span className="text-3xl font-black text-blue-500">
                <Image src="/baggslogo.svg" alt="Baggs Logo" width={30} height={30} />
              </span>
              <span className="text-2xl font-bold tracking-tighter text-stone-950">Baggs</span>
            </div>
            <Image src="/checkoutbag.svg" alt="Checkout Bag" className="h-6 w-6" width={30} height={30} />
          </div>
        </div>
      </header>

      <main className="flex flex-wrap md:flex-nowrap md:flex-row-reverse justify-center w-full max-w-7xl mx-auto">
        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[520px] md:border-l border-neutral-200">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${checkoutData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[659px]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600">Confirmation #DQFDHG5E0</p>
              <h1 className="text-2xl font-bold">Thank you, {fullName}!</h1>
            </div>
          </div>

          <div className="bg-white rounded-t-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-medium mb-6">Order details</h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-500 text-sm mb-1">Contact information</h3>
                  <p>{fullName}</p>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm mb-1">Shipping address</h3>
                  <p>
                    {fullName}
                    <br />
                    {checkoutData.address}
                    <br />
                    {checkoutData.city}, {checkoutData.state} {checkoutData.zip}
                    <br />
                    United States
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm mb-1">Shipping method</h3>
                  <p>{getShippingText()}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-500 text-sm mb-1">Payment method</h3>
                  {getPaymentMethodDisplay() || (
                    <div className="flex items-center gap-2">
                      <span>Payment method not available</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm mb-1">Billing address</h3>
                  <p>
                    {fullName}
                    <br />
                    {checkoutData.address}
                    <br />
                    {checkoutData.city}, {checkoutData.state} {checkoutData.zip}
                    <br />
                    United States
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 border-t border-x border-b border-gray-200 -mt-6">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="saveInfo" className="rounded border-gray-300" />
              <label htmlFor="saveInfo" className="text-gray-700">
                Save my information for a faster checkout
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm">
              Need help?{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">
                Contact us
              </Link>
            </div>
            <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Continue shopping
            </Link>
          </div>

          <footer className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-4 text-sm text-blue-600">
              <Link href="/return-policy" className="hover:underline">
                Return policy
              </Link>
              <Link href="/privacy-policy" className="hover:underline">
                Privacy policy
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms of service
              </Link>
            </div>
          </footer>
        </section>
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
