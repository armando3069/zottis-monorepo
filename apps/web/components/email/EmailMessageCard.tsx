"use client";

import type { Message } from "@/lib/types";
import { EmailMetaHeader } from "./EmailMetaHeader";
import { EmailHtmlViewer } from "./EmailHtmlViewer";
import { EmailPlainTextView } from "./EmailPlainTextView";

interface EmailMessageCardProps {
  message: Message;
  /** Index in the thread — first email gets a slightly more prominent style */
  index?: number;
}

export function EmailMessageCard({ message, index = 0 }: EmailMessageCardProps) {
  const meta = message.attachments?.emailMeta;
  const isOutgoing = message.sender_type !== "client";
  const isFirst = index === 0;

  // `meta?.html` can arrive from Prisma as null, undefined, or a non-empty string
  const htmlBody: string | null =
    meta?.html && typeof meta.html === "string" && meta.html.trim().length > 0
      ? meta.html
      : null;

  const plainText: string =
    typeof message.text === "string" ? message.text : "";

  return (
    <div
      className={[
        "rounded-2xl border overflow-hidden transition-shadow duration-200",
        isOutgoing
          ? "border-[#E7E3DC] bg-[#FAFAF9] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          : "border-[#E7E3DC] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]",
        isFirst && !isOutgoing
          ? "shadow-[0_2px_8px_rgba(0,0,0,0.07)]"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Outgoing badge ── */}
      {isOutgoing && (
        <div className="px-6 pt-3 pb-0 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#111827] px-2.5 py-1 text-[10px] font-semibold text-white tracking-wide">
            ✉ Răspuns trimis
          </span>
        </div>
      )}

      {/* ── Email meta header: subject, from, to, cc, date ── */}
      <EmailMetaHeader
        meta={meta}
        isOutgoing={isOutgoing}
        timestamp={message.timestamp ?? message.created_at}
      />

      {/* ── Body ──────────────────────────────────────────────────────────────
          Priority: HTML → plain text → fallback label
          EmailHtmlViewer is client-only (DOMPurify); it renders null during
          SSR and injects the sanitised markup after hydration via useEffect.
          We always pass it when htmlBody is present so the client can render it,
          even if SSR shows nothing initially.                                  */}
      <div className="px-6 pb-6">
        {htmlBody ? (
          <EmailHtmlViewer html={htmlBody} />
        ) : plainText.trim() ? (
          <EmailPlainTextView text={plainText} />
        ) : (
          <p className="pt-5 text-[13px] text-[#9CA3AF] italic">(empty message)</p>
        )}
      </div>
    </div>
  );
}
