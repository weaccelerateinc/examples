import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_REALTIME_MODEL = "gpt-realtime";

export async function POST() {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured on server" },
      { status: 500 }
    );
  }

  try {
    // Create ephemeral session token via OpenAI's sessions endpoint
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_REALTIME_MODEL,
        modalities: ["text", "audio"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI sessions API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to create session: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("OpenAI sessions response - got session:", data.id);

    // Return ONLY the ephemeral token, NEVER the raw API key
    const ephemeralToken = data.client_secret?.value;
    if (!ephemeralToken) {
      console.error("No client_secret in response:", data);
      return NextResponse.json(
        { error: "No ephemeral token in OpenAI response" },
        { status: 500 }
      );
    }

    // The ephemeral token (ek_) is designed for WebRTC
    // For raw WebSocket, OpenAI Realtime API has issues - provider is marked as broken
    return NextResponse.json({
      token: ephemeralToken, // Only return ephemeral token
      tokenType: "ephemeral",
      expiresAt: data.client_secret?.expires_at,
      model: OPENAI_REALTIME_MODEL,
    });
  } catch (error) {
    console.error("Error creating OpenAI session:", error);
    return NextResponse.json(
      { error: "Failed to create ephemeral token" },
      { status: 500 }
    );
  }
}
