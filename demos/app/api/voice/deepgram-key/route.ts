import { NextResponse } from "next/server";

// Deepgram API key - get one free at https://console.deepgram.com
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function POST() {
  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: "Deepgram API key not configured. Add DEEPGRAM_API_KEY to your .env file. Get a free key at https://console.deepgram.com" },
      { status: 500 }
    );
  }

  try {
    // Create a temporary scoped API key via Deepgram's API
    // This key has limited permissions and expires quickly
    const response = await fetch("https://api.deepgram.com/v1/projects", {
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.status}`);
    }

    const projectsData = await response.json();
    const projectId = projectsData.projects?.[0]?.project_id;

    if (!projectId) {
      throw new Error("No project found");
    }

    // Create a temporary key with limited scope
    const keyResponse = await fetch(
      `https://api.deepgram.com/v1/projects/${projectId}/keys`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: `Temporary key for speech-test ${new Date().toISOString()}`,
          scopes: ["usage:write"], // Limited scope - only for transcription
          time_to_live_in_seconds: 60, // Expires in 60 seconds
        }),
      }
    );

    if (!keyResponse.ok) {
      const errorText = await keyResponse.text();
      console.error("Failed to create temporary key:", keyResponse.status, errorText);
      throw new Error(`Failed to create temporary key: ${keyResponse.status}`);
    }

    const keyData = await keyResponse.json();
    
    return NextResponse.json({
      apiKey: keyData.key,
      expiresIn: 60,
    });
  } catch (error) {
    console.error("Error creating Deepgram temporary key:", error);
    
    // NEVER fall back to main API key - it would expose it to the client
    return NextResponse.json(
      { error: "Failed to create secure temporary key. Check Deepgram API key permissions." },
      { status: 500 }
    );
  }
}
