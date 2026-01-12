import * as React from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

const ProductItem = ({
  imageSrc,
  name,
  variant,
  price,
  quantity = 1,
}: {
  imageSrc: string;
  name: string;
  variant: string;
  price: number;
  quantity?: number;
}) => (
  <div className="flex gap-4">
    <div className="w-20 h-20 rounded-lg border border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0 overflow-hidden">
      <Image
        src={imageSrc}
        alt={name}
        width={80}
        height={80}
        className="w-full h-full object-contain"
      />
    </div>
    <div className="flex-1">
      <h3 className="font-medium text-slate-900 text-sm">{name}</h3>
      <p className="text-sm text-slate-500 mt-1">{variant}</p>
      <p className="text-sm text-slate-500">Qty: {quantity}</p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-slate-900">${(price * quantity).toFixed(2)}</p>
    </div>
  </div>
);

export function CheckoutSummary({ 
  productImage, 
  productTitle, 
  variantTitle, 
  productPrice: _productPrice, 
  quantity, 
  selectedShipping: _selectedShipping, 
  shippingCost = 0,
  onTotalChange 
}: CheckoutSummaryProps) {
  // Hardcode product price to $0.99
  const hardcodedPrice = 0.99;
  const subtotal = hardcodedPrice * quantity;
  const shipping = shippingCost;
  const estimatedTax = 0;
  const total = subtotal + shipping + estimatedTax;

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Order Summary</h2>
      
      {/* Order Items */}
      <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
        <ProductItem 
          imageSrc={productImage}
          name={productTitle}
          variant={variantTitle}
          price={hardcodedPrice}
          quantity={quantity}
        />
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Shipping</span>
          <span className={shippingCost === 0 ? "text-green-600 font-medium" : ""}>
            {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
          </span>
        </div>
        {estimatedTax > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Tax</span>
            <span>${estimatedTax.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-slate-200 pt-4 flex justify-between text-lg font-bold text-slate-900">
          <span>Total</span>
          <span>${Number(total).toFixed(2)}</span>
        </div>
      </div>
      <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-900">Your payment information is secure and encrypted</p>
      </div>
    </div>
  );
}

interface CheckoutSummaryProps {
  productImage: string;
  productTitle: string;
  variantTitle: string;
  productPrice: number;
  quantity: number;
  selectedShipping?: boolean;
  shippingCost?: number;
  onTotalChange: (total: number) => void;
}

