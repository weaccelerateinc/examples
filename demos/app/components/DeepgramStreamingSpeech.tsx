"use client";

import { useState, useRef, useCallback } from "react";
import { VoiceProviderCallbacks, FieldType } from "../utils/voiceProviders";
import { createPCMAudioProcessor } from "../utils/audioUtils";

interface DeepgramStreamingSpeechProps extends VoiceProviderCallbacks {}

const CARD_EXTRACTION_SYSTEM_PROMPT = `Extract credit card information from the transcribed speech.
Return ONLY valid JSON in this exact format:
{
  "cardNumber": "extracted 16-digit card number or null",
  "expiry": "MM/YY format or null", 
  "cvv": "3-4 digit CVV or null",
  "currentField": "cardNumber" | "expiry" | "cvv" | "complete" | "unclear"
}

Rules:
- cardNumber: Extract digits only, ignore spaces/dashes. Must be 13-19 digits.
- expiry: Convert to MM/YY format (e.g., "January 2025" → "01/25", "August 27" → "08/27")
- cvv: 3-4 digits only
- Parse spoken numbers like "four one two three" as "4123"
- Only return JSON, no other text`;

export default function DeepgramStreamingSpeech({
  onCardNumberChange,
  onExpiryChange,
  onCvvChange,
  onCurrentFieldChange,
}: DeepgramStreamingSpeechProps) {
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addDebug = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo((prev) => [...prev.slice(-19), `${timestamp}: ${msg}`]);
    console.log(`${timestamp}: ${msg}`);
  }, []);

  // Extract card info using Gemini
  const extractCardInfo = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setIsExtracting(true);
    addDebug(`🔍 Extracting card info from: "${text}"`);

    try {
      const response = await fetch("/api/voice/extract-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        addDebug(`❌ API error: ${response.status} - ${errorData.error || 'Unknown'}`);
        throw new Error(errorData.error || "Extraction failed");
      }

      const data = await response.json();
      addDebug(`📦 API response: ${JSON.stringify(data)}`);
      
      if (data.extraction) {
        addDebug(`🎯 Extracted: ${JSON.stringify(data.extraction)}`);
        
        if (data.extraction.cardNumber) {
          onCardNumberChange(data.extraction.cardNumber);
        }
        if (data.extraction.expiry) {
          onExpiryChange(data.extraction.expiry);
        }
        if (data.extraction.cvv) {
          onCvvChange(data.extraction.cvv);
        }
        if (data.extraction.currentField) {
          onCurrentFieldChange(data.extraction.currentField as FieldType);
        }
      }
    } catch (err) {
      addDebug(`❌ Extraction error: ${err}`);
    } finally {
      setIsExtracting(false);
    }
  }, [addDebug, onCardNumberChange, onExpiryChange, onCvvChange, onCurrentFieldChange]);

  const connectToDeepgram = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      addDebug("🔑 Fetching Deepgram API key...");
      const keyResponse = await fetch("/api/voice/deepgram-key", { method: "POST" });
      
      if (!keyResponse.ok) {
        const errorData = await keyResponse.json();
        throw new Error(errorData.error || "Failed to get Deepgram key");
      }

      const { apiKey } = await keyResponse.json();
      if (!apiKey) {
        throw new Error("No API key received");
      }

      addDebug("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      addDebug("🔗 Connecting to Deepgram WebSocket...");
      
      // Deepgram WebSocket URL with parameters for raw PCM audio
      const wsUrl = new URL("wss://api.deepgram.com/v1/listen");
      wsUrl.searchParams.set("model", "nova-2");
      wsUrl.searchParams.set("language", "en");
      wsUrl.searchParams.set("smart_format", "true");
      wsUrl.searchParams.set("interim_results", "true");
      wsUrl.searchParams.set("utterance_end_ms", "1500");
      wsUrl.searchParams.set("vad_events", "true");
      wsUrl.searchParams.set("encoding", "linear16");
      wsUrl.searchParams.set("sample_rate", "16000");
      wsUrl.searchParams.set("channels", "1");

      const ws = new WebSocket(wsUrl.toString(), ["token", apiKey]);
      wsRef.current = ws;

      ws.onopen = () => {
        addDebug("✅ Connected to Deepgram");
        setIsConnecting(false);
        setIsListening(true);
        onCurrentFieldChange("listening");

        // Start sending raw PCM audio
        let chunkCount = 0;
        const { audioContext, cleanup } = createPCMAudioProcessor(
          stream,
          (pcmData) => {
            if (ws.readyState === WebSocket.OPEN) {
              chunkCount++;
              if (chunkCount <= 3 || chunkCount % 20 === 0) {
                addDebug(`📤 Sending PCM chunk ${chunkCount}: ${pcmData.byteLength} bytes`);
              }
              ws.send(pcmData);
            }
          },
          16000 // 16kHz sample rate for Deepgram
        );

        audioContextRef.current = audioContext;
        cleanupRef.current = cleanup;
        addDebug("🎙️ Recording started (PCM 16kHz)");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Deepgram message:", data.type, data);
          
          if (data.type === "Results") {
            // Deepgram structure: channel.alternatives[0].transcript
            const alternatives = data.channel?.alternatives || [];
            const transcript = alternatives[0]?.transcript || "";
            const isFinal = data.is_final;
            const confidence = alternatives[0]?.confidence || 0;
            
            console.log("📝 Deepgram Result details:", { 
              transcript, 
              isFinal, 
              confidence,
              alternativesCount: alternatives.length,
              rawChannel: data.channel 
            });
            
            addDebug(`📨 Result: "${transcript}" (final: ${isFinal}, conf: ${confidence.toFixed(2)})`);
            
            if (isFinal) {
              if (transcript) {
                addDebug(`📝 Final: "${transcript}"`);
                setTranscript((prev) => prev + (prev ? " " : "") + transcript);
                setInterimTranscript("");
                // Trigger extraction on final results
                extractCardInfo(transcript);
              }
            } else if (transcript) {
              setInterimTranscript(transcript);
            }
          } else if (data.type === "UtteranceEnd") {
            addDebug("🔇 Utterance end detected");
          } else if (data.type === "Metadata") {
            addDebug(`ℹ️ Deepgram ready: ${data.model_info?.name || "nova-2"}`);
          } else if (data.type === "Error") {
            addDebug(`❌ Deepgram error: ${data.message || JSON.stringify(data)}`);
          } else {
            addDebug(`📩 ${data.type}`);
          }
        } catch (err) {
          console.error("Error parsing Deepgram message:", err, event.data);
          addDebug(`❌ Parse error: ${err}`);
        }
      };

      ws.onerror = (event) => {
        addDebug(`❌ WebSocket error`);
        console.error("Deepgram WebSocket error:", event);
        setError("Connection error");
      };

      ws.onclose = (event) => {
        addDebug(`🔌 Disconnected (code: ${event.code})`);
        setIsListening(false);
        setIsConnecting(false);
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      addDebug(`❌ Error: ${errorMsg}`);
      setIsConnecting(false);
    }
  }, [addDebug, extractCardInfo, onCurrentFieldChange]);

  const disconnect = useCallback(() => {
    addDebug("🛑 Stopping...");

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
    
    // Auto-extract from accumulated transcript when stopping
    setTranscript((currentTranscript) => {
      if (currentTranscript.trim()) {
        addDebug(`🔄 Auto-extracting from: "${currentTranscript}"`);
        extractCardInfo(currentTranscript);
      }
      return currentTranscript;
    });
  }, [addDebug, extractCardInfo]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      disconnect();
    } else {
      connectToDeepgram();
    }
  }, [isListening, disconnect, connectToDeepgram]);

  const clearAll = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setDebugInfo([]);
    setError(null);
    onCardNumberChange("");
    onExpiryChange("");
    onCvvChange("");
    onCurrentFieldChange("idle");
  }, [onCardNumberChange, onExpiryChange, onCvvChange, onCurrentFieldChange]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          🎤 Deepgram + GPT-4o-mini
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Real-time streaming transcription with AI extraction
        </p>
      </div>

      {/* Main Control Button */}
      <div className="flex justify-center gap-4">
        <button
          onClick={toggleListening}
          disabled={isConnecting}
          className={`px-8 py-4 rounded-full font-semibold text-lg transition-all transform ${
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white scale-110 animate-pulse"
              : isConnecting
              ? "bg-yellow-500 text-white cursor-wait"
              : "bg-teal-500 hover:bg-teal-600 text-white hover:scale-105"
          }`}
        >
          {isListening ? "🔴 Stop" : isConnecting ? "⏳ Connecting..." : "🎤 Start Listening"}
        </button>

        <button
          onClick={clearAll}
          className="px-4 py-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Status */}
      <div className="text-center">
        {isListening && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full">
            <span className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></span>
            Listening... Speak your card details
          </div>
        )}
        {isExtracting && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full ml-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-spin"></span>
            Extracting...
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {/* Transcript Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[60px]">
        <div className="text-xs text-gray-500 mb-1">Live Transcript:</div>
        <div className="text-gray-800">
          {transcript}
          {interimTranscript && (
            <span className="text-gray-400 italic"> {interimTranscript}</span>
          )}
          {!transcript && !interimTranscript && (
            <span className="text-gray-400">Waiting for speech...</span>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs max-h-40 overflow-y-auto">
        <div className="text-gray-500 mb-1">Debug Log:</div>
        {debugInfo.length === 0 ? (
          <div className="text-gray-600">Waiting for activity...</div>
        ) : (
          debugInfo.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
