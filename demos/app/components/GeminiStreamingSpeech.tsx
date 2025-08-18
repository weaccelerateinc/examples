/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { GoogleGenAI, Session } from "@google/genai";
import { createPCMAudioProcessor, checkAudioSupport } from "../utils/audioUtils";

interface GeminiStreamingSpeechProps {
  onCardNumberChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  onCurrentFieldChange: (field: "cardNumber" | "expiry" | "cvv" | "listening") => void;
}

let accText = "";
const processTextStream = (incoming: string) => {
  accText += incoming;
  try {
    const response = JSON.parse(accText.replaceAll("```", "").replaceAll("json", ""));
    accText = "";
    return response as { card_number?: string; expiry?: string; cvv?: string };
  } catch {
    return null;
  }
};

export function GeminiStreamingSpeech({
  onCardNumberChange,
  onExpiryChange,
  onCvvChange,
  onCurrentFieldChange,
}: GeminiStreamingSpeechProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript] = useState("");
  const [fieldsStatus, setFieldsStatus] = useState({
    cardNumber: false,
    expiry: false,
    cvv: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const liveSessionRef = useRef<Session | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<{ audioContext: AudioContext; cleanup: () => void } | null>(null);
  // Ensure accumulatedDigitsRef is defined
  const accumulatedDigitsRef = useRef({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const stopListeningRef = useRef<(() => void) | null>(null);

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
                The audio portion will be the user's speech and the text portion you receive will be the current state of the card information. Return a JSON payload
                describing edits to this information that should be made given their speech.
                The payload should meet the spec { card_number?: string, expiry?: string, cvv?: string }.
                When the user is speaking their expiry they may say something like "August 27" which means 8/27. They will always say a month and a year so interpret their speech accordingly.
                They may also say something like "June 2028" which means 6/28. Always return the 2 digit year.`,
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
              const jres = processTextStream(text);
              if (jres?.card_number) {
                onCardNumberChange(jres.card_number.toString());
              }
              if (jres?.expiry) {
                onExpiryChange(jres.expiry.toString());
              }
              if (jres?.cvv) {
                onCvvChange(jres.cvv.toString());
              }
              console.log("🔍 Processing JSON:", jres);
              //   const cardInfo = processCharacterStream(text);
              //   processGeminiTranscript(cardInfo);
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
  }, [isListening, onCardNumberChange, onCvvChange, onExpiryChange]);

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

        const formState = `cardNumber: ${accumulatedDigitsRef.current.cardNumber}, expiry: ${accumulatedDigitsRef.current.expiry}, cvv: ${accumulatedDigitsRef.current.cvv}`;
        // Send audio data via Live API using PCM format
        liveSessionRef.current.sendRealtimeInput({
          //   text: formState,
          audio: {
            data: base64Audio,
            mimeType: "audio/pcm;rate=16000",
          },
        });
        console.log(`${new Date().toLocaleTimeString()}: Sent audio to Live API with form state: ${formState}`);
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
