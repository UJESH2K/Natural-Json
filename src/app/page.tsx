"use client";

import React, { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/nlp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Error:", error);
      setResponse({ error: "Failed to process request" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#212121] text-white p-4">
      <div className="w-full max-w-2xl flex flex-col items-center space-y-8">
        
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-100">What's on your mind today?</h1>

        {/* Input Area */}
        <div className="w-full relative">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your trading strategy..."
              className="w-full h-32 p-4 pr-12 bg-[#2f2f2f] border border-[#3a3a3a] rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none shadow-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="absolute bottom-4 right-4 p-2 bg-white text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </button>
          </form>
        </div>

        {/* 3 Trade Options / Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <button
            onClick={() => handleExampleClick("Long BTC 10x if price > 50000")}
            className="p-4 bg-[#2f2f2f] border border-[#3a3a3a] rounded-xl hover:bg-[#3a3a3a] transition-colors text-left group"
          >
            <div className="font-semibold text-gray-200 mb-1 group-hover:text-white">Long BTC</div>
            <div className="text-xs text-gray-400">Leverage 10x above $50k</div>
          </button>
          
          <button
            onClick={() => handleExampleClick("Short ETH if price < 2000, TP 1800")}
            className="p-4 bg-[#2f2f2f] border border-[#3a3a3a] rounded-xl hover:bg-[#3a3a3a] transition-colors text-left group"
          >
            <div className="font-semibold text-gray-200 mb-1 group-hover:text-white">Short ETH</div>
            <div className="text-xs text-gray-400">Target $1800 below $2k</div>
          </button>
          
          <button
            onClick={() => handleExampleClick("Buy SOL if price drops below 140")}
            className="p-4 bg-[#2f2f2f] border border-[#3a3a3a] rounded-xl hover:bg-[#3a3a3a] transition-colors text-left group"
          >
            <div className="font-semibold text-gray-200 mb-1 group-hover:text-white">Accumulate SOL</div>
            <div className="text-xs text-gray-400">Buy dip below $140</div>
          </button>
        </div>

        {/* JSON Response Display */}
        {response && (
          <div className="w-full mt-8 p-4 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-400">JSON Response from /api/nlp</h3>
              <span className="text-xs text-green-500">Status: 200 OK</span>
            </div>
            <pre className="text-xs text-green-400 overflow-x-auto font-mono">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}