import { Apple, Monitor } from "lucide-react";

export function MacDownload() {
  return (
    <section id="download" className="bg-gray-50/50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-12">
          {/* Desktop icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <Monitor className="h-6 w-6 text-gray-600" strokeWidth={1.5} />
          </div>

          <h2 className="mt-5 text-[24px] font-semibold tracking-tight text-gray-900 sm:text-[28px]">
            Work faster with the desktop app
          </h2>
          <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-gray-500">
            Native macOS experience. Lightning fast. Always accessible from your dock.
          </p>

          {/* Download button */}
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="#"
              className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl bg-gray-900 px-6 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.98]"
            >
              <Apple className="h-4 w-4" />
              Download for macOS
            </a>
            <span className="text-[12px] text-gray-400">Apple Silicon · macOS 13+</span>
          </div>

          {/* System details */}
          <div className="mt-6 flex items-center justify-center gap-4 text-[12px] text-gray-400">
            <span>v1.0.0</span>
            <span className="h-3 w-px bg-gray-200" />
            <span>~45 MB</span>
            <span className="h-3 w-px bg-gray-200" />
            <span>Free</span>
          </div>
        </div>
      </div>
    </section>
  );
}
