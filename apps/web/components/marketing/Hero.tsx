import Link from "next/link";
import { Apple } from "lucide-react";

/* ─── Fake product UI mockup ─────────────────────────────────────────────── */

function InboxMockup() {
  const conversations = [
    { name: "Elena Popescu",   msg: "Da, suntem interesați de ofertă…",   platform: "whatsapp", time: "2m",  unread: true },
    { name: "Andrei Marin",    msg: "Am trimis documentele solicitate.",   platform: "email",    time: "8m",  unread: true },
    { name: "Maria Ionescu",   msg: "Bună! Pot programa o întâlnire?",    platform: "telegram", time: "14m", unread: false },
    { name: "Tech Solutions",   msg: "Factura #1247 a fost emisă.",        platform: "email",    time: "1h",  unread: false },
    { name: "Alex Dumitrescu", msg: "Mulțumim pentru răspunsul rapid!",    platform: "whatsapp", time: "2h",  unread: false },
  ];

  const platformDot: Record<string, string> = {
    telegram: "bg-sky-400",
    whatsapp: "bg-emerald-500",
    email:    "bg-orange-400",
  };

  return (
    <div className="relative mx-auto w-full max-w-[820px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex min-h-[340px] sm:min-h-[420px] lg:min-h-[460px]">

        {/* Sidebar */}
        <div className="hidden w-[52px] shrink-0 border-r border-gray-100 bg-[#F7F6F3] sm:flex sm:flex-col sm:items-center sm:pt-4 sm:gap-4">
          <div className="h-6 w-6 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-5 w-5 rounded-md ${i === 1 ? "bg-gray-300" : "bg-gray-200"}`} />
          ))}
          <div className="mt-auto mb-4">
            <div className="h-6 w-6 rounded-full bg-gray-300" />
          </div>
        </div>

        {/* Conversation list — hidden on mobile, shown on sm+ */}
        <div className="hidden w-[240px] shrink-0 border-r border-gray-100 sm:block sm:w-[260px]">
          {/* Search */}
          <div className="border-b border-gray-100 p-3">
            <div className="flex h-8 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5">
              <div className="h-3 w-3 rounded-full border border-gray-300" />
              <span className="text-[11px] text-gray-400">Search…</span>
            </div>
          </div>
          {/* Conversation items */}
          <div className="flex flex-col">
            {conversations.map((c, i) => (
              <div
                key={c.name}
                className={`flex items-start gap-2.5 px-3 py-3 transition-colors ${
                  i === 0 ? "bg-gray-50" : "hover:bg-gray-50/60"
                } ${i < conversations.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-600">
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-white ${platformDot[c.platform]}`} />
                </div>
                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[12px] leading-tight ${c.unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                      {c.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">{c.time}</span>
                  </div>
                  <p className={`mt-0.5 truncate text-[11px] leading-snug ${c.unread ? "text-gray-700" : "text-gray-400"}`}>
                    {c.msg}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {/* Chat header */}
          <div className="flex h-[52px] items-center justify-between border-b border-gray-100 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-600">EP</div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900 leading-tight">Elena Popescu</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">WhatsApp · Online</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[1, 2].map((i) => (
                <div key={i} className="h-7 w-7 rounded-lg border border-gray-200 bg-gray-50" />
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-hidden px-4 py-4">
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl rounded-bl-md border border-gray-100 bg-gray-50 px-3.5 py-2">
                <p className="text-[12px] leading-relaxed text-gray-700">Bună ziua! Am văzut oferta pentru serviciul de integrare. Puteți trimite mai multe detalii?</p>
                <p className="mt-1 text-right text-[9px] text-gray-400">10:24</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[70%] rounded-2xl rounded-br-md bg-gray-900 px-3.5 py-2">
                <p className="text-[12px] leading-relaxed text-white">Sigur! Vă trimit prezentarea completă. Avem 3 planuri disponibile. 📋</p>
                <p className="mt-1 text-right text-[9px] text-gray-400">10:26</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl rounded-bl-md border border-gray-100 bg-gray-50 px-3.5 py-2">
                <p className="text-[12px] leading-relaxed text-gray-700">Da, suntem interesați de ofertă. Când putem programa un demo?</p>
                <p className="mt-1 text-right text-[9px] text-gray-400">10:28</p>
              </div>
            </div>
            {/* AI suggestion */}
            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-blue-500">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-600">AI Suggestion</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-blue-700/80">Putem programa un demo mâine la 14:00 sau joi la 10:00. Ce preferați?</p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="flex-1 text-[12px] text-gray-400">Scrie un mesaj…</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero section ───────────────────────────────────────────────────────── */

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-gray-50/30 to-gray-50" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] font-medium text-gray-600 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Now supporting Telegram, WhatsApp &amp; Email
          </div>
        </div>

        {/* Headline */}
        <h1 className="mx-auto mt-6 max-w-3xl text-center text-[40px] font-semibold leading-[1.1] tracking-tight text-gray-900 sm:text-[52px] lg:text-[60px]">
          One inbox for all your
          <br className="hidden sm:block" />
          {" "}customer conversations
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-5 max-w-xl text-center text-[16px] leading-relaxed text-gray-500 sm:text-[17px]">
          AI Inbox brings Telegram, WhatsApp and Email into a single
          intelligent workspace — powered by AI that understands your business.
        </p>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/signup"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gray-900 px-6 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.98]"
          >
            Get Started
          </Link>
          <a
            href="#download"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-[14px] font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            <Apple className="h-4 w-4" />
            Download for macOS
          </a>
        </div>

        {/* Product mockup */}
        <div className="mt-14 sm:mt-16 lg:mt-20">
          <InboxMockup />
        </div>
      </div>
    </section>
  );
}
