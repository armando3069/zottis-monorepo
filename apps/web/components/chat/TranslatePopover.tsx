"use client";

import { useRef, useState, useEffect } from "react";
import { Search } from "lucide-react";

// ── Language registry ─────────────────────────────────────────────────────────

interface Lang { code: string; name: string; flag: string }

const ALL_LANGS: Lang[] = [
  { code: "ro", name: "Română",     flag: "🇷🇴" },
  { code: "en", name: "English",    flag: "🇬🇧" },
  { code: "fr", name: "Français",   flag: "🇫🇷" },
  { code: "it", name: "Italiano",   flag: "🇮🇹" },
  { code: "ar", name: "العربية",    flag: "🇸🇦" },
  { code: "de", name: "Deutsch",    flag: "🇩🇪" },
  { code: "es", name: "Español",    flag: "🇪🇸" },
  { code: "pt", name: "Português",  flag: "🇵🇹" },
  { code: "ru", name: "Русский",    flag: "🇷🇺" },
  { code: "zh", name: "中文",        flag: "🇨🇳" },
  { code: "ja", name: "日本語",      flag: "🇯🇵" },
  { code: "ko", name: "한국어",      flag: "🇰🇷" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polski",     flag: "🇵🇱" },
  { code: "tr", name: "Türkçe",     flag: "🇹🇷" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "cs", name: "Čeština",    flag: "🇨🇿" },
  { code: "sv", name: "Svenska",    flag: "🇸🇪" },
  { code: "hu", name: "Magyar",     flag: "🇭🇺" },
  { code: "el", name: "Ελληνικά",   flag: "🇬🇷" },
  { code: "bg", name: "Български",  flag: "🇧🇬" },
  { code: "hr", name: "Hrvatski",   flag: "🇭🇷" },
];

const PINNED_CODES = ["ro", "en", "fr", "it", "ar"];
const STORAGE_KEY  = "recentTranslateLangs";

function getRecentCodes(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function saveRecentCode(code: string): void {
  const next = [code, ...getRecentCodes().filter((c) => c !== code)].slice(0, 6);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function byCode(code: string): Lang | undefined {
  return ALL_LANGS.find((l) => l.code === code);
}

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
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
    >
      <span className="text-base w-6 text-center">{lang.flag}</span>
      <span>{lang.name}</span>
    </button>
  );

  return (
    <div
      ref={containerRef}
      className="w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
    >
      {/* Search */}
      <div className="p-2 border-b border-slate-100">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută limbă..."
            className="flex-1 bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Language list */}
      <div className="overflow-y-auto max-h-60 p-1">
        {filtered ? (
          filtered.length > 0 ? (
            filtered.map((l) => <LangRow key={l.code} lang={l} />)
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">Nicio limbă găsită</p>
          )
        ) : (
          <>
            <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Recente
            </p>
            {recentList.map((l) => <LangRow key={l.code} lang={l} />)}

            {otherList.length > 0 && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
