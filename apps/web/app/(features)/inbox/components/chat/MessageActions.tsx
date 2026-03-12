"use client";

import { useRef, useState, useEffect } from "react";
import { Copy, Check, Languages, Loader2 } from "lucide-react";
import { TranslatePopover } from "./TranslatePopover";

interface MessageActionsProps {
  text: string;
  isTranslating: boolean;
  onTranslate: (langCode: string, langName: string) => void;
}

export function MessageActions({ text, isTranslating, onTranslate }: MessageActionsProps) {
  const [isCopied,         setIsCopied]         = useState(false);
  const [isTranslateOpen,  setIsTranslateOpen]  = useState(false);
  const translateBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef      = useRef<HTMLDivElement>(null);

  // Close translate popover on click outside (but not on the button or popover itself)
  useEffect(() => {
    if (!isTranslateOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        translateBtnRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) return;
      setIsTranslateOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isTranslateOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      /* clipboard API blocked in some contexts */
    }
  };

  const handleTranslateSelect = (code: string, name: string) => {
    setIsTranslateOpen(false);
    onTranslate(code, name);
  };

  return (
    // Absolute bar: sits just above the message bubble (bottom-full + mb-1).
    // It stays visible as long as the parent `group` is hovered.
    <div className="absolute right-0 bottom-full mb-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-120 ease-out">
      {/* Action chips */}
      <div className="flex items-center gap-0.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-[var(--shadow-sm)] p-0.5">
        {/* Copy */}
        <button
          onClick={handleCopy}
          title="Copiază"
          className="p-1.5 rounded-md hover:bg-[var(--bg-surface-hover)] transition-all duration-120 ease-out text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          {isCopied
            ? <Check className="w-3.5 h-3.5 text-emerald-500" />
            : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Translate */}
        <button
          ref={translateBtnRef}
          onClick={() => setIsTranslateOpen((p) => !p)}
          title="Traduce"
          className={`p-1.5 rounded-md transition-all duration-120 ease-out ${
            isTranslateOpen || isTranslating
              ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
              : "hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {isTranslating
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Languages className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Translate popover — anchored below the action bar (top-full) */}
      {isTranslateOpen && (
        <div ref={popoverRef} className="absolute right-0 top-full mt-1 z-30">
          <TranslatePopover
            onSelect={handleTranslateSelect}
            onClose={() => setIsTranslateOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
