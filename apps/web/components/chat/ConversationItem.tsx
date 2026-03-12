import { Mail, Tag } from "lucide-react";
import type { ConversationViewModel } from "@/lib/types";
import { getSentimentColor, getSentimentLabel } from "@/lib/chatUtils";
import { getLifecycleStage } from "@/lib/lifecycle";
import { AvatarWithPlatformBadge } from "./AvatarWithPlatformBadge";
import { cleanEmailPlainText } from "@/components/email/EmailPlainTextView";

// ── Email preview cleaning ────────────────────────────────────────────────────

/** Produce a short, clean preview snippet from a raw email body string. */
function buildEmailPreview(rawText: string): string {
  // Strip any HTML tags that may have leaked into last_message_text
  const strippedHtml = rawText
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"');

  // Apply footer-cutting + URL removal from EmailPlainTextView
  const cleaned = cleanEmailPlainText(strippedHtml);

  // Collapse leftover multi-space runs and trim
  return cleaned.replace(/\s{2,}/g, " ").trim();
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ConversationItemProps {
  conversation: ConversationViewModel;
  isSelected: boolean;
  onSelect: (conv: ConversationViewModel) => void;
}

export function ConversationItem({ conversation: conv, isSelected, onSelect }: ConversationItemProps) {
  const isEmail = conv.platform === "email";

  // For email conversations, clean the noisy preview text
  const previewText = isEmail
    ? buildEmailPreview(conv.lastMessage)
    : conv.lastMessage;

  return (
    <div
      onClick={() => onSelect(conv)}
      className={`
        relative px-4 py-3 cursor-pointer transition-all duration-120 ease-out
        border-b border-[var(--border-subtle)]
        ${isSelected
          ? "bg-[var(--bg-surface-hover)]"
          : "hover:bg-[var(--bg-surface-hover)]/60"
        }
      `}
    >
      {/* Active indicator — left accent bar */}
      {isSelected && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[var(--accent-primary)]" />
      )}

      <div className="flex gap-3">
        <AvatarWithPlatformBadge
          name={conv.contact}
          avatar={conv.avatar}
          platform={conv.platform}
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3
              className={`text-[13px] truncate ${
                conv.unread > 0
                  ? "font-semibold text-[var(--text-primary)]"
                  : "font-medium text-[var(--text-primary)]"
              }`}
            >
              {conv.contact}
            </h3>
            <span
              className={`text-[11px] ml-2 flex-shrink-0 tabular-nums ${
                conv.unread > 0
                  ? "font-medium text-[var(--text-secondary)]"
                  : "text-[var(--text-tertiary)]"
              }`}
            >
              {conv.time}
            </span>
          </div>

          {/* Preview row — for email, show a subtle icon prefix */}
          <div
            className={`flex items-center gap-1 text-[12px] line-clamp-1 mb-1.5 leading-relaxed ${
              conv.unread > 0
                ? "text-[var(--text-primary)] font-medium"
                : "text-[var(--text-secondary)]"
            }`}
          >
            {isEmail && (
              <Mail className="h-3 w-3 shrink-0 text-[#9CA3AF]" />
            )}
            <span className="truncate">{previewText || "(no content)"}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-[var(--radius-badge)] border leading-none ${getSentimentColor(conv.sentiment)}`}
            >
              {getSentimentLabel(conv.sentiment)}
            </span>
            {(() => {
              const stage = getLifecycleStage(conv.lifecycleStatus);
              return (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-[var(--radius-badge)] border leading-none ${stage.badgeClass}`}
                >
                  {stage.emoji} {stage.label}
                </span>
              );
            })()}
            {conv.unread > 0 && (
              <span className="ml-auto text-[10px] min-w-[18px] text-center px-1.5 py-0.5 bg-[var(--accent-primary)] text-white rounded-full font-semibold leading-none tabular-nums">
                {conv.unread}
              </span>
            )}
          </div>

          {conv.entities.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
              <Tag className="w-3 h-3" />
              <span className="truncate">{conv.entities[0]}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
