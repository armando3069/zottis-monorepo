import { MessageSquare, Slack, Users, Phone, Mail } from "lucide-react";
import type { Channel, ConversationViewModel } from "./types";

export function mapConversationToViewModel(raw: any): ConversationViewModel {
  const name =
    raw.contact_name ||
    raw.contact_username ||
    `Chat ${raw.external_chat_id}`;
  const seed = encodeURIComponent(name || raw.external_chat_id);

  return {
    id: raw.id,
    contact: name,
    platform: raw.platform || "telegram",
    lastMessage: "Deschide conversația pentru a vedea mesajele",
    time: new Date(raw.created_at).toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    unread: 0,
    sentiment: "neutral",
    category: "suport",
    entities: [],
    avatar:
      raw.contact_avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`,
  };
}

export function formatMessageTime(timestamp: string | undefined): string {
  return new Date(timestamp || "").toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getSentimentColor(sentiment: string): string {
  const colors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    negative: "bg-orange-100 text-orange-700 border-orange-200",
    positive: "bg-green-100 text-green-700 border-green-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return colors[sentiment] ?? colors.neutral;
}

export function getSentimentLabel(sentiment: string): string {
  const labels: Record<string, string> = {
    urgent: "🔥 Urgent",
    negative: "⚠️ Negativ",
    positive: "✓ Pozitiv",
    neutral: "Neutral",
  };
  return labels[sentiment] ?? "Neutral";
}

export function buildChannels(conversationCount: number): Channel[] {
  return [
    {
      id: "all",
      name: "Toate Mesajele",
      icon: MessageSquare,
      count: conversationCount,
      color: "text-blue-500",
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: Phone,
      count: conversationCount,
      color: "text-green-500",
    },
    { id: "slack", name: "Slack", icon: Slack, count: 0, color: "text-purple-500" },
    { id: "teams", name: "Teams", icon: Users, count: 0, color: "text-indigo-500" },
    { id: "email", name: "Email", icon: Mail, count: 0, color: "text-red-500" },
  ];
}

export const SUGGESTIONS = [
  "Mulțumesc pentru informații! O să verific imediat.",
  "Confirm primirea documentului. Revin cu feedback în curând.",
  "Vă înțeleg urgența. Ne ocupăm imediat de problema dumneavoastră.",
  "Perfect! Vom finaliza până la deadline.",
];