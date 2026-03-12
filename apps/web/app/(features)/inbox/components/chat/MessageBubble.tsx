"use client";

import { useState, useCallback } from "react";
import { CheckCheck, Languages } from "lucide-react";
import type { Message } from "@/lib/types";
import { formatMessageTime } from "@/lib/chatUtils";
import { aiAssistantService } from "@/services/ai-assistant/ai-assistant.service";
import { MessageActions } from "./MessageActions";

interface Translation {
  originalText: string;
  translatedText: string;
  targetLanguage: string;
}

interface MessageBubbleProps {
  message: Message;
  avatar: string;
  /** First message in a consecutive same-sender group — show avatar */
  isFirstInGroup: boolean;
  /** Last message in a consecutive same-sender group — show timestamp */
  isLastInGroup: boolean;
}

export function MessageBubble({ message, avatar, isFirstInGroup, isLastInGroup }: MessageBubbleProps) {
  const isClient = message.sender_type === "client";
  const time     = formatMessageTime(message.timestamp ?? message.created_at);

  const [translation,   setTranslation]   = useState<Translation | null>(null);
  const [showOriginal,  setShowOriginal]  = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const displayText = translation && !showOriginal
    ? translation.translatedText
    : (message.text ?? "");

  const handleTranslate = useCallback(async (langCode: string, langName: string) => {
    if (!message.text) return;
    if (translation?.targetLanguage === langName) {
      setShowOriginal(false);
      return;
    }
    setIsTranslating(true);
    try {
      const result = await aiAssistantService.translate({
        text: message.text,
        targetLanguage: langName,
        messageId: String(message.id),
      });
      setTranslation({
        originalText:   message.text,
        translatedText: result.translatedText,
        targetLanguage: langName,
      });
      setShowOriginal(false);
    } catch {
      /* silent — user can retry */
    } finally {
      setIsTranslating(false);
    }
  }, [message.id, message.text, translation]);

  // ── Spacing logic ────────────────────────────────────────────────────────
  // Between groups:  mt-5 (20px breathing room)
  // Within a group:  mt-1 (4px tight stacking)
  // First message:   mt-0
  const topMargin = isFirstInGroup ? "mt-5 first:mt-0" : "mt-1";

  return (
    <div className={`flex gap-2.5 group ${topMargin} ${isClient ? "" : "justify-end"}`}>
      {/* Avatar — only shown for client messages at the start of a group */}
      {isClient && (
        <div className="w-8 flex-shrink-0">
          {isFirstInGroup ? (
            <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-1 ring-black/[0.04]" />
          ) : null}
        </div>
      )}

      <div className={`flex-1 max-w-lg relative ${!isClient ? "flex flex-col items-end" : ""}`}>
        {/* Floating action bar (copy + translate) — visible on row hover */}
        <MessageActions
          text={message.text ?? ""}
          isTranslating={isTranslating}
          onTranslate={handleTranslate}
        />

        {/* Speech bubble */}
        <div
          className={`px-3.5 py-2.5 text-[14px] leading-relaxed ${
            isClient
              ? `bg-[var(--chat-incoming)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] border border-[var(--border-subtle)]
                 ${isFirstInGroup ? "rounded-2xl rounded-tl-md" : "rounded-2xl"}`
              : `bg-[var(--accent-primary)] text-white
                 ${isFirstInGroup ? "rounded-2xl rounded-tr-md" : "rounded-2xl"}`
          }`}
        >
          <p className={isTranslating ? "opacity-50" : ""}>
            {displayText}
          </p>
        </div>

        {/* Translation footer */}
        {translation && !isTranslating && (
          <div
            className={`mt-1 flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] ${
              isClient ? "ml-1" : "mr-1 justify-end"
            }`}
          >
            <Languages className="w-3 h-3" />
            <span>Tradus de AI · {translation.targetLanguage}</span>
            <span>·</span>
            <button
              onClick={() => setShowOriginal((p) => !p)}
              className="text-[var(--accent-blue)] hover:underline underline-offset-2 transition-colors duration-120"
            >
              {showOriginal ? "Afișează traducerea" : "Vezi originalul"}
            </button>
          </div>
        )}

        {/* Timestamp — only shown at the end of a group */}
        {isLastInGroup && (
          <div
            className={`flex items-center gap-1.5 mt-1 text-[10px] text-[var(--text-tertiary)]/70 ${
              isClient ? "ml-1" : "mr-1 justify-end"
            }`}
          >
            {!isClient && <CheckCheck className="w-3 h-3 text-emerald-400/80" />}
            <span className="tabular-nums">{time}</span>
          </div>
        )}
      </div>
    </div>
  );
}
