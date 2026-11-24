import * as React from "react";
import Image from "next/image";
import { Lock } from "lucide-react";

const money = (n: number) => `$${n.toFixed(2)}`;

const SUBTOTAL = 99.99;
const ESTIMATED_TAX = 8.0;

/** Order total in dollars, rounded to cents. The payment page and the summary both use this, so they always agree. */
export const orderTotal = (shippingCost: number) => Math.round((SUBTOTAL + (shippingCost || 0) + ESTIMATED_TAX) * 100) / 100;

const ProductItem = ({
  imageSrc,
  name,
  size,
  price,
  quantity = 1,
}: {
  imageSrc: string;
  name: string;
  size: string;
  price: number;
  quantity?: number;
}) => (
  <div className="flex gap-4 items-center">
    <div className="acc-thumb">
      <Image src={imageSrc} alt={name} width={152} height={152} className="w-full h-full object-contain p-1.5" />
      <span className="acc-qty" aria-label={`Quantity ${quantity}`}>
        {quantity}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-[15px] leading-snug font-semibold acc-strong text-pretty">{name}</h3>
      <p className="acc-caption mt-1">Size {size} · Qty {quantity}</p>
    </div>
    <p className="acc-num text-[15px] acc-strong self-start">{money(price)}</p>
  </div>
);

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex justify-between items-baseline text-[15px]">
    <span className="text-[var(--ink-4)]">{label}</span>
    <span
      className={`${value.startsWith("$") ? "acc-num" : ""} ${accent ? "text-[var(--pine-5)] font-medium" : "text-[var(--ink-2)]"}`}
    >
      {value}
    </span>
  </div>
);

export function CheckoutSummary({ selectedShipping, shippingCost, onTotalChange, hideHeading }: CheckoutSummaryProps) {
  const product = {
    imageSrc: "/jordan-1-low-fragment-design-x-travis-scott-1.jpg",
    name: "Air Jordan 1 Lows Fragment X Travis Scott",
    size: "10",
    price: 99.99,
  };

  const subtotal = SUBTOTAL;
  const estimatedTax = ESTIMATED_TAX;
  const total = orderTotal(shippingCost);
  const shipping = shippingCost === 0 ? "Free" : selectedShipping === undefined ? "Calculated next" : money(shippingCost);

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  const body = (
    <>
      <ProductItem {...product} quantity={1} />

      <hr className="acc-rule my-6" />

      <div className="space-y-3">
        <Row label="Subtotal" value={money(subtotal)} />
        <Row label="Shipping" value={shipping} accent={shippingCost === 0} />
        <Row label="Estimated tax" value={money(estimatedTax)} />
      </div>

      <hr className="acc-rule my-6" />

      <div className="flex justify-between items-baseline">
        <span className="text-[17px] font-semibold acc-strong">Total</span>
        <span className="flex items-baseline gap-2">
          <span className="acc-caption acc-num">USD</span>
          <span className="acc-num text-[26px] leading-none font-medium acc-strong tracking-[-0.02em]">{money(total)}</span>
        </span>
      </div>

      <div className="acc-note mt-6">
        <Lock size={15} strokeWidth={2} className="mt-[2px] flex-none text-[var(--pine-5)]" aria-hidden />
        <p className="acc-caption !text-[var(--ink-4)]">Your payment information is secure and encrypted.</p>
      </div>
    </>
  );

  if (hideHeading) return <div>{body}</div>;

  return (
    <section className="acc-card acc-summary" aria-labelledby="order-summary-heading">
      <div className="acc-card-head">
        <h2 id="order-summary-heading" className="acc-h4">
          Order summary
        </h2>
        <span className="acc-eyebrow">1 item</span>
      </div>
      {body}
    </section>
  );
}

interface CheckoutSummaryProps {
  selectedShipping?: boolean | undefined;
  shippingCost: number;
  onTotalChange?: (total: number) => void;
  hideHeading?: boolean;
}
