"use client";

import { useState } from "react";
import { Star, Archive, Pencil } from "lucide-react";
import type { ConversationViewModel } from "@/lib/types";
import type { ContactInfoPatch } from "@/services/conversations/conversations.types";
import { AvatarWithPlatformBadge } from "./AvatarWithPlatformBadge";
import { LifecycleDropdown } from "./LifecycleDropdown";
import { EditContactModal } from "./EditContactModal";

interface ChatHeaderProps {
  conversation: ConversationViewModel;
  onUpdateConversation: (id: number, patch: ContactInfoPatch) => Promise<void>;
  onArchive: (id: number) => void;
}

export function ChatHeader({ conversation, onUpdateConversation, onArchive }: ChatHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleLifecycleChange = (value: string) => {
    void onUpdateConversation(conversation.id, { lifecycleStatus: value });
  };

  const handleContactSave = (patch: ContactInfoPatch) =>
    onUpdateConversation(conversation.id, patch);

  return (
    <>
      <div className="px-5 py-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between gap-3">
          {/* Left — avatar + name + platform */}
          <div className="flex items-center gap-3 min-w-0">
            <AvatarWithPlatformBadge
              name={conversation.contact}
              avatar={conversation.avatar}
              platform={conversation.platform}
              size="md"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-[14px] text-[var(--text-primary)] truncate leading-tight">{conversation.contact}</h3>
              <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mt-0.5">
                <LifecycleDropdown
                    current={conversation.lifecycleStatus ?? "NEW_LEAD"}
                    onSelect={handleLifecycleChange}
                />
              </div>
            </div>
          </div>

          {/* Right — edit contact + star + archive */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => setIsEditOpen(true)}
              title="Edit Contact Info"
              className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-120 ease-out"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-120 ease-out">
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={() => onArchive(conversation.id)}
              title="Archive conversation"
              className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-[var(--text-tertiary)] hover:text-amber-600 transition-all duration-120 ease-out"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <EditContactModal
          conversation={conversation}
          onSave={handleContactSave}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </>
  );
}
