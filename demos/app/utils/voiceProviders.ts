/**
 * Voice-to-JSON Provider Types
 * Shared interface for streaming voice input to JSON output providers
 */

export interface CardFormData {
  card_number?: string;
  expiry?: string;
  cvv?: string;
}

export interface VoiceProviderCallbacks {
  onCardNumberChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  onCurrentFieldChange: (field: FieldType) => void;
  onActiveFieldChange?: (field: FieldType | null) => void;
}

export type FieldType = "cardNumber" | "expiry" | "cvv" | "listening" | "idle" | "complete" | "unclear";

export type VoiceProviderType = "gemini" | "openai" | "whisper-gpt" | "deepgram";

export interface VoiceProviderConfig {
  id: VoiceProviderType;
  name: string;
  description: string;
  modelName: string;
  requiresApiKey: string;
}

export const VOICE_PROVIDERS: VoiceProviderConfig[] = [
  {
    id: "deepgram",
    name: "Deepgram + Gemma",
    description: "Real-time streaming (Recommended)",
    modelName: "nova-2 + gemma-3-4b-it",
    requiresApiKey: "DEEPGRAM_API_KEY + GOOGLE_GEMINI_API_KEY",
  },
  {
    id: "whisper-gpt",
    name: "Whisper + GPT",
    description: "Record & process (OpenAI only)",
    modelName: "whisper-1 + gpt-4o-mini",
    requiresApiKey: "OPENAI_API_KEY", // Server-side only (secure)
  },
  {
    id: "openai",
    name: "OpenAI Realtime",
    description: "⚠️ Broken - quota issues",
    modelName: "gpt-realtime",
    requiresApiKey: "OPENAI_API_KEY", // Server-side only (secure)
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "⚠️ Deprecated models",
    modelName: "gemini-2.5-flash-native-audio-latest",
    requiresApiKey: "GOOGLE_GEMINI_API_KEY", // Server-side only (secure)
  },
];

/**
 * System prompt for credit card extraction
 * Used by both providers to ensure consistent behavior
 */
export const CARD_EXTRACTION_SYSTEM_PROMPT = `You are a credit card information extraction assistant.
The user is going to speak their credit card number, expiry, and cvv.
The audio portion will be the user's speech and the text portion you receive will be the current state of the card information.
Return a JSON payload describing edits to this information that should be made given their speech.
The payload should meet the spec { card_number?: string, expiry?: string, cvv?: string }.
When the user is speaking their expiry they may say something like "August 27" which means 8/27.
They will always say a month and a year so interpret their speech accordingly.
They may also say something like "June 2028" which means 6/28. Always return the 2 digit year.
Only return valid JSON, no markdown code blocks.`;

/**
 * Parse streaming text into CardFormData
 * Handles incomplete JSON fragments during streaming
 */
let accumulatedText = "";

export function parseStreamingJson(incoming: string): CardFormData | null {
  accumulatedText += incoming;
  try {
    // Clean up markdown code blocks if present
    const cleaned = accumulatedText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const response = JSON.parse(cleaned) as CardFormData;
    accumulatedText = ""; // Reset on successful parse
    return response;
  } catch {
    return null; // Incomplete JSON, keep accumulating
  }
}

export function resetStreamingParser(): void {
  accumulatedText = "";
}
