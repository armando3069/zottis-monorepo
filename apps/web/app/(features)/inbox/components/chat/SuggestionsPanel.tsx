import { Zap } from "lucide-react";

interface SuggestionsPanelProps {
  suggestions: string[];
  isLoading?: boolean;
  onSelect: (suggestion: string) => void;
}

export function SuggestionsPanel({ suggestions, isLoading, onSelect }: SuggestionsPanelProps) {
  return (
    <div className="mb-3 p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-default)]">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        <span className="text-[12px] font-medium text-[var(--text-primary)]">Răspunsuri Sugerate</span>
        {isLoading && (
          <span className="text-[11px] text-[var(--text-tertiary)] ml-auto animate-pulse">Se generează...</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {isLoading
          ? [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 bg-[var(--bg-surface-hover)] rounded-lg animate-pulse"
              />
            ))
          : suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(suggestion)}
                className="text-left p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] rounded-lg text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all duration-120 ease-out leading-relaxed"
              >
                {suggestion}
              </button>
            ))}
      </div>
    </div>
  );
}
