"use client";

import { FormEvent, useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { stripeOptions } from "../../options";
import type { AccelerateWindowAPI } from "accelerate-js-types";
import { CheckoutSummary } from "./CheckoutSummary";
import Image from "next/image";
import { AccelerateWallet } from "../../../components/AccelerateWallet";

declare global {
  interface Window {
    accelerate: AccelerateWindowAPI;
  }
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [address, setAddress] = useState(searchParams.get("address") || "");
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
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCvv, setNewCardCvv] = useState("");

  // Speech-to-text state
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Debug logging for state changes
  const handleCardNumberChange = (value: string) => {
    console.log("Payment page - Setting card number:", value);
    setNewCardNumber(value);
  };

  const handleCardExpiryChange = (value: string) => {
    console.log("Payment page - Setting card expiry:", value);
    setNewCardExpiry(value);
    console.log("Payment page - State after setting expiry:", { newCardExpiry: value });
  };

  const handleCardCvvChange = (value: string) => {
    console.log("Payment page - Setting card CVV:", value);
    setNewCardCvv(value);
  };

  // Speech-to-text functions
  const startRecording = async () => {
    try {
      setSpeechError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          await sendAudioToGemini(audioBlob);
        } catch (err) {
          setSpeechError(err instanceof Error ? err.message : "Failed to process audio");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      setSpeechError("Failed to access microphone");
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsListening(false);
    }
  };

  const sendAudioToGemini = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await fetch("/api/speech-to-text", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("Gemini API response:", data);

    if (data.text) {
      console.log("Processing transcript:", data.text);
      processTranscript(data.text);
    } else {
      throw new Error("No transcript received");
    }
  };

  const processTranscript = (transcript: string) => {
    console.log("Processing transcript:", transcript);

    const words = transcript.toLowerCase().split(/\s+/);
    let currentField = "";
    let cardNumberDigits = "";
    let expiryDigits = "";
    let cvvDigits = "";

    // Enhanced number mapping with more variations and error handling
    const numberMap: { [key: string]: string } = {
      // Single digits
      zero: "0",
      one: "1",
      two: "2",
      three: "3",
      four: "4",
      five: "5",
      six: "6",
      seven: "7",
      eight: "8",
      nine: "9",
      // Teens
      ten: "10",
      eleven: "11",
      twelve: "12",
      thirteen: "13",
      fourteen: "14",
      fifteen: "15",
      sixteen: "16",
      seventeen: "17",
      eighteen: "18",
      nineteen: "19",
      // Twenties
      twenty: "20",
      "twenty-one": "21",
      "twenty-two": "22",
      "twenty-three": "23",
      "twenty-four": "24",
      "twenty-five": "25",
      "twenty-six": "26",
      "twenty-seven": "27",
      "twenty-eight": "28",
      "twenty-nine": "29",
      // Thirties
      thirty: "30",
      "thirty-one": "31",
      // Common variations and mistakes
      oh: "0",
      o: "0",
      double: "",
      triple: "",
      // Handle "twenty five" vs "twenty-five"
      "twenty five": "25",
      "twenty six": "26",
      "twenty seven": "27",
      "twenty eight": "28",
      "twenty nine": "29",
      "thirty one": "31",
    };

    // Process each word to detect field commands and numbers
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Skip filler words and corrections
      if (["um", "uh", "ah", "er", "like", "you", "know", "so", "well", "actually", "basically"].includes(word)) {
        continue;
      }

      // Handle corrections and restarts
      if (["no", "wait", "stop", "cancel", "wrong", "mistake", "correction"].includes(word)) {
        // Reset current field to allow correction
        currentField = "";
        console.log("Detected correction, resetting field");
        continue;
      }

      // Enhanced field detection with more variations
      if (word.includes("card") || word.includes("number") || word.includes("credit") || word.includes("account")) {
        currentField = "cardNumber";
        console.log("Detected card number field");
        continue;
      }

      if (
        word.includes("exp") ||
        word.includes("expiry") ||
        word.includes("date") ||
        word.includes("expiration") ||
        word.includes("month")
      ) {
        currentField = "expiry";
        console.log("Detected expiry field");
        continue;
      }

      if (
        word.includes("cvv") ||
        word.includes("cvc") ||
        word.includes("code") ||
        word.includes("security") ||
        word.includes("verification")
      ) {
        currentField = "cvv";
        console.log("Detected CVV field");
        continue;
      }

      // Extract digits from the word with enhanced error handling
      let digits = "";

      // First try to extract direct digits
      const directDigits = word.replace(/\D/g, "");
      if (directDigits.length > 0) {
        digits = directDigits;
      } else {
        // Try exact match first
        if (numberMap[word]) {
          digits = numberMap[word];
        } else {
          // Try partial matches for common mistakes
          for (const [spoken, digit] of Object.entries(numberMap)) {
            if (spoken.includes(word) || word.includes(spoken)) {
              digits = digit;
              break;
            }
          }
        }
      }

      // Apply digits to the current field with validation
      if (digits && currentField) {
        switch (currentField) {
          case "cardNumber":
            // Validate card number length and format
            if (cardNumberDigits.length < 16) {
              cardNumberDigits += digits;
              console.log("Added to card number:", digits, "Total:", cardNumberDigits);
            }
            break;
          case "expiry":
            // Validate expiry format (MM/YY)
            if (expiryDigits.length < 4) {
              expiryDigits += digits;
              console.log("Added to expiry:", digits, "Total:", expiryDigits);
            }
            break;
          case "cvv":
            // Validate CVV length (3-4 digits)
            if (cvvDigits.length < 4) {
              cvvDigits += digits;
              console.log("Added to CVV:", digits, "Total:", cvvDigits);
            }
            break;
        }
      }
    }

    console.log("Final parsed digits:", {
      cardNumber: cardNumberDigits,
      expiry: expiryDigits,
      cvv: cvvDigits,
    });

    // Enhanced field validation and updates
    console.log("About to update fields with:", { cardNumberDigits, expiryDigits, cvvDigits });

    // Card number validation and formatting
    if (cardNumberDigits && cardNumberDigits.length >= 13) {
      const formattedCardNumber = cardNumberDigits.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
      console.log("Setting card number:", formattedCardNumber);
      handleCardNumberChange(formattedCardNumber);
    } else if (cardNumberDigits && cardNumberDigits.length > 0) {
      // Partial card number - show what we have
      const formattedCardNumber = cardNumberDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
      console.log("Setting partial card number:", formattedCardNumber);
      handleCardNumberChange(formattedCardNumber);
    } else {
      console.log("Card number not set. Digits:", cardNumberDigits, "Length:", cardNumberDigits.length);
    }

    // Expiry validation and formatting
    if (expiryDigits && expiryDigits.length === 4) {
      const month = parseInt(expiryDigits.slice(0, 2));
      const year = parseInt(expiryDigits.slice(2, 4));

      // Validate month (1-12) and year (reasonable range)
      if (month >= 1 && month <= 12 && year >= 0 && year <= 99) {
        const formattedExpiry = expiryDigits.slice(0, 2) + "/" + expiryDigits.slice(2, 4);
        console.log("Setting expiry:", formattedExpiry);
        handleCardExpiryChange(formattedExpiry);
      } else {
        console.log("Invalid expiry format:", expiryDigits);
      }
    } else if (expiryDigits && expiryDigits.length === 2) {
      // Partial expiry - just month
      const formattedExpiry = expiryDigits + "/";
      console.log("Setting partial expiry:", formattedExpiry);
      handleCardExpiryChange(formattedExpiry);
    } else {
      console.log("Expiry not set. Digits:", expiryDigits, "Length:", expiryDigits.length);
    }

    // CVV validation and formatting
    if (cvvDigits && cvvDigits.length >= 3) {
      const formattedCvv = cvvDigits.slice(0, 4);
      console.log("Setting CVV:", formattedCvv);
      handleCardCvvChange(formattedCvv);
    } else if (cvvDigits && cvvDigits.length > 0) {
      // Partial CVV - show what we have
      console.log("Setting partial CVV:", cvvDigits);
      handleCardCvvChange(cvvDigits);
    } else {
      console.log("CVV not set. Digits:", cvvDigits, "Length:", cvvDigits.length);
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  console.log({
    selectedPayment,
    accelLoaded,
    newCardNumber,
    newCardExpiry,
    newCardCvv,
  });
  const handleSubmit = async (e: FormEvent) => {
    console.log("EVENT", e);
    e.preventDefault();

    if (selectedPayment === "card" && selectedCard) {
      const card = await window.accelerate.requestSource(selectedCard);
      if ("status" in card) {
        console.log("Error", { card });
        return;
      }
      console.log({ card: JSON.stringify(card) });
      router.push(
        `/integrated2/payment/confirmation?` +
          `firstName=${encodeURIComponent(firstName)}&` +
          `lastName=${encodeURIComponent(lastName)}&` +
          `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
          `address=${encodeURIComponent(address)}&` +
          `city=${encodeURIComponent(city)}&` +
          `state=${encodeURIComponent(state)}&` +
          `zip=${encodeURIComponent(zip)}&` +
          `shipping=${encodeURIComponent(selectedShipping)}&` +
          //`cardBrand=${encodeURIComponent(card?.details?.cardIssuer || "")}&` +
          `cardLast4=${encodeURIComponent(card?.details?.mask || "")}&` +
          `totalPrice=${encodeURIComponent(totalPrice)}`
      );
    } else if (selectedPayment === "newCard") {
      // Handle new credit card submission
      if (!newCardNumber || !newCardExpiry || !newCardCvv) {
        alert("Please fill in all credit card fields");
        return;
      }

      // Extract last 4 digits for display
      const last4 = newCardNumber.replace(/\D/g, "").slice(-4);

      router.push(
        `/integrated2/payment/confirmation?` +
          `firstName=${encodeURIComponent(firstName)}&` +
          `lastName=${encodeURIComponent(lastName)}&` +
          `${email ? `email=${encodeURIComponent(email)}&` : ""}` +
          `address=${encodeURIComponent(address)}&` +
          `city=${encodeURIComponent(city)}&` +
          `state=${encodeURIComponent(state)}&` +
          `zip=${encodeURIComponent(zip)}&` +
          `shipping=${encodeURIComponent(selectedShipping)}&` +
          `cardLast4=${encodeURIComponent(last4)}&` +
          `totalPrice=${encodeURIComponent(totalPrice)}`
      );
    } else {
      return;
    }
  };

  return (
    <div className="flex overflow-hidden flex-col bg-white">
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex gap-3 items-center">
              <span className="text-3xl font-black text-blue-500">
                <Image src="/baggslogo.svg" alt="Baggs Logo" width={30} height={30} />
              </span>
              <span className="text-2xl font-bold tracking-tighter text-stone-950">Baggs</span>
            </div>
            <Image src="/checkoutbag.svg" alt="Checkout Bag" className="h-6 w-6" width={30} height={30} />
          </div>
        </div>
      </header>

      <main className="flex flex-wrap md:flex-nowrap md:flex-row-reverse justify-center w-full max-w-7xl mx-auto">
        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[520px] md:border-l border-neutral-200">
          <CheckoutSummary
            selectedShipping={selectedShipping === "express"}
            shippingCost={shippingCost}
            onTotalChange={(total: number) => {
              setTotalPrice(total);
              return true;
            }}
          />
        </section>

        <section className="flex flex-col p-5 md:p-10 bg-white w-full md:w-[659px]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Shipping Information</h3>
              <div className="space-y-3.5">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  placeholder="Apartments, suite, etc (optional)"
                  className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <div className="flex flex-wrap gap-3.5">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="Zip code"
                    className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-4">Shipping Method</h3>
              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <label className="flex gap-3 p-3.5 border-b border-neutral-200">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="standard"
                    checked={selectedShipping === "standard"}
                    onChange={(e) => {
                      setSelectedShipping(e.target.value);
                      setShippingCost(0);
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-2 ${
                      selectedShipping === "standard" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Standard Shipping</div>
                    <div className="text-sm text-neutral-500">4-10 business days</div>
                  </div>
                  <div className="text-sm">FREE</div>
                </label>

                <label className="flex gap-3 p-3.5">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="express"
                    checked={selectedShipping === "express"}
                    onChange={(e) => {
                      setSelectedShipping(e.target.value);
                      setShippingCost(9.99);
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-2 ${
                      selectedShipping === "express" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Express Shipping</div>
                    <div className="text-sm text-neutral-500">2-5 business days</div>
                  </div>
                  <div className="text-sm">$9.99</div>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-1.5">Payment</h3>
              <p className="text-sm text-neutral-500 mb-3.5">All transactions are secure and encrypted</p>

              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <div className="p-3.5 border-b border-neutral-200">
                  <label className="flex gap-3 items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={selectedPayment === "card"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-[18px] h-[18px] rounded-full border-2 ${
                        selectedPayment === "card" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm">Credit card</div>
                    </div>
                    <div className="flex gap-2">
                      <Image src="/visa.svg" alt="Visa" className="h-[21px]" width={31} height={31} />
                      <Image src="/mastercard.svg" alt="Mastercard" className="h-[21px]" width={31} height={31} />
                      <Image src="/amex.svg" alt="Amex" className="h-[21px]" width={31} height={31} />
                    </div>
                  </label>
                  {selectedPayment === "card" && accelLoaded && (
                    <div className="mt-4 w-full">
                      <AccelerateWallet />
                    </div>
                  )}
                </div>

                <div className="p-3.5 border-b border-neutral-200">
                  <label className="flex gap-3 items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="newCard"
                      checked={selectedPayment === "newCard"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-[18px] h-[18px] rounded-full border-2 ${
                        selectedPayment === "newCard" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm">New Credit Card</div>
                    </div>
                  </label>
                  {selectedPayment === "newCard" && (
                    <div className="mt-4 space-y-4">
                      {/* Regular input fields */}
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Credit Card Number"
                          value={newCardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          className="w-full px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Exp"
                            value={newCardExpiry}
                            onChange={(e) => handleCardExpiryChange(e.target.value)}
                            className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                            onFocus={() => console.log("Expiry field focused, current value:", newCardExpiry)}
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            value={newCardCvv}
                            onChange={(e) => handleCardCvvChange(e.target.value)}
                            className="flex-1 px-3 py-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Unified Speech-to-Text Interface */}
                      <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <button
                          type="button"
                          onClick={toggleRecording}
                          disabled={isProcessing}
                          className={`p-4 rounded-full transition-all ${
                            isListening
                              ? "bg-red-500 text-white hover:bg-red-600 shadow-lg"
                              : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
                          } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                          title={isListening ? "Stop recording" : "Start recording all fields"}
                        >
                          {isProcessing ? (
                            <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          ) : isListening ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                              />
                            </svg>
                          )}
                        </button>

                        <div className="text-center">
                          <div className="font-medium">
                            {isListening ? "Listening..." : isProcessing ? "Processing..." : "Click to speak"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Say: &quot;Card number 1234 5678 9012 3456&quot;
                            <br />
                            Then: &quot;Exp twelve twenty-five&quot;
                            <br />
                            Then: &quot;CVV one two three&quot;
                            <br />
                            <span className="text-xs text-gray-400">
                              If you make a mistake, say &quot;no&quot; or &quot;wait&quot; then repeat
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Error Display */}
                      {speechError && <div className="text-sm text-red-500 text-center">{speechError}</div>}
                    </div>
                  )}
                </div>

                <label className="flex gap-3 p-3.5 border-b border-neutral-200">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={selectedPayment === "paypal"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-2 ${
                      selectedPayment === "paypal" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm">PayPal</div>
                  </div>
                  <Image src="/paypal.svg" alt="PayPal" className="h-[21px]" width={51} height={51} />
                </label>

                <label className="flex gap-3 p-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="zip"
                    checked={selectedPayment === "zip"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-2 ${
                      selectedPayment === "zip" ? "border-sky-700 bg-sky-700" : "border-neutral-200"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm">Zip - Pay in 4 installments</div>
                  </div>
                  <Image src="/zip.svg" alt="Zip" className="h-[21px]" width={51} height={51} />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                (selectedPayment === "card" && !selectedCard) ||
                (selectedPayment === "newCard" && (!newCardNumber || !newCardExpiry || !newCardCvv))
              }
              className="w-full h-[56px] text-xl font-semibold text-white bg-sky-700 disabled:bg-sky-700/50 rounded-md"
            >
              Pay now
            </button>
          </form>

          <footer className="flex flex-wrap gap-3.5 py-5 mt-8 text-sm text-sky-600 border-t border-neutral-200">
            <a href="https://www.weaccelerate.com/privacy" className="hover:underline">
              Privacy policy
            </a>
            <a href="https://www.weaccelerate.com/terms" className="hover:underline">
              Terms of service
            </a>
          </footer>
        </section>
      </main>

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
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
