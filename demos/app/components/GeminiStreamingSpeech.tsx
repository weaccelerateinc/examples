/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { createPCMAudioProcessor, checkAudioSupport } from "../utils/audioUtils";

interface GeminiStreamingSpeechProps {
  onCardNumberChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  onCurrentFieldChange: (field: "cardNumber" | "expiry" | "cvv" | "listening") => void;
}

export function GeminiStreamingSpeech({
  onCardNumberChange,
  onExpiryChange,
  onCvvChange,
  onCurrentFieldChange,
}: GeminiStreamingSpeechProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [fieldsStatus, setFieldsStatus] = useState({
    cardNumber: false,
    expiry: false,
    cvv: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const liveSessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<{ audioContext: AudioContext; cleanup: () => void } | null>(null);
  // Ensure accumulatedDigitsRef is defined
  const accumulatedDigitsRef = useRef({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const currentFieldRef = useRef<"cardNumber" | "expiry" | "cvv" | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Process character stream from Gemini based on symbols
  const processCharacterStream = useCallback(
    (text: string) => {
      console.log("🔄 Processing character stream:", text);

      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // Check for field indicators
        if (char === "#") {
          // Switch to card number field
          currentFieldRef.current = "cardNumber";
          onCurrentFieldChange("cardNumber");
          console.log("🎯 Switched to card number field");
          continue;
        } else if (char === "$") {
          // Switch to expiry field
          currentFieldRef.current = "expiry";
          onCurrentFieldChange("expiry");
          console.log("🎯 Switched to expiry field");
          continue;
        } else if (char === "@") {
          // Switch to CVV field
          currentFieldRef.current = "cvv";
          onCurrentFieldChange("cvv");
          console.log("🎯 Switched to CVV field");
          continue;
        }

        // Process digits for the current field
        if (/\d/.test(char) && currentFieldRef.current) {
          const field = currentFieldRef.current;
          accumulatedDigitsRef.current[field] += char;

          // Update the appropriate field
          if (field === "cardNumber") {
            const formattedCardNumber = accumulatedDigitsRef.current.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
            onCardNumberChange(formattedCardNumber);
            setFieldsStatus((prev) => ({
              ...prev,
              cardNumber: accumulatedDigitsRef.current.cardNumber.length >= 13,
            }));
          } else if (field === "expiry") {
            let formattedExpiry = accumulatedDigitsRef.current.expiry;
            if (formattedExpiry.length === 2 && !formattedExpiry.includes("/")) {
              formattedExpiry = formattedExpiry.slice(0, 2) + "/" + formattedExpiry.slice(2);
            }
            onExpiryChange(formattedExpiry);
            setFieldsStatus((prev) => ({
              ...prev,
              expiry: accumulatedDigitsRef.current.expiry.length >= 4,
            }));
          } else if (field === "cvv") {
            onCvvChange(accumulatedDigitsRef.current.cvv);
            setFieldsStatus((prev) => ({
              ...prev,
              cvv: accumulatedDigitsRef.current.cvv.length >= 3,
            }));
          }

          console.log(`🔢 Added digit "${char}" to ${field}:`, accumulatedDigitsRef.current[field]);
        }
      }

      return {
        cardNumber: accumulatedDigitsRef.current.cardNumber,
        expiry: accumulatedDigitsRef.current.expiry,
        cvv: accumulatedDigitsRef.current.cvv,
      };
    },
    [onCardNumberChange, onExpiryChange, onCvvChange, onCurrentFieldChange]
  );

  const processGeminiTranscript = useCallback(
    (cardInfo) => {
      console.log("🎯 Processing Gemini response:", cardInfo);

      // Update card number if provided
      if (cardInfo.cardNumber) {
        console.log("💳 Gemini identified card number:", cardInfo.cardNumber);
        const formattedCardNumber = cardInfo.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
        onCardNumberChange(formattedCardNumber);
        onCurrentFieldChange("cardNumber");

        accumulatedDigitsRef.current.cardNumber = cardInfo.cardNumber;
        setFieldsStatus((prev) => ({
          ...prev,
          cardNumber: cardInfo.cardNumber.length >= 13,
        }));
      }

      // Update expiry if provided
      if (cardInfo.expiry) {
        console.log("📅 Gemini identified expiry:", cardInfo.expiry);
        const formattedExpiry =
          cardInfo.expiry.length >= 4 ? `${cardInfo.expiry.slice(0, 2)}/${cardInfo.expiry.slice(2)}` : cardInfo.expiry;
        onExpiryChange(formattedExpiry);
        onCurrentFieldChange("expiry");

        accumulatedDigitsRef.current.expiry = cardInfo.expiry;
        setFieldsStatus((prev) => ({
          ...prev,
          expiry: cardInfo.expiry.length >= 4,
        }));
      }

      // Update CVV if provided
      if (cardInfo.cvv) {
        console.log("🔒 Gemini identified CVV:", cardInfo.cvv);
        onCvvChange(cardInfo.cvv);
        onCurrentFieldChange("cvv");

        accumulatedDigitsRef.current.cvv = cardInfo.cvv;
        setFieldsStatus((prev) => ({
          ...prev,
          cvv: cardInfo.cvv.length >= 3,
        }));
      }

      // Check if all fields are completed
      const accumulated = accumulatedDigitsRef.current;
      const allComplete =
        accumulated.cardNumber.length >= 13 && accumulated.expiry.length >= 4 && accumulated.cvv.length >= 3;

      if (allComplete) {
        console.log("✅ All fields completed via Gemini intelligence - stopping recognition");
        setTimeout(() => {
          if (stopListeningRef.current) {
            stopListeningRef.current();
          }
        }, 1000);
      }
    },
    [onCardNumberChange, onExpiryChange, onCvvChange, onCurrentFieldChange]
  );

  // Connect to Gemini Live API via official client
  const connectToLiveAPI = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Google Gemini API key not configured");
      }

      console.log("🔗 Connecting to Gemini Live API...");

      // Initialize GoogleGenAI client
      const genai = new GoogleGenAI({
        apiKey: apiKey,
      });

      // Connect to Live API
      const liveSession = await genai.live.connect({
        model: "gemini-2.0-flash-live-001",
        config: {
          responseModalities: ["TEXT" as any],
          systemInstruction: {
            parts: [
              {
                text: `
                You are a credit card information extraction assistant.
                The user is going to speak their credit card number, expiry, and cvv.
                When the user begins to speak their card number emit the symbol #. When they begin to speak their expiry emit the symbol $. When they begin their cvv emit the symbol @.
                Return only these symbols and numbers.`,
              },
            ],
          },
        },
        callbacks: {
          onopen: () => {
            console.log("✅ Connected to Gemini Live API");
            setIsConnecting(false);
          },
          onmessage: (message: any) => {
            console.log(`${new Date().toLocaleTimeString()}: Raw Live API response:`, message);
            // Add detailed logging for LiveServerMessage
            console.log("📨 Detailed Live API response:", JSON.stringify(message, null, 2));

            // Check if the response contains the expected structure
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              const text = message.serverContent.modelTurn.parts[0].text;
              console.log("🔍 Processing text:", text);
              const cardInfo = processCharacterStream(text);
              processGeminiTranscript(cardInfo);
            } else {
              console.warn("⚠️ Unexpected response structure, missing 'parts':", message);
            }
          },
          onerror: (error: any) => {
            console.error("❌ Live API error:", error);
            setError("Failed to connect to Live API");
            setIsConnecting(false);
          },
          onclose: (event: any) => {
            console.log("🔌 Live API connection closed:", event.reason);
            setIsConnecting(false);
            if (isListening) {
              setError("Connection lost. Please try again.");
            }
          },
        },
      });

      liveSessionRef.current = liveSession;
      console.log("🔗 Live API session stored:", {
        sessionType: liveSession?.constructor?.name,
        hasSession: !!liveSession,
        hasSendMethod: typeof liveSession?.sendRealtimeInput === "function",
      });
    } catch (error) {
      console.error("❌ Error connecting to Live API:", error);
      setError("Failed to initialize Live API connection");
      setIsConnecting(false);
      liveSessionRef.current = null;
    }
  }, [processGeminiTranscript, isListening, processCharacterStream]);

  // Send PCM audio data to Live API
  const sendPCMToLiveAPI = useCallback(
    (pcmBuffer: ArrayBuffer) => {
      // Check if session is available
      if (!liveSessionRef.current) {
        console.warn("⚠️ Live API session not available, skipping audio");
        return;
      }

      try {
        // Convert PCM buffer to base64
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmBuffer)));

        // Send audio data via Live API using PCM format
        liveSessionRef.current.sendRealtimeInput({
          audio: {
            data: base64Audio,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      } catch (error) {
        console.error("❌ Error sending audio to Live API:", error);
        // Don't break the flow - just skip this chunk
      }
    },
    [] // No dependencies needed - just check the ref
  );

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError("Microphone not supported");
      return;
    }

    try {
      console.log("🎤 Starting Gemini Live API speech recognition");
      setError(null);

      // Reset accumulated data
      accumulatedDigitsRef.current = {
        cardNumber: "",
        expiry: "",
        cvv: "",
      };

      // Reset field status
      setFieldsStatus({
        cardNumber: false,
        expiry: false,
        cvv: false,
      });

      // Connect to Live API first
      await connectToLiveAPI();

      // Request microphone access with Live API requirements
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create PCM audio processor for direct audio capture
      console.log("🎵 Creating direct PCM audio processor");
      const audioProcessor = createPCMAudioProcessor(stream, sendPCMToLiveAPI);
      audioProcessorRef.current = audioProcessor;

      setIsListening(true);
      onCurrentFieldChange("listening");
      console.log("✅ Live API recording started with direct PCM processing:", {
        hasSession: !!liveSessionRef.current,
        sessionType: liveSessionRef.current?.constructor?.name,
        audioContextState: audioProcessor.audioContext.state,
      });
    } catch (err) {
      console.error("❌ Error starting Live API recording:", err);
      setError("Failed to start Live API speech recognition");
      setIsListening(false);
      setIsConnecting(false);
    }
  }, [isSupported, connectToLiveAPI, sendPCMToLiveAPI, onCurrentFieldChange]);

  const stopListening = useCallback(() => {
    console.log("🛑 Stopping Live API speech recognition");
    setIsListening(false);
    setIsConnecting(false);

    // Clean up audio processor
    if (audioProcessorRef.current) {
      audioProcessorRef.current.cleanup();
      audioProcessorRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close Live API session
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }

    onCurrentFieldChange("listening");
  }, [onCurrentFieldChange]);

  // Set ref for circular dependency handling
  stopListeningRef.current = stopListening;

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      console.log(`${new Date().toLocaleTimeString()}: Starting Live API speech recognition`);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    // Check audio support using utility function
    const supportCheck = checkAudioSupport();

    if (!supportCheck.isSupported) {
      setIsSupported(false);
      setError(supportCheck.error || "Audio not supported");
      return;
    }

    console.log("✅ Gemini Live API speech recognition initialized");

    return () => {
      // Cleanup on unmount
      if (audioProcessorRef.current) {
        audioProcessorRef.current.cleanup();
      }
      if (liveSessionRef.current) {
        liveSessionRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-sm text-blue-700">{error || "Voice input is not available."}</p>
        <p className="text-xs text-blue-600 mt-2">
          💡 Use the manual input fields above or try the camera scan feature instead!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live API Speech Control */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
        <button
          type="button"
          onClick={toggleListening}
          disabled={isConnecting}
          className={`p-4 rounded-full transition-all ${
            isListening
              ? "bg-red-500 text-white hover:bg-red-600 shadow-lg animate-pulse"
              : isConnecting
              ? "bg-blue-500 text-white shadow-lg cursor-not-allowed opacity-50"
              : "bg-green-500 text-white hover:bg-green-600 shadow-lg"
          }`}
          title={isListening ? "Stop listening" : isConnecting ? "Connecting..." : "Start Live API listening"}
        >
          {isConnecting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        <div className="text-center flex-1">
          <div className="font-medium">
            {isConnecting
              ? "🔗 Connecting to Live API..."
              : isListening
              ? "🎤 Listening with Live API..."
              : fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv
              ? "🎉 All Complete!"
              : "Click to start Live API voice input"}
          </div>
          <div className="text-sm text-gray-500">
            {isConnecting ? (
              "Establishing real-time connection..."
            ) : isListening ? (
              <>
                <div className="mb-1">
                  {fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv
                    ? "Perfect! All fields captured with Live API!"
                    : "Keep speaking your card details - Live API is listening in real-time!"}
                </div>
                <div className="text-xs">
                  Progress: {fieldsStatus.cardNumber ? "✅ Card" : "⏳ Card"}
                  {" → "}
                  {fieldsStatus.expiry ? "✅ Expiry" : "⏳ Expiry"}
                  {" → "}
                  {fieldsStatus.cvv ? "✅ CVV" : "⏳ CVV"}
                </div>
                {currentTranscript && (
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded mt-2 inline-block">
                    &ldquo;{currentTranscript}&rdquo;
                  </span>
                )}
              </>
            ) : fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv ? (
              "All card details captured successfully with Live API!"
            ) : (
              "🚀 Powered by Gemini Live API - ultra-low latency real-time speech: &lsquo;My card number is 4111 1111 1111 1111, expires 12/25, CVV 123&rsquo;"
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-500 text-center bg-red-50 p-3 rounded-lg">
          <div className="mb-2">{error}</div>
          {!isListening && !isConnecting && isSupported && (
            <button
              onClick={startListening}
              className="px-4 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
