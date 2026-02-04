import { NextRequest, NextResponse } from "next/server";
import { getPersonaBySlug } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const persona = getPersonaBySlug(slug);

  if (!persona) {
    return NextResponse.json(
      { error: "Persona not found" },
      { status: 404 }
    );
  }

  // Return only public info
  return NextResponse.json({
    name: persona.name,
    createdAt: persona.createdAt,
  });
}
