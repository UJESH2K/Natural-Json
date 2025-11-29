'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  SearchIcon,
  MessageSquareIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
} from 'lucide-react';

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  preview?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chatHistory: ChatHistory[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onSearch?: (query: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  chatHistory,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 z-50 p-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg hover:bg-[#252525] transition-colors"
        >
          <ChevronRightIcon size={20} className="text-gray-400" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full bg-[#0f0f0f] border-r border-[#2a2a2a] z-40 transition-all duration-300 flex flex-col',
          isOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-white">Cardano AI</span>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-[#252525] rounded-lg transition-colors"
          >
            <ChevronLeftIcon size={18} className="text-gray-400" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl hover:bg-[#252525] transition-colors group"
          >
            <PlusIcon size={18} className="text-gray-400 group-hover:text-white" />
            <span className="text-gray-300 group-hover:text-white">New chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:border-[#4a4a4a]"
            />
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">
            Your chats
          </div>
          <div className="space-y-1">
            {filteredHistory.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                No chats yet
              </div>
            ) : (
              filteredHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    'group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors',
                    currentChatId === chat.id
                      ? 'bg-[#252525] border border-[#3a3a3a]'
                      : 'hover:bg-[#1a1a1a]'
                  )}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <MessageSquareIcon size={16} className="text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-300 truncate">{chat.title}</div>
                    <div className="text-xs text-gray-500">{formatDate(chat.timestamp)}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3a3a3a] rounded transition-all"
                  >
                    <Trash2Icon size={14} className="text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2a2a2a]">
          <button className="w-full flex items-center gap-3 p-2.5 hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <SettingsIcon size={18} className="text-gray-500" />
            <span className="text-sm text-gray-400">Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
