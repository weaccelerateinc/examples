"use client";

import { CheckoutProvider } from "./context/CheckoutContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function PDPLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CheckoutProvider>{children}</CheckoutProvider>
    </QueryClientProvider>
  );
}
