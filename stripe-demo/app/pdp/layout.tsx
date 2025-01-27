import { CheckoutProvider } from './context/CheckoutContext';

export default function PDPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CheckoutProvider>
      {children}
    </CheckoutProvider>
  );
} 