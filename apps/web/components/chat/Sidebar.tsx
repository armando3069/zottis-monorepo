"use client";

import Image from "next/image";
import { TrendingUp, Cable, LogOut, ChevronUp, Bot, Bell, BellOff, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { Channel } from "@/lib/types";
import { ChannelItem } from "./ChannelItem";
import { useAuth } from "@/context/AuthContext";
import { requestNotificationPermission, getNotificationPermission } from "@/lib/notify";
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

  const handleContacts = () => {
    router.push("/contacts");
  };

  // Close menu when clicking outside the user section
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const [notifPermission, setNotifPermission] = useState<string>("default");

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
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
            <h1 className="text-xl font-bold text-slate-800">Inbox</h1>
            <p className="text-xs text-slate-500">AI Agregator</p>
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
              Tools
            </h3>
          </div>
          <div className="space-y-1">
            <button
              onClick={handleContacts}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">Contacts</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-all">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Analiza Sentimente</span>
            </button>
            <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 p-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Cable className="w-4 h-4 " />
              Gestionează platformele
            </button>
            <button
                onClick={handleAiAssistant}
                className="w-full flex items-center gap-3 p-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Bot className="w-4 h-4 " />
              AI Assistant
            </button>

            <div className='border-t border-slate-200'></div>

            {/* Notification permission */}
            {notifPermission === "unavailable" ? null : notifPermission === "granted" ? (
              <div className="w-full flex items-center gap-3 p-3 rounded-lg text-green-600">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Notificări active</span>
                <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
              </div>
            ) : notifPermission === "denied" ? (
              <div className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-400">
                <BellOff className="w-4 h-4" />
                <span className="text-sm">Notificări blocate</span>
              </div>
            ) : (
              <button
                onClick={handleEnableNotifications}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">Activează notificările</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 relative" ref={menuRef}>

        <div className="w-full flex items-center gap-3 rounded-lg p-2  text-left">
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
              className=" gap-3 px-4 py-3 text-sm text-red-600 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
