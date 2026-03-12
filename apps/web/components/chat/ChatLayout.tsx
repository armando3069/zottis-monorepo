"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { buildChannels, formatMessageTime } from "@/lib/chatUtils";
import { messagesService } from "@/services/messages/messages.service";
import { conversationsService } from "@/services/conversations/conversations.service";
import { aiAssistantQueryKeys } from "@/services/ai-assistant/ai-assistant.service";
import { subscribeToNewMessage } from "@/services/ws/ws";
import type { ContactInfoPatch } from "@/services/conversations/conversations.types";
import { notifyNewMessage } from "@/lib/notify";
import type { ConversationViewModel, Message } from "@/lib/types";
import { ConversationList } from "./ConversationList";
import { ChatArea } from "./ChatArea";

const SUGGESTIONS_STALE_MS = 10 * 60 * 1000; // 10 minutes
const SUGGESTIONS_GC_MS   = 30 * 60 * 1000; // 30 minutes

/** Platforms that count as "chats" (non-email) */
const CHAT_PLATFORMS = new Set(["telegram", "whatsapp", "teams"]);

export function ChatLayout() {
  const searchParams = useSearchParams();

  // Category comes from the sidebar URL param: all | chats | emails
  const inboxCategory = searchParams.get("inboxCategory") ?? "all";

  const [conversationFilter, setConversationFilter] = useState<"all" | "unread" | "archived">("all");
  const [selectedConversation, setSelectedConversation] = useState<ConversationViewModel | null>(null);
  const [messageInput, setMessageInput] = useState("");

  // ── Suggestions toggle (lifted from MessageInput so it resets on conv change) ─
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const { conversations, setConversations, isLoading: isLoadingConversations } = useConversations();

  // Reset conversation filter to "all" whenever category changes
  useEffect(() => {
    setConversationFilter("all");
    setSelectedConversation(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxCategory]);

  // Auto-select a conversation passed via sessionStorage (e.g. from /contacts page)
  useEffect(() => {
    if (!conversations.length) return;
    const pending = sessionStorage.getItem("pendingConvId");
    if (!pending) return;
    sessionStorage.removeItem("pendingConvId");
    const conv = conversations.find((c) => c.id === Number(pending));
    if (conv) setSelectedConversation(conv);
  }, [conversations]);

  // Close suggestions panel when the user switches to a different conversation
  useEffect(() => {
    setIsSuggestionsOpen(false);
  }, [selectedConversation?.id]);

  // ── Conversation list preview update ────────────────────────────────────

  const handlePreviewUpdate = useCallback(
    (conversationId: number, lastMessage: string, time: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, lastMessage, time } : c))
      );
    },
    [setConversations],
  );

  const { messages, setMessages, isLoading: isLoadingMessages } = useMessages({
    selectedConversation,
    onPreviewUpdate: handlePreviewUpdate,
  });

  // ── Suggested replies (lazy / manual mode) ───────────────────────────────

  const lastMessageId = messages[messages.length - 1]?.id ?? 0;
  const conversationId = selectedConversation?.id ?? 0;

  const {
    data: suggestionsData,
    isFetching: isLoadingSuggestions,
    refetch: refetchSuggestions,
  } = useQuery({
    ...aiAssistantQueryKeys.suggestedReplies(conversationId, lastMessageId),
    enabled: false,
    staleTime: SUGGESTIONS_STALE_MS,
    gcTime: SUGGESTIONS_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const suggestions = suggestionsData?.suggestions ?? [];

  const handleToggleSuggestions = useCallback(() => {
    if (isSuggestionsOpen) {
      setIsSuggestionsOpen(false);
    } else {
      setIsSuggestionsOpen(true);
      refetchSuggestions();
    }
  }, [isSuggestionsOpen, refetchSuggestions]);

  const handleCloseSuggestions = useCallback(() => {
    setIsSuggestionsOpen(false);
  }, []);

  // ── Global real-time subscription ────────────────────────────────────────

  const selectedConvRef = useRef(selectedConversation);
  useEffect(() => { selectedConvRef.current = selectedConversation; });

  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; });

  useEffect(() => {
    const unsub = subscribeToNewMessage((msg: Message) => {
      if (msg.sender_type !== "client" || !msg.text) return;
      if (selectedConvRef.current?.id === msg.conversation_id) return;

      const conv = conversationsRef.current.find((c) => c.id === msg.conversation_id);
      if (conv) {
        notifyNewMessage({
          platform: conv.platform,
          contactName: conv.contact,
          textPreview: msg.text,
        });
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== msg.conversation_id) return c;
          return {
            ...c,
            lastMessage: msg.text ?? c.lastMessage,
            time: formatMessageTime(msg.timestamp ?? msg.created_at),
            unread: c.unread + 1,
            // Auto-unarchive when a client message arrives (mirrors backend logic)
            isArchived: false,
          };
        })
      );
    });
    return () => { unsub(); };
  }, [setConversations]);

  // ── Archive / Unarchive ───────────────────────────────────────────────────

  const handleArchive = useCallback(
    async (id: number) => {
      try {
        await conversationsService.archive(id);
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isArchived: true } : c))
        );
        // Deselect if the archived conversation was currently open
        setSelectedConversation((prev) => (prev?.id === id ? null : prev));
      } catch (e) {
        console.error("archive error", e);
      }
    },
    [setConversations],
  );

  const handleUnarchive = useCallback(
    async (id: number) => {
      try {
        await conversationsService.unarchive(id);
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isArchived: false } : c))
        );
      } catch (e) {
        console.error("unarchive error", e);
      }
    },
    [setConversations],
  );

  // ── Channels & filtering ─────────────────────────────────────────────────

  // Channel counts based on active (non-archived) conversations only
  const activeConversations = conversations.filter((c) => !c.isArchived);
  const channels = buildChannels(activeConversations);

  const filteredConversations = conversations.filter((conv) => {
    // ── Category filter (from sidebar) ──
    if (inboxCategory === "chats"  && !CHAT_PLATFORMS.has(conv.platform)) return false;
    if (inboxCategory === "emails" && conv.platform !== "email")           return false;

    // ── State filter (from top chips) ──
    if (conversationFilter === "archived") return conv.isArchived;
    if (conversationFilter === "unread")   return !conv.isArchived && conv.unread > 0;
    // "all" → show only active (non-archived) conversations
    return !conv.isArchived;
  });

  // ── Contact info / lifecycle update ──────────────────────────────────────

  const handleUpdateConversation = useCallback(
    async (id: number, patch: ContactInfoPatch) => {
      const updated = await conversationsService.updateContactInfo(id, patch);
      const merge = (conv: typeof selectedConversation) => {
        if (!conv || conv.id !== id) return conv;
        return {
          ...conv,
          lifecycleStatus: updated.lifecycle_status ?? conv.lifecycleStatus,
          contactEmail: updated.contact_email ?? conv.contactEmail,
          contactPhone: updated.contact_phone ?? conv.contactPhone,
          contactCountry: updated.contact_country ?? conv.contactCountry,
          contactLanguage: updated.contact_language ?? conv.contactLanguage,
        };
      };
      setSelectedConversation((prev) => merge(prev));
      setConversations((prev) => prev.map((c) => (c.id === id ? (merge(c) ?? c) : c)));
    },
    [setConversations],
  );

  // ── Mark selected conversation as read ───────────────────────────────────

  useEffect(() => {
    if (!selectedConversation) return;
    const conv = conversationsRef.current.find((c) => c.id === selectedConversation.id);
    if (!conv || conv.unread === 0) return;

    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c))
    );
    conversationsService.markAsRead(conv.id).catch((e) =>
      console.error("markAsRead error", e)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]);

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    const text = messageInput.trim();
    setMessageInput("");

    // ── Optimistic update: show message immediately before server confirms ──
    const now = new Date().toISOString();
    const optimisticId = -Date.now(); // negative so we can identify it later
    const optimisticMsg = {
      id: optimisticId,
      conversation_id: selectedConversation.id,
      sender_type: "bot" as const,
      text,
      platform: selectedConversation.platform,
      timestamp: now,
      created_at: now,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await messagesService.sendReply(
        selectedConversation.id,
        text,
        selectedConversation.platform,
      );
      // The real message will arrive via Socket.IO "newMessage" and replace
      // the optimistic one automatically (see useMessages deduplication logic)
    } catch (e) {
      console.error("sendReply error", e);
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden rounded-xl border border-[var(--border-default)] shadow-[var(--shadow-card)] bg-white">
      <ConversationList
        conversations={filteredConversations}
        selectedConversation={selectedConversation}
        isLoading={isLoadingConversations}
        conversationFilter={conversationFilter}
        channels={channels}
        inboxCategory={inboxCategory}
        onSelectConversation={setSelectedConversation}
        onFilterChange={setConversationFilter}
        onUnarchive={handleUnarchive}
      />
      <ChatArea
        conversation={selectedConversation}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        messageInput={messageInput}
        suggestions={suggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        isSuggestionsOpen={isSuggestionsOpen}
        onMessageInputChange={setMessageInput}
        onToggleSuggestions={handleToggleSuggestions}
        onCloseSuggestions={handleCloseSuggestions}
        onUpdateConversation={handleUpdateConversation}
        onArchive={handleArchive}
        onSend={handleSend}
      />
    </div>
  );
}
