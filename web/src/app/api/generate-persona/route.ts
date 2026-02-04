import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { savePersona, generateSlug } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PERSONA_EXTRACTION_PROMPT = `Analyze this conversation and extract a detailed persona profile. The conversation is between an interviewer and someone creating an AI version of themselves.

Return a JSON object with this structure:
{
  "name": "their name",
  "styleGuide": {
    "sentenceLength": "short/medium/long",
    "formality": "very casual/casual/neutral/formal",
    "emojiUsage": "none/minimal/moderate/frequent",
    "humor": "dry/self-deprecating/playful/witty/none",
    "energy": "chill/warm/enthusiastic/intense",
    "quirks": ["specific speech patterns or phrases they use"]
  },
  "facts": [
    "key fact 1 about them",
    "key fact 2",
    ...
  ],
  "personality": {
    "values": ["what they care about"],
    "interests": ["hobbies and passions"],
    "lookingFor": "what they want in meeting someone",
    "dealbreakers": ["if mentioned"],
    "misunderstood": "what people get wrong about them"
  },
  "exampleResponses": [
    {
      "context": "when asked about X",
      "response": "their actual response style"
    }
  ]
}

Be specific and pull actual phrases/patterns from their messages. The goal is to capture their authentic voice.`;

const GENERATE_PERSONA_PROMPT = (profile: any) => `You are roleplaying as ${profile.name}. People will chat with you to get to know ${profile.name} before meeting them in person.

ABOUT ${profile.name.toUpperCase()}:
${profile.facts?.join("\n") || ""}

PERSONALITY:
- Values: ${profile.personality?.values?.join(", ") || "not specified"}
- Interests: ${profile.personality?.interests?.join(", ") || "not specified"}
- Looking for: ${profile.personality?.lookingFor || "not specified"}
- Often misunderstood: ${profile.personality?.misunderstood || "not specified"}

COMMUNICATION STYLE:
- Sentence length: ${profile.styleGuide?.sentenceLength || "medium"}
- Formality: ${profile.styleGuide?.formality || "casual"}
- Emoji usage: ${profile.styleGuide?.emojiUsage || "minimal"}
- Humor type: ${profile.styleGuide?.humor || "none"}
- Energy level: ${profile.styleGuide?.energy || "warm"}
- Speech quirks: ${profile.styleGuide?.quirks?.join(", ") || "none"}

EXAMPLE RESPONSES FROM ${profile.name.toUpperCase()}:
${profile.exampleResponses?.map((ex: any) => `When asked ${ex.context}: "${ex.response}"`).join("\n") || ""}

RULES:
1. Stay in character as ${profile.name} at all times
2. Match their communication style exactly
3. Be authentic to their personality - don't be generic
4. If asked something you don't know, say something like "hmm not sure ${profile.name} mentioned that, ask them when you meet!"
5. Be engaging and make the person want to meet ${profile.name}
6. Keep responses concise - this is chat, not essays
7. Never break character or mention you're an AI`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Extract persona profile from conversation
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: PERSONA_EXTRACTION_PROMPT },
        {
          role: "user",
          content: `Here's the conversation:\n\n${messages
            .map((m: any) => `${m.role}: ${m.content}`)
            .join("\n")}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const profileText = extractionResponse.choices[0]?.message?.content || "{}";
    const profile = JSON.parse(profileText);

    // Generate the persona prompt
    const personaPrompt = GENERATE_PERSONA_PROMPT(profile);

    // Create and save persona
    const slug = generateSlug();
    const persona = {
      id: uuidv4(),
      slug,
      name: profile.name || "Anonymous",
      personaPrompt,
      styleGuide: JSON.stringify(profile.styleGuide || {}),
      facts: profile.facts || [],
      exampleResponses: profile.exampleResponses || [],
      createdAt: new Date(),
    };

    savePersona(persona);

    return NextResponse.json({
      slug,
      name: profile.name,
      message: "Persona created successfully",
    });
  } catch (error) {
    console.error("Persona generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate persona" },
      { status: 500 }
    );
  }
}
