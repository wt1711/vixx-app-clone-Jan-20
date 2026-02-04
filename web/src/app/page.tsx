"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Chat from "@/components/Chat";

export default function Home() {
  const [started, setStarted] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);
  const router = useRouter();

  const handlePersonaGenerated = (slug: string) => {
    setGeneratedSlug(slug);
  };

  if (generatedSlug) {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/meet/${generatedSlug}`;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-black mb-2">Your AI is ready</h1>
            <p className="text-gray-500">Share this link with people you want to meet</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Your link</p>
            <p className="text-black font-medium break-all">{shareUrl}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
              }}
              className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Copy link
            </button>
            <button
              onClick={() => router.push(`/meet/${generatedSlug}`)}
              className="w-full bg-white text-black py-4 rounded-full font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Preview your AI
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (started) {
    return (
      <main className="min-h-screen flex flex-col">
        <header className="p-4 border-b border-gray-100">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-lg font-semibold text-black">Create your AI</h1>
            <span className="text-sm text-gray-400">~5 min</span>
          </div>
        </header>
        <div className="flex-1 max-w-2xl mx-auto w-full">
          <Chat mode="onboarding" onPersonaGenerated={handlePersonaGenerated} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold text-black mb-4 tracking-tight">
          Let your AI<br />introduce you
        </h1>
        <p className="text-lg text-gray-500 mb-12 max-w-sm mx-auto">
          Chat with us once. Get a link. Let people discover who you are.
        </p>

        <button
          onClick={() => setStarted(true)}
          className="bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Create my AI
        </button>

        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-400">
          <span>No signup needed</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>Free to try</span>
        </div>
      </div>
    </main>
  );
}
