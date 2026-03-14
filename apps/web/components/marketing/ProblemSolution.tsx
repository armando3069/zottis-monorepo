import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

const PROBLEMS = [
  "Conversations scattered across Telegram, WhatsApp, and email",
  "Hot leads slipping through the cracks",
  "Slow response times costing you deals",
  "No visibility into customer sentiment or intent",
];

const SOLUTIONS = [
  "Every channel unified in a single timeline",
  "AI-powered lead detection and classification",
  "Automated responses trained on your knowledge base",
  "Real-time sentiment analysis on every message",
];

export function ProblemSolution() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section label */}
        <div className="flex justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Why AI Inbox
          </span>
        </div>
        <h2 className="mt-4 text-center text-[28px] font-semibold leading-tight tracking-tight text-gray-900 sm:text-[34px]">
          Stop juggling channels.
          <br className="hidden sm:block" />
          {" "}Start closing deals.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-[15px] leading-relaxed text-gray-500">
          Businesses lose revenue when customer messages are fragmented.
          AI&nbsp;Inbox brings everything together.
        </p>

        {/* Two-column comparison */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-14 md:grid-cols-[1fr_auto_1fr] md:gap-0">
          {/* Problems */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-6 sm:p-7">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Without AI Inbox
            </div>
            <ul className="mt-5 space-y-3.5">
              {PROBLEMS.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-gray-600">
                  <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Arrow divider */}
          <div className="hidden items-center justify-center px-6 md:flex">
            <ArrowRight className="h-5 w-5 text-gray-300" />
          </div>
          <div className="flex items-center justify-center py-2 md:hidden">
            <ArrowRight className="h-5 w-5 rotate-90 text-gray-300" />
          </div>

          {/* Solutions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-7">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              With AI Inbox
            </div>
            <ul className="mt-5 space-y-3.5">
              {SOLUTIONS.map((s) => (
                <li key={s} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
