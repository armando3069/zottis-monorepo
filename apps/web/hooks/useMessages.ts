"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, subscribeToNewMessage } from "@/services/api/api";
import { formatMessageTime } from "@/lib/chatUtils";
import type { ConversationViewModel, Message } from "@/lib/types";

interface UseMessagesOptions {
  selectedConversation: ConversationViewModel | null;
  /**
   * Called whenever a new message arrives or messages are loaded,
   * so the conversation list can update its preview (lastMessage + time).
   */
  onPreviewUpdate: (conversationId: number, lastMessage: string, time: string) => void;
}

export function useMessages({ selectedConversation, onPreviewUpdate }: UseMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Keep a stable ref to the callback so the effect doesn't need it as a dep.
  const onPreviewUpdateRef = useRef(onPreviewUpdate);
  useEffect(() => {
    onPreviewUpdateRef.current = onPreviewUpdate;
  });

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const conversationId = selectedConversation.id;
    let isCancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getMessages(conversationId);
        if (isCancelled) return;

        setMessages(data);

        if (data.length) {
          const last = data[data.length - 1];
          onPreviewUpdateRef.current(
            conversationId,
            last.text ?? "",
            formatMessageTime(last.timestamp ?? last.created_at)
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    load();

    const unsubscribe = subscribeToNewMessage((msg: Message) => {
      if (msg.conversation_id !== conversationId) return;

      setMessages((prev) => [...prev, msg]);
      onPreviewUpdateRef.current(
        conversationId,
        msg.text ?? "",
        formatMessageTime(msg.timestamp ?? msg.created_at)
      );
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [selectedConversation?.id]); // re-run only when the selected conversation changes

  return { messages, isLoading };
}