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

      {/* Smart Insights */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-slate-800 mb-1">Insights Inteligente</h4>
            <div className="space-y-1">
              {conversation.entities.map((entity, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  <span>{entity}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-1 h-1 bg-blue-400 rounded-full" />
                <span>Sentiment: {conversation.sentiment}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}