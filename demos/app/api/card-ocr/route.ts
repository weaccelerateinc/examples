import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Get Google Gemini API key from environment variable
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google Gemini API key not configured" }, { status: 500 });
    }

    // Debug logging
    console.log("Image file details:", {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
    });

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    console.log("Sending request to Google Gemini Vision...");
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this credit card image and extract the following information:
            1. Card number (all 16 digits, ignoring spaces or dashes)
            2. Expiration date (MM/YY format)
            3. CVV/CVC code (if visible, usually on the back)
            
            Return ONLY a JSON object with this format:
            {
              "cardNumber": "1234567890123456",
              "expiry": "12/25", 
              "cvv": "123"
            }
            
            If any field cannot be read clearly, use null for that field. Do not include any other text or explanation.`,
                },
                {
                  inline_data: {
                    mime_type: imageFile.type,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini API error:", {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        error: errorData,
        headers: Object.fromEntries(geminiResponse.headers.entries()),
        url: geminiResponse.url,
      });
      return NextResponse.json(
        { error: `Failed to process image with Gemini: ${errorData}` },
        { status: geminiResponse.status }
      );
    }

    const data = await geminiResponse.json();

    // Extract the OCR result from Gemini response
    const ocrText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("Raw OCR response:", ocrText);

    // Try to parse the JSON response
    let cardData = null;
    try {
      // Remove any markdown formatting or extra text
      const cleanedText = ocrText.replace(/```json|```/g, "").trim();
      cardData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse OCR response as JSON:", parseError);
      // Fallback: try to extract data using regex
      const cardNumberMatch = ocrText.match(/(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})/);
      const expiryMatch = ocrText.match(/(\d{1,2}\/\d{2,4})/);
      const cvvMatch = ocrText.match(/\b(\d{3,4})\b/);

      cardData = {
        cardNumber: cardNumberMatch ? cardNumberMatch[1].replace(/[\s-]/g, "") : null,
        expiry: expiryMatch ? expiryMatch[1] : null,
        cvv: cvvMatch ? cvvMatch[1] : null,
      };
    }

    return NextResponse.json({
      cardData,
      success: true,
    });
  } catch (error) {
    console.error("Card OCR error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
