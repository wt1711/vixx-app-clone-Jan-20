"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Chat from "@/components/Chat";

interface PersonaInfo {
  name: string;
  exists: boolean;
}

export default function MeetPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [personaInfo, setPersonaInfo] = useState<PersonaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateCTA, setShowCreateCTA] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    // Fetch persona info
    const fetchPersona = async () => {
      try {
        const response = await fetch(`/api/persona/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setPersonaInfo({ name: data.name, exists: true });
        } else {
          setPersonaInfo({ name: "", exists: false });
        }
      } catch (error) {
        setPersonaInfo({ name: "", exists: false });
      } finally {
        setLoading(false);
      }
    };

    fetchPersona();
  }, [slug]);

  // Show CTA after a few messages
  useEffect(() => {
    if (messageCount >= 5) {
      setShowCreateCTA(true);
    }
  }, [messageCount]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  if (!personaInfo?.exists) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black mb-2">
            This AI doesn't exist
          </h1>
          <p className="text-gray-500 mb-8">
            The link might be expired or invalid
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Create your own AI
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {personaInfo.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-semibold text-black">{personaInfo.name}'s AI</h1>
              <p className="text-xs text-gray-400">Ask me anything about them</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 max-w-2xl mx-auto w-full">
        <Chat
          mode="persona"
          personaSlug={slug}
          personaName={personaInfo.name}
        />
      </div>

      {/* Create CTA */}
      {showCreateCTA && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center px-4 animate-fade-in">
          <button
            onClick={() => router.push("/")}
            className="bg-white text-black px-6 py-3 rounded-full font-medium border border-gray-200 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <span>Want your own AI?</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
