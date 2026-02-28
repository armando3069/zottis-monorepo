import { Tag } from "lucide-react";
import type { ConversationViewModel } from "@/lib/types";
import { getSentimentColor, getSentimentLabel } from "@/lib/chatUtils";
import { PlatformIcon } from "./PlatformIcon";

interface ConversationItemProps {
  conversation: ConversationViewModel;
  isSelected: boolean;
  onSelect: (conv: ConversationViewModel) => void;
}

export function ConversationItem({ conversation: conv, isSelected, onSelect }: ConversationItemProps) {
  return (
    <div
      onClick={() => onSelect(conv)}
      className={`p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${
        isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
    >
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          <img src={conv.avatar} alt={conv.contact} className="w-12 h-12 rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5  rounded-full flex items-center justify-center">
            <PlatformIcon platform={conv.platform} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-slate-800 text-sm truncate">{conv.contact}</h3>
            <span className="text-xs text-slate-500 ml-2">{conv.time}</span>
          </div>

          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{conv.lastMessage}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${getSentimentColor(conv.sentiment)}`}
            >
              {getSentimentLabel(conv.sentiment)}
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {conv.category}
            </span>
            {conv.unread > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full font-medium">
                {conv.unread}
              </span>
            )}
          </div>

          {conv.entities.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <Tag className="w-3 h-3" />
              <span className="truncate">{conv.entities[0]}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}