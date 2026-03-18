import * as React from "react";
import { useState } from "react";

export function CheckoutSummary({ onTotalChange, hideHeading }: CheckoutSummaryProps) {
  const [quantity, setQuantity] = useState(1);

  const ticketPrice = 239.80;
  const total = ticketPrice * quantity;

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  return (
    <div
      className={`bg-white ${hideHeading ? "" : "border border-[#ddd]"}`}
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Event Details */}
      <div className="p-4 pb-3">
        <h2 className="text-[15px] font-bold text-black mb-2 leading-tight">Ye - Kanye West</h2>
        <div className="text-[12px] text-[#333] leading-[1.6] mb-3">
          <p>Friday, April 3, 2026 at 7:00 PM</p>
          <p>SoFi Stadium in Inglewood, CA, United States of America</p>
        </div>

        <div className="text-[12px] text-[#333] mb-2">
          Section: <span className="font-bold text-[15px] text-black">Outer 553</span>
          <span className="mx-2 text-[#ccc]">|</span>
          Row: <span className="font-bold text-[15px] text-black">25</span>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-[#333] mb-3">
          <span>Quantity:</span>
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border border-[#bbb] px-1.5 py-0.5 text-[12px] bg-white rounded-[2px]"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <p className="text-[10px] text-[#999] leading-[1.5] italic">
          All prices are in US Dollars ($) except where otherwise noted.
        </p>
      </div>

      {/* Order Summary */}
      <div className="border-t border-[#ddd] px-4 py-3">
        <h3 className="text-[13px] font-bold text-[#333] mb-2">Order Summary</h3>

        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-bold text-black">Order Total: ${total.toFixed(2)}</span>
          <button className="text-[#0066cc] text-[12px] hover:underline flex items-center gap-0.5">
            Details
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-0.5">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="#0066cc" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        </div>

        <div className="text-[11px] text-[#666] mt-3 leading-[1.5]">
          Starting at <strong className="text-black">$22</strong>/mo with{" "}
          <span className="font-bold italic text-black">affirm</span>.{" "}
          <a href="#" className="text-[#0066cc] hover:underline">Prequalify now</a>
        </div>
      </div>
    </div>
  );
}

interface CheckoutSummaryProps {
  onTotalChange: (total: number) => void;
  hideHeading?: boolean;
}
