"use client";

import Image from "next/image";
import {TrendingUp, Tag, Clock, Settings,Cable, LogOut, ChevronUp, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import type { Channel } from "@/lib/types";
import { ChannelItem } from "./ChannelItem";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  channels: Channel[];
  selectedChannel: string;
  onSelectChannel: (id: string) => void;
}

export function Sidebar({ channels, selectedChannel, onSelectChannel }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.replace("/auth/login");
  };

  const handleSettings = () => {
    setMenuOpen(false);
    router.push("/connect-platforms?manage=1");
  };

  const handleAiAssistant = () => {
    setMenuOpen(false);
    router.push("/ai-assistant");
  };

  // Close menu when clicking outside the user section
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/logo.png"
            width={100}
            height={100}
            alt="logo"
            className="w-10 h-10 text-white rounded-md"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-xs text-slate-500">Agregator Inteligent</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {channels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isSelected={selectedChannel === channel.id}
              onSelect={onSelectChannel}
            />
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Funcții Smart
            </h3>
          </div>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-all">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Analiza Sentimente</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-all">
              <Tag className="w-4 h-4" />
              <span className="text-sm">Clasificare Automată</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-all">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Deadline-uri</span>
            </button>
          </div>
        </div>
      </div>

      {/* User section — click anywhere to open popup */}
      <div className="p-4 border-t border-slate-200 relative" ref={menuRef}>
        {/* Popup menu — appears above the user row */}
        {menuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Cable className="w-4 h-4 text-green-600" />
              Gestionează platformele
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={handleAiAssistant}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Bot className="w-4 h-4 text-blue-500" />
              AI Assistant
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}

        {/* Clickable user row */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 transition-all text-left"
        >
          {user?.avatar ? (
            <Image
              src={user.avatar}
              width={36}
              height={36}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">{initials}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.name ?? "—"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email ?? ""}</p>
          </div>

          <ChevronUp
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
              menuOpen ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
