import type { EmailMeta } from "@/lib/types";
import { formatMessageTime } from "@/lib/chatUtils";

interface EmailMetaHeaderProps {
  meta: EmailMeta | undefined | null;
  isOutgoing: boolean;
  timestamp?: string;
}

export function EmailMetaHeader({ meta, isOutgoing, timestamp }: EmailMetaHeaderProps) {
  // Prefer the stored email date, fall back to message timestamp
  const displayTime = meta?.date
    ? formatMessageTime(meta.date)
    : formatMessageTime(timestamp);

  return (
    <div
      className={[
        "px-6 pt-5 pb-4 border-b border-[#F0EFEC]",
        isOutgoing ? "bg-[#F9F8F6]" : "bg-[var(--bg-surface)]",
      ].join(" ")}
    >
      {/* Subject — prominent */}
      {meta?.subject && (
        <p className="text-[15px] font-semibold text-[#111827] mb-3.5 leading-snug">
          {meta.subject}
        </p>
      )}

      {/* Meta rows */}
      <div className="space-y-1.5 text-[12px]">
        {meta?.from && (
          <MetaRow label={isOutgoing ? "From" : "From"} value={meta.from} emphasis />
        )}
        {meta?.to && (
          <MetaRow label="To" value={meta.to} />
        )}
        {meta?.cc && (
          <MetaRow label="CC" value={meta.cc} />
        )}
        <MetaRow label="Date" value={displayTime ?? ""} muted />
      </div>
    </div>
  );
}

// ── Meta row ─────────────────────────────────────────────────────────────────

function MetaRow({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="shrink-0 w-9 text-[#9CA3AF] font-medium">{label}</span>
      <span
        className={[
          "break-all leading-relaxed",
          emphasis ? "text-[#374151] font-medium" : "",
          muted ? "text-[#9CA3AF] tabular-nums" : "text-[#6B7280]",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
