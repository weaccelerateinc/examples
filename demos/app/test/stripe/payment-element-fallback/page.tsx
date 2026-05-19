"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeElements, StripePaymentElement, StripePaymentElementOptions } from "@stripe/stripe-js";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { stripeOptions } from "../../../options";
import type { AccelerateUser, AccelerateWindowAPI } from "accelerate-js-types";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

type PaymentElementChangeEvent = {
  elementType?: string;
  empty?: boolean;
  complete?: boolean;
  collapsed?: boolean;
  value?: {
    type?: string;
  };
};

type CreateIntentResponse =
  | {
      status: "created";
      clientSecret: string;
      paymentIntentId: string;
      publishableKey: string;
    }
  | {
      status: "failed";
      message?: string;
    };

const DEFAULT_LINK_WAIT_MS = 3000;
const MIN_PHONE_DIGITS = 10;

function phoneDigits(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, "");
}

function isUsableEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

function summarizePaymentChangeEvent(event: PaymentElementChangeEvent) {
  return {
    elementType: event.elementType || "payment",
    empty: Boolean(event.empty),
    complete: Boolean(event.complete),
    collapsed: Boolean(event.collapsed),
    value: event.value ? { type: event.value.type } : null,
  };
}

export default function StripePaymentElementFallbackDemo() {
  const router = useRouter();

  const [phoneNumber, setPhone] = useState(
    typeof window !== "undefined" && window.location.protocol === "http:" ? "512-123-1111" : ""
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [cardId, setCardId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentElementMounted, setPaymentElementMounted] = useState(false);
  const [accelerateReady, setAccelerateReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Enter shopper details to mount Stripe.");
  const [errorMessage, setErrorMessage] = useState("");

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const mountStartedRef = useRef(false);
  const linkSeenRef = useRef(false);
  const fallbackStartedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accelerateReadyRef = useRef(false);
  const pendingAccelerateReasonRef = useRef<string | null>(null);
  const shopperDetailsRef = useRef({ firstName: "", lastName: "", phoneNumber: "", email: "" });

  const shopperReady =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isUsableEmail(email) &&
    phoneDigits(phoneNumber).length >= MIN_PHONE_DIGITS;

  const log = useCallback((label: string, data?: unknown) => {
    console.log(`[test/stripe/payment-element-fallback] ${label}`, data === undefined ? "" : data);
  }, []);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const startAccelerateOtp = useCallback(
    (reason: string) => {
      if (fallbackStartedRef.current) {
        log("accelerate fallback already started", { reason });
        return;
      }

      if (!accelerateReadyRef.current || typeof window.accelerate?.login !== "function") {
        pendingAccelerateReasonRef.current = reason;
        setStatusMessage("Accelerate fallback is pending until the SDK is ready.");
        log("accelerate fallback pending", { reason });
        return;
      }

      const shopperDetails = shopperDetailsRef.current;

      fallbackStartedRef.current = true;
      setStatusMessage("Stripe stayed on card; starting Accelerate OTP fallback.");
      log("accelerate login", { reason, ...shopperDetails });
      window.accelerate.login(shopperDetails);
    },
    [log]
  );

  const scheduleAccelerateFallback = useCallback(
    (reason: string) => {
      if (linkSeenRef.current || fallbackStartedRef.current || fallbackTimerRef.current) {
        log("accelerate fallback not scheduled", {
          reason,
          linkSeen: linkSeenRef.current,
          fallbackStarted: fallbackStartedRef.current,
          timerAlreadyScheduled: Boolean(fallbackTimerRef.current),
        });
        return;
      }

      setStatusMessage("Stripe reported card. Waiting 3 seconds for Link before starting Accelerate.");
      log("accelerate fallback scheduled", { reason, timeoutMs: DEFAULT_LINK_WAIT_MS });
      fallbackTimerRef.current = setTimeout(() => {
        fallbackTimerRef.current = null;
        if (linkSeenRef.current) {
          log("accelerate fallback canceled after timeout because Link was seen");
          return;
        }
        startAccelerateOtp("payment-element-card-timeout");
      }, DEFAULT_LINK_WAIT_MS);
    },
    [log, startAccelerateOtp]
  );

  const handlePaymentElementChange = useCallback(
    (event: PaymentElementChangeEvent) => {
      const summary = summarizePaymentChangeEvent(event);
      const valueType = summary.value?.type || "";

      log("payment: change", summary);

      if (valueType === "link") {
        linkSeenRef.current = true;
        clearFallbackTimer();
        setStatusMessage("Stripe reported Link. Leaving the shopper in Stripe's flow.");
        log("stripe link detected; accelerate fallback suppressed");
        return;
      }

      if (valueType === "card") {
        scheduleAccelerateFallback("payment-element-card-change");
      }
    },
    [clearFallbackTimer, log, scheduleAccelerateFallback]
  );

  const mountStripePaymentElement = useCallback(async () => {
    if (!shopperReady || mountStartedRef.current) {
      return;
    }

    mountStartedRef.current = true;
    setErrorMessage("");
    setStatusMessage("Creating PaymentIntent and mounting Stripe Payment Element.");
    log("mount requested", shopperDetailsRef.current);

    const intentResponse = await fetch("/api/stripe/payment-element-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shopperDetailsRef.current),
    });

    const intentData = (await intentResponse.json()) as CreateIntentResponse;
    if (!intentResponse.ok || intentData.status !== "created") {
      const message =
        intentData.status === "failed" ? intentData.message || "Unable to create PaymentIntent" : "Unable to create PaymentIntent";
      setErrorMessage(message);
      setStatusMessage("Stripe mount failed.");
      log("payment intent create failed", intentData);
      mountStartedRef.current = false;
      return;
    }

    setPaymentIntentId(intentData.paymentIntentId);

    const stripe = await loadStripe(intentData.publishableKey);
    if (!stripe) {
      setErrorMessage("Unable to load Stripe.js.");
      setStatusMessage("Stripe mount failed.");
      mountStartedRef.current = false;
      return;
    }

    const elements = stripe.elements({
      clientSecret: intentData.clientSecret,
      loader: "auto",
      appearance: {
        theme: "stripe",
      },
    });

    const { firstName, lastName, phoneNumber, email } = shopperDetailsRef.current;
    const paymentElementOptions = {
      defaultValues: {
        billingDetails: {
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone: phoneNumber,
        },
      },
      layout: {
        type: "tabs",
      },
      wallets: {
        applePay: "never",
        googlePay: "never",
        link: "auto",
      },
    } as StripePaymentElementOptions;

    const paymentElement = elements.create("payment", paymentElementOptions);

    paymentElement.on("ready", () => {
      setPaymentElementMounted(true);
      setStatusMessage("Stripe Payment Element mounted. Watching for card or Link.");
      log("payment: ready");
    });
    paymentElement.on("change", handlePaymentElementChange);
    paymentElement.on("loaderror", (event) => {
      setErrorMessage(event.error.message || "Stripe Payment Element failed to load.");
      setStatusMessage("Stripe Payment Element load failed.");
      log("payment: loaderror", event.error);
    });

    paymentElement.mount("#stripe-payment-element");

    stripeRef.current = stripe;
    elementsRef.current = elements;
    paymentElementRef.current = paymentElement;
  }, [handlePaymentElementChange, log, shopperReady]);

  useEffect(() => {
    shopperDetailsRef.current = { firstName, lastName, phoneNumber, email };
  }, [email, firstName, lastName, phoneNumber]);

  useEffect(() => {
    if (shopperReady) {
      void mountStripePaymentElement();
    }
  }, [mountStripePaymentElement, shopperReady]);

  useEffect(() => {
    return () => {
      clearFallbackTimer();
      paymentElementRef.current?.destroy();
    };
  }, [clearFallbackTimer]);

  useEffect(() => {
    accelerateReadyRef.current = accelerateReady;
    if (accelerateReady && pendingAccelerateReasonRef.current) {
      const reason = pendingAccelerateReasonRef.current;
      pendingAccelerateReasonRef.current = null;
      startAccelerateOtp(reason);
    }
  }, [accelerateReady, startAccelerateOtp]);

  const maybeUseAccelUser = (user: AccelerateUser) => {
    if (user) {
      window.accelerate.openWallet();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripeRef.current || !elementsRef.current) {
      setErrorMessage("Stripe Payment Element is not mounted yet.");
      return;
    }

    setErrorMessage("");
    setStatusMessage("Confirming Stripe payment.");
    const result = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      confirmParams: {
        return_url: `${window.location.origin}/completion?status=stripe-return`,
        payment_method_data: {
          billing_details: {
            name: `${firstName} ${lastName}`.trim(),
            email,
            phone: phoneNumber,
          },
        },
      },
      redirect: "if_required",
    });

    if (result.error) {
      setErrorMessage(result.error.message || "Stripe payment confirmation failed.");
      setStatusMessage("Stripe confirmation failed.");
      log("stripe confirm error", result.error);
      return;
    }

    log("stripe confirm result", result.paymentIntent);
    if (result.paymentIntent?.status === "succeeded") {
      router.push("/completion?status=succeeded");
      return;
    }

    setStatusMessage(`Stripe confirmation returned ${result.paymentIntent?.status || "no status"}.`);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <pre>{JSON.stringify(stripeOptions, null, 2)}</pre>

      <div style={{ border: "green 2px solid", width: "100%" }}>
        <div className="items-center gap-1 p-1">
          <div>Required Fields</div>
          <div className="flex flex-row gap-1">
            <input
              data-testid="first-name-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
            />
            <input
              data-testid="last-name-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
            />
          </div>
          <div className="flex flex-row gap-1">
            <input value={phoneNumber} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" type="tel" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
          </div>
        </div>
      </div>

      <div className="p-1">
        <div>Stripe Payment Element</div>
        {!shopperReady && <div>Enter first name, last name, email, and phone to mount Stripe.</div>}
        <div id="stripe-payment-element" />
      </div>

      <div id="payment-message" className="font-bold text-red-600">
        {errorMessage}
      </div>
      <div>{statusMessage}</div>
      <div>PaymentIntent: {paymentIntentId || "not created"}</div>

      <button disabled={!paymentElementMounted} id="submit" className="btn btn-blue disabled:bg-blue-400/50" type="submit">
        Confirm Stripe Payment
      </button>

      <div style={{ backgroundColor: "#F5F5F5" }} id="accelerate-wallet"></div>
      <div>CardId: {cardId}</div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={cardId == null}
          id="accelerate-submit"
          className="btn btn-blue disabled:bg-blue-400/50"
          onClick={async () => {
            if (!cardId) {
              return;
            }

            const src = await window.accelerate.requestSource(cardId);
            log("accelerate requestSource response", src);
            if ("status" in src) {
              setErrorMessage("Accelerate requestSource failed.");
              return;
            }

            const confirmIntent = await fetch("/api/stripe/confirm", {
              method: "POST",
              body: JSON.stringify({
                processorToken: src.processorToken,
                cartId: "some-cart",
              }),
            });
            const res = (await confirmIntent.json()) as { status: string; message?: string };
            if (res.status === "succeeded") {
              router.push("/completion?status=succeeded");
            } else {
              setErrorMessage(res.message || "Unknown error");
            }
          }}
        >
          <span id="button-text">Pay now</span>
        </button>
      </div>

      <button type="button" onClick={() => startAccelerateOtp("manual")}>
        Force Accelerate Start
      </button>

      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          const sdkMethods = ["init", "login", "checkPhone", "isLoggedIn", "openWallet", "requestSource", "logout"] as const;
          const methodAvailability = Object.fromEntries(
            sdkMethods.map((method) => [method, typeof window.accelerate?.[method] === "function"])
          );
          log("accelerate sdk ready", {
            script: process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT,
            methodAvailability,
          });

          window.accelerate.init({
            amount: stripeOptions.amount,
            merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
            checkoutFlow: "Inline",
            checkoutMode: "StripeToken",
            onLoginSuccess: (user) => {
              log("accelerate onLoginSuccess", user);
              maybeUseAccelUser(user);
            },
            onCardSelected: (id, details) => {
              log("accelerate onCardSelected", { cardId: id, details });
              setCardId(id);
            },
            onLogout: () => {
              log("accelerate onLogout");
            },
          });

          setAccelerateReady(true);
        }}
      />
    </form>
  );
}
