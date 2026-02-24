import { Filter } from "lucide-react";
import type { ConversationViewModel } from "@/lib/types";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
  conversations: ConversationViewModel[];
  selectedConversation: ConversationViewModel | null;
  isLoading: boolean;
  onSelectConversation: (conv: ConversationViewModel) => void;
}

export function ConversationList({
  conversations,
  selectedConversation,
  isLoading,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Conversații</h2>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Filter className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
            Toate
          </button>
          <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200">
            Urgent
          </button>
          <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200">
            Necitite
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 text-xs text-slate-500">Se încarcă...</div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="p-4 text-xs text-slate-500">Nu există conversații încă.</div>
        )}

        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isSelected={selectedConversation?.id === conv.id}
            onSelect={onSelectConversation}
          />
        ))}
      </div>
    </div>
  );
}