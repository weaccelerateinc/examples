import * as React from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown, Info, Trash2 } from "lucide-react";
import { useState } from "react";

const ProductItem = ({
  imageSrc,
  name,
  styleNumber,
  color,
  sizeType,
  size,
  price,
  quantity = 1,
}: {
  imageSrc: string;
  name: string;
  styleNumber: string;
  color: string;
  sizeType: string;
  size: string;
  price: number;
  quantity?: number;
}) => (
  <div className="flex gap-4 mb-4">
    <div className="flex-shrink-0">
      <div className="w-32 h-40 rounded border border-gray-200 flex items-center justify-center bg-white overflow-hidden mb-2">
        <Image
          src={imageSrc}
          alt={name}
          width={128}
          height={160}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-xs text-black">Best Seller</span>
    </div>
    <div className="flex-1">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-medium text-black text-sm">{name}</h3>
        <button className="text-gray-400 hover:text-black">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-1">STYLE #{styleNumber}</p>
      <p className="text-xs text-black font-medium mb-1">${price.toFixed(2)}</p>
      <p className="text-xs text-gray-600 mb-1"><span className="font-bold">COLOR:</span> {color}</p>
      <p className="text-xs text-gray-600 mb-1"><span className="font-bold">SIZE TYPE:</span> {sizeType}</p>
      <p className="text-xs text-gray-600 mb-1"><span className="font-bold">SIZE:</span> {size}</p>
      <p className="text-xs text-gray-600"><span className="font-bold">QTY:</span> {quantity}</p>
    </div>
  </div>
);

export function CheckoutSummary({ shippingCost, onTotalChange, hideHeading }: CheckoutSummaryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isPromoFocused, setIsPromoFocused] = useState(false);

  const product = {
    imageSrc: "/858065_020234.webp",
    name: "Belted Crew Neck Cardigan",
    styleNumber: "858065",
    color: "SUNRISE LAVENDER",
    sizeType: "CLASSIC",
    size: "S",
    price: 129.00,
  };

  const subtotal = 129.00;
  const estimatedTax = 13.45;
  const shipping = shippingCost || 8.95;
  const total = subtotal + shipping + estimatedTax;

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      // Promo code applied logic here
      setPromoCode("");
    }
  };

  return (
    <div className={`bg-white ${hideHeading ? "" : "border border-gray-200"}`}>
      {!hideHeading && (
        <div className="border-b border-gray-200 py-3 px-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-black">Order Summary: 1 Item</h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-600 hover:text-black"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      )}
      
      {!isCollapsed && (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-black mb-3">Ship to Me</h3>
          
          {/* Order Items */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <ProductItem {...product} quantity={1} />
          </div>

          <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
            <div className="flex justify-between text-sm text-black">
              <span>Merchandise Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-black">
              <span className="flex items-center gap-1">
                Taxes
                <Info className="w-3 h-3 text-gray-400" />
              </span>
              <span>$13.45</span>
            </div>
            <div className="flex justify-between text-sm text-black">
              <span className="flex items-center gap-1">
                Shipping & Processing Fee
                <Info className="w-3 h-3 text-gray-400" />
              </span>
              <span>$8.95</span>
            </div>
            <div className="flex justify-between text-base font-bold text-black pt-2 border-t border-gray-200">
              <span>Order Total</span>
              <span>${Number(total).toFixed(2)}</span>
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="promo-code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onFocus={() => setIsPromoFocused(true)}
                  onBlur={() => setIsPromoFocused(false)}
                  className="w-full px-3 pt-5 pb-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                />
                <label
                  htmlFor="promo-code"
                  className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                    promoCode.length > 0 || isPromoFocused
                      ? "top-1.5 text-sm text-gray-600"
                      : "top-3.5 text-base text-gray-400"
                  }`}
                >
                  Promo Code
                </label>
              </div>
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-4 py-3 bg-black text-white text-sm hover:bg-gray-800"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-600">
            Need assistance? Text 1-800-342-5266
          </div>
        </div>
      )}
    </div>
  );
}

interface CheckoutSummaryProps {
  shippingCost: number;
  onTotalChange: (total: number) => void;
  hideHeading?: boolean;
}
