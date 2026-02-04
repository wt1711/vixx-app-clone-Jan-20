// In-memory storage for MVP
// Replace with Supabase/Postgres for production

export interface Persona {
  id: string;
  slug: string;
  name: string;
  personaPrompt: string;
  styleGuide: string;
  facts: string[];
  exampleResponses: string[];
  createdAt: Date;
}

export interface Conversation {
  id: string;
  personaId: string;
  messages: { role: "user" | "assistant"; content: string }[];
  createdAt: Date;
}

// In-memory store (will reset on server restart)
const personas: Map<string, Persona> = new Map();
const conversations: Map<string, Conversation> = new Map();

export function savePersona(persona: Persona): void {
  personas.set(persona.slug, persona);
}

export function getPersonaBySlug(slug: string): Persona | undefined {
  return personas.get(slug);
}

export function saveConversation(conversation: Conversation): void {
  conversations.set(conversation.id, conversation);
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.get(id);
}

// Generate a random slug
export function generateSlug(): string {
  const adjectives = ['cool', 'chill', 'bold', 'kind', 'wild', 'calm', 'warm', 'wise'];
  const nouns = ['fox', 'owl', 'wolf', 'bear', 'hawk', 'lion', 'deer', 'swan'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}-${noun}-${num}`;
}
