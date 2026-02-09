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
    <div className="w-24 h-32 rounded border border-gray-200 flex items-center justify-center bg-white flex-shrink-0 overflow-hidden">
      <Image
        src={imageSrc}
        alt={name}
        width={96}
        height={128}
        className="w-full h-full object-cover"
      />
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
      <p className="text-xs text-gray-600 mb-1">{color}</p>
      <p className="text-xs text-gray-600 mb-1">{sizeType}</p>
      <p className="text-xs text-gray-600 mb-1">Size: {size}</p>
      <p className="text-xs text-gray-600">QTY: {quantity}</p>
      <span className="inline-block mt-2 text-xs font-semibold text-black bg-yellow-100 px-2 py-0.5">Best Seller</span>
    </div>
  </div>
);

export function CheckoutSummary({ shippingCost, onTotalChange, hideHeading }: CheckoutSummaryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("SHIP895");

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
  const estimatedTax = 0; // TBD
  const total = subtotal + (shippingCost || 0) + estimatedTax;

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setAppliedPromo(promoCode.trim().toUpperCase());
      setPromoCode("");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo("");
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

          <div className="mb-4 text-xs text-black font-semibold">
            EXTRA 25% OFF YOUR $175+ PURCHASE
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
              <span>TBD</span>
            </div>
            <div className="flex justify-between text-sm text-black">
              <span className="flex items-center gap-1">
                Shipping & Processing Fee (TBD)
                <Info className="w-3 h-3 text-gray-400" />
              </span>
              <span>TBD</span>
            </div>
            <div className="flex justify-between text-base font-bold text-black pt-2 border-t border-gray-200">
              <span>Order Total</span>
              <span>${Number(total).toFixed(2)}</span>
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-2">
              <label className="text-sm text-black">Promo Code</label>
              <Info className="w-3 h-3 text-gray-400" />
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
              >
                Apply
              </button>
            </div>
            {appliedPromo && (
              <div className="flex items-center gap-2 text-xs text-black">
                <span>{appliedPromo} APPLIED</span>
                <button
                  onClick={handleRemovePromo}
                  className="text-gray-600 hover:text-black underline"
                >
                  Remove
                </button>
              </div>
            )}
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
