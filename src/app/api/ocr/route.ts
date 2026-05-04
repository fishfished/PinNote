import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 503 }
    );
  }

  try {
    const { imageBase64, mimeType = "image/png" } = await req.json();
    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an OCR engine. Extract ALL text from this image exactly as it appears.
Preserve original line breaks and paragraph structure.
Do not add any interpretation, commentary, or formatting beyond what is in the image.
Return ONLY the extracted text — no JSON wrapper, no markdown, no explanation.
If no text is found, return an empty string.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            { text: systemPrompt },
          ],
        },
      ],
    });

    const text = response.text ?? "";
    return NextResponse.json({ text: text.trim() });
  } catch (e: unknown) {
    console.error("ocr error:", e);
    const msg = e instanceof Error ? e.message : "OCR failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
