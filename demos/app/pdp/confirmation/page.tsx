"use client";

import Link from "next/link";
import { Suspense } from "react";

function ConfirmationContent() {
  // Since we're no longer using CheckoutContext, this page is now deprecated
  // The new confirmation page is at /pdp/payment/confirmation
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Moved</h1>
        <p className="text-gray-600 mb-8">This confirmation page has been moved to a new location.</p>
        <Link 
          href="/pdp" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Products
        </Link>
      </div>
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
