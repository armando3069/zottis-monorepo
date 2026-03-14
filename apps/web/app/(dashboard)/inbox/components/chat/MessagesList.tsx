"use client";

import { useMemo, useRef, useEffect } from "react";
import type { Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { EmailMessageCard } from "@/app/(dashboard)/inbox/components/email/EmailMessageCard";

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  avatar: string;
}

/** Two messages belong to the same visual group if they share sender_type
 *  and are within 2 minutes of each other. */
function withinGroupWindow(a: Message, b: Message): boolean {
  const ta = new Date(a.timestamp ?? a.created_at ?? 0).getTime();
  const tb = new Date(b.timestamp ?? b.created_at ?? 0).getTime();
  return Math.abs(tb - ta) < 2 * 60 * 1000; // 2 minutes
}

export function MessagesList({ messages, isLoading, avatar }: MessagesListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevConvIdRef = useRef<number | null>(null);

  /** For each message, compute whether it's the first / last in a
   *  consecutive same-sender group. This lets MessageBubble skip
   *  repeated avatars and collapse spacing. */
  const groupInfo = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = i > 0 ? messages[i - 1] : null;
      const next = i < messages.length - 1 ? messages[i + 1] : null;

      const sameSenderAsPrev =
        prev !== null &&
        prev.sender_type === msg.sender_type &&
        withinGroupWindow(prev, msg);

      const sameSenderAsNext =
        next !== null &&
        next.sender_type === msg.sender_type &&
        withinGroupWindow(msg, next);

      return {
        isFirstInGroup: !sameSenderAsPrev,
        isLastInGroup: !sameSenderAsNext,
      };
    });
  }, [messages]);

  // True when the thread is made up entirely of email messages
  const isEmailThread =
    messages.length > 0 && messages.every((m) => m.platform === "email");

  // ── Smart scroll ───────────────────────────────────────────────────────
  // 1) Conversation change → instant jump to bottom
  // 2) New message in same conversation → smooth scroll only if user is
  //    already near the bottom (won't interrupt reading older messages)
  const currentConvId = messages[0]?.conversation_id ?? null;

  useEffect(() => {
    if (isLoading || messages.length === 0) return;

    const isNewConversation = currentConvId !== prevConvIdRef.current;
    prevConvIdRef.current = currentConvId;

    if (isNewConversation) {
      // Opened a different conversation → jump instantly
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      });
      return;
    }

    // Same conversation, new message arrived → scroll only if near bottom
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < 150) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, isLoading, currentConvId]);

  return (
    <div
      ref={scrollContainerRef}
      className={[
        "flex-1 overflow-y-auto bg-[var(--bg-page)]",
        // Email threads get slightly tighter horizontal padding so the cards
        // feel document-like rather than chat-like
        isEmailThread ? "px-5 py-6" : "px-6 py-6",
      ].join(" ")}
    >
      <div
        className={[
          "max-w-3xl mx-auto",
          // Email threads use a vertical stack layout (space-y) instead of
          // the implicit margin approach used by MessageBubble
          isEmailThread ? "space-y-5" : "",
        ].join(" ")}
      >
        {isLoading && (
          <div className="text-[12px] text-[var(--text-tertiary)] text-center py-8">
            Se încarcă mesajele...
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-[12px] text-[var(--text-tertiary)] text-center py-8">
            Nu există mesaje încă.
          </div>
        )}

        {messages.map((msg, i) => {
          // ── Email platform → dedicated email card renderer ─────────────
          if (msg.platform === "email") {
            return (
              <EmailMessageCard
                key={msg.id}
                message={msg}
                index={i}
              />
            );
          }

          // ── All other platforms → standard chat bubble ─────────────────
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              avatar={avatar}
              isFirstInGroup={groupInfo[i].isFirstInGroup}
              isLastInGroup={groupInfo[i].isLastInGroup}
            />
          );
        })}

        {/* Invisible anchor at the bottom — scroll target */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
