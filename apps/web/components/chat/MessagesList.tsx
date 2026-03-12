"use client";

import { useMemo } from "react";
import type { Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { EmailMessageCard } from "@/components/email/EmailMessageCard";

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

  return (
    <div
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
      </div>
    </div>
  );
}
