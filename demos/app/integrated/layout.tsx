import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./brand.css";

// Instrument Sans is the core face of the weaccelerate.com design system.
// Geist Mono (money, card numbers, eyebrows) is already loaded by the root layout.
const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Checkout · Accelerate demo store",
};

export default function IntegratedLayout({ children }: { children: React.ReactNode }) {
  // Page surface: "white" matches weaccelerate.com. Change to "porcelain" for the earlier warm off-white version.
  return (
    <div className={`acc-demo ${instrument.variable}`} data-surface="white">
      {children}
    </div>
  );
}
