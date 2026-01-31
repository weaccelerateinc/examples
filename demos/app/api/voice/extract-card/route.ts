import { NextResponse } from "next/server";

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const CARD_EXTRACTION_PROMPT = `You are a credit card information extraction assistant. Extract credit card details from spoken input.

IMPORTANT: Respond ONLY with valid JSON, no other text. Use this exact format:
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
- currentField: Which field the user is currently providing
- If unsure about a value, use null
- Parse natural speech like "four one two three..." as "4123"

Extract card information from: `;

export async function POST(req: Request) {
  if (!GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Google Gemini API key not configured. Add GOOGLE_GEMINI_API_KEY to your .env file." },
      { status: 500 }
    );
  }

  try {
    const { transcript } = await req.json();
    
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({
        transcript: "",
        extraction: null,
      });
    }

    // Use Gemma model (has separate quota from Gemini)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: CARD_EXTRACTION_PROMPT + `"${transcript}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const extractionText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Clean up any markdown code blocks
    const cleanedText = extractionText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let extraction;
    try {
      extraction = JSON.parse(cleanedText);
    } catch {
      console.error("Failed to parse extraction:", cleanedText);
      extraction = null;
    }

    console.log("🎯 Gemini extraction:", { transcript, extraction });

    return NextResponse.json({
      transcript,
      extraction,
    });
  } catch (error) {
    console.error("Error in extract-card:", error);
    return NextResponse.json(
      { error: "Failed to extract card info" },
      { status: 500 }
    );
  }
}
