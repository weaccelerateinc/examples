"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const searchParams = useSearchParams();
  const paramsDict: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    paramsDict[k] = v;
  });
  return (
    <div>
      <div>Payment Completed</div>
      <pre>{JSON.stringify(paramsDict, null, 2)}</pre>
    </div>
  );
}
