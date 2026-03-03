import * as React from "react";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

const ProductItem = ({
  imageSrc,
  name,
  price,
}: {
  imageSrc: string;
  name: string;
  price: number;
}) => (
  <div className="px-4 py-4 flex gap-3 border-b border-gray-200">
    <div className="w-16 h-16 rounded border border-gray-200 flex-shrink-0 overflow-hidden bg-gray-50">
      <Image
        src={imageSrc}
        alt={name}
        width={64}
        height={64}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-900 leading-tight">{name}</p>
    </div>
    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
      ${price.toFixed(2)}
    </p>
  </div>
);

export function CheckoutSummary({
  shippingCost,
  onTotalChange,
  hideHeading,
  worryFreeReturns = 0,
}: CheckoutSummaryProps) {
  const product = {
    imageSrc: "/jordan-1-low-fragment-design-x-travis-scott-1.jpg",
    name: "Selkirk Luxx Control Air Epic - 1st generation - Ultimate Control & Spin",
    price: 150.0,
  };

  const subtotal = 150.0;
  const salesTax = 14.63;
  const total = subtotal + (shippingCost || 0) + salesTax + worryFreeReturns;

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {!hideHeading && (
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p className="text-sm text-gray-700">
            Sold by <span className="font-semibold">mrose84</span>
          </p>
        </div>
      )}

      <ProductItem {...product} />

      <div className="px-4 py-3 space-y-2 border-b border-gray-200 text-sm">
        <div className="flex justify-between">
          <span className="font-medium text-gray-900">Price</span>
          <span className="text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-900">Shipping</span>
          <span className="text-gray-900">
            {shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-900">CA Sales Tax</span>
          <span className="text-gray-900">${salesTax.toFixed(2)}</span>
        </div>
        {worryFreeReturns > 0 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-900">Worry-Free Returns</span>
            <span className="text-gray-900">${worryFreeReturns.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-semibold text-gray-900">
            ${total.toFixed(2)} USD
          </span>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-200">
        <button
          disabled
          className="w-full py-3 border border-gray-200 rounded text-sm text-orange-300 font-medium bg-white cursor-not-allowed"
        >
          Complete Purchase
        </button>
      </div>

      <div className="px-4 py-3 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-[#2DB87D] flex-shrink-0" />
        <p className="text-xs text-gray-600">
          Shop Safely with SidelineSwap Buyer Protection
        </p>
      </div>
    </div>
  );
}

interface CheckoutSummaryProps {
  shippingCost: number;
  onTotalChange: (total: number) => void;
  hideHeading?: boolean;
  worryFreeReturns?: number;
}
