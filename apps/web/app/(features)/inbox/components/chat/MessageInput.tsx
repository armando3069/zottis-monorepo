"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Paperclip, Smile, Send, Zap, Tag } from "lucide-react";
import { SuggestionsPanel } from "./SuggestionsPanel";

// Lazy-load to avoid SSR issues (emoji-mart accesses `window` at import time)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Picker = dynamic(() => import("@emoji-mart/react"), { ssr: false }) as any;

interface EmojiSelection {
  native: string;
}

interface MessageInputProps {
  value: string;
  suggestions: string[];
  isLoadingSuggestions: boolean;
  /** Controlled by parent — true when the suggestions panel is open */
  isSuggestionsOpen: boolean;
  onValueChange: (value: string) => void;
  /** Open panel + fetch (if closed) OR close panel (if open) */
  onToggleSuggestions: () => void;
  /** Close the panel only — used by the click-outside handler */
  onCloseSuggestions: () => void;
  onSend: () => void;
}

export function MessageInput({
  value,
  suggestions,
  isLoadingSuggestions,
  isSuggestionsOpen,
  onValueChange,
  onToggleSuggestions,
  onCloseSuggestions,
  onSend,
}: MessageInputProps) {
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close suggestions (and emoji picker) when clicking outside the composer
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onCloseSuggestions();
        setIsEmojiOpen(false);
        return;
      }
      if (
        isEmojiOpen &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isEmojiOpen, onCloseSuggestions]);

  // Insert the selected emoji at the current cursor position
  const handleEmojiSelect = (emoji: EmojiSelection) => {
    const textarea = textareaRef.current;
    const char = emoji.native;

    if (!textarea) {
      onValueChange(value + char);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + char + value.slice(end);
    onValueChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const pos = start + char.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div ref={wrapperRef} className="px-5 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
      {/* Suggestions panel — smooth collapse/expand */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isSuggestionsOpen ? "max-h-56 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <SuggestionsPanel
          suggestions={suggestions}
          isLoading={isLoadingSuggestions}
          onSelect={(s) => {
            onValueChange(s);
            // Keep panel open so the agent can pick another or edit
          }}
        />
      </div>

      <div className="flex items-end gap-2">
        <button className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-120 ease-out flex-shrink-0">
          <Paperclip className="w-[18px] h-[18px]" />
        </button>

        {/* Textarea + emoji button share a relative container */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Scrie un mesaj..."
            className="w-full min-h-[44px] p-3 pr-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/8 focus:border-[var(--text-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-[14px] leading-relaxed transition-all duration-120 ease-out"
            rows={2}
          />

          {/* Emoji toggle button */}
          <button
            className={`absolute right-3 bottom-3 p-1 rounded-lg transition-all duration-120 ease-out ${
              isEmojiOpen ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
            onClick={() => setIsEmojiOpen((prev) => !prev)}
          >
            <Smile className="w-[18px] h-[18px]" />
          </button>

          {/* Emoji picker popover — appears above the composer, right-aligned */}
          {isEmojiOpen && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full right-0 mb-2 z-50 shadow-[var(--shadow-dropdown)] rounded-xl overflow-hidden"
            >
              <Picker
                data={async () => {
                  const { default: d } = await import("@emoji-mart/data");
                  return d;
                }}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
          )}
        </div>

        <button
          className="p-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-xl transition-all duration-120 ease-out active:scale-[0.96] shadow-[var(--shadow-xs)] flex-shrink-0"
          onClick={onSend}
        >
          <Send className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2.5 px-0.5">
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">

          {/* "Sugestii AI" toggle button — active state shows dark chip */}
          <button
            onClick={onToggleSuggestions}
            className={`flex items-center gap-1 transition-all duration-120 ease-out rounded-md px-2 py-1 ${
              isSuggestionsOpen
                ? "text-[var(--text-primary)] bg-[var(--bg-surface-hover)] font-medium"
                : "hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <Zap className={`w-3 h-3 ${isSuggestionsOpen ? "fill-[var(--text-primary)]" : ""}`} />
            Sugestii AI
          </button>

          <button className="flex items-center gap-1 transition-all duration-120 ease-out rounded-md px-2 py-1 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
            <Tag className="w-3 h-3" />
            Auto-clasificare
          </button>
        </div>
      </div>
    </div>
  );
}
