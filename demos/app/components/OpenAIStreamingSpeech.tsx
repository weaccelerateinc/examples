/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { createPCMAudioProcessor, checkAudioSupport } from "../utils/audioUtils";
import {
  VoiceProviderCallbacks,
  FieldType,
  CARD_EXTRACTION_SYSTEM_PROMPT,
  parseStreamingJson,
  resetStreamingParser,
} from "../utils/voiceProviders";

interface OpenAIStreamingSpeechProps extends VoiceProviderCallbacks {}

// OpenAI Realtime model
const OPENAI_REALTIME_MODEL = "gpt-realtime";

export function OpenAIStreamingSpeech({
  onCardNumberChange,
  onExpiryChange,
  onCvvChange,
  onCurrentFieldChange,
  onActiveFieldChange,
}: OpenAIStreamingSpeechProps) {
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

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<{ audioContext: AudioContext; cleanup: () => void } | null>(null);
  const accumulatedDigitsRef = useRef({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  // Connect to OpenAI Realtime API via WebSocket
  const connectToRealtimeAPI = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      console.log("🔗 Fetching ephemeral token from backend...");

      // Fetch ephemeral token from our backend (keeps API key secure)
      const tokenResponse = await fetch("/api/voice/openai-token", {
        method: "POST",
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || "Failed to get ephemeral token");
      }

      const { token, model } = await tokenResponse.json();
      if (!token) {
        throw new Error("No token received from server");
      }

      console.log("🔗 Connecting to OpenAI Realtime API with ephemeral token...", {
        tokenLength: token?.length,
        tokenPreview: token?.substring(0, 20) + "...",
        model: model || OPENAI_REALTIME_MODEL,
      });

      // Connect via WebSocket using the ephemeral token
      // OpenAI Realtime API uses Authorization header via subprotocol
      const protocols = [
        "realtime",
        `openai-insecure-api-key.${token}`,
        "openai-beta.realtime-v1"
      ];
      console.log("WebSocket protocols:", protocols.map(p => p.length > 50 ? p.substring(0, 50) + "..." : p));
      
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${model || OPENAI_REALTIME_MODEL}`,
        protocols
      );

      ws.onopen = () => {
        console.log("✅ Connected to OpenAI Realtime API");
        
        // Configure session for audio input, text output only
        // Note: Removed input_audio_transcription - it may require separate quota
        const sessionConfig = {
          type: "session.update",
          session: {
            modalities: ["text"], // Text output only, no audio output
            instructions: CARD_EXTRACTION_SYSTEM_PROMPT,
            input_audio_format: "pcm16",
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        };
        
        ws.send(JSON.stringify(sessionConfig));
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log(`${new Date().toLocaleTimeString()}: OpenAI Realtime message:`, message.type);
          
          // Log full message for debugging response content
          if (message.type === "response.done" || message.type === "response.text.delta" || message.type === "response.audio_transcript.delta") {
            console.log("📝 Response content:", JSON.stringify(message, null, 2));
          }
          
          // Handle response text delta (streaming text)
          if (message.type === "response.text.delta") {
            const text = message.delta;
            console.log("🔍 Processing text delta:", text);
            const jres = parseStreamingJson(text);
            
            if (jres) {
              processJsonResponse(jres);
            }
          }
          
          // Handle response done with full output
          if (message.type === "response.done" && message.response?.output) {
            for (const output of message.response.output) {
              if (output.type === "message" && output.content) {
                for (const content of output.content) {
                  if (content.type === "text") {
                    console.log("🔍 Processing complete text:", content.text);
                    resetStreamingParser();
                    const jres = parseStreamingJson(content.text);
                    if (jres) {
                      processJsonResponse(jres);
                    }
                  }
                }
              }
            }
          }

          // Handle function call results if using tools
          if (message.type === "response.function_call_arguments.delta") {
            const text = message.delta;
            const jres = parseStreamingJson(text);
            if (jres) {
              processJsonResponse(jres);
            }
          }
          
          // Handle transcription failures - log full details
          if (message.type === "conversation.item.input_audio_transcription.failed") {
            console.error("❌ Transcription failed - full message:", JSON.stringify(message, null, 2));
          }

          // Handle errors
          if (message.type === "error") {
            console.error("❌ OpenAI Realtime API error:", message.error);
            console.error("❌ Full error message:", JSON.stringify(message, null, 2));
            setError(message.error?.message || "API error occurred");
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onerror = (event) => {
        console.error("❌ OpenAI WebSocket error:", event);
        setError("Failed to connect to OpenAI Realtime API");
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log("🔌 OpenAI WebSocket closed:", event.reason || event.code);
        setIsConnecting(false);
        if (isListening) {
          setError("Connection lost. Please try again.");
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("❌ Error connecting to OpenAI Realtime API:", error);
      setError(error instanceof Error ? error.message : "Failed to initialize OpenAI connection");
      setIsConnecting(false);
      wsRef.current = null;
    }
  }, [isListening]);

  // Process JSON response and update fields
  const processJsonResponse = useCallback((jres: { card_number?: string; expiry?: string; cvv?: string }) => {
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
    console.log("🔍 Processed JSON:", jres);
  }, [onCardNumberChange, onExpiryChange, onCvvChange, onCurrentFieldChange, onActiveFieldChange]);

  // Send PCM audio data to OpenAI Realtime API
  const sendPCMToRealtimeAPI = useCallback(
    (pcmBuffer: ArrayBuffer) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn("⚠️ WebSocket not ready, skipping audio");
        return;
      }

      try {
        // Convert PCM buffer to base64
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmBuffer)));

        // Send audio data via WebSocket
        wsRef.current.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio,
        }));
      } catch (error) {
        console.error("❌ Error sending audio to OpenAI:", error);
      }
    },
    []
  );

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError("Microphone not supported");
      return;
    }

    try {
      console.log("🎤 Starting OpenAI Realtime speech recognition");
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

      // Connect to Realtime API first
      await connectToRealtimeAPI();

      // Wait for WebSocket to be ready
      await new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve();
          } else if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            clearInterval(checkInterval);
            reject(new Error("WebSocket failed to connect"));
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("Connection timeout"));
        }, 10000);
      });

      // Request microphone access - OpenAI Realtime API expects 24kHz audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create PCM audio processor at 24kHz for OpenAI Realtime API
      console.log("🎵 Creating PCM audio processor for OpenAI (24kHz)");
      const audioProcessor = createPCMAudioProcessor(stream, sendPCMToRealtimeAPI, 24000);
      audioProcessorRef.current = audioProcessor;

      setIsListening(true);
      onCurrentFieldChange("listening");
      console.log("✅ OpenAI Realtime recording started");
    } catch (err) {
      console.error("❌ Error starting OpenAI Realtime recording:", err);
      setError(err instanceof Error ? err.message : "Failed to start speech recognition");
      setIsListening(false);
      setIsConnecting(false);
    }
  }, [isSupported, connectToRealtimeAPI, sendPCMToRealtimeAPI, onCurrentFieldChange, onActiveFieldChange]);

  const stopListening = useCallback(() => {
    console.log("🛑 Stopping OpenAI Realtime speech recognition");
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

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    onCurrentFieldChange("listening");
  }, [onCurrentFieldChange]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      console.log(`${new Date().toLocaleTimeString()}: Starting OpenAI Realtime speech recognition`);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    // Check audio support
    const supportCheck = checkAudioSupport();

    if (!supportCheck.isSupported) {
      setIsSupported(false);
      setError(supportCheck.error || "Audio not supported");
      return;
    }

    console.log("✅ OpenAI Realtime speech recognition initialized");

    return () => {
      // Cleanup on unmount
      if (audioProcessorRef.current) {
        audioProcessorRef.current.cleanup();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
        <p className="text-sm text-green-700">{error || "Voice input is not available."}</p>
        <p className="text-xs text-green-600 mt-2">
          💡 Use the manual input fields above or try the camera scan feature instead!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* OpenAI Realtime Speech Control */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={isConnecting}
        className={`w-full flex items-center justify-center gap-3 p-3 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-lg border border-green-200/50 shadow-sm transition-all hover:shadow-md ${
          isConnecting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        title={isListening ? "Stop listening" : isConnecting ? "Connecting..." : "Start OpenAI listening"}
      >
        <div
          className={`p-2.5 rounded-full transition-all ${
            isListening
              ? "bg-red-500 text-white shadow-lg animate-pulse"
              : isConnecting
              ? "bg-green-500 text-white shadow-lg"
              : "bg-green-600 text-white shadow-lg"
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
              ? "🔗 Connecting to OpenAI Realtime..."
              : isListening
              ? "🎤 Listening with OpenAI..."
              : fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv
              ? "🎉 All Complete!"
              : "Click to start voice input with OpenAI Realtime."}
          </div>
          <div className="text-xs text-gray-500">
            {isConnecting ? (
              "Establishing WebSocket connection..."
            ) : isListening ? (
              <>
                <div className="mb-1">
                  {fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv
                    ? "Perfect! All fields captured with OpenAI!"
                    : "Keep speaking your card details - OpenAI is listening!"}
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
              "All card details captured successfully with OpenAI!"
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
              className="px-4 py-2 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
