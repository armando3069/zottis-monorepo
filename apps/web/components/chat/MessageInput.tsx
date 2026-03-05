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
  onValueChange: (value: string) => void;
  onRefreshSuggestions: () => void;
  onSend: () => void;
}

export function MessageInput({
  value,
  suggestions,
  isLoadingSuggestions,
  onValueChange,
  onRefreshSuggestions,
  onSend,
}: MessageInputProps) {
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close suggestions when clicking outside wrapper.
  // Close emoji picker when clicking outside the picker itself (but still inside wrapper).
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
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
  }, [isEmojiOpen]);

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

    // Restore focus and move cursor after the inserted emoji
    setTimeout(() => {
      textarea.focus();
      const pos = start + char.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleSuggestiiAi = () => {
    onRefreshSuggestions();
    setIsSuggestionsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="p-4 border-t border-slate-200 bg-white">
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
            // Keep panel open — agent can pick another or edit
          }}
        />
      </div>

      <div className="flex items-end gap-3">
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Paperclip className="w-5 h-5 text-slate-600" />
        </button>

        {/* Textarea + emoji button share a relative container */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={() => setIsSuggestionsOpen(true)}
            placeholder="Scrie un mesaj..."
            className="w-full p-3 pr-10 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />

          {/* Emoji toggle button */}
          <button
            className={`absolute right-3 bottom-3 p-1 rounded-lg transition-colors ${
              isEmojiOpen ? "bg-blue-100 text-blue-600" : "hover:bg-slate-100 text-slate-600"
            }`}
            onClick={() => setIsEmojiOpen((prev) => !prev)}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Emoji picker popover — appears above the composer, right-aligned */}
          {isEmojiOpen && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full right-0 mb-2 z-50 shadow-xl rounded-xl overflow-hidden"
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
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-200"
          onClick={onSend}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 px-2">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <button
            onClick={handleSuggestiiAi}
            className="hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Sugestii AI
          </button>
          <button className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Auto-clasificare
          </button>
        </div>
        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          Cmd + Enter pentru trimitere
        </button>
      </div>
    </div>
  );
}
