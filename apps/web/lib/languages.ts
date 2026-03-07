export interface Lang {
  code: string;
  name: string;
  flag: string;
}

export const ALL_LANGS: Lang[] = [
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

export const PINNED_LANG_CODES = ["ro", "en", "fr", "it", "ar"];

export function findLangByCode(code: string): Lang | undefined {
  return ALL_LANGS.find((l) => l.code === code);
}
