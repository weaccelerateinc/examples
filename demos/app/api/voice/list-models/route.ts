import { NextResponse } from "next/server";

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

export async function GET() {
  if (!GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Google Gemini API key not configured on server" },
      { status: 500 }
    );
  }

  try {
    // List all available models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("List models API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to list models: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filter for models that might support bidiGenerateContent (Live API)
    const liveModels = data.models?.filter((model: { supportedGenerationMethods?: string[] }) => 
      model.supportedGenerationMethods?.includes("bidiGenerateContent")
    );

    return NextResponse.json({
      allModels: data.models?.map((m: { name: string }) => m.name),
      liveApiModels: liveModels?.map((m: { name: string; displayName?: string }) => ({
        name: m.name,
        displayName: m.displayName,
      })),
    });
  } catch (error) {
    console.error("Error listing models:", error);
    return NextResponse.json(
      { error: "Failed to list models" },
      { status: 500 }
    );
  }
}
