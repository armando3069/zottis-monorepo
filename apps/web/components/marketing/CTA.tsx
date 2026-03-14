import Link from "next/link";
import { Apple } from "lucide-react";

export function CTA() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-gray-900 sm:text-[36px]">
            Bring all your conversations
            <br className="hidden sm:block" />
            {" "}into one inbox
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-gray-500">
            Start managing Telegram, WhatsApp and Email from a single AI-powered workspace. Free to get started.
          </p>

          {/* Buttons */}
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
        </div>
      </div>
    </section>
  );
}
