/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { GoogleGenAI, Session } from "@google/genai";
import { createPCMAudioProcessor, checkAudioSupport } from "../utils/audioUtils";
import {
  VoiceProviderCallbacks,
  FieldType,
  CARD_EXTRACTION_SYSTEM_PROMPT,
  parseStreamingJson,
  resetStreamingParser,
} from "../utils/voiceProviders";

interface GeminiStreamingSpeechProps extends VoiceProviderCallbacks {
  modelName?: string;
}

// Default model name for Live API (supports bidiGenerateContent)
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-native-audio-latest";

export function GeminiStreamingSpeech({
  onCardNumberChange,
  onExpiryChange,
  onCvvChange,
  onCurrentFieldChange,
  onActiveFieldChange,
  modelName = DEFAULT_GEMINI_MODEL,
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
  const [activeField, setActiveField] = useState<FieldType | null>(null);
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

      console.log("🔗 Fetching Gemini token from backend...");

      // Fetch token from our backend (keeps API key secure)
      const tokenResponse = await fetch("/api/voice/gemini-token", {
        method: "POST",
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || "Failed to get Gemini token");
      }

      const { token, isApiKey } = await tokenResponse.json();
      if (!token) {
        throw new Error("No token received from server");
      }

      console.log("🔗 Connecting to Gemini Live API...", { isApiKey, model: modelName });

      // Initialize GoogleGenAI client with token or API key
      // If isApiKey is true, this is a fallback using the API key directly
      const genai = new GoogleGenAI(
        isApiKey ? { apiKey: token } : { apiKey: token } // SDK uses apiKey for both cases currently
      );

      // Connect to Live API using the provided model name
      // Native audio models require AUDIO in responseModalities
      const isNativeAudioModel = modelName.includes("native-audio");
      const liveSession = await genai.live.connect({
        model: modelName,
        config: {
          responseModalities: isNativeAudioModel ? ["AUDIO" as any, "TEXT" as any] : ["TEXT" as any],
          systemInstruction: {
            parts: [
              {
                text: CARD_EXTRACTION_SYSTEM_PROMPT + (isNativeAudioModel 
                  ? "\n\nIMPORTANT: Respond ONLY with the JSON object. Do not speak or add any audio narration. Just output the raw JSON text."
                  : ""),
              },
            ],
          },
          // For native audio models, configure speech settings
          ...(isNativeAudioModel && {
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Puck", // Use a preset voice
                },
              },
            },
          }),
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

            // Extract text from various response structures
            let text: string | null = null;
            
            // Check standard structure
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                  text = part.text;
                  break;
                }
              }
            }
            
            // Check for transcript in audio responses
            if (!text && message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.mimeType?.startsWith("audio/")) {
                  // Audio data - check for accompanying transcript
                  console.log("🔊 Audio data received, looking for transcript...");
                }
              }
            }

            if (text) {
              console.log("🔍 Processing text:", text);
              const jres = parseStreamingJson(text);
              
              // Update field status and notify parent component
              if (jres?.card_number) {
                onCardNumberChange(jres.card_number.toString());
                setFieldsStatus(prev => ({ ...prev, cardNumber: true }));
                setActiveField("cardNumber");
                onCurrentFieldChange("cardNumber");
                onActiveFieldChange?.("cardNumber");
              }
              if (jres?.expiry) {
                onExpiryChange(jres.expiry.toString());
                setFieldsStatus(prev => ({ ...prev, expiry: true }));
                setActiveField("expiry");
                onCurrentFieldChange("expiry");
                onActiveFieldChange?.("expiry");
              }
              if (jres?.cvv) {
                onCvvChange(jres.cvv.toString());
                setFieldsStatus(prev => ({ ...prev, cvv: true }));
                setActiveField("cvv");
                onCurrentFieldChange("cvv");
                onActiveFieldChange?.("cvv");
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
  }, [isListening, onCardNumberChange, onCvvChange, onExpiryChange, modelName]);

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
          //   text: formState,
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
      resetStreamingParser();
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
      setActiveField("listening");
      onActiveFieldChange?.("listening");

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
    <div className="space-y-2">
      {/* Live API Speech Control */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={isConnecting}
        className={`w-full flex items-center justify-center gap-3 p-3 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 rounded-lg border border-blue-200/50 shadow-sm transition-all hover:shadow-md ${
          isConnecting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        title={isListening ? "Stop listening" : isConnecting ? "Connecting..." : "Start Live API listening"}
      >
        <div
          className={`p-2.5 rounded-full transition-all ${
            isListening
              ? "bg-red-500 text-white shadow-lg animate-pulse"
              : isConnecting
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-blue-600 text-white shadow-lg"
          }`}
        >
          {isConnecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </div>

        <div className="text-center flex-1">
          <div className="font-medium text-sm">
            {isConnecting
              ? "🔗 Connecting to Live API..."
              : isListening
              ? "🎤 Listening with Live API..."
              : fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv
              ? "🎉 All Complete!"
              : "Click to start voice input with Accelerate Voice AI."}
          </div>
          <div className="text-xs text-gray-500">
            {isConnecting ? (
              "Establishing real-time connection..."
            ) : isListening ? (
              <>
                <div className="mb-1">
                  {fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv
                    ? "Perfect! All fields captured with Live API!"
                    : "Keep speaking your card details - Live API is listening in real-time!"}
                </div>
                <div className="text-xs flex items-center justify-center gap-2">
                  <span className="flex items-center gap-1">
                    {activeField === "cardNumber" ? (
                      <span className="text-green-500 animate-pulse">🟢</span>
                    ) : fieldsStatus.cardNumber ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-gray-400">⏳</span>
                    )}
                    <span className={activeField === "cardNumber" ? "text-green-600 font-medium" : ""}>Card</span>
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="flex items-center gap-1">
                    {activeField === "expiry" ? (
                      <span className="text-green-500 animate-pulse">🟢</span>
                    ) : fieldsStatus.expiry ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-gray-400">⏳</span>
                    )}
                    <span className={activeField === "expiry" ? "text-green-600 font-medium" : ""}>Expiry</span>
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="flex items-center gap-1">
                    {activeField === "cvv" ? (
                      <span className="text-green-500 animate-pulse">🟢</span>
                    ) : fieldsStatus.cvv ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-gray-400">⏳</span>
                    )}
                    <span className={activeField === "cvv" ? "text-green-600 font-medium" : ""}>CVV</span>
                  </span>
                </div>
                {currentTranscript && (
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded mt-1 inline-block">
                    &ldquo;{currentTranscript}&rdquo;
                  </span>
                )}
              </>
            ) : fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv ? (
              "All card details captured successfully with Live API!"
            ) : (
              ""
            )}
          </div>
        </div>
      </button>

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
