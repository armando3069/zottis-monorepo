import { Star, Archive, MoreVertical, Zap } from "lucide-react";
import type { ConversationViewModel } from "@/lib/types";
import { PlatformIcon } from "./PlatformIcon";

interface ChatHeaderProps {
  conversation: ConversationViewModel;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={conversation.avatar}
            alt={conversation.contact}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-slate-800">{conversation.contact}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <PlatformIcon platform={conversation.platform} />
              <span>Via {conversation.platform}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>Activ acum</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Star className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Archive className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}