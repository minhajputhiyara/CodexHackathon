"use client";

import { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

interface AIChatPanelProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  demoPrompts: readonly string[];
}

export function AIChatPanel({ onGenerate, isGenerating, demoPrompts }: AIChatPanelProps) {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "New Chat",
      messages: [
        {
          id: "1",
          role: "assistant",
          content: "Hi! I'm here to help you build beautiful UIs. What would you like to create today?",
        },
      ],
    },
  ]);
  const [activeChat, setActiveChat] = useState("1");
  const [input, setInput] = useState("");

  const currentChat = chats.find((c) => c.id === activeChat);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Hi! I'm here to help you build beautiful UIs. What would you like to create today?",
        },
      ],
    };
    setChats((prev) => [...prev, newChat]);
    setActiveChat(newChat.id);
  };

  const closeChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chats.length === 1) return; // Don't close the last chat

    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat(chats[0].id === chatId ? chats[1].id : chats[0].id);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isGenerating || !currentChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const currentChatId = activeChat; // Capture the current chat ID

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );

    onGenerate(input);
    setInput("");

    // Simulate assistant response
    setTimeout(() => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "I'll create that for you right away.",
                  },
                ],
              }
            : chat
        )
      );
    }, 500);
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      {/* Chat Tabs */}
      <div className="flex items-center gap-1 border-b border-[#2a2a2a] bg-[#0a0a0a] px-2 py-1">
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`group flex items-center gap-2 rounded px-3 py-1.5 text-sm transition ${
                activeChat === chat.id
                  ? "bg-[#1f1f1f] text-white"
                  : "text-gray-400 hover:bg-[#141414] hover:text-white"
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="max-w-[100px] truncate">{chat.title}</span>
              {chats.length > 1 && (
                <button
                  onClick={(e) => closeChat(chat.id, e)}
                  className="ml-1 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={createNewChat}
          className="shrink-0 rounded p-1.5 text-gray-400 transition hover:bg-[#1f1f1f] hover:text-white"
          title="New Chat"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {currentChat?.messages.map((message, index) => (
          <div key={message.id} className={`mb-6 ${index === 0 ? "" : "mt-4"}`}>
            {message.role === "assistant" ? (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9]">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-xs font-medium text-gray-400">Assistant</div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">{message.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1f1f1f]">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-xs font-medium text-gray-400">You</div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">{message.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {isGenerating && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9]">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
            </div>
            <div className="flex-1">
              <div className="mb-1 text-xs font-medium text-gray-400">Assistant</div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: "0ms" }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: "150ms" }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[#2a2a2a] p-3">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] transition focus-within:border-[#8b5cf6]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me to build something..."
            className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-500"
            rows={3}
          />
          <div className="flex items-center justify-between border-t border-[#2a2a2a] px-3 py-2">
            <div className="flex items-center gap-2">
              <button className="rounded p-1 text-gray-400 transition hover:bg-[#1f1f1f] hover:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button className="rounded p-1 text-gray-400 transition hover:bg-[#1f1f1f] hover:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="flex items-center gap-1.5 rounded-md bg-[#8b5cf6] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Send</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{input.length} / 2000</span>
        </div>
      </div>
    </div>
  );
}
