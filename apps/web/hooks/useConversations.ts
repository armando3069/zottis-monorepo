"use client";

import { useState, useEffect } from "react";
import { getConversations, subscribeToNewConversation } from "@/services/api/api";
import { mapConversationToViewModel } from "@/lib/chatUtils";
import type { ConversationViewModel } from "@/lib/types";

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    getConversations()
      .then((data) => {
        if (isCancelled) return;
        setConversations(data.map(mapConversationToViewModel));
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    const unsubscribe = subscribeToNewConversation((conv) => {
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [mapConversationToViewModel(conv), ...prev];
      });
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  return { conversations, setConversations, isLoading };
}