"use client";

import { useState } from "react";
import { StreamingSpeechRecognition } from "../components/StreamingSpeechRecognition";

export default function SpeechTestPage() {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [currentField, setCurrentField] = useState<"cardNumber" | "expiry" | "cvv" | "listening">("listening");

  const handleCardNumberChange = (value: string) => {
    console.log("📄 Card Number Changed:", value);
    setCardNumber(value);
  };

  const handleExpiryChange = (value: string) => {
    console.log("📅 Expiry Changed:", value);
    setExpiry(value);
  };

  const handleCvvChange = (value: string) => {
    console.log("🔒 CVV Changed:", value);
    setCvv(value);
  };

  const handleCurrentFieldChange = (field: "cardNumber" | "expiry" | "cvv" | "listening") => {
    console.log("🎯 Current Field Changed:", field);
    setCurrentField(field);
  };

  const clearAll = () => {
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCurrentField("listening");
    console.log("🧹 Cleared all fields");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">🎤 Speech Recognition Test Harness</h1>

        <div className="mb-8">
          <p className="text-gray-600 text-center mb-4">
            Test the speech recognition component in isolation.
            <br />
            Open browser console to see detailed logs.
          </p>

          <div className="text-center">
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Clear All Fields
            </button>
          </div>
        </div>

        {/* Speech Recognition Component */}
        <div className="border-2 border-blue-200 rounded-lg p-6 mb-8">
          <StreamingSpeechRecognition
            onCardNumberChange={handleCardNumberChange}
            onExpiryChange={handleExpiryChange}
            onCvvChange={handleCvvChange}
            onCurrentFieldChange={handleCurrentFieldChange}
          />
        </div>

        {/* Results Display */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Captured Data:</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="font-medium text-blue-800">Card Number</div>
              <div className="text-lg font-mono mt-2 text-blue-600">{cardNumber || "Not captured"}</div>
              <div className="text-xs text-blue-500 mt-1">Length: {cardNumber.replace(/\s/g, "").length} digits</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="font-medium text-green-800">Expiry</div>
              <div className="text-lg font-mono mt-2 text-green-600">{expiry || "Not captured"}</div>
              <div className="text-xs text-green-500 mt-1">Raw length: {expiry.replace(/\D/g, "").length} digits</div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="font-medium text-purple-800">CVV</div>
              <div className="text-lg font-mono mt-2 text-purple-600">{cvv || "Not captured"}</div>
              <div className="text-xs text-purple-500 mt-1">Length: {cvv.length} digits</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-800">Current Field</div>
            <div className="text-lg mt-2 text-gray-600">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  currentField === "listening"
                    ? "bg-blue-100 text-blue-800"
                    : currentField === "cardNumber"
                    ? "bg-orange-100 text-orange-800"
                    : currentField === "expiry"
                    ? "bg-green-100 text-green-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {currentField}
              </span>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-800 text-green-400 rounded-lg p-4 font-mono text-sm">
          <div className="font-bold mb-2">🐛 Debug Info:</div>
          <div>User Agent: {typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}</div>
          <div>Protocol: {typeof window !== "undefined" ? window.location.protocol : "N/A"}</div>
          <div>Host: {typeof window !== "undefined" ? window.location.host : "N/A"}</div>
          <div>
            Speech Recognition Support:{" "}
            {typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)
              ? "✅ Available"
              : "❌ Not Available"}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 mb-2">📋 Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
            <li>Open browser console (F12) to see detailed logs</li>
            <li>Click the microphone button to start speech recognition</li>
            <li>Allow microphone permissions when prompted</li>
            <li>Speak your credit card details: &quot;4111 1111 1111 1111 12 25 123&quot;</li>
            <li>Watch the console logs and field updates above</li>
            <li>Note any timing issues or errors in the console</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
