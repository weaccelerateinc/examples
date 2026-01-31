"use client";

import { useState, useEffect } from "react";
import { GeminiStreamingSpeech } from "../components/GeminiStreamingSpeech";
import { OpenAIStreamingSpeech } from "../components/OpenAIStreamingSpeech";
import WhisperGPTSpeech from "../components/WhisperGPTSpeech";
import DeepgramStreamingSpeech from "../components/DeepgramStreamingSpeech";
import { VOICE_PROVIDERS, VoiceProviderType, FieldType } from "../utils/voiceProviders";

const STORAGE_KEY = "speech-test-provider";
const GEMINI_MODEL_KEY = "speech-test-gemini-model";

// Gemini models that support bidiGenerateContent (Live API)
// Note: Native audio models are designed for voice conversations (audio→audio)
// They don't support audio→text/JSON well. The original gemini-2.0-flash-live-001 was deprecated.
const GEMINI_MODEL_OPTIONS = [
  "gemini-2.5-flash-native-audio-latest",
  "gemini-2.0-flash-exp-image-generation",
];

export default function SpeechTestPage() {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [currentField, setCurrentField] = useState<FieldType>("listening");
  const [selectedProvider, setSelectedProvider] = useState<VoiceProviderType>("deepgram"); // Default to Deepgram (real-time streaming)
  const [geminiModel, setGeminiModel] = useState(GEMINI_MODEL_OPTIONS[0]);
  const [customGeminiModel, setCustomGeminiModel] = useState("");

  // Load saved preferences
  useEffect(() => {
    const savedProvider = localStorage.getItem(STORAGE_KEY);
    if (savedProvider && (savedProvider === "gemini" || savedProvider === "openai" || savedProvider === "whisper-gpt" || savedProvider === "deepgram")) {
      setSelectedProvider(savedProvider as VoiceProviderType);
    }
    const savedModel = localStorage.getItem(GEMINI_MODEL_KEY);
    if (savedModel) {
      if (GEMINI_MODEL_OPTIONS.includes(savedModel)) {
        setGeminiModel(savedModel);
      } else {
        setCustomGeminiModel(savedModel);
      }
    }
  }, []);

  // Save provider preference
  const handleProviderChange = (provider: VoiceProviderType) => {
    setSelectedProvider(provider);
    localStorage.setItem(STORAGE_KEY, provider);
  };

  // Save Gemini model preference
  const handleGeminiModelChange = (model: string) => {
    setGeminiModel(model);
    setCustomGeminiModel("");
    localStorage.setItem(GEMINI_MODEL_KEY, model);
  };

  const handleCustomModelChange = (model: string) => {
    setCustomGeminiModel(model);
    if (model) {
      localStorage.setItem(GEMINI_MODEL_KEY, model);
    }
  };

  // Get the effective Gemini model name
  const effectiveGeminiModel = customGeminiModel || geminiModel;

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

  const handleCurrentFieldChange = (field: FieldType) => {
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

  // Get the selected provider config
  const currentProviderConfig = VOICE_PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">🎤 Speech Recognition Test Harness</h1>

        <div className="mb-8">
          <p className="text-gray-600 text-center mb-4">
            Test streaming voice-to-JSON providers in isolation.
            <br />
            Open browser console to see detailed logs.
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Clear All Fields
            </button>
          </div>
        </div>

        {/* Provider Switcher */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-center">🔄 Select AI Provider</h3>
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            {VOICE_PROVIDERS.map((provider) => {
              const isSelected = selectedProvider === provider.id;
              const colorClass = provider.id === "gemini" ? "blue" : provider.id === "openai" ? "green" : provider.id === "deepgram" ? "teal" : "purple";
              const emoji = provider.id === "gemini" ? "🔵" : provider.id === "openai" ? "🟢" : provider.id === "deepgram" ? "🩵" : "🟣";
              return (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `border-${colorClass}-500 bg-${colorClass}-50 shadow-md`
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                  style={isSelected ? {
                    borderColor: colorClass === "blue" ? "#3b82f6" : colorClass === "green" ? "#22c55e" : colorClass === "teal" ? "#14b8a6" : "#a855f7",
                    backgroundColor: colorClass === "blue" ? "#eff6ff" : colorClass === "green" ? "#f0fdf4" : colorClass === "teal" ? "#f0fdfa" : "#faf5ff"
                  } : {}}
                >
                  <div className={`font-medium ${isSelected ? `text-${colorClass}-700` : "text-gray-700"}`}
                    style={isSelected ? {
                      color: colorClass === "blue" ? "#1d4ed8" : colorClass === "green" ? "#15803d" : colorClass === "teal" ? "#0f766e" : "#7e22ce"
                    } : {}}
                  >
                    {emoji} {provider.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{provider.description}</div>
                  <div className="text-xs font-mono text-gray-400 mt-1 truncate" title={provider.modelName}>
                    {provider.modelName}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* API Key Status */}
          <div className="mt-3 text-center text-xs text-gray-500">
            {currentProviderConfig && (
              <span>
                Requires: <code className="bg-gray-100 px-1 rounded">{currentProviderConfig.requiresApiKey}</code>
              </span>
            )}
          </div>

          {/* Gemini Model Selector (only shown when Gemini is selected) */}
          {selectedProvider === "gemini" && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🧪 Gemini Model (experimental - try different models)
              </label>
              <div className="flex gap-2">
                <select
                  value={customGeminiModel ? "" : geminiModel}
                  onChange={(e) => handleGeminiModelChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {GEMINI_MODEL_OPTIONS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Or enter custom model name..."
                  value={customGeminiModel}
                  onChange={(e) => handleCustomModelChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Current: <code className="bg-gray-100 px-1 rounded">{effectiveGeminiModel}</code>
              </div>
            </div>
          )}
        </div>

        {/* Speech Recognition Component - Conditionally rendered based on provider */}
        <div className={`border-2 rounded-lg p-6 mb-8 ${
          selectedProvider === "gemini" ? "border-blue-200" : 
          selectedProvider === "openai" ? "border-green-200" : 
          selectedProvider === "deepgram" ? "border-teal-200" : "border-purple-200"
        }`}>
          {selectedProvider === "gemini" ? (
            <GeminiStreamingSpeech
              onCardNumberChange={handleCardNumberChange}
              onExpiryChange={handleExpiryChange}
              onCvvChange={handleCvvChange}
              onCurrentFieldChange={handleCurrentFieldChange}
              modelName={effectiveGeminiModel}
            />
          ) : selectedProvider === "openai" ? (
            <OpenAIStreamingSpeech
              onCardNumberChange={handleCardNumberChange}
              onExpiryChange={handleExpiryChange}
              onCvvChange={handleCvvChange}
              onCurrentFieldChange={handleCurrentFieldChange}
            />
          ) : selectedProvider === "deepgram" ? (
            <DeepgramStreamingSpeech
              onCardNumberChange={handleCardNumberChange}
              onExpiryChange={handleExpiryChange}
              onCvvChange={handleCvvChange}
              onCurrentFieldChange={handleCurrentFieldChange}
            />
          ) : (
            <WhisperGPTSpeech
              onCardNumberChange={handleCardNumberChange}
              onExpiryChange={handleExpiryChange}
              onCvvChange={handleCvvChange}
              onCurrentFieldChange={handleCurrentFieldChange}
            />
          )}
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
          <div>Provider: {selectedProvider}</div>
          <div>Model: {selectedProvider === "gemini" ? effectiveGeminiModel : currentProviderConfig?.modelName}</div>
          <div>User Agent: {typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}</div>
          <div>Protocol: {typeof window !== "undefined" ? window.location.protocol : "N/A"}</div>
          <div>Host: {typeof window !== "undefined" ? window.location.host : "N/A"}</div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 mb-2">📋 Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
            <li>Select an AI provider above (Gemini or OpenAI)</li>
            <li>Open browser console (F12) to see detailed logs</li>
            <li>Click the microphone button to start speech recognition</li>
            <li>Allow microphone permissions when prompted</li>
            <li>Speak your credit card details: &quot;4111 1111 1111 1111 12 25 123&quot;</li>
            <li>Watch the console logs and field updates above</li>
            <li>Compare results between providers by switching and repeating</li>
          </ol>
        </div>

        {/* Environment Setup */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 mb-2">⚙️ Required Environment Variables:</h3>
          <div className="font-mono text-xs text-blue-700 space-y-1">
            <div>• DEEPGRAM_API_KEY (for Deepgram) - <a href="https://console.deepgram.com" target="_blank" className="underline">get free key</a></div>
            <div>• OPENAI_API_KEY (for GPT extraction & Whisper)</div>
            <div>• GOOGLE_GEMINI_API_KEY (for Gemini - optional)</div>
          </div>
          <div className="text-xs text-blue-600 mt-2">
            🔒 API keys are kept secure on the server.
          </div>
        </div>
      </div>
    </div>
  );
}
