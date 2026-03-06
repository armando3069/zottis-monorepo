"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { buildChannels } from "@/lib/chatUtils";
import { sendReply, subscribeToNewMessage, getSuggestedReplies, updateContactInfo } from "@/services/api/api";
import type { ContactInfoPatch } from "@/services/api/api";
import { notifyNewMessage } from "@/lib/notify";
import type { ConversationViewModel, Message } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { ConversationList } from "./ConversationList";
import { ChatArea } from "./ChatArea";

export function ChatLayout() {
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<ConversationViewModel | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const { conversations, setConversations, isLoading: isLoadingConversations } = useConversations();

  // Auto-select a conversation passed via sessionStorage (e.g. from /contacts page)
  useEffect(() => {
    if (!conversations.length) return;
    const pending = sessionStorage.getItem("pendingConvId");
    if (!pending) return;
    sessionStorage.removeItem("pendingConvId");
    const conv = conversations.find((c) => c.id === Number(pending));
    if (conv) setSelectedConversation(conv);
  }, [conversations]);

  // ── Suggested replies ────────────────────────────────────────────────────

  const refreshSuggestions = useCallback(async (convId: number) => {
    setIsLoadingSuggestions(true);
    try {
      const { suggestions: s } = await getSuggestedReplies(convId);
      setSuggestions(s);
    } catch {
      // silently ignore — suggestions panel keeps previous data
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Stable ref so handlePreviewUpdate can access it without re-creating
  const refreshSuggestionsRef = useRef(refreshSuggestions);
  useEffect(() => { refreshSuggestionsRef.current = refreshSuggestions; });

  // Refresh when selected conversation changes
  useEffect(() => {
    if (!selectedConversation) {
      setSuggestions([]);
      return;
    }
    refreshSuggestions(selectedConversation.id);
  }, [selectedConversation?.id, refreshSuggestions]);

  // ── Conversation list preview update ────────────────────────────────────

  // Stable callback: updates a conversation's preview in the list when a message arrives.
  // Also refreshes suggestions if the message belongs to the selected conversation.
  const selectedConvRef = useRef(selectedConversation);
  useEffect(() => { selectedConvRef.current = selectedConversation; });

  const handlePreviewUpdate = useCallback(
    (conversationId: number, lastMessage: string, time: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, lastMessage, time } : c))
      );
      // Refresh suggestions when a new message arrives in the active conversation
      if (selectedConvRef.current?.id === conversationId) {
        refreshSuggestionsRef.current(conversationId);
      }
    },
    [setConversations]
  );

  const { messages, isLoading: isLoadingMessages } = useMessages({
    selectedConversation,
    onPreviewUpdate: handlePreviewUpdate,
  });

  // ── Global real-time subscription ────────────────────────────────────────

  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; });

  // Notify for client messages in conversations OTHER than the selected one
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
    });
    return () => { unsub(); };
  }, []);

  // ── Channels & filtering ─────────────────────────────────────────────────

  const channels = buildChannels(conversations);

  const filteredConversations = conversations.filter((conv) => {
    if (selectedChannel === "all") return true;
    return conv.platform === selectedChannel;
  });

  // ── Contact info / lifecycle update ──────────────────────────────────────

  const handleUpdateConversation = useCallback(
    async (id: number, patch: ContactInfoPatch) => {
      const updated = await updateContactInfo(id, patch);
      // Merge returned fields into local state
      const merge = (conv: typeof selectedConversation) => {
        if (!conv || conv.id !== id) return conv;
        return {
          ...conv,
          lifecycleStatus: (updated as Record<string, unknown>).lifecycle_status as string ?? conv.lifecycleStatus,
          contactEmail:    (updated as Record<string, unknown>).contact_email    as string | null ?? conv.contactEmail,
          contactPhone:    (updated as Record<string, unknown>).contact_phone    as string | null ?? conv.contactPhone,
          contactCountry:  (updated as Record<string, unknown>).contact_country  as string | null ?? conv.contactCountry,
          contactLanguage: (updated as Record<string, unknown>).contact_language as string | null ?? conv.contactLanguage,
        };
      };
      setSelectedConversation((prev) => merge(prev));
      setConversations((prev) => prev.map((c) => (c.id === id ? (merge(c) ?? c) : c)));
    },
    [setConversations],
  );

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    const text = messageInput.trim();
    setMessageInput("");
    try {
      await sendReply(selectedConversation.id, text, selectedConversation.platform);
      // The sent message is received via the "newMessage" subscription in useMessages.
    } catch (e) {
      console.error("sendReply error", e);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar
        channels={channels}
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
      />
      <ConversationList
        conversations={filteredConversations}
        selectedConversation={selectedConversation}
        isLoading={isLoadingConversations}
        onSelectConversation={setSelectedConversation}
      />
      <ChatArea
        conversation={selectedConversation}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        messageInput={messageInput}
        suggestions={suggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        onMessageInputChange={setMessageInput}
        onRefreshSuggestions={() => {
          if (selectedConversation) refreshSuggestions(selectedConversation.id);
        }}
        onUpdateConversation={handleUpdateConversation}
        onSend={handleSend}
      />
    </div>
  );
}
