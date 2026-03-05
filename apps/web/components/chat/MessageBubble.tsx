"use client";

import { useState, useCallback } from "react";
import { CheckCheck, Languages } from "lucide-react";
import type { Message } from "@/lib/types";
import { formatMessageTime } from "@/lib/chatUtils";
import { translateMessage } from "@/services/api/api";
import { MessageActions } from "./MessageActions";

interface Translation {
  originalText: string;
  translatedText: string;
  targetLanguage: string;
}

interface MessageBubbleProps {
  message: Message;
  avatar: string;
}

export function MessageBubble({ message, avatar }: MessageBubbleProps) {
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
    // If already translated to same language, just toggle back
    if (translation?.targetLanguage === langName) {
      setShowOriginal(false);
      return;
    }
    setIsTranslating(true);
    try {
      const result = await translateMessage({
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

  return (
    // `group` enables CSS group-hover for the action bar inside MessageActions
    <div className={`flex gap-3 group ${isClient ? "" : "justify-end"}`}>
      {isClient && (
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
      )}

      <div className="flex-1 max-w-lg relative">
        {/* Floating action bar (copy + translate) — visible on row hover */}
        <MessageActions
          text={message.text ?? ""}
          isTranslating={isTranslating}
          onTranslate={handleTranslate}
        />

        {/* Speech bubble */}
        <div
          className={`p-4 rounded-2xl shadow-sm ${
            isClient
              ? "bg-white text-slate-800 rounded-tl-sm"
              : "bg-blue-600 text-white rounded-tr-sm ml-auto"
          }`}
        >
          <p className={isTranslating ? "opacity-50" : ""}>
            {displayText}
          </p>
        </div>

        {/* Translation footer */}
        {translation && !isTranslating && (
          <div
            className={`mt-1 flex items-center gap-1 text-xs text-slate-400 ${
              isClient ? "ml-1" : "mr-1 justify-end"
            }`}
          >
            <Languages className="w-3 h-3" />
            <span>Tradus de AI · {translation.targetLanguage}</span>
            <span>·</span>
            <button
              onClick={() => setShowOriginal((p) => !p)}
              className="text-blue-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
            >
              {showOriginal ? "Afișează traducerea" : "Vezi originalul"}
            </button>
          </div>
        )}

        {/* Timestamp */}
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
