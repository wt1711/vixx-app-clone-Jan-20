import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getPersonaBySlug } from "@/lib/storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, personaSlug } = await req.json();

    if (!personaSlug) {
      return NextResponse.json(
        { error: "Persona slug is required" },
        { status: 400 }
      );
    }

    const persona = getPersonaBySlug(personaSlug);

    if (!persona) {
      return NextResponse.json(
        { error: "Persona not found" },
        { status: 404 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: persona.personaPrompt },
        ...messages,
      ],
      max_tokens: 200,
      temperature: 0.9,
    });

    const message =
      response.choices[0]?.message?.content ||
      "hmm, not sure how to answer that one";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
