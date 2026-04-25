"use client";

import { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  demoPrompts: readonly string[];
}

export function AIChatPanel({ onGenerate, isGenerating, demoPrompts }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Choose your AI mode\n\nSelect the mode that best fits your task",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    onGenerate(input);
    setInput("");

    // Simulate assistant response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'll create that for you.",
        },
      ]);
    }, 500);
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a2a] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#8b5cf6]">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white">New Chat</span>
          <button className="ml-1 text-gray-400 hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded p-1 hover:bg-[#1f1f1f]">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button className="rounded p-1 hover:bg-[#1f1f1f]">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            {message.role === "assistant" ? (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#8b5cf6]">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="whitespace-pre-wrap text-sm text-gray-300">{message.content}</p>
                  {message.id === "1" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-3 text-left transition hover:bg-[#1f1f1f]">
                        <div className="mb-1 text-sm font-medium text-white">Flash</div>
                        <div className="text-xs text-gray-400">Fast responses for quick tasks</div>
                      </button>
                      <button className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-3 text-left transition hover:bg-[#1f1f1f]">
                        <div className="mb-1 text-sm font-medium text-white">Super</div>
                        <div className="text-xs text-gray-400">Best reasoning for complex work</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-[#8b5cf6] px-4 py-2">
                  <p className="text-sm text-white">{message.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {isGenerating && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#8b5cf6]">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
            </div>
            <div className="text-sm text-gray-400">Generating...</div>
          </div>
        )}
      </div>

      {/* Demo Prompts */}
      <div className="border-t border-[#2a2a2a] px-4 py-3">
        <div className="mb-2 text-xs font-medium text-gray-400">Quick prompts</div>
        <div className="flex flex-wrap gap-2">
          {demoPrompts.slice(0, 3).map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="rounded-md border border-[#2a2a2a] bg-[#141414] px-2 py-1 text-xs text-gray-300 transition hover:bg-[#1f1f1f]"
            >
              {prompt.slice(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#2a2a2a] p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="What do you want to build?"
            className="flex-1 resize-none rounded-lg border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#8b5cf6]"
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#8b5cf6] transition hover:bg-[#7c3aed] disabled:opacity-50"
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
