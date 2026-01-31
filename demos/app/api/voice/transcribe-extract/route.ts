import { NextResponse } from "next/server";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const CARD_EXTRACTION_SYSTEM_PROMPT = `You are a credit card information extraction assistant. Extract credit card details from spoken input.

IMPORTANT: Respond ONLY with valid JSON, no other text. Use this exact format:
{
  "cardNumber": "extracted 16-digit card number or null",
  "expiry": "MM/YY format or null", 
  "cvv": "3-4 digit CVV or null",
  "currentField": "cardNumber" | "expiry" | "cvv" | "complete" | "unclear"
}

Rules:
- cardNumber: Extract digits only, ignore spaces/dashes. Must be 13-19 digits.
- expiry: Convert to MM/YY format (e.g., "January 2025" → "01/25")
- cvv: 3-4 digits only
- currentField: Which field the user is currently providing
- If unsure about a value, use null
- Parse natural speech like "four one two three..." as "4123"`;

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured on server" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Step 1: Transcribe with whisper-1
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
    });

    const transcript = transcription.text;
    console.log("📝 Transcription:", transcript);

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({
        transcript: "",
        extraction: null,
        message: "No speech detected",
      });
    }

    // Step 2: Extract card info with GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for speed and cost
      messages: [
        { role: "system", content: CARD_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: `Extract card information from: "${transcript}"` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const extractionText = completion.choices[0]?.message?.content || "{}";
    let extraction;
    try {
      extraction = JSON.parse(extractionText);
    } catch {
      extraction = null;
    }

    console.log("🎯 Extraction:", extraction);

    return NextResponse.json({
      transcript,
      extraction,
    });
  } catch (error) {
    console.error("Error in transcribe-extract:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}
