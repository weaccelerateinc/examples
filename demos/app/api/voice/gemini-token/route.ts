import { NextResponse } from "next/server";

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_LIVE_MODEL = "gemini-2.5-flash-native-audio-latest";

export async function POST() {
  if (!GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Google Gemini API key not configured on server" },
      { status: 500 }
    );
  }

  try {
    // Attempt to get ephemeral token from Google's API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_LIVE_MODEL}:generateEphemeralToken?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini ephemeral token API error:", response.status, errorText);
      
      // DO NOT fall back to raw API key - this would expose it to the client
      return NextResponse.json(
        { 
          error: "Gemini Live API ephemeral tokens not available for this model. The Gemini provider is currently disabled.",
          status: response.status 
        },
        { status: 503 }
      );
    }

    const data = await response.json();

    // Only return actual ephemeral tokens, never raw API keys
    if (!data.token && !data.ephemeralToken) {
      return NextResponse.json(
        { error: "No ephemeral token received from Gemini API" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: data.token || data.ephemeralToken,
      expiresAt: data.expiresAt,
      model: GEMINI_LIVE_MODEL,
    });
  } catch (error) {
    console.error("Error creating Gemini ephemeral token:", error);
    
    // DO NOT fall back to raw API key
    return NextResponse.json(
      { error: "Failed to create Gemini ephemeral token" },
      { status: 500 }
    );
  }
}
