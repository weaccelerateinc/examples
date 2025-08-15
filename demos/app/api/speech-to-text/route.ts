import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Get Google Gemini API key from environment variable
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Gemini API key not configured' }, { status: 500 });
    }

    // Debug logging
    console.log('Audio file details:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    });

    // Convert audio to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    console.log('Sending request to Google Gemini...');
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Transcribe this audio exactly as spoken. If the user says 'card number 1234 5678 9012 3456', return exactly that text. If they say 'exp twelve twenty-five', return exactly that text. Return the complete transcript with all words and numbers as spoken."
          }, {
            inline_data: {
              mime_type: audioFile.type,
              data: base64Audio
            }
          }]
        }]
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        error: errorData,
        headers: Object.fromEntries(geminiResponse.headers.entries()),
        url: geminiResponse.url
      });
      return NextResponse.json(
        { error: `Failed to process audio with Gemini: ${errorData}` },
        { status: geminiResponse.status }
      );
    }

    const data = await geminiResponse.json();
    
    // Extract the transcribed text from Gemini response
    const transcribedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return NextResponse.json({
      text: transcribedText.trim(),
      success: true,
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
