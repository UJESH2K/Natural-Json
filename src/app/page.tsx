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
        className={`relative z-10 flex flex-col items-center justify-center min-h-screen p-4 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}
      >
        <div className="w-full max-w-2xl flex flex-col items-center space-y-8">
        
        {/* Cardano X Dan Labs Logo */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-6xl font-bold tracking-wide ">CARDANO</span>
          <span className="text-xl font-light bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">×</span>
          <span className="text-6xl font-bold tracking-wide">DAN LABS</span>
        </div>
        
        {/* Header */}
        {/* <h1 className="text-3xl font-bold text-gray-100 mb-8">What's on your mind today?</h1> */}
        <br/>

        {/* Input Area with Animated Border */}
        <div className="w-full relative">
          {/* Animated gradient border container */}
          <div className="absolute -inset-[3px] rounded-xl overflow-hidden">
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
        <br/>


        {/* 3 Trade Options / Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Long BTC */}
          {/* <div className="relative group">
            <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
              <div 
                className="absolute inset-[-50%] w-[200%] h-[200%] animate-border-rotate"
                style={{
                  background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
                }}
              />
            </div>
            <button
              onClick={() => handleExampleClick("Long BTC 10x if price > 50000")}
              className="relative w-full p-5 bg-[#1a1a1a] rounded-2xl hover:bg-[#252525] transition-colors"
            >
              <div className="font-semibold text-gray-200 mb-1 group-hover:text-white text-center">Long BTC</div>
              <div className="text-xs text-gray-400 text-center">Leverage 10x above $50k</div>
            </button>
          </div>
           */}
          {/* Short ETH */}
          {/* <div className="relative group">
            <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
              <div 
                className="absolute inset-[-50%] w-[200%] h-[200%] animate-border-rotate"
                style={{
                  background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
                }}
              />
            </div>
            <button
              onClick={() => handleExampleClick("Short ETH if price < 2000, TP 1800")}
              className="relative w-full p-5 bg-[#1a1a1a] rounded-2xl hover:bg-[#252525] transition-colors"
            >
              <div className="font-semibold text-gray-200 mb-1 group-hover:text-white text-center">Short ETH</div>
              <div className="text-xs text-gray-400 text-center">Target $1800 below $2k</div>
            </button>
          </div> */}
          
          {/* Accumulate SOL */}
          {/* <div className="relative group">
            <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
              <div 
                className="absolute inset-[-50%] w-[200%] h-[200%] animate-border-rotate"
                style={{
                  background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
                }}
              />
            </div>
            <button
              onClick={() => handleExampleClick("Buy SOL if price drops below 140")}
              className="relative w-full p-5 bg-[#1a1a1a] rounded-2xl hover:bg-[#252525] transition-colors"
            >
              <div className="font-semibold text-gray-200 mb-1 group-hover:text-white text-center">Accumulate SOL</div>
              <div className="text-xs text-gray-400 text-center">Buy dip below $140</div>
            </button>
          </div> */}
        </div>
      </div>
      </div>
    </div>
  );
}