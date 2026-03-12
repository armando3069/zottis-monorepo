"use client";

import { useRef, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { ALL_LANGS, PINNED_LANG_CODES, findLangByCode, type Lang } from "@/lib/languages";

const PINNED_CODES = PINNED_LANG_CODES;
const STORAGE_KEY  = "recentTranslateLangs";

function getRecentCodes(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function saveRecentCode(code: string): void {
  const next = [code, ...getRecentCodes().filter((c) => c !== code)].slice(0, 6);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

const byCode = findLangByCode;

// ── Component ─────────────────────────────────────────────────────────────────

interface TranslatePopoverProps {
  onSelect: (code: string, name: string) => void;
  onClose: () => void;
}

export function TranslatePopover({ onSelect, onClose }: TranslatePopoverProps) {
  const [query, setQuery]       = useState("");
  const [recentCodes]           = useState<string[]>(getRecentCodes);
  const containerRef            = useRef<HTMLDivElement>(null);
  const searchRef               = useRef<HTMLInputElement>(null);

  // Auto-focus search on mount; close on Escape
  useEffect(() => {
    searchRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSelect = (lang: Lang) => {
    saveRecentCode(lang.code);
    onSelect(lang.code, lang.name);
    onClose();
  };

  // Build sections
  const pinnedSet  = new Set(PINNED_CODES);
  const recentSet  = new Set([...PINNED_CODES, ...recentCodes]);
  const recentList = [...PINNED_CODES, ...recentCodes.filter((c) => !pinnedSet.has(c))]
    .map(byCode)
    .filter(Boolean) as Lang[];

  const otherList  = ALL_LANGS.filter((l) => !recentSet.has(l.code));

  const q = query.toLowerCase().trim();
  const filtered = q
    ? ALL_LANGS.filter((l) => l.name.toLowerCase().includes(q) || l.code.includes(q))
    : null;

  const LangRow = ({ lang }: { lang: Lang }) => (
    <button
      key={lang.code}
      onClick={() => handleSelect(lang)}
      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] rounded-[var(--radius-badge)] transition-colors text-left"
    >
      <span className="text-base w-6 text-center">{lang.flag}</span>
      <span>{lang.name}</span>
    </button>
  );

  return (
    <div
      ref={containerRef}
      className="w-56 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-button)] shadow-[var(--shadow-dropdown)] overflow-hidden"
    >
      {/* Search */}
      <div className="p-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-surface-hover)] rounded-[var(--radius-badge)]">
          <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută limbă..."
            className="flex-1 bg-transparent text-[12px] outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
        </div>
      </div>

      {/* Language list */}
      <div className="overflow-y-auto max-h-60 p-1">
        {filtered ? (
          filtered.length > 0 ? (
            filtered.map((l) => <LangRow key={l.code} lang={l} />)
          ) : (
            <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">Nicio limbă găsită</p>
          )
        ) : (
          <>
            <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Recente
            </p>
            {recentList.map((l) => <LangRow key={l.code} lang={l} />)}

            {otherList.length > 0 && (
              <>
                <div className="my-1 border-t border-[var(--border-subtle)]" />
                <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Toate limbile
                </p>
                {otherList.map((l) => <LangRow key={l.code} lang={l} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
