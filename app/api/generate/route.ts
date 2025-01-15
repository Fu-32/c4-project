import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Accepter uniquement POST et rejeter toutes les autres méthodes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { context, tone, audience, keywords } = body;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Context: ${context}. Tone: ${tone}. Audience: ${audience}. Keywords: ${keywords}. Generate content accordingly.`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content || "";
    return NextResponse.json({ text }, { status: 200 });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Something went wrong with the OpenAI API." },
      { status: 500 }
    );
  }
}

// Bloquer explicitement toutes les méthodes non autorisées
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}