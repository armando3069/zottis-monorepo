"use client";

import Image from "next/image";
import { Search, TrendingUp, Tag, Clock, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
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

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Caută conversații..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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

      {/* Current user + logout */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
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

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}