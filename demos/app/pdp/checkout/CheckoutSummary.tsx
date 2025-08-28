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
  variant,
  price,
  quantity,
}: {
  imageSrc: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
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
      <div className="text-neutral-500">{variant} • Qty: {quantity}</div>
    </div>
    <div className="text-black whitespace-nowrap">${(price * quantity).toFixed(2)}</div>
  </div>
);

export function CheckoutSummary({ 
  productImage, 
  productTitle, 
  variantTitle, 
  productPrice, 
  quantity, 
  onTotalChange 
}: CheckoutSummaryProps) {
  // Hardcode product price to $0.99
  const hardcodedPrice = 0.99;
  const subtotal = hardcodedPrice * quantity;
  const shipping = "FREE"; // Always show free shipping
  const total = subtotal; // No tax, no shipping cost

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  return (
    <div className="flex flex-col w-full max-w-[444px] mx-auto text-sm">
      <ProductItem 
        imageSrc={productImage}
        name={productTitle}
        variant={variantTitle}
        price={productPrice}
        quantity={quantity}
      />
      <div className="flex flex-col gap-2 mt-5">
        <PriceRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
        <PriceRow label="Shipping" value={shipping} />
        <div className="flex justify-between text-xl font-semibold mt-2">
          <span>Total</span>
          <span>${Number(total).toFixed(2)}</span>
        </div>
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
  productImage: string;
  productTitle: string;
  variantTitle: string;
  productPrice: number;
  quantity: number;
  onTotalChange: (total: number) => void;
}
