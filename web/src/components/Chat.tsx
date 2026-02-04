"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  mode: "onboarding" | "persona";
  personaSlug?: string;
  personaName?: string;
  onPersonaGenerated?: (slug: string) => void;
}

const ONBOARDING_MIN_MESSAGES = 8;

export default function Chat({ mode, personaSlug, personaName, onPersonaGenerated }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canGenerate, setCanGenerate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start conversation
    if (messages.length === 0) {
      if (mode === "onboarding") {
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: "hey! i'm going to help create an AI version of you that people can chat with. let's start simple - what's your name?",
          },
        ]);
      } else if (personaName) {
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: `hey, i'm ${personaName}'s AI. ask me anything about them - what they're into, what they do, their vibe. i'll answer like they would.`,
          },
        ]);
      }
    }
  }, [mode, personaName, messages.length]);

  useEffect(() => {
    // Check if we have enough messages to generate persona
    if (mode === "onboarding") {
      const userMessages = messages.filter((m) => m.role === "user");
      setCanGenerate(userMessages.length >= ONBOARDING_MIN_MESSAGES);
    }
  }, [messages, mode]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const endpoint = mode === "onboarding" ? "/api/onboard" : "/api/chat";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          personaSlug: mode === "persona" ? personaSlug : undefined,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePersona = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.slug && onPersonaGenerated) {
        onPersonaGenerated(data.slug);
      }
    } catch (error) {
      console.error("Error generating persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-animate flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                message.role === "user"
                  ? "bg-black text-white rounded-br-md"
                  : "bg-gray-100 text-black rounded-bl-md"
              }`}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Generate button for onboarding */}
      {mode === "onboarding" && canGenerate && (
        <div className="px-4 pb-2">
          <button
            onClick={generatePersona}
            disabled={isLoading}
            className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300"
          >
            {isLoading ? "Creating your AI..." : "I'm ready - create my AI"}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-end gap-2 bg-gray-50 rounded-2xl p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "onboarding" ? "Type your answer..." : "Ask something..."}
            className="flex-1 bg-transparent px-2 py-2 resize-none text-black placeholder-gray-400 text-[15px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-full bg-black text-white disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {mode === "onboarding" && !canGenerate && (
          <p className="text-center text-sm text-gray-400 mt-2">
            {ONBOARDING_MIN_MESSAGES - messages.filter((m) => m.role === "user").length} more
            answers to unlock your AI
          </p>
        )}
      </div>
    </div>
  );
}
