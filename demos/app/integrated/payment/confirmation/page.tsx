"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckoutSummary } from "../CheckoutSummary";
import { Suspense, useState } from "react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { Shell } from "../../_brand/Shell";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="acc-eyebrow mb-2.5">{label}</h3>
      <div className="text-[15px] leading-[1.6] text-[var(--ink-2)]">{children}</div>
    </div>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const selectedShipping = searchParams.get("shipping");
  const shippingCost = selectedShipping === "express" ? 9.99 : 0;
  const [isCollapsed, setIsCollapsed] = useState(true);

  const getShippingText = () => {
    if (selectedShipping === "express") {
      return "Express shipping · 2–5 business days";
    }
    return "Standard shipping · 4–10 business days";
  };

  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const email = searchParams.get("email");
  const totalPrice = searchParams.get("totalPrice");
  const cardLast4 = searchParams.get("cardLast4");

  const shipLine1 = searchParams.get("shippingAddress") || searchParams.get("address");
  const shipApt = searchParams.get("shippingApartment");
  const shipCity = searchParams.get("shippingCity") || searchParams.get("city");
  const shipState = searchParams.get("shippingState") || searchParams.get("state");
  const shipZip = searchParams.get("shippingZip") || searchParams.get("zip");
  const billLine1 = searchParams.get("billingAddress") || searchParams.get("address");
  const billCity = searchParams.get("billingCity") || searchParams.get("city");
  const billState = searchParams.get("billingState") || searchParams.get("state");
  const billZip = searchParams.get("billingZip") || searchParams.get("zip");

  const summary = (hideHeading: boolean) => (
    <CheckoutSummary
      selectedShipping={selectedShipping === "express"}
      shippingCost={shippingCost}
      onTotalChange={(total) => {
        console.log("Total changed:", total);
        return true;
      }}
      hideHeading={hideHeading}
    />
  );

  return (
    <Shell
      step={3}
      title={firstName ? `Thank you, ${firstName}.` : "Thank you."}
      lead={
        <>
          We&apos;ve sent a confirmation to {email ? <span className="acc-strong font-medium">{email}</span> : "your email"}.
          You&apos;ll get an update when your order ships.
        </>
      }
    >
      {/* Order summary on small screens: collapsible, above the details */}
      <div className="lg:hidden mb-6">
        <section className="acc-card acc-summary !p-0 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--hover-wash)] transition-colors"
          >
            <span className="acc-h4">Order summary</span>
            <span className="flex items-center gap-3">
              {totalPrice && <span className="acc-num text-[15px] acc-strong">${Number(totalPrice).toFixed(2)}</span>}
              <ChevronDown
                size={18}
                className={`text-[var(--ink-4)] transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}
                aria-hidden
              />
            </span>
          </button>
          {!isCollapsed && <div className="px-5 pb-5">{summary(true)}</div>}
        </section>
      </div>

      <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
        <div className="space-y-6 acc-reveal acc-reveal-2">
          {/* Confirmation receipt */}
          <section className="acc-card acc-sheen">
            <div className="acc-seam acc-seam-liquid mb-6" aria-hidden />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <p className="acc-eyebrow mb-2.5">Confirmation</p>
                <p className="acc-num text-[20px] font-medium acc-strong tracking-[0.04em]">DQFDHG5E0</p>
              </div>
              <div>
                <p className="acc-eyebrow mb-2.5">Paid</p>
                <p className="acc-num text-[20px] font-medium acc-strong">
                  {totalPrice ? `$${Number(totalPrice).toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <p className="acc-eyebrow mb-2.5">Card</p>
                <p className="acc-num text-[20px] font-medium acc-strong">{cardLast4 ? `•••• ${cardLast4}` : "—"}</p>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-[var(--border-hairline)] flex items-center gap-2.5 text-[14px] font-medium text-[var(--pine-5)]">
              <Sparkles size={15} strokeWidth={2} aria-hidden />
              <span>Checked out with Accelerate</span>
            </div>
          </section>

          {/* Order details */}
          <section className="acc-card" aria-labelledby="details-heading">
            <div className="acc-card-head">
              <h2 id="details-heading" className="acc-h4">
                Order details
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
              <Detail label="Contact">
                <p className="acc-strong">{fullName || "—"}</p>
                {email && <p className="text-[var(--ink-4)]">{email}</p>}
              </Detail>
              <Detail label="Payment">
                {cardLast4 ? (
                  <p className="acc-strong">
                    Card <span className="acc-num">•••• {cardLast4}</span>
                  </p>
                ) : (
                  <p>Payment method not available</p>
                )}
                {totalPrice && <p className="acc-num text-[var(--ink-4)]">${Number(totalPrice).toFixed(2)}</p>}
              </Detail>
              <Detail label="Shipping address">
                <p>
                  {fullName}
                  <br />
                  {shipLine1}
                  {shipApt && `, ${shipApt}`}
                  <br />
                  {shipCity}, {shipState} {shipZip}
                  <br />
                  United States
                </p>
              </Detail>
              <Detail label="Billing address">
                <p>
                  {fullName}
                  <br />
                  {billLine1}
                  <br />
                  {billCity}, {billState} {billZip}
                  <br />
                  United States
                </p>
              </Detail>
              <Detail label="Delivery">
                <p>{getShippingText()}</p>
              </Detail>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <p className="acc-small text-center sm:text-left">
              Need help?{" "}
              <a href="https://www.weaccelerate.com/help" className="acc-link">
                Contact us
              </a>
            </p>
            <Link href="/" className="acc-btn acc-btn-primary">
              Continue shopping
              <ArrowRight size={18} strokeWidth={2.25} className="acc-btn-arrow" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Order summary on large screens */}
        <aside className="hidden lg:block lg:sticky lg:top-[104px] acc-reveal acc-reveal-3">{summary(false)}</aside>
      </div>
    </Shell>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ConfirmationContent />
    </Suspense>
  );
}
