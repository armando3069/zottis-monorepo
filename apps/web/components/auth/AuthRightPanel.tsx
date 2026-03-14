import { MessageSquare, Zap, ShieldCheck, Globe } from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "All channels unified",
    desc: "Telegram, WhatsApp, Email — one elegant inbox.",
  },
  {
    icon: Zap,
    title: "AI-powered replies",
    desc: "Smart suggestions that match your tone and context.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    desc: "End-to-end encryption with enterprise-grade privacy.",
  },
  {
    icon: Globe,
    title: "Multi-language support",
    desc: "Auto-translate conversations in real time.",
  },
];

export function AuthRightPanel() {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#F7F6F3]">

      {/* ── Grid background ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Radial vignette — fades grid at edges ───────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(247,246,243,0.85) 100%)",
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 py-16">
        <div className="w-full max-w-[400px]">

          {/* Live badge */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 border border-[#E7E3DC] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[12px] font-medium text-[#6B7280] tracking-tight">
                AI Inbox — live in production
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-10">
            <h2 className="text-[30px] font-semibold text-[#111827] tracking-[-0.02em] leading-[1.2] mb-3">
              All your conversations,
              <br />
              <span className="text-[#6B7280] font-normal">one smart inbox.</span>
            </h2>
            <p className="text-[14px] text-[#9CA3AF] leading-relaxed max-w-[300px] mx-auto">
              Manage every channel and let AI help you respond faster and smarter.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-2.5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-center gap-3.5 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-[#E7E3DC] shadow-[0_1px_3px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.015)] transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F7F6F3] border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-[15px] h-[15px] text-[#374151]" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#111827] leading-tight">{title}</p>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5 leading-tight">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom tagline */}
          <p className="mt-10 text-center text-[11px] text-[#C4C0BA] tracking-wide uppercase font-medium">
            Trusted by growing teams worldwide
          </p>
        </div>
      </div>
    </div>
  );
}
