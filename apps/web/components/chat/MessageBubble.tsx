import { CheckCheck } from "lucide-react";
import type { Message } from "@/lib/types";
import { formatMessageTime } from "@/lib/chatUtils";

interface MessageBubbleProps {
  message: Message;
  avatar: string;
}

export function MessageBubble({ message, avatar }: MessageBubbleProps) {
  const isClient = message.sender_type === "client";
  const time = formatMessageTime(message.timestamp ?? message.created_at);

  return (
    <div className={`flex gap-3 ${isClient ? "" : "justify-end"}`}>
      {isClient && (
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full flex-shrink-0" />
      )}
      <div className="flex-1 max-w-lg">
        <div
          className={`p-4 rounded-2xl shadow-sm ${
            isClient
              ? "bg-white text-slate-800 rounded-tl-sm"
              : "bg-blue-600 text-white rounded-tr-sm ml-auto"
          }`}
        >
          <p>{message.text}</p>
        </div>
        <div
          className={`flex items-center gap-2 mt-1 text-xs text-slate-500 ${
            isClient ? "ml-2" : "mr-2 justify-end"
          }`}
        >
          {!isClient && <CheckCheck className="w-4 h-4 text-blue-500" />}
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}