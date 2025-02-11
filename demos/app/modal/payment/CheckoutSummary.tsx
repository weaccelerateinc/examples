import * as React from "react";
import Image from "next/image";

const PriceRow = ({ label, value, hint, className = "" }: PriceRowProps) => (
  <div className={`flex justify-between text-sm ${className}`}>
    <span>{label}</span>
    <span className="text-neutral-500">{value}</span>
    {hint && <div className="text-sm text-neutral-500">{hint}</div>}
  </div>
);

const ProductItem = ({
  imageSrc,
  name,
  size,
  price,
}: {
  imageSrc: string;
  name: string;
  size: string;
  price: number;
}) => (
  <div className="flex gap-3.5 items-center w-full">
    <Image
      loading="lazy"
      src={imageSrc}
      alt={name}
      className="object-contain shrink-0 w-16 aspect-square"
      width={64}
      height={64}
    />
    <div className="flex flex-col flex-1 justify-center min-w-0">
      <div className="text-black truncate">{name}</div>
      <div className="text-neutral-500">Size {size}</div>
    </div>
    <div className="text-black whitespace-nowrap">${price.toFixed(2)}</div>
  </div>
);

export function CheckoutSummary({ selectedShipping, shippingCost, onTotalChange }: CheckoutSummaryProps) {
  const product = {
    imageSrc: "/shoes.svg",
    name: "Air Jordan 1 Lows Fragment X Travis Scott",
    size: "10",
    price: 39.99,
  };

  const subtotal = 39.99;
  const shipping = selectedShipping === undefined ? "Enter shipping address" : `$${shippingCost.toFixed(2)}`;
  const estimatedTax = 3.2;
  const total = subtotal + (shippingCost || 0) + estimatedTax;

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  return (
    <div className="flex flex-col w-full max-w-[444px] mx-auto text-sm">
      <ProductItem {...product} />
      <div className="flex flex-col gap-2 mt-5">
        <PriceRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
        <PriceRow label="Shipping" value={shipping} />
        <PriceRow label="Estimated taxes" value={`$${estimatedTax.toFixed(2)}`} />
        <div className="flex justify-between text-xl font-semibold mt-2">
          <span>Total</span>
          <span>${Number(total).toFixed(2)}</span>
        </div>
        <div className="text-sm text-neutral-500">Including ${Number(estimatedTax).toFixed(2)} in taxes</div>
      </div>
    </div>
  );
}

interface PriceRowProps {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}

interface CheckoutSummaryProps {
  selectedShipping?: boolean | undefined;
  shippingCost: number;
  onTotalChange: (total: number) => void;
}
