"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CheckoutData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  shipping: string;
  subtotal: number;
  cardLast4: string;
  product?: {
    id: string;
    title: string;
    price: number;
    selectedSize?: string;
    quantity?: number;
  };
}

interface CheckoutContextType {
  checkoutData: CheckoutData | null;
  setCheckoutData: (data: CheckoutData) => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  return <CheckoutContext.Provider value={{ checkoutData, setCheckoutData }}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}
