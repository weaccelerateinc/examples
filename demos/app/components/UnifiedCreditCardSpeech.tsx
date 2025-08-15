"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, CreditCard, Calendar, Lock } from "lucide-react";

interface UnifiedCreditCardSpeechProps {
  onCardNumberChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

type FieldType = "cardNumber" | "expiry" | "cvv" | "listening";

export function UnifiedCreditCardSpeech({ onCardNumberChange, onExpiryChange, onCvvChange }: UnifiedCreditCardSpeechProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentField, setCurrentField] = useState<FieldType>("listening");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      setCurrentField("listening");
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
          setError(err instanceof Error ? err.message : "Failed to process audio");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      setError("Failed to access microphone");
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

    if (data.text) {
      processTranscript(data.text);
    } else {
      throw new Error("No transcript received");
    }
  };

  const processTranscript = (transcript: string) => {
    console.log("Processing transcript:", transcript);

    // Extract all digits from the transcript
    const allDigits = transcript.replace(/\D/g, "");
    console.log("All digits extracted:", allDigits);

    // More flexible parsing: look for patterns
    let cardNumberDigits = "";
    let expiryDigits = "";
    let cvvDigits = "";

    // Try to find card number (13-16 digits)
    if (allDigits.length >= 13) {
      // Look for a sequence of 13-16 digits
      const cardMatch = allDigits.match(/(\d{13,16})/);
      if (cardMatch) {
        cardNumberDigits = cardMatch[1];
        console.log("Found card number:", cardNumberDigits);
      }
    }

    // Try to find expiry (4 digits, typically after card number)
    const remainingDigits = allDigits.replace(cardNumberDigits, "");
    console.log("Remaining digits after card number:", remainingDigits);

    if (remainingDigits.length >= 4) {
      expiryDigits = remainingDigits.slice(0, 4);
      console.log("Found expiry:", expiryDigits);
    } else {
      console.log("Not enough remaining digits for expiry. Need 4, got:", remainingDigits.length);
    }

    // Try to find CVV (3-4 digits, typically at the end)
    const cvvRemaining = remainingDigits.replace(expiryDigits, "");
    if (cvvRemaining.length >= 3) {
      cvvDigits = cvvRemaining.slice(0, 4);
      console.log("Found CVV:", cvvDigits);
    }

    console.log("Final parsed digits:", {
      cardNumber: cardNumberDigits,
      expiry: expiryDigits,
      cvv: cvvDigits,
      totalLength: allDigits.length,
    });

    // Process and update fields
    if (cardNumberDigits && cardNumberDigits.length >= 13) {
      const formattedCardNumber = cardNumberDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
      console.log("Setting card number:", formattedCardNumber);
      onCardNumberChange(formattedCardNumber);
      setCurrentField("cardNumber");
    }

    if (expiryDigits && expiryDigits.length === 4) {
      const formattedExpiry = expiryDigits.slice(0, 2) + "/" + expiryDigits.slice(2, 4);
      console.log("Setting expiry:", formattedExpiry);
      onExpiryChange(formattedExpiry);
      setCurrentField("expiry");
    } else {
      console.log("Expiry not set. Digits:", expiryDigits, "Length:", expiryDigits.length);
    }

    if (cvvDigits && cvvDigits.length >= 3) {
      const formattedCvv = cvvDigits.slice(0, 4);
      console.log("Setting CVV:", formattedCvv);
      onCvvChange(formattedCvv);
      setCurrentField("cvv");
    }

    // Reset current field after processing
    setTimeout(() => setCurrentField("listening"), 2000);
  };

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getFieldStatus = (fieldType: FieldType) => {
    if (currentField === fieldType) {
      return "bg-blue-100 border-blue-500 text-blue-700";
    }
    return "bg-gray-50 border-gray-200 text-gray-600";
  };

  return (
    <div className="space-y-4">
      {/* Speech Control */}
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
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        <div className="text-center">
          <div className="font-medium">
            {isListening ? "Listening..." : isProcessing ? "Processing..." : "Click to speak"}
          </div>
          <div className="text-sm text-gray-500">
            First the credit card number: "1234 5678 9012 3456"
            <br />
            Followed by exp (you do not say exp, just say the number)
            <br />
            Followed by cvv (you do not need to say cvv, just the number)
          </div>
        </div>
      </div>

      {/* Field Status Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${getFieldStatus("cardNumber")}`}>
          <CreditCard className="w-4 h-4" />
          <div className="text-sm font-medium">Card Number</div>
          {currentField === "cardNumber" && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${getFieldStatus("expiry")}`}>
          <Calendar className="w-4 h-4" />
          <div className="text-sm font-medium">Expiry</div>
          {currentField === "expiry" && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${getFieldStatus("cvv")}`}>
          <Lock className="w-4 h-4" />
          <div className="text-sm font-medium">CVV</div>
          {currentField === "cvv" && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="text-sm text-red-500 text-center">{error}</div>}
    </div>
  );
}
