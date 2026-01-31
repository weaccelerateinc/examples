"use client";

import { useState, useRef, useCallback } from "react";
import { VoiceProviderCallbacks, FieldType } from "../utils/voiceProviders";

type WhisperGPTSpeechProps = VoiceProviderCallbacks;

export default function WhisperGPTSpeech({
  onCardNumberChange,
  onExpiryChange,
  onCvvChange,
  onCurrentFieldChange,
}: WhisperGPTSpeechProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const addDebug = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo((prev) => [...prev.slice(-19), `${timestamp}: ${msg}`]);
    console.log(`${timestamp}: ${msg}`);
  }, []);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    addDebug(`📤 Sending ${(audioBlob.size / 1024).toFixed(1)}KB audio for processing...`);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/voice/transcribe-extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process audio");
      }

      const data = await response.json();
      addDebug(`📝 Transcript: "${data.transcript}"`);

      if (data.transcript) {
        setTranscript((prev) => prev + (prev ? " " : "") + data.transcript);
      }

      if (data.extraction) {
        addDebug(`🎯 Extraction: ${JSON.stringify(data.extraction)}`);
        
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
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      addDebug(`❌ Error: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [addDebug, onCardNumberChange, onExpiryChange, onCvvChange, onCurrentFieldChange]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      addDebug("🎤 Requesting microphone access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        addDebug("🛑 Recording stopped, processing...");
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 0) {
          await processAudio(audioBlob);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
      addDebug("✅ Recording started");
      onCurrentFieldChange("listening");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to access microphone";
      setError(errorMsg);
      addDebug(`❌ Error: ${errorMsg}`);
    }
  }, [addDebug, processAudio, onCurrentFieldChange]);

  const stopListening = useCallback(() => {
    addDebug("🛑 Stopping recording...");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
  }, [addDebug]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearAll = useCallback(() => {
    setTranscript("");
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
          🎤 Whisper + GPT-4o (Fallback)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Press and hold to speak, release to process
        </p>
      </div>

      {/* Main Control Button */}
      <div className="flex justify-center gap-4">
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`px-8 py-4 rounded-full font-semibold text-lg transition-all transform ${
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white scale-110 animate-pulse"
              : isProcessing
              ? "bg-yellow-500 text-white cursor-wait"
              : "bg-purple-500 hover:bg-purple-600 text-white hover:scale-105"
          }`}
        >
          {isListening ? "🔴 Stop Recording" : isProcessing ? "⏳ Processing..." : "🎤 Start Recording"}
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            Recording... Speak your card details
          </div>
        )}
        {isProcessing && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-spin"></span>
            Processing audio...
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
      {transcript && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Transcript:</div>
          <div className="text-gray-800">{transcript}</div>
        </div>
      )}

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
