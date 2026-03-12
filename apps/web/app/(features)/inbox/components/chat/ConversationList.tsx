import { ArchiveRestore } from "lucide-react";
import type { ConversationViewModel, Channel } from "@/lib/types";
import { ConversationItem } from "./ConversationItem";

// ── Category label map ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  all:    "Conversations",
  chats:  "Chats",
  emails: "Emails",
};

interface ConversationListProps {
  conversations: ConversationViewModel[];
  selectedConversation: ConversationViewModel | null;
  isLoading: boolean;
  conversationFilter: "all" | "unread" | "archived";
  channels: Channel[];
  inboxCategory: string;
  onSelectConversation: (conv: ConversationViewModel) => void;
  onFilterChange: (filter: "all" | "unread" | "archived") => void;
  onUnarchive: (id: number) => void;
}

export function ConversationList({
  conversations,
  selectedConversation,
  isLoading,
  conversationFilter,
  inboxCategory,
  onSelectConversation,
  onFilterChange,
  onUnarchive,
}: ConversationListProps) {
  const unreadCount = conversations.filter((c) => !c.isArchived && c.unread > 0).length;
  const title = CATEGORY_LABELS[inboxCategory] ?? "Conversations";

  return (
    <div className="w-80 border-r border-[var(--border-default)] flex flex-col bg-[var(--bg-surface)] flex-shrink-0 rounded-l-xl">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight mb-3">{title}</h2>

        {/* State filter chips: All / Unread / Archived */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onFilterChange("all")}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-120 ease-out ${
              conversationFilter === "all"
                ? "bg-[var(--accent-primary)] text-white shadow-[var(--shadow-xs)]"
                : "bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]"
            }`}
          >
            All
          </button>

          <button
            onClick={() => onFilterChange("unread")}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-120 ease-out flex items-center gap-1.5 ${
              conversationFilter === "unread"
                ? "bg-[var(--accent-primary)] text-white shadow-[var(--shadow-xs)]"
                : "bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]"
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                conversationFilter === "unread"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--accent-primary)] text-white"
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onFilterChange("archived")}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-120 ease-out ${
              conversationFilter === "archived"
                ? "bg-[var(--accent-primary)] text-white shadow-[var(--shadow-xs)]"
                : "bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]"
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-8 text-[12px] text-[var(--text-tertiary)] text-center">Loading...</div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="px-4 py-8 text-[12px] text-[var(--text-tertiary)] text-center">
            {conversationFilter === "archived"
              ? "No archived conversations."
              : conversationFilter === "unread"
              ? "No unread conversations."
              : "No conversations yet."}
          </div>
        )}

        {conversations.map((conv) =>
          conversationFilter === "archived" ? (
            /* Archived item — show with unarchive button on hover */
            <div key={conv.id} className="relative group">
              <ConversationItem
                conversation={conv}
                isSelected={selectedConversation?.id === conv.id}
                onSelect={onSelectConversation}
              />
              <button
                onClick={(e) => { e.stopPropagation(); onUnarchive(conv.id); }}
                title="Unarchive"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-120 p-1.5 rounded-md bg-[var(--bg-surface)] shadow-sm border border-[var(--border-default)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)]"
              >
                <ArchiveRestore className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedConversation?.id === conv.id}
              onSelect={onSelectConversation}
            />
          )
        )}
      </div>
    </div>
  );
}
