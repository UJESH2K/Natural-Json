"use client";

import React, { useState, useEffect } from "react";
import { AuroraShaders } from "@/components/ui/aurora-shaders";
import { Sidebar, type ChatHistory } from "@/components/ui/sidebar";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
  type ChatStatus,
} from "@/components/ai/prompt-input";
import { MicIcon, PaperclipIcon } from "lucide-react";

const models = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
];

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [response, setResponse] = useState<any>(null);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      setChatHistory(parsed.map((chat: any) => ({
        ...chat,
        timestamp: new Date(chat.timestamp)
      })));
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setStatus("submitted");
    setResponse(null);

    // Create or update chat history
    const chatTitle = prompt.slice(0, 30) + (prompt.length > 30 ? '...' : '');
    
    if (!currentChatId) {
      // New chat
      const newChat: ChatHistory = {
        id: generateId(),
        title: chatTitle,
        timestamp: new Date(),
        preview: prompt,
      };
      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    } else {
      // Update existing chat timestamp
      setChatHistory(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, timestamp: new Date() }
          : chat
      ));
    }

    try {
      const res = await fetch("/api/nlp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      setStatus("streaming");
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Error:", error);
      setResponse({ error: "Failed to process request" });
      setStatus("error");
    } finally {
      setStatus("ready");
      setIsSubmitted(true);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setPrompt("");
    setResponse(null);
    setIsSubmitted(false);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    const chat = chatHistory.find(c => c.id === id);
    if (chat?.preview) {
      setPrompt(chat.preview);
    }
  };

  const handleDeleteChat = (id: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
      setPrompt("");
      setResponse(null);
    }
    // Update localStorage
    const updated = chatHistory.filter(chat => chat.id !== id);
    localStorage.setItem('chatHistory', JSON.stringify(updated));
  };

  const handleExampleClick = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Aurora Shaders Background */}
      <AuroraShaders
        className="absolute inset-0 z-0"
        speed={0.8}
        intensity={1.2}
        vibrancy={1.1}
        frequency={1.0}
        stretch={1.5}
      />
      
      {/* Main Content - shifts right when sidebar is open */}
      <div 
        className={`relative z-10 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}
      >
        {/* React Flow Area - Takes up top 85% when submitted */}
        {isSubmitted && (
          <div 
            className="flex-1 transition-all duration-700 ease-in-out opacity-100"
          >
            {/* React Flow will go here */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-500 text-lg">
                {/* Placeholder for React Flow */}
              </div>
            </div>
          </div>
        )}

        {/* Center Content - Header and Input (moves to bottom after submit) */}
        <div 
          className={`w-full flex flex-col items-center transition-all duration-700 ease-out ${
            isSubmitted 
              ? 'py-4' 
              : 'flex-1 justify-center'
          }`}
        >
          {/* Cardano X Dan Labs Logo - Fades out after submit */}
          <div 
            className={`flex items-center gap-4 mb-8 transition-all duration-500 ease-in-out ${
              isSubmitted 
                ? 'opacity-0 scale-95 h-0 mb-0 pointer-events-none' 
                : 'opacity-100 scale-100'
            }`}
          >
            <span className="text-6xl font-bold tracking-wide">CARDANO</span>
            <span className="text-xl font-light bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">×</span>
            <span className="text-6xl font-bold tracking-wide">DAN LABS</span>
          </div>

          {/* Input Area with Animated Border */}
          <div className={`w-full max-w-2xl relative px-4 transition-all duration-700 ease-in-out`}>
            {/* Animated gradient border container */}
            <div className="absolute -inset-[3px] left-1 right-1 rounded-xl overflow-hidden">
              <div 
                className="absolute inset-[-50%] w-[200%] h-[200%] animate-border-rotate"
                style={{
                  background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
                }}
              />
            </div>
            
            <PromptInput onSubmit={handleSubmit} className="relative">
              <PromptInputTextarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (isSubmitted) setIsSubmitted(false);
                }}
                placeholder="Make your customized AI Agent"
                className={isSubmitted ? "text-gray-500" : ""}
              />
              <PromptInputToolbar className="pr-3 pb-3">
                <PromptInputTools>
                  <PromptInputButton>
                    <PaperclipIcon size={20} />
                  </PromptInputButton>
                  <PromptInputButton>
                    <MicIcon size={16} />
                    <span>Voice</span>
                  </PromptInputButton>
                  <PromptInputModelSelect
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <PromptInputModelSelectTrigger>
                      <PromptInputModelSelectValue />
                    </PromptInputModelSelectTrigger>
                    <PromptInputModelSelectContent>
                      {models.map((model) => (
                        <PromptInputModelSelectItem key={model.id} value={model.id}>
                          {model.name}
                        </PromptInputModelSelectItem>
                      ))}
                    </PromptInputModelSelectContent>
                  </PromptInputModelSelect>
                </PromptInputTools>
                <PromptInputSubmit disabled={!prompt.trim()} status={status} />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}