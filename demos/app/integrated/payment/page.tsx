"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { stripeOptions } from "../../options";
import type { AccelerateWindowAPI } from "accelerate-js-types";
import { CheckoutSummary, orderTotal } from "./CheckoutSummary";
import Image from "next/image";
import { AccelerateWallet } from "../../../components/AccelerateWallet";
import { Lock, Truck, Zap, CreditCard, ChevronDown, Loader2 } from "lucide-react";
import { Field, Shell } from "../_brand/Shell";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

/** A selectable row for shipping and payment choices. The native radio stays in the DOM for keyboard use. */
function OptionRow({
  name,
  value,
  checked,
  onChange,
  icon,
  title,
  detail,
  trailing,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  title: string;
  detail?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className={`acc-option ${checked ? "is-selected" : ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <span className="acc-radio" aria-hidden />
      <span className="acc-icon-chip" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15.5px] font-semibold acc-strong leading-snug">{title}</span>
        {detail && <span className="block acc-caption mt-0.5">{detail}</span>}
      </span>
      {trailing}
    </label>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Billing address (from initial form, preserved)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [billingAddress, _setBillingAddress] = useState(searchParams.get("address") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [billingCity, _setBillingCity] = useState(searchParams.get("city") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [billingState, _setBillingState] = useState(searchParams.get("state") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [billingZip, _setBillingZip] = useState(searchParams.get("zip") || "");

  // Shipping address (editable, initialized from billing)
  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [zip, setZip] = useState(searchParams.get("zip") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [firstName, _setFirstName] = useState(searchParams.get("firstName") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastName, _setLastName] = useState(searchParams.get("lastName") || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [email, _setEmail] = useState(searchParams.get("email") || "");

  const [accelLoaded, setAccelerateLoaded] = useState(false);

  useEffect(() => {
    console.log("Form data updated:", {
      address,
      city,
      state,
      zip,
    });
  }, [address, city, state, zip]);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  // Computed here, not reported by CheckoutSummary, so it stays correct while the summary is collapsed
  const totalPrice = orderTotal(shippingCost);
  // null = not chosen yet: CSS shows the summary open on desktop and closed on phones, so it does not jump after load
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Record the state the CSS already shows, so the toggle and aria-expanded are correct
  useEffect(() => {
    setIsOrderSummaryExpanded(!window.matchMedia("(max-width: 1023px)").matches);
  }, []);

  // Only a card from the Accelerate wallet can pay. A card picked earlier must not be charged when PayPal or Zip is selected.
  const canPay = selectedPayment === "card" && !!selectedCard;

  console.log({
    selectedPayment,
    accelLoaded,
  });
  const handleSubmit = async (e: FormEvent) => {
    console.log("EVENT", e);
    e.preventDefault();
    if (canPay && selectedCard) {
      setIsSubmitting(true);
      try {
        const card = await window.accelerate.requestSource(selectedCard);
        if ("status" in card) {
          console.log("Error", { card });
          setIsSubmitting(false);
          return;
        }
        console.log({ card: JSON.stringify(card) });
        router.push(
          `/integrated/payment/confirmation?` +
            `firstName=${encodeURIComponent(firstName)}&` +
            `lastName=${encodeURIComponent(lastName)}&` +
            `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
            `shippingAddress=${encodeURIComponent(address)}&` +
            `${apartment ? `shippingApartment=${encodeURIComponent(apartment)}&` : ""}` +
            `shippingCity=${encodeURIComponent(city)}&` +
            `shippingState=${encodeURIComponent(state)}&` +
            `shippingZip=${encodeURIComponent(zip)}&` +
            `billingAddress=${encodeURIComponent(billingAddress)}&` +
            `billingCity=${encodeURIComponent(billingCity)}&` +
            `billingState=${encodeURIComponent(billingState)}&` +
            `billingZip=${encodeURIComponent(billingZip)}&` +
            `shipping=${encodeURIComponent(selectedShipping)}&` +
            //`cardBrand=${encodeURIComponent(card?.details?.cardIssuer || "")}&` +
            `cardLast4=${encodeURIComponent(card?.details?.mask || "")}&` +
            `totalPrice=${encodeURIComponent(totalPrice)}`
        );
      } catch (error) {
        console.error("Payment error:", error);
        setIsSubmitting(false);
      }
    } else {
      return;
    }
  };

  const choosePayment = (value: string) => setSelectedPayment(value);

  return (
    <Shell
      step={2}
      title="Payment"
      lead="Complete your secure checkout."
    >
      <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
        <div className="space-y-6 order-2 lg:order-1 acc-reveal acc-reveal-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping Information */}
            <section className="acc-card" aria-labelledby="ship-heading">
              <div className="acc-card-head">
                <h2 id="ship-heading" className="acc-h4">
                  Shipping address
                </h2>
              </div>
              <div className="space-y-3">
                <Field
                  label="Street address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="shipping address-line1"
                />
                <Field
                  label="Apartment, suite, etc."
                  optional
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  autoComplete="shipping address-line2"
                />
                <Field
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="shipping address-level2"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    autoComplete="shipping address-level1"
                  />
                  <Field
                    label="ZIP"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    autoComplete="shipping postal-code"
                    inputMode="numeric"
                    mono
                  />
                </div>
              </div>
            </section>

            {/* Shipping Method */}
            <section className="acc-card" aria-labelledby="delivery-heading">
              <div className="acc-card-head">
                <h2 id="delivery-heading" className="acc-h4">
                  Delivery
                </h2>
              </div>
              <div className="space-y-3" role="radiogroup" aria-labelledby="delivery-heading">
                <OptionRow
                  name="shippingMethod"
                  value="standard"
                  checked={selectedShipping === "standard"}
                  onChange={(v) => {
                    setSelectedShipping(v);
                    setShippingCost(0);
                  }}
                  icon={<Truck size={19} strokeWidth={1.75} />}
                  title="Standard shipping"
                  detail="4–10 business days"
                  trailing={<span className="text-[15px] font-medium text-[var(--pine-5)]">Free</span>}
                />
                <OptionRow
                  name="shippingMethod"
                  value="express"
                  checked={selectedShipping === "express"}
                  onChange={(v) => {
                    setSelectedShipping(v);
                    setShippingCost(9.99);
                  }}
                  icon={<Zap size={19} strokeWidth={1.75} />}
                  title="Express shipping"
                  detail="2–5 business days"
                  trailing={<span className="acc-num text-[15px] acc-strong">$9.99</span>}
                />
              </div>
            </section>

            {/* Payment Method */}
            <section className="acc-card" aria-labelledby="pay-heading">
              <div className="acc-card-head">
                <h2 id="pay-heading" className="acc-h4">
                  Payment
                </h2>
                <span className="flex items-center gap-1.5 acc-caption">
                  <Lock size={13} strokeWidth={2} aria-hidden />
                  Encrypted
                </span>
              </div>

              <div className="space-y-3" role="radiogroup" aria-labelledby="pay-heading">
                <OptionRow
                  name="paymentMethod"
                  value="card"
                  checked={selectedPayment === "card"}
                  onChange={choosePayment}
                  icon={<CreditCard size={19} strokeWidth={1.75} />}
                  title="Card"
                  detail="Saved cards from Accelerate"
                  trailing={
                    <span className="acc-brand-logos hidden sm:flex">
                      <Image src="/visa.svg" alt="Visa" width={34} height={22} />
                      <Image src="/mastercard.svg" alt="Mastercard" width={34} height={22} />
                      <Image src="/amex.svg" alt="Amex" width={34} height={22} />
                    </span>
                  }
                />

                {/* The wallet opens once and stays open. When PayPal or Zip is chosen it is only
                    hidden (kept at full width, collapsed to zero height), so switching back to Card
                    shows it instantly instead of closing and reloading the Accelerate frame. */}
                {accelLoaded && (
                  <div
                    className={selectedPayment === "card" ? "px-1 py-2" : "!mt-0 h-0 overflow-hidden invisible px-1"}
                    aria-hidden={selectedPayment !== "card"}
                  >
                    <AccelerateWallet />
                  </div>
                )}

                <OptionRow
                  name="paymentMethod"
                  value="paypal"
                  checked={selectedPayment === "paypal"}
                  onChange={choosePayment}
                  icon={<span className="text-[15px] font-bold">P</span>}
                  title="PayPal"
                  trailing={<Image src="/paypal.svg" alt="" width={56} height={22} className="h-[20px] w-auto" />}
                />

                <OptionRow
                  name="paymentMethod"
                  value="zip"
                  checked={selectedPayment === "zip"}
                  onChange={choosePayment}
                  icon={<span className="text-[15px] font-bold">Z</span>}
                  title="Zip"
                  detail="Pay in 4 installments"
                  trailing={<Image src="/zip.svg" alt="" width={56} height={22} className="h-[20px] w-auto" />}
                />
              </div>
            </section>

            <div>
              <button type="submit" disabled={!canPay || isSubmitting} className="acc-btn acc-btn-primary w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" aria-hidden />
                    Processing
                  </>
                ) : (
                  <>
                    {totalPrice > 0 ? (
                      <span>
                        Pay <span className="acc-num">${totalPrice.toFixed(2)}</span>
                      </span>
                    ) : (
                      "Complete payment"
                    )}
                    <Lock size={16} strokeWidth={2.25} aria-hidden />
                  </>
                )}
              </button>
              <p className="acc-caption text-center mt-3">
                {!canPay &&
                  !isSubmitting &&
                  (selectedPayment === "card" ? "Choose a card to continue. " : "Only card payment works in this demo. ")}
                This is a demo store. You will never be charged.
              </p>
            </div>
          </form>

          <p className="acc-caption text-center">
            By completing this purchase you agree to our{" "}
            <a href="https://www.weaccelerate.com/terms" className="acc-link">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="https://www.weaccelerate.com/privacy" className="acc-link">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <aside className="lg:sticky lg:top-[104px] order-1 lg:order-2 acc-reveal acc-reveal-3">
          <section className="acc-card acc-summary !p-0 overflow-hidden" aria-labelledby="summary-toggle">
            <button
              id="summary-toggle"
              type="button"
              onClick={() => setIsOrderSummaryExpanded(!(isOrderSummaryExpanded ?? true))}
              aria-expanded={isOrderSummaryExpanded ?? undefined}
              className="w-full px-7 py-5 flex items-center justify-between gap-4 hover:bg-[var(--hover-wash)] transition-colors"
            >
              <span className="acc-h4">Order summary</span>
              <span className="flex items-center gap-3">
                {isOrderSummaryExpanded !== true && (
                  <span className={`acc-num text-[15px] acc-strong ${isOrderSummaryExpanded === null ? "lg:hidden" : ""}`}>
                    ${totalPrice.toFixed(2)}
                  </span>
                )}
                <ChevronDown
                  size={18}
                  className={`text-[var(--ink-4)] transition-transform duration-200 ${isOrderSummaryExpanded === null ? "lg:rotate-180" : isOrderSummaryExpanded ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </span>
            </button>
            {/* Always mounted; collapsing only hides it */}
            <div
              className={`px-7 pb-7 ${
                isOrderSummaryExpanded === null ? "hidden lg:block" : isOrderSummaryExpanded ? "" : "hidden"
              }`}
            >
              <CheckoutSummary selectedShipping={selectedShipping === "express"} shippingCost={shippingCost} hideHeading />
            </div>
          </section>
        </aside>
      </div>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("p2.onReady");
          window.accelerate.init({
            amount: stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            onLoginSuccess: (user) => {
              console.log("Accelerate user logged in", { user });
            },
            onCardSelected: (cardId) => {
              setSelectedCard(cardId);
            },
          });
          setAccelerateLoaded(true);
        }}
      />
    </Shell>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PaymentContent />
    </Suspense>
  );
}
