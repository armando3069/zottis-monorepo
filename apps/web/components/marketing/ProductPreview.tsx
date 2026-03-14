import { MessageSquare, Users, Zap, BarChart3 } from "lucide-react";

const HIGHLIGHTS = [
  { icon: MessageSquare, text: "See every conversation across channels" },
  { icon: Users,         text: "Manage leads and contacts in one place" },
  { icon: Zap,           text: "Respond faster with AI-powered suggestions" },
  { icon: BarChart3,     text: "Automate classification and sentiment tracking" },
];

export function ProductPreview() {
  return (
    <section id="product" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="flex justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Product
          </span>
        </div>
        <h2 className="mt-4 text-center text-[28px] font-semibold leading-tight tracking-tight text-gray-900 sm:text-[34px]">
          Your AI-powered command center
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-[15px] leading-relaxed text-gray-500">
          A unified workspace designed for speed, clarity and intelligent automation.
        </p>

        {/* Product screen mockup */}
        <div className="mt-12 sm:mt-14">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              <div className="ml-3 flex-1">
                <div className="mx-auto h-5 w-48 rounded-md bg-gray-100" />
              </div>
            </div>

            {/* Dashboard wireframe */}
            <div className="flex min-h-[320px] sm:min-h-[380px]">
              {/* Sidebar */}
              <div className="hidden w-14 shrink-0 border-r border-gray-200 bg-[#F7F6F3] sm:block">
                <div className="flex flex-col items-center gap-3 pt-5">
                  <div className="h-6 w-6 rounded-lg bg-gray-900 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-5 w-5 rounded-md ${i === 1 ? "bg-gray-300" : "bg-gray-200/80"}`} />
                  ))}
                </div>
              </div>

              {/* Main content area — contacts/table style */}
              <div className="flex-1 p-4 sm:p-5">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-24 rounded bg-gray-300" />
                    <div className="mt-2 h-3 w-16 rounded bg-gray-200" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-16 rounded-lg border border-gray-200 bg-white" />
                    <div className="h-8 w-20 rounded-lg bg-gray-900" />
                  </div>
                </div>

                {/* Search */}
                <div className="mt-4 h-9 w-48 rounded-lg border border-gray-200 bg-white" />

                {/* Table header */}
                <div className="mt-4 flex gap-4 border-b border-gray-200 pb-2">
                  {["Name", "Platform", "Lifecycle"].map((h) => (
                    <div key={h} className="h-2.5 flex-1 rounded bg-gray-200" />
                  ))}
                  {["Email", "Added"].map((h) => (
                    <div key={h} className="hidden h-2.5 flex-1 rounded bg-gray-200 sm:block" />
                  ))}
                </div>

                {/* Table rows */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-gray-100 py-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-7 w-7 rounded-full bg-gray-200" />
                      <div className="h-3 w-20 rounded bg-gray-200" />
                    </div>
                    <div className="flex-1">
                      <div className={`h-5 w-16 rounded-full ${i % 3 === 0 ? "bg-sky-100" : i % 3 === 1 ? "bg-emerald-100" : "bg-orange-100"}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`h-5 w-18 rounded-full ${i % 2 === 0 ? "bg-violet-100" : "bg-amber-100"}`} />
                    </div>
                    <div className="hidden flex-1 sm:block">
                      <div className="h-3 w-28 rounded bg-gray-100" />
                    </div>
                    <div className="hidden flex-1 sm:block">
                      <div className="h-3 w-16 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} />
              <span className="text-[13px] leading-snug text-gray-600">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
