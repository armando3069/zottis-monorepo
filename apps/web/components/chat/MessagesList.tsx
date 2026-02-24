import type { Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  avatar: string;
}

export function MessagesList({ messages, isLoading, avatar }: MessagesListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-4">
        {isLoading && (
          <div className="text-xs text-slate-500 text-center">Se încarcă mesajele...</div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-xs text-slate-500 text-center">Nu există mesaje încă.</div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} avatar={avatar} />
        ))}
      </div>
    </div>
  );
}