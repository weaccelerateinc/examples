import { useState, useEffect } from "react";
import Image from "next/image";
import { AccelerateUser, AccelerateWindowAPI } from "accelerate-js-types";
import { stripeOptions } from "../options";
import Script from "next/script";
import { AccelerateWallet } from "../../components/AccelerateWallet";
import { useRouter } from "next/navigation";
import { useCheckout } from "./context/CheckoutContext";

interface AccelerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
}

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

export function AccelerateModal({ isOpen, onClose, subtotal }: AccelerateModalProps) {
  const router = useRouter();
  const { setCheckoutData } = useCheckout();
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showAccelWallet, setShowAccelWallet] = useState(false);
  const [accelLoaded, setAccelLoaded] = useState(false);
  const [addrLine1, setAddrLine1] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [step, setStep] = useState(1);

  const shippingCost = selectedShipping === "priority" ? 9.99 : 0;
  const total = subtotal + shippingCost;

  // Function to format phone numbers
  const tryFormatPhone = (pn: string): string => {
    const cleanedNumber = pn.replace(/\D/g, "");
    if (!cleanedNumber.match(/^(1?\d{10})$/)) {
      return pn;
    }
    const last10 = cleanedNumber.slice(-10);
    return `${last10.slice(0, 3)}-${last10.slice(3, 6)}-${last10.slice(6)}`;
  };

  // Function to update shipping address from Accelerate user data
  const maybeUseAccelUser = (user: AccelerateUser) => {
    console.log("maybeUseAccelUser called with user data:", user);

    if (user?.addresses?.[0]) {
      const address = user.addresses[0];
      console.log("Found address in user data:", address);

      setAddrLine1(address.line1 || "");
      setAddrCity(address.city || "");
      setAddrState(address.state || "");
      setAddrZip(address.postalCode || "");

      if (user.firstName) {
        console.log("Setting firstName:", user.firstName);
        setFirstName(user.firstName);
      }
      if (user.lastName) {
        console.log("Setting lastName:", user.lastName);
        setLastName(user.lastName);
      }
    } else {
      console.log("No address found in user data");
    }
  };

  // Function to handle Accelerate login
  const maybeLogin = (phoneValue: string) => {
    console.log("maybeLogin called with phone:", phoneValue);
    if (firstName === "" || lastName === "") {
      console.log("First name or last name is empty, skipping login");
      return;
    }

    if (email === "") {
      console.log("Email is empty, skipping login");
      return;
    }

    const cleanedPhone = phoneValue.replace(/\D/g, "");
    const phoneRegex = /^(1\d{10}|[2-9]\d{9})$/;
    if (!phoneRegex.test(cleanedPhone)) {
      console.log("Invalid phone number format");
      return;
    }

    const finalPhone = cleanedPhone.slice(-10);
    console.log("Calling accelerate.login with:", { firstName, lastName, phoneNumber: finalPhone });
    window.accelerate.login({
      firstName,
      lastName,
      phoneNumber: finalPhone,
      email,
    });
  };

  // Initialize Accelerate when component mounts
  useEffect(() => {
    if (!accelLoaded && isOpen && typeof window.accelerate !== "undefined") {
      console.log("Initializing Accelerate...");
      try {
        window.accelerate.init({
          amount: stripeOptions.amount,
          merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
          checkoutFlow: "Inline",
          checkoutMode: "StripeToken",
          onLoginSuccess: (user) => {
            console.log("Login success, user:", user);
            setShowAccelWallet(true);
            maybeUseAccelUser(user);
            setStep(2);
          },
          onCardSelected: async (cardId) => {
            setSelectedCard(cardId);
          },
        });
        setAccelLoaded(true);
      } catch (error) {
        console.error("Error initializing Accelerate:", error);
      }
    }
  }, [accelLoaded, isOpen, firstName, lastName]);

  // Monitor state changes
  useEffect(() => {
    console.log("Current address state:", {
      line1: addrLine1,
      city: addrCity,
      state: addrState,
      zip: addrZip,
      firstName,
      lastName,
    });
  }, [addrLine1, addrCity, addrState, addrZip, firstName, lastName]);

  const handlePayment = async () => {
    if (selectedCard) {
      const card = await window.accelerate.requestSource(selectedCard);
      if ("status" in card) {
        console.log("Error", { card });
        return;
      }
      setCheckoutData({
        firstName,
        lastName,
        address: addrLine1,
        city: addrCity,
        state: addrState,
        zip: addrZip,
        shipping: selectedShipping,
        subtotal,
        cardLast4: card?.details?.mask || "****",
      });
    }
    router.push("/pdp/confirmation");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50">
      <Script
        crossOrigin="anonymous"
        type="module"
        src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
        strategy="afterInteractive"
        onReady={() => {
          console.log("Accelerate script loaded");
        }}
      />

      <div className="bg-white w-full max-w-md mt-8 rounded-t-xl flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="flex justify-end items-center p-4 border-b">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Step 1: Initial Information */}
            {step === 1 && (
              <div className="p-4 space-y-3">
                <div className="text-sm text-gray-600">ACCOUNT INFORMATION</div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => maybeLogin(phoneNumber)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => maybeLogin(phoneNumber)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(e) => {
                    const formatted = tryFormatPhone(e.target.value);
                    setPhoneNumber(formatted);
                    maybeLogin(formatted);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}

            {/* Step 2: Rest of the form */}
            {step === 2 && (
              <>
                {/* Shipping Information Section */}
                <div className="border-t">
                  <div className="p-4">
                    <div className="text-sm text-gray-600 mb-4">SHIPPING INFORMATION</div>
                    <div className="space-y-3.5">
                      <input
                        placeholder="Address"
                        value={addrLine1}
                        onChange={(e) => setAddrLine1(e.target.value)}
                        className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                      <input
                        placeholder="Apartments, suite, etc (optional)"
                        className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                        <input
                          placeholder="City"
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                          className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        <input
                          placeholder="State"
                          value={addrState}
                          onChange={(e) => setAddrState(e.target.value)}
                          className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        <input
                          placeholder="Zip code"
                          value={addrZip}
                          onChange={(e) => setAddrZip(e.target.value)}
                          className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Method Section */}
                <div className="border-t">
                  <div className="p-4">
                    <div className="text-sm text-gray-600 mb-2">METHOD</div>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 border-b">
                        <input
                          type="radio"
                          name="shipping"
                          value="standard"
                          checked={selectedShipping === "standard"}
                          onChange={(e) => setSelectedShipping(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border ${
                              selectedShipping === "standard" ? "border-4 border-sky-700" : "border-gray-300"
                            }`}
                          />
                          <div>
                            <div className="font-medium">Standard Shipping</div>
                            <div className="text-sm text-gray-500">4-10 business days</div>
                          </div>
                        </div>
                        <span className="text-sm">Free</span>
                      </label>

                      <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="shipping"
                          value="priority"
                          checked={selectedShipping === "priority"}
                          onChange={(e) => setSelectedShipping(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border ${
                              selectedShipping === "priority" ? "border-4 border-sky-700" : "border-gray-300"
                            }`}
                          />
                          <div>
                            <div className="font-medium">Priority Shipping</div>
                            <div className="text-sm text-gray-500">2-3 business days</div>
                          </div>
                        </div>
                        <span className="text-sm">$9.99</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Card & Billing Section */}
                <div className="border-t">
                  <div className="p-4">
                    <div className="flex items-center justify-between sticky top-0 bg-white pb-4">
                      <div className="text-sm text-gray-600">CARD & BILLING</div>
                      <Image
                        src="/favicon-transparent-light.png"
                        alt="Icon"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    </div>
                    {accelLoaded && showAccelWallet && (
                      <div className="w-full">
                        <AccelerateWallet />
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="border-t">
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-medium pt-2 border-t">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pay Button - Fixed */}
        <div className="p-4 border-t mt-auto">
          {step === 2 ? (
            <button
              onClick={handlePayment}
              className="w-full bg-black text-white rounded-full py-4 flex items-center justify-center gap-2"
            >
              <Image src="/favicon-transparent-light.png" alt="Icon" width={24} height={24} className="rounded-full" />
              Pay with Accelerate
            </button>
          ) : (
            <button
              onClick={() => maybeLogin(phoneNumber)}
              disabled={!firstName || !lastName || !phoneNumber || !email}
              className="w-full bg-black text-white rounded-full py-4 flex items-center justify-center gap-2 disabled:bg-gray-300"
            >
              Continue with Accelerate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
