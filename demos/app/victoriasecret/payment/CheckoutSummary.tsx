import * as React from "react";
import { ChevronRight } from "lucide-react";

export function CheckoutSummary({
  shippingCost,
  onTotalChange,
  hideHeading,
}: CheckoutSummaryProps) {
  const subtotal = 79.95;
  const shipping = shippingCost;
  const salesTax = 8.58;
  const total = subtotal + shipping + salesTax;

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  return (
    <div>
      {!hideHeading && (
        <h2 className="text-base font-bold text-black mb-4">Order Summary</h2>
      )}
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between font-bold">
          <span className="text-gray-600">Subtotal (1 Item)</span>
          <span className="text-black">$79.95</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="text-black">${shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Sales Tax</span>
          <span className="text-black">$8.58</span>
        </div>
      </div>
      <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
        <span className="text-base font-bold text-black">Total</span>
        <span className="text-base font-bold text-black">
          ${total.toFixed(2)}
        </span>
      </div>
      <div className="mt-6">
        <a
          href="#"
          className="flex items-center justify-between text-xs font-bold text-black uppercase tracking-[0.1em] hover:underline"
        >
          <span>View Shopping Bag</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

interface CheckoutSummaryProps {
  selectedShipping?: boolean | undefined;
  shippingCost: number;
  onTotalChange: (total: number) => void;
  hideHeading?: boolean;
}
